import type { EnsureMedusaSessionInput } from "./auth.server";

/**
 * Read the signed-in shopper's identity off the server-verified Supabase
 * claims that `requireSupabaseAuth` puts on the server-function context
 * (see auth-middleware.ts). Nothing about who is acting is ever taken from
 * a client-supplied payload. Shared by cart.ts, library.ts and auth.ts.
 */
export function identityFromContext(context: {
  claims: unknown;
  accessToken: string;
}): EnsureMedusaSessionInput {
  const claims = context.claims as Record<string, unknown>;
  const email = typeof claims["email"] === "string" ? (claims["email"] as string) : "";
  if (!email) {
    throw new Error("Signed-in user has no email claim.");
  }
  const meta = claims["user_metadata"];
  const displayName =
    meta &&
    typeof meta === "object" &&
    typeof (meta as Record<string, unknown>)["display_name"] === "string"
      ? ((meta as Record<string, unknown>)["display_name"] as string)
      : undefined;
  return { supabaseAccessToken: context.accessToken, email, displayName };
}
