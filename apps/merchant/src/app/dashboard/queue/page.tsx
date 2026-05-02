"use client"

import React, { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore, ExtendedQueueEntry } from "@/store/queue.store"

const s = {
  ...THEME.styles,
  btnM: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '14px 26px', borderRadius: 12,
    background: THEME.gradients.merchant, color: '#fff',
    fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
    transition: 'all .22s', minHeight: 48,
  } as React.CSSProperties,
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 11,
    background: 'rgba(255,77,109,.1)', color: '#ff4d6d',
    fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,77,109,.2)',
    cursor: 'pointer', transition: 'all .2s', minHeight: 40,
  } as React.CSSProperties,
  btnAccept: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 11,
    background: 'rgba(31,217,124,.1)', color: '#1fd97c',
    fontWeight: 600, fontSize: 13, border: '1px solid rgba(31,217,124,.2)',
    cursor: 'pointer', transition: 'all .2s', minHeight: 40,
  } as React.CSSProperties,
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; label: string }> = {
    WAITING:            { color: '#f5c418', bg: 'rgba(245,196,24,.12)',  border: 'rgba(245,196,24,.25)',  label: 'Waiting' },
    CALLED:             { color: '#00cfff', bg: 'rgba(0,207,255,.12)',   border: 'rgba(0,207,255,.25)',   label: 'Called' },
    SERVED:             { color: '#1fd97c', bg: 'rgba(31,217,124,.12)',  border: 'rgba(31,217,124,.25)',  label: 'Served ✓' },
    MISSED:             { color: '#ff4d6d', bg: 'rgba(255,77,109,.12)',  border: 'rgba(255,77,109,.25)',  label: 'Missed' },
    PENDING_ACCEPTANCE: { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.25)', label: 'Awaiting Confirmation' },
  }
  const c = cfg[status] ?? cfg.WAITING
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  )
}

