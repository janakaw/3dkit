import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — 3Dkit 3D Furniture Library" },
      {
        name: "description",
        content:
          "Sign in to your 3Dkit account to download your licensed 3D furniture models and manage your subscription.",
      },
      { property: "og:title", content: "Sign In — 3Dkit" },
      { property: "og:description", content: "Access your 3Dkit downloads and subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back — access your downloads, licenses and subscription.
        </p>

        <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@studio.com"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
