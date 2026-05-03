"use client"

import React from "react"
import Link from "next/link"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { 
    background: 'var(--s1)', 
    border: '1px solid var(--bdr)', 
    borderRadius: 20, 
    padding: 24, 
    position: 'relative' as const 
  },
  btnM: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 24px',
    borderRadius: 12,
    background: '#1fd97c',
    color: '#000',
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

export default function SubscriptionPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()

  const PLANS = [
    { 
      name: 'Starter', 
      price: 'Free', 
      current: false, 
      color: '#94a3b8', 
      features: ['1 Outlet', '50 tokens/day', 'Basic Analytics', 'Web Booking'] 
    },
    { 
      name: 'Growth', 
      price: '₹4,999/mo', 
      current: true, 
      color: '#1fd97c', 
      features: ['Up to 5 Outlets', 'Infinite Tokens', 'Advanced Analytics', 'SMS Notifications', 'Priority Support'] 
    },
    { 
      name: 'Enterprise', 
      price: 'Custom', 
      current: false, 
      color: '#f5c418', 
      features: ['Infinite Outlets', 'Dedicated Manager', 'API Access', 'White-labeling', 'On-prem Deployment'] 
    },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 900 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <button 
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Subscription Plan</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Scale your business with advanced management tools</p>
        </div>
      </div>

      {/* CURRENT PLAN HIGHLIGHT */}
      <div style={{ ...s.card, background: 'rgba(31,217,124,.04)', borderColor: 'rgba(31,217,124,.2)', marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#1fd97c', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>CURRENT ACTIVE PLAN</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Growth Plan <span style={{ fontSize: 14, color: 'var(--t4)', fontWeight: 600 }}> (Monthly)</span></h2>
            <p style={{ color: 'var(--t3)', fontSize: 13 }}>Next billing date is November 1, 2023. You will be charged ₹4,999.</p>
         </div>
         <button style={{ ...s.btnGhost, borderColor: '#ff4d6d', color: '#ff4d6d' }} onClick={() => addToast('Cancellation portal is being maintained', 'info')}>Cancel Subscription</button>
      </div>

      {/* PLAN COMPARISON */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ ...s.card, display: 'flex', flexDirection: 'column', borderWidth: p.current ? 2 : 1, borderColor: p.current ? '#1fd97c' : 'rgba(255,255,255,.1)' }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 20, color: p.color }}>{p.price}</div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
               {p.features.map(f => (
                 <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t3)' }}>
                    <Ic.Activity size={14} color={p.color} />
                    {f}
                 </div>
               ))}
            </div>

            {p.current ? (
              <button style={{ ...s.btnM, width: '100%', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)', cursor: 'default' }}>Active Plan</button>
            ) : (
              <button style={{ ...s.btnM, width: '100%', background: p.color, color: '#000' }} onClick={() => addToast('Upgrade disabled in development', 'info')}>Select {p.name}</button>
            )}
          </div>
        ))}
      </div>

      {/* FEATURE COMPARISON */}
      <div style={{ marginTop: 60 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24, textAlign: 'center' }}>Detailed Feature Comparison</h3>
        <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: 11, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: 1 }}>Capability</th>
                <th style={{ padding: '20px', textAlign: 'center', fontSize: 11, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: 1 }}>Starter</th>
                <th style={{ padding: '20px', textAlign: 'center', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#1fd97c' }}>Growth</th>
                <th style={{ padding: '20px', textAlign: 'center', fontSize: 11, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: 1 }}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: 'Active Outlets', s: '1', g: 'Up to 5', e: 'Unlimited' },
                { f: 'Monthly Tokens', s: '1,500', g: 'Unlimited', e: 'Unlimited' },
                { f: 'SMS Notifications', s: <Ic.X size={16} color="#ff4d6d" />, g: <Ic.Check size={16} color="#1fd97c" />, e: <Ic.Check size={16} color="#1fd97c" /> },
                { f: 'Custom Branding', s: <Ic.X size={16} color="#ff4d6d" />, g: <Ic.X size={16} color="#ff4d6d" />, e: <Ic.Check size={16} color="#1fd97c" /> },
                { f: 'Advanced Analytics', s: 'Basic', g: 'Full Suite', e: 'Custom Reports' },
                { f: 'API Access', s: <Ic.X size={16} color="#ff4d6d" />, g: 'Read-only', e: 'Full Access' },
              ].map((row, i) => (
                <tr key={row.f} style={{ borderBottom: i === 5 ? 'none' : '1px solid rgba(255,255,255,.03)' }}>
                  <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700 }}>{row.f}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, color: 'var(--t4)' }}>{row.s}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, color: '#1fd97c', fontWeight: 800 }}>{row.g}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center', fontSize: 13, color: 'var(--t2)' }}>{row.e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', color: 'var(--t4)', fontSize: 13 }}>
        Prices are in INR and include all applicable taxes. 
        <Link href="/dashboard/settings/billing" style={{ color: '#1fd97c', marginLeft: 8, textDecoration: 'none', fontWeight: 700 }}>
          View Billing History
        </Link>
      </div>
    </div>
  )
}
