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

function cheapestVariant(product: HttpTypes.StoreProduct): { id: string; price: number } | null {
  let best: { id: string; price: number } | null = null;
  for (const variant of product.variants ?? []) {
    const amount = variant.calculated_price?.calculated_amount;
    if (typeof amount !== "number" || !variant.id) continue;
    if (!best || amount < best.price) {
      best = { id: variant.id, price: amount };
    }
  }
  return best;
}

/**
 * The cheapest variant's id, exposed alongside the `Product` shape (see
 * catalog.ts's `Product & { variantId }`) so "Add to Cart" has something
 * real to send to Medusa's cart API. `products.ts`'s mock `Product` has no
 * concept of variants at all — the high/mid "poly tier" toggle
 * (`getVariant`) is pure display math over a single mock price, not a
 * second real Medusa variant — so for now every tier adds this same
 * cheapest variant to the cart. Revisit once/if the backend actually
 * models high-poly vs. mid-poly as distinct variants.
 */
export function cheapestVariantId(product: HttpTypes.StoreProduct): string | null {
  return cheapestVariant(product)?.id ?? null;
}

/**
 * Medusa product-category handle -> the label the storefront filters on.
 *
 * Category pages match `product.category` against the entries in
 * `src/lib/products.ts`'s `categories` (see category.$category.tsx), so the
 * two lists have to agree exactly. Handles are stable; the category *names*
 * in Medusa are plural ("Coffee Tables") and deliberately not used here.
 *
 * A product carries one category today. If that ever changes, the first
 * recognised handle wins.
 */
const CATEGORY_LABELS: Record<string, string> = {
  set: "Set",
  sofa: "Sofa",
  armchair: "Armchair",
  coffeetable: "Coffee Table",
  cabinet: "Cabinet",
  ottoman: "Ottoman",
  sidetable: "Side Table",
  floorlamp: "Floor Lamp",
  nightstand: "Nightstand",
  pendantlight: "Pendant Light",
};

function categoryLabel(product: HttpTypes.StoreProduct): string {
  for (const category of product.categories ?? []) {
    const handle = category?.handle;
    if (handle && CATEGORY_LABELS[handle]) return CATEGORY_LABELS[handle];
  }
  return PLACEHOLDER_TEXT;
}

export function adaptStoreProduct(product: HttpTypes.StoreProduct): Product {
  return {
    slug: product.handle ?? product.id,
    name: product.title ?? "Untitled model",
    description: product.description ?? "No description available yet.",
    image: product.thumbnail ?? product.images?.[0]?.url ?? PLACEHOLDER_IMAGE,
    price: cheapestVariant(product)?.price ?? 0,

    // Real backend data as of the living1 import (2026-09-13).
    category: categoryLabel(product),
    // Every set in the catalogue is a living-room set; the Set category
    // page's sub-filter reads this.
    ...(categoryLabel(product) === "Set" ? { subcategory: "Living Set" } : {}),

    // Not modeled on the backend yet — placeholders, see file header.
    style: PLACEHOLDER_TEXT,
    polys: PLACEHOLDER_TEXT,
    formats: PLACEHOLDER_TEXT,
    textures: PLACEHOLDER_TEXT,
    renderers: PLACEHOLDER_TEXT,
    specs: [],
    isNew: false,
  };
}
