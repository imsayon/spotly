'use client';

import { useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const store = useAuthStore.getState();
        await store.registerOnBackend('CONSUMER');
        await store.fetchProfile();
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
