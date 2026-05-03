"use client"

import React from "react"
import { motion } from "framer-motion"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 24, marginBottom: 16 },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 11,
    background: 'rgba(255,255,255,.05)',
    color: 'rgba(255,255,255,.7)',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(255,255,255,.12)',
    cursor: 'pointer',
    transition: 'all .2s'
  } as React.CSSProperties,
}

export default function SecurityPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 720 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Security & Login</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Protect your business account and manage active sessions</p>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Authentication</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
           <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Password</div>
              <div style={{ fontSize: 11, color: 'var(--t4)' }}>Last updated 3 months ago</div>
           </div>
           <button style={s.btnGhost} onClick={() => addToast('Verification email sent!', 'info')}>Update Password</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
           <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Two-Factor Authentication</div>
              <div style={{ fontSize: 11, color: 'var(--t4)' }}>Disabled · We recommend turning this on</div>
           </div>
           <button style={{ ...s.btnGhost, borderColor: '#1fd97c', color: '#1fd97c' }} onClick={() => addToast('Not available in beta', 'info')}>Setup 2FA</button>
        </div>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Device Sessions</h3>
        {[
          { icon: <Ic.Monitor />, dev: 'MacBook Pro · Chrome', loc: 'Bengaluru, India', current: true },
          { icon: <Ic.Smartphone />, dev: 'iPhone 14 Pro · Safari', loc: 'Bengaluru, India', current: false },
        ].map((session, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
             <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{session.icon}</div>
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{session.dev}</div>
                  {session.current && <span style={{ fontSize: 9, fontWeight: 900, color: '#1fd97c', padding: '2px 6px', background: 'rgba(31,217,124,.1)', borderRadius: 4 }}>CURRENT</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t4)' }}>{session.loc}</div>
             </div>
             {!session.current && <button style={{ background: 'none', border: 'none', color: '#ff4d6d', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Revoke Logout</button>}
          </div>
        ))}
      </div>

      <div style={{ ...s.card, borderColor: 'rgba(255,77,109,.2)' }}>
         <div style={{ fontWeight: 800, fontSize: 14, color: '#ff4d6d', marginBottom: 4 }}>Logout of all other sessions</div>
         <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 16 }}>This will force logout everywhere except this device. Use this if you notice suspicious activity.</p>
         <button style={{ ...s.btnGhost, padding: '10px 16px', fontSize: 12, borderColor: '#ff4d6d', color: '#ff4d6d' }} onClick={() => addToast('Logged out of all other sessions', 'success')}>Execute Remote Logout</button>
      </div>
    </div>
  )
}
