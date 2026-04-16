"use client"

import React from "react"
import { motion } from "framer-motion"
import { Ic, THEME, useToasts } from "@spotly/ui"
import { useRouter } from "next/navigation"

const s = {
  ...THEME.styles,
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 20, padding: 24 },
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

export default function ReviewsPage() {
  const router = useRouter()
  const { add: addToast } = useToasts()

  const REVIEWS = [
    { id: 1, user: 'Rahul Sharma', rating: 5, date: '2 hours ago', text: 'Amazing experience! The queue moved so fast and it was so easy to wait at the cafe nearby.', tags: ['QUICK', 'RELIABLE'] },
    { id: 2, user: 'Ananya Iyer', rating: 4, date: 'Yesterday', text: 'Good service, but the outlet was a bit crowded. The app notification was very helpful though.', tags: ['HELPFUL'] },
    { id: 3, user: 'Kevin Peterson', rating: 5, date: 'Oct 14', text: 'Best way to handle weekend rush. No more standing in long lines.', tags: ['CONVENIENT'] },
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
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Customer Reviews</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Understand customer satisfaction and feedback trends</p>
        </div>
      </div>

      {/* ANALYTICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 32 }}>
        <div style={s.card}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c418', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Avg. Rating</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
             <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>4.8</div>
             <div style={{ color: 'var(--t4)', fontSize: 16, fontWeight: 700 }}>/ 5.0</div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
             {[1,2,3,4,5].map(i => <Ic.Activity key={i} color="#f5c418" size={16} />)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--t4)' }}>Based on 1,240 verified visits</p>
        </div>

        <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Rating Distribution</div>
          {[
            { star: 5, pct: 85, color: '#1fd97c' },
            { star: 4, pct: 10, color: '#1fd97c' },
            { star: 3, pct: 3, color: '#f5c418' },
            { star: 2, pct: 1, color: '#ff4d6d' },
            { star: 1, pct: 1, color: '#ff4d6d' },
          ].map(r => (
            <div key={r.star} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', width: 14 }}>{r.star}</span>
               <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.05)', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '100%', borderRadius: 3, background: r.color, width: `${r.pct}%` }} />
               </div>
               <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', width: 30, textAlign: 'right' }}>{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS LIST */}
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--t2)' }}>Latest Consumer Feedback</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {REVIEWS.map(r => (
          <div key={r.id} style={{ ...s.card, padding: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(45deg, #1fd97c, #0d1117)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 12 }}>{r.user[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.user}</div>
                    <div style={{ fontSize: 11, color: 'var(--t4)' }}>{r.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Ic.Activity key={i} size={12} color={i < r.rating ? '#f5c418' : 'rgba(255,255,255,.05)'} />
                  ))}
                </div>
             </div>
             <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 16 }}>"{r.text}"</p>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 9, fontWeight: 900, background: 'rgba(31,217,124,.1)', color: '#1fd97c', padding: '4px 8px', borderRadius: 4, letterSpacing: 0.5 }}>{tag}</span>
                  ))}
                </div>
                <button style={{ ...s.btnGhost, padding: '6px 14px', fontSize: 12 }} onClick={() => addToast('Reply feature coming in next update', 'info')}>Reply</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
