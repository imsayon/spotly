"use client"

import React, { useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore, ExtendedQueueEntry } from "@/store/queue.store"

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  ...THEME.styles,
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
    transition: 'all .22s',
    minHeight: 48,
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 18px',
    borderRadius: 11,
    background: 'rgba(255,255,255,.05)',
    color: 'rgba(255,255,255,.7)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid rgba(255,255,255,.12)',
    cursor: 'pointer',
    transition: 'all .2s',
    minHeight: 44,
  } as React.CSSProperties,
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 16px',
    borderRadius: 10,
    background: 'rgba(255,77,109,.1)',
    color: '#ff4d6d',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(255,77,109,.2)',
    cursor: 'pointer',
    transition: 'all .2s',
    minHeight: 40,
  } as React.CSSProperties,
  btnAccept: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 16px',
    borderRadius: 10,
    background: 'rgba(31,217,124,.1)',
    color: '#1fd97c',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(31,217,124,.2)',
    cursor: 'pointer',
    transition: 'all .2s',
    minHeight: 40,
  } as React.CSSProperties,
}

// ─── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; label: string }> = {
    WAITING:            { color: '#f5c418', bg: 'rgba(245,196,24,.12)',  border: 'rgba(245,196,24,.25)',  label: 'Waiting' },
    CALLED:             { color: '#00cfff', bg: 'rgba(0,207,255,.12)',   border: 'rgba(0,207,255,.25)',   label: 'Called' },
    SERVED:             { color: '#1fd97c', bg: 'rgba(31,217,124,.12)',  border: 'rgba(31,217,124,.25)',  label: 'Served' },
    MISSED:             { color: '#ff4d6d', bg: 'rgba(255,77,109,.12)',  border: 'rgba(255,77,109,.25)',  label: 'Missed' },
    PENDING_ACCEPTANCE: { color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.25)', label: 'Pending' },
  }
  const c = cfg[status] ?? cfg.WAITING
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

// ─── Open/Closed Toggle ────────────────────────────────────────────────────────

function OpenClosedToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        borderRadius: 99,
        background: isOpen ? 'rgba(31,217,124,.1)' : 'rgba(255,77,109,.1)',
        border: `1px solid ${isOpen ? 'rgba(31,217,124,.3)' : 'rgba(255,77,109,.3)'}`,
        color: isOpen ? '#1fd97c' : '#ff4d6d',
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all .3s',
        letterSpacing: 0.5,
      }}
    >
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: isOpen ? '#1fd97c' : '#ff4d6d',
        boxShadow: isOpen ? '0 0 8px rgba(31,217,124,.6)' : '0 0 8px rgba(255,77,109,.6)',
        animation: isOpen ? 'pulse 2s infinite' : 'none',
        flexShrink: 0,
      }} />
      {isOpen ? 'OPEN' : 'CLOSED'}
    </button>
  )
}

// ─── Queue Entry Row ───────────────────────────────────────────────────────────

