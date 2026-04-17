"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME, LiveBadge } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { QueueEntry, Outlet } from "@spotly/types"
import { io, Socket } from "socket.io-client"

const s = {
  ...THEME.styles,
  input: {
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    outline: 'none',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all .2s',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnM: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 12,
    background: THEME.gradients.merchant,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .22s'
  } as React.CSSProperties,
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: 11,
    background: 'rgba(255,77,109,.1)',
    color: '#ff4d6d',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(255,77,109,.2)',
    cursor: 'pointer',
    transition: 'all .2s'
  } as React.CSSProperties,
};

export default function MerchantQueue() {
  const { add: addToast } = useToasts()
  const { merchantProfile, loading: authLoading } = useAuthStore()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutlet, setSelectedOutlet] = useState('')
  const [entries, setEntries] = useState<QueueEntry[]>([])
  const [called, setCalled] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const fetchQueue = useCallback(async (outletId?: string) => {
    const id = outletId || selectedOutlet
    if (!id) return
    try {
      const res = await api.get(`/queue/${id}`)
      const data: QueueEntry[] = res.data.data || []
      setEntries(data)
      const active = data.find(e => e.status === 'CALLED')
      setCalled(active || null)
    } catch {
      // silently fail — WS will retry
    }
  }, [selectedOutlet])

  // Load outlets for this merchant
  useEffect(() => {
    const fetchOutlets = async () => {
      if (!merchantProfile?.id) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get(`/outlet/merchant/${merchantProfile.id}`)
        const data = res.data.data || []
        setOutlets(data)
        if (data.length > 0) {
          setSelectedOutlet(data[0].id)
        }
      } catch {
        addToast('Failed to load outlets', 'error')
      } finally {
        setLoading(false)
      }
    }
    if (!authLoading) {
      fetchOutlets()
    }
  }, [merchantProfile?.id, authLoading, addToast])

  // Fetch queue on outlet change
  useEffect(() => {
    if (selectedOutlet) fetchQueue(selectedOutlet)
  }, [selectedOutlet, fetchQueue])

  // WebSocket real-time updates
  useEffect(() => {
    if (!selectedOutlet) return

    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001',
      { transports: ['websocket'] }
    )
    socketRef.current = socket

    socket.on('connect', () => {
      setWsConnected(true)
      socket.emit('join_outlet', { outletId: selectedOutlet })
    })

    socket.on('disconnect', () => setWsConnected(false))

    socket.on('queue_update', (payload: any) => {
      const data: QueueEntry[] = payload.entries || []
      setEntries(data)
      setCalled(data.find(e => e.status === 'CALLED') || null)
    })

    return () => {
      socket.emit('leave_outlet', { outletId: selectedOutlet })
      socket.disconnect()
      socketRef.current = null
    }
  }, [selectedOutlet])

  // Fallback poll (5s) in case WS misses an update
  useEffect(() => {
    if (!selectedOutlet) return
    const interval = setInterval(() => fetchQueue(selectedOutlet), 8000)
    return () => clearInterval(interval)
  }, [selectedOutlet, fetchQueue])

  const waiting = entries.filter(e => e.status === 'WAITING')

  // POST /api/queue/next { outletId }
  const callNext = async () => {
    if (!waiting.length || calling) return
    setCalling(true)
    try {
      await api.post('/queue/next', { outletId: selectedOutlet })
      addToast(`Token #${waiting[0]?.tokenNumber} called!`, 'success')
      fetchQueue()
    } catch {
      addToast('Failed to call next', 'error')
    } finally {
      setCalling(false)
    }
  }

  // POST /api/queue/served/:entryId { outletId }
  const markServed = async () => {
    if (!called) return
    try {
      await api.post(`/queue/served/${called.id}`, { outletId: selectedOutlet })
      addToast(`Token #${called.tokenNumber} served ✓`, 'success')
      fetchQueue()
    } catch {
      addToast('Failed to mark served', 'error')
    }
  }

  // POST /api/queue/missed/:entryId { outletId }
  const markMissed = async (e: QueueEntry) => {
    try {
      await api.post(`/queue/missed/${e.id}`, { outletId: selectedOutlet })
      addToast(`Token #${e.tokenNumber} marked missed`, 'info')
      fetchQueue()
    } catch {
      addToast('Failed to update status', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.04)', borderTopColor: '#1fd97c', borderRadius: '50%' }}
        />
      </div>
    )
  }

  if (!merchantProfile) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Merchant Profile Required</h2>
        <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          You need to complete your business profile before you can manage queues.
        </p>
        <button 
          style={s.btnM}
          onClick={() => (window.location.href = '/dashboard/business')}
        >
          Setup Business Profile
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '36px 36px 48px' }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            Queue Operator
            <span style={{ padding: '4px 12px', borderRadius: 999, background: wsConnected ? 'rgba(31,217,124,.12)' : 'rgba(255,159,67,.12)', border: `1px solid ${wsConnected ? 'rgba(31,217,124,.25)' : 'rgba(255,159,67,.25)'}`, fontSize: 11, fontWeight: 800, letterSpacing: 1, color: wsConnected ? '#1fd97c' : '#ff9f43', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', boxShadow: '0 0 8px currentColor' }} />
              {wsConnected ? 'Live' : 'Polling'}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Manage customer flow in real-time</p>
        </div>

        {outlets.length > 0 && (
          <select
            style={s.input}
            value={selectedOutlet}
            onChange={e => setSelectedOutlet(e.target.value)}
          >
            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {outlets.length === 0 ? (
        <div style={{ ...s.card, padding: 60, textAlign: 'center', borderStyle: 'dashed', opacity: 0.6 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No outlets registered</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Add an outlet from Outlet Control to start managing queues.</p>
        </div>
      ) : (
        <>
          {/* TOP CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>

            {/* CURRENTLY SERVING */}
            <motion.div
              layout
              style={{
                ...s.card, padding: '32px', textAlign: 'center',
                background: called ? 'rgba(31,217,124,.06)' : 'rgba(255,255,255,.01)',
                borderColor: called ? 'rgba(31,217,124,.22)' : 'rgba(255,255,255,.06)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: called ? 'rgba(31,217,124,.12)' : 'rgba(255,255,255,.02)', filter: 'blur(28px)' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1fd97c', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Ic.Sparkle /> Now Serving
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={called?.tokenNumber ?? 'empty'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 88, fontWeight: 800, color: called ? '#fff' : 'rgba(255,255,255,.1)', lineHeight: 1, marginBottom: 20 }}
                >
                  {called ? `#${called.tokenNumber}` : '—'}
                </motion.div>
              </AnimatePresence>

              {called ? (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    style={s.btnM} onClick={markServed}
                  >
                    <Ic.Check /> Served
                  </motion.button>
                  <motion.button
                    whileHover={{ background: 'rgba(255,77,109,.2)' }}
                    style={s.btnDanger} onClick={() => markMissed(called)}
                  >
                    <Ic.X /> Miss
                  </motion.button>
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, fontWeight: 600 }}>Queue is idle</p>
              )}
            </motion.div>

            {/* CALL NEXT */}
            <div style={{ ...s.card, padding: '32px', textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={waiting.length}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 800, color: waiting.length > 0 ? '#f5c418' : 'rgba(255,255,255,.15)', lineHeight: 1, marginBottom: 4 }}
                >
                  {waiting.length}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 28, fontWeight: 600 }}>
                {waiting.length === 1 ? 'customer waiting' : 'customers waiting'}
              </div>
              <motion.button
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 12px 28px rgba(31,217,124,.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  ...s.btnM, justifyContent: 'center', width: '100%', padding: '17px',
                  fontSize: 15, borderRadius: 14, gap: 10,
                  opacity: waiting.length === 0 || calling ? 0.5 : 1,
                  cursor: waiting.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={callNext}
                disabled={waiting.length === 0 || calling}
              >
                {calling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                  />
                ) : <Ic.Bell />}
                {calling ? 'Calling...' : waiting.length > 0 ? `Call #${waiting[0].tokenNumber}` : 'Queue Empty'}
              </motion.button>
              {waiting.length > 0 && !calling && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                  Next: Token #{waiting[0]?.tokenNumber}
                </p>
              )}
            </div>
          </div>

          {/* LIVE BOARD */}
          <div style={{ ...s.card, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16 }}>Live Board</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(31,217,124,.12)', border: '1px solid rgba(31,217,124,.22)', fontSize: 11, fontWeight: 700, color: '#1fd97c' }}>
                  {entries.filter(e => e.status === 'CALLED').length} Called
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(245,196,24,.12)', border: '1px solid rgba(245,196,24,.22)', fontSize: 11, fontWeight: 700, color: '#f5c418' }}>
                  {waiting.length} Waiting
                </span>
              </div>
            </div>

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 20px', color: 'rgba(255,255,255,.15)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🍃</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>The queue is empty</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Customers who join will appear here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence>
                  {entries.map(q => (
                    <motion.div
                      key={q.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderRadius: 12,
                        background: q.status === 'CALLED' ? 'rgba(31,217,124,.08)' : 'rgba(255,255,255,.02)',
                        border: `1px solid ${q.status === 'CALLED' ? 'rgba(31,217,124,.2)' : 'rgba(255,255,255,.06)'}`,
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: q.status === 'CALLED' ? 'rgba(31,217,124,.15)' : 'rgba(255,255,255,.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14,
                        color: q.status === 'CALLED' ? '#1fd97c' : 'rgba(255,255,255,.5)'
                      }}>
                        #{q.tokenNumber}
                      </div>

                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${q.tokenNumber * 41 % 360},60%,52%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900, color: '#fff'
                      }}>
                        {q.userId?.slice(0, 2)?.toUpperCase()}
                      </div>

                      <LiveBadge count={0} label={q.status} className={q.status === 'CALLED' ? '' : 'opacity-60'} />


                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {new Date(q.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {q.status === 'WAITING' && (
                        <motion.button
                          whileHover={{ background: 'rgba(255,77,109,.2)' }}
                          style={{ ...s.btnDanger, padding: '5px 12px', fontSize: 11, borderRadius: 8 }}
                          onClick={() => markMissed(q)}
                        >
                          Miss
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
