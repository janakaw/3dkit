/**
 * The signed-in shopper's library — every model they have paid for —
 * read from the backend's `GET /store/customers/me/library` (see the
 * backend's src/lib/customer-library.ts: derived from captured orders on
 * each read, no separate entitlements table).
 *
 * Cookie-dependent (Medusa session), so `.server.ts` — see
 * cookies.server.ts's header.
 */
import { sdk } from "./config";
import type { DownloadFormat, DownloadLink } from "./download-formats";
import { getAuthHeaders } from "./cookies.server";
import {
  ensureMedusaSession,
  getMedusaCustomerId,
  type EnsureMedusaSessionInput,
} from "./auth.server";

export type LibraryEntry = {
  product_id: string;
  variant_id: string | null;
  order_id: string;
  order_display_id: number | null;
  line_item_id: string;
  title: string;
  /** Product handle (= storefront slug) and thumbnail as recorded on the line item. */
  product_handle: string | null;
  thumbnail: string | null;
  purchased_at: string;
};

export async function getLibrary(identity: EnsureMedusaSessionInput): Promise<LibraryEntry[]> {
  await ensureMedusaSession(identity);
  const { library } = await sdk.client.fetch<{ library: LibraryEntry[] }>(
    "/store/customers/me/library",
    { method: "GET", headers: getAuthHeaders() },
  );
  return library;
}

/**
 * Library for whoever the current Medusa session cookie says is signed
 * in, or `[]` when nobody is — for call sites that don't carry Supabase
 * claims (e.g. `addToCart`, which guests may use). A stale/absent cookie
 * simply means "owns nothing"; checkout's validate hook on the backend is
 * the authoritative re-purchase check regardless.
 */
export async function getLibraryForCurrentSession(): Promise<LibraryEntry[]> {
  if (!getMedusaCustomerId()) return [];
  try {
    const { library } = await sdk.client.fetch<{ library: LibraryEntry[] }>(
      "/store/customers/me/library",
      { method: "GET", headers: getAuthHeaders() },
    );
    return library;
  } catch {
    return [];
  }
}

/**
 * Ask the backend for a download URL for one purchased line item
 * (doc/bugs #8). The backend re-checks ownership against the order
 * history before answering — the storefront never decides this itself.
 */
export async function getDownloadLink(
  identity: EnsureMedusaSessionInput,
  lineItemId: string,
  format: DownloadFormat,
): Promise<DownloadLink> {
  await ensureMedusaSession(identity);
  return sdk.client.fetch<DownloadLink>(
    `/store/customers/me/library/${encodeURIComponent(lineItemId)}/download`,
    { method: "GET", query: { format }, headers: getAuthHeaders() },
  );
}
