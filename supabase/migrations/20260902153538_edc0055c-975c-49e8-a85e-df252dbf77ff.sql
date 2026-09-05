-- Bookkeeping-only link between a 3Dkit shopper (Supabase auth.users) and
-- the Medusa order(s) they've placed. Medusa itself has no customer
-- accounts (every cart/order there is anonymous/guest, see decisions doc)
-- and the two identity systems remain deliberately unlinked beyond this
-- one table — this does NOT create a Medusa customer, it just records
-- "this Supabase user placed this Medusa order" after the fact, once the
-- order has genuinely succeeded server-side (see cart.server.ts's
-- `recordOrderForUser`, called from `placeOrder()`).
--
-- Rows are written exclusively by the server via the service-role client
-- (bypasses RLS) immediately after a real Medusa order is created —
-- `authenticated` gets SELECT only, so a signed-in shopper can read their
-- own order history but can never insert/forge a row claiming an order
-- that wasn't actually placed.
CREATE TABLE public.order_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  medusa_order_id TEXT NOT NULL,
  email TEXT,
  total BIGINT,
  currency_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (medusa_order_id)
);

GRANT SELECT ON public.order_records TO authenticated;
GRANT ALL ON public.order_records TO service_role;

ALTER TABLE public.order_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders" ON public.order_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for `authenticated` at all — deliberate.
-- Only `service_role` (server-side, via supabaseAdmin) can write here.

CREATE INDEX order_records_user_id_idx ON public.order_records (user_id);
