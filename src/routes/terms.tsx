import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — 3Dkit 3D Furniture Models" },
      {
        name: "description",
        content:
          "The terms that govern your 3Dkit account, subscriptions, individual model purchases and downloads.",
      },
      { property: "og:title", content: "Terms of Service — 3Dkit" },
      {
        property: "og:description",
        content: "Account, subscription, purchase and download terms for the 3Dkit asset store.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <LegalPage
        title="Terms of Service"
        intro="These terms apply to every account, subscription and individual model purchase on 3Dkit."
        sections={[
          {
            heading: "1. Your account",
            body: "You are responsible for keeping your login details safe and for all downloads made from your account. One account belongs to one person on the Freelancer plan; Studio plan accounts may be shared across your team.",
          },
          {
            heading: "2. Subscriptions and billing",
            body: "Subscriptions renew monthly on the date you signed up and are charged to the payment method on file. You can cancel at any time from your account page — access continues to the end of the paid month and no further charges are made.",
          },
          {
            heading: "3. Download allowances",
            body: "Freelancer includes 5 model downloads per month and Studio includes 15. Unused downloads do not carry over. Files you already downloaded stay licensed to you forever, even after you cancel.",
          },
          {
            heading: "4. Individual purchases",
            body: "Models bought individually are yours to use under the Standard License with no time limit. Because files are delivered digitally and immediately, purchases are non-refundable once downloaded, except where the file is faulty.",
          },
          {
            heading: "5. Acceptable use",
            body: "You may not resell, redistribute, share or sublicense our source files, or upload them to another asset marketplace, AI training set or model library.",
          },
          {
            heading: "6. Changes",
            body: "We may update these terms as the store grows. Material changes will be announced by email before they take effect.",
          },
        ]}
      />
      <SiteFooter />
    </div>
  );
}