function QueueRow({ entry, onCallNext, onServed, onAccept, onReject }: {
  entry: ExtendedQueueEntry
  onCallNext?: () => void
  onServed: () => void
  onAccept: () => void
  onReject: () => void
}) {
  const isPending = entry.status === 'PENDING_ACCEPTANCE'
  const isMissed  = entry.status === 'MISSED'
  const isCalled  = entry.status === 'CALLED'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isMissed ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 14,
        background: isPending
          ? 'rgba(167,139,250,.06)'
          : isCalled
          ? 'rgba(0,207,255,.05)'
          : isMissed
          ? 'rgba(255,77,109,.04)'
          : 'rgba(255,255,255,.02)',
        border: `1px solid ${
          isPending
            ? 'rgba(167,139,250,.2)'
            : isCalled
            ? 'rgba(0,207,255,.15)'
            : isMissed
            ? 'rgba(255,77,109,.15)'
            : 'rgba(255,255,255,.06)'
        }`,
        textDecoration: isMissed ? 'line-through' : 'none',
      }}
    >
      {/* Token */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: isPending ? 'rgba(167,139,250,.15)' : isCalled ? 'rgba(0,207,255,.12)' : 'rgba(255,255,255,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 15,
        color: isPending ? '#a78bfa' : isCalled ? '#00cfff' : 'rgba(255,255,255,.5)',
      }}>
        #{entry.tokenNumber}
      </div>

      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: `hsl(${(entry.tokenNumber * 41) % 360},55%,45%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: '#fff',
      }}>
        {entry.userId?.slice(0, 2)?.toUpperCase() ?? '?'}
      </div>

      {/* Status */}
      <StatusBadge status={entry.status} />

      {/* Time */}
      <span style={{
        fontSize: 11, color: 'rgba(255,255,255,.2)',
        fontFamily: 'var(--font-mono)', fontWeight: 600, marginLeft: 4,
      }}>
        {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>

      {/* Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {isPending && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={s.btnAccept}
              onClick={onAccept}
            >
              ✓ Accept
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={s.btnDanger}
              onClick={onReject}
            >
              ✕ Reject
            </motion.button>
          </>
        )}
        {entry.status === 'WAITING' && (
          <motion.button
            whileHover={{ background: 'rgba(255,77,109,.2)' }}
            style={{ ...s.btnDanger, padding: '5px 12px', fontSize: 11, borderRadius: 8, minHeight: 32 }}
            onClick={onReject}
          >
            Remove
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function MerchantDashboard() {
  const { user, merchantProfile } = useAuthStore()
  const { add: addToast } = useToasts()
  const store = useQueueStore()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Inject toast function into store
  useEffect(() => {
    store.setToastFn(addToast as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast])

  // Bootstrap: fetch outlets + connect WebSocket
  useEffect(() => {
    if (!merchantProfile?.id) return

    store.fetchOutlets(merchantProfile.id)
    store.connectSocket()

    // Fallback poll every 8s
    pollRef.current = setInterval(() => store.fetchQueue(), 8000)

    return () => {
      store.disconnectSocket()
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantProfile?.id])

  // Re-join socket room when outlet changes
  useEffect(() => {
    // fetchQueue is called inside setSelectedOutletId / fetchOutlets
  }, [store.selectedOutletId])

  // ── Derived state ───────────────────────────────────────────────────────────
  const entries       = store.entries
  const waiting       = entries.filter(e => e.status === 'WAITING')
  const pending       = entries.filter(e => e.status === 'PENDING_ACCEPTANCE')
  const called        = entries.find(e => e.status === 'CALLED') ?? null
  const servedToday   = entries.filter(e => e.status === 'SERVED').length
  const missedToday   = entries.filter(e => e.status === 'MISSED').length

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (store.loading) {
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

  // ── No profile ──────────────────────────────────────────────────────────────
  if (!merchantProfile) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
          Complete Onboarding First
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Set up your merchant profile to start managing queues.
        </p>
        <a href="/onboarding" style={{ ...s.btnM, textDecoration: 'none', display: 'inline-flex' }}>
          Start Onboarding
        </a>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '32px 36px 56px' }}
    >
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
              {merchantProfile.name}
            </h1>
            <span style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'rgba(31,217,124,.1)', border: '1px solid rgba(31,217,124,.2)',
              color: '#1fd97c', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {merchantProfile.category}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* WS status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: store.wsConnected ? '#1fd97c' : 'rgba(255,255,255,.3)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: store.wsConnected ? '#1fd97c' : 'rgba(255,255,255,.3)', boxShadow: store.wsConnected ? '0 0 6px rgba(31,217,124,.5)' : 'none' }} />
            {store.wsConnected ? 'Live' : 'Polling'}
          </div>

          {/* Outlet selector */}
          {store.outlets.length > 1 && (
            <select
              value={store.selectedOutletId}
              onChange={e => store.setSelectedOutletId(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none',
              }}
            >
              {store.outlets.map(o => <option key={o.id} value={o.id} style={{ background: '#0f0f14' }}>{o.name}</option>)}
            </select>
          )}

          {/* Open/Closed toggle — ALWAYS VISIBLE */}
          <OpenClosedToggle isOpen={store.isOpen} onToggle={store.toggleOpen} />
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Waiting',     value: waiting.length,    color: '#f5c418', icon: '⏳', sub: `${pending.length} pending` },
          { label: 'Active Session',  value: called ? `#${called.tokenNumber}` : '—', color: '#00cfff', icon: '🔔', sub: called ? 'Token called' : 'Queue idle' },
          { label: 'Completed',     value: servedToday,       color: '#1fd97c', icon: '✓',  sub: 'Served today' },
          { label: 'Bounce Rate',       value: entries.length ? `${Math.round((missedToday / entries.length) * 100)}%` : '0%', color: '#ff4d6d', icon: '📈', sub: `${missedToday} missed` },
        ].map((st) => (
          <div key={st.label} style={{ ...s.card, padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: st.color, opacity: .06, filter: 'blur(20px)' }} />
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${st.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{st.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: st.color, marginBottom: 2, letterSpacing: -1, lineHeight: 1 }}>{st.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{st.label}</div>
            <div style={{ fontSize: 11, color: `${st.color}99`, fontWeight: 700 }}>{st.sub}</div>
          </div>
        ))}

        {/* ── Spot Identity / QR Quick Access ── */}
        <div style={{ ...s.card, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18, gridColumn: 'span 2', minWidth: 400, background: 'rgba(31,217,124,.03)', borderColor: 'rgba(31,217,124,.15)' }}>
          <div style={{ padding: 8, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,.1)', flexShrink: 0 }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin.replace(':3002', ':3000') : 'http://localhost:3000'}?outlet=${store.selectedOutletId}`)}&size=80x80&bgcolor=000&color=1fd97c&qzone=1`}
              alt="QR" 
              width={80} 
              height={80} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Storefront QR</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', lineHeight: 1.4, marginBottom: 10 }}>Customers scan this to join your live queue. {merchantProfile.spotId && <span style={{ color: '#1fd97c' }}>ID: {merchantProfile.spotId}</span>}</p>
            <button 
              onClick={() => {
                const url = `${typeof window !== 'undefined' ? window.location.origin.replace(':3002', ':3000') : 'http://localhost:3000'}?outlet=${store.selectedOutletId}`
                navigator.clipboard.writeText(url)
                addToast('Share link copied!', 'success')
              }}
              style={{ ...s.btnGhost, padding: '6px 12px', fontSize: 11, minHeight: 30, borderRadius: 8 }}
            >
              <Ic.Copy /> Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* ═══ LIVE ACTIVITY ═══ */}
      {(() => {
        // Compute hourly distribution from real entries
        const hourlyMap = new Array(24).fill(0);
        entries.forEach(e => {
          if (e.joinedAt) {
            const hour = new Date(e.joinedAt).getHours();
            hourlyMap[hour]++;
          }
        });
        const maxH = Math.max(...hourlyMap, 1);
        return (
          <div style={{ ...s.card, padding: 24, marginBottom: 24, background: 'rgba(255,255,255,.01)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic.Activity /> Queue Intensity
              </h3>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>Today&apos;s Activity</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              {hourlyMap.map((v, i) => {
                const pct = maxH > 0 ? (v / maxH) * 100 : 0;
                const isPeak = pct > 75;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, v > 0 ? 4 : 0)}%` }}
                    transition={{ delay: i * 0.02, duration: 0.5 }}
                    style={{
                      flex: 1,
                      background: isPeak ? 'var(--gM)' : 'rgba(255,255,255,.08)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: v > 0 ? 4 : 0,
                      opacity: v > 0 ? 1 : 0.25,
                    }}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,.2)', fontWeight: 700 }}>
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        );
      })()}


      {store.outlets.length === 0 ? (
        <div style={{ ...s.card, padding: 60, textAlign: 'center', borderStyle: 'dashed', opacity: 0.6 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No outlets yet</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Complete onboarding to create your first outlet.</p>
        </div>
      ) : (
        <>
          {/* ═══ NOW SERVING + CALL NEXT ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>

            {/* Now Serving card */}
            <motion.div layout style={{
              ...s.card, padding: '32px', textAlign: 'center',
              background: called ? 'rgba(0,207,255,.05)' : 'rgba(255,255,255,.01)',
              borderColor: called ? 'rgba(0,207,255,.2)' : 'rgba(255,255,255,.06)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: called ? 'rgba(0,207,255,.1)' : 'rgba(255,255,255,.02)', filter: 'blur(30px)' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00cfff', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                🔔 Now Serving
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={called?.tokenNumber ?? 'empty'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 800, color: called ? '#fff' : 'rgba(255,255,255,.08)', lineHeight: 1, marginBottom: 8 }}
                >
                  {called ? `#${called.tokenNumber}` : '—'}
                </motion.div>
              </AnimatePresence>
              {called && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>
                  User: {called.userId?.slice(0, 8)}…
                </div>
              )}
              {called ? (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} style={s.btnM} onClick={() => store.markServed(called.id)}>
                    ✓ Mark Served
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
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 800, color: waiting.length > 0 ? '#f5c418' : 'rgba(255,255,255,.1)', lineHeight: 1, marginBottom: 4 }}
                >
                  {waiting.length}
                </motion.div>
              </AnimatePresence>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', marginBottom: 24, fontWeight: 600 }}>
                {waiting.length === 1 ? 'customer waiting' : 'customers waiting'}
              </div>
              <motion.button
                whileHover={{ scale: 1.02, y: -2, boxShadow: '0 12px 28px rgba(31,217,124,.3)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  ...s.btnM, width: '100%', padding: '18px',
                  fontSize: 15, borderRadius: 14, gap: 10,
                  opacity: waiting.length === 0 ? 0.45 : 1,
                  cursor: waiting.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onClick={store.callNext}
                disabled={waiting.length === 0}
              >
                <Ic.Bell />
                {waiting.length > 0 ? `Call #${waiting[0].tokenNumber}` : 'Queue Empty'}
              </motion.button>
              {waiting.length > 0 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
                  Next: Token #{waiting[0]?.tokenNumber}
                </p>
              )}
            </div>
          </div>

          {/* ═══ LIVE QUEUE BOARD ═══ */}
          <div style={{ ...s.card, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 17 }}>Live Queue</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pending.length > 0 && (
                  <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.25)', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
                    {pending.length} Pending
                  </span>
                )}
                <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(245,196,24,.12)', border: '1px solid rgba(245,196,24,.22)', fontSize: 11, fontWeight: 700, color: '#f5c418' }}>
                  {waiting.length} Waiting
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(31,217,124,.12)', border: '1px solid rgba(31,217,124,.22)', fontSize: 11, fontWeight: 700, color: '#1fd97c' }}>
                  {entries.filter(e => e.status === 'CALLED').length} Called
                </span>
              </div>
            </div>

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 20px', color: 'rgba(255,255,255,.15)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🍃</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>The queue is empty</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Customers who join will appear here in real-time</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
                <AnimatePresence>
                  {/* PENDING first */}
                  {[...pending, ...entries.filter(e => e.status !== 'PENDING_ACCEPTANCE')].map(entry => (
                    <QueueRow
                      key={entry.id}
                      entry={entry}
                      onServed={() => store.markServed(entry.id)}
                      onAccept={() => store.acceptEntry(entry.id)}
                      onReject={() => store.rejectEntry(entry.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </motion.div>
  )
}
