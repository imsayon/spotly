'use client';

import { useEffect } from 'react';
import { browserSessionPersistence, onAuthStateChanged, setPersistence, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    const auth = getFirebaseAuth();
    const clearLegacyMerchantSession = async () => {
      try {
        // One-time cleanup to remove previously persisted merchant login data.
        if (!window.localStorage.getItem('merchant-auth-reset-v2')) {
          const shouldRemoveKey = (key: string) =>
            key.startsWith('firebase:authUser:') ||
            key.startsWith('firebase:host:') ||
            key.startsWith('firebase:redirectEvent:') ||
            key.startsWith('merchant-auth-');

          Object.keys(window.localStorage)
            .filter(shouldRemoveKey)
            .forEach((key) => window.localStorage.removeItem(key));

          Object.keys(window.sessionStorage)
            .filter(shouldRemoveKey)
            .forEach((key) => window.sessionStorage.removeItem(key));

          await signOut(auth).catch(() => undefined);
          window.localStorage.setItem('merchant-auth-reset-v2', 'true');
        }
        await setPersistence(auth, browserSessionPersistence);
      } catch {
        // Keep auth listener active even if persistence setup fails.
      }
    };

    void clearLegacyMerchantSession();

    const unsub = onAuthStateChanged(auth, (user) => setUser(user));
    return unsub;
  }, [setUser]);
  return <>{children}</>;
}
