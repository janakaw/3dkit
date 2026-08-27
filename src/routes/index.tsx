import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Check, Gamepad2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import {
  categories,
  heroImage,
  newReleases,
  products,
  setSubcategories,
  type PolyTier,
} from "@/lib/products";

type IndexSearch = { category?: string; sub?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
    sub: typeof search.sub === "string" ? search.sub : undefined,
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
  const { category, sub } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [tier, setTier] = useState<PolyTier>("high");

  const setSearch = (next: IndexSearch) => navigate({ search: next });

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        if (sub && p.subcategory !== sub) return false;
        return true;
      }),
    [category, sub],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative mx-auto max-w-[1400px] px-3 pt-3">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={heroImage}
            alt="Photorealistic 3D rendered modern living room interior"
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
              2,000+ curated sets. One subscription. High-poly and game-ready in every set.
            </p>
            <a
              href="#collection"
              className="mt-7 inline-flex w-fit items-center rounded-full border border-primary-foreground/70 px-7 py-3 text-sm font-medium uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
            >
              Explore the collection
            </a>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="mx-auto mt-10 max-w-[1400px] px-5">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-7 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
              Subscribe for unlimited access
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              One plan, the whole library. Download any model in both high-poly and mid-poly
              builds, as often as you like — and cancel at any time from your account page. No
              contract, no download limits, and every file you have already downloaded stays
              licensed to you.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                "Unlimited downloads, all categories",
                "Both high-poly and mid-poly builds",
                "Cancel anytime — keeps working till period end",
                "Commercial licence on every asset",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-xl bg-secondary p-6">
            <p className="text-sm text-muted-foreground">Full library plan</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
              $29<span className="text-base font-medium text-muted-foreground"> / month</span>
            </p>
            <button className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
              Start free trial
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              7 days free · cancel any time in 2 clicks
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pt-14">
        <h2 className="text-2xl font-bold text-foreground">New Releases</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {newReleases.map((p) => (
            <ProductCard key={p.slug} product={p} tier={tier} />
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

        {/* Poly tier tabs */}
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">What are you looking for?</p>
          <div className="mt-3 grid max-w-xl grid-cols-2 gap-3">
            {(
              [
                {
                  id: "high" as const,
                  icon: Building2,
                  title: "High-poly",
                  sub: "Archviz render (Corona / V-Ray)",
                },
                {
                  id: "mid" as const,
                  icon: Gamepad2,
                  title: "Mid-poly",
                  sub: "Game engine (Unreal / Unity)",
                },
              ]
            ).map(({ id, icon: Icon, title, sub: s }) => (
              <button
                key={id}
                onClick={() => setTier(id)}
                aria-pressed={tier === id}
                className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-4 transition-colors ${
                  tier === id
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="text-sm font-semibold">{title}</span>
                <span className="text-[11px] opacity-80">{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({})}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              !category
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSearch({ category: c })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                category === c && !sub
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {category === "Set" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {setSubcategories.map((s) => (
              <button
                key={s}
                onClick={() => setSearch({ category: "Set", sub: sub === s ? undefined : s })}
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

        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} tier={tier} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No models in this category yet — more are on the way.
          </p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
