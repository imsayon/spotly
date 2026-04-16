"use client"

import React, { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts, SkeletonCard } from "@spotly/ui"
import api from '@/lib/api'

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
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      api.get(`/queue/history/${user.uid}`)
        .then(res => setHistory(res.data.data))
        .catch(err => console.error('History fetch failed:', err))
        .finally(() => setLoading(false))
    }
  }, [user])
  
  const stats = [
    { n: history.length > 0 ? history.length : 0, l: 'Queues Joined' }, 
    { n: history.length > 0 ? `${(history.length * 0.2).toFixed(1)}h` : '0h', l: 'Time Saved' }, 
    { n: new Set(history.map(h => h.outlet?.merchant?.id)).size, l: 'Merchants' }
  ]
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 14px', ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#000', boxShadow: '0 0 0 6px rgba(245,196,24,.15)' }}>
          {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 3 }}>
          {profile?.name || user?.email?.split('@')[0] || "User"}
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>{profile?.phone || "No phone linked"} · {profile?.location || "No location"}</p>
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
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonCard height={60} />
          <SkeletonCard height={60} />
        </div>
      ) : history.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '30px', color: 'var(--t3)', fontSize: 13 }}>
          No history found yet.
        </div>
      ) : (
        history.map((h) => (
          <div key={h.id} style={{ ...s.card, padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {h.outlet?.merchant?.logoUrl ? <img src={h.outlet.merchant.logoUrl} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} alt="" /> : <Ic.Shop />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{h.outlet?.merchant?.name || 'Unknown Merchant'}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                {new Date(h.createdAt).toLocaleDateString()} · Token #{h.token}
              </div>
            </div>
            <span style={s.badge(h.status === 'SERVED' ? 'green' : 'yellow') as React.CSSProperties}>
              {h.status.charAt(0) + h.status.slice(1).toLowerCase()}
            </span>
          </div>
        ))
      )}

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
