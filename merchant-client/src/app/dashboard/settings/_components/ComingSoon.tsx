"use client"

import React from "react"
import { Ic, THEME } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
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

interface ComingSoonProps {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{title}</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>{description}</p>
        </div>
      </div>

      <div style={{ ...s.card, padding: 32, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,196,24,.1)', color: '#f5c418', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic.Settings />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Not available yet</h2>
          <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.6, marginBottom: 20 }}>
            This section is disabled until the production backend integration is ready.
          </p>
          <button style={s.btnGhost} onClick={() => router.push('/dashboard/settings')}>
            Back to settings
          </button>
        </div>
      </div>
    </div>
  )
}
