'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for conditional tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Queue', href: '/queue', icon: Users },
    { name: 'Outlets', href: '/outlets', icon: Store },
  ];

  if (!user) return null;

  return (
    <aside className="w-64 border-r border-border bg-surface/30 backdrop-blur-md flex flex-col px-4 py-8 shrink-0 z-10 relative">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-gradient">
          Spotly
        </h1>
        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">
          Merchant Portal
        </p>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden',
                isActive
                  ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'
              )}
            >
              {/* Active glow dot */}
              {isActive && (
                <div className="absolute left-0 w-1 h-4 bg-brand-500 rounded-r-full shadow-[0_0_10px_rgba(34,197,94,1)]" />
              )}
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-6 px-2">
        <div className="flex items-center gap-3 mb-4 opacity-75">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-zinc-700" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white">
              {user.email?.[0].toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm text-zinc-200 font-medium truncate">{user.displayName || user.email?.split('@')[0] || 'Merchant'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
