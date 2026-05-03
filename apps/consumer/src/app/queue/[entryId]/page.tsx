"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME, Orb } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { QueueEntry } from "@spotly/types"
import { useQueueStore } from "@/store/queue.store"
import { getSocket, leaveOutletRoom } from "@/lib/socket"

const s = {
  ...THEME.styles,
  tokenCircle: {
    width: 240,
    height: 240,
    borderRadius: '50%',
    background: 'rgba(255,255,255,.01)',
    border: '1px solid rgba(255,255,255,.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 40px',
    position: 'relative',
  } as React.CSSProperties,
  statusBadge: {
    padding: '8px 20px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 32,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid currentColor',
    background: 'rgba(255,255,255,.05)'
  } as React.CSSProperties,
};

export default function ConsumerQueuePage() {
  const { entryId } = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const { add: addToast } = useToasts()
  const { entries, handleQueueUpdate, handleTokenCalled } = useQueueStore()

  const [entry, setEntry] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [ahead, setAhead] = useState(0)

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/queue/entry/${entryId}`);
        const currentEntry: QueueEntry = res.data.data;
        setEntry(currentEntry);

        // Fetch full queue to calculate initial ahead
        const queueRes = await api.get(`/queue/${currentEntry.outletId}`);
        const queueEntries = queueRes.data.data;
        const waitingAhead = queueEntries.filter((e: any) => 
          e.status === 'WAITING' && e.tokenNumber < currentEntry.tokenNumber
        ).length;
        setAhead(waitingAhead);
        
      } catch (err) {
        addToast('Failed to load reservation', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (entryId) fetchData();
  }, [entryId, addToast]);

  // 2. WebSocket Sync
  useEffect(() => {
    if (!entry?.outletId) return;

    let mounted = true;
    
    const initSocket = async () => {
      const socket = await getSocket();
      if (!mounted) return;

      socket.emit('join_outlet', { outletId: entry.outletId });

      socket.on('queue_update', (payload: any) => {
        handleQueueUpdate(payload);
        // Update local state if this entry is in the update
        const updated = payload.entries.find((e: any) => e.id === entryId);
        if (updated) setEntry(updated);
        
        // Calculate ahead
        const waitingAhead = payload.entries.filter((e: any) => 
          e.status === 'WAITING' && e.tokenNumber < (updated?.tokenNumber ?? entry.tokenNumber)
        ).length;
        setAhead(waitingAhead);
      });

      socket.on('token_called', (payload: any) => {
        if (payload.tokenNumber === entry.tokenNumber) {
          handleTokenCalled(payload.tokenNumber);
          setEntry(prev => prev ? { ...prev, status: 'CALLED' } : null);
        }
      });
    };

    initSocket();

    return () => {
      mounted = false;
      leaveOutletRoom(entry.outletId);
      // We don't disconnect the singleton socket
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.outletId, entryId, handleQueueUpdate, handleTokenCalled]);

  const handleLeave = async () => {
    if (!confirm('Abandon your spot in the queue? This cannot be undone.')) return;
    try {
      await api.delete(`/queue/leave/${entryId}`);
      addToast('Reservation cancelled', 'info');
      router.push('/home');
    } catch (err) {
      addToast('Failed to cancel reservation', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,.03)', borderTopColor: '#f5c418', borderRadius: '50%' }} 
        />
      </div>
    );
  }

  if (!entry) return null;

  const isCalled = entry.status === 'CALLED';
  const isServed = entry.status === 'SERVED';
  const isMissed = entry.status === 'MISSED';
  const isCancelled = entry.status === 'CANCELLED';
  const isWaiting = entry.status === 'WAITING';
  const isPending = entry.status === 'PENDING_ACCEPTANCE';
  const isTerminal = isMissed || isCancelled;

  const statusColor = isCalled ? '#1fd97c' : isTerminal ? '#ff4d6d' : isServed ? '#00cfff' : isPending ? '#a78bfa' : '#f5c418';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}
    >
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48, textAlign: 'left' }}>
        <motion.button 
          whileHover={{ scale: 1.05, background: 'rgba(255,255,255,.08)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/home')} 
          style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </motion.button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>Live Status</h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: 600 }}>Spotly Token Reservation</p>
        </div>
      </div>

      {/* TOKEN CIRCLE */}
      <div style={{ ...s.tokenCircle }}>
        <Orb x="-10%" y="-10%" size="120%" color={`${statusColor}08`} anim="orb1 10s infinite" />
        <motion.div 
          animate={{ scale: isCalled ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ 
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,.01)',
            border: `2px solid ${statusColor}40`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 60px ${statusColor}10`
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>TOKEN</div>
          <div style={{ fontSize: 84, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)', lineHeight: 1, letterSpacing: -2 }}>{entry.tokenNumber}</div>
        </motion.div>
      </div>

      {/* STATUS BADGE */}
      <div style={{ ...s.statusBadge, color: statusColor, borderColor: `${statusColor}30` }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
        {entry.status}
      </div>

      {/* MESSAGE */}
      <div style={{ marginBottom: 56 }}>
        <AnimatePresence mode="wait">
          {isCalled ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="called">
              <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: '#fff', letterSpacing: -1 }}>It&apos;s your turn!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1.6 }}>Your spot is ready. Please present this token at the counter immediately.</p>
            </motion.div>
          ) : isPending ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="pending">
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, letterSpacing: -1 }}>Awaiting confirmation</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1.6 }}>The merchant will accept your request before your token enters the live queue.</p>
            </motion.div>
          ) : isWaiting ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="waiting">
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, letterSpacing: -1 }}>Almost there!</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 32 }}>
                <div style={{ ...s.card, padding: '24px 16px', borderRadius: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#f5c418', marginBottom: 4 }}>{ahead}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Ahead Of You</div>
                </div>
                <div style={{ ...s.card, padding: '24px 16px', borderRadius: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#00cfff', marginBottom: 4 }}>~{ahead * 5}m</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Est. Wait</div>
                </div>
              </div>
            </motion.div>
          ) : isServed ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="served">
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>Served!</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Your request was processed successfully. Thank you for choosing us!</p>
            </motion.div>
          ) : isCancelled ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="cancelled">
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#ff4d6d', letterSpacing: -1 }}>Cancelled</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>You cancelled your reservation. You can rejoin the queue anytime.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="missed">
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#ff4d6d', letterSpacing: -1 }}>Turn Missed</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>You weren&apos;t available when called. Please rejoin the queue if needed.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(isWaiting || isPending) && (
          <motion.button 
            whileHover={{ y: -2, background: 'rgba(255,77,109,.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeave}
            style={{ width: '100%', padding: '18px', borderRadius: 20, background: 'rgba(255,77,109,.08)', border: '1px solid rgba(255,77,109,.2)', color: '#ff4d6d', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all .25s' }}
          >
            Cancel Token
          </motion.button>
        )}

        {(isServed || isTerminal || isCalled) && (
          <motion.button 
            whileHover={{ y: -2, boxShadow: '0 12px 30px rgba(245,196,24,.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/home')}
            style={{ width: '100%', padding: '18px', borderRadius: 20, background: THEME.gradients.consumer, color: '#000', fontWeight: 900, fontSize: 15, cursor: 'pointer', border: 'none', boxShadow: '0 8px 24px rgba(245,196,24,.2)' }}
          >
            Return Home
          </motion.button>
        )}
      </div>

    </motion.div>
  )
}
