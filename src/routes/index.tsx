import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { heroImage, newReleases, products } from "@/lib/products";

export const Route = createFileRoute("/")({
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
    ],
  }),
  component: Index,
});

const categories = ["Armchair", "Sofa", "Coffee Table", "Cabinet", "Ottoman", "Set"];

function Index() {
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
            <h1 className="max-w-2xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-primary-foreground md:text-5xl">
              Premium 3D asset sets for architects, designers &amp; game creators.
            </h1>
            <p className="mt-4 max-w-md text-sm text-primary-foreground/85 md:text-base">
              Access custom-tailored assets: available for subscription or individual model sale.
            </p>
            <a
              href="#collection"
              className="mt-7 inline-flex w-fit items-center rounded-full border border-primary-foreground/70 px-7 py-3 text-sm font-medium uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-foreground"
            >
              Explore the collection
            </a>
          </div>
          <button className="absolute bottom-5 right-5 hidden rounded-full bg-card px-6 py-3 text-sm font-semibold uppercase tracking-wide text-foreground shadow-lg md:block">
            Subscribe for unlimited access
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 pt-14">
        <h2 className="text-2xl font-bold text-foreground">New Releases</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
          {newReleases.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-[1400px] px-5 pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">All Models</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c}
                id={c.toLowerCase().replace(" ", "-")}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Looking for something specific?{" "}
          <Link to="/" className="underline">
            Browse by category
          </Link>
          .
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
