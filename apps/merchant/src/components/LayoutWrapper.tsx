'use client';

import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const pathname = usePathname();

  // If loading or unauthenticated (on landing page), don't show the dashboard shell.
  if (loading || !user || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="min-h-full p-8 lg:p-12 max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
