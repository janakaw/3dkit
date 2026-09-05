import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { HttpTypes } from "@medusajs/types";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { initiatePaymentSession, placeOrder, updateCart } from "@/lib/medusa/cart";
import { CART_QUERY_KEY, cartQueryOptions } from "@/lib/medusa/cart-query";
import { getStripe } from "@/lib/medusa/stripe";

// Only one payment provider is configured on the backend right now
// (`pp_stripe_stripe` — confirmed against the live Store API, see
// decisions doc). If a second one is ever added, this is the one place
// that needs to grow a real "choose a payment method" step; until then,
// building that UI for a list of exactly one option would be pure
// unused complexity.
const STRIPE_PROVIDER_ID = "pp_stripe_stripe";

// [checkout-logging] Structured client-side logging for the whole
// checkout → payment → order flow. Plain `console.log`/`console.error`
// so it shows up in browser devtools (and can be grepped for the
// "[checkout]" prefix) — see cart.server.ts's `logCart` for the
// server-side half of this, which lands in Cloudflare's Workers logs
// instead. Browser console output is only ever visible if devtools
// happened to be open at the time, which is exactly why this alone
// isn't enough and the server-side half exists too.
function logCheckout(event: string, details?: Record<string, unknown>): void {
  console.log(`[checkout] ${event}`, details ?? {});
}

function logCheckoutError(event: string, error: unknown, details?: Record<string, unknown>): void {
  console.error(`[checkout] ${event}`, {
    ...(details ?? {}),
    error: error instanceof Error ? { message: error.message, name: error.name } : error,
  });
}

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  // Same shared `["cart"]` query the cart page and header read from (see
  // cart-query.ts) — checkout needs the live cart, not a stale copy.
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQueryOptions()),
  component: CheckoutPage,
});

type BillingFormState = {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  city: string;
  province: string;
  postalCode: string;
};

const emptyBillingForm: BillingFormState = {
  firstName: "",
  lastName: "",
  email: "",
  address1: "",
  city: "",
  province: "",
  postalCode: "",
};

