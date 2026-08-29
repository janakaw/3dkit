import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/catalog";
import { openSubscribe } from "@/components/SubscribeModal";
import { updateLineItem, deleteLineItem } from "@/lib/medusa/cart";
import { CART_QUERY_KEY, cartQueryOptions } from "@/lib/medusa/cart-query";

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
      {
        property: "og:description",
        content: "Review your selected 3D furniture models and check out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // Real cart, not the mock-seeded state this route used to hold — see
  // decisions doc, Tier 3 (cart) entry. `ensureQueryData` seeds the shared
  // `["cart"]` query (see cart-query.ts) server-side during SSR — reading
  // the `_medusa_cart_id` cookie — so the page has cart data on first
  // paint; a first-time visitor with no cart yet gets `null`, handled the
  // same as the old "empty cart" case.
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQueryOptions()),
  component: CartPage,
});

function CartPage() {
  const initialCart = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { data: cart } = useQuery({ ...cartQueryOptions(), initialData: initialCart });
  const [pendingLineId, setPendingLineId] = useState<string | null>(null);
  const items = cart?.items ?? [];

  const clampMutation = useMutation({
    mutationFn: updateLineItem,
    onSuccess: (updated) => queryClient.setQueryData(CART_QUERY_KEY, updated),
    onError: (err) => console.error("Failed to clamp line item quantity to 1:", err),
  });

  // Digital goods: quantity is always exactly 1 (a license to one model,
  // not a stackable physical item) — `addToCart` now refuses to bump an
  // existing line above 1, but a cart created before that fix (or one
  // whose quantity was bumped some other way) can still be carrying a
  // stale >1 value. Clamp it down here so the cart self-heals instead of
  // just displaying wrong numbers forever. `clampMutation.isPending` stops
  // this from firing again for the same over-quantity line while the fix
  // is already in flight (the mutation object itself isn't a stable
  // dependency, so it's checked inside the effect rather than listed in
  // the dependency array).
  useEffect(() => {
    const overQuantity = cart?.items?.find((item) => item.quantity > 1);
    if (!overQuantity || clampMutation.isPending) return;
    clampMutation.mutate({ data: { lineId: overQuantity.id, quantity: 1 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clampMutation is a fresh object every render; including it would re-run this on every render instead of only when `cart` changes.
  }, [cart]);

  const removeMutation = useMutation({
    mutationFn: deleteLineItem,
    onMutate: (variables) => setPendingLineId(variables.data),
    onSuccess: (updated) => queryClient.setQueryData(CART_QUERY_KEY, updated),
    onError: (err) => console.error("Failed to remove item:", err),
    onSettled: () => setPendingLineId(null),
  });

  const handleRemove = (lineId: string) => {
    removeMutation.mutate({ data: lineId });
  };

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
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 border-b border-border pb-4">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={`${item.product_title ?? item.title} 3D model`}
                      loading="lazy"
                      width={160}
                      height={160}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {item.product_handle ? (
                      <Link
                        to="/product/$slug"
                        params={{ slug: item.product_handle }}
                        className="text-base font-semibold text-foreground hover:text-brand"
                      >
                        {item.product_title ?? item.title}
                      </Link>
                    ) : (
                      <span className="text-base font-semibold text-foreground">
                        {item.product_title ?? item.title}
                      </span>
                    )}
                    {/* One license per model — quantity is fixed at 1, not an
                        editable stack count (see the digital-goods decisions
                        in the decisions doc). */}
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      Qty 1
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">{formatPrice(item.unit_price)}</p>
                  <button
                    aria-label={`Remove ${item.product_title ?? item.title}`}
                    onClick={() => handleRemove(item.id)}
                    disabled={pendingLineId === item.id}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
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
                  {formatPrice(cart?.total ?? 0)}
                </span>
              </div>
              {/* Checkout still needs a payment session before
                  `sdk.store.cart.complete()` will succeed for a non-zero
                  cart — that's the next tier (checkout/payment), not this
                  one. Left as a placeholder button on purpose. */}
              <button
                disabled
                title="Checkout is coming in the next porting step (payment)"
                className="mt-5 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground opacity-60"
              >
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
