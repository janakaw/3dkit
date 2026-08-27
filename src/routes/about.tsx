import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About 3Dkit — Furniture 3D Model Studio" },
      {
        name: "description",
        content:
          "3Dkit builds high-poly archviz and game-ready mid-poly furniture models for architects, interior designers and game creators.",
      },
      { property: "og:title", content: "About 3Dkit" },
      {
        property: "og:description",
        content: "Who we are and how our furniture 3D models are built, textured and tested.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pt-14">
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          About 3Dkit
        </h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          3Dkit is a small studio of modellers and lighting artists making furniture assets we
          actually want to use in our own projects. Every model ships in two builds: a high-poly
          archviz version tuned for Corona, V-Ray and FStorm, and a mid-poly, game-ready version
          with baked normals and LODs for Unreal and Unity.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Real-world dimensions, clean quad topology, non-overlapping UVs and named objects come
          standard. Every asset is test-rendered and test-imported into an engine before release.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { k: "2,000+", v: "Curated furniture sets" },
            { k: "2 builds", v: "High-poly and mid-poly in every purchase" },
            { k: "Lifetime", v: "Free updates and support" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-border bg-card p-5">
              <p className="font-display text-2xl font-extrabold text-foreground">{s.k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
        <Link
          to="/"
          className="mt-10 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Browse the collection
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
