'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false,
  loading: () => <div style={{ height: '200px', background: 'rgba(255,255,255,.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
})

export function OnboardingModal() {
  const { profile, updateProfile, forceOnboarding } = useAuthStore();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Show if profile exists but missing key details, OR if forced for the demo
  const isOpen = forceOnboarding || (!!profile && (!profile.phone || !profile.location));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateProfile(formData);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
        {/* Animated Background Orbs for Onboarding */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* Modal Content - Full Screen / Mandatory Style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-xl p-10"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mb-8 shadow-2xl shadow-yellow-500/20">
              <MapPin className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Finish Setting Up</h2>
            <p className="text-neutral-400 text-lg max-w-md">
              Enter your details to discover real-time queues and local shops in your neighborhood.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-yellow-500/30 focus:ring-4 focus:ring-yellow-500/5 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-yellow-500/30 focus:ring-4 focus:ring-yellow-500/5 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 ml-1">Local Neighborhood / City</label>
              <div className="relative group">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-white font-bold placeholder:text-neutral-700 focus:outline-none focus:border-yellow-500/30 focus:ring-4 focus:ring-yellow-500/5 transition-all mb-4"
                  placeholder="e.g. San Francisco"
                />
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <MapPicker 
                  onSelect={(lat, lng, label) => setFormData({ ...formData, location: label || "" })} 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full h-16 flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Explore my City</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
