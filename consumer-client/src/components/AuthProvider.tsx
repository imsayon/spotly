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

    const resolveIdentity = async (sessionUser: SupabaseUser | null) => {
      if (!mounted) return;
      const store = useAuthStore.getState();
      store.setUser(sessionUser);
      if (!sessionUser) return;
      try {
        setLoading(true);
        let profile = await store.fetchProfile();
        if (!mounted || useAuthStore.getState().user?.id !== sessionUser.id) return;
        if (!profile) {
          await store.registerOnBackend("CONSUMER");
          profile = await store.fetchProfile();
        }
        if (mounted) setIdentityError(null);
      } catch {
        if (mounted)
          setIdentityError("We couldn't load your account. Try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setLoading(true);
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (mounted) {
          setUser(null);
          setIdentityError("We couldn't check your session. Try again.");
          setLoading(false);
        }
        return;
      }
      void resolveIdentity(session?.user ?? null);
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
        if (mounted) void resolveIdentity(session?.user ?? null);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setIdentityError, setLoading, setUser]);

  return <>{children}</>;
}
