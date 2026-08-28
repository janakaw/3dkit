import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { openSubscribe } from "@/components/SubscribeModal";
import {
  categories,
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
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    sub: typeof search["sub"] === "string" ? (search["sub"] as string) : undefined,
    style: typeof search["style"] === "string" ? (search["style"] as string) : undefined,
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
  const { category, sub, style } = Route.useSearch();
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
            className="h-[420px] w-full object-cover md:h-[520px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 via-foreground/40 to-transparent" />
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
            <div className="mt-7 flex flex-wrap items-center gap-3">
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
            </div>
          </div>
          <button
            onClick={openSubscribe}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded-l-full bg-primary-foreground py-4 pl-8 pr-6 text-xs font-semibold uppercase tracking-[0.12em] text-foreground shadow-lg transition-opacity hover:opacity-90 lg:block"
          >
            Subscribe for unlimited access
          </button>
          <button
            onClick={openSubscribe}
            className="absolute bottom-4 left-6 rounded-full bg-primary-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wide text-foreground transition-opacity hover:opacity-90 lg:hidden"
          >
            Subscribe for unlimited access
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
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
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
