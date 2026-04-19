"use client"

import React, { useMemo, useState } from "react"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"
import { useLiveLocation } from "@/lib/useLiveLocation"
import { getMerchantIcon } from "@/lib/merchantIcon"

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
  const { location, label, loading, isDenied, requestLocation } = useLiveLocation()
  const [view, setView] = useState('map')
  const [selected, setSelected] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '3']))

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setFavorites(prev => {
      const n = new Set(prev)
      if (n.has(id)) {
        n.delete(id)
        addToast('Removed from favorites', 'info')
      } else {
        n.add(id)
        addToast('Added to favorites', 'success')
      }
      return n
    })
  }

  const merchants = MERCHANTS
  const latitude = location?.latitude ?? 12.9716
  const longitude = location?.longitude ?? 77.5946

  const mapSrc = useMemo(() => {
    const delta = 0.02
    const left = longitude - delta
    const right = longitude + delta
    const top = latitude + delta
    const bottom = latitude - delta
    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`
  }, [latitude, longitude])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
        Explore <span style={s.gradCText as React.CSSProperties}>Nearby</span>
      </h1>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>
        <Ic.MapPin /> {loading ? 'Detecting your location...' : label}
      </p>

      {isDenied && (
        <div style={{ ...s.card, padding: '12px 14px', marginBottom: 14, border: '1px solid rgba(245,196,24,.28)', background: 'rgba(245,196,24,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ color: '#f5c418', marginTop: 2 }}><Ic.MapPin /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>Location permission denied</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.4 }}>
                Open browser site settings for this app, allow location access, and retry.
              </div>
            </div>
            <button type="button" onClick={requestLocation} style={{ border: 'none', borderRadius: 9, padding: '6px 10px', background: '#f5c418', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.04)', padding: 3, borderRadius: 11, marginBottom: 18, border: '1px solid var(--bdr)' }}>
        {[
          { v: 'map', l: 'Map', icon: <Ic.Map /> },
          { v: 'list', l: 'List', icon: <Ic.Grid /> },
        ].map(({ v, l, icon }) => (
          <button key={v} onClick={() => setView(v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: view === v ? 'rgba(255,255,255,.1)' : 'transparent', color: view === v ? '#fff' : 'var(--t3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .2s' }}>
            {icon}{l}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ height: 400, borderRadius: 18, overflow: 'hidden', position: 'relative', border: '1px solid var(--bdr)', marginBottom: 14, background: '#0d1626' }}>
            <iframe
              title="Live map"
              src={mapSrc}
              style={{ border: 0, width: '100%', height: '100%' }}
              loading="lazy"
            />
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.72)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '7px 12px', fontSize: 11, color: 'rgba(255,255,255,.82)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Ic.MapPin /> {loading ? 'Detecting location...' : label}
            </div>
            <a
              href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`}
              target="_blank"
              rel="noreferrer"
              style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.72)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '7px 12px', fontSize: 11, color: '#f5c418', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Ic.Arrow /> Open full map
            </a>
          </div>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {merchants.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                style={{ minWidth: 220, ...s.card, padding: '12px 14px', textAlign: 'left', borderColor: selected?.id === m.id ? 'rgba(245,196,24,.35)' : 'var(--bdr)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}20`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getMerchantIcon(m.cat)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.waitStr} wait</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...s.glassStrong, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: 'slideUp .3s ease' }} onClick={() => addToast('Joining queue...', 'success')}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${selected.color}20`, color: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getMerchantIcon(selected.cat)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>{selected.queue} waiting - {selected.dist}</div>
                </div>
                <button style={{ ...s.btnC, padding: '8px 14px', fontSize: 12, gap: 5 }} onClick={e => { e.stopPropagation(); addToast('Joining queue...', 'success') }}>Join <Ic.Arrow /></button>
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
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>{getMerchantIcon(m.cat)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>{m.cat} - {m.area} - {m.dist}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10 }}><Ic.Clock /> {m.waitStr}</span>
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
