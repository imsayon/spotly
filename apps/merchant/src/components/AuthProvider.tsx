'use client';
import { useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
      setUser(user); 
      if (user) {
        useAuthStore.getState().fetchMerchantProfile();
      }
    });
  }, [setUser]);

  return <>{children}</>;
}
