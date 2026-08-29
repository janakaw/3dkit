/**
 * Region lookup.
 *
 * Ported from 3dchairstore-storefront/src/lib/data/regions.ts. Two Next.js
 * specific things are dropped, not replaced:
 *
 * - `cache()` from `react` — React Server Component request memoization,
 *   which has no equivalent outside RSC. It only deduped calls within a
 *   single render pass anyway; dropping it just means an extra network
 *   call in the rare case multiple things ask for the same region in one
 *   request, which is a minor efficiency loss, not a correctness one.
 * - the `{ next: { tags: ['regions'] } }` fetch hint — a Next Data Cache
 *   instruction with no TanStack Start equivalent (see the plumbing
 *   comparison in the decisions doc: caching moves to TanStack Query on
 *   the client side, which doesn't apply to this server-side helper).
 *
 * The `regionMap` module-level cache below is kept as-is from the original
 * — it's a plain in-memory Map, populated once per warm server instance.
 * Same caveat applies here as it already does for the Next storefront on
 * the same Cloudflare Workers target: it's a best-effort cache that resets
 * on a cold isolate, not a correctness requirement.
 */
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./config";
import { medusaError } from "./errors";

export async function listRegions(): Promise<HttpTypes.StoreRegion[]> {
  return sdk.store.region
    .list({})
    .then(({ regions }) => regions)
    .catch(medusaError);
}

export async function retrieveRegion(id: string): Promise<HttpTypes.StoreRegion> {
  return sdk.store.region
    .retrieve(id, {})
    .then(({ region }) => region)
    .catch(medusaError);
}

const regionMap = new Map<string, HttpTypes.StoreRegion>();

export async function getRegion(
  countryCode: string,
): Promise<HttpTypes.StoreRegion | undefined | null> {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode);
    }

    const regions = await listRegions();
    if (!regions) {
      return null;
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region);
      });
    });

    return countryCode ? regionMap.get(countryCode) : regionMap.get("us");
  } catch {
    return null;
  }
}
