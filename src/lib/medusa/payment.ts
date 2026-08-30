/**
 * Payment provider lookup.
 *
 * This is a public Store API endpoint (region-scoped, no cart/auth cookie
 * involved), so — like regions.ts — it doesn't need to be `.server.ts`;
 * see cookies.server.ts's header comment for the actual reason that
 * distinction exists. Ported from
 * 3dchairstore-storefront/src/lib/data/payment.ts, minus the React
 * `cache()` wrapper (same call as regions.ts: no TanStack Start
 * equivalent, and it only deduped calls within a single render pass).
 */
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./config";

export async function listPaymentProviders(
  regionId: string,
): Promise<HttpTypes.StorePaymentProvider[]> {
  return sdk.store.payment
    .listPaymentProviders({ region_id: regionId })
    .then(({ payment_providers }) => payment_providers)
    .catch(() => []);
}
