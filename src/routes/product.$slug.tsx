import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Grid2x2,
  LifeBuoy,
  RefreshCw,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { openSubscribe } from "@/components/SubscribeModal";
import {
  formatPrice,
  getProduct,
  getVariant,
  isMockDataSource,
  type PolyTier,
} from "@/lib/catalog";
import { addToCart } from "@/lib/medusa/cart";
import { CART_QUERY_KEY } from "@/lib/medusa/cart-query";
import { libraryQueryOptions, ownsVariant } from "@/lib/medusa/library-query";
import { useAuthUser } from "@/integrations/supabase/use-auth-user";
// "Related products" strip below still reads the static mock list
// directly — that's the listing-page tier of the port, not done yet.
// Only the single-product lookup above is wired to VITE_DATA_SOURCE so far.
import { products } from "@/lib/products";

type ProductSearch = { tier?: PolyTier | undefined };

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    tier: search["tier"] === "mid" ? "mid" : undefined,
  }),
  loader: async ({ params }) => {
    const product = await getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Model not found — 3Dkit" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} — 3D Model | 3Dkit`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description.slice(0, 155) },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

const highFormats: Array<[string, string]> = [
  ["FBX", "184 MB"],
  ["OBJ", "212 MB"],
  ["3ds Max (.max)", "236 MB"],
  ["3ds Max + Corona", "248 MB"],
  ["3ds Max + V-Ray", "251 MB"],
  ["Blender (.blend)", "198 MB"],
];

const midFormats: Array<[string, string]> = [
  ["Unreal FBX (UE5-ready)", "38 MB"],
  ["Unity FBX (verified import)", "38 MB"],
  ["GLB / glTF", "24 MB"],
  ["OBJ", "31 MB"],
];

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { tier: searchTier } = Route.useSearch();
  const tier: PolyTier = searchTier === "mid" ? "mid" : "high";
  const variant = getVariant(product, tier);
  const [openDownload, setOpenDownload] = useState(false);
  // Only for the "no variant to add" edge case (mock mode, or a real
  // product missing a variant id) — the actual add-to-cart request/response
  // lifecycle is tracked by the mutation below, not local state.
  const [unavailable, setUnavailable] = useState(false);

  const queryClient = useQueryClient();

  // Ownership (doc/bugs #2–4): a model the shopper has already paid for
  // can't be added to the cart again, and only an owned model can be
  // downloaded. Derived from the backend's order history via the shared
  // `["library"]` query (see library-query.ts); signed-out visitors own
  // nothing, so for them the download stays locked and the cart is open.
  const authUser = useAuthUser();
  const { data: library } = useQuery(libraryQueryOptions(Boolean(authUser)));
  const owned = ownsVariant(library, product.variantId);

  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    // Write the mutation's own response straight into the shared cart
    // cache (see cart-query.ts) — the header badge and the cart page both
    // read from this same query, so this is the only cache update needed;
    // nothing needs to separately re-fetch.
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    onError: (err) => console.error("Failed to add to cart:", err),
  });

  const handleAddToCart = () => {
    // Mock mode has no real Medusa variant to add (see catalog.ts's
    // `variantId: string | null`) — nothing to wire up until a real
    // backend product is selected.
    if (isMockDataSource || !product.variantId) {
      setUnavailable(true);
      return;
    }
    if (owned) return;
    setUnavailable(false);
    addToCartMutation.mutate({ data: { variantId: product.variantId, countryCode: "us" } });
  };
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);
  const formats = tier === "mid" ? midFormats : highFormats;

  // Previously padded out with other products' images as fake extra
  // "views" — besides depending on a Lovable-platform-only asset URL that
  // 404s outside Lovable's own hosting, showing another product's photo as
  // a "view" of this one was wrong regardless. `product.images` (see
  // catalog.ts) now carries the real per-product photo set from the
  // backend (falling back to the single `product.image` when a product
  // only has one), so the gallery only ever shows this product's own
  // images.
  const gallery = product.images;
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const scrollStrip = (d: number) =>
    stripRef.current?.scrollBy({ left: d * 240, behavior: "smooth" });
  const step = (d: number) => setActive((i) => (i + d + gallery.length) % gallery.length);

  const specs = [
    { icon: Box, label: "Polygons", value: variant.polys },
    { icon: Grid2x2, label: "UV Mapping", value: "Fully unwrapped, non-overlapping UVs" },
    { icon: Sparkles, label: "Textures", value: variant.textures },
    { icon: FileText, label: "Formats", value: variant.formats },
    {
      icon: RefreshCw,
      label: tier === "mid" ? "Rigging" : "Render Engines",
      value: tier === "mid" ? "Static mesh, no rig needed" : product.renderers,
    },
    { icon: LifeBuoy, label: "Support", value: "Lifetime updates" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-5 pt-6">
        <nav className="text-xs uppercase tracking-wide text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            All Product
          </Link>{" "}
          / <span>{product.category}</span> /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-5 grid gap-12 lg:grid-cols-[2fr_1fr]">
          {/* Left — visuals + description */}
          <div>
            <div className="group relative overflow-hidden rounded-2xl bg-secondary">
              <img
                src={gallery[active]}
                alt={`${product.name} ${variant.label} 3D model render`}
                width={1600}
                height={1200}
                className="aspect-[4/3] w-full object-cover"
              />
              <button
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                onClick={() => step(1)}
                aria-label="Next image"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
              <span className="absolute bottom-4 right-4 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                {active + 1} / {gallery.length}
              </span>
            </div>

            <div className="relative mt-4">
              <div
                ref={stripRef}
                className="flex gap-3 overflow-x-auto scroll-smooth px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`w-[18%] shrink-0 overflow-hidden rounded-lg transition-all ${
                      active === i ? "ring-2 ring-brand" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} view ${i + 1}`}
                      loading="lazy"
                      width={320}
                      height={240}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => scrollStrip(-1)}
                aria-label="Scroll thumbnails left"
                className="absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:border-brand hover:text-brand"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                onClick={() => scrollStrip(1)}
                aria-label="Scroll thumbnails right"
                className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:border-brand hover:text-brand"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-10 border-t border-border pt-7">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                Description
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>

          {/* Right — buy panel (borderless) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h1 className="font-display text-4xl font-extrabold uppercase leading-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {variant.label} · {tier === "mid" ? "Game-Ready" : "Render / ArchViz"} ·{" "}
              {product.style}
            </p>

            <p className="mt-6 font-display text-3xl font-extrabold text-foreground">
              {formatPrice(variant.price)}
            </p>

            {owned ? (
              <div
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                aria-label="Already purchased"
              >
                <Check className="h-4 w-4" aria-hidden />
                In your library
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden />
                {addToCartMutation.isPending
                  ? "Adding…"
                  : unavailable || addToCartMutation.isError
                    ? "Couldn't add — try again"
                    : addToCartMutation.isSuccess
                      ? "Added to Cart"
                      : product.price === 0
                        ? "Add to Cart — free"
                        : "Add to Cart"}
              </button>
            )}

            {/* Download — only once the model is in the shopper's library.
                This is a convenience gate; the real check is server-side
                when the signed download link is generated (doc/bugs #8). */}
            <div className="relative mt-3">
              <button
                onClick={() => owned && setOpenDownload((o) => !o)}
                disabled={!owned}
                aria-expanded={openDownload}
                title={owned ? undefined : "Purchase this model to download it"}
                className="flex w-full items-center justify-between rounded-full border border-brand/50 bg-brand-soft px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground disabled:hover:bg-transparent"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  {owned ? "Download" : "Purchase to download"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openDownload ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {openDownload && (
                <ul className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {formats.map(([f, size]) => (
                    <li key={f}>
                      <button className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors last:border-0 hover:bg-secondary hover:text-foreground">
                        <span>{f}</span>
                        <span className="text-xs text-muted-foreground/70">{size}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-soft px-5 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                  Unlimited subscription
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  $19<span className="text-base font-medium text-muted-foreground">/mo</span> ·
                  cancel anytime
                </p>
              </div>
              <button
                onClick={openSubscribe}
                className="rounded-full bg-brand px-8 py-3.5 text-base font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
              >
                Subscribe
              </button>
            </div>

            {/* Tech specs */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Product specification
              </p>
              <dl className="mt-4 space-y-3.5 text-base">
                {specs.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                    <dt className="w-32 shrink-0 font-semibold text-foreground">{label}</dt>
                    <dd className="text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        <section className="pt-16">
          <h2 className="text-2xl font-bold text-foreground">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} tier={tier} />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
