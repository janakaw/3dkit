import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatPrice, products } from "@/lib/products";
import { openSubscribe } from "@/components/SubscribeModal";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — 3Dkit 3D Furniture Models" },
      {
        name: "description",
        content:
          "Review the 3D furniture models in your 3Dkit cart and check out, or switch to an unlimited subscription.",
      },
      { property: "og:title", content: "Your Cart — 3Dkit" },
      { property: "og:description", content: "Review your selected 3D furniture models and check out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const [items, setItems] = useState(products.filter((p) => p.price > 0).slice(0, 3));
  const subtotal = items.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Your cart
        </h1>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Your cart is empty.{" "}
            <Link to="/" hash="collection" className="font-semibold text-brand hover:underline">
              Browse all models
            </Link>
          </p>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
            <ul className="space-y-4">
              {items.map((p) => (
                <li key={p.slug} className="flex items-center gap-4 border-b border-border pb-4">
                  <img
                    src={p.image}
                    alt={`${p.name} 3D model`}
                    loading="lazy"
                    width={160}
                    height={160}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="text-base font-semibold text-foreground hover:text-brand"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {p.category} · High-poly
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatPrice(p.price)}</p>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => setItems((cur) => cur.filter((i) => i.slug !== p.slug))}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl bg-secondary p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Order summary
              </p>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl font-extrabold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <button className="mt-5 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90">
                Checkout
              </button>
              <button
                onClick={openSubscribe}
                className="mt-3 w-full rounded-full border border-brand px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
              >
                Or subscribe from $19/mo
              </button>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
