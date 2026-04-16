"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 24, marginBottom: 16 },
  toggle: { position: 'relative' as const, width: 44, height: 22, cursor: 'pointer' as const },
  toggleBg: (active: boolean) => ({ width: '100%', height: '100%', borderRadius: 11, background: active ? 'rgba(31,217,124,.15)' : 'rgba(255,255,255,.05)', border: active ? '1px solid rgba(31,217,124,.3)' : '1px solid rgba(255,255,255,.1)', transition: 'all .3s' }),
  toggleKnob: (active: boolean) => ({ position: 'absolute' as const, top: 2, left: active ? 24 : 2, width: 18, height: 18, borderRadius: '50%', background: active ? '#1fd97c' : 'rgba(255,255,255,.3)', transition: 'all .3s' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()
  const [prefs, setPrefs] = useState({
    sms_queue: true,
    email_daily: false,
    push_called: true,
    push_missed: true,
    email_marketing: false
  })

  const toggle = (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    addToast('Preferences updated', 'success')
  }

  const SECTIONS = [
    {
      title: 'Queue Activity',
      items: [
        { id: 'push_called', l: 'Token Called Alert', d: 'Notify immediately when you call the next customer', type: 'push' },
        { id: 'push_missed', l: 'Customer Missed Alert', d: 'Notify if a customer cancels their spot', type: 'push' },
        { id: 'sms_queue', l: 'SMS Over-limit Alert', d: 'Alert when queue length exceeds 20 people', type: 'sms' },
      ]
    },
    {
      title: 'Business Insights',
      items: [
        { id: 'email_daily', l: 'Daily Summary Report', d: 'Receive end-of-day performance metrics via email', type: 'email' },
        { id: 'email_marketing', l: 'Partner Updates', d: 'News about platform features and local events', type: 'email' },
      ]
    }
  ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 680 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Control how and when we keep you updated</p>
        </div>
      </div>

      {SECTIONS.map(sec => (
        <div key={sec.title} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, paddingLeft: 4 }}>{sec.title}</h3>
          <div style={{ ...s.card, padding: '8px' }}>
            {sec.items.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i === sec.items.length - 1 ? 'none' : '1px solid rgba(255,255,255,.03)' }}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{item.l}</span>
                    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase' }}>{item.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.4 }}>{item.d}</div>
                </div>
                <div style={s.toggle} onClick={() => toggle(item.id as any)}>
                   <div style={s.toggleBg(prefs[item.id as keyof typeof prefs])} />
                   <div style={s.toggleKnob(prefs[item.id as keyof typeof prefs])} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ ...s.card, background: 'rgba(245,196,24,.03)', borderColor: 'rgba(245,196,24,.1)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ padding: '10px', borderRadius: 12, background: 'rgba(245,196,24,.1)', color: '#f5c418' }}>
          <Ic.Zap />
        </div>
        <div>
          <h4 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: '#f5c418' }}>Priority SMS Alerts</h4>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>
            You have **250 SMS credits** remaining for this month. SMS alerts are sent when customers are 3 positions away from their turn.
          </p>
        </div>
      </div>
    </div>
  )
}
