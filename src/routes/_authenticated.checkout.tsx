import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeCardNumberElementChangeEvent } from "@stripe/stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HttpTypes } from "@medusajs/types";
import {
  AmericanExpress,
  Mastercard,
  Visa,
} from "react-svg-credit-card-payment-icons/icons/flat-rounded";
import { useTheme } from "@/components/ThemeProvider";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/catalog";
import { placeOrder, prepareCheckout } from "@/lib/medusa/cart";
import { CART_QUERY_KEY, cartQueryOptions } from "@/lib/medusa/cart-query";
import { LIBRARY_QUERY_KEY } from "@/lib/medusa/library-query";
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

// Stripe's Elements render inside their own cross-origin iframes, so they
// can't see this app's CSS variables or its `.dark` class — `color:
// "inherit"` only resolves once, at mount, and never covers the placeholder
// or invalid-state colors anyway (that's the reported dark-mode contrast
// bug). Instead the real theme colors are read straight off the DOM here and
// handed to Stripe as literal values, then re-read and pushed again on every
// theme toggle (see the `useEffect` in StripeCardForm below).
//
// The values MUST be converted to plain rgb() first: the browser serializes
// our oklch() variables as e.g. `oklch(96.5% .002 260)`, and Stripe silently
// fails to render an Element given that — no error, no console warning, just
// an empty, unclickable box (verified in-browser). Painting the color onto a
// 1×1 canvas and reading the pixel back gives an rgb() Stripe always accepts.
function cssColorToRgb(color: string, fallback: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = color; // an unparseable value is ignored, leaving the fallback
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

type CardBrand = StripeCardNumberElementChangeEvent["brand"];

// Accepted-card marks shown in the payment card's header. Chosen for the
// target markets (US, Australia): Visa, Mastercard and Amex. Discover is
// left out — it's rare in Australia (Stripe still accepts it). The keys are Stripe's `brand` values from the
// card-number Element's change event, so the matching mark can be
// highlighted once the shopper's card is recognised.
const CARD_BRAND_ICONS: { brand: CardBrand; label: string; Icon: typeof Visa }[] = [
  { brand: "visa", label: "Visa", Icon: Visa },
  { brand: "mastercard", label: "Mastercard", Icon: Mastercard },
  { brand: "amex", label: "American Express", Icon: AmericanExpress },
];

function CardBrandIcons({ brand }: { brand: CardBrand }) {
  const recognised = CARD_BRAND_ICONS.some((b) => b.brand === brand);
  return (
    <ul className="flex items-center gap-1.5" aria-label="Accepted cards">
      {CARD_BRAND_ICONS.map(({ brand: b, label, Icon }) => (
        <li key={b}>
          <Icon
            role="img"
            aria-label={label}
            width={34}
            height={22}
            className={`transition-opacity ${recognised && brand !== b ? "opacity-30" : "opacity-100"}`}
          />
        </li>
      ))}
    </ul>
  );
}

function getStripeElementStyle() {
  const rootStyle = getComputedStyle(document.documentElement);
  const themeColor = (name: string, fallback: string) =>
    cssColorToRgb(rootStyle.getPropertyValue(name).trim(), fallback);
  return {
    base: {
      fontSize: "16px",
      color: themeColor("--foreground", "#888888"),
      "::placeholder": { color: themeColor("--muted-foreground", "#888888") },
    },
    invalid: {
      color: themeColor("--destructive", "#e5484d"),
    },
  };
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

function CheckoutPage() {
  const initialCart = Route.useLoaderData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cart } = useQuery({ ...cartQueryOptions(), initialData: initialCart });

  // Nothing to check out — most likely a direct link visit, or the cart
  // was emptied in another tab. Bounce back rather than showing a blank
  // payment form for an empty order.
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

  // No billing-details step: Medusa needs no address to complete a cart
  // of digital goods, and the card form below collects just the postal
  // code alongside the card. `prepareCheckout` (cart.server.ts) does the rest server-side
  // — Medusa customer session, cart email from the account, and a
  // pending Stripe payment session — in one idempotent call, so it simply
  // runs once per cart as the page mounts and the card form appears when
  // it returns.
  const prepareMutation = useMutation({
    mutationFn: () => prepareCheckout({ data: { providerId: STRIPE_PROVIDER_ID } }),
    onSuccess: (prepared) => {
      logCheckout("prepare:success", {
        cartId: prepared?.id,
        total: prepared?.total,
        sessionCount: prepared?.payment_collection?.payment_sessions?.length ?? 0,
      });
      queryClient.setQueryData(CART_QUERY_KEY, prepared);
    },
    // A cart the backend has already marked completed (see
    // cart.server.ts's completed-cart self-heal — the cookie gets cleared
    // as part of the failure) would otherwise sit here forever. Refetching
    // picks up the now-`null` cart, which sends the shopper back to
    // `/cart` via the effect above.
    onError: (error) => {
      logCheckoutError("prepare:error", error);
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
  const preparedForCartRef = useRef<string | null>(null);
  const cartId = cart?.id;
  const hasItems = (cart?.items?.length ?? 0) > 0;
  useEffect(() => {
    if (!cartId || !hasItems || preparedForCartRef.current === cartId) return;
    preparedForCartRef.current = cartId;
    logCheckout("prepare:start", { cartId });
    prepareMutation.mutate();
    // `prepareMutation` is stable enough for this purpose (TanStack Query
    // keeps `mutate` referentially stable); listing it would re-run on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, hasItems]);

  const activeSession = cart?.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending",
  );
  const clientSecret = activeSession?.data?.["client_secret"] as string | undefined;
  const total = cart?.total ?? 0;
  const [cardBrand, setCardBrand] = useState<CardBrand>("unknown");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Checkout
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            {cart && total > 0 && (
              <section className="rounded-2xl border border-border p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Card Payment
                  </h2>
                  <CardBrandIcons brand={cardBrand} />
                </div>
                {cart.email && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Receipt will be sent to <span className="text-foreground">{cart.email}</span>
                  </p>
                )}
                {clientSecret ? (
                  <PaymentSection
                    cart={cart}
                    clientSecret={clientSecret}
                    onBrandChange={setCardBrand}
                  />
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {prepareMutation.isError
                      ? "Couldn't start the payment — please reload the page to try again."
                      : "Preparing payment…"}
                  </p>
                )}
              </section>
            )}

            {cart && total <= 0 && <FreeOrderSection />}
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
  onBrandChange,
}: {
  cart: HttpTypes.StoreCart;
  clientSecret: string;
  onBrandChange: (brand: CardBrand) => void;
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
      <StripeCardForm cart={cart} clientSecret={clientSecret} onBrandChange={onBrandChange} />
    </Elements>
  );
}

function StripeCardForm({
  cart,
  clientSecret,
  onBrandChange,
}: {
  cart: HttpTypes.StoreCart;
  clientSecret: string;
  onBrandChange: (brand: CardBrand) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [complete, setComplete] = useState({ number: false, expiry: false, cvc: false });
  // Free-text on purpose: buyers are international (US ZIP / ZIP+4,
  // Australian 4-digit postcodes, UK/Canadian alphanumeric codes), and
  // Stripe only uses it for the issuer's address check.
  const [postalCode, setPostalCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardComplete =
    complete.number && complete.expiry && complete.cvc && postalCode.trim() !== "";

  // The three split Elements are mounted once and never remounted (that
  // would drop whatever the shopper had already typed), so a theme toggle
  // has to reach them via `.update()` rather than by passing new `options`.
  useEffect(() => {
    if (!elements) return;
    const style = getStripeElementStyle();
    elements.getElement(CardNumberElement)?.update({ style });
    elements.getElement(CardExpiryElement)?.update({ style });
    elements.getElement(CardCvcElement)?.update({ style });
  }, [elements, theme]);

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
      // The shopper now owns what was in the cart — refetch the library
      // so product pages flip to "In your library" (see library-query.ts).
      if (result.type === "order") {
        void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
      }
    },
    // Deliberately NOT invalidating/refetching the cart query here
    // (unlike the prepare mutation above). By the time
    // this mutation can fail the card is already *held* against this
    // cart, and the cart must survive so a retry reuses that hold.
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
    const card = elements.getElement(CardNumberElement);
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
          // No full billing address is collected (see the page comment
          // above) — just the postal code, from its own field since the
          // split card Elements (unlike the old unified CardElement) don't
          // collect it themselves. The email lets Stripe attach its
          // receipt/fraud signals.
          billing_details: {
            email: cart.email ?? null,
            address: { postal_code: postalCode.trim() },
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

      // The card is now *held* (authorise-only — see decisions doc, Tier
      // 13), not charged. Capture happens on the Medusa side only after
      // the order exists, so nothing below can take money, and nothing
      // below discards the cart: a retry reuses the same authorisation.
      logCheckout("placeOrder:start", { cartId: cart.id, paymentIntentId: paymentIntent?.id });
      const result = await placeOrderMutation.mutateAsync();
      if (result.type === "order") {
        void navigate({ to: "/order/$orderId/confirmed", params: { orderId: result.orderId } });
      } else if (result.type === "pending") {
        logCheckout("placeOrder:pending", { cartId: cart.id, paymentIntentId: paymentIntent?.id });
        setError(result.message);
      } else {
        logCheckout("placeOrder:returned-cart-not-order", {
          cartId: cart.id,
          paymentIntentId: paymentIntent?.id,
          paymentStatus: result.cart.payment_collection?.status,
        });
        setError(
          "We couldn't confirm your payment. You have not been charged — please check your card details and try again.",
        );
      }
    } catch (err) {
      logCheckoutError("placeOrder:threw", err, { cartId: cart.id });
      setError(
        err instanceof Error
          ? `You have not been charged (a temporary hold on your card will clear on its own). ${err.message}`
          : "You have not been charged, but something went wrong confirming your order — please try again.",
      );
    } finally {
      setSubmitting(false);
      placingOrderRef.current = false;
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm text-muted-foreground">Card details</p>
      <div className="space-y-3 rounded-md border border-border bg-transparent px-4 py-3">
        <CardNumberElement
          // `disableLink` hides Stripe Link's "Save with Link" autofill
          // button that otherwise appears inside the card-number field.
          options={{ style: getStripeElementStyle(), disableLink: true }}
          onChange={(e) => {
            setComplete((c) => ({ ...c, number: e.complete }));
            setError(e.error?.message ?? null);
            onBrandChange(e.brand);
          }}
        />
        <div className="grid grid-cols-3 items-center gap-3 border-t border-border pt-3">
          <CardExpiryElement
            options={{ style: getStripeElementStyle() }}
            onChange={(e) => {
              setComplete((c) => ({ ...c, expiry: e.complete }));
              setError(e.error?.message ?? null);
            }}
          />
          <CardCvcElement
            options={{ style: getStripeElementStyle() }}
            onChange={(e) => {
              setComplete((c) => ({ ...c, cvc: e.complete }));
              setError(e.error?.message ?? null);
            }}
          />
          <input
            type="text"
            autoComplete="postal-code"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Postal code"
            placeholder="Postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            maxLength={12}
            className="w-full min-w-0 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <button
        onClick={() => void handlePlaceOrder()}
        disabled={!stripe || !cardComplete || submitting}
        className="mt-5 w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground disabled:opacity-60"
      >
        {submitting ? "Placing order…" : `Place order · ${formatPrice(cart.total ?? 0)}`}
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
        void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
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
