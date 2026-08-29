import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { PAGE_SIZE, categoryFromSlug, getProducts, setSubcategories, styles } from "@/lib/catalog";

type CategorySearch = {
  page?: number | undefined;
  sub?: string | undefined;
  style?: string | undefined;
};

export const Route = createFileRoute("/category/$category")({
  validateSearch: (search: Record<string, unknown>): CategorySearch => ({
    page: Number(search["page"]) > 1 ? Number(search["page"]) : undefined,
    sub: typeof search["sub"] === "string" ? (search["sub"] as string) : undefined,
    style: typeof search["style"] === "string" ? (search["style"] as string) : undefined,
  }),
  loader: async ({ params }) => {
    const category = categoryFromSlug(params.category);
    if (!category) throw notFound();
    const products = await getProducts();
    return { category, products };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Category not found — 3Dkit" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.category} 3D Models — 3Dkit`;
    const description = `Browse original ${loaderData.category.toLowerCase()} 3D models with 4K PBR textures for archviz, interior design and game development.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData();
  const { page = 1, sub, style } = Route.useSearch();
  const navigate = useNavigate({ from: "/category/$category" });

  const setSearch = (next: CategorySearch) =>
    navigate({ search: next, resetScroll: false, replace: true });

  const filtered = products.filter((p) => {
    if (p.category !== category) return false;
    if (sub && p.subcategory !== sub) return false;
    if (style && p.style !== style) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 py-10">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">{category}</span>
        </nav>

        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          {category}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {filtered.length} model{filtered.length === 1 ? "" : "s"} · page {current} of {totalPages}
        </p>

        {category === "Set" && (
          <div className="mt-5 flex flex-wrap gap-2">
            {setSubcategories.map((s) => (
              <button
                key={s}
                onClick={() => setSearch({ sub: sub === s ? undefined : s, style })}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  sub === s
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Design style
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setSearch({ sub })}
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
                onClick={() => setSearch({ sub, style: style === s ? undefined : s })}
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

        <div className="mt-7 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No models match these filters yet — more are on the way.
          </p>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={current === 1}
              onClick={() => setSearch({ sub, style, page: current - 1 })}
              className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSearch({ sub, style, page: n })}
                className={`h-9 w-9 rounded-full border text-sm transition-colors ${
                  n === current
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              disabled={current === totalPages}
              onClick={() => setSearch({ sub, style, page: current + 1 })}
              className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