export default function MerchantQueuePage() {
  const { add: addToast } = useToasts()
  const { merchantProfile, loading: authLoading } = useAuthStore()
  const store = useQueueStore()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    store.setToastFn(addToast as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast])

  useEffect(() => {
    if (!merchantProfile?.id || authLoading) return
    store.fetchOutlets(merchantProfile.id)
    store.connectSocket()
    pollRef.current = setInterval(() => store.fetchQueue(), 8000)
    return () => {
      store.disconnectSocket()
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantProfile?.id, authLoading])

  const entries  = store.entries
  const waiting  = entries.filter(e => e.status === 'WAITING')
  const pending  = entries.filter(e => e.status === 'PENDING_ACCEPTANCE')
  const called   = entries.find(e => e.status === 'CALLED') ?? null

  if (store.loading || authLoading) {
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
        <button style={s.btnM} onClick={() => window.location.href = '/dashboard/business'}>
          Setup Business Profile
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '36px 36px 56px' }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            Queue Operator
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: store.wsConnected ? 'rgba(31,217,124,.12)' : 'rgba(255,255,255,.06)',
              border: `1px solid ${store.wsConnected ? 'rgba(31,217,124,.25)' : 'rgba(255,255,255,.1)'}`,
              fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const,
              color: store.wsConnected ? '#1fd97c' : 'rgba(255,255,255,.3)',
            }}>
              {store.wsConnected ? '● Live' : '○ Polling'}
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Manage customer flow in real-time</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {store.outlets.length > 0 && (
            <select
              style={{
                padding: '11px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
              }}
              value={store.selectedOutletId}
              onChange={e => store.setSelectedOutletId(e.target.value)}
            >
              {store.outlets.map(o => (
                <option key={o.id} value={o.id} style={{ background: '#0f0f14' }}>{o.name}</option>
              ))}
            </select>
          )}
          <button
            style={{
              padding: '10px 18px', borderRadius: 99,
              background: store.isOpen ? 'rgba(31,217,124,.1)' : 'rgba(255,77,109,.1)',
              border: `1px solid ${store.isOpen ? 'rgba(31,217,124,.3)' : 'rgba(255,77,109,.3)'}`,
              color: store.isOpen ? '#1fd97c' : '#ff4d6d',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .3s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onClick={store.toggleOpen}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: store.isOpen ? '#1fd97c' : '#ff4d6d',
              flexShrink: 0,
            }} />
            {store.isOpen ? 'OPEN' : 'CLOSED'}
          </button>
        </div>
      </div>

      {store.outlets.length === 0 ? (
        <div style={{ ...s.card, padding: 60, textAlign: 'center', borderStyle: 'dashed', opacity: 0.6 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No outlets registered</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Add an outlet from Outlet Control to start managing queues.</p>
        </div>
      ) : (
        <>
          {/* ═══ PENDING ACCEPTANCE SECTION ═══ */}
          {pending.length > 0 && (
            <div style={{ ...s.card, padding: '22px', marginBottom: 20, background: 'rgba(167,139,250,.04)', borderColor: 'rgba(167,139,250,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 999,
                  background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.3)',
                  fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' as const, color: '#a78bfa',
                }}>
                  {pending.length} Awaiting Confirmation
                </span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>
                  These customers are waiting for your approval
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(entry => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 20px', borderRadius: 14,
                      background: 'rgba(167,139,250,.06)',
                      border: '1px solid rgba(167,139,250,.18)',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'rgba(167,139,250,.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 16, color: '#a78bfa',
                    }}>
                      #{entry.tokenNumber}
                    </div>

                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${(entry.tokenNumber * 41) % 360},55%,45%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900, color: '#fff',
                    }}>
                      {entry.userId?.slice(0, 2)?.toUpperCase() ?? '?'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                        Customer {entry.userId?.slice(0, 8)}…
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
                        Joined {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ background: 'rgba(31,217,124,.2)' }}
                        style={s.btnAccept}
                        onClick={() => store.acceptEntry(entry.id)}
                      >
                        ✓ Accept
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ background: 'rgba(255,77,109,.2)' }}
                        style={s.btnDanger}
                        onClick={() => store.rejectEntry(entry.id)}
                      >
                        ✕ Reject
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ TOP CARDS: NOW SERVING + CALL NEXT ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>

            {/* Currently serving */}
            <motion.div layout style={{
              ...s.card, padding: '32px', textAlign: 'center',
              background: called ? 'rgba(31,217,124,.06)' : 'rgba(255,255,255,.01)',
              borderColor: called ? 'rgba(31,217,124,.22)' : 'rgba(255,255,255,.06)',
              position: 'relative', overflow: 'hidden',
            }}>
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
                  <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} style={s.btnM} onClick={() => store.markServed(called.id)}>
                    <Ic.Check /> Served
                  </motion.button>
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, fontWeight: 600 }}>Queue is idle</p>
              )}
            </motion.div>

            {/* Call Next card */}
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
                  ...s.btnM, justifyContent: 'center', width: '100%', padding: '18px',
                  fontSize: 15, borderRadius: 14, gap: 10,
                  opacity: waiting.length === 0 ? 0.5 : 1,
                  cursor: waiting.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onClick={store.callNext}
                disabled={waiting.length === 0}
              >
                <Ic.Bell />
                {waiting.length > 0 ? `Call #${waiting[0].tokenNumber}` : 'Queue Empty'}
              </motion.button>
              {waiting.length > 0 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                  Next: Token #{waiting[0]?.tokenNumber}
                </p>
              )}
            </div>
          </div>

          {/* ═══ LIVE BOARD ═══ */}
          <div style={{ ...s.card, padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16 }}>Live Board</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {pending.length > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.22)', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
                    {pending.length} Pending
                  </span>
                )}
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
                  {entries.map(entry => {
                    const isMissed = entry.status === 'MISSED'
                    const isCalled = entry.status === 'CALLED'
                    const isPending = entry.status === 'PENDING_ACCEPTANCE'
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isMissed ? 0.45 : 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                          borderRadius: 13,
                          background: isCalled ? 'rgba(31,217,124,.08)' : isPending ? 'rgba(167,139,250,.06)' : isMissed ? 'rgba(255,77,109,.04)' : 'rgba(255,255,255,.02)',
                          border: `1px solid ${isCalled ? 'rgba(31,217,124,.2)' : isPending ? 'rgba(167,139,250,.2)' : isMissed ? 'rgba(255,77,109,.15)' : 'rgba(255,255,255,.06)'}`,
                          textDecoration: isMissed ? 'line-through' : 'none',
                        }}
                      >
                        {/* Token */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: isCalled ? 'rgba(31,217,124,.15)' : isPending ? 'rgba(167,139,250,.15)' : 'rgba(255,255,255,.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14,
                          color: isCalled ? '#1fd97c' : isPending ? '#a78bfa' : 'rgba(255,255,255,.5)',
                        }}>
                          #{entry.tokenNumber}
                        </div>

                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${(entry.tokenNumber * 41) % 360},60%,52%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 900, color: '#fff',
                        }}>
                          {entry.userId?.slice(0, 2)?.toUpperCase()}
                        </div>

                        <StatusBadge status={entry.status} />

                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Actions */}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          {isPending && (
                            <>
                              <motion.button whileHover={{ background: 'rgba(31,217,124,.2)' }} style={{ ...s.btnAccept, padding: '5px 12px', fontSize: 11, borderRadius: 8, minHeight: 30 }} onClick={() => store.acceptEntry(entry.id)}>
                                ✓ Accept
                              </motion.button>
                              <motion.button whileHover={{ background: 'rgba(255,77,109,.2)' }} style={{ ...s.btnDanger, padding: '5px 12px', fontSize: 11, borderRadius: 8, minHeight: 30 }} onClick={() => store.rejectEntry(entry.id)}>
                                ✕ Reject
                              </motion.button>
                            </>
                          )}
                          {entry.status === 'WAITING' && (
                            <motion.button whileHover={{ background: 'rgba(255,77,109,.2)' }} style={{ ...s.btnDanger, padding: '5px 12px', fontSize: 11, borderRadius: 8, minHeight: 30 }} onClick={() => store.rejectEntry(entry.id)}>
                              Remove
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
