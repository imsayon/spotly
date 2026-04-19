"use client"

import React, { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts, ToastContainer } from "@spotly/ui"
import Link from "next/link"

const s = {
  glass: { background: 'rgba(255,255,255,.035)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--bdr)' },
  glassStrong: { background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid var(--bdr2)' },
  gradC: { background: 'linear-gradient(135deg,#f5c418,#ff6316)' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
  })
}

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const { toasts, add: addToast } = useToasts()
  
  const [showNotif, setShowNotif] = useState(false)
  const notifCount = 3

  const navItems = [
    { id: '/home', icon: <Ic.Home />, label: 'Home' },
    { id: '/home/explore', icon: <Ic.Map />, label: 'Explore' },
    { id: '/home/queue', icon: <Ic.Clock />, label: 'Queue' },
    { id: '/home/favorites', icon: <Ic.Heart f={false} />, label: 'Saved' },
    { id: '/home/profile', icon: <Ic.User />, label: 'Profile' },
  ]

  const inQueue = false // Mocked for now

  return (
    <div className="consumer-shell min-h-screen text-white bg-[var(--bg)] font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="consumer-sidebar hidden md:flex flex-col border-r border-[#ffffff10] w-[240px] bg-[#0c0c12] p-5 h-screen fixed left-0 top-0">
        <div className="consumer-brand flex items-center gap-3 mb-10">
          <div style={{ width: 34, height: 34, borderRadius: 10, ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⏱</div>
          <div>
            <h2 className="text-xl font-black font-syne uppercase tracking-tight m-0 leading-none">spotly</h2>
            <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 700, letterSpacing: .5 }}>CONSUMER DASHBOARD</div>
          </div>
        </div>

        <nav className="consumer-nav flex flex-col gap-2 flex-1">
          {navItems.map(n => (
            <Link
              key={n.id}
              href={n.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-bold text-sm ${pathname === n.id ? 'bg-[#f5c4181a] text-[#f5c418]' : 'text-[#ffffffb3] hover:bg-[#ffffff0a] hover:text-white'}`}
            >
              <span className="flex items-center justify-center w-6">{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.id === '/home/queue' && inQueue && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1fd97c', boxShadow: '0 0 0 4px rgba(31,217,124,.12)' }} />}
            </Link>
          ))}
        </nav>

        <div className="consumer-sidebar-card bg-[#ffffff05] border border-[#ffffff10] rounded-[18px] p-[18px] mt-auto relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f5c4180a] to-[#ff63160a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#000' }}>
              {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "C"}
            </div>
            <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }} className="truncate">{profile?.name || user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }} className="truncate">{profile?.location || "Bengaluru, IN"}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <span style={s.badge('green') as React.CSSProperties}>Verified</span>
            <span style={s.badge('yellow') as React.CSSProperties}>Live alerts</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="consumer-main md:ml-[240px] flex flex-col min-h-screen relative pb-[80px] md:pb-0">
        
        {/* TOPBAR */}
        <div className="consumer-topbar h-[70px] border-b border-[#ffffff10] bg-[#0c0c12e6] backdrop-blur-[24px] sticky top-0 z-40 flex items-center justify-between px-5 md:px-8">
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontWeight: 600 }} className="hover:text-white transition-colors">
            <Ic.ChevL /> Home
          </button>

          <div className="brand md:hidden flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⏱</div>
            <span className="font-black tracking-tight font-syne text-[17px]">spotly</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotif(!showNotif)}>
              <div className="w-10 h-10 rounded-xl bg-[#ffffff0a] border border-[#ffffff1a] flex items-center justify-center text-[#ffffffb3] hover:bg-[#ffffff1a] hover:text-white transition-all">
                <Ic.Bell />
              </div>
              {notifCount > 0 && <div style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: '50%', background: '#ff4d6d', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>{notifCount}</div>}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5c418] to-[#ff6316] flex items-center justify-center cursor-pointer text-black font-black text-sm hover:scale-105 transition-transform md:hidden">
              {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "C"}
            </div>
          </div>
        </div>

        {/* NOTIFICATION DROPDOWN */}
        {showNotif && (
          <div style={{ position: 'absolute', top: 80, right: 20, width: 320, zIndex: 200, animation: 'slideDown .25s ease' }}>
            <div style={{ ...s.glassStrong, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--bdr)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Notifications</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }} onClick={() => setShowNotif(false)} className="hover:text-white transition-colors">Clear all</button>
              </div>
              {[
                { icon: '🔔', text: 'Your token #43 is coming up soon!', time: '2m ago', c: 'yellow' },
                { icon: '✅', text: 'Artisan Bakehouse confirmed your spot', time: '8m ago', c: 'green' },
                { icon: '⚡', text: 'Coffee Lab has 0 queue — join now!', time: '15m ago', c: 'yellow' },
              ].map((n, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--bdr)', display: 'flex', gap: 12, cursor: 'pointer', transition: 'all .2s' }} className="hover:bg-[#ffffff0a] active:bg-[#ffffff10]">
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 4, fontWeight: 500, color: '#e5e7eb' }}>{n.text}</p>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div className="consumer-content flex-1 p-5 md:p-8" onClick={() => showNotif && setShowNotif(false)}>
          {children}
        </div>

        {/* MOBILE NAV */}
        <div className="consumer-mobile-nav md:hidden flex items-center justify-around fixed bottom-0 left-0 right-0 h-[72px] bg-[#0c0c12f2] backdrop-blur-[24px] border-t border-[#ffffff10] z-50 px-2 pb-safe">
          {navItems.map(n => (
            <Link key={n.id} href={n.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${pathname === n.id ? 'text-[#f5c418]' : 'text-[#ffffff50]'}`}>
              <div style={{ position: 'relative' }}>
                <div style={{ transition: 'transform .2s', transform: pathname === n.id ? 'scale(1.2)' : 'scale(1)' }}>{n.icon}</div>
                {n.id === '/home/queue' && inQueue && <div style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#1fd97c', animation: 'pulse 2s infinite' }} />}
              </div>
              <span className="font-sans text-[9px] font-bold uppercase tracking-wider mt-1">{n.label}</span>
            </Link>
          ))}
        </div>

      </div>
      
      <ToastContainer toasts={toasts} />
    </div>
  )
}
