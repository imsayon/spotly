"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME, Orb } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore } from "@/store/queue.store"
import api from "@/lib/api"
import { Merchant, Outlet, QueueEntry } from "@spotly/types"

const s = {
  ...THEME.styles,
  banner: {
    height: 240,
    borderRadius: 28,
    background: 'rgba(255,255,255,.02)',
    border: '1px solid rgba(255,255,255,.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 32,
    boxShadow: 'inset 0 0 60px rgba(245,196,24,.03)'
  } as React.CSSProperties,
  outletCard: {
    ...THEME.styles.card,
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '24px',
    cursor: 'pointer',
    transition: 'all .3s ease',
    marginBottom: 14,
    borderRadius: 22,
    background: 'rgba(255,255,255,.01)',
    backdropFilter: 'blur(10px)',
  } as React.CSSProperties,
  btnJoin: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 14,
    background: THEME.gradients.consumer,
    color: '#000',
    fontWeight: 900,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .25s ease',
    boxShadow: '0 8px 20px rgba(245,196,24,.2)'
  } as React.CSSProperties,
  badge: THEME.badge,
};

interface OutletWithQueue extends Outlet {
  queueLength: number;
  estimatedWait: string;
}

export default function ConsumerMerchantPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { joinQueue, myEntry } = useQueueStore()
  const { add: addToast } = useToasts()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [outlets, setOutlets] = useState<OutletWithQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mRes, oRes] = await Promise.all([
          api.get(`/merchant/${id}`),
          api.get(`/outlet/merchant/${id}`)
        ]);
        setMerchant(mRes.data.data);
        
        const outletList: Outlet[] = oRes.data.data || [];
        const enriched = await Promise.all(outletList.map(async (o) => {
          try {
            const qRes = await api.get(`/queue/${o.id}`);
            const entries: QueueEntry[] = qRes.data.data || [];
            const waittime = entries.length * 5; // Simple heuristic
            return { 
              ...o, 
              queueLength: entries.length, 
              estimatedWait: waittime > 0 ? `${waittime}m` : 'No wait' 
            };
          } catch {
            return { ...o, queueLength: 0, estimatedWait: '??' };
          }
        }));
        setOutlets(enriched);
      } catch (err) {
        addToast('Failed to load merchant details', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id, addToast]);

  const handleJoin = async (outletId: string) => {
    if (!user) {
      addToast('Please sign in to join the queue', 'info');
      return;
    }
    
    if (myEntry) {
      if (myEntry.outletId === outletId) {
        router.push(`/queue/${myEntry.id}`);
        return;
      }
      if (!confirm('You are already in another queue. Leave that and join this one?')) return;
      try { await useQueueStore.getState().leaveQueue(myEntry.id); } catch {}
    }

    setJoiningId(outletId);
    try {
      const entry = await joinQueue(outletId);
      addToast('Joined queue successfully!', 'success');
      router.push(`/queue/${entry.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to join', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.03)', borderTopColor: '#f5c418', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto' }}
    >
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <motion.button 
          whileHover={{ scale: 1.05, background: 'rgba(255,255,255,.08)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/home')} 
          style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </motion.button>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>Branch Selection</h1>
      </div>

      {/* BANNER */}
      <div style={s.banner}>
        <Orb x="-10%" y="-10%" size="80%" color="rgba(245,196,24,.1)" anim="orb1 15s infinite" />
        <Orb x="60%" y="40%" size="60%" color="rgba(255,99,22,.05)" anim="orb2 20s infinite" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 16, margin: '0 auto', color: '#f5c418' }}>
            {merchant.category?.toLowerCase()?.includes('coffee') ? <Ic.Clock /> : <Ic.Store />}
          </div>
          <div style={{ ...s.badge('consumer'), fontSize: 11, background: 'rgba(255,255,255,.05)', padding: '5px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>{merchant.category}</div>
        </div>
      </div>

      {/* INFO */}
      <div style={{ marginBottom: 44 }}>
        <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 12, letterSpacing: -1.2, color: '#fff' }}>{merchant.name}</h2>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>{merchant.description || 'Welcome to our premium outlet. Join the queue digitally and save your time.'}</p>
      </div>

      {/* OUTLETS */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 4, height: 16, borderRadius: 2, background: '#f5c418' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: 1, textTransform: 'uppercase' }}>Active Branches</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {outlets.map((o, i) => (
            <motion.div 
              key={o.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01, border: '1px solid rgba(255,255,255,.12)' }}
              style={s.outletCard}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 6, color: '#fff' }}>{o.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: 600 }}>
                  <Ic.MapPin /><span>{o.address || 'Location unavailable'}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1fd97c' }} />
                    {o.queueLength} People
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#f5c418' }}>
                    <Ic.Clock /> {o.estimatedWait} wait
                  </div>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleJoin(o.id)}
                disabled={joiningId === o.id}
                style={{ 
                  ...s.btnJoin, 
                  background: myEntry?.outletId === o.id ? 'rgba(31,217,124,.1)' : THEME.gradients.consumer,
                  color: myEntry?.outletId === o.id ? '#1fd97c' : '#000',
                  border: myEntry?.outletId === o.id ? '1px solid rgba(31,217,124,.2)' : 'none',
                  boxShadow: myEntry?.outletId === o.id ? 'none' : s.btnJoin.boxShadow
                }}
              >
                {joiningId === o.id ? '...' : myEntry?.outletId === o.id ? 'Active' : 'Get Token'}
                {!myEntry && <Ic.ChevR />}
              </motion.button>
            </motion.div>
          ))}
          {outlets.length === 0 && (
            <div style={{ ...s.card, padding: 60, textAlign: 'center', background: 'rgba(255,255,255,.01)', borderStyle: 'dashed' }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'center' }}>
                <Ic.Store />
              </div>
              <p style={{ color: 'rgba(255,255,255,.6)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No Active Branches</p>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>This merchant currently has no open outlets.</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER TIPS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <motion.div whileHover={{ y: -2 }} style={{ ...s.card, padding: '20px', background: 'rgba(255,255,255,.02)', borderRadius: 22 }}>
          <div style={{ color: '#f5c418', marginBottom: 12 }}><Ic.Bell /></div>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Real-time Alerts</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', lineHeight: 1.4 }}>Instant push notifications when your turn is approaching.</div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} style={{ ...s.card, padding: '20px', background: 'rgba(255,255,255,.02)', borderRadius: 22 }}>
          <div style={{ color: '#1fd97c', marginBottom: 12 }}><Ic.Shield /></div>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Secured Entry</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', lineHeight: 1.4 }}>Verified tokens ensure a fair and organized experience.</div>
        </motion.div>
      </div>

    </motion.div>
  )
}
