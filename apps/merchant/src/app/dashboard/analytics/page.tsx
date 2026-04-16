"use client"

import React, { useEffect, useState } from "react"
import { Ic, THEME, SkeletonCard, useToasts } from "@spotly/ui"
import api from "@/lib/api"

// Extended styles for this page
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

export default function MerchantAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { add: addToast } = useToasts();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/merchant');
        setData(res.data.data);
      } catch (err) {
        addToast('Failed to load analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [addToast]);

  if (loading) {
    return (
      <div style={{ padding: '36px' }}>
        <SkeletonCard height={60} style={{ marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </div>
        <SkeletonCard height={300} />
      </div>
    );
  }

  if (!data) return null;

  const maxH = Math.max(...(data.dailyDistribution?.map((d: any) => d.v) || [1]));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>Performance insights and customer behavior</p>
      </div>

      {/* METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {data.metrics.map((m: any, i: number) => (
          <div key={i} style={{ ...s.card, padding: '24px', background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{m.l}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 800, color: m.c, marginBottom: 4, letterSpacing: -1 }}>{m.v}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ ...s.card, padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 18 }}>Traffic Distribution</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)' }}>Hourly token issuance for today</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 260, marginBottom: 16, padding: '0 10px' }}>
            {data.dailyDistribution.map((d: any, i: number) => {
              const pct = (d.v / maxH) * 100
              const isPeak = pct > 0 && pct > 80
              return (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: isPeak ? '#f5c418' : 'rgba(255,255,255,.2)', fontWeight: 700 }}>{d.v}</div>
                  <div 
                    style={{ 
                      width: '100%', 
                      borderRadius: '6px 6px 2px 2px', 
                      background: isPeak ? 'linear-gradient(180deg,#f5c418,#ff6316)' : THEME.gradients.merchant, 
                      height: `${pct || 2}%`, 
                      minHeight: 4, 
                      transition: 'height 1.2s cubic-bezier(.34,1.56,.64,1)', 
                      opacity: .85,
                      boxShadow: isPeak ? '0 10px 30px rgba(245,196,24,.2)' : 'none'
                    }} 
                    className="hover:opacity-100 cursor-pointer"
                  />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontWeight: 600 }}>{d.time}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* FOOTER METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Top Outlets</h3>
          {data.topOutlets.map((o: any, i: number) => (
            <div key={i} style={{ marginBottom: 18 }}>
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
        
        <div style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Customer Ratings</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#f5c418', lineHeight: 1 }}>4.8</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 700, marginTop: 4 }}>OUT OF 5</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[5, 4, 3, 2, 1].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', width: 10 }}>{r}</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.05)', borderRadius: 2 }}>
                    <div style={{ width: r === 5 ? '82%' : r === 4 ? '14%' : '2%', height: '100%', background: '#f5c418', borderRadius: 2, opacity: .7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button style={{ ...s.btnGhost, width: '100%', fontSize: 12, padding: '10px' }} onClick={() => {}}>View All 98 Reviews</button>
        </div>
      </div>
    </div>
  )
}
