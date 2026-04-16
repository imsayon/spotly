"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts, SkeletonCard } from "@spotly/ui"
import api from '@/lib/api'
import { Merchant } from "@spotly/types"

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
  const [loading, setLoading] = useState(true)
  const [favMerchants, setFavMerchants] = useState<Merchant[]>([])

  useEffect(() => {
    fetchFavorites();
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/user/favorites');
      setFavMerchants(res.data.data);
    } catch (err) {
      console.error('Fetch favorites failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFav = async (merchantId: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    
    // Optimistic update
    setFavMerchants(prev => prev.filter(m => m.id !== merchantId));
    addToast('Removed from favorites', 'info');

    try {
      await api.delete(`/user/favorites/${merchantId}`);
    } catch (err) {
      addToast('Failed to remove favorite', 'error');
      fetchFavorites(); // Rollback
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Saved Places ❤️</h1>
      <p style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 20 }}>{favMerchants.length} saved merchants</p>
      
      {favMerchants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💔</div>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No saved places yet</p>
          <p style={{ fontSize: 13 }}>Tap the heart on any merchant to save</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {favMerchants.map(m => (
            <div key={m.id} style={{ ...s.card, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              className="hover:border-[#ff4d6d40] active:scale-[0.98]">
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {m.logoUrl ? <img src={m.logoUrl} style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} alt="" /> : <Ic.Shop />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 5 }}>{m.category} · {m.location || 'Nearby'}</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <span style={{ ...s.badge('yellow') as React.CSSProperties, fontSize: 10 }}>⏱ {m.estimatedWaitTime || '5 MIN'}</span>
                  <span style={{ ...s.badge('gray') as React.CSSProperties, fontSize: 10 }}>Open</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div onClick={(e) => toggleFav(m.id, e)} className="text-[#ff4d6d] hover:scale-110 active:scale-95 transition-transform">
                  <Ic.Heart f={true} />
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
