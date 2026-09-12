/**
 * Medusa customer session, derived from the shopper's Supabase session.
 *
 * Supabase is the identity system — signup, sign-in, profiles all live
 * there and nothing here changes that. But Medusa needs to know *which
 * customer* a cart and an order belong to, and it only accepts its own
 * JWT for that. This module bridges the two (decisions doc, Tier 13):
 *
 *   Supabase access token
 *     → POST /auth/customer/supabase        (Medusa verifies it with Supabase,
 *                                            maps `sub` to an auth identity)
 *     → first contact only:
 *         POST /store/customers             (creates the customer row, links it)
 *         POST /auth/token/refresh          (new JWT that now carries the customer)
 *     → `_medusa_jwt` cookie                (existing plumbing in cookies.server.ts)
 *     → POST /store/carts/:id/customer      (hand any guest cart to the customer)
 *
 * This is the exact sequence the reference Medusa storefront runs in its
 * own `signup()`/`login()`; the only difference is that the credential
 * presented at step one is a Supabase token instead of an email/password.
 *
 * Idempotent and cheap on repeat: if the cookie already holds a valid,
 * unexpired customer token, nothing is exchanged — it just re-runs the
 * cart hand-off, which is itself a no-op when the cart already belongs
 * to the customer.
 *
 * Cookie-dependent, so `.server.ts` — only call from a `createServerFn()`
 * handler (see auth.ts) or from another `.server.ts` module.
 */
import { sdk } from "./config";
import { getAuthToken, getCartId, removeAuthToken, setAuthToken } from "./cookies.server";

type MedusaJwt = {
  actor_id?: string;
  actor_type?: string;
  auth_identity_id?: string;
  exp?: number;
  app_metadata?: { customer_id?: string };
};

export type EnsureMedusaSessionInput = {
  supabaseAccessToken: string;
  email: string;
  displayName?: string | undefined;
};

export type MedusaSession = {
  customerId: string;
  token: string;
};

function log(event: string, details?: Record<string, unknown>): void {
  console.log(`[medusa.auth] ${event}`, details ?? {});
}

function decodeJwt(token: string): MedusaJwt | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    // base64url → base64, padded. `atob` rather than `Buffer` because this
    // runs on Cloudflare Workers without the nodejs_compat flag.
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as MedusaJwt;
  } catch {
    return null;
  }
}

// Seconds the token has left, minus a safety margin so we never hand
// Medusa a token that expires mid-request. `undefined` = no usable token.
function secondsRemaining(payload: MedusaJwt | null): number | undefined {
  if (!payload?.exp) return undefined;
  const remaining = payload.exp - Math.floor(Date.now() / 1000) - 60;
  return remaining > 0 ? remaining : undefined;
}

function splitName(
  displayName: string | undefined,
  email: string,
): {
  first_name: string;
  last_name: string;
} {
  const source = displayName?.trim() || email.split("@")[0] || email;
  const [first, ...rest] = source.split(/\s+/);
  return { first_name: first || source, last_name: rest.join(" ") };
}

/** The Medusa customer id carried by the current cookie, if any. */
export function getMedusaCustomerId(): string | undefined {
  const token = getAuthToken();
  if (!token) return undefined;
  const payload = decodeJwt(token);
  return secondsRemaining(payload) ? payload?.actor_id || undefined : undefined;
}

async function transferGuestCart(token: string): Promise<void> {
  const cartId = getCartId();
  if (!cartId) return;
  try {
    await sdk.store.cart.transferCart(cartId, {}, { authorization: `Bearer ${token}` });
    log("guest cart handed to customer", { cartId });
  } catch (error) {
    // A cart that already belongs to this customer, or that no longer
    // exists, both land here. Neither should block sign-in; checkout will
    // surface a real problem if there is one.
    log("transferCart skipped", {
      cartId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function exchange(input: EnsureMedusaSessionInput): Promise<MedusaSession> {
  const { token: firstToken } = await sdk.client.fetch<{ token: string }>(
    "/auth/customer/supabase",
    { method: "POST", body: { token: input.supabaseAccessToken } },
  );

  let token = firstToken;
  let payload = decodeJwt(token);

  if (!payload?.actor_id) {
    // First contact: the identity exists but no customer row does yet.
    log("first contact — creating Medusa customer", { email: input.email });
    await sdk.store.customer.create(
      { email: input.email, ...splitName(input.displayName, input.email) },
      {},
      { authorization: `Bearer ${token}` },
    );
    const refreshed = await sdk.client.fetch<{ token: string }>("/auth/token/refresh", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    token = refreshed.token;
    payload = decodeJwt(token);
  }

  if (!payload?.actor_id) {
    throw new Error("Medusa did not return a customer session after registration");
  }

  const maxAge = secondsRemaining(payload);
  setAuthToken(token, maxAge);
  log("Medusa customer session established", { customerId: payload.actor_id, maxAge });
  return { customerId: payload.actor_id, token };
}

/**
 * Make sure the current request has a valid Medusa customer session for
 * this Supabase user, creating the customer on first contact. Safe to
 * call on every sign-in, every `_authenticated` page load, and right
 * before placing an order.
 */
export async function ensureMedusaSession(
  input: EnsureMedusaSessionInput,
  options: { force?: boolean } = {},
): Promise<MedusaSession> {
  if (!options.force) {
    const existing = getAuthToken();
    const payload = existing ? decodeJwt(existing) : null;
    if (existing && payload?.actor_id && secondsRemaining(payload)) {
      await transferGuestCart(existing);
      return { customerId: payload.actor_id, token: existing };
    }
  }
  const session = await exchange(input);
  await transferGuestCart(session.token);
  return session;
}

/** Sign-out counterpart: forget the Medusa session along with Supabase's. */
export function clearMedusaSession(): void {
  removeAuthToken();
  log("Medusa customer session cleared");
}
