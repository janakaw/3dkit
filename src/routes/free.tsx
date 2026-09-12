import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

export const Route = createFileRoute("/free")({
  head: () => ({
    meta: [
      { title: "Free 3D Furniture Models — FREE3D | 3Dkit" },
      {
        name: "description",
        content:
          "Download free 3D furniture models with PBR textures, licensed for commercial use in archviz renders and game engines.",
      },
      { property: "og:title", content: "FREE3D — Free 3D Furniture Models" },
      {
        property: "og:description",
        content: "A rotating selection of free, fully textured furniture models from 3Dkit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreePage,
});

function FreePage() {
  const free = products.filter((p) => p.price === 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 pt-14">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          FREE3D
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          A rotating selection of free models, licensed for commercial use. Same topology and
          texture standards as our paid library.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {free.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
