'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, Zap, Smartphone, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, signInWithGoogle, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null; // Let the auth provider naturally load smoothly

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center pt-20">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[150px] opacity-70 pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] opacity-70 pointer-events-none" />

      {/* Hero section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 font-semibold text-sm mb-8 backdrop-blur-md">
            <Store className="w-4 h-4" />
            Merchant Portal 1.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Manage your queues <br />
            <span className="text-gradient">with absolute clarity.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Turn chaotic waiting areas into streamlined digital queues. Let your customers join from their phones while you oversee the floor in real-time.
          </p>

          <button
            onClick={async () => {
              await signInWithGoogle();
              router.push('/dashboard');
            }}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-brand-600 font-pj rounded-2xl hover:bg-brand-500 focus:outline-none shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] active:scale-95"
          >
            <span>Get Started with Google</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 mb-16 text-left"
        >
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-brand-500/20" />
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-time Syncing</h3>
            <p className="text-sm text-gray-400">Tokens are instantly synced across all devices using WebSockets. When you call someone, their phone alerts them immediately.</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cloud Dashboard</h3>
            <p className="text-sm text-gray-400">Manage multiple outlets from a single unified panel. Switch between zones effortlessly and track queue loads live.</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20" />
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
              <Store className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Brand Customization</h3>
            <p className="text-sm text-gray-400">Tailor your workspace to fit your brand identity. Set up your categories and business details so customers see exactly who's serving them.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
