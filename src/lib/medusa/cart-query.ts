/**
 * TanStack Query wiring for the cart — the single shared cache the header
 * badge, the cart page, and any future cart-aware component all read from.
 *
 * This replaces the earlier `window.dispatchEvent`/`addEventListener`
 * broadcast pattern (`CART_UPDATED_EVENT` / `notifyCartUpdated`, now
 * removed from cart.ts). That pattern had every listener kick off its own
 * independent `retrieveCart()` call whenever anything changed, and two of
 * those calls fired close together could resolve out of order over the
 * network — a slower-but-earlier response arriving after a
 * faster-but-later one would silently overwrite the correct count with a
 * stale one (see decisions doc: badge stuck at 2 after re-adding two items
 * back-to-back). With everything reading from one `useQuery(["cart"])`,
 * there's only ever one cache entry to overwrite, mutations write their
 * result into it directly via `setQueryData` (no extra read at all, so no
 * race is possible), and TanStack Query dedupes concurrent fetches against
 * the same key automatically if more than one component mounts before any
 * data is cached.
 *
 * `enabled: !isMockDataSource` skips hitting the real Medusa backend
 * entirely when running against the static mock catalog (VITE_DATA_SOURCE
 * unset/"mock") — there's no real cart to read in that mode, and the
 * cookie-backed `retrieveCart()` call would just come back null every time.
 */
import { queryOptions } from "@tanstack/react-query";
import { isMockDataSource } from "@/lib/catalog";
import { retrieveCart } from "./cart";

export const CART_QUERY_KEY = ["cart"] as const;

export const cartQueryOptions = () =>
  queryOptions({
    queryKey: CART_QUERY_KEY,
    queryFn: () => retrieveCart(),
    enabled: !isMockDataSource,
  });
