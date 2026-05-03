'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    
    // Explicitly handle hash if Supabase misses it
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            const store = useAuthStore.getState();
            store.registerOnBackend('CONSUMER').then(() => store.fetchProfile());
          }
          if (typeof window !== 'undefined') {
            window.location.hash = '';
          }
        });
        return;
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const store = useAuthStore.getState();
        store.registerOnBackend('CONSUMER').then(() => store.fetchProfile());
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && event === 'SIGNED_IN') {
        const store = useAuthStore.getState();
        await store.registerOnBackend('CONSUMER');
        await store.fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
