"use client"

import React, { useState } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"
import { getMerchantIcon } from "@/lib/merchantIcon"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'gray' && { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', border: '1px solid var(--bdr)' }),
  })
}

export default function ConsumerFavorites() {
  const { add: addToast } = useToasts()
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '3']))

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setFavorites(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); addToast('Removed from favorites', 'info') }
      else { n.add(id); addToast('Added to favorites', 'success') }
      return n
    })
  }

  const favMerchants = MERCHANTS.filter(m => favorites.has(m.id))

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Saved Places</h1>
      <p style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>{favMerchants.length} saved merchants</p>
      
      {favMerchants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'rgba(255,255,255,.3)' }}><Ic.Heart /></div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No saved places yet</p>
          <p style={{ fontSize: 13 }}>Tap the heart on any merchant to save</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {favMerchants.map(m => (
            <div key={m.id} style={{ ...s.card, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              className="hover:border-[#ff4d6d40] active:scale-[0.98]">
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>{getMerchantIcon(m.cat || m.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 5 }}>{m.cat} · {m.area}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic.Clock size={11} /> {m.waitStr}</span>
                  <span style={{ ...s.badge('gray') as React.CSSProperties, fontSize: 10 }}>{m.queue} in queue</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div onClick={(e) => toggleFav(m.id, e)} className="hover:scale-110 active:scale-95 transition-transform">
                  <Ic.Heart />
                </div>
                <Ic.ChevR />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
