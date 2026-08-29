/**
 * Medusa StoreProduct -> the app's existing `Product` shape (src/lib/products.ts).
 *
 * WHY an adapter instead of a new type: every component (ProductCard,
 * product detail page, etc.) already renders the mock `Product` shape.
 * Making real backend data conform to that exact shape means those
 * components don't need to change at all when the data source switches —
 * see src/lib/catalog.ts, which is the only place that decides mock vs.
 * real.
 *
 * CURRENT STATE (expected to change repeatedly before production): the
 * backend right now only reliably has images, a title, and a description
 * per product. Every other `Product` field (category, style, polys,
 * formats, textures, renderers, specs, price) doesn't exist there yet.
 * Rather than let those show up as `undefined` in the UI, every missing
 * field gets an explicit, clearly-labeled placeholder value below. As the
 * backend gains real data for a field (via metadata, options, categories,
 * etc.), update the corresponding line here — this file is the single
 * place that should need to change.
 */
import type { HttpTypes } from "@medusajs/types";
import type { Product } from "@/lib/products";

const PLACEHOLDER_TEXT = "Not specified yet";

/**
 * A neutral "no image" placeholder — an inline SVG data URI so this file
 * doesn't depend on a real placeholder asset existing yet.
 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23e5e5e5'/%3E%3Ctext x='400' y='400' font-family='sans-serif' font-size='28' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EImage coming soon%3C/text%3E%3C/svg%3E";

function cheapestCalculatedPrice(product: HttpTypes.StoreProduct): number {
  for (const variant of product.variants ?? []) {
    const amount = variant.calculated_price?.calculated_amount;
    if (typeof amount === "number") {
      return amount;
    }
  }
  return 0;
}

export function adaptStoreProduct(product: HttpTypes.StoreProduct): Product {
  return {
    slug: product.handle ?? product.id,
    name: product.title ?? "Untitled model",
    description: product.description ?? "No description available yet.",
    image: product.thumbnail ?? product.images?.[0]?.url ?? PLACEHOLDER_IMAGE,
    price: cheapestCalculatedPrice(product),

    // Not modeled on the backend yet — placeholders, see file header.
    category: PLACEHOLDER_TEXT,
    style: PLACEHOLDER_TEXT,
    polys: PLACEHOLDER_TEXT,
    formats: PLACEHOLDER_TEXT,
    textures: PLACEHOLDER_TEXT,
    renderers: PLACEHOLDER_TEXT,
    specs: [],
    isNew: false,
  };
}
