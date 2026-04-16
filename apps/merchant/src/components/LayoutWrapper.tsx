'use client';

import { useAuthStore } from '@/store/auth.store';
import { usePathname } from 'next/navigation';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthStore();
  const pathname = usePathname();

  // Dashboard routes have their own layout.tsx — skip all wrapping.
  // Landing page (/) and onboarding also manage themselves.
  const isDashboard = pathname.startsWith('/dashboard');
  const isLanding = pathname === '/';
  const isOnboarding = pathname.startsWith('/onboarding');

  if (isLanding || isDashboard || isOnboarding || loading) {
    return <>{children}</>;
  }

  // Fallback: just render children
  return <>{children}</>;
}
