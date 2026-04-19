"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/auth.store"

// Extended styles for this page
const s = {
  ...THEME.styles,
  input: {
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#fff',
    outline: 'none',
    transition: 'all .2s',
    width: '100%',
    fontSize: 14
  } as React.CSSProperties,
  btnM: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 12,
    background: THEME.gradients.merchant,
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .22s'
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 18px',
    borderRadius: 11,
    background: 'rgba(255,255,255,.05)',
    color: 'rgba(255,255,255,.7)',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid rgba(255,255,255,.12)',
    cursor: 'pointer',
    transition: 'all .2s'
  } as React.CSSProperties,
  gradM: { background: THEME.gradients.merchant } as React.CSSProperties,
  gradMText: THEME.gradients.merchantText,
  badge: THEME.badge,
};

export default function MerchantOutlets() {
  const router = useRouter()
  const { add: addToast } = useToasts()
  const { merchantProfile, loading: authLoading } = useAuthStore()
  
  const [outlets, setOutlets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddr, setNewAddr] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (merchantProfile?.id) {
        loadOutlets()
      } else {
        setLoading(false)
      }
    }
  }, [merchantProfile, authLoading])

  const loadOutlets = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/outlet/merchant/${merchantProfile?.id}`)
      if (res.data.success) {
        // Map backend fields to UI fields
        const mapped = res.data.data.map((o: any) => ({
          ...o,
          addr: o.address,
          open: o.isActive,
          queue: 0, // TODO: Fetch real queue count
          hours: '9:00 AM – 9:00 PM' // TODO: Add hours to database model
        }))
        setOutlets(mapped)
      }
    } catch (err) {
      console.error('Failed to load outlets:', err)
      addToast('Failed to load outlets', 'error')
    } finally {
      setLoading(false)
    }
  }

  const create = async () => {
    if (!newName) return
    try {
      const res = await api.post('/outlet', {
        name: newName,
        address: newAddr || 'Bengaluru'
      })
      
      if (res.data.success) {
        addToast(`${newName} outlet created!`, 'success')
        setNewName('')
        setNewAddr('')
        setShowForm(false)
        loadOutlets() // Refresh list
      }
    } catch (err) {
      addToast('Failed to create outlet', 'error')
    }
  }

  const toggleOpen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const outlet = outlets.find(o => o.id === id)
    if (!outlet) return

    try {
      const newStatus = !outlet.open
      const res = await api.patch(`/outlet/${id}`, {
        isActive: newStatus
      })
      
      if (res.data.success) {
        setOutlets(p => p.map(o => o.id === id ? { ...o, open: newStatus } : o))
        addToast('Status updated', 'info')
      }
    } catch (err) {
      addToast('Failed to update status', 'error')
    }
  }

  // Handle stuck loading if no profile exists
  if ((authLoading || loading) && outlets.length === 0) {
    return (
      <div style={{ padding: 100, textAlign: 'center', opacity: .5 }}>
        <p className="animate-pulse">Loading your business outlets...</p>
      </div>
    )
  }

  // Handle case where user has no merchant profile yet
  if (!merchantProfile && !authLoading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🏪</div>
        <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>Finish Business Setup</h2>
        <p style={{ color: 'var(--t3)', maxWidth: 400, margin: '0 auto 32px' }}>
          You need to complete your business registration before managing outlets.
        </p>
        <button style={s.btnM} onClick={() => router.push('/dashboard/business')}>
          Set Up Business Profile
        </button>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Outlets</h1>
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>{outlets.length} locations · Active management</p>
        </div>
        <button style={{ ...s.btnM, gap: 6 }} onClick={() => setShowForm(!showForm)}>
          <Ic.Plus />New Outlet
        </button>
      </div>

      {showForm && (
        <div className="animate-in zoom-in-95 duration-300" style={{ ...s.card, padding: '24px', marginBottom: 20, background: 'rgba(31,217,124,.04)', borderColor: 'rgba(31,217,124,.2)' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Register New Outlet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 8 }}>Outlet Name</label>
              <input 
                style={s.input} 
                placeholder="e.g. Downtown Branch" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 8 }}>Address</label>
              <input 
                style={s.input} 
                placeholder="123 Main St, Area, City" 
                value={newAddr} 
                onChange={e => setNewAddr(e.target.value)} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...s.btnM, gap: 6 }} onClick={create}><Ic.Check />Create Outlet</button>
            <button style={s.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {outlets.length === 0 && !loading && (
        <div style={{ ...s.card, padding: 60, textAlign: 'center', background: 'rgba(255,255,255,.01)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No Outlets Yet</h3>
          <p style={{ color: 'var(--t3)', fontSize: 14, maxWidth: 300, margin: '0 auto 24px' }}>
            Register your first business location to start managing queues.
          </p>
          <button style={s.btnM} onClick={() => setShowForm(true)}>Add Your First Outlet</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
        {outlets.map((o: any) => (
          <div key={o.id} style={{ ...s.card, padding: '24px', cursor: 'pointer', position: 'relative' }}
            onClick={() => router.push(`/dashboard/outlets/${o.id}`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(31,217,124,.28)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = '' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(31,217,124,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏪</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', gap: 4 }}><Ic.MapPin />{o.addr}</div>
                </div>
              </div>
              <button 
                onClick={(e) => toggleOpen(o.id, e)}
                style={{ ...s.badge(o.open ? 'merchant' : 'consumer') as React.CSSProperties, background: o.open ? 'rgba(31,217,124,.15)' : 'rgba(255,77,109,.15)', color: o.open ? '#1fd97c' : '#ff4d6d', border: 'none', cursor: 'pointer' }}
              >
                {o.open ? '● Open' : '● Closed'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 24, color: '#f5c418', marginBottom: 2 }}>{o.queue}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontWeight: 700, letterSpacing: .5 }}>WAITING</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 2, paddingTop: 4 }}>{o.hours}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', fontWeight: 700, letterSpacing: .5 }}>HOURS</div>
              </div>
            </div>

            <button style={{ ...s.btnM, width: '100%', padding: '11px', fontSize: 13, gap: 7, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.7)' }} 
              onClick={e => { e.stopPropagation(); router.push(`/dashboard/outlets/${o.id}`) }}>
              <Ic.Settings />Configure Settings
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
