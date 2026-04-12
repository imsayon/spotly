'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => setUser(user));
    return unsub;
  }, [setUser]);
  return <>{children}</>;
}
