"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ic, useToasts } from "@spotly/ui"
import { useQueueStore } from "@/store/queue.store"

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' } as React.CSSProperties,
  gradCText: { background: 'linear-gradient(135deg,#f5c418,#ff6316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } as React.CSSProperties,
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
    ...(c === 'gray' && { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.5)', border: '1px solid var(--bdr)' }),
  }),
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 13, background: 'rgba(255,77,109,.1)', color: '#ff4d6d', fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,77,109,.2)', cursor: 'pointer', transition: 'all .25s' } as React.CSSProperties,
}

export default function ConsumerQueue() {
  const router = useRouter()
  const { add: addToast } = useToasts()
  const { myEntry, fetchActiveEntry } = useQueueStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const entry = await fetchActiveEntry()
      setLoading(false)
      // If user has an active entry, redirect them to the real live queue page
      if (entry) {
        router.replace(`/queue/${entry.id}`)
      }
    }
    load()
  }, [fetchActiveEntry, router])

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.04)', borderTopColor: '#f5c418', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>Checking queue status...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  // No active queue entry — show empty state
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 2 }}>Your Queue</h1>
          <p style={{ color: 'var(--t3)', fontSize: 13 }}>No active queue</p>
        </div>
        <span style={{ ...s.badge('gray') as React.CSSProperties, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Ic.Clock /> IDLE
        </span>
      </div>

      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        {/* Empty state illustration */}
        <div style={{ 
          width: 200, height: 200, borderRadius: '50%', margin: '0 auto 32px', 
          background: 'rgba(255,255,255,.01)', border: '2px solid rgba(255,255,255,.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.15)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>Token</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,.06)', lineHeight: 1 }}>—</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Clock /> No queue</div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 900, marginBottom: 8, color: 'rgba(255,255,255,.6)' }}>
          You&apos;re not in a queue
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 14, lineHeight: 1.6, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
          Browse nearby merchants and join a queue to get started. Your live status will appear here.
        </p>

        <button 
          onClick={() => router.push('/home')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 14,
            background: 'linear-gradient(135deg,#f5c418,#ff6316)',
            color: '#000', fontWeight: 800, fontSize: 15,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245,196,24,.2)',
            transition: 'all .25s ease',
          }}
        >
          <Ic.Search /> Find Merchants
        </button>
      </div>
    </div>
  )
}
