"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Ic, useToasts } from "@spotly/ui"
import dynamic from 'next/dynamic'
import api from "@/lib/api"
import { useLiveLocation } from "@/lib/useLiveLocation"

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
  const router = useRouter()
  const { add: addToast } = useToasts()
  const { location, label, loading: locLoading, isDenied, requestLocation } = useLiveLocation({ prompt: true })
  
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('map')
  const [selected, setSelected] = useState<any>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    return location ? [location.latitude, location.longitude] : undefined
  }, [location])

  const isConnectableMerchant = (merchant: any) => {
    return merchant?.id && !String(merchant.id).startsWith('demo-') && !String(merchant.id).startsWith('osm-')
  }

  const openMerchant = (merchant: any) => {
    if (isConnectableMerchant(merchant)) {
      router.push(`/merchant/${merchant.id}`)
      return
    }
    addToast('This nearby place is not yet managed on Spotly', 'info')
  }

  const toggleFav = async (merchant: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!isConnectableMerchant(merchant)) return;
    const outletId = merchant.outlets?.[0]?.id;
    if (!outletId) { addToast('No outlet available to favorite', 'info'); return; }

    const isFav = favorites.has(outletId);
    
    // Optimistic UI update
    setFavorites(prev => {
      const n = new Set(prev)
      if (isFav) n.delete(outletId)
      else n.add(outletId)
      return n
    })

    try {
      if (isFav) {
        await api.delete(`/favorite/${outletId}`);
        addToast('Removed from favorites', 'info');
      } else {
        await api.post('/favorite', { outletId });
        addToast('Added to favorites', 'success');
      }
    } catch (err) {
      // Revert on failure
      setFavorites(prev => {
        const n = new Set(prev)
        if (isFav) n.add(outletId)
        else n.delete(outletId)
        return n
      })
      addToast('Failed to update favorite', 'error');
    }
  }

  useEffect(() => {
    loadMerchants()
    loadFavorites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const loadFavorites = async () => {
    try {
      const res = await api.get('/favorite');
      if (res.data.success && res.data.data) {
        const favIds = res.data.data.map((f: any) => f.outletId || f.merchantId || f.id);
        setFavorites(new Set(favIds));
      }
    } catch (err) {
      console.warn('Failed to load favorites');
    }
  }

  const loadMerchants = async () => {
    try {
      setLoading(true)
      // Fetch with current location if available
      const params = location ? `?lat=${location.latitude}&lng=${location.longitude}` : ''
      const res = await api.get(`/merchant${params}`)
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
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
        Explore <span style={s.gradCText as React.CSSProperties}>Nearby</span>
      </h1>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>
        <Ic.MapPin /> {locLoading ? 'Detecting your location...' : label}
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
        <div style={{ position: 'relative' }}>
          <MapDiscovery 
            merchants={merchants} 
            center={mapCenter}
            userLocation={mapCenter}
            onSelect={(m) => setSelected(m)} 
          />
          {selected && (
            <div style={{ position: 'absolute', bottom: 20, left: 12, right: 12, zIndex: 1000 }}>
              <div style={{ ...s.glassStrong, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: 'slideUp .3s ease' }} onClick={() => openMerchant(selected)}>
                <div style={{ fontSize: 26, color: '#f5c418' }}><Ic.Store /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                    {isConnectableMerchant(selected) ? `${selected.outlets?.length || 0} branches` : 'Discovery result'} · {selected.category}
                  </div>
                </div>
                {isConnectableMerchant(selected) && (
                  <div onClick={(e) => toggleFav(selected, e)} style={{ padding: 4 }}>
                    <Ic.Heart fill={favorites.has(selected.outlets?.[0]?.id) ? '#ff4d6d' : 'none'} color={favorites.has(selected.outlets?.[0]?.id) ? '#ff4d6d' : 'currentColor'} />
                  </div>
                )}
                <button style={{ ...s.btnC, padding: '8px 14px', fontSize: 12, gap: 5 }} onClick={e => { e.stopPropagation(); openMerchant(selected) }}>
                  {isConnectableMerchant(selected) ? 'Open' : 'Info'} <Ic.Arrow />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {merchants.map(m => (
            <div key={m.id} style={{ ...s.card, padding: '14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f5c41840'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bdr)'}
              onClick={() => openMerchant(m)}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `rgba(245,196,24,.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, color: '#f5c418' }}><Ic.Store /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>{m.category} · {m.address || 'Nearby'}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Clock size={12} /> {m.estimatedWaitTime || (m.currentQueueDepth != null ? `${m.currentQueueDepth} in Q` : '—')}</span>
                  <span style={{ ...s.badge('gray') as React.CSSProperties, fontSize: 10 }}>
                    {isConnectableMerchant(m) ? `${m.outlets?.length || 0} branches` : 'discovery'}
                  </span>
                </div>
              </div>
              {isConnectableMerchant(m) && (
                <div onClick={(e) => toggleFav(m, e)} style={{ padding: 4, marginRight: 8 }}>
                  <Ic.Heart fill={favorites.has(m.outlets?.[0]?.id) ? '#ff4d6d' : 'none'} color={favorites.has(m.outlets?.[0]?.id) ? '#ff4d6d' : 'var(--t3)'} />
                </div>
              )}
              <Ic.ChevronRight />
            </div>
          ))}
          {merchants.length === 0 && (
            <div style={{ ...s.card, padding: 60, textAlign: 'center', background: 'rgba(255,255,255,.01)', borderStyle: 'dashed' }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'center' }}>
                <Ic.Map />
              </div>
              <p style={{ color: 'rgba(255,255,255,.6)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No places nearby</p>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 13 }}>We couldn't find any active Spotly merchants in this area.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
