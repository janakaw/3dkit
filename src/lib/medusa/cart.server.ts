/**
 * Cart read/write logic against the Medusa Store API.
 *
 * Ported from 3dchairstore-storefront/src/lib/data/cart.ts, trimmed for
 * this being a digital-goods-only store (see the decisions doc,
 * "Resolved: no shipping address / shipping method needed for digital
 * goods"):
 *
 *   - `setAddresses` — NOT ported. There's no shipping/billing address to
 *     collect; `requires_shipping: false` on every product means
 *     `completeCartWorkflow` never needs one.
 *   - `setShippingMethod` — NOT ported, same reason (no shipping method
 *     exists to select for a cart with zero shippable items).
 *   - `enrichLineItems` — NOT ported (yet). The Next storefront used this
 *     to backfill `item.variant.product` for older API responses; Medusa
 *     v2's `sdk.store.cart.retrieve` already returns line items with
 *     `variant`/`product` populated by default. Revisit only if the cart
 *     UI turns out to be missing product/variant fields in practice.
 *   - `initiatePaymentSession` — belongs to the checkout/payment tier, not
 *     this one. Not ported here.
 *
 * Also dropped, same as regions.ts: Next's `revalidateTag` (no TanStack
 * Start equivalent — the client refetches via the router/query cache
 * instead) and `redirect()` (a Next Server Action can end a request with a
 * redirect; here the caller decides navigation after the server function
 * resolves, so `placeOrder` returns the result instead of redirecting).
 *
 * Cookie-dependent, so this file must stay server-only (see
 * cookies.server.ts's header comment) — only import it from a
 * `createServerFn()` handler (see cart.ts, the client-safe wrapper layer),
 * never from a route component or loader body directly.
 */
import type { HttpTypes } from "@medusajs/types";
import { FetchError } from "@medusajs/js-sdk";
import { sdk } from "./config";
import { medusaError } from "./errors";
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies.server";
import { getRegion } from "./regions";

// A cart can end up marked "completed" server-side even when the client
// never learns the order succeeded — e.g. `sdk.store.cart.complete()`'s
// response gets dropped by a network hiccup or a Cloudflare Workers edge
// timeout after the backend already finalized the order. Nothing else
// would ever clear the cart-id cookie in that case: `placeOrder` below
// only calls `removeCartId()` after a resolved, successful response, and
// every other cart operation just reuses whatever cart id is in the
// cookie without checking whether it's still usable. Left alone, the
// shopper is stuck forever — the completed cart still *reads* back fine
// (so the UI keeps showing its old, frozen contents) but rejects every
// write with a permanent "Cart ... is already completed" error. Both
// helpers below exist to self-heal that: clear the stale cookie the
// moment a completed cart is detected, on read or on write, so the next
// operation starts a fresh cart instead of repeating the same failure.
// [checkout-logging] Server-side log helper. Runs inside the Cloudflare
// Worker, so `console.log`/`console.error` here land in Cloudflare's own
// Workers logs (`wrangler tail` / dashboard Logs) — durable and visible
// even when nobody had browser devtools open, unlike client-side logging.
function logCart(event: string, details?: Record<string, unknown>): void {
  console.log(`[cart.server] ${event}`, details ?? {});
}

function errorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof FetchError) {
    return { status: error.status, statusText: error.statusText, message: error.message };
  }
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { value: String(error) };
}

// A cart-write can lose a completion race two ways: Medusa says the cart
// is flat-out "already completed" (the original case this self-heal was
// built for — a dropped/retried response after the backend had already
// finalized the order), or — the case that slipped through undetected
// until now — two near-simultaneous `placeOrder()` calls against the same
// cart (e.g. a double-submit on the "Pay" button) race each other, the
// winner completes the cart, and the loser gets back a plain HTTP 409
// Conflict from Medusa. Both are the same underlying situation from the
// shopper's point of view — this cart is done, stop retrying against it —
// so both are now treated identically instead of the 409 falling through
// as a raw, unhandled "[409 Conflict] ..." error.
function isCartCompletedError(error: unknown): boolean {
  return (
    error instanceof FetchError &&
    (error.status === 409 || /already completed/i.test(error.message))
  );
}

function withCompletedCartRecovery(error: unknown): never {
  if (isCartCompletedError(error)) {
    logCart("completed-cart self-heal triggered", errorDetails(error));
    removeCartId();
    throw new Error(
      "Your cart session had already been completed. It's been reset — please try again.",
    );
  }
  logCart("unhandled cart error", errorDetails(error));
  return medusaError(error);
}

export async function retrieveCart(): Promise<HttpTypes.StoreCart | null> {
  const cartId = getCartId();
  if (!cartId) return null;

  const authHeaders = getAuthHeaders();
  return sdk.store.cart
    .retrieve(cartId, {}, authHeaders)
    .then(({ cart }) => {
      if (cart.completed_at) {
        // Same self-heal as above, hit via a plain read instead of a
        // failed write: retrieving a completed cart succeeds (Medusa
        // doesn't error on GET), so without this check the header badge,
        // the cart page, and checkout would all go on showing a dead
        // cart's frozen contents indefinitely.
        removeCartId();
        return null;
      }
      return cart;
    })
    .catch(() => null);
}

