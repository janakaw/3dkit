/**
 * Product fetching against the Medusa Store API.
 *
 * Ported from 3dchairstore-storefront/src/lib/data/products.ts. Returns raw
 * `HttpTypes.StoreProduct` data — mapping that into the app's UI-facing
 * `Product` shape is a separate concern, deliberately kept out of this file
 * (see adapt-product.ts) since that mapping is expected to change often as
 * the backend gains real fields, while the actual fetch logic shouldn't
 * need to.
 *
 * Deliberately NOT ported: the storefront's `getProductsList` filters out
 * single-variant products with `inventory_quantity === 0`. That's the same
 * naive stock check flagged in the decisions doc (manage_inventory: false
 * digital products can have inventory_quantity 0/null and would be wrongly
 * hidden by that filter). Skipped here rather than reproduced — every
 * product is returned as-is. Revisit if/when this store carries any
 * inventory-tracked products.
 */
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./config";
import { medusaError } from "./errors";
import { getRegion } from "./regions";

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants,*variants.prices,*categories,+metadata";

export async function getProductByHandle(
  handle: string,
  countryCode: string,
): Promise<HttpTypes.StoreProduct | undefined> {
  const region = await getRegion(countryCode);
  if (!region) {
    return undefined;
  }

  const byHandle = await sdk.store.product
    .list({ handle, region_id: region.id, fields: PRODUCT_FIELDS })
    .then(({ products }) => products[0])
    .catch(medusaError);

  if (byHandle) {
    return byHandle;
  }

  // adapt-product.ts falls back to the raw product id as the URL slug for
  // any product imported without a `handle` set. If the handle lookup
  // above found nothing and this looks like a Medusa product id rather
  // than a real handle, retry as a direct id lookup before giving up.
  if (handle.startsWith("prod_")) {
    return sdk.store.product
      .retrieve(handle, { region_id: region.id, fields: PRODUCT_FIELDS })
      .then(({ product }) => product)
      .catch(() => undefined);
  }

  return undefined;
}

export async function getProductsList({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  countryCode: string;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  nextPage: number | null;
}> {
  const limit = queryParams?.limit || 12;
  const offset = Math.max(0, (pageParam - 1) * limit);
  const region = await getRegion(countryCode);

  if (!region) {
    return { products: [], count: 0, nextPage: null };
  }

  return sdk.store.product
    .list({
      limit,
      offset,
      region_id: region.id,
      fields: PRODUCT_FIELDS,
      ...queryParams,
    })
    .then(({ products, count }) => ({
      products,
      count,
      nextPage: count > offset + limit ? pageParam + 1 : null,
    }))
    .catch(medusaError);
}
