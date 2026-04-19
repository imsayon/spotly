"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts } from "@spotly/ui"
import dynamic from 'next/dynamic'
import api from "@/lib/api"
import { useLiveLocation } from "@/lib/useLiveLocation"
import { getMerchantIcon } from "@/lib/merchantIcon"

const MapDiscovery = dynamic(() => import('@/components/MapDiscovery'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', background: 'rgba(255,255,255,.05)', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
})

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
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('map')
  const [selected, setSelected] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const { locationText, coordinates, isDenied, refresh } = useLiveLocation()

  const toggleFav = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setFavorites(prev => {
      const n = new Set(prev)
      if (n.has(id)) { n.delete(id); addToast('Removed from favorites', 'info') }
      else { n.add(id); addToast('Added to favorites', 'success') }
      return n
    })
  }

  useEffect(() => {
    loadMerchants()
  }, [])

  const loadMerchants = async () => {
    try {
      setLoading(true)
      const res = await api.get('/merchant')
      if (res.data.success) {
        setMerchants(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load merchants:', err)
      addToast('Failed to sync nearby places', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Explore <span style={s.gradCText as React.CSSProperties}>Nearby</span></h1>

      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--t2)', fontSize: 13, fontWeight: 600 }}>
          <Ic.MapPin />
          <span>{locationText}</span>
        </div>
        {isDenied && (
          <button
            onClick={refresh}
            style={{
              background: 'rgba(245,196,24,.12)',
              color: '#f5c418',
              border: '1px solid rgba(245,196,24,.24)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enable location
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,.04)', padding: 3, borderRadius: 11, marginBottom: 18, border: '1px solid var(--bdr)' }}>
        {[
          { v: 'map', l: 'Map', icon: <Ic.Map size={14} /> },
          { v: 'list', l: 'List', icon: <Ic.List size={14} /> },
        ].map(({ v, l, icon }) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: view === v ? 'rgba(255,255,255,.1)' : 'transparent', color: view === v ? '#fff' : 'var(--t3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all .2s' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{icon}{l}</span>
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <div style={{ position: 'relative' }}>
          <MapDiscovery 
            merchants={merchants} 
            center={coordinates ? [coordinates.latitude, coordinates.longitude] : undefined}
            userLocation={coordinates ? [coordinates.latitude, coordinates.longitude] : undefined}
            onSelect={(m) => setSelected(m)} 
          />
          {selected && (
            <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12, zIndex: 1000 }}>
              <div style={{ ...s.glassStrong, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: 'slideUp .3s ease' }} onClick={() => addToast("Joining queue...", "success")}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245,196,24,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c418' }}>
                  {getMerchantIcon(selected.category || selected.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>{selected.outlets?.length || 0} branches · {selected.category}</div>
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
              onClick={() => setSelected(m)}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `rgba(245,196,24,.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c418', flexShrink: 0 }}>{getMerchantIcon(m.category || m.name)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>{m.category} · {m.address || 'Nearby'}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic.Clock size={11} /> {m.estimatedWaitTime || '15 MIN'}</span>
                  <span style={{ ...s.badge('gray') as React.CSSProperties, fontSize: 10 }}>{m.outlets?.length || 0} branches</span>
                </div>
              </div>
              <Ic.ChevR />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
