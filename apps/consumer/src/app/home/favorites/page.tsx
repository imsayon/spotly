"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Ic, useToasts } from "@spotly/ui"
import api from "@/lib/api"

interface FavoriteOutlet {
  id: string
  outletId: string
  outlet: {
    id: string
    name: string
    address: string
    isActive: boolean
    merchantId: string
    merchant: {
      id: string
      name: string
      category: string
      logoUrl?: string
    }
  }
}

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' } as React.CSSProperties,
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
    ...(c === 'gray' && { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', border: '1px solid var(--bdr)' }),
    ...(c === 'red' && { background: 'rgba(255,77,109,.1)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,.22)' }),
  })
}

export default function ConsumerFavorites() {
  const { add: addToast } = useToasts()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteOutlet[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await api.get('/favorite')
      setFavorites(res.data.data || [])
    } catch {
      addToast('Failed to load favorites', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const removeFav = async (outletId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await api.delete(`/favorite/${outletId}`)
      setFavorites(prev => prev.filter(f => f.outletId !== outletId))
      addToast('Removed from favorites', 'info')
    } catch {
      addToast('Failed to remove favorite', 'error')
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('coffee')) return <Ic.Clock />
    if (cat.includes('health') || cat.includes('pharm')) return <Ic.Activity />
    if (cat.includes('bakery') || cat.includes('food')) return <Ic.Store />
    return <Ic.Store />
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Ic.Heart fill="#ff4d6d" color="#ff4d6d" />Saved Places</h1>
      <p style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>{favorites.length} saved merchants</p>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...s.card, height: 80, opacity: 0.4, background: 'rgba(255,255,255,.02)', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12, color: 'rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.Heart fill="none" /></div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No saved places yet</p>
          <p style={{ fontSize: 13 }}>Tap the heart on any merchant to save</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {favorites.map(f => (
            <div key={f.id} style={{ ...s.card, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onClick={() => router.push(`/merchant/${f.outlet.merchant?.id ?? f.outlet.merchantId}`)}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,196,24,.08)', color: '#f5c418', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getCategoryIcon(f.outlet.merchant?.category)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{f.outlet.merchant?.name || f.outlet.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 5 }}>{f.outlet.merchant?.category} — {f.outlet.address}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge(f.outlet.isActive ? 'green' : 'red') as React.CSSProperties, fontSize: 10 }}>
                    {f.outlet.isActive ? '● Open' : '● Closed'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div onClick={(e) => removeFav(f.outletId, e)} className="hover:scale-110 active:scale-95 transition-transform">
                  <Ic.Heart fill="#ff4d6d" color="#ff4d6d" />
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
