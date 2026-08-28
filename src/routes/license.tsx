import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/license")({
  head: () => ({
    meta: [
      { title: "Standard License — 3Dkit 3D Furniture Models" },
      {
        name: "description",
        content:
          "What you can and cannot do with 3Dkit furniture models: commercial archviz renders, game builds, client work and redistribution rules.",
      },
      { property: "og:title", content: "Standard License — 3Dkit" },
      {
        property: "og:description",
        content: "Commercial usage rights for every 3Dkit furniture model you download.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LicensePage,
});

function LicensePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalPage
        title="Standard License"
        intro="Every model on 3Dkit is designed in our own studio, so the license you get is clean and unencumbered. This applies to both subscription downloads and individual purchases."
        sections={[
          {
            heading: "You can",
            body: "Use the models in commercial archviz stills and animations, interior design presentations, client projects, marketing images, and in shipped PC, console and mobile games — including paid titles, with no revenue cap on the Studio plan.",
          },
          {
            heading: "You can also",
            body: "Modify, retopologise, re-texture, combine and rescale the assets, and keep using every file you downloaded forever, even after your subscription ends.",
          },
          {
            heading: "You cannot",
            body: "Resell, share, sublicense or redistribute the source files (MAX, FBX, OBJ, Blender, textures) on their own, or as part of another asset pack, template or marketplace listing.",
          },
          {
            heading: "You cannot",
            body: "Use the files to train AI or machine-learning models, or upload them to a public dataset or shared drive outside your own team.",
          },
          {
            heading: "Team use",
            body: "Freelancer covers one seat. Studio covers unlimited seats inside one company. Contractors may use the files only while working on your project.",
          },
          {
            heading: "Attribution",
            body: "No credit is required, though it is always welcome.",
          },
        ]}
      />
      <SiteFooter />
    </div>
  );
}
