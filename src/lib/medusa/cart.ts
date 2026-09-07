/**
 * Client-safe entry points for cart operations.
 *
 * cart.server.ts touches cookies (auth token + cart id), which makes it
 * server-only — see cookies.server.ts's header comment for why importing
 * it from a route component or loader body directly breaks the client
 * bundle. Each export below wraps one cart.server.ts function in
 * `createServerFn()`, exactly like `debug.medusa-smoke.tsx` did for the
 * Tier 0 smoke test: the client gets a generated RPC call, the actual
 * cookie/SDK logic never leaves the server.
 *
 * Safe to import from anywhere — route components, loaders, event
 * handlers (e.g. an "Add to Cart" button's onClick).
 *
 * Cart *state* (as opposed to these one-shot read/write calls) is shared
 * across components via TanStack Query — see cart-query.ts for the single
 * `["cart"]` query every cart-aware component reads from, and read/write
 * with `useQueryClient().setQueryData(CART_QUERY_KEY, ...)` after a
 * mutation rather than re-fetching. An earlier version of this file used a
 * `window.dispatchEvent`-based broadcast for this instead; it's gone now —
 * see the decisions doc for why (two independent refetches could resolve
 * out of order and clobber the badge with a stale count).
 */
import { createServerFn } from "@tanstack/react-start";
import type { HttpTypes } from "@medusajs/types";
import * as cartServer from "./cart.server";
import type { PlaceOrderResult } from "./cart.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// POST, not GET, even though this only reads: a same-URL, no-args "GET"
// server function is an easy target for the browser's default HTTP GET
// caching, and SiteHeader's badge (called ad hoc from a useEffect, not
// tied to a route navigation the way the cart page's loader call is) was
// observed serving a stale cached cart after a line item had already been
// removed. POST requests aren't cached by default, which sidesteps the
// whole question of whether the server response sets the right
// cache-control headers.
export const retrieveCart = createServerFn({ method: "POST", strict: { output: false } }).handler(
  (): Promise<HttpTypes.StoreCart | null> => cartServer.retrieveCart(),
);

export const getOrSetCart = createServerFn({ method: "POST", strict: { output: false } })
  .validator((countryCode: string) => countryCode)
  .handler(({ data: countryCode }): Promise<HttpTypes.StoreCart> =>
    cartServer.getOrSetCart(countryCode),
  );

export const addToCart = createServerFn({ method: "POST", strict: { output: false } })
  .validator((data: { variantId: string; countryCode: string }) => data)
  .handler(({ data }): Promise<HttpTypes.StoreCart> => cartServer.addToCart(data));

export const updateLineItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator((data: { lineId: string; quantity: number }) => data)
  .handler(({ data }): Promise<HttpTypes.StoreCart> => cartServer.updateLineItem(data));

export const deleteLineItem = createServerFn({ method: "POST", strict: { output: false } })
  .validator((lineId: string) => lineId)
  .handler(({ data: lineId }): Promise<HttpTypes.StoreCart | null> =>
    cartServer.deleteLineItem(lineId),
  );

// Generic cart-field write (email, addresses, …). Checkout no longer has
// a billing step — `prepareCheckout` below sets the email server-side. `HttpTypes.StoreUpdateCart` also
// covers things like `region_id`/`promo_codes`, but those already have
// their own narrower wrappers below (`updateCartRegion`, `applyPromotions`)
// — reach for this one only when nothing more specific fits.
export const updateCart = createServerFn({ method: "POST", strict: { output: false } })
  .validator((data: HttpTypes.StoreUpdateCart) => data)
  .handler(({ data }): Promise<HttpTypes.StoreCart> => cartServer.updateCart(data));

// Takes just the cart's id + its payment collection's id (if any), not
// the whole `HttpTypes.StoreCart` object — the SDK call this wraps only
// ever reads those two fields (see cart.server.ts's header comment on
// `initiatePaymentSession`). Deliberately narrow: passing the full cart
// type through this validator tripped an `exactOptionalPropertyTypes`
// cascade through its deeply-nested optional fields (items[].tax_lines[]
// .item.product.categories, etc.) that TanStack Start's `ConstrainValidator`
// couldn't satisfy — see decisions doc.
export const initiatePaymentSession = createServerFn({ method: "POST", strict: { output: false } })
  .validator(
    (data: { cartId: string; paymentCollectionId: string | undefined; providerId: string }) => data,
  )
  .handler(({ data }): Promise<HttpTypes.StorePaymentCollection> =>
    cartServer.initiatePaymentSession(data.cartId, data.paymentCollectionId, data.providerId),
  );

export const applyPromotions = createServerFn({ method: "POST", strict: { output: false } })
  .validator((codes: string[]) => codes)
  .handler(({ data: codes }): Promise<HttpTypes.StoreCart> => cartServer.applyPromotions(codes));

export const updateCartRegion = createServerFn({ method: "POST", strict: { output: false } })
  .validator((countryCode: string) => countryCode)
  .handler(({ data: countryCode }): Promise<HttpTypes.StoreCart | null> =>
    cartServer.updateRegion(countryCode),
  );

// Read the signed-in shopper's identity off the server-verified Supabase
// claims (see auth-middleware.ts). Nothing about who is ordering is ever
// taken from the client-supplied payload.
function identityFromContext(context: {
  claims: unknown;
  accessToken: string;
}): cartServer.PlaceOrderInput {
  const claims = context.claims as Record<string, unknown>;
  const email = typeof claims["email"] === "string" ? (claims["email"] as string) : "";
  if (!email) {
    throw new Error("Signed-in user has no email claim; cannot check out.");
  }
  const meta = claims["user_metadata"];
  const displayName =
    meta &&
    typeof meta === "object" &&
    typeof (meta as Record<string, unknown>)["display_name"] === "string"
      ? ((meta as Record<string, unknown>)["display_name"] as string)
      : undefined;
  return { supabaseAccessToken: context.accessToken, email, displayName };
}

// Checkout page entry point: session + cart email + payment session in
// one idempotent call (see cart.server.ts). Requires a verified Supabase
// session — checkout sits behind `_authenticated` already, so this is
// defense in depth on the server function itself.
export const prepareCheckout = createServerFn({ method: "POST", strict: { output: false } })
  .middleware([requireSupabaseAuth])
  .validator((data: { providerId: string }) => data)
  .handler(({ data, context }): Promise<HttpTypes.StoreCart | null> =>
    cartServer.prepareCheckout(identityFromContext(context), data.providerId),
  );

// Same identity handling as `prepareCheckout`: the Medusa customer
// session is established (or confirmed) before completing the cart, so
// the order carries `customer_id` — see auth.server.ts.
export const placeOrder = createServerFn({ method: "POST", strict: { output: false } })
  .middleware([requireSupabaseAuth])
  .handler(({ context }): Promise<PlaceOrderResult> =>
    cartServer.placeOrder(identityFromContext(context)),
  );
