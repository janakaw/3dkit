import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Current Supabase user on the client: `undefined` while the first
 * `getSession()` is still resolving, `null` when signed out, else the
 * user. Tracks sign-in/sign-out via `onAuthStateChange`. Used by
 * components that only need "is anyone signed in?" (e.g. to enable the
 * library query) rather than a full profile.
 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
