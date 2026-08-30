import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { HttpTypes } from "@medusajs/types";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/catalog";
import { retrieveOrder } from "@/lib/medusa/orders";

export const Route = createFileRoute("/order/$orderId/confirmed")({
  head: () => ({
    meta: [{ title: "Order confirmed — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  // Guest-accessible by design — see orders.server.ts's header comment on
  // why retrieving a single order by id doesn't require the shopper to be
  // signed in as a Medusa customer, unlike listing orders.
  loader: async ({ params }) => {
    const order = await retrieveOrder({ data: params.orderId });
    if (!order) throw notFound();
    return order;
  },
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const order = Route.useLoaderData();
  const items = order.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[700px] px-5 py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Thank you!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order{" "}
          <span className="font-semibold text-foreground">#{order.display_id ?? order.id}</span> is
          confirmed.
          {order.email && <> A receipt has been sent to {order.email}.</>}
        </p>

        {/* Digital fulfillment (serving the actual download links here) is
            a separate, not-yet-built concern — see decisions doc. This
            page confirms the purchase; it doesn't deliver the files. */}
        <ul className="mt-8 space-y-3 text-left">
          {items.map((item: HttpTypes.StoreOrderLineItem) => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b border-border pb-3"
            >
              <span className="text-foreground">{item.product_title ?? item.title}</span>
              <span className="font-semibold text-foreground">{formatPrice(item.unit_price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatPrice(order.total ?? 0)}</span>
        </div>

        <Link
          to="/"
          hash="collection"
          className="mt-10 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
        >
          Continue shopping
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
