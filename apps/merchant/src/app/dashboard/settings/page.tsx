"use client"

import React from "react"
import Link from "next/link"
import { Ic, useToasts } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
}

export default function MerchantSettings() {
  const { add: addToast } = useToasts()

  const SECTIONS = [
    { 
      title: 'Account & Security', 
      items: [
        { l: 'Login & Security', ic: '🔐', d: 'Password, 2FA and sessions', href: '/dashboard/settings/security' },
        { l: 'Business Profile', ic: '🏪', d: 'Basic info and categories', href: '/dashboard/business' },
      ] 
    },
    { 
      title: 'Experience', 
      items: [
        { l: 'Customer Reviews', ic: '⭐', d: 'Feedback and rating trends', href: '/dashboard/settings/reviews' },
        { l: 'Notifications', ic: '🔔', d: 'Queue and report alerts', href: '/dashboard/settings/notifications' },
      ] 
    },
    { 
      title: 'Billing & Payments', 
      items: [
        { l: 'Payment Methods', ic: '🏦', d: 'Payouts, Cards and UPI', href: '/dashboard/settings/payments' },
        { l: 'Subscription Plan', ic: '💳', d: 'Manage your Growth Plan', href: '/dashboard/settings/subscription' },
        { l: 'Billing History', ic: '📄', d: 'Invoices & tax receipts', href: '/dashboard/settings/billing' },
      ] 
    },
    { 
      title: 'Danger Zone', 
      items: [
        { l: 'Export All Data', ic: '⬇️', d: 'Download business JSON/CSV', danger: true },
        { l: 'Delete Account', ic: '🗑️', d: 'Permanently remove account', danger: true }
      ] 
    },
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 48px', maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: -0.5 }}>Platform Settings</h1>
        <p style={{ color: 'var(--t3)', fontSize: 15 }}>Configure your workspace and payout preferences</p>
      </div>
      
      {SECTIONS.map((section, idx) => (
        <div key={section.title} className={`animate-in slide-in-from-bottom-4 duration-500 delay-${idx * 100}`} style={{ ...s.card, padding: '8px', marginBottom: 16 }}>
          <div style={{ padding: '12px 14px 8px', fontSize: 10, fontWeight: 800, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{section.title}</div>
          {section.items.map((item: any) => {
            const Content = (
              <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all .25s', color: item.danger ? '#ff4d6d' : 'var(--t2)' }} 
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'} 
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'} 
                onClick={() => !item.href && addToast(`${item.l} action triggered`, 'info')}>
                <span style={{ fontSize: 20 }}>{item.ic}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 1 }}>{item.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--t4)', fontWeight: 500 }}>{item.d}</div>
                </div>
                <Ic.ChevronRight size={18} color="rgba(255,255,255,.2)" />
              </div>
            )
            return item.href ? <Link key={item.l} href={item.href} style={{ textDecoration: 'none' }}>{Content}</Link> : Content
          })}
        </div>
      ))}
    </div>
  )
}
