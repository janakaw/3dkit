/**
 * TanStack Query wiring for the shopper's library, mirroring
 * cart-query.ts: one `["library"]` cache entry that the product page, the
 * catalogue cards and (later) "My models" all read from, so a model's
 * owned/not-owned state is consistent everywhere and fetched once.
 *
 * Only enabled when signed in — anonymous visitors own nothing and the
 * server function would refuse them anyway. Invalidate after a successful
 * `placeOrder` (checkout) and drop it on sign-out.
 */
import { queryOptions } from "@tanstack/react-query";
import { isMockDataSource } from "@/lib/catalog";
import { getLibrary, type LibraryEntry } from "./library";

export const LIBRARY_QUERY_KEY = ["library"] as const;

export const libraryQueryOptions = (signedIn: boolean) =>
  queryOptions({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibrary(),
    enabled: signedIn && !isMockDataSource,
    staleTime: 60_000,
  });

/** Does the library contain this Medusa variant? `null` variant → never. */
export function ownsVariant(
  library: LibraryEntry[] | undefined,
  variantId: string | null,
): boolean {
  if (!variantId || !library) return false;
  return library.some((entry) => entry.variant_id === variantId);
}

/** The library entry for a variant, if owned — carries the `line_item_id` downloads key on. */
export function libraryEntryForVariant(
  library: LibraryEntry[] | undefined,
  variantId: string | null,
): LibraryEntry | undefined {
  if (!variantId || !library) return undefined;
  return library.find((entry) => entry.variant_id === variantId);
}
