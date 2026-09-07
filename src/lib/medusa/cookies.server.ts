/**
 * Auth token + cart id cookie helpers.
 *
 * Ported from 3dchairstore-storefront/src/lib/data/cookies.ts. Next.js's
 * version used `next/headers`'s `cookies()`, callable anywhere inside a
 * `'use server'` file. TanStack Start's equivalent (`getCookie`/`setCookie`/
 * `deleteCookie` from `@tanstack/react-start/server`, the same module
 * `src/integrations/supabase/auth-middleware.ts` already imports
 * `getRequest` from) only works while a server request is actually being
 * handled, and — as `debug.medusa-smoke.tsx` found out — importing it from
 * any module that's reachable from client code trips TanStack Start's
 * client/server import-boundary check (route `loader`s are isomorphic by
 * default, so their whole import graph gets bundled for the client too).
 *
 * `_medusa_jwt` is written by lib/medusa/auth.server.ts after exchanging
 * the shopper's Supabase session for a Medusa customer JWT (decisions doc,
 * Tier 13) and cleared on sign-out; `getAuthHeaders()` below turns it into
 * the `Authorization: Bearer` header every Medusa call sends.
 *
 * Named `.server.ts`, matching the convention already used by
 * `src/integrations/supabase/client.server.ts`, so this file is excluded
 * from the client bundle entirely. Only call these from inside a
 * `createServerFn()` handler or server middleware — never import this
 * module from a route component or from a loader body directly.
 */
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const AUTH_COOKIE = "_medusa_jwt";
const CART_ID_COOKIE = "_medusa_cart_id";

const WEEK = 60 * 60 * 24 * 7;

const secureCookieOpts = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env["NODE_ENV"] === "production",
};

export function getAuthHeaders(): { authorization: string } | Record<string, never> {
  const token = getCookie(AUTH_COOKIE);
  return token ? { authorization: `Bearer ${token}` } : {};
}

export function getAuthToken(): string | undefined {
  return getCookie(AUTH_COOKIE);
}

// `maxAge` defaults to a week but callers that know the token's own
// expiry (lib/medusa/auth.server.ts decodes `exp` from the Medusa JWT)
// pass that instead, so the cookie never outlives the token inside it.
export function setAuthToken(token: string, maxAge: number = WEEK): void {
  setCookie(AUTH_COOKIE, token, { ...secureCookieOpts, maxAge });
}

export function removeAuthToken(): void {
  // Must pass the same attributes used in `setAuthToken` above (minus
  // `maxAge`, which `deleteCookie` overrides to 0 itself). Cookies are
  // technically keyed by name+domain+path only, so this shouldn't be
  // strictly required to override the original cookie — but omitting
  // `sameSite`/`secure` here was the leading theory (unconfirmed) behind a
  // production case where a self-heal's cookie clear silently failed to
  // take effect in the browser, requiring the shopper to clear cookies
  // manually. Passing matching attributes removes that variable entirely.
  deleteCookie(AUTH_COOKIE, secureCookieOpts);
}

export function getCartId(): string | undefined {
  return getCookie(CART_ID_COOKIE);
}

export function setCartId(cartId: string): void {
  setCookie(CART_ID_COOKIE, cartId, { ...secureCookieOpts, maxAge: WEEK });
}

export function removeCartId(): void {
  // See the comment in `removeAuthToken` above — same reasoning applies.
  deleteCookie(CART_ID_COOKIE, secureCookieOpts);
}
