'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Merchant, Outlet, QueueEntry } from '@spotly/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, Users, MapPin, Building2, TrendingUp, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    loadDashboard();
  }, [user, loading]);

  const loadDashboard = async () => {
    setFetching(true);
    try {
      const [merchantRes] = await Promise.all([
        api.get('/merchant/me/profile'),
      ]);
      const m: Merchant | null = merchantRes.data.data;
      setMerchant(m);

      if (!m) {
        router.replace('/onboarding');
        return;
      }

      const outletsRes = await api.get(`/outlet/merchant/${m.id}`);
      const outs: Outlet[] = outletsRes.data.data ?? [];
      setOutlets(outs);

      const counts: Record<string, number> = {};
      await Promise.all(
        outs.map(async (o) => {
          const qRes = await api.get(`/queue/${o.id}`);
          counts[o.id] = (qRes.data.data as QueueEntry[]).filter(
            (e) => e.status === 'WAITING',
          ).length;
        }),
      );
      setQueueCounts(counts);
    } finally {
      setFetching(false);
    }
  };

  const totalWaiting = Object.values(queueCounts).reduce((a, b) => a + b, 0);

  if (loading || fetching) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <Sparkles className="w-8 h-8 text-brand-500 animate-pulse-slow mb-4" />
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase">Loading Portal</p>
      </div>
    );
  }

  // Define staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="pb-20"
    >
      <motion.header variants={itemVariants} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Overview
          </h1>
          <p className="text-gray-400">
            {merchant ? `Welcome back, ${merchant.name}. Here's what's happening today.` : 'Set up your merchant profile to get started.'}
          </p>
        </div>
        {!merchant && (
          <Link href="/outlets" className="btn-primary">
            Create Profile
          </Link>
        )}
      </motion.header>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 text-brand-400">
            <Store className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Outlets</p>
          <p className="text-3xl font-bold text-white tracking-tight">{outlets.length}</p>
        </div>
        
        <div className="stat-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 text-yellow-500">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Waiting Now</p>
          <p className="text-3xl font-bold text-yellow-400 tracking-tight">{totalWaiting}</p>
        </div>
        
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Category</p>
          <p className="text-3xl font-bold text-white tracking-tight capitalize truncate">
            {merchant?.category || '—'}
          </p>
        </div>
      </motion.div>

      {/* Outlets List */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            Active Outlets Insight
          </h2>
        </div>

        {!merchant ? (
          <div className="glass-panel text-center py-20 rounded-2xl flex flex-col items-center border-dashed border-gray-700">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Profile Pending</p>
            <p className="text-gray-500 text-sm mb-6 max-w-md">You need to configure your business identity before managing queues.</p>
            <Link href="/outlets" className="btn-primary">Setup Business</Link>
          </div>
        ) : outlets.length === 0 ? (
          <div className="glass-panel text-center py-20 rounded-2xl flex flex-col items-center border-dashed border-gray-700">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">No Service Areas</p>
            <Link href="/outlets" className="btn-secondary">Add Your First Outlet</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {outlets.map((o) => (
              <div key={o.id} className="card flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                
                <div className="flex items-start justify-between mb-8 z-10">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-1 group-hover:text-brand-300 transition-colors">{o.name}</h3>
                    {o.address && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {o.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right bg-surface px-4 py-2 rounded-xl border border-border">
                    <p className="text-3xl font-black text-yellow-400 tracking-tight leading-none mb-1">
                      {queueCounts[o.id] ?? 0}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Waiting</p>
                  </div>
                </div>
                
                <div className="mt-auto z-10 pt-4 border-t border-border">
                  <Link href={`/queue?outletId=${o.id}`} className="btn-primary w-full shadow-none group-hover:bg-brand-500">
                    Open Control Board 
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
