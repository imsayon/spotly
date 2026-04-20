"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore } from "@/store/queue.store"
import { Ic, useToasts, ToastContainer, THEME } from "@spotly/ui"
import Link from "next/link"

const s = {
  ...THEME.styles,
  gradM: { background: THEME.gradients.merchant },
  gradMText: { background: THEME.gradients.merchant, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { merchantProfile, signOut } = useAuthStore()
  const { toasts, add: addToast } = useToasts()
  const store = useQueueStore()

  // Wire toast into queue store so it can display messages
  useEffect(() => {
    store.setToastFn(addToast as any)
  }, [addToast])

  const nav = [
    { id: '/dashboard',           ic: <Ic.Grid />,     l: 'Dashboard' },
    { id: '/dashboard/queue',     ic: <Ic.Users />,    l: 'Queue Operator' },
    { id: '/dashboard/business',  ic: <Ic.Building />, l: 'Business Profile' },
    { id: '/dashboard/inventory', ic: <Ic.Tag />,      l: 'Inventory' },
    { id: '/dashboard/outlets',   ic: <Ic.Store />,    l: 'Outlet Control' },
    { id: '/dashboard/settings',  ic: <Ic.Settings />, l: 'Settings' },
  ]

  const handleSignOut = () => {
    addToast('Signing out…', 'info')
    signOut()
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#050509', overflow: 'hidden' }}>

      {/* ─── SIDEBAR ─── */}
      <div
        style={{
          width: 256,
          height: '100vh',
          borderRight: '1px solid rgba(255,255,255,.05)',
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,.01)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          flexShrink: 0,
        }}
        className="hidden md:flex"
      >
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 28px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: -1 }}>spotly.</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Merchant</div>
          </div>
        </div>

        {/* NAV */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {nav.map(n => {
            const isActive = pathname === n.id || (n.id !== '/dashboard' && pathname.startsWith(n.id))
            return (
              <Link
                key={n.id}
                href={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 14px',
                  borderRadius: 14,
                  background: isActive ? 'rgba(31,217,124,.08)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,.4)',
                  fontWeight: 700,
                  fontSize: 14,
                  transition: 'all .25s',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0,
                    width: 3, height: '60%',
                    borderRadius: '0 4px 4px 0',
                    background: '#1fd97c',
                    boxShadow: '0 0 8px rgba(31,217,124,.5)',
                  }} />
                )}
                <span style={{ color: isActive ? '#1fd97c' : 'inherit' }}>{n.ic}</span>
                {n.l}
              </Link>
            )
          })}
        </nav>

        {/* OPEN/CLOSED TOGGLE IN SIDEBAR */}
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={store.toggleOpen}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 14,
              background: store.isOpen ? 'rgba(31,217,124,.08)' : 'rgba(255,77,109,.08)',
              border: `1px solid ${store.isOpen ? 'rgba(31,217,124,.2)' : 'rgba(255,77,109,.2)'}`,
              color: store.isOpen ? '#1fd97c' : '#ff4d6d',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all .3s',
              letterSpacing: 0.3,
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: store.isOpen ? '#1fd97c' : '#ff4d6d',
              boxShadow: store.isOpen ? '0 0 8px rgba(31,217,124,.5)' : '0 0 8px rgba(255,77,109,.5)',
              flexShrink: 0,
              animation: store.isOpen ? 'pulse 2s infinite' : 'none',
            }} />
            Store: {store.isOpen ? 'Open' : 'Closed'}
          </button>
        </div>

        {/* BOTTOM PROFILE */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {merchantProfile?.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {merchantProfile?.name || 'Merchant'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1fd97c', fontSize: 10, fontWeight: 800 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1fd97c' }} /> Verified
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ y: -1, background: 'rgba(255,77,109,.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, border: 'none', background: 'rgba(255,77,109,.08)', color: '#ff4d6d', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}
          >
            <Ic.LogOut /> Logout
          </motion.button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#050509', position: 'relative' }}>
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#ffffff08]">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.Zap /></div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>spotly.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile open/closed toggle */}
            <button
              onClick={store.toggleOpen}
              style={{
                padding: '6px 14px', borderRadius: 99,
                background: store.isOpen ? 'rgba(31,217,124,.1)' : 'rgba(255,77,109,.1)',
                border: `1px solid ${store.isOpen ? 'rgba(31,217,124,.25)' : 'rgba(255,77,109,.25)'}`,
                color: store.isOpen ? '#1fd97c' : '#ff4d6d',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {store.isOpen ? 'OPEN' : 'CLOSED'}
            </button>
            <button style={{ color: 'rgba(255,255,255,.5)', background: 'none', border: 'none' }}>
              <Ic.Menu />
            </button>
          </div>
        </div>

        {children}
      </main>

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
