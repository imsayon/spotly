"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueueStore } from "@/store/queue.store"
import { Ic } from "@spotly/ui"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 32, textAlign: 'center' as const },
  btnM: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '14px 28px', borderRadius: 999, background: 'var(--gC)', color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all .25s', marginTop: 20 },
}

export default function QueueTab() {
  const router = useRouter()
  const myEntry = useQueueStore(s => s.myEntry)

  useEffect(() => {
    if (myEntry) {
      router.replace(`/queue/${myEntry.id}`)
    }
  }, [myEntry, router])

  if (myEntry) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="animate-pulse" style={{ color: 'var(--t3)', fontWeight: 600 }}>
          Redirecting to active queue...
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '40px 20px' }}>
      <div style={s.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>No Active Queue</h1>
        <p style={{ color: 'var(--t2)', fontSize: 15, maxWidth: 280, margin: '0 auto' }}>
          You're not currently waiting for any outlet. Browse around to find some amazing places!
        </p>
        
        <button 
          onClick={() => router.push('/home')} 
          style={s.btnM}
          className="hover:shadow-[0_8px_24px_rgba(245,196,24,0.3)] active:scale-95"
        >
          <Ic.Shop /> Browse Merchants
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Why use Spotly?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {[
            { icon: '✨', title: 'Zero Waiting', desc: 'Join queues remotely and save your precious time.' },
            { icon: '🔔', title: 'Live Updates', desc: 'Get notified exactly when it\'s your turn.' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 14, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bdr)' }}>
              <div style={{ fontSize: 20 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
