"use client"

import React, { useState } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"

const s = {
  glassStrong: { background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid var(--bdr2)' },
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
  gradCText: { background: 'linear-gradient(135deg,#f5c418,#ff6316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  btnC: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 999, background: 'var(--gC)', color: '#000', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all .25s', boxShadow: '0 8px 20px rgba(245,196,24,.3)' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'gray' && { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', border: '1px solid var(--bdr)' }),
    ...(c === 'cyan' && { background: 'rgba(0,207,255,.1)', color: '#00cfff', border: '1px solid rgba(0,207,255,.2)' }),
  })
}

export default function ConsumerExplore() {
  const { add: addToast } = useToasts()
  const [view, setView] = useState('map')
  const [selected, setSelected] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '3']))

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setFavorites(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); addToast('Removed from favorites', 'info') }
      else { n.add(id); addToast('Added to favorites ❤️', 'success') }
      return n
    })
  }

  const merchants = MERCHANTS

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Explore <span style={s.gradCText as React.CSSProperties}>Nearby</span></h1>

      <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.04)', padding: 3, borderRadius: 11, marginBottom: 18, border: '1px solid var(--bdr)' }}>
        {[{ v: 'map', l: '🗺 Map' }, { v: 'list', l: '📋 List' }].map(({ v, l }) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: view === v ? 'rgba(255,255,255,.1)' : 'transparent', color: view === v ? '#fff' : 'var(--t3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .2s' }}>
            {l}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <div style={{ height: 400, background: 'linear-gradient(150deg,#070b14,#0d1626,#131e30)', borderRadius: 18, overflow: 'hidden', position: 'relative', border: '1px solid var(--bdr)', marginBottom: 16 }}>
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
          {/* Roads */}
          {[[0, 55, 100, 55], [50, 0, 50, 100], [0, 30, 100, 30], [70, 0, 70, 100]].map((r, i) => (
            <div key={i} style={{ position: 'absolute', left: `${r[0]}%`, top: `${r[1]}%`, width: r[2] === 100 ? '100%' : '2px', height: r[3] === 100 ? '100%' : '2px', background: 'rgba(255,255,255,.04)', borderRadius: 1 }} />
          ))}
          {/* Pins */}
          {merchants.map((m, i) => {
            const positions = [[22, 28], [48, 52], [18, 60], [62, 25], [30, 72], [68, 48], [80, 32], [40, 18], [55, 72], [75, 60]]
            const [lx, ly] = positions[i] || [50, 50]
            return (
              <div key={m.id} style={{ position: 'absolute', left: `${lx}%`, top: `${ly}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', zIndex: selected?.id === m.id ? 10 : 2, transition: 'all .2s' }} onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 0 0 ${selected?.id === m.id ? 10 : 4}px ${m.color}${selected?.id === m.id ? '44' : '22'}`, transition: 'all .25s', animation: m.offerTag === 'Flash' ? 'pulse 2.5s infinite' : 'none' }}>
                  {m.emoji}
                </div>
                {selected?.id === m.id && (
                  <div style={{ position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.88)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 12px', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(8px)', zIndex: 20 }}>
                    <div>{m.name}</div>
                    <div style={{ color: '#f5c418', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 2 }}>⏱ {m.waitStr}</div>
                  </div>
                )}
              </div>
            )
          })}
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 14px', fontSize: 11, color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap' }}>
            📍 Indiranagar, Bengaluru
          </div>
          {selected && (
            <div style={{ position: 'absolute', bottom: 50, left: 12, right: 12 }}>
              <div style={{ ...s.glassStrong, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: 'slideUp .3s ease' }} onClick={() => addToast("Joining queue...", "success")}>
                <div style={{ fontSize: 26 }}>{selected.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>{selected.queue} waiting · {selected.dist}</div>
                </div>
                <button style={{ ...s.btnC, padding: '8px 14px', fontSize: 12, gap: 5 }} onClick={e => { e.stopPropagation(); addToast("Joining queue...", "success") }}>Join <Ic.Arrow /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {merchants.map(m => (
            <div key={m.id} style={{ ...s.card, padding: '14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              className="hover:border-[#f5c41840] hover:translate-x-1"
              onClick={() => {}}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{m.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>{m.cat} · {m.area} · {m.dist}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10 }}>⏱ {m.waitStr}</span>
                  <span style={{ ...s.badge('gray') as React.CSSProperties, fontSize: 10 }}>{m.queue} in queue</span>
                  {m.offerTag && <span style={{ ...s.badge('cyan') as React.CSSProperties, fontSize: 10 }}><Ic.Zap />{m.offerTag}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div onClick={e => toggleFav(m.id, e)} className="hover:scale-110 active:scale-95 transition-transform">
                  <Ic.Heart f={favorites.has(m.id)} />
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
