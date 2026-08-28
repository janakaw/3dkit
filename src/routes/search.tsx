import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

type SearchParams = { q?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search 3D Furniture Models — 3Dkit" },
      {
        name: "description",
        content:
          "Search the 3Dkit library of original 3D furniture models by name, category, style or type.",
      },
      { property: "og:title", content: "Search 3D Furniture Models — 3Dkit" },
      { property: "og:description", content: "Find the right 3D furniture model in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const query = (q ?? "").trim().toLowerCase();

  const results = query
    ? products.filter((p) =>
        [p.name, p.category, p.subcategory ?? "", p.style].join(" ").toLowerCase().includes(query),
      )
    : products;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Search models
        </h1>

        <div className="mt-6 flex max-w-xl items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
          <SearchIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={q ?? ""}
            onChange={(e) =>
              navigate({
                search: { q: e.target.value || undefined },
                replace: true,
                resetScroll: false,
              })
            }
            placeholder="Search sofas, armchairs, dining sets…"
            aria-label="Search 3D models"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {results.length} model{results.length === 1 ? "" : "s"}
          {query ? ` for “${q}”` : ""}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
