"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import { useLiveLocation } from "@/lib/useLiveLocation"
import { getMerchantIcon } from "@/lib/merchantIcon"
import { s } from "./home.styles"

export default function ConsumerHome() {
  const { user, profile } = useAuthStore()
  const { add: addToast } = useToasts()
  const router = useRouter()
  const { locationText, isDenied, refresh } = useLiveLocation()

  const displayName = profile?.name || (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'Member'
  
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("all")
  const [searchFocus, setSearchFocus] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await api.get('/merchant');
        setMerchants(res.data.data);
      } catch (err) {
        addToast('Failed to connect to Spotly network', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchMerchants();
  }, [addToast]);

  const CATEGORIES = [
    { id: 'all', label: 'Discovery', icon: <Ic.Sparkle /> },
    { id: 'coffee', label: 'Coffee', icon: <Ic.Clock /> },
    { id: 'health', label: 'Health', icon: <Ic.Activity /> },
    { id: 'bakery', label: 'Bakery', icon: <Ic.Store /> },
    { id: 'dining', label: 'Dining', icon: <Ic.Grid /> },
  ];

  const OFFERS = [
    { id: 1, title: 'Spotly Gold', sub: 'Priority queueing at 12 partner cafés', emoji: 'Premium', bg: 'rgba(245,196,24,.07)', color: '#f5c418' },
    { id: 2, title: 'Free Wait', sub: 'Join any clinical queue for free today', emoji: 'Health', bg: 'rgba(31,217,124,.07)', color: '#1fd97c' },
  ];

  const filtered = (merchants || []).filter(m => {
    const matchCat = activeCat === 'all' || m.category?.toLowerCase()?.includes(activeCat.toLowerCase());
    const matchSearch = m.name?.toLowerCase()?.includes(search.toLowerCase()) || m.category?.toLowerCase()?.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '24px 20px 100px', maxWidth: 640, margin: '0 auto' }}
    >
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>
            Hey, {displayName.split(' ')[0]}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: 600 }}>
            <Ic.MapPin /><span>{locationText}</span>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1fd97c' }} />
          </div>
          {isDenied && (
            <button
              onClick={refresh}
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(245,196,24,.12)',
                border: '1px solid rgba(245,196,24,.25)',
                color: '#f5c418',
                borderRadius: 999,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Ic.MapPin size={12} /> Enable location
            </button>
          )}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
          {displayName[0].toUpperCase()}
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.2)', pointerEvents: 'none' }}>
          <Ic.Search />
        </div>
        <input 
          ref={searchRef} 
          style={{ ...s.input, paddingLeft: 48, paddingRight: 50, border: `1px solid ${searchFocus ? 'rgba(245,196,24,.3)' : 'rgba(255,255,255,.06)'}`, boxShadow: searchFocus ? '0 0 0 4px rgba(245,196,24,.05)' : 'none' }} 
          placeholder="Search cafés, clinics, and more..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          onFocus={() => setSearchFocus(true)} 
          onBlur={() => setTimeout(() => setSearchFocus(false), 200)} 
        />
        <AnimatePresence>
          {search && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.05)', border: 'none', borderRadius: 8, padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,.3)', display: 'flex' }} 
              onClick={() => setSearch('')}
            >
              <Ic.X />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* OFFERS */}
      {!search && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 32 }} className="no-scrollbar">
          {OFFERS.map(o => (
            <motion.div 
              whileHover={{ y: -2 }}
              key={o.id} 
              style={{ minWidth: 300, padding: '24px', borderRadius: 24, background: o.bg, border: `1px solid ${o.color}20`, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: o.color }}>
                {o.id === 1 ? <Ic.Sparkle /> : <Ic.Activity />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: o.color, marginBottom: 4 }}>{o.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>{o.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CATEGORIES */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 32 }} className="no-scrollbar">
        {CATEGORIES.map(c => (
          <button 
            key={c.id} 
            onClick={() => setActiveCat(c.id)} 
            style={{ 
              ...s.categoryBtn,
              background: activeCat === c.id ? THEME.gradients.consumer : 'rgba(255,255,255,.03)', 
              color: activeCat === c.id ? '#000' : 'rgba(255,255,255,.5)', 
              border: `1px solid ${activeCat === c.id ? 'transparent' : 'rgba(255,255,255,.06)'}`,
              boxShadow: activeCat === c.id ? '0 8px 24px rgba(245,196,24,.25)' : 'none'
            }}
          >
            {c.icon}{c.label}
          </button>
        ))}
      </div>

      {/* MERCHANT GRID */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 19 }}>Nearby Partners</h2>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', fontWeight: 700 }}>{filtered.length} AVAILABLE</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ ...s.card, height: 110, opacity: 0.5, background: 'rgba(255,255,255,.02)', animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...s.card, padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,.15)', marginBottom: 16 }}><Ic.Search /></div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>No matches found</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Try searching for a different area or shop</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((m, i) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.01, border: '1px solid rgba(255,255,255,.12)' }}
                whileTap={{ scale: 0.99 }}
                style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer' }}
                onClick={() => router.push(`/merchant/${m.id}`)}
              >
                <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c418', flexShrink: 0 }}>
                  {getMerchantIcon(m.category || m.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <span>{m.category}</span> · <span>{m.location || locationText.split(',')[0] || 'Nearby'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#f5c418', marginBottom: 4 }}>~15m</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...s.badge('consumer'), fontSize: 10, padding: '4px 10px', background: 'rgba(245,196,24,.1)' } as any}>
                    JOIN <Ic.ChevR />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
