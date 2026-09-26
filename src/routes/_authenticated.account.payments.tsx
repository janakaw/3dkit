import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { HttpTypes } from "@medusajs/types";
import { AccountEmptyState, AccountPage } from "@/components/AccountPage";
import { formatPrice } from "@/lib/catalog";
import { ordersQueryOptions } from "@/lib/medusa/orders-query";

// Account → Payments: one row per order (= one card payment), newest first,
// with the model(s) bought and the amount actually charged — read from the
// order itself, so it stays correct even if catalogue prices change later.
// Receipts go out by email, so there are deliberately no invoice links here.
export const Route = createFileRoute("/_authenticated/account/payments")({
  head: () => ({
    meta: [{ title: "Payments — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  component: PaymentsPage,
});

const formatDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

// Only non-routine states get a label; a normal, captured payment shows none.
function statusLabel(order: HttpTypes.StoreOrder): string | null {
  if (order.status === "canceled") return "Cancelled";
  switch (order.payment_status) {
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partly refunded";
    case "not_paid":
    case "awaiting":
    case "authorized":
    case "requires_action":
      return "Pending";
    default:
      return null;
  }
}

function PaymentsPage() {
  const ordersQuery = useQuery(ordersQueryOptions());
  const orders = ordersQuery.data ?? [];

  return (
    <AccountPage
      title="Payments"
      subtitle={
        ordersQuery.isSuccess
          ? `${orders.length} ${orders.length === 1 ? "payment" : "payments"}`
          : "Your payment history"
      }
    >
      {ordersQuery.isPending && (
        <p className="mt-12 text-sm text-muted-foreground">Loading your payments…</p>
      )}
      {ordersQuery.isError && (
        <p className="mt-12 text-sm text-destructive">
          Your payments could not be loaded right now — please refresh.
        </p>
      )}
      {ordersQuery.isSuccess && orders.length === 0 && (
        <AccountEmptyState title="No payments yet">
          <p>Models you buy will be listed here with the date and amount paid.</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
          >
            Browse all models
          </Link>
        </AccountEmptyState>
      )}
      {orders.length > 0 && (
        <div className="mt-12 max-w-4xl">
          <div className="hidden grid-cols-[130px_100px_1fr_140px] gap-4 border-b border-border pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground md:grid">
            <span>Date</span>
            <span>Order</span>
            <span>Model</span>
            <span className="text-right">Amount</span>
          </div>
          <ul>
            {orders.map((order) => (
              <PaymentRow key={order.id} order={order} />
            ))}
          </ul>
        </div>
      )}
    </AccountPage>
  );
}

function PaymentRow({ order }: { order: HttpTypes.StoreOrder }) {
  const items = order.items ?? [];
  const status = statusLabel(order);
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-border py-4 text-sm md:grid-cols-[130px_100px_1fr_140px] md:items-start">
      <span className="text-muted-foreground md:text-foreground">
        {formatDate(order.created_at)}
      </span>
      <span className="text-right text-muted-foreground md:text-left">
        #{order.display_id ?? order.id}
      </span>
      <ul className="col-span-2 space-y-1 md:col-span-1">
        {items.map((item) => {
          const name = item.product_title ?? item.title;
          return (
            <li key={item.id} className="flex items-baseline justify-between gap-3">
              {item.product_handle ? (
                <Link
                  to="/product/$slug"
                  params={{ slug: item.product_handle }}
                  className="font-medium text-foreground transition-colors hover:text-brand"
                >
                  {name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{name}</span>
              )}
              {/* Per-model prices only matter when one payment covered several. */}
              {items.length > 1 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatPrice(item.unit_price)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <span className="col-span-2 flex items-center justify-between gap-2 md:col-span-1 md:flex-col md:items-end md:justify-start">
        <span className="font-semibold text-foreground">{formatPrice(order.total ?? 0)}</span>
        {status && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {status}
          </span>
        )}
      </span>
    </li>
  );
}
