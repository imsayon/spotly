"use client"

import React, { useState } from "react"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useRouter } from "next/navigation"

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

// Mock Data
const MOCK_OUTLETS = [
  { id: 'o1', name: 'Main Branch - Indiranagar', addr: '12th Main Road, HAL 2nd Stage', open: true, queue: 14, hours: '9:00 AM – 9:00 PM' },
  { id: 'o2', name: 'Airport Terminal 2', addr: 'KIAL, Devanahalli', open: true, queue: 8, hours: '24 Hours' },
  { id: 'o3', name: 'HSR Layout', addr: '27th Main Rd, Sector 2', open: false, queue: 0, hours: '10:00 AM – 10:00 PM' },
];

export default function MerchantOutlets() {
  const router = useRouter()
  const { add: addToast } = useToasts()
  
  const [outlets, setOutlets] = useState<any[]>(MOCK_OUTLETS)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddr, setNewAddr] = useState('')

  const create = () => {
    if (!newName) return
    const id = `o${outlets.length + 1}`
    setOutlets(p => [...p, { id, name: newName, addr: newAddr || 'Bengaluru', open: true, queue: 0, hours: '9:00 AM – 9:00 PM' }])
    setNewName('')
    setNewAddr('')
    setShowForm(false)
    addToast(`${newName} outlet created!`, 'success')
  }

  const toggleOpen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOutlets(p => p.map(o => o.id === id ? { ...o, open: !o.open } : o))
    addToast('Status updated', 'info')
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
