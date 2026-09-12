"use client";

import { useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setIdentityError = useAuthStore((state) => state.setIdentityError);

  useEffect(() => {
    let mounted = true;
    if (window.location.pathname.startsWith("/design-preview")) {
      setLoading(false);
      return;
    }
    const resolve = (sessionUser: SupabaseUser | null) => {
      if (!mounted) return;
      void setUser(sessionUser).catch(() => {
        if (mounted)
          setIdentityError("We couldn't load your workspace. Try again.");
      });
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (mounted) {
          setLoading(false);
          setIdentityError("We couldn't check your session. Try again.");
        }
        return;
      }
      resolve(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "PASSWORD_RECOVERY") {
        window.location.replace("/auth/update-password");
        return;
      }
      setTimeout(() => {
        if (mounted) resolve(session?.user ?? null);
      }, 0);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setIdentityError, setLoading, setUser]);

  return <>{children}</>;
}
