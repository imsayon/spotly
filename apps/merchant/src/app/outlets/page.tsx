'use client';

import { useEffect, useState } from 'react';
import { Merchant, Outlet } from '@spotly/types';
import api from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, MapPin, Plus, ArrowRight, Building } from 'lucide-react';

export default function OutletsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  // Merchant creation states
  const [merchantName, setMerchantName] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('');
  const [creatingMerchant, setCreatingMerchant] = useState(false);

  // Merchant profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Outlet creation states
  const [outletName, setOutletName] = useState('');
  const [outletAddress, setOutletAddress] = useState('');
  const [creatingOutlet, setCreatingOutlet] = useState(false);
  const [showOutletForm, setShowOutletForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/merchant/me/profile');
      const m: Merchant | null = res?.data?.data || null;
      setMerchant(m);
      if (m) {
        const oRes = await api.get(`/outlet/merchant/${m.id}`);
        setOutlets(oRes?.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load merchant profile:', err);
      // Fallback state if API throws
      setMerchant(null);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMerchant(true);
    try {
      await api.post('/merchant', { name: merchantName, category: merchantCategory });
      setMerchantName(''); setMerchantCategory('');
      await load();
    } finally {
      setCreatingMerchant(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.patch('/merchant/me', {
        name: editName,
        category: editCategory,
        description: editDesc,
        contactEmail: editEmail,
        phone: editPhone
      });
      setIsEditingProfile(false);
      await load();
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOutlet(true);
    try {
      await api.post('/outlet', { name: outletName, address: outletAddress });
      setOutletName(''); setOutletAddress('');
      setShowOutletForm(false);
      await load();
    } finally {
      setCreatingOutlet(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-20 max-w-4xl">
      <motion.header variants={itemVariants} className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Outlets Center</h1>
          <p className="text-gray-400">Add, configure, and manage your physical locations.</p>
        </div>
        {merchant && (
          <button 
            onClick={() => setShowOutletForm(!showOutletForm)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Outlet
          </button>
        )}
      </motion.header>

      {/* Create Merchant Profile Shell */}
      {!merchant && (
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-3xl max-w-lg border-brand-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-surface border border-border flex items-center justify-center rounded-xl mb-6">
              <Building className="w-6 h-6 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Establish Identity</h2>
            <p className="text-gray-400 text-sm mb-6">Let's set up your core merchant account. This represents your umbrella business.</p>
            
            <form onSubmit={handleCreateMerchant} className="space-y-4">
              <div>
                <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Registered Name</label>
                <input
                  type="text" required value={merchantName} onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Spotly Coffee House"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:bg-surface transition-all"
                />
              </div>
              <div>
                <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Business Category</label>
                <input
                  type="text" required value={merchantCategory} onChange={(e) => setMerchantCategory(e.target.value)}
                  placeholder="e.g. Cafe, Clinic, Agency"
                  className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 focus:bg-surface transition-all"
                />
              </div>
              <button type="submit" disabled={creatingMerchant} className="btn-primary w-full mt-2">
                {creatingMerchant ? 'Initializing...' : 'Create Merchant Profile'}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {merchant && isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel p-8 rounded-3xl max-w-lg w-full border-brand-500/20 shadow-2xl relative"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Edit Identity</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Registered Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Category</label>
                  <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="About your business..." className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 resize-none h-24" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Support Email</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="text-xs tracking-wider uppercase text-gray-500 font-semibold mb-1 block">Phone Number</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border mt-6">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={updatingProfile} className="btn-primary flex-1">{updatingProfile ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Managed Environment Top Section */}
      {merchant && (
        <div className="space-y-8">
          {/* Merchant Identity Banner */}
          <motion.div variants={itemVariants} className="card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-brand-500/10" />
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-brand-500/20 border border-brand-500/30 text-brand-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{merchant.name}</h2>
                  <p className="text-brand-400 font-medium text-sm mb-2 uppercase tracking-wide">{merchant.category}</p>
                  
                  {merchant.description && <p className="text-gray-400 text-sm max-w-lg mb-4">{merchant.description}</p>}
                  
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500">
                    {merchant.contactEmail && <span>📧 {merchant.contactEmail}</span>}
                    {merchant.phone && <span>📞 {merchant.phone}</span>}
                    {merchant.createdAt && <span className="text-gray-600">Established {new Date(merchant.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setEditName(merchant.name);
                  setEditCategory(merchant.category);
                  setEditDesc(merchant.description || '');
                  setEditEmail(merchant.contactEmail || '');
                  setEditPhone(merchant.phone || '');
                  setIsEditingProfile(true);
                }}
                className="btn-secondary"
              >
                Configure
              </button>
            </div>
          </motion.div>
          {outlets.length === 0 && !showOutletForm ? (
            <motion.div variants={itemVariants} className="glass-panel text-center py-24 rounded-3xl border-dashed border-gray-700">
              <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">You have no active outlets</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">Outlets represent physical or virtual locations where a queue is maintained.</p>
              <button onClick={() => setShowOutletForm(true)} className="btn-primary">
                Deploy First Outlet
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {/* Create Outlet Form Dropdown */}
                {showOutletForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-panel p-6 rounded-2xl mb-8 border-brand-500/30 bg-brand-950/20">
                      <h3 className="text-lg font-bold text-white mb-4">Register New Outlet</h3>
                      <form onSubmit={handleCreateOutlet} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                          <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider font-semibold">Name</label>
                          <input
                            type="text" required value={outletName} onChange={(e) => setOutletName(e.target.value)}
                            placeholder="e.g. Downtown Branch"
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider font-semibold">Address (Optional)</label>
                          <input
                            type="text" value={outletAddress} onChange={(e) => setOutletAddress(e.target.value)}
                            placeholder="123 Main St"
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                          />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button type="button" onClick={() => setShowOutletForm(false)} className="btn-secondary">Cancel</button>
                          <button type="submit" disabled={creatingOutlet} className="btn-primary shrink-0">
                            {creatingOutlet ? 'Saving...' : 'Confirm'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Outlet Tiles */}
              {outlets.map((o) => (
                <motion.div variants={itemVariants} key={o.id} className="card group flex items-center justify-between hover:bg-surface/80">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-brand-300 transition-colors">{o.name}</h3>
                      {o.address ? (
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" /> {o.address}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 italic mt-0.5">No address listed</p>
                      )}
                    </div>
                  </div>
                  
                  <Link href={`/queue?outletId=${o.id}`} className="btn-secondary opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    Enter Queue <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
