"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
  gradCText: { background: 'linear-gradient(135deg,#f5c418,#ff6316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
    ...(c === 'gray' && { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', border: '1px solid var(--bdr)' }),
  }),
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 13, background: 'rgba(255,77,109,.1)', color: '#ff4d6d', fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,77,109,.2)', cursor: 'pointer', transition: 'all .25s' },
  btnM: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 999, background: 'var(--gM)', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all .25s', boxShadow: '0 8px 20px rgba(31,217,124,.3)' },
}

const QUEUE_ENTRIES = [
  { id:'q1', token: 41, initials:'SB', status:'CALLED', wait:'-' },
  { id:'q2', token: 42, initials:'AJ', status:'WAITING', wait:'2m' },
  { id:'q3', token: 43, initials:'AS', status:'WAITING', wait:'6m' }, // You
  { id:'q4', token: 44, initials:'MR', status:'WAITING', wait:'8m' },
  { id:'q5', token: 45, initials:'VK', status:'WAITING', wait:'12m' },
]

export default function ConsumerQueue() {
  const router = useRouter()
  const { add: addToast } = useToasts()
  
  const [status, setStatus] = useState('WAITING')
  const [position, setPosition] = useState(2)
  const [currentToken, setCurrentToken] = useState(41)
  const [seconds, setSeconds] = useState(position * 240)
  const [queueEntries, setQueueEntries] = useState(QUEUE_ENTRIES)
  
  const entry = { outlet: 'Artisan Bakehouse, Indiranagar', token: 43 }

  useEffect(() => {
    const t = setInterval(() => {
      setPosition(p => {
        if (p <= 0) { 
          clearInterval(t); 
          setStatus('CALLED'); 
          addToast("It's your turn", 'success'); 
          return 0; 
        }
        setCurrentToken(ct => ct + 1)
        setSeconds(s => Math.max(0, s - 240))
        return p - 1
      })
    }, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'WAITING') return
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [status])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  const statusStyles: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; anim: string }> = {
    WAITING: { color: '#f5c418', bg: 'rgba(245,196,24,.07)', border: 'rgba(245,196,24,.25)', icon: <Ic.Clock size={12} />, anim: 'animate-pulse' },
    CALLED: { color: '#1fd97c', bg: 'rgba(31,217,124,.1)', border: 'rgba(31,217,124,.3)', icon: <Ic.Bell size={12} />, anim: 'animate-bounce' },
  }
  const statusStyle = statusStyles[status] ?? statusStyles['WAITING']

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 2 }}>Your Queue</h1>
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>{entry.outlet}</p>
        </div>
        <span style={{ ...s.badge(status === 'CALLED' ? 'green' : 'yellow') as React.CSSProperties }}>{status === 'CALLED' ? 'CALLED' : 'WAITING'}</span>
      </div>

      {/* TOKEN CIRCLE */}
      <div style={{ textAlign: 'center', marginBottom: 28, position: 'relative' }}>
        {status === 'CALLED' && [1, 2, 3].map(i => (
          <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200 + i * 40, height: 200 + i * 40, borderRadius: '50%', border: `2px solid rgba(31,217,124,${0.3 / i})`, animation: `ping ${1.8 + i * .4}s cubic-bezier(0, 0, 0.2, 1) infinite`, pointerEvents: 'none' }} />
        ))}
        <div className={statusStyle.anim} style={{ width: 200, height: 200, borderRadius: '50%', margin: '0 auto', background: statusStyle.bg, border: `2px solid ${statusStyle.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all .6s', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: statusStyle.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Token</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 800, color: statusStyle.color, lineHeight: 1 }}>{entry.token}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: statusStyle.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-flex' }}>{statusStyle.icon}</span>{status === 'CALLED' ? "YOUR TURN" : "Waiting"}</div>
        </div>
      </div>

      {status === 'CALLED' ? (
        <div className="animate-in zoom-in-95 duration-300" style={{ ...s.card, background: 'rgba(31,217,124,.08)', borderColor: 'rgba(31,217,124,.28)', marginBottom: 18, padding: '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#1fd97c' }}><Ic.Check size={28} /></div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 20, color: '#1fd97c', marginBottom: 4 }}>Proceed to the counter!</div>
          <p style={{ color: 'var(--t2)', fontSize: 14 }}>Don't keep them waiting</p>
          <button style={{ ...s.btnM, marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => { addToast('Served! Hope you had a great time.', 'success'); router.push('/home') }}>Mark as Served</button>
        </div>
      ) : (
        <>
          {/* COUNTDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            {[
              { label: 'People Ahead', val: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 800, ...(s.gradCText as any) }}>{position}</span> },
              { label: 'Est. Time', val: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: '#ff6316' }}>{mins}:{String(secs).padStart(2, '0')}</span> },
              { label: 'Now Serving', val: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 800, color: '#a78bfa' }}>#{currentToken}</span> },
            ].map(st => (
              <div key={st.label} style={{ ...s.card, padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 8 }}>{st.label}</div>
                {st.val}
              </div>
            ))}
          </div>

          {/* PROGRESS */}
          <div style={{ ...s.card, padding: '16px', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: 'var(--t3)' }}>Queue Progress</span>
              <span style={{ color: '#f5c418' }}>#{entry.token - position} / #{entry.token + 3}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(10, ((5 - position) / 5) * 100)}%`, background: 'linear-gradient(90deg,#1fd97c,#f5c418)', borderRadius: 3, transition: 'width 1s ease' }} />
            </div>
          </div>
        </>
      )}

      {/* LIVE QUEUE LIST */}
      <div style={{ ...s.card, padding: '16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Live Queue</span>
          <span style={{ ...s.badge('green') as React.CSSProperties, fontSize: 10 }}>● Real-time</span>
        </div>
        {queueEntries.map(q => (
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, marginBottom: 7, background: q.token === entry.token ? 'rgba(245,196,24,.08)' : 'rgba(255,255,255,.02)', border: q.token === entry.token ? '1px solid rgba(245,196,24,.28)' : '1px solid var(--bdr)', transition: 'all .3s' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: q.token === entry.token ? 'rgba(245,196,24,.2)' : q.status === 'CALLED' ? 'rgba(31,217,124,.15)' : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12, color: q.token === entry.token ? '#f5c418' : q.status === 'CALLED' ? '#1fd97c' : 'var(--t2)', flexShrink: 0 }}>
              #{q.token}
            </div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${q.token * 40 % 360},60%,55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {q.initials}
            </div>
            <span style={{ ...s.badge(q.status === 'CALLED' ? 'green' : q.status === 'WAITING' ? 'yellow' : 'gray') as React.CSSProperties, fontSize: 10 }}>{q.status}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}>{q.wait}</span>
            {q.token === entry.token && <span style={{ fontSize: 10, fontWeight: 800, color: '#f5c418' }}>You</span>}
          </div>
        ))}
      </div>

      <button onClick={() => { addToast('Left the queue', 'info'); router.push('/home') }} style={{ ...s.btnDanger, width: '100%', justifyContent: 'center', padding: '14px' }}>
        <Ic.LogOut /> Leave Queue
      </button>
    </div>
  )
}
