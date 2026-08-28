import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import {
  categories,
  getType,
  products,
  setSubcategories,
  styles,
  types,
} from "@/lib/products";

export const Route = createFileRoute("/midpoly")({
  head: () => ({
    meta: [
      { title: "Mid-Poly Furniture — Game-Ready 3D Assets | 3Dkit" },
      {
        name: "description",
        content:
          "Browse game-ready mid-poly furniture: baked normals, LODs and 2K PBR textures in FBX, GLB and OBJ for Unreal and Unity.",
      },
      { property: "og:title", content: "Mid-Poly Furniture — Game-Ready 3D Assets" },
      {
        property: "og:description",
        content:
          "Optimised, atlased furniture models built for Unreal and Unity projects — the same library, game-ready.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MidPolyPage,
});

function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value?: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
          value
            ? "border-foreground bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {value ?? label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg">
          <button
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            All {label.toLowerCase()}
          </button>
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary hover:text-foreground ${
                value === o ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MidPolyPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sub, setSub] = useState<string | undefined>(undefined);
  const [style, setStyle] = useState<string | undefined>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.category !== category) return false;
        if (sub && p.subcategory !== sub) return false;
        if (style && p.style !== style) return false;
        if (type && getType(p.slug) !== type) return false;
        if (freeOnly && p.price !== 0) return false;
        return true;
      }),
    [category, sub, style, type, freeOnly],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 pt-10">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          All Product
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mid-poly · game-ready · baked normals, LODs and 2K PBR atlases for Unreal and Unity.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setCategory(undefined);
              setSub(undefined);
            }}
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
              onClick={() => {
                setCategory(c);
                setSub(undefined);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                category === c
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setFreeOnly((f) => !f)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              freeOnly
                ? "border-foreground bg-accent text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Free
          </button>
        </div>

        {category === "Set" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {setSubcategories.map((s) => (
              <button
                key={s}
                onClick={() => setSub(sub === s ? undefined : s)}
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

        <div className="mt-4 flex flex-wrap gap-2">
          <Dropdown label="Style" options={styles} value={style} onChange={setStyle} />
          <Dropdown label="Type" options={types} value={type} onChange={setType} />
          <span className="self-center text-xs text-muted-foreground">
            {filtered.length} model{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} tier="mid" />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No mid-poly models match these filters yet.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