export async function getOrSetCart(countryCode: string): Promise<HttpTypes.StoreCart> {
  let cart = await retrieveCart();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  const authHeaders = getAuthHeaders();

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id }, {}, authHeaders);
    cart = cartResp.cart;
    setCartId(cart.id);
  } else if (cart.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, authHeaders);
    cart = (await retrieveCart()) ?? cart;
  }

  return cart;
}

export async function updateCart(data: HttpTypes.StoreUpdateCart): Promise<HttpTypes.StoreCart> {
  const cartId = getCartId();
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating");
  }

  const authHeaders = getAuthHeaders();
  return sdk.store.cart
    .update(cartId, data, {}, authHeaders)
    .then(({ cart }) => cart)
    .catch(withCompletedCartRecovery);
}

export async function addToCart({
  variantId,
  countryCode,
}: {
  variantId: string;
  countryCode: string;
}): Promise<HttpTypes.StoreCart> {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart");
  }

  const cart = await getOrSetCart(countryCode);

  // Digital goods: this is a license to one model, not a stackable
  // physical item — there's no such thing as "2 of the same model".
  // Quantity is always exactly 1, and clicking "Add to Cart" again for a
  // variant already in the cart is a no-op rather than incrementing it
  // (see decisions doc, Tier 3 follow-up fix).
  const alreadyInCart = cart.items?.some((item) => item.variant_id === variantId);
  if (alreadyInCart) return cart;

  const authHeaders = getAuthHeaders();
  return sdk.store.cart
    .createLineItem(cart.id, { variant_id: variantId, quantity: 1 }, {}, authHeaders)
    .then(({ cart }) => cart)
    .catch(withCompletedCartRecovery);
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}): Promise<HttpTypes.StoreCart> {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item");
  }

  const cartId = getCartId();
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item");
  }

  const authHeaders = getAuthHeaders();
  return sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, authHeaders)
    .then(({ cart }) => cart)
    .catch(withCompletedCartRecovery);
}

export async function deleteLineItem(lineId: string): Promise<HttpTypes.StoreCart | null> {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item");
  }

  const cartId = getCartId();
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item");
  }

  const authHeaders = getAuthHeaders();
  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, authHeaders)
    .catch(withCompletedCartRecovery);

  return retrieveCart();
}

// Takes only the cart's id and (if one already exists) its payment
// collection's id, not the whole `HttpTypes.StoreCart` object — the SDK's
// own `initiatePaymentSession` only ever reads `cart.id` and
// `cart.payment_collection?.id` internally (confirmed by reading
// js-sdk/src/store/index.ts), so the deeply-nested rest of the cart type
// (line items, tax lines, etc.) is irrelevant here. Also sidesteps an
// `exactOptionalPropertyTypes` validator-type cascade through those nested
// fields on the `createServerFn` boundary in cart.ts — see decisions doc.
export async function initiatePaymentSession(
  cartId: string,
  paymentCollectionId: string | undefined,
  providerId: string,
): Promise<HttpTypes.StorePaymentCollection> {
  const authHeaders = getAuthHeaders();
  const cartArg = {
    id: cartId,
    payment_collection: paymentCollectionId ? { id: paymentCollectionId } : undefined,
  } as HttpTypes.StoreCart;
  return sdk.store.payment
    .initiatePaymentSession(cartArg, { provider_id: providerId }, {}, authHeaders)
    .then(({ payment_collection }) => payment_collection)
    .catch(withCompletedCartRecovery);
}

export async function applyPromotions(codes: string[]): Promise<HttpTypes.StoreCart> {
  const cartId = getCartId();
  if (!cartId) {
    throw new Error("No existing cart found");
  }

  return updateCart({ promo_codes: codes });
}

export async function updateRegion(countryCode: string): Promise<HttpTypes.StoreCart | null> {
  const cartId = getCartId();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  if (!cartId) return null;

  return updateCart({ region_id: region.id });
}

export type PlaceOrderResult =
  { type: "order"; orderId: string } | { type: "cart"; cart: HttpTypes.StoreCart };

export async function placeOrder(): Promise<PlaceOrderResult> {
  const cartId = getCartId();
  if (!cartId) {
    logCart("placeOrder called with no cart id in cookie");
    throw new Error("No existing cart found when placing an order");
  }

  logCart("placeOrder: completing cart", { cartId });

  const authHeaders = getAuthHeaders();
  const cartRes = await sdk.store.cart
    .complete(cartId, {}, authHeaders)
    .then((res) => {
      logCart("placeOrder: cart.complete resolved", { cartId, resultType: res.type });
      return res;
    })
    .catch((error: unknown) => {
      logCart("placeOrder: cart.complete rejected", { cartId, ...errorDetails(error) });
      return withCompletedCartRecovery(error);
    });

  if (cartRes.type === "order") {
    logCart("placeOrder: order created", { cartId, orderId: cartRes.order.id });
    removeCartId();
    return { type: "order", orderId: cartRes.order.id };
  }

  logCart("placeOrder: cart.complete returned a cart, not an order (payment likely incomplete)", {
    cartId,
    cartPaymentStatus: cartRes.cart.payment_collection?.status,
  });
  return { type: "cart", cart: cartRes.cart };
}
