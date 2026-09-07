import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureMedusaSession } from "@/lib/medusa/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      // Carries the page someone was trying to reach (e.g. /checkout with
      // a cart full of items) through sign-in, so completing auth returns
      // them there instead of always landing on /my-models — see
      // signin.tsx's use of this same `redirect` search param.
      throw redirect({ to: "/signin", search: { redirect: location.href } });
    }
    // Make sure Medusa knows this shopper as a customer before any page
    // under this layout (checkout, order confirmation) needs it, and hand
    // over any cart they built before signing in. Best-effort here:
    // `placeOrder` re-runs the same step itself and is the one that must
    // succeed, so a hiccup on page entry shouldn't lock someone out of
    // their saved models.
    try {
      await ensureMedusaSession();
    } catch (error) {
      console.warn("[auth] could not establish Medusa customer session on page entry", error);
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
