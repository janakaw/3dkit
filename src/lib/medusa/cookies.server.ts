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

export function setAuthToken(token: string): void {
  setCookie(AUTH_COOKIE, token, { ...secureCookieOpts, maxAge: WEEK });
}

export function removeAuthToken(): void {
  deleteCookie(AUTH_COOKIE);
}

export function getCartId(): string | undefined {
  return getCookie(CART_ID_COOKIE);
}

export function setCartId(cartId: string): void {
  setCookie(CART_ID_COOKIE, cartId, { ...secureCookieOpts, maxAge: WEEK });
}

export function removeCartId(): void {
  deleteCookie(CART_ID_COOKIE);
}
