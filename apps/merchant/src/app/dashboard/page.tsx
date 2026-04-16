"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"

// Extended styles for this page
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
    transition: 'all .22s'
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
    transition: 'all .2s'
  } as React.CSSProperties,
  gradM: { background: THEME.gradients.merchant } as React.CSSProperties,
  gradMText: THEME.gradients.merchantText,
  badge: THEME.badge,
};

// Mock Data
const ACTIVITY_FEED = [
  { id: 1, token: 45, action: 'joined', outlet: 'Main Branch', time: '2m ago', color: '#1fd97c' },
  { id: 2, token: 44, action: 'served', outlet: 'Main Branch', time: '5m ago', color: '#00cfff' },
  { id: 3, token: 42, action: 'missed', outlet: 'Airport T2', time: '12m ago', color: '#ff4d6d' },
  { id: 4, token: 41, action: 'served', outlet: 'Main Branch', time: '18m ago', color: '#00cfff' },
];

const ANALYTICS = {
  daily: [
    { time: '9am', v: 12 }, { time: '10am', v: 28 }, { time: '11am', v: 45 },
    { time: '12pm', v: 82 }, { time: '1pm', v: 70 }, { time: '2pm', v: 64 },
    { time: '3pm', v: 38 }, { time: '4pm', v: 52 }, { time: '5pm', v: 92 },
    { time: '6pm', v: 104 }, { time: '7pm', v: 88 }, { time: '8pm', v: 42 },
  ].map(d => ({ ...d, v: typeof d.v === 'string' ? 70 : d.v }))
};

const OUTLETS = [
  { id: 'o1', name: 'Main Branch - Indiranagar', open: true, queue: 14, hours: '9am - 9pm' },
  { id: 'o2', name: 'Airport Terminal 2', open: true, queue: 8, hours: '24 Hours' },
];

export default function MerchantDashboard() {
  const router = useRouter()
  const { user, merchantProfile } = useAuthStore()
  const { add: addToast } = useToasts()
  const [activityFeed, setActivityFeed] = useState(ACTIVITY_FEED)

  // Simulate live activity
  useEffect(() => {
    const t = setInterval(() => {
      const actions = ['joined', 'served', 'joined', 'missed'];
      const tokens = [50, 51, 52, 53];
      const outlets = ['Main Branch', 'Airport Terminal 2'];
      const colors = ['#1fd97c', '#00cfff', '#1fd97c', '#ff4d6d'];
      
      const newIdx = Math.floor(Math.random() * actions.length);
      setActivityFeed(prev => [{
        id: Date.now(),
        token: tokens[newIdx],
        action: actions[newIdx],
        outlet: outlets[Math.floor(Math.random() * outlets.length)],
        time: 'just now',
        color: colors[newIdx],
      }, ...prev.slice(0, 7)]);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { n: 23, s: '', l: 'Waiting now', c: '#f5c418', ic: '⏳', sub: '+3 last hour', trend: true },
    { n: 148, s: '', l: 'Served today', c: '#1fd97c', ic: '✓', sub: '+12% vs yesterday', trend: true },
    { n: '4.2', s: 'm', l: 'Avg wait', c: '#a78bfa', ic: '⏱', sub: '↓ 0.8 min', trend: false },
    { n: '4.8', s: '★', l: 'Rating', c: '#fb923c', ic: '★', sub: '98 reviews', trend: true },
  ];

  const maxH = Math.max(...ANALYTICS.daily.map(d => d.v));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 900, marginBottom: 4 }}>
            Good morning, {merchantProfile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Merchant'} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>The Coffee Lab · {OUTLETS.length} outlets · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...s.btnGhost, gap: 6, fontSize: 13 }} onClick={() => router.push('/dashboard/outlets')}><Ic.Plus />New Outlet</button>
          <button style={{ ...s.btnM, gap: 6, fontSize: 13 }} onClick={() => { router.push('/dashboard/queue'); addToast('Queue operator opened', 'info') }}><Ic.Zap />Open Queue</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map((st, i) => (
          <div key={i} style={{ ...s.card, padding: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: st.c, opacity: .06, filter: 'blur(20px)' }} />
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${st.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>{st.ic}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: st.c, marginBottom: 4, letterSpacing: -1 }}>{st.n}{st.s}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>{st.l}</div>
            <div style={{ fontSize: 11, color: `${st.c}cc`, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>{st.trend && <Ic.TrendUp />}{st.sub}</div>
          </div>
        ))}
      </div>

      {/* TWO COL */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
        {/* TRAFFIC CHART */}
        <div style={{ ...s.card, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16 }}>Today's Traffic</h3>
            <span style={{ ...s.badge('merchant'), fontSize: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' } as React.CSSProperties}>Live · Updates every 15m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120, marginBottom: 12 }}>
            {ANALYTICS.daily.map((d: any, i: number) => {
              const pct = (d.v / maxH) * 100
              const isHigh = pct > 75
              return (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative', cursor: 'pointer' }} title={`${d.time}: ${d.v} tokens`}>
                  <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: isHigh ? 'linear-gradient(180deg,#f5c418,#ff6316)' : THEME.gradients.merchant, height: `${pct}%`, minHeight: 4, transition: 'height .8s ease-out', opacity: .8 }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,.25)', fontWeight: 600 }}>
            {ANALYTICS.daily.filter((_: any, i: number) => i % 3 === 0).map((d: any) => <span key={d.time}>{d.time}</span>)}
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div style={{ ...s.card, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16 }}>Live Activity</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#1fd97c', fontWeight: 800, letterSpacing: .5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1fd97c', animation: 'pulse 2s infinite' }} />
              REAL-TIME
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {activityFeed.map((a, i) => (
              <div key={a.id} className="animate-in slide-in-from-left-4 duration-300" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < activityFeed.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: a.color, flexShrink: 0 }}>#{a.token}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 600, textTransform: 'capitalize' }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.outlet}</div>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', flexShrink: 0, fontWeight: 600 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK STATUS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ ...s.card, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15 }}>Outlet Status</h3>
            <button style={{ ...s.btnGhost, padding: '5px 12px', fontSize: 11, borderRadius: 8 }} onClick={() => router.push('/dashboard/outlets')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {OUTLETS.map((o: any) => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.open ? '#1fd97c' : '#374151', flexShrink: 0, boxShadow: o.open ? '0 0 10px rgba(31,217,124,.4)' : 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>Today: {o.hours}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: o.open ? '#f5c418' : 'rgba(255,255,255,.15)', lineHeight: 1 }}>{o.queue}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', fontWeight: 700, marginTop: 4 }}>WAITING</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Terminal Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { l: 'Call Next', ic: <Ic.Bell />, c: '#1fd97c', a: () => router.push('/dashboard/queue') },
              { l: 'Add Outlet', ic: <Ic.Plus />, c: '#a78bfa', a: () => router.push('/dashboard/outlets') },
              { l: 'Analytics', ic: <Ic.Bar />, c: '#f5c418', a: () => router.push('/dashboard/analytics') },
              { l: 'Business', ic: <Ic.Building />, c: '#fb923c', a: () => router.push('/dashboard/business') },
            ].map(a => (
              <button 
                key={a.l} 
                onClick={a.a} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '18px 10px', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', color: a.c, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .2s' }} 
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${a.c}44` }} 
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.03)'; e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${a.c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.ic}</div>
                {a.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
