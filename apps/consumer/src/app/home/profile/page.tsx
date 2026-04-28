"use client"

import React, { useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"
import { getMerchantIcon } from "@/lib/merchantIcon"
import { useLiveLocation } from "@/lib/useLiveLocation"

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'rgba(255,255,255,.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
})

const s = {
  card: { background: 'var(--s1)', border: '1px solid var(--bdr)', borderRadius: 18, padding: 22, transition: 'all .3s cubic-bezier(.25,.46,.45,.94)' },
  gradC: { background: 'linear-gradient(135deg,#f5c418,#ff6316)' },
  gradCText: { background: 'linear-gradient(135deg,#f5c418,#ff6316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  badge: (c: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: .3,
    ...(c === 'yellow' && { background: 'rgba(245,196,24,.12)', color: '#f5c418', border: '1px solid rgba(245,196,24,.22)' }),
    ...(c === 'green' && { background: 'rgba(31,217,124,.12)', color: '#1fd97c', border: '1px solid rgba(31,217,124,.22)' }),
  })
}

export default function ConsumerProfile() {
  const { user, profile, signOut, updateProfile, fetchProfile } = useAuthStore()
  const { add: addToast } = useToasts()
  const { label: liveLocationLabel } = useLiveLocation()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', location: '' })

  useEffect(() => {
    setForm({
      name: profile?.name || user?.email?.split('@')[0] || '',
      phone: profile?.phone || '',
      location: profile?.location || (liveLocationLabel !== 'Location unavailable' ? liveLocationLabel : ''),
    })
  }, [profile, user?.email, liveLocationLabel])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      } as any)
      await fetchProfile()
      addToast('Profile updated', 'success')
      setEditing(false)
    } catch (error: any) {
      addToast(error?.message || 'Could not update profile', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const stats = [{ n: 23, l: 'Queues Joined' }, { n: '4.1h', l: 'Time Saved' }, { n: 18, l: 'Merchants' }]
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 14px', ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#000', boxShadow: '0 0 0 6px rgba(245,196,24,.15)' }}>
          {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 3 }}>
          {profile?.name || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || "Arjun Sharma"}
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>{profile?.phone || 'No phone set'} - {profile?.location || (liveLocationLabel !== 'Location unavailable' ? liveLocationLabel : 'Location unavailable')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={s.badge('yellow') as React.CSSProperties}>Consumer</span>
          <span style={s.badge('green') as React.CSSProperties}><Ic.Shield /> Verified</span>
        </div>
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          style={{ marginTop: 12, border: '1px solid rgba(245,196,24,.25)', borderRadius: 10, padding: '8px 14px', background: 'rgba(245,196,24,.08)', color: '#f5c418', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Ic.User /> {editing ? 'Close editor' : 'Edit profile'}
        </button>
      </div>

      {editing && (
        <div style={{ ...s.card, marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase' }}>Display Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--bdr)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase' }}>Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--bdr)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', textTransform: 'uppercase' }}>Location (Tap map to change)</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={form.location}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--bdr)', color: '#fff', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', width: '100%', marginBottom: 10 }}
                />
                <MapPicker 
                  onSelect={(lat, lng, label) => setForm(prev => ({ ...prev, location: label || "" }))} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '12px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f5c418,#ff6316)', color: '#000', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(245,196,24,.2)' }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: '12px 12px', borderRadius: 10, border: '1px solid var(--bdr)', background: 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {stats.map(st => (
          <div key={st.l} style={{ ...s.card, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, ...s.gradCText as React.CSSProperties, marginBottom: 4 }}>{st.n}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{st.l}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: 16, marginBottom: 12 }}>Recent History</h3>
      {MERCHANTS.slice(0, 4).map((m, i) => (
        <div key={m.id} style={{ ...s.card, padding: '12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${m.color}20`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{getMerchantIcon(m.cat)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{['Yesterday 2:15PM', 'Last week', '3 days ago', 'This morning'][i]} - Token #{40 + i}</div>
          </div>
          <span style={s.badge('green') as React.CSSProperties}>Served</span>
        </div>
      ))}

      <div style={{ ...s.card, marginTop: 18, padding: '6px' }}>
        {[
          { l: 'Notifications', ic: <Ic.Bell /> },
          { l: 'Privacy & Data', ic: <Ic.Shield /> },
          { l: 'Help & Support', ic: <Ic.Activity /> },
          { l: 'Sign Out', ic: <Ic.LogOut />, d: true },
        ].map(item => (
          <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderRadius: 11, cursor: 'pointer', color: item.d ? '#ff4d6d' : 'var(--t2)', transition: 'all .2s' }}
            className="hover:bg-[#ffffff0a]"
            onClick={() => {
              if (item.l === 'Sign Out') {
                addToast('Signing out...', 'info')
                signOut()
              }
            }}>
            <span style={{ fontSize: 18, display: 'inline-flex', alignItems: 'center' }}>{item.ic}</span>
            <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{item.l}</span>
            <Ic.ChevR />
          </div>
        ))}
      </div>
    </div>
  )
}