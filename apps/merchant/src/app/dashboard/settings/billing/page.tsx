"use client"

import React from "react"
import { motion } from "framer-motion"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 0, overflow: 'hidden' as const },
  th: { padding: '16px 20px', fontSize: 10, fontWeight: 800, color: 'var(--t4)', textTransform: 'uppercase' as const, letterSpacing: 1.5, borderBottom: '1px solid var(--bdr)', textAlign: 'left' as const },
  td: { padding: '18px 20px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.03)' },
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

export default function BillingHistoryPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()

  const INVOICES = [
    { id: 'INV-2023-001', date: 'Oct 01, 2023', amt: '₹4,999.00', status: 'PAID', plan: 'Growth Plan' },
    { id: 'INV-2023-002', date: 'Sep 01, 2023', amt: '₹4,999.00', status: 'PAID', plan: 'Growth Plan' },
    { id: 'INV-2023-003', date: 'Aug 01, 2023', amt: '₹4,999.00', status: 'PAID', plan: 'Growth Plan' },
    { id: 'INV-2022-094', date: 'Jul 01, 2023', amt: '₹0.00', status: 'FREE', plan: 'Trial Period' },
  ]

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
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Billing History</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>View and download your past subscription invoices</p>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={s.th}>Invoice ID</th>
              <th style={s.th}>Date</th>
              <th style={s.th}>Plan</th>
              <th style={s.th}>Amount</th>
              <th style={s.th}>Status</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom: i === INVOICES.length - 1 ? 'none' : s.td.borderBottom }}>
                <td style={{ ...s.td, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inv.id}</td>
                <td style={{ ...s.td, color: 'var(--t3)' }}>{inv.date}</td>
                <td style={{ ...s.td }}>
                   <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(245,196,24,.05)', color: '#f5c418', fontSize: 11, fontWeight: 700 }}>{inv.plan}</span>
                </td>
                <td style={{ ...s.td, fontWeight: 800 }}>{inv.amt}</td>
                <td style={{ ...s.td }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: inv.status === 'PAID' ? '#1fd97c' : '#00cfff' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: inv.status === 'PAID' ? '#1fd97c' : '#00cfff' }}>{inv.status}</span>
                   </div>
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  <button 
                    onClick={() => addToast(`Downloading ${inv.id}...`, 'info')}
                    style={{ background: 'none', border: 'none', color: '#1fd97c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}
                  >
                    <Ic.Plus /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Need a custom receipt?</div>
            <p style={{ fontSize: 13, color: 'var(--t4)' }}>Contact our billing support for specialized tax or GST invoices.</p>
         </div>
         <button style={{ ...s.btnGhost, padding: '12px 24px' }} onClick={() => addToast('Support ticket opened', 'success')}>Contact Support</button>
      </div>
    </div>
  )
}
