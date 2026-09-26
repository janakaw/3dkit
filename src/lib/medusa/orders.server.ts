/**
 * Order lookup for the post-checkout confirmation page.
 *
 * Orders belong to Medusa customers (decisions doc, Tier 13 — guest
 * orders are prohibited), so reading one requires the signed-in shopper's
 * Medusa customer session and the order must be theirs. Two checks, both
 * server-side: the Medusa backend's own `authenticate("customer")`
 * middleware on `/store/orders*` refuses anonymous reads outright, and
 * this function additionally compares the order's `customer_id` to the
 * customer in the session cookie before returning anything — so a valid
 * session cannot read somebody else's order by id.
 *
 * Cookie-dependent, so `.server.ts` — see cookies.server.ts's header.
 */
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./config";
import { getAuthHeaders } from "./cookies.server";
import { ensureMedusaSession, type EnsureMedusaSessionInput } from "./auth.server";

export async function retrieveOrder(
  orderId: string,
  identity: EnsureMedusaSessionInput,
): Promise<HttpTypes.StoreOrder | null> {
  const session = await ensureMedusaSession(identity);

  // `customer_id` is NOT in Medusa's default store-order field set, so it
  // has to be requested explicitly — without `+customer_id` the ownership
  // check below compares against `undefined` and rejects every order
  // (found the hard way on 6 Sept: a successful checkout landed on a
  // "page does not exist"). `+` adds to the defaults; `*` pulls a whole
  // relation in; neither replaces the default list.
  const order = await sdk.store.order
    .retrieve(
      orderId,
      { fields: "+customer_id,*payment_collections.payments,+fulfillment_status" },
      getAuthHeaders(),
    )
    .then(({ order }) => order)
    .catch((error: unknown) => {
      console.warn("[orders.server] order read failed", {
        orderId,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    });

  if (!order) return null;

  if (!order.customer_id || order.customer_id !== session.customerId) {
    console.warn("[orders.server] refused order read: not the caller's order", {
      orderId,
      orderCustomerId: order.customer_id ?? null,
      sessionCustomerId: session.customerId,
    });
    return null;
  }

  return order;
}

/**
 * Every order the signed-in shopper has placed, newest first — backs the
 * Account → Payments page. Medusa's `/store/orders` list is already scoped
 * to the authenticated customer, so no per-order ownership check is needed
 * here. Prices come from the order's own line items, i.e. what was actually
 * charged at the time, not today's catalogue price.
 */
export async function listOrders(
  identity: EnsureMedusaSessionInput,
): Promise<HttpTypes.StoreOrder[]> {
  await ensureMedusaSession(identity);
  const { orders } = await sdk.store.order.list(
    // `payment_status` isn't in the default store-order field set (same as
    // `customer_id` above); items and totals are.
    { fields: "+payment_status", order: "-created_at", limit: 200 },
    getAuthHeaders(),
  );
  return orders;
}
