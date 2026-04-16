"use client"

import React from "react"
import { motion } from "framer-motion"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 24, position: 'relative' as const, overflow: 'hidden' as const },
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

export default function PayoutsPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 840 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Payment Methods</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Manage your bank accounts, cards, and daily payouts</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        {/* WALLET / EARNINGS */}
        <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(31,217,124,.12), rgba(31,217,124,0))', borderColor: 'rgba(31,217,124,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#1fd97c', textTransform: 'uppercase', letterSpacing: 1.5 }}>Available for Payout</div>
            <Ic.Activity color="#1fd97c" />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 44, fontWeight: 900, marginBottom: 6, letterSpacing: -1 }}>₹12,480.00</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginBottom: 20 }}>Last payout initiated on Oct 14, 2023</p>
          <button style={{ ...s.btnM, width: '100%', padding: '14px', background: '#1fd97c', color: '#000', fontSize: 14 }} onClick={() => addToast('Payout request sent to processing', 'success')}>
            Withdraw to Bank
          </button>
        </div>

        {/* SUBSCRIPTION SUMMARY */}
        <div style={{ ...s.card }}>
           <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c418', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Next Billing</div>
           <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Growth Plan</div>
           <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>₹4,999<span style={{ fontSize: 14, color: 'var(--t4)' }}>/mo</span></div>
           <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...s.btnGhost, flex: 1, fontSize: 13 }} onClick={() => router.push('/dashboard/settings/subscription')}>Manage Plan</button>
              <button style={{ ...s.btnGhost, width: 44, padding: 0 }}><Ic.Settings /></button>
           </div>
        </div>
      </div>

      {/* SAVED METHODS */}
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--t2)' }}>Saved Settlement Methods</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {[
          { l: 'HDFC Bank Settlement', v: '**** 8842', tag: 'PRIMARY', ic: '🏦' },
          { l: 'Business UPI ID', v: 'spotly.merchant@hdfcbank', tag: 'BACKUP', ic: '📱' },
        ].map(m => (
          <div key={m.l} style={{ ...s.card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.ic}</div>
             <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.l}</div>
                <div style={{ fontSize: 12, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>{m.v}</div>
             </div>
             <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: m.tag === 'PRIMARY' ? 'rgba(31,217,124,.1)' : 'rgba(255,255,255,.06)', color: m.tag === 'PRIMARY' ? '#1fd97c' : 'rgba(255,255,255,.4)', border: '1px solid transparent', borderColor: m.tag === 'PRIMARY' ? 'rgba(31,217,124,.2)' : 'transparent' }}>{m.tag}</span>
             <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.2)' }}><Ic.Settings size={18} /></button>
          </div>
        ))}
        <button style={{ ...s.btnGhost, borderStyle: 'dashed', padding: '16px', background: 'transparent' }}>
          <Ic.Plus /> Link New Settlement Method
        </button>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t2)' }}>Recent Transaction History</h3>
        <button style={{ background: 'none', border: 'none', color: '#1fd97c', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>View All</button>
      </div>

      <div style={{ ...s.card, padding: '0' }}>
         {[
           { l: 'Payout to HDFC Bank', date: 'Oct 14, 2:44 PM', amt: '-₹8,400', status: 'COMPLETED' },
           { l: 'Growth Plan Subscription', date: 'Oct 01, 10:00 AM', amt: '-₹4,999', status: 'SUCCESS' },
           { l: 'Order #992341 (Aggregated)', date: 'Sep 28, 9:20 PM', amt: '+₹1,240', status: 'SETTLED' },
         ].map((t, i) => (
           <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,.05)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.l}</div>
                <div style={{ fontSize: 11, color: 'var(--t4)' }}>{t.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: t.amt.startsWith('+') ? '#1fd97c' : '#fff', marginBottom: 2 }}>{t.amt}</div>
                <div style={{ fontSize: 10, fontWeight: 900, color: t.status === 'COMPLETED' || t.status === 'SUCCESS' ? '#1fd97c' : '#f5c418', opacity: 0.7 }}>{t.status}</div>
              </div>
           </div>
         ))}
      </div>
    </div>
  )
}
