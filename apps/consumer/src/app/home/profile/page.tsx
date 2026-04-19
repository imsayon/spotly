"use client"

import React from "react"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
  gradC: { background: 'linear-gradient(135deg,#f5c418,#ff6316)' },
  gradCText: { background: 'linear-gradient(135deg,#f5c418,#ff6316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
  })
}

export default function ConsumerProfile() {
  const { user, profile, signOut } = useAuthStore()
  const { add: addToast } = useToasts()
  
  const stats = [{ n: 23, l: 'Queues Joined' }, { n: '4.1h', l: 'Time Saved' }, { n: 18, l: 'Merchants' }]
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 14px', ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#000', boxShadow: '0 0 0 6px rgba(245,196,24,.15)' }}>
          {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 3 }}>
          {profile?.name || user?.email?.split('@')[0] || "Arjun Sharma"}
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>+91 98765 43210 · {profile?.location || "Indiranagar"}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={s.badge('yellow') as React.CSSProperties}>Consumer</span>
          <span style={s.badge('green') as React.CSSProperties}>✓ Verified</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {stats.map(st => (
          <div key={st.l} style={{ ...s.card, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, ...s.gradCText as React.CSSProperties, marginBottom: 4 }}>{st.n}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{st.l}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: 16, marginBottom: 12 }}>Recent History</h3>
      {MERCHANTS.slice(0, 4).map((m, i) => (
        <div key={m.id} style={{ ...s.card, padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>{m.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{['Yesterday 2:15PM', 'Last week', '3 days ago', 'This morning'][i]} · Token #{40 + i}</div>
          </div>
          <span style={s.badge('green') as React.CSSProperties}>Served</span>
        </div>
      ))}

      <div style={{ ...s.card, marginTop: 18, padding: '6px' }}>
        {[{ l: 'Notifications', ic: '🔔' }, { l: 'Privacy & Data', ic: '🔒' }, { l: 'Help & Support', ic: '❓' }, { l: 'Sign Out', ic: '🚪', d: true }].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderRadius: 11, cursor: 'pointer', color: item.d ? '#ff4d6d' : 'var(--t2)', transition: 'all .2s' }} 
            className="hover:bg-[#ffffff0a]"
            onClick={() => {
              if (item.l === 'Sign Out') {
                addToast('Signing out...', 'info')
                signOut()
              }
            }}>
            <span style={{ fontSize: 18 }}>{item.ic}</span>
            <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{item.l}</span>
            <Ic.ChevR />
          </div>
        ))}
      </div>
    </div>
  )
}
