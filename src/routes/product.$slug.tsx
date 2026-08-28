import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Box,
  ChevronDown,
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
import {
  formatPrice,
  getProduct,
  getVariant,
  products,
  type PolyTier,
} from "@/lib/products";

type ProductSearch = { tier?: PolyTier | undefined };

export const Route = createFileRoute("/product/$slug")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    tier: search["tier"] === "mid" ? "mid" : undefined,
  }),
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Model not found — 3Dkit" }, { name: "robots", content: "noindex" }] };
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
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);
  const formats = tier === "mid" ? midFormats : highFormats;

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

        <div className="mt-5 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          {/* Left — visuals + description */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src={product.image}
                alt={`${product.name} ${variant.label} 3D model render`}
                width={1400}
                height={1050}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              {related.slice(0, 3).map((p) => (
                <img
                  key={p.slug}
                  src={p.image}
                  alt={`${product.name} additional view`}
                  loading="lazy"
                  width={480}
                  height={320}
                  className="aspect-[3/2] w-full rounded-lg border border-border object-cover"
                />
              ))}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Description
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-foreground">
                In the box
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {product.specs.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                    <span aria-hidden>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — buy panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h1 className="font-display text-3xl font-extrabold uppercase leading-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              {variant.label} · {tier === "mid" ? "Game-Ready" : "Render / ArchViz"} ·{" "}
              {product.style}
            </p>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Buy individually
                </p>
                <p className="text-xl font-bold text-foreground">{formatPrice(variant.price)}</p>
                <p className="text-[11px] text-muted-foreground">One-time purchase · yours forever</p>
              </div>
              <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Add to Cart
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-secondary p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Unlimited subscription
                </p>
                <p className="text-sm font-semibold text-foreground">
                  $29/mo · cancel anytime
                </p>
              </div>
              <button className="rounded-full border border-foreground px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background">
                Subscribe
              </button>
            </div>

            {/* Download */}
            <div className="relative mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Download format
              </p>
              <button
                onClick={() => setOpenDownload((o) => !o)}
                aria-expanded={openDownload}
                className="mt-2 flex w-full items-center justify-between rounded-lg bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  {product.price === 0 ? "Download free model" : "Download"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openDownload ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {openDownload && (
                <ul className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                  {formats.map((f) => (
                    <li key={f}>
                      <button className="block w-full border-b border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors last:border-0 hover:bg-secondary hover:text-foreground">
                        {f}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">{variant.note}</p>
            </div>

            {/* Tech specs */}
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tech specs
              </p>
              <dl className="mt-3 space-y-2.5 text-sm">
                {specs.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <dt className="w-28 shrink-0 font-medium text-foreground">{label}</dt>
                    <dd className="text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {tier === "mid" ? (
                <Link to="/product/$slug" params={{ slug: product.slug }} className="underline">
                  View the high-poly archviz version
                </Link>
              ) : (
                <Link
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  search={{ tier: "mid" }}
                  className="underline"
                >
                  Need it game-ready? View the mid-poly version
                </Link>
              )}
            </p>
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
