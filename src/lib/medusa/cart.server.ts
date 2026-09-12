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
import { ensureMedusaSession, type EnsureMedusaSessionInput } from "./auth.server";
import { getLibraryForCurrentSession } from "./library.server";

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

// Only the genuine "Cart ... is already completed" error triggers the
// self-heal. It used to also match any HTTP 409, which turned out to be
// Medusa's generic CONFLICT wrapper for "the completion transaction never
// finished" — a completely different situation, in which the cart must
// NOT be discarded because the shopper's card has already been held
// against it (decisions doc, Tiers 12–13). `placeOrder` below handles
// that case itself; this helper is for the cart-*write* paths only.
function isCartCompletedError(error: unknown): boolean {
  return error instanceof FetchError && /already completed/i.test(error.message);
}

function withCompletedCartRecovery(error: unknown): never {
  if (isCartCompletedError(error)) {
    logCart("completed-cart self-heal triggered", errorDetails(error));
    removeCartId();
    throw new Error(
      "That cart had already been turned into an order. Start a fresh cart and try again.",
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

  // Digital goods can't be bought twice (doc/bugs #2). Convenience layer
  // only — the backend's completeCart validate hook refuses such a cart
  // regardless of how the line got in.
  const library = await getLibraryForCurrentSession();
  if (library.some((entry) => entry.variant_id === variantId)) {
    throw new Error("This model is already in your library.");
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

/**
 * Everything checkout needs before the card form can show, in one
 * idempotent call. There is no billing-details step: Medusa needs no
 * address to complete a cart (digital goods — no shipping, and the
 * default tax provider ignores addresses), and Stripe's CardElement
 * collects the postal code itself. What Medusa *does* need is an email
 * and a customer on the cart, and a pending payment session to hand the
 * browser a client secret. So:
 *
 *   1. establish the Medusa customer session (also hands a guest cart to
 *      the customer, which stamps `customer_id` + `email` on it);
 *   2. make sure the cart carries the account's email — a cart created
 *      before sign-in only gets one via the transfer, and a cart whose
 *      email drifted (older billing form) is corrected to the account;
 *   3. if the total is > 0 and there is no pending Stripe session yet,
 *      start one.
 *
 * Safe to call on every checkout page load: nothing here charges or
 * holds the card, and a pending session is reused rather than re-created.
 */
export async function prepareCheckout(
  input: EnsureMedusaSessionInput,
  providerId: string,
): Promise<HttpTypes.StoreCart | null> {
  await ensureMedusaSession(input);

  let cart = await retrieveCart();
  if (!cart || (cart.items?.length ?? 0) === 0) return cart;

  if (cart.email !== input.email) {
    logCart("prepareCheckout: setting cart email from account", { cartId: cart.id });
    cart = await updateCart({ email: input.email });
  }

  const hasPendingSession = cart.payment_collection?.payment_sessions?.some(
    (s) => s.status === "pending",
  );
  if ((cart.total ?? 0) > 0 && !hasPendingSession) {
    logCart("prepareCheckout: initiating payment session", { cartId: cart.id, total: cart.total });
    const payment_collection = await initiatePaymentSession(
      cart.id,
      cart.payment_collection?.id,
      providerId,
    );
    cart = { ...cart, payment_collection };
  }
  return cart;
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
  | { type: "order"; orderId: string }
  // Card is held, order not yet confirmed. The cart is intact and the
  // authorisation is reusable, so the shopper should NOT re-enter a card.
  | { type: "pending"; message: string }
  // Medusa returned the cart with a payment error attached (e.g. the
  // session needs more action). The card was not charged.
  | { type: "cart"; cart: HttpTypes.StoreCart };

// Medusa's store complete route throws a bare CONFLICT (surfaced as a 409
// with a canned "Idempotency-Key" message) whenever completeCartWorkflow's
// transaction ends in a non-terminal state — no competing request is
// involved; see decisions doc Tiers 12–13. On the in-memory workflow
// engine this happens when the workflow's parallel step group races its
// own checkpoint storage, and it leaves the transaction stalled mid-flight.
//
// Do NOT retry a 409 (tried on 6 Sept, decisions doc Tier 13 follow-up):
// the stalled transaction still holds the cart's lock for up to two
// minutes, so a retry blocks in acquireLockStep for 30s and comes back as
// an API Gateway timeout — a worse experience than reporting "pending" at
// once. And even after the lock expires, a re-run finds the order already
// created and skips the branch that authorises payment, so the shopper
// would land on a confirmation page for an order Medusa will never charge
// for. The stall has to be fixed where it happens (Redis workflow engine);
// here we just tell the truth quickly and leave cart and hold intact.
function isNonTerminalCompletion(error: unknown): boolean {
  return error instanceof FetchError && error.status === 409;
}

export type PlaceOrderInput = EnsureMedusaSessionInput;

/**
 * Finalise the cart into an order. The card has already been *authorised*
 * (held) in the browser by this point — never captured; capture happens
 * on the Medusa side once `order.placed` fires (see the backend's
 * capture-on-order-placed subscriber). So nothing here can take money,
 * and nothing here should ever discard the cart: a failure leaves a hold
 * that expires on its own, and a retry reuses the same authorisation.
 *
 * Guest orders are refused at three layers (decisions doc, Tier 13); this
 * is the outermost — a Medusa customer session is established (or
 * confirmed) before the completion call, so the cart is completed *as*
 * that customer and the order carries `customer_id`.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const cartId = getCartId();
  if (!cartId) {
    logCart("placeOrder called with no cart id in cookie");
    throw new Error("No existing cart found when placing an order");
  }

  let session = await ensureMedusaSession(input);
  logCart("placeOrder: completing cart", { cartId, customerId: session.customerId });

  // At most two passes: the second exists only for a Medusa session that
  // expired between page load and "Place order" (401 → re-exchange once).
  let reExchanged = false;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await sdk.store.cart.complete(cartId, {}, getAuthHeaders());
      logCart("placeOrder: cart.complete resolved", { cartId, attempt, resultType: res.type });

      if (res.type === "order") {
        logCart("placeOrder: order created", { cartId, orderId: res.order.id });
        removeCartId();
        return { type: "order", orderId: res.order.id };
      }

      logCart("placeOrder: cart.complete returned a cart, not an order", {
        cartId,
        cartPaymentStatus: res.cart.payment_collection?.status,
      });
      return { type: "cart", cart: res.cart };
    } catch (error) {
      const details = errorDetails(error);

      // Medusa session expired between page load and "Place order":
      // exchange once and go again.
      if (error instanceof FetchError && error.status === 401 && !reExchanged) {
        logCart("placeOrder: Medusa session rejected — re-exchanging", { cartId });
        reExchanged = true;
        session = await ensureMedusaSession(input, { force: true });
        continue;
      }

      if (isNonTerminalCompletion(error)) {
        logCart("placeOrder: completion stalled (non-terminal transaction)", {
          cartId,
          ...details,
        });
        return {
          type: "pending",
          message:
            "Your payment is authorised but the order hasn't been confirmed. " +
            "You have not been charged, and the hold on your card will clear on its own. " +
            "Please contact support and we'll finish the order for you — don't pay again.",
        };
      }

      logCart("placeOrder: cart.complete rejected", { cartId, attempt, ...details });
      return medusaError(error);
    }
  }

  // Reached only if the re-exchange pass also hit a 401.
  throw new Error("Could not establish a customer session with the store. Please sign in again.");
}
