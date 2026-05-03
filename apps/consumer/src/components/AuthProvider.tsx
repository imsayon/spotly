'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // Fallback: If URL has hash but getSession misses it initially, try checking hash
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If we didn't get a session but there's an access token in the URL, wait for onAuthStateChange to handle it
      if (!session && hash.includes('access_token')) return;
      
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
