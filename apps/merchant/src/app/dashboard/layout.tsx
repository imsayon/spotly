"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts, ToastContainer, THEME } from "@spotly/ui"
import Link from "next/link"

const s = {
  ...THEME.styles,
  gradM: { background: THEME.gradients.merchant },
  gradMText: { background: THEME.gradients.merchant, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
}

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, merchantProfile, signOut } = useAuthStore()
  const { toasts, add: addToast } = useToasts()

  const nav = [
    { id: '/dashboard', ic: <Ic.Grid />, l: 'Analytics Overview' },
    { id: '/dashboard/queue', ic: <Ic.Users />, l: 'Queue Operator' },
    { id: '/dashboard/outlets', ic: <Ic.Store />, l: 'Outlet Control' },
    { id: '/dashboard/business', ic: <Ic.Building />, l: 'Business Profile' },
    { id: '/dashboard/settings', ic: <Ic.Settings />, l: 'Platform Settings' },
  ]

  const handleSignOut = () => {
    addToast('Securing your session...', 'info')
    signOut()
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#050509', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: 256, 
        height: '100vh', 
        borderRight: '1px solid rgba(255,255,255,.05)', 
        padding: '24px 12px', 
        display: 'flex', 
        flexDirection: 'column', 
        background: 'rgba(255,255,255,.01)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }} className="hidden md:flex">
        
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 32px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Zap />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 18, color: '#fff', letterSpacing: -1 }}>spotly.</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Merchant</div>
          </div>
        </div>
        
        {/* NAV */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(n => {
            const isActive = pathname === n.id || (n.id !== '/dashboard' && pathname.startsWith(n.id))
            return (
              <Link key={n.id} href={n.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: '12px 14px', 
                borderRadius: 14, 
                background: isActive ? 'rgba(31,217,124,.08)' : 'transparent', 
                color: isActive ? '#fff' : 'rgba(255,255,255,.4)', 
                fontWeight: 700, 
                fontSize: 14, 
                transition: 'all .25s',
                textDecoration: 'none'
              }} className="group">
                <span style={{ color: isActive ? '#1fd97c' : 'inherit' }}>{n.ic}</span>
                {n.l}
              </Link>
            )
          })}
        </nav>

        {/* BOTTOM PROFILE */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>
              {merchantProfile?.name?.[0]?.toUpperCase() || "M"}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {merchantProfile?.name || "Premium Partner"}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1fd97c', fontSize: 10, fontWeight: 800 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1fd97c' }} /> Verified
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ y: -1, background: 'rgba(255,77,109,.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut} 
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, border: 'none', background: 'rgba(255,77,109,.08)', color: '#ff4d6d', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}
          >
            <Ic.LogOut /> Logout
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#050509', position: 'relative' }}>
        {/* Mobile Header Placeholder */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#ffffff08]">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.Zap /></div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>spotly.</span>
          </div>
          <button style={{ color: 'rgba(255,255,255,.5)', background: 'none', border: 'none' }} onClick={() => addToast('Mobile accessibility is a future update', 'info')}>
            <Ic.Menu />
          </button>
        </div>

        {children}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
