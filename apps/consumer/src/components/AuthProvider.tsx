'use client';

import { useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const registerOnBackend = useAuthStore((s) => s.registerOnBackend);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await registerOnBackend('CONSUMER');
        await fetchProfile();
      }
    });

    return () => unsubscribe();
  }, [fetchProfile, registerOnBackend, setUser]);

  return <>{children}</>;
}
