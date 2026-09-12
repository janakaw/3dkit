/**
 * Client-safe entry point for order lookups — see cart.ts's header comment
 * for why this thin `createServerFn()` wrapper layer exists at all
 * (orders.server.ts touches cookies, which makes it server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import type { HttpTypes } from "@medusajs/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as ordersServer from "./orders.server";

export const retrieveOrder = createServerFn({ method: "POST", strict: { output: false } })
  .middleware([requireSupabaseAuth])
  .validator((orderId: string) => orderId)
  .handler(({ data: orderId, context }): Promise<HttpTypes.StoreOrder | null> => {
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
    return ordersServer.retrieveOrder(orderId, {
      supabaseAccessToken: context.accessToken,
      email,
      displayName,
    });
  });
