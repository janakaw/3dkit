/**
 * The single switch between mock data and the real Medusa backend.
 *
 * VITE_DATA_SOURCE:
 *   - unset / empty -> "production": real Medusa backend (api.3dlounge.co)
 *   - "mock"        -> src/lib/products.ts, untouched, exactly as before
 *
 * Nothing else in the app should import src/lib/products.ts or
 * src/lib/medusa/products.ts directly for product data going forward —
 * route loaders should call the functions exported here instead, so
 * flipping the env var is the entire switch-back procedure with no code
 * changes required in either direction.
 *
 * Both branches return the exact same `Product` shape (see
 * adapt-product.ts for how the Medusa branch gets there), and both are
 * exposed as async here — even the mock branch, which has no real
 * async work to do — so a route loader written against this facade never
 * needs to change when the data source is switched.
 */
import * as mock from "@/lib/products";
import type { Product as BaseProduct } from "@/lib/products";
import { adaptStoreProduct, cheapestVariantId } from "@/lib/medusa/adapt-product";
import {
  getProductByHandle as medusaGetProductByHandle,
  getProductsList as medusaGetProductsList,
} from "@/lib/medusa/products";

/**
 * `products.ts`'s `Product` only ever carried one `image` and no variant
 * identity at all — mock data has neither. The catalog-facade `Product`
 * widens that with:
 *   - `images: string[]` — the real backend's multiple photos per product
 *     (falls back to the single `image` when there's only one).
 *   - `variantId: string | null` — the Medusa variant to send to the cart
 *     API for "Add to Cart" (see adapt-product.ts's `cheapestVariantId`).
 *     `null` in mock mode, where there's no real backend variant to add.
 * Neither changes `products.ts` itself. Both branches below populate both
 * fields, so anything reading them never needs to branch on
 * `VITE_DATA_SOURCE`.
 */
export type Product = BaseProduct & { images: string[]; variantId: string | null };

function withCatalogMeta(
  product: BaseProduct,
  opts: { images?: string[] | undefined; variantId?: string | null } = {},
): Product {
  const gallery = opts.images?.filter(Boolean) ?? [];
  return {
    ...product,
    images: gallery.length > 0 ? gallery : [product.image],
    variantId: opts.variantId ?? null,
  };
}

function readEnv(key: string): string | undefined {
  return (import.meta.env?.[key] as string | undefined) ?? process.env[key];
}

const DATA_SOURCE = readEnv("VITE_DATA_SOURCE") || "production";
export const isMockDataSource = DATA_SOURCE === "mock";

const DEFAULT_COUNTRY_CODE = "us";

export async function getProduct(
  slug: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): Promise<Product | undefined> {
  if (isMockDataSource) {
    const product = mock.getProduct(slug);
    return product ? withCatalogMeta(product) : undefined;
  }

  const product = await medusaGetProductByHandle(slug, countryCode);
  if (!product) return undefined;
  return withCatalogMeta(adaptStoreProduct(product), {
    images: product.images?.map((image) => image.url),
    variantId: cheapestVariantId(product),
  });
}

export async function getProducts(countryCode: string = DEFAULT_COUNTRY_CODE): Promise<Product[]> {
  if (isMockDataSource) {
    return mock.products.map((product) => withCatalogMeta(product));
  }

  // No real pagination/filtering support yet on the frontend side — fetch
  // a generous flat batch and let the existing client-side filter/sort
  // logic in the listing pages keep working unchanged, same as it does
  // against the mock array today. Revisit once the catalog is too big for
  // one request or once category/style actually exist on the backend.
  const { products } = await medusaGetProductsList({ countryCode, queryParams: { limit: 100 } });
  return products.map((product) =>
    withCatalogMeta(adaptStoreProduct(product), {
      images: product.images?.map((image) => image.url),
      variantId: cheapestVariantId(product),
    }),
  );
}

// Everything below is source-agnostic (pure functions/static UI copy, not
// product data), so it's re-exported as-is regardless of VITE_DATA_SOURCE.
// Re-visit if/when categories/styles/etc. need to come from the backend too.
export const getVariant = mock.getVariant;
export const formatPrice = mock.formatPrice;
// mock.heroImage points at a Lovable-platform-hosted asset
// (`/__l5e/assets-v1/...`) that only resolves inside Lovable's own preview/
// hosting infra — it 404s once the app is deployed on its own Cloudflare
// Worker (see decisions doc, 2026-08-29 entry on broken mock image hosting).
// Overridden here rather than in products.ts so that file stays untouched
// per the mock/production safety-switch requirement.
const HERO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900' viewBox='0 0 1600 900'%3E%3Crect width='1600' height='900' fill='%23e5e5e5'/%3E%3Ctext x='800' y='450' font-family='sans-serif' font-size='36' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EImage coming soon%3C/text%3E%3C/svg%3E";
export const heroImage = HERO_PLACEHOLDER;
export const categories = mock.categories;
export const setSubcategories = mock.setSubcategories;
export const styles = mock.styles;
export const getType = mock.getType;
export const categorySlug = mock.categorySlug;
export const categoryFromSlug = mock.categoryFromSlug;
export const PAGE_SIZE = mock.PAGE_SIZE;
export type { PolyTier, Variant } from "@/lib/products";
