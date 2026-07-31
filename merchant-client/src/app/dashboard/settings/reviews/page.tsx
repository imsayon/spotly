"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Ic, THEME } from "@spotly/ui"
import { useRouter } from "next/navigation"
import type { Review } from "@spotly/types"
import api from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"

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

interface ReviewStats {
  avgRating: number
  count: number
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export default function ReviewsPage() {
  const router = useRouter()
  const { merchantProfile } = useAuthStore()
  const outletId = merchantProfile?.outlets?.[0]?.id

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ avgRating: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    if (!outletId) {
      setLoading(false)
      return
    }

    setLoading(true)
    Promise.all([
      api.get(`/review/outlet/${outletId}/stats`),
      api.get(`/review/outlet/${outletId}`),
    ])
      .then(([statsRes, reviewsRes]) => {
        if (!mounted) return
        setStats(statsRes.data.data || { avgRating: 0, count: 0 })
        setReviews(reviewsRes.data.data || [])
      })
      .catch(() => {
        if (!mounted) return
        setStats({ avgRating: 0, count: 0 })
        setReviews([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [outletId])

  const distribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => review.rating === star).length,
    }))
    const total = Math.max(reviews.length, 1)
    return counts.map((item) => ({
      ...item,
      pct: Math.round((item.count / total) * 100),
      color: item.star >= 4 ? '#1fd97c' : item.star === 3 ? '#f5c418' : '#ff4d6d',
    }))
  }, [reviews])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 60px', maxWidth: 840 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.ChevronLeft />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Customer Reviews</h1>
          <p style={{ color: 'var(--t4)', fontSize: 13 }}>Feedback from the selected outlet</p>
        </div>
      </div>

      {!outletId ? (
        <div style={{ ...s.card, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>No outlet found</h2>
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Create an outlet before collecting customer reviews.</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,.04)', borderTopColor: '#1fd97c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 32 }}>
            <div style={s.card}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f5c418', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Avg. Rating</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>{stats.avgRating.toFixed(1)}</div>
                <div style={{ color: 'var(--t4)', fontSize: 16, fontWeight: 700 }}>/ 5.0</div>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(i => <Ic.Activity key={i} color={i <= Math.round(stats.avgRating) ? "#f5c418" : "rgba(255,255,255,.08)"} size={16} />)}
              </div>
              <p style={{ fontSize: 12, color: 'var(--t4)' }}>Based on {stats.count.toLocaleString()} verified reviews</p>
            </div>

            <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Rating Distribution</div>
              {distribution.map(r => (
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

          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: 'var(--t2)' }}>Latest Consumer Feedback</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.length === 0 ? (
              <div style={{ ...s.card, padding: 28, textAlign: 'center' }}>
                <p style={{ color: 'var(--t3)', fontSize: 14 }}>No reviews yet.</p>
              </div>
            ) : reviews.map(r => (
              <div key={r.id} style={{ ...s.card, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(45deg, #1fd97c, #0d1117)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: 12 }}>{r.userId[0]?.toUpperCase() || 'U'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Customer {r.userId.slice(0, 6)}</div>
                      <div style={{ fontSize: 11, color: 'var(--t4)' }}>{formatDate(r.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Ic.Activity key={i} size={12} color={i < r.rating ? '#f5c418' : 'rgba(255,255,255,.05)'} />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 0 }}>{r.comment || "No written comment."}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
