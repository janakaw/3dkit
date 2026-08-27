import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Box,
  Download,
  FileText,
  Grid2x2,
  RefreshCw,
  Sparkles,
  LifeBuoy,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, getProduct, products } from "@/lib/products";

export const Route = createFileRoute("/product/$slug")({
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
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [tab, setTab] = useState<"overview" | "specifications" | "gallery">("overview");
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  const facts = [
    { icon: FileText, label: "File Format", value: product.formats },
    { icon: Grid2x2, label: "Textures", value: product.textures },
    { icon: Box, label: "Geometry", value: `Quad-dominant, ${product.polys}` },
    { icon: RefreshCw, label: "Render Engines", value: product.renderers },
    { icon: Sparkles, label: "Category", value: product.category },
    { icon: LifeBuoy, label: "Support", value: "Lifetime updates" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-5 pt-6">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-5 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src={product.image}
                alt={`${product.name} 3D model render`}
                width={1400}
                height={1000}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-8 flex gap-6 border-b border-border">
              {(["overview", "specifications", "gallery"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-3 text-sm capitalize transition-colors ${
                    tab === t
                      ? "border-foreground font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="pt-5 text-sm text-foreground">
              {tab === "overview" && (
                <p className="max-w-2xl leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
              {tab === "specifications" && (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.specs.map((s) => (
                    <li key={s} className="flex gap-2 text-muted-foreground">
                      <span aria-hidden>•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {tab === "gallery" && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[product, ...related.slice(0, 3)].map((p) => (
                    <img
                      key={p.slug}
                      src={p.image}
                      alt={`${p.name} preview`}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="aspect-square rounded-lg border border-border object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside>
            <h1 className="font-display text-3xl font-extrabold uppercase leading-tight text-foreground">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              3D Model Asset • High Poly • Textured
            </p>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatPrice(product.price)}</p>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
              <Download className="h-4 w-4" aria-hidden />
              {product.price === 0 ? "Download free model" : "Add to cart & download"}
            </button>
            <button className="mt-3 w-full rounded-lg border border-border bg-secondary px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              Add to Wishlist
            </button>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="inline font-semibold text-foreground">{label}: </dt>
                    <dd className="inline text-muted-foreground">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <section className="pt-16">
          <h2 className="text-2xl font-bold text-foreground">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
