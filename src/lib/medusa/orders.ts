/**
 * Client-safe entry point for order lookups — see cart.ts's header comment
 * for why this thin `createServerFn()` wrapper layer exists at all
 * (orders.server.ts touches cookies, which makes it server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import type { HttpTypes } from "@medusajs/types";
import * as ordersServer from "./orders.server";

export const retrieveOrder = createServerFn({ method: "POST", strict: { output: false } })
  .validator((orderId: string) => orderId)
  .handler(({ data: orderId }): Promise<HttpTypes.StoreOrder | null> =>
    ordersServer.retrieveOrder(orderId),
  );
