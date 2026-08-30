/**
 * Lazily loaded Stripe.js client instance.
 *
 * `loadStripe()` (from `@stripe/stripe-js`) injects a `<script>` tag via
 * `document`, which doesn't exist during SSR — and TanStack Start route
 * components render on the server first (there's no Next.js `'use client'`
 * equivalent to keep this whole module out of the server bundle, the way
 * 3dchairstore-storefront's payment-wrapper.tsx does). `getStripe()` guards
 * against that with a `typeof window === "undefined"` check rather than
 * calling `loadStripe()` at module-import time, and memoizes the promise
 * so remounting the checkout page doesn't reload Stripe.js again.
 *
 * `VITE_STRIPE_PUBLISHABLE_KEY` is a *publishable* key — safe to ship in
 * client code by design, unlike the Stripe secret key (which lives only on
 * the Medusa backend's Stripe plugin config, never in this frontend).
 */
import { loadStripe, type Stripe } from "@stripe/stripe-js";

function readStripeKey(): string | undefined {
  return (
    (import.meta.env?.["VITE_STRIPE_PUBLISHABLE_KEY"] as string | undefined) ??
    process.env["VITE_STRIPE_PUBLISHABLE_KEY"]
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> | null {
  if (typeof window === "undefined") return null;
  if (stripePromise) return stripePromise;

  const key = readStripeKey();
  if (!key) {
    console.error("[Stripe] Missing VITE_STRIPE_PUBLISHABLE_KEY env variable.");
    return null;
  }

  stripePromise = loadStripe(key);
  return stripePromise;
}
