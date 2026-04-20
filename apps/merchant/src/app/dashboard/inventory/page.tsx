"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts, THEME } from "@spotly/ui"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  name: string
  available: boolean
  tag?: string
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const storageKey = (merchantId: string) => `spotly_inventory_${merchantId}`

function loadInventory(merchantId: string): InventoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(merchantId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveInventory(merchantId: string, items: InventoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(merchantId), JSON.stringify(items))
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { merchantProfile } = useAuthStore()
  const { add: addToast } = useToasts()

  const [items, setItems] = useState<InventoryItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTag, setNewTag] = useState('')
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all')

  const merchantId = merchantProfile?.id ?? ''

  useEffect(() => {
    setMounted(true)
    if (merchantId) {
      setItems(loadInventory(merchantId))
    }
  }, [merchantId])

  if (!mounted) return null

  const persist = (next: InventoryItem[]) => {
    setItems(next)
    saveInventory(merchantId, next)
  }

  const toggleAvailability = (idx: number) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, available: !item.available } : item
    )
    persist(next)
    addToast(
      `${items[idx].name} marked as ${items[idx].available ? 'unavailable' : 'available'}`,
      'info'
    )
  }

  const deleteItem = (idx: number) => {
    const name = items[idx].name
    persist(items.filter((_, i) => i !== idx))
    addToast(`${name} removed`, 'info')
  }

  const addItem = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast('Item already exists', 'error')
      return
    }
    const next: InventoryItem[] = [
      ...items,
      { name: trimmed, available: true, tag: newTag.trim() || undefined },
    ]
    persist(next)
    addToast(`${trimmed} added ✓`, 'success')
    setNewName('')
    setNewTag('')
    setShowAddForm(false)
  }

  const filtered = items.filter(item => {
    if (filter === 'available') return item.available
    if (filter === 'unavailable') return !item.available
    return true
  })

  const availableCount = items.filter(i => i.available).length
  const unavailableCount = items.length - availableCount

  const s = THEME.styles

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
          {showAddForm ? '✕ Cancel' : '+ Add Item'}
        </button>
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
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  placeholder="Tag (optional)"
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
      {items.length > 0 && (
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
              {f === 'all' ? `All (${items.length})` : f === 'available' ? `Available (${availableCount})` : `Unavailable (${unavailableCount})`}
            </button>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {items.length === 0 && (
        <div style={{
          ...s.card as any, padding: '60px 20px', textAlign: 'center',
          borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>No inventory yet</div>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14, maxWidth: 340, margin: '0 auto 24px' }}>
            Add items that your store offers. You can also do this during onboarding.
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
            {filtered.map((item, rawIdx) => {
              // Find real index in items array
              const realIdx = items.indexOf(item)
              return (
                <motion.div
                  key={item.name}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px', borderRadius: 16,
                    background: item.available ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.01)',
                    border: `1px solid ${item.available ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`,
                    transition: 'all .2s',
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: item.available ? '#1fd97c' : '#374151',
                    boxShadow: item.available ? '0 0 8px rgba(31,217,124,.4)' : 'none',
                    transition: 'all .3s',
                  }} />

                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 15, color: item.available ? '#fff' : 'rgba(255,255,255,.35)',
                      textDecoration: item.available ? 'none' : 'line-through',
                    }}>
                      {item.name}
                    </div>
                    {item.tag && (
                      <div style={{
                        fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600, marginTop: 2,
                        background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: '2px 8px',
                        display: 'inline-block',
                      }}>
                        {item.tag}
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleAvailability(realIdx)}
                    style={{
                      padding: '8px 16px', borderRadius: 99,
                      background: item.available ? 'rgba(31,217,124,.1)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${item.available ? 'rgba(31,217,124,.25)' : 'rgba(255,255,255,.08)'}`,
                      color: item.available ? '#1fd97c' : 'rgba(255,255,255,.3)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .25s',
                      minWidth: 110,
                    }}
                  >
                    {item.available ? '✓ Available' : 'Unavailable'}
                  </button>

                  {/* Delete */}
                  <motion.button
                    whileHover={{ background: 'rgba(255,77,109,.15)', color: '#ff4d6d' }}
                    onClick={() => deleteItem(realIdx)}
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
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* No results for filter */}
      {items.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'rgba(255,255,255,.2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 700 }}>No {filter} items</div>
        </div>
      )}
    </motion.div>
  )
}
