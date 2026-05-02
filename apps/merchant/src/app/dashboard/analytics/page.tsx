"use client"

import React, { useEffect, useState } from "react"
import { Ic, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"

const s = {
  ...THEME.styles,
  gradMText: THEME.gradients.merchantText,
  badge: THEME.badge,
  btnGhost: {
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
};

interface AnalyticsData {
  totalTokens: number
  avgWaitTime: string
  servedToday: number
  missedToday: number
  hourlyData: number[]
}

export default function MerchantAnalytics() {
  const { merchantProfile } = useAuthStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!merchantProfile?.id) return

      try {
        // Fetch outlets
        const outletsRes = await api.get(`/outlet/merchant/${merchantProfile.id}`)
        const outlets = outletsRes.data.data || []

        // Aggregate queue data from all outlets
        let totalTokens = 0
        let servedToday = 0
        let missedToday = 0
        const allEntries: any[] = []

        for (const outlet of outlets) {
          try {
            const qRes = await api.get(`/queue/${outlet.id}`)
            const entries = qRes.data.data || []
            allEntries.push(...entries)
            totalTokens += entries.length
            servedToday += entries.filter((e: any) => e.status === 'SERVED').length
            missedToday += entries.filter((e: any) => e.status === 'MISSED' || e.status === 'CANCELLED').length
          } catch {
            // Skip unavailable outlets
          }
        }

        // Build hourly distribution (group by hour of joinedAt)
        const hourlyMap = new Array(24).fill(0)
        allEntries.forEach((entry: any) => {
          if (entry.joinedAt) {
            const hour = new Date(entry.joinedAt).getHours()
            hourlyMap[hour]++
          }
        })

        setData({
          totalTokens,
          avgWaitTime: allEntries.length > 0 ? `${Math.max(1, Math.round(totalTokens * 4.5 / Math.max(1, servedToday)))}m` : '—',
          servedToday,
          missedToday,
          hourlyData: hourlyMap,
        })
      } catch {
        // Use empty state
        setData({
          totalTokens: 0,
          avgWaitTime: '—',
          servedToday: 0,
          missedToday: 0,
          hourlyData: new Array(24).fill(0),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [merchantProfile?.id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,.04)', borderTopColor: '#1fd97c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const analytics = data!
  const maxH = Math.max(...analytics.hourlyData, 1)

  const metrics = [
    { l: 'Total Tokens', v: analytics.totalTokens.toLocaleString(), sub: 'All-time issued', c: '#1fd97c' },
    { l: 'Avg Wait Time', v: analytics.avgWaitTime, sub: 'Per customer', c: '#f5c418' },
    { l: 'Completed', v: analytics.servedToday.toString(), sub: 'Served today', c: '#a78bfa' },
    { l: 'Bounced', v: analytics.missedToday.toString(), sub: 'Missed today', c: '#ff4d6d' },
  ]

  const hourLabels = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '11PM']

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>Performance insights and queue metrics</p>
      </div>

      {/* METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ ...s.card, padding: '24px', background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{m.l}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: m.c, marginBottom: 4, letterSpacing: -1 }}>{m.v}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* HOURLY CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...s.card, padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 18 }}>Traffic Distribution</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Hourly token issuance</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 260, marginBottom: 16, padding: '0 10px' }}>
            {analytics.hourlyData.map((v, i) => {
              const pct = maxH > 0 ? (v / maxH) * 100 : 0
              const isPeak = pct > 75
              return (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, textAlign: 'center' }}>
                  {v > 0 && <div style={{ fontSize: 9, color: isPeak ? '#f5c418' : 'rgba(255,255,255,.2)', fontWeight: 700 }}>{v}</div>}
                  <div 
                    style={{ 
                      width: '100%', 
                      borderRadius: '6px 6px 2px 2px', 
                      background: isPeak ? 'linear-gradient(180deg,#f5c418,#ff6316)' : THEME.gradients.merchant, 
                      height: `${Math.max(pct, v > 0 ? 4 : 0)}%`, 
                      minHeight: v > 0 ? 4 : 0, 
                      transition: 'height 1.2s cubic-bezier(.34,1.56,.64,1)', 
                      opacity: .85,
                      boxShadow: isPeak ? '0 10px 30px rgba(245,196,24,.2)' : 'none'
                    }} 
                    className="hover:opacity-100 cursor-pointer"
                  />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,.2)', fontWeight: 700 }}>
            {hourLabels.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Queue Efficiency</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { n: 'Served Rate', v: analytics.totalTokens > 0 ? `${Math.round((analytics.servedToday / Math.max(1, analytics.servedToday + analytics.missedToday)) * 100)}%` : '—', p: analytics.totalTokens > 0 ? `${Math.round((analytics.servedToday / Math.max(1, analytics.servedToday + analytics.missedToday)) * 100)}%` : '0%' },
              { n: 'Bounce Rate', v: analytics.totalTokens > 0 ? `${Math.round((analytics.missedToday / Math.max(1, analytics.servedToday + analytics.missedToday)) * 100)}%` : '—', p: analytics.totalTokens > 0 ? `${Math.round((analytics.missedToday / Math.max(1, analytics.servedToday + analytics.missedToday)) * 100)}%` : '0%' },
              { n: 'Active Queue', v: `${analytics.totalTokens - analytics.servedToday - analytics.missedToday}`, p: analytics.totalTokens > 0 ? `${Math.round(((analytics.totalTokens - analytics.servedToday - analytics.missedToday) / analytics.totalTokens) * 100)}%` : '0%' },
            ].map((o, i) => (
              <div key={i} style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>{o.n}</span>
                  <span style={{ color: 'rgba(255,255,255,.35)' }}>{o.v}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: o.p, height: '100%', background: THEME.gradients.merchant, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Peak Hours</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analytics.hourlyData
              .map((v, i) => ({ hour: i, count: v }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .filter(h => h.count > 0)
              .map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? 'rgba(245,196,24,.15)' : 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i === 0 ? '#f5c418' : 'rgba(255,255,255,.4)' }}>
                    {h.hour > 12 ? `${h.hour - 12}P` : h.hour === 0 ? '12A' : h.hour === 12 ? '12P' : `${h.hour}A`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(h.count / maxH) * 100}%`, height: '100%', background: i === 0 ? 'linear-gradient(90deg,#f5c418,#ff6316)' : THEME.gradients.merchant, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-mono)' }}>{h.count}</span>
                </div>
              ))}
            {analytics.hourlyData.every(v => v === 0) && (
              <p style={{ color: 'rgba(255,255,255,.2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No queue data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
