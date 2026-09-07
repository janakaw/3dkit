-- Retire public.order_records (decisions doc, Tier 13).
--
-- It was the only link between a Supabase user and a Medusa order, written
-- by the storefront after the fact and best-effort — which meant it was
-- missing for exactly the orders that failed (Tier 12). Medusa now knows
-- the customer directly: shoppers are Medusa customers via the backend's
-- `supabase` auth provider, every order carries `customer_id`, and order
-- history comes from Medusa's own `GET /store/orders` scoped by that
-- customer. Keeping a second copy here would only invite drift.
--
-- Nothing in the codebase reads or writes this table any more (the
-- storefront's `recordOrderForUser` was removed in the same change).

DROP POLICY IF EXISTS "Users view own orders" ON public.order_records;
DROP INDEX IF EXISTS public.order_records_user_id_idx;
DROP TABLE IF EXISTS public.order_records;
