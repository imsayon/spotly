"use client"

import React from "react"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"

// Extended styles for this page
const s = {
  ...THEME.styles,
  input: {
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    outline: 'none',
    transition: 'all .2s',
    width: '100%',
    fontSize: 14
  } as React.CSSProperties,
  btnM: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 12,
    background: THEME.gradients.merchant,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .22s'
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 18px',
    borderRadius: 11,
    background: 'rgba(255,255,255,.05)',
    color: 'rgba(255,255,255,.7)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid rgba(255,255,255,.12)',
    cursor: 'pointer',
    transition: 'all .2s'
  } as React.CSSProperties,
  gradM: { background: THEME.gradients.merchant } as React.CSSProperties,
  gradMText: THEME.gradients.merchantText,
  badge: THEME.badge,
};

export default function MerchantBusiness() {
  const { add: addToast } = useToasts()
  const { user, merchantProfile } = useAuthStore()
  const profile = merchantProfile

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px', maxWidth: 820 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Business Profile</h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>Manage your brand identity and legal credentials</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: 'rgba(31,217,124,.12)', border: '1px solid rgba(31,217,124,.2)', color: '#1fd97c', fontSize: 12, fontWeight: 800 }}>
          <Ic.Shield /> Verified Merchant
        </div>
      </div>

      {/* OVERVIEW CARD */}
      <div style={{ ...s.card, padding: '28px', marginBottom: 22, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,.02)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(31,217,124,.05)', filter: 'blur(32px)' }} />
        
        <div style={{ width: 84, height: 84, borderRadius: 20, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0, boxShadow: '0 12px 30px rgba(31,217,124,.25)' }}>☕</div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900 }}>{profile?.name || "The Coffee Lab"}</h2>
            <span style={{ ...s.badge('merchant'), fontSize: 10, background: 'rgba(31,217,124,.15)' } as React.CSSProperties}>✓ Active</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 14 }}>Premium specialty coffee & artisanal roastery · Est. 2019</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,.25)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Store />3 Outlets</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Star />4.8 Rating</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Users />1.2k Served</span>
          </div>
        </div>
        <button style={{ ...s.btnGhost, gap: 8, fontSize: 13, padding: '10px 18px', borderRadius: 12 }} onClick={() => addToast('Media upload coming soon', 'info')}>
          <Ic.Upload />Update Brand Assets
        </button>
      </div>

      {/* FORM SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="animate-in zoom-in-95 duration-300" style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Ic.Building />Business Details</h3>
          {[
            { l: 'Legal Entity Name', v: profile?.name || 'The Coffee Lab Pvt. Ltd.' },
            { l: 'GST Registration', v: '29AABCT1234A1Z5' },
            { l: 'Business Category', v: 'Food & Beverage' },
            { l: 'Founding Year', v: '2019' }
          ].map(f => (
            <div key={f.l} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>{f.l}</label>
              <input 
                style={s.input} 
                defaultValue={f.v} 
                onFocus={e => (e.target.style.borderColor = 'rgba(31,217,124,.4)', e.target.style.background = 'rgba(255,255,255,.05)')} 
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.12)', e.target.style.background = 'rgba(255,255,255,.03)')} 
              />
            </div>
          ))}
        </div>
        
        <div className="animate-in zoom-in-95 duration-300 delay-75" style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Ic.User />Contact Information</h3>
          {[
            { l: 'Primary Business Email', v: user?.email || 'hello@thecoffeelab.in' },
            { l: 'Support Phone', v: '+91 80 4567 8900' },
            { l: 'Business Website', v: 'www.thecoffeelab.in' },
            { l: 'Corporate HQ', v: 'Indiranagar, Bengaluru' }
          ].map(f => (
            <div key={f.l} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>{f.l}</label>
              <input 
                style={s.input} 
                defaultValue={f.v} 
                onFocus={e => (e.target.style.borderColor = 'rgba(31,217,124,.4)', e.target.style.background = 'rgba(255,255,255,.05)')} 
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.12)', e.target.style.background = 'rgba(255,255,255,.03)')} 
              />
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button 
          style={{ ...s.btnM, gap: 8, padding: '14px 32px', fontSize: 15 }} 
          onClick={() => addToast('Profile synchronization complete', 'success')}
        >
          <Ic.Check />Update Profile
        </button>
      </div>
    </div>
  )
}