function CheckoutPage() {
  const initialCart = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cart } = useQuery({ ...cartQueryOptions(), initialData: initialCart });

  // Nothing to check out — most likely a direct link visit, or the cart
  // was emptied in another tab. Bounce back rather than showing a blank
  // billing form for an empty order.
  useEffect(() => {
    // `cart` can be `null` outright (no cart cookie at all — a direct
    // link visit) as well as a real cart with zero items; both mean
    // there's nothing to check out. Also the path taken after the
    // completed-cart self-heal below clears the cookie and the query
    // refetches to `null` — this same check is what sends the shopper
    // back to `/cart` once that happens, rather than leaving them on a
    // checkout page bound to a cart that no longer exists.
    if (!cart || (cart.items?.length ?? 0) === 0) {
      void navigate({ to: "/cart", replace: true });
    }
  }, [cart, navigate]);

  const [billing, setBilling] = useState<BillingFormState>(emptyBillingForm);

  // Prefill the email from the shopper's 3Dkit account (Supabase auth — a
  // separate identity system from Medusa's own customer/guest-checkout
  // model, see decisions doc). Checkout now sits behind `_authenticated`
  // (see decisions doc, "block purchase without sign-up"), so a user is
  // always present here — this fetch is just to read the email, not to
  // gate anything itself. Medusa's own order creation still doesn't
  // require an authenticated Medusa customer; the two identity systems
  // remain unlinked beyond this prefill.
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      if (active && email) {
        setBilling((current) => (current.email ? current : { ...current, email }));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const billingMutation = useMutation({
    mutationFn: updateCart,
    onSuccess: (updated) => {
      logCheckout("billing:success", { cartId: updated.id, total: updated.total });
      queryClient.setQueryData(CART_QUERY_KEY, updated);
    },
    // A cart the backend has already marked completed (see
    // cart.server.ts's completed-cart self-heal — the cookie gets
    // cleared as part of the failure) will otherwise keep failing every
    // retry with the same error forever, since nothing here re-reads the
    // cart. Refetching picks up the now-`null` cart, which sends the
    // shopper back to `/cart` via the effect above.
    onError: (error) => {
      logCheckoutError("billing:error", error);
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const paymentSessionMutation = useMutation({
    mutationFn: initiatePaymentSession,
    // `initiatePaymentSession` returns a payment collection, not a cart
    // (see cart.server.ts) — merge it into the shared cart cache rather
    // than doing a separate `retrieveCart()` round trip to pick it up.
    onSuccess: (paymentCollection) => {
      logCheckout("payment-session:success", {
        paymentCollectionId: paymentCollection.id,
        sessionCount: paymentCollection.payment_sessions?.length ?? 0,
      });
      queryClient.setQueryData<HttpTypes.StoreCart | null | undefined>(CART_QUERY_KEY, (old) =>
        old ? { ...old, payment_collection: paymentCollection } : old,
      );
    },
    onError: (error) => {
      logCheckoutError("payment-session:error", error);
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const handleBillingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    logCheckout("billing:submit", { email: billing.email });
    const updated = await billingMutation.mutateAsync({
      data: {
        email: billing.email,
        billing_address: {
          first_name: billing.firstName,
          last_name: billing.lastName,
          address_1: billing.address1,
          city: billing.city,
          province: billing.province,
          postal_code: billing.postalCode,
          country_code: "us",
        },
      },
    });
    // A cart can total $0 after a fully-discounting promo code — Medusa's
    // own cart-completion workflow skips payment entirely in that case
    // (see decisions doc: `validateCartPaymentsStep`'s `canSkipPayment`),
    // so there's no payment session to initiate.
    if ((updated.total ?? 0) > 0) {
      logCheckout("payment-session:init", { cartId: updated.id, total: updated.total });
      paymentSessionMutation.mutate({
        data: {
          cartId: updated.id,
          paymentCollectionId: updated.payment_collection?.id,
          providerId: STRIPE_PROVIDER_ID,
        },
      });
    } else {
      logCheckout("payment-session:skipped-zero-total", { cartId: updated.id });
    }
  };

  const billingSaved = Boolean(cart?.email && cart?.billing_address?.address_1);
  const activeSession = cart?.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending",
  );
  const clientSecret = activeSession?.data?.["client_secret"] as string | undefined;
  const total = cart?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Checkout
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Billing details
              </h2>
              <form
                onSubmit={(e) => void handleBillingSubmit(e)}
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  First name
                  <input
                    required
                    value={billing.firstName}
                    onChange={(e) => setBilling((b) => ({ ...b, firstName: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  Last name
                  <input
                    required
                    value={billing.lastName}
                    onChange={(e) => setBilling((b) => ({ ...b, lastName: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground sm:col-span-2">
                  Email
                  <input
                    required
                    type="email"
                    value={billing.email}
                    onChange={(e) => setBilling((b) => ({ ...b, email: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground sm:col-span-2">
                  Address
                  <input
                    required
                    value={billing.address1}
                    onChange={(e) => setBilling((b) => ({ ...b, address1: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  City
                  <input
                    required
                    value={billing.city}
                    onChange={(e) => setBilling((b) => ({ ...b, city: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  State
                  <input
                    required
                    value={billing.province}
                    onChange={(e) => setBilling((b) => ({ ...b, province: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  ZIP code
                  <input
                    required
                    value={billing.postalCode}
                    onChange={(e) => setBilling((b) => ({ ...b, postalCode: e.target.value }))}
                    className="rounded-md border border-border bg-transparent px-3 py-2"
                  />
                </label>
                {/* Single-region store (US only, confirmed against the
                    live Store API — see decisions doc) — no country
                    selector needed until a second region exists. */}
                <label className="flex flex-col gap-1 text-sm text-foreground">
                  Country
                  <input
                    disabled
                    value="United States"
                    className="rounded-md border border-border bg-secondary px-3 py-2 text-muted-foreground"
                  />
                </label>

                {billingMutation.isError && (
                  <p className="text-sm text-destructive sm:col-span-2">
                    {billingMutation.error instanceof Error
                      ? billingMutation.error.message
                      : "Failed to save billing details."}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={billingMutation.isPending}
                  className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground disabled:opacity-60 sm:col-span-2"
                >
                  {billingMutation.isPending
                    ? "Saving…"
                    : billingSaved
                      ? "Update billing details"
                      : "Continue to payment"}
                </button>
              </form>
            </section>

            {billingSaved && cart && total > 0 && (
              <section className="rounded-2xl border border-border p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Payment
                </h2>
                {clientSecret ? (
                  <PaymentSection cart={cart} clientSecret={clientSecret} />
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {paymentSessionMutation.isError
                      ? "Couldn't start the payment — try updating your billing details again."
                      : "Preparing payment…"}
                  </p>
                )}
              </section>
            )}

            {billingSaved && cart && total <= 0 && <FreeOrderSection />}
          </div>

          <aside className="h-fit rounded-2xl bg-secondary p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Order summary
            </p>
            <ul className="mt-4 space-y-2">
              {cart?.items?.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm text-foreground"
                >
                  <span>{item.product_title ?? item.title}</span>
                  <span className="font-semibold">{formatPrice(item.unit_price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-extrabold text-foreground">
                {formatPrice(total)}
              </span>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PaymentSection({
  cart,
  clientSecret,
}: {
  cart: HttpTypes.StoreCart;
  clientSecret: string;
}) {
  // `getStripe()` returns null during SSR (Stripe.js needs `document`,
  // which doesn't exist there) — see stripe.ts. `useMemo` re-runs once
  // the component re-renders on the client, picking up the real promise.
  const stripePromise = useMemo(() => getStripe(), []);

  if (!stripePromise) {
    return (
      <p className="mt-4 text-sm text-destructive">
        Payment is unavailable right now — missing Stripe configuration.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <StripeCardForm cart={cart} clientSecret={clientSecret} />
    </Elements>
  );
}

function StripeCardForm({
  cart,
  clientSecret,
}: {
  cart: HttpTypes.StoreCart;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [cardComplete, setCardComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // [checkout-logging + fix] `submitting` (React state) is what disables
  // the button, but it's read from a stale render closure and only takes
  // effect after React re-renders — a fast double-click/double-tap can
  // fire `handlePlaceOrder` twice before that happens. That's the
  // suspected root cause of the reported bug: two near-simultaneous
  // `placeOrder()` calls race against the same cart; one wins and creates
  // the order, the other gets back an HTTP 409 Conflict from Medusa. A
  // plain `useRef` is synchronous and not subject to that render timing,
  // so it's used here as the actual re-entrancy guard, with `submitting`
  // kept only for the UI (spinner text, visual disabled state).
  const placingOrderRef = useRef(false);

  const placeOrderMutation = useMutation({
    mutationFn: () => placeOrder(),
    onSuccess: (result) => {
      logCheckout("placeOrder:success", {
        cartId: cart.id,
        resultType: result.type,
        orderId: result.type === "order" ? result.orderId : undefined,
      });
    },
    // [fix] Deliberately NOT invalidating/refetching the cart query here
    // (unlike the billing/payment-session mutations above). By the time
    // this mutation can fail, Stripe has already charged the card — this
    // is the one error in the whole flow that happens *after* payment.
    // The old behavior invalidated the cart query on any error, which
    // (via cart.server.ts's completed-cart self-heal on `retrieveCart()`)
    // could resolve the cart to `null`, which triggers checkout's own
    // "nothing to check out, bounce to /cart" effect — ripping the error
    // message off-screen within moments of it appearing. That's almost
    // certainly the "red text that included 'conflict' for a very brief
    // period of time and then vanished" the user reported. Logging here
    // instead preserves the error long enough to read, and long enough to
    // show up in the console/logs for debugging.
    onError: (error) => {
      logCheckoutError("placeOrder:error", error, { cartId: cart.id });
    },
  });

  const handlePlaceOrder = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    // [fix] Synchronous re-entrancy guard — see placingOrderRef comment
    // above. Checked and set in the same tick, before any `await`, so a
    // second call arriving before the first `setSubmitting(true)` has
    // been rendered is still blocked.
    if (placingOrderRef.current) {
      logCheckout("placeOrder:blocked-duplicate-submit", { cartId: cart.id });
      return;
    }
    placingOrderRef.current = true;

    setSubmitting(true);
    setError(null);
    logCheckout("stripe:confirmCardPayment:start", { cartId: cart.id, total: cart.total });

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${cart.billing_address?.first_name ?? ""} ${cart.billing_address?.last_name ?? ""}`.trim(),
            email: cart.email ?? null,
            address: {
              city: cart.billing_address?.city ?? null,
              country: cart.billing_address?.country_code ?? null,
              line1: cart.billing_address?.address_1 ?? null,
              postal_code: cart.billing_address?.postal_code ?? null,
              state: cart.billing_address?.province ?? null,
            },
          },
        },
      });

      if (stripeError) {
        logCheckoutError("stripe:confirmCardPayment:error", stripeError, { cartId: cart.id });
        setError(stripeError.message ?? "Payment failed — please try again.");
        return;
      }
      logCheckout("stripe:confirmCardPayment:result", {
        cartId: cart.id,
        paymentIntentId: paymentIntent?.id,
        status: paymentIntent?.status,
      });
      if (paymentIntent?.status !== "succeeded" && paymentIntent?.status !== "requires_capture") {
        setError(`Payment did not complete (status: ${paymentIntent?.status ?? "unknown"}).`);
        return;
      }

      // Card charged (or authorized) successfully — now actually finalize
      // the Medusa order. If this fails, the charge has still gone
      // through on Stripe's side, so the message below says so rather
      // than implying nothing happened.
      logCheckout("placeOrder:start", { cartId: cart.id, paymentIntentId: paymentIntent?.id });
      const result = await placeOrderMutation.mutateAsync();
      if (result.type === "order") {
        void navigate({ to: "/order/$orderId/confirmed", params: { orderId: result.orderId } });
      } else {
        logCheckout("placeOrder:returned-cart-not-order", {
          cartId: cart.id,
          paymentIntentId: paymentIntent?.id,
        });
        setError(
          "Your card was charged, but the order couldn't be finalized automatically — please contact support with your payment confirmation.",
        );
      }
    } catch (err) {
      logCheckoutError("placeOrder:threw", err, { cartId: cart.id });
      setError(
        err instanceof Error
          ? `Your card may have been charged. ${err.message}`
          : "Your card may have been charged, but something went wrong finalizing your order — please contact support.",
      );
    } finally {
      setSubmitting(false);
      placingOrderRef.current = false;
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">Card details</p>
      <div className="rounded-md border border-border bg-transparent px-4 py-3">
        <CardElement
          options={{ style: { base: { fontSize: "16px", color: "inherit" } } }}
          onChange={(e) => {
            setCardComplete(e.complete);
            setError(e.error?.message ?? null);
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button
        onClick={() => void handlePlaceOrder()}
        disabled={!stripe || !cardComplete || submitting}
        className="mt-5 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground disabled:opacity-60"
      >
        {submitting ? "Placing order…" : `Pay ${formatPrice(cart.total ?? 0)}`}
      </button>
    </div>
  );
}

// A cart can total $0 after a fully-discounting promo code — see the
// `canSkipPayment` note above. No card to charge, so `placeOrder()` is
// called directly with no Stripe involvement at all, matching exactly how
// Medusa's own cart-completion workflow treats this case server-side.
function FreeOrderSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      logCheckout("placeOrder:start (free order)");
      return placeOrder();
    },
    onSuccess: (result) => {
      logCheckout("placeOrder:success (free order)", {
        resultType: result.type,
        orderId: result.type === "order" ? result.orderId : undefined,
      });
      if (result.type === "order") {
        void navigate({ to: "/order/$orderId/confirmed", params: { orderId: result.orderId } });
      } else {
        setError("Couldn't finalize the order — please try again.");
      }
    },
    // No Stripe charge is involved for a $0 order, so unlike the paid
    // checkout path there's no "you were charged" risk in refetching the
    // cart here — if this failed because the cart was already completed
    // by a concurrent request, bouncing to /cart via the redirect effect
    // reflects the true state rather than hiding anything.
    onError: (err) => {
      logCheckoutError("placeOrder:error (free order)", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  return (
    <section className="rounded-2xl border border-border p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Payment
      </h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Your order total is $0 — no payment needed.
      </p>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-4 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground disabled:opacity-60"
      >
        {mutation.isPending ? "Placing order…" : "Place order"}
      </button>
    </section>
  );
}
