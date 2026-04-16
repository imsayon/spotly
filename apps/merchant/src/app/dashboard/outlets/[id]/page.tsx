"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Ic, useToasts, THEME } from "@spotly/ui"
import api from "@/lib/api"

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
    padding: '12px 24px',
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
  badge: THEME.badge,
};

const TABS = [
  { id: 'info', label: 'General Info', ic: <Ic.Building /> },
  { id: 'inventory', label: 'Inventory (Digital Menu)', ic: <Ic.Pie /> },
  { id: 'hours', label: 'Business Hours', ic: <Ic.Activity /> },
  { id: 'settings', label: 'Advance Settings', ic: <Ic.Settings /> },
];

export default function OutletDetails() {
  const { id } = useParams()
  const router = useRouter()
  const { add: addToast } = useToasts()
  const [activeTab, setActiveTab] = useState('info')
  
  // Outlet Info State
  const [outlet, setOutlet] = useState<any>(null)
  const [loadingOutlet, setLoadingOutlet] = useState(true)
  const [outletForm, setOutletForm] = useState({ name: '', address: '' })

  // Menu State
  const [categories, setCategories] = useState<any[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  
  // Create State
  const [newCatName, setNewCatName] = useState('')
  const [showItemForm, setShowItemForm] = useState<string | null>(null) // categoryId
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '' })

  const fetchOutlet = useCallback(async () => {
    setLoadingOutlet(true)
    try {
      const res = await api.get(`/outlet/${id}`)
      setOutlet(res.data.data)
      setOutletForm({
        name: res.data.data.name,
        address: res.data.data.address
      })
    } catch {
      addToast('Failed to load outlet details', 'error')
    } finally {
      setLoadingOutlet(false)
    }
  }, [id, addToast])

  const fetchMenu = useCallback(async () => {
    setLoadingMenu(true)
    try {
      const res = await api.get(`/menu/${id}`)
      setCategories(res.data.data)
    } catch {
      addToast('Failed to load menu', 'error')
    } finally {
      setLoadingMenu(false)
    }
  }, [id, addToast])

  useEffect(() => {
    fetchOutlet()
  }, [fetchOutlet])

  useEffect(() => {
    if (activeTab === 'inventory') fetchMenu()
  }, [activeTab, fetchMenu])

  const handleUpdateOutlet = async () => {
    try {
      await api.patch(`/outlet/${id}`, outletForm)
      addToast('Outlet profile updated', 'success')
      fetchOutlet()
    } catch {
      addToast('Failed to update outlet', 'error')
    }
  }

  const addCategory = async () => {
    if (!newCatName) return
    try {
      await api.post(`/menu/${id}/category`, { name: newCatName })
      setNewCatName('')
      fetchMenu()
      addToast('Category created', 'success')
    } catch {
      addToast('Failed to create category', 'error')
    }
  }

  const addItem = async (catId: string) => {
    if (!itemForm.name || !itemForm.price) return
    try {
      await api.post(`/menu/category/${catId}/item`, {
        ...itemForm,
        price: parseFloat(itemForm.price)
      })
      setItemForm({ name: '', price: '', description: '' })
      setShowItemForm(null)
      fetchMenu()
      addToast('Item added', 'success')
    } catch {
      addToast('Failed to add item', 'error')
    }
  }

  const toggleAvailability = async (item: any) => {
    try {
      await api.patch(`/menu/item/${item.id}`, { isAvailable: !item.isAvailable })
      fetchMenu()
    } catch {
      addToast('Update failed', 'error')
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      await api.delete(`/menu/item/${itemId}`)
      fetchMenu()
      addToast('Item deleted', 'info')
    } catch {
      addToast('Delete failed', 'error')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 80px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
        <button 
          onClick={() => router.push('/dashboard/outlets')} 
          style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ic.X />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 900 }}>
              {loadingOutlet ? 'Loading...' : outlet?.name || 'Main Branch'}
            </h1>
            <span style={{ ...s.badge('merchant'), fontSize: 10, background: (outlet?.isActive ?? true) ? 'rgba(31,217,124,.15)' : 'rgba(255,77,109,.15)', color: (outlet?.isActive ?? true) ? '#1fd97c' : '#ff4d6d' } as React.CSSProperties}>
              {(outlet?.isActive ?? true) ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>Outlet ID: {id} · {outlet?.address}</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,.05)', paddingBottom: 16 }}>
        {TABS.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: activeTab === t.id ? 'rgba(31,217,124,.1)' : 'transparent', color: activeTab === t.id ? '#1fd97c' : 'rgba(255,255,255,.4)', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s'
            }}
          >
            {t.ic}{t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeTab === 'info' && (
        <div className="animate-in zoom-in-95 duration-300" style={{ maxWidth: 600 }}>
          <div style={{ ...s.card, padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Outlet Information</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Branch Name</label>
              <input 
                type="text" 
                style={s.input} 
                value={outletForm.name}
                onChange={e => setOutletForm(p => ({...p, name: e.target.value}))}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Street Address</label>
              <input 
                type="text" 
                style={s.input} 
                value={outletForm.address} 
                onChange={e => setOutletForm(p => ({...p, address: e.target.value}))}
              />
            </div>

            <button style={{ ...s.btnM, width: '100%', marginTop: 12 }} onClick={handleUpdateOutlet}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="animate-in zoom-in-95 duration-300">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 4px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 20 }}>Digital Menu</h3>
              <p style={{ color: 'var(--t3)', fontSize: 13 }}>Create categories and add items to your catalog.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                style={{ ...s.input, width: 220, fontSize: 13 }} 
                placeholder="New Category Name..." 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') addCategory() }} 
              />
              <button style={{ ...s.btnM, padding: '10px 20px' }} onClick={addCategory}><Ic.Plus /> Add Category</button>
            </div>
          </div>
          
          {loadingMenu ? (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>Loading menu catalog...</div>
          ) : categories.length === 0 ? (
            <div style={{ ...s.card, padding: 60, textAlign: 'center', borderStyle: 'dashed', opacity: 0.6 }}>
               <div style={{ fontSize: 40, marginBottom: 16 }}>🥡</div>
               <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Empty Catalog</div>
               <p style={{ color: 'var(--t4)', fontSize: 13 }}>Add your first category above to begin.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ ...s.card, padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <h4 style={{ fontWeight: 900, fontSize: 18, color: '#1fd97c' }}>{cat.name} ({cat.items.length})</h4>
                     <button style={s.btnGhost} onClick={() => setShowItemForm(cat.id)}>
                        <Ic.Plus /> Add Item
                     </button>
                  </div>

                  {showItemForm === cat.id && (
                    <div style={{ background: 'rgba(255,255,255,.02)', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid rgba(255,255,255,.05)' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 12 }}>
                          <input style={s.input} placeholder="Item Name" value={itemForm.name} onChange={e => setItemForm(p => ({...p, name: e.target.value})) } />
                          <input style={s.input} placeholder="Price ₹" type="number" value={itemForm.price} onChange={e => setItemForm(p => ({...p, price: e.target.value})) } />
                       </div>
                       <textarea 
                          style={{ ...s.input, minHeight: 60, resize: 'none', marginBottom: 12 }} 
                          placeholder="Short description..." 
                          value={itemForm.description}
                          onChange={e => setItemForm(p => ({...p, description: e.target.value})) }
                       />
                       <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ ...s.btnM, padding: '8px 16px', fontSize: 13 }} onClick={() => addItem(cat.id)}>Save Item</button>
                          <button style={{ ...s.btnGhost, padding: '8px 16px', fontSize: 13 }} onClick={() => setShowItemForm(null)}>Cancel</button>
                       </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {cat.items.map((item: any) => (
                      <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', gap: 12, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,.03)', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                          {item.description && <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>{item.description}</div>}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: '#f5c418' }}>₹{item.price}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div 
                            style={{ position: 'relative', width: 36, height: 18, cursor: 'pointer' }} 
                            onClick={() => toggleAvailability(item)}
                          >
                            <div style={{ width: '100%', height: '100%', borderRadius: 9, background: item.isAvailable ? 'rgba(31,217,124,.2)' : 'rgba(255,77,109,.1)', transition: 'all .3s' }} />
                            <div style={{ position: 'absolute', top: 2, left: item.isAvailable ? 20 : 2, width: 14, height: 14, borderRadius: '50%', background: item.isAvailable ? '#1fd97c' : '#ff4d6d', transition: 'all .3s' }} />
                          </div>
                          <span style={{ fontSize: 10, color: item.isAvailable ? '#1fd97c' : '#ff4d6d', fontWeight: 800 }}>{item.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <button 
                            style={{ background: 'rgba(255,77,109,.1)', border: 'none', color: '#ff4d6d', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }} 
                            onClick={() => deleteItem(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {cat.items.length === 0 && (
                      <div style={{ padding: '20px 0', color: 'var(--t4)', fontSize: 13, fontStyle: 'italic' }}>No items in this category yet.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="animate-in zoom-in-95 duration-300" style={{ maxWidth: 540 }}>
          <div style={{ ...s.card, padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Operating Hours</h3>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ width: 100, fontSize: 14, fontWeight: 700 }}>{day}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="time" defaultValue="09:00" style={{ ...s.input, padding: '8px 10px', fontSize: 13 }} />
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 12, fontWeight: 800 }}>-</span>
                  <input type="time" defaultValue="21:00" style={{ ...s.input, padding: '8px 10px', fontSize: 13 }} />
                </div>
              </div>
            ))}
            <button style={{ ...s.btnM, width: '100%', marginTop: 20 }} onClick={() => addToast('Schedule saved', 'success')}>Update Schedule</button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-in zoom-in-95 duration-300" style={{ maxWidth: 540 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { l: 'Auto-Advance Queue', d: 'Automatically call next token after 5 minutes of inactivity' },
              { l: 'Advance Booking', d: 'Allow customers to join the queue before outlet opens' },
              { l: 'SMS Notifications', d: 'Send SMS alerts when token is 3 positions away' },
            ].map(item => (
              <div key={item.l} style={{ ...s.card, padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, paddingRight: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.l}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', lineHeight: 1.4 }}>{item.d}</div>
                </div>
                <div style={{ position: 'relative', width: 44, height: 22, cursor: 'pointer' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 11, background: 'rgba(31,217,124,.15)', border: '1px solid rgba(31,217,124,.3)' }} />
                  <div style={{ position: 'absolute', top: 2, left: 24, width: 18, height: 18, borderRadius: '50%', background: '#1fd97c' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
