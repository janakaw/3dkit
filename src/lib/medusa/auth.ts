/**
 * Client-safe entry points for the Medusa customer session — see cart.ts's
 * header comment for why this thin `createServerFn()` layer exists
 * (auth.server.ts touches cookies, which makes it server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as authServer from "./auth.server";

function readClaimString(claims: Record<string, unknown>, key: string): string | undefined {
  const value = claims[key];
  return typeof value === "string" && value ? value : undefined;
}

/**
 * Establish (or confirm) the Medusa customer session for the signed-in
 * Supabase user. Called after sign-in and on entering any `_authenticated`
 * route, so by the time a shopper reaches checkout Medusa already knows
 * who they are and their guest cart, if any, is theirs.
 */
export const ensureMedusaSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as Record<string, unknown>;
    const email = readClaimString(claims, "email");
    if (!email) {
      throw new Error("Signed-in user has no email claim; cannot create a Medusa customer.");
    }
    const userMetadata = claims["user_metadata"];
    const displayName =
      userMetadata && typeof userMetadata === "object"
        ? readClaimString(userMetadata as Record<string, unknown>, "display_name")
        : undefined;
    const session = await authServer.ensureMedusaSession({
      supabaseAccessToken: context.accessToken,
      email,
      displayName,
    });
    return { customerId: session.customerId };
  });

/** Sign-out counterpart. No auth required — it only clears a cookie. */
export const clearMedusaSession = createServerFn({ method: "POST" }).handler(async () => {
  authServer.clearMedusaSession();
  return { ok: true as const };
});
