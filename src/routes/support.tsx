import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support & FAQ — 3Dkit 3D Furniture Models" },
      {
        name: "description",
        content:
          "Answers on file formats, downloads, subscriptions, render engines and game-engine imports for 3Dkit furniture models.",
      },
      { property: "og:title", content: "Support & FAQ — 3Dkit" },
      {
        property: "og:description",
        content: "Help with downloads, formats, subscriptions and engine imports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalPage
        title="Support & FAQ"
        intro="Most questions are answered below. If yours is not, contact us and we usually reply within one business day."
        sections={[
          {
            heading: "Which formats do I get?",
            body: "High-poly archviz models ship as 3ds Max (Corona and V-Ray), FBX, OBJ and Blender, with 4K PBR textures. Mid-poly game builds ship as FBX, Unity and Unreal-ready packages with baked maps.",
          },
          {
            heading: "How do downloads work?",
            body: "Open any model page and use the Download button to pick your format. Subscription downloads count against your monthly allowance the first time you download a model — re-downloading the same model is always free.",
          },
          {
            heading: "Can I cancel my subscription?",
            body: "Yes, in two clicks from your account page. You keep access until the end of the paid month and every file you already downloaded stays licensed.",
          },
          {
            heading: "Are the models real-world scale?",
            body: "Yes. Everything is modelled to real dimensions in centimetres with clean quad topology, non-overlapping UVs and named objects.",
          },
          {
            heading: "A file will not open or looks wrong",
            body: "Send us the model name, your software and version, and a screenshot. We test-render and test-import every asset before release, so we will fix or replace it quickly.",
          },
        ]}
      >
        <div className="mt-10 rounded-2xl bg-secondary p-6">
          <p className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
            Still stuck?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team answers every message personally.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-flex rounded-full bg-brand px-7 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
          >
            Contact us
          </Link>
        </div>
      </LegalPage>
      <SiteFooter />
    </div>
  );
}
