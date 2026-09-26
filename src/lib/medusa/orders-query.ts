/**
 * TanStack Query wiring for the shopper's order history (Account →
 * Payments), mirroring library-query.ts. Dropped on sign-out alongside the
 * library, and invalidated after a successful checkout.
 */
import { queryOptions } from "@tanstack/react-query";
import { isMockDataSource } from "@/lib/catalog";
import { listOrders } from "./orders";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export const ordersQueryOptions = () =>
  queryOptions({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: () => listOrders(),
    enabled: !isMockDataSource,
    staleTime: 60_000,
  });
