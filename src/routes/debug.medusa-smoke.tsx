/**
 * THROWAWAY smoke test for the Tier 0 Medusa port (src/lib/medusa/config.ts
 * + cookies.server.ts). Not a real feature — delete this file once it's
 * confirmed working locally.
 *
 * The actual cookie/SDK logic runs inside a `createServerFn()` handler
 * rather than directly in the loader: route loaders are isomorphic (they
 * can run on the client during client-side navigation), so anything they
 * import directly gets bundled for the browser too. `cookies.server.ts`
 * imports `@tanstack/react-start/server`, which TanStack Start's
 * client/server import-boundary check refuses to let into a client bundle.
 * Wrapping the logic in `createServerFn()` keeps it server-only — the
 * client side just gets a generated RPC call.
 *
 * Manual test:
 *   1. bun run dev, visit /debug/medusa-smoke
 *   2. Expect `error: null` and a non-empty `regions` array (proves
 *      config.ts's publishable key + backend URL actually reach
 *      api.3dlounge.co).
 *   3. Expect `existingCartId: null` on this first visit.
 *   4. Refresh the page. Expect `existingCartId` now shows the
 *      "smoke-test-..." value set on the previous request (proves
 *      setCookie/getCookie round-trip through the browser correctly).
 *   5. In devtools → Application → Cookies, confirm `_medusa_cart_id` has
 *      the HttpOnly flag set, and confirm `document.cookie` in the console
 *      does NOT show it (proves httpOnly is actually being honored).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { sdk } from "@/lib/medusa/config";
import { getCartId, setCartId } from "@/lib/medusa/cookies.server";
import type { HttpTypes } from "@medusajs/types";

const runMedusaSmokeTest = createServerFn({ method: "GET" }).handler(async () => {
  const existingCartId = getCartId() ?? null;
  if (!existingCartId) {
    setCartId(`smoke-test-${Date.now()}`);
  }

  let regions: HttpTypes.StoreRegion[] | null = null;
  let error: string | null = null;
  try {
    const res = await sdk.store.region.list();
    regions = res.regions;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return { existingCartId, regions, error };
});

export const Route = createFileRoute("/debug/medusa-smoke")({
  loader: () => runMedusaSmokeTest(),
  component: MedusaSmokeTest,
});

function MedusaSmokeTest() {
  const { existingCartId, regions, error } = Route.useLoaderData();
  const regionsCount = Array.isArray(regions) ? regions.length : null;

  return (
    <pre style={{ padding: 24, whiteSpace: "pre-wrap", fontSize: 13 }}>
      {JSON.stringify({ existingCartId, regionsCount, error, regions }, null, 2)}
    </pre>
  );
}
