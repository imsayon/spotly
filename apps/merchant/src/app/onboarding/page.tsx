'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Plus, Store, Loader2 } from 'lucide-react';

const CATEGORIES = ['Grocery', 'Pharmacy', 'Food & Beverage', 'Salon/Spa', 'Retail', 'Other'] as const;

type CategoryType = typeof CATEGORIES[number];

const SUGGESTED_ITEMS: Record<CategoryType, string[]> = {
  Grocery: ['Rice', 'Wheat Flour', 'Sugar', 'Salt', 'Cooking Oil', 'Milk', 'Eggs', 'Bread', 'Pulses', 'Tea/Coffee'],
  Pharmacy: ['Paracetamol', 'Antacids', 'Bandages', 'BP Monitor', 'Thermometer', 'Vitamins', 'Cough Syrup'],
  'Food & Beverage': ['Burger', 'Sandwich', 'Juice', 'Coffee', 'Tea', 'Snacks', 'Meals'],
  'Salon/Spa': ['Haircut', 'Shave', 'Facial', 'Hair Colour', 'Manicure', 'Pedicure'],
  Retail: ['Clothing', 'Footwear', 'Accessories', 'Electronics', 'Stationery'],
  Other: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<CategoryType | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [customItem, setCustomItem] = useState('');

  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const res = await api.get('/merchant/me/profile');
        if (res?.data?.data) {
          router.replace('/dashboard');
        }
      } catch {
        // Stay on onboarding when profile is absent or unauthenticated.
      }
    };

    checkExistingProfile();
  }, [router]);

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!businessName || !category || !phoneNumber || !businessAddress) {
        setError('Please fill in all fields');
        return;
      }
      if (!outletName) setOutletName(`${businessName} - Main`);
      if (!outletAddress) setOutletAddress(businessAddress);
    }
    setStep((s) => s + 1);
  };

  const toggleItem = (item: string) => {
    const next = new Set(selectedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setSelectedItems(next);
  };

  const addCustomItem = () => {
    if (!customItem.trim()) return;
    const next = new Set(selectedItems);
    next.add(customItem.trim());
    setSelectedItems(next);
    setCustomItem('');
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/merchant', {
        name: businessName,
        category,
      });

      await api.patch('/merchant/me', {
        phone: phoneNumber,
        description: selectedItems.size > 0 ? `Inventory: ${Array.from(selectedItems).join(', ')}` : undefined,
      });

      await api.post('/outlet', {
        name: outletName,
        address: outletAddress,
      });

      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-20 px-4">
      <div className="w-full max-w-xl">
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-brand-500 -translate-y-1/2 rounded transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                i <= step ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 text-gray-400'
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-500/30">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Let&apos;s set up your business</h2>
                  <p className="text-gray-400 text-sm mb-6">Enter your core business details.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Joe's Coffee" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as CategoryType)} className="w-full bg-[#1a1c23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500">
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500" placeholder="+1 234 567 8900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Business Address</label>
                  <textarea value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 resize-none h-24" placeholder="123 Main St..." />
                </div>

                <div className="pt-4 flex justify-end">
                  <button onClick={handleNextStep} className="btn-primary flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Inventory Quick Setup</h2>
                  <p className="text-gray-400 text-sm mb-6">Select from suggested items and add your own. You can change this later.</p>
                </div>

                {category && category !== 'Other' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Popular Options</label>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_ITEMS[category].map((item) => {
                        const isSelected = selectedItems.has(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleItem(item)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Add Item</label>
                  <div className="flex gap-2">
                    <input type="text" value={customItem} onChange={(e) => setCustomItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomItem()} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Rice, Tea, Bread" />
                    <button onClick={addCustomItem} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selectedItems.size > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Selected Items ({selectedItems.size})</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedItems).map((item) => (
                        <div key={item} className="px-3 py-1 bg-brand-500/10 text-brand-300 border border-brand-500/30 rounded-full text-sm flex items-center gap-2">
                          {item}
                          <button onClick={() => toggleItem(item)} className="text-brand-500/70 hover:text-brand-300">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-8 flex justify-between">
                  <button onClick={() => setStep((s) => s - 1)} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Back</button>
                  <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Outlet Details</h2>
                  <p className="text-gray-400 text-sm mb-6">Configure your first location.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Outlet Name</label>
                  <input type="text" value={outletName} onChange={(e) => setOutletName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Outlet Address</label>
                  <textarea value={outletAddress} onChange={(e) => setOutletAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 resize-none h-24" />
                </div>

                <div className="pt-8 flex justify-between">
                  <button onClick={() => setStep((s) => s - 1)} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Back</button>
                  <button onClick={() => {
                    if (!outletName || !outletAddress) setError('Please fill all fields');
                    else setStep((s) => s + 1);
                  }} className="btn-primary flex items-center gap-2">Review <ChevronRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
                    <Store className="w-8 h-8 text-brand-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">You&apos;re almost ready!</h2>
                  <p className="text-gray-400 text-sm">Review your details before launch.</p>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-3 text-sm text-gray-300">
                  <p><span className="text-white font-semibold">Business:</span> {businessName}</p>
                  <p><span className="text-white font-semibold">Category:</span> {category}</p>
                  <p><span className="text-white font-semibold">Phone:</span> {phoneNumber}</p>
                  <p><span className="text-white font-semibold">Business Address:</span> {businessAddress}</p>
                  <p><span className="text-white font-semibold">Outlet:</span> {outletName}</p>
                  <p><span className="text-white font-semibold">Outlet Address:</span> {outletAddress}</p>
                  <p><span className="text-white font-semibold">Items:</span> {selectedItems.size}</p>
                </div>

                <div className="pt-6 flex justify-between">
                  <button disabled={isLoading} onClick={() => setStep((s) => s - 1)} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Back</button>
                  <button disabled={isLoading} onClick={handleComplete} className="btn-primary flex items-center gap-2 disabled:opacity-70">
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</> : 'Complete & Launch Setup'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
