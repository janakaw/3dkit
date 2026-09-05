import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

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
    return { user: data.user };
  },
  component: () => <Outlet />,
});
