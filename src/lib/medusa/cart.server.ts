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
import { sdk } from "./config";
import { medusaError } from "./errors";
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies.server";
import { getRegion } from "./regions";

export async function retrieveCart(): Promise<HttpTypes.StoreCart | null> {
  const cartId = getCartId();
  if (!cartId) return null;

  const authHeaders = getAuthHeaders();
  return sdk.store.cart
    .retrieve(cartId, {}, authHeaders)
    .then(({ cart }) => cart)
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
    .catch(medusaError);
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
    .catch(medusaError);
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
    .catch(medusaError);
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
  await sdk.store.cart.deleteLineItem(cartId, lineId, {}, authHeaders).catch(medusaError);

  return retrieveCart();
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
    throw new Error("No existing cart found when placing an order");
  }

  const authHeaders = getAuthHeaders();
  const cartRes = await sdk.store.cart.complete(cartId, {}, authHeaders).catch(medusaError);

  if (cartRes.type === "order") {
    removeCartId();
    return { type: "order", orderId: cartRes.order.id };
  }

  return { type: "cart", cart: cartRes.cart };
}
