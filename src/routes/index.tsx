import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { openSubscribe } from "@/components/SubscribeModal";
import {
  PAGE_SIZE,
  categories,
  categorySlug,
  heroImage,
  newReleases,
  products,
  setSubcategories,
  styles,
} from "@/lib/products";

type IndexSearch = {
  category?: string | undefined;
  sub?: string | undefined;
  style?: string | undefined;
  page?: number | undefined;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    sub: typeof search["sub"] === "string" ? (search["sub"] as string) : undefined,
    style: typeof search["style"] === "string" ? (search["style"] as string) : undefined,
    page: Number(search["page"]) > 1 ? Number(search["page"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "3Dkit — Premium 3D Furniture Models for Architects & Designers" },
      {
        name: "description",
        content:
          "Download photorealistic 3D furniture models — sofas, armchairs, tables and complete sets in MAX, FBX and OBJ with 4K PBR textures.",
      },
      { property: "og:title", content: "3Dkit — Premium 3D Furniture Asset Store" },
      {
        property: "og:description",
        content:
          "Browse and download high-poly, fully textured 3D furniture models for interior visualisation and game creation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { category, sub, style, page = 1 } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const setSearch = (next: IndexSearch) =>
    navigate({ search: next, resetScroll: false, replace: true });

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        if (sub && p.subcategory !== sub) return false;
        if (style && p.style !== style) return false;
        return true;
      }),
    [category, sub, style],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative mx-auto max-w-[1400px] px-3 pt-3">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={heroImage}
            alt="Custom-designed 3D living room set with modular sofa, marble coffee table and lounge chair"
            width={1920}
            height={912}
            className="h-[480px] w-full object-cover md:h-[600px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.30_0.003_260/0.72)] via-[oklch(0.35_0.003_260/0.38)] to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/75">
              For architects, designers and game creators
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-primary-foreground md:text-5xl">
              Premium 3D furniture sets, ready for render or engine.
            </h1>
            <p className="mt-4 max-w-md text-sm text-primary-foreground/85 md:text-base">
              Access custom-tailored asset sets — available by subscription or individual model
              sale — for archviz, interior designers, architects and game creators.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#collection"
                className="inline-flex w-fit items-center rounded-full border border-primary-foreground/70 px-7 py-3 text-sm font-medium uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
              >
                Explore the collection
              </a>
              <Link
                to="/midpoly"
                className="inline-flex w-fit items-center rounded-full bg-brand px-7 py-3 text-sm font-medium uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
              >
                Mid-poly for game →
              </Link>
              <button
                onClick={openSubscribe}
                className="group absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-6 overflow-hidden rounded-2xl bg-brand py-4 pl-7 pr-6 text-left text-brand-foreground shadow-xl ring-1 ring-primary-foreground/20 transition-transform hover:scale-[1.02] lg:flex">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] opacity-90">
                    Unlimited access
                  </span>
                  <span className="mt-1 block font-display text-xl font-extrabold uppercase tracking-tight">
                    Subscribe from $19/mo
                  </span>
                </span>
                <span className="relative whitespace-nowrap rounded-full bg-primary-foreground/15 px-5 py-2.5 text-xs font-bold uppercase tracking-wide">
                  Cancel anytime →
                </span>
              </button>
            </div>
          </div>
          <button
            onClick={openSubscribe}
            className="absolute bottom-4 left-6 rounded-full bg-brand px-6 py-3 text-xs font-bold uppercase tracking-wide text-brand-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
          >
            Subscribe $19/mo — unlimited access
          </button>
        </div>
      </section>

      {/* New releases — one row of 4 */}
      <section className="mx-auto max-w-[1400px] px-5 pt-12">
        <h2 className="text-2xl font-bold text-foreground">New Releases</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {newReleases.slice(0, 4).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-[1400px] px-5 pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">All Models</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} model{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Category filters */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Category
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setSearch({ style })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                !category
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSearch({ category: c, style })}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  category === c && !sub
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {category === "Set" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {setSubcategories.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setSearch({ category: "Set", sub: sub === s ? undefined : s, style })
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  sub === s
                    ? "border-foreground bg-accent text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Design style filters */}
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Design style
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setSearch({ category, sub })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                !style
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All styles
            </button>
            {styles.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setSearch({ category, sub, style: style === s ? undefined : s })
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  style === s
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSearch({ category, sub, style, page: n })}
                className={`h-9 w-9 rounded-full border text-sm transition-colors ${
                  n === current
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {category && (
          <div className="mt-8 text-center">
            <Link
              to="/category/$category"
              params={{ category: categorySlug(category) }}
              className="inline-flex rounded-full border border-brand px-6 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Open the full {category} page →
            </Link>
          </div>
        )}
        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No models match these filters yet — more are on the way.
          </p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
