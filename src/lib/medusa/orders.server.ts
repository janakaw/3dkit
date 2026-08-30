/**
 * Order lookup for the post-checkout confirmation page.
 *
 * Cookie-dependent (passes along the auth token if the shopper is signed
 * in as a Medusa customer), so this stays `.server.ts` — see
 * cookies.server.ts's header comment. Ported from
 * 3dchairstore-storefront/src/lib/data/orders.ts, trimmed to just
 * `retrieveOrder`: `listOrders` belongs to an account/order-history page,
 * which isn't part of this porting step.
 *
 * Retrieving a single order by id is intentionally allowed for guests too
 * (unlike listing orders, which the Medusa Store API scopes to the
 * authenticated customer) — that's what makes a same-request-only
 * "thank you" / order confirmation page possible right after a guest
 * checkout, with no sign-in required.
 */
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./config";
import { getAuthHeaders } from "./cookies.server";

export async function retrieveOrder(orderId: string): Promise<HttpTypes.StoreOrder | null> {
  const authHeaders = getAuthHeaders();
  return sdk.store.order
    .retrieve(orderId, { fields: "*payment_collections.payments,+fulfillment_status" }, authHeaders)
    .then(({ order }) => order)
    .catch(() => null);
}
