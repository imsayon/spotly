'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePathname, useRouter } from 'next/navigation';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, merchantProfile, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/') {
      router.replace('/');
      return;
    }

    if (user && pathname !== '/') {
      if (!merchantProfile && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (merchantProfile && pathname === '/onboarding') {
        router.replace('/dashboard');
      }
    }
  }, [user, merchantProfile, loading, pathname, router]);

  // Optionally show a loading spinner
  if (loading) return null;

  return <>{children}</>;
}
