"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts, THEME } from "@spotly/ui"
import api from "@/lib/api"

const s = THEME.styles

export default function InventoryPage() {
  const { merchantProfile } = useAuthStore()
  const { add: addToast } = useToasts()

  const [outlets, setOutlets] = useState<any[]>([])
  const [selectedOutlet, setSelectedOutlet] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all')

  // Fetch outlets
  useEffect(() => {
    const fetchOutlets = async () => {
      if (!merchantProfile?.id) return
      try {
        const res = await api.get(`/outlet/merchant/${merchantProfile.id}`)
        setOutlets(res.data.data)
        if (res.data.data.length > 0) {
          setSelectedOutlet(res.data.data[0].id)
        }
      } catch (err) {
        addToast('Failed to load outlets', 'error')
      }
    }
    fetchOutlets()
  }, [merchantProfile?.id, addToast])

  // Fetch menu for selected outlet
  useEffect(() => {
    const fetchMenu = async () => {
      if (!selectedOutlet) return
      try {
        const res = await api.get(`/menu/${selectedOutlet}`)
        setCategories(res.data.data)
      } catch (err) {
        addToast('Failed to load inventory', 'error')
      }
    }
    fetchMenu()
  }, [selectedOutlet, addToast])

  const fetchMenu = async () => {
    if (!selectedOutlet) return
    const res = await api.get(`/menu/${selectedOutlet}`)
    setCategories(res.data.data)
  }

  const getOrCreateGeneralCategory = async () => {
    let general = categories.find((c: any) => c.name === 'General')
    if (general) return general.id

    const res = await api.post(`/menu/${selectedOutlet}/category`, { name: 'General' })
    return res.data.data.id
  }

  const addItem = async () => {
    if (!newName.trim() || !newPrice.trim()) {
      addToast('Name and price are required', 'error')
      return
    }
    try {
      const catId = await getOrCreateGeneralCategory()
      await api.post(`/menu/category/${catId}/item`, {
        name: newName.trim(),
        price: parseFloat(newPrice),
        description: ''
      })
      addToast('Item added', 'success')
      setNewName('')
      setNewPrice('')
      setShowAddForm(false)
      fetchMenu()
    } catch {
      addToast('Failed to add item', 'error')
    }
  }

  const toggleAvailability = async (item: any) => {
    try {
      await api.patch(`/menu/item/${item.id}`, { isAvailable: !item.isAvailable })
      fetchMenu()
      addToast(`${item.name} marked as ${item.isAvailable ? 'unavailable' : 'available'}`, 'info')
    } catch {
      addToast('Update failed', 'error')
    }
  }

  const deleteItem = async (item: any) => {
    if (!confirm('Delete this item?')) return
    try {
      await api.delete(`/menu/item/${item.id}`)
      fetchMenu()
      addToast('Item removed', 'info')
    } catch {
      addToast('Delete failed', 'error')
    }
  }

  const allItems = categories.flatMap(c => c.items)
  const filtered = allItems.filter(item => {
    if (filter === 'available') return item.isAvailable
    if (filter === 'unavailable') return !item.isAvailable
    return true
  })

  const availableCount = allItems.filter(i => i.isAvailable).length
  const unavailableCount = allItems.length - availableCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '36px 36px 56px', maxWidth: 760 }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
            Inventory
          </h1>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>
            Manage what your store offers.
            <span style={{ color: '#1fd97c', marginLeft: 8, fontWeight: 700 }}>{availableCount} available</span>
            {unavailableCount > 0 && (
              <span style={{ color: '#ff4d6d', marginLeft: 8, fontWeight: 700 }}>{unavailableCount} unavailable</span>
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {outlets.length > 0 && (
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer'
              }}
            >
              {outlets.map(o => (
                <option key={o.id} value={o.id} style={{ background: '#1a1a1a' }}>{o.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12,
              background: showAddForm ? 'rgba(255,255,255,.06)' : THEME.gradients.merchant,
              border: showAddForm ? '1px solid rgba(255,255,255,.12)' : 'none',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s',
            }}
          >
            {showAddForm ? <><Ic.X size={14} /> Cancel</> : '+ Add Item'}
          </button>
        </div>
      </div>

      {/* ADD ITEM FORM */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}
          >
            <div style={{
              ...s.card as any, padding: '22px',
              background: 'rgba(31,217,124,.04)',
              borderColor: 'rgba(31,217,124,.15)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
                Add New Item
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="Item name (required)"
                  style={{
                    flex: '2 1 200px',
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    color: '#fff', fontSize: 14, outline: 'none',
                  }}
                />
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="Price ₹"
                  style={{
                    flex: '1 1 120px',
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    color: '#fff', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={addItem}
                  style={{
                    padding: '12px 24px', borderRadius: 12,
                    background: THEME.gradients.merchant,
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER TABS */}
      {allItems.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'available', 'unavailable'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px', borderRadius: 99,
                background: filter === f ? (f === 'unavailable' ? 'rgba(255,77,109,.15)' : 'rgba(31,217,124,.12)') : 'rgba(255,255,255,.04)',
                border: `1px solid ${filter === f ? (f === 'unavailable' ? 'rgba(255,77,109,.3)' : 'rgba(31,217,124,.25)') : 'rgba(255,255,255,.08)'}`,
                color: filter === f ? (f === 'unavailable' ? '#ff4d6d' : '#1fd97c') : 'rgba(255,255,255,.4)',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? `All (${allItems.length})` : f === 'available' ? `Available (${availableCount})` : `Unavailable (${unavailableCount})`}
            </button>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {allItems.length === 0 && (
        <div style={{
          ...s.card as any, padding: '60px 20px', textAlign: 'center',
          borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, color: 'rgba(255,255,255,0.4)' }}><Ic.Package /></div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No inventory yet</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14, maxWidth: 340, margin: '0 auto 24px' }}>
            Add items that your store offers. Make sure to select the correct outlet first!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '12px 28px', borderRadius: 12,
              background: THEME.gradients.merchant,
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            + Add First Item
          </button>
        </div>
      )}

      {/* ITEM LIST */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 16,
                  background: item.isAvailable ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.01)',
                  border: `1px solid ${item.isAvailable ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`,
                  transition: 'all .2s',
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: item.isAvailable ? '#1fd97c' : '#374151',
                  boxShadow: item.isAvailable ? '0 0 8px rgba(31,217,124,.4)' : 'none',
                  transition: 'all .3s',
                }} />

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 15, color: item.isAvailable ? '#fff' : 'rgba(255,255,255,.35)',
                    textDecoration: item.isAvailable ? 'none' : 'line-through',
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 600, marginTop: 2,
                  }}>
                    ₹{item.price}
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleAvailability(item)}
                  style={{
                    padding: '8px 16px', borderRadius: 99,
                    background: item.isAvailable ? 'rgba(31,217,124,.1)' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${item.isAvailable ? 'rgba(31,217,124,.25)' : 'rgba(255,255,255,.08)'}`,
                    color: item.isAvailable ? '#1fd97c' : 'rgba(255,255,255,.3)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .25s',
                    minWidth: 110,
                  }}
                >
                  {item.isAvailable ? <><Ic.Check size={12} /> Available</> : 'Unavailable'}
                </button>

                {/* Delete */}
                <motion.button
                  whileHover={{ background: 'rgba(255,77,109,.15)', color: '#ff4d6d' }}
                  onClick={() => deleteItem(item)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.08)',
                    color: 'rgba(255,255,255,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  ×
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No results for filter */}
      {allItems.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,.2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8, color: 'rgba(255,255,255,0.4)' }}><Ic.Search /></div>
          <div style={{ fontWeight: 700 }}>No {filter} items</div>
        </div>
      )}
    </motion.div>
  )
}
