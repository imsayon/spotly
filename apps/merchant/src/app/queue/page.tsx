'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueueEntry, Outlet, QueueUpdatePayload } from '@spotly/types';
import api from '@/lib/api';
import { joinOutletRoom, leaveOutletRoom, getSocket } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckSquare, Settings2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

function QueueContent() {
  const searchParams = useSearchParams();
  const outletId = searchParams.get('outletId') ?? '';

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(outletId);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [calling, setCalling] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => {
    api.get('/merchant/me/profile').then(async (res) => {
      const merchant = res.data.data;
      if (!merchant) return;
      const outRes = await api.get(`/outlet/merchant/${merchant.id}`);
      const outs: Outlet[] = outRes.data.data ?? [];
      setOutlets(outs);
      if (!selectedOutlet && outs.length > 0) {
        setSelectedOutlet(outs[0].id);
      }
    });
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!selectedOutlet) return;
    setLoadingQueue(true);
    const res = await api.get(`/queue/${selectedOutlet}`);
    setEntries(res.data.data ?? []);
    setLoadingQueue(false);
  }, [selectedOutlet]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!selectedOutlet) return;
    joinOutletRoom(selectedOutlet);
    const socket = getSocket();

    const onQueueUpdate = (payload: QueueUpdatePayload) => {
      if (payload.outletId === selectedOutlet) {
        setEntries(payload.entries);
      }
    };

    socket.on('queue_update', onQueueUpdate);
    return () => {
      leaveOutletRoom(selectedOutlet);
      socket.off('queue_update', onQueueUpdate);
    };
  }, [selectedOutlet]);

  const callNext = async () => {
    if (!selectedOutlet) return;
    setCalling(true);
    try {
      await api.post('/queue/next', { outletId: selectedOutlet });
    } finally {
      setCalling(false);
    }
  };

  const markServed = async (entryId: string) => {
    await api.post(`/queue/served/${entryId}`, { outletId: selectedOutlet });
  };

  const waiting = entries.filter((e) => e.status === 'WAITING');
  const called = entries.find((e) => e.status === 'CALLED');

  return (
    <div className="pb-20 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Queue Operator <ShieldCheck className="text-brand-500 w-6 h-6" />
          </h1>
          <p className="text-gray-400">Control the flow of traffic in real-time.</p>
        </div>
        
        {outlets.length > 0 && (
          <div className="relative group">
            <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="pl-9 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-brand-500 appearance-none drop-shadow-md hover:bg-surface/80 transition-colors"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {/* Control Deck */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
        
        {/* Currently Serving Block */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center border-brand-500/20 group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          
          <p className="text-xs text-brand-400 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Currently Serving
          </p>
          
          <div className="text-[5rem] font-black text-white leading-none tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {called ? <AnimatePresence mode="popLayout"><motion.span key={called.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}>#{called.tokenNumber}</motion.span></AnimatePresence> : '—'}
          </div>
          
          <AnimatePresence>
            {called && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                onClick={() => markServed(called.id)}
                className="btn-primary"
              >
                <CheckSquare className="w-5 h-5" /> Mark Completed
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Call Next Engine */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="md:col-span-3 glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-400 font-medium tracking-wide mb-6">
            <strong className="text-white text-xl">{waiting.length}</strong> people waiting
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={callNext}
            disabled={calling || waiting.length === 0}
            className={`
              relative overflow-hidden w-full max-w-sm rounded-2xl py-6 text-xl font-bold transition-all duration-300
              ${waiting.length > 0 
                ? 'bg-gradient-to-r from-blue-600 to-brand-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] border border-brand-400/50' 
                : 'bg-surface/50 text-gray-500 border border-border cursor-not-allowed'}
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {calling ? (
                <><span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> Engaging...</>
              ) : (
                <><Bell className={`w-6 h-6 ${waiting.length > 0 ? 'animate-bounce' : ''}`} /> Call Next Person</>
              )}
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* The Live List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-white">Live Tracking Board</h2>
          <span className="bg-surface border border-border rounded-full px-3 py-1 text-xs font-bold text-gray-400">{entries.length} Total</span>
        </div>

        {loadingQueue ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-surface/50 rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium text-white">The board is clear.</p>
            <p className="text-sm text-gray-400">No one is currently waiting.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((entry) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  key={entry.id}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-500 ${
                    entry.status === 'CALLED'
                      ? 'bg-blue-500/10 border-blue-500/30 shadow-[inset_4px_0_0_rgba(59,130,246,0.5)]'
                      : 'bg-surface/30 border-border hover:bg-surface/60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface rounded-xl border border-border flex items-center justify-center font-black text-xl text-white shadow-inner">
                      {entry.tokenNumber}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
                      <span className={`badge badge-${entry.status.toLowerCase()}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Joined</p>
                    <span className="text-sm font-medium text-gray-300 bg-surface/50 px-2 py-1 rounded-lg border border-border">
                      {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <QueueContent />
    </Suspense>
  );
}
