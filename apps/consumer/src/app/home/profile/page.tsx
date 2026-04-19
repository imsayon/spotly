"use client"

import React, { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"
import { Ic, useToasts } from "@spotly/ui"
import { MERCHANTS } from "@spotly/ui/src/data/mock"
import { getMerchantIcon } from "@/lib/merchantIcon"

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
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  })

  useEffect(() => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
    })
  }, [profile?.name, profile?.phone, profile?.location])

  const onSave = async () => {
    try {
      setSaving(true)
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      } as any)
      await fetchProfile()
      setIsEditing(false)
      addToast('Profile updated', 'success')
    } catch {
      addToast('Could not update profile', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const stats = [{ n: 23, l: 'Queues Joined' }, { n: '4.1h', l: 'Time Saved' }, { n: 18, l: 'Merchants' }]
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', margin: '0 auto 14px', ...s.gradC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#000', boxShadow: '0 0 0 6px rgba(245,196,24,.15)' }}>
          {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 900, marginBottom: 3 }}>
          {profile?.name || user?.email?.split('@')[0] || "Arjun Sharma"}
        </h2>
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>{profile?.phone || 'No phone'} · {profile?.location || "Unknown location"}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          <span style={s.badge('yellow') as React.CSSProperties}>Consumer</span>
          <span style={{ ...s.badge('green') as React.CSSProperties, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Ic.Check size={12} /> Verified</span>
        </div>
      </div>

      <div style={{ ...s.card, marginBottom: 22, padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 800, fontFamily: 'var(--font-sans)', fontSize: 15 }}>Profile Details</h3>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} style={{ background: 'rgba(245,196,24,.15)', border: '1px solid rgba(245,196,24,.25)', color: '#f5c418', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '7px 10px', cursor: 'pointer' }}>
              Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--bdr)', color: 'var(--t2)', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '7px 10px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button disabled={saving} onClick={onSave} style={{ background: 'rgba(31,217,124,.2)', border: '1px solid rgba(31,217,124,.35)', color: '#1fd97c', borderRadius: 10, fontSize: 12, fontWeight: 700, padding: '7px 10px', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <input
            disabled={!isEditing}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }}
          />
          <input
            disabled={!isEditing}
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Phone number"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }}
          />
          <input
            disabled={!isEditing}
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            placeholder="Location"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--bdr)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }}
          />
        </div>
      </div>

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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,196,24,.12)', color: '#f5c418', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{getMerchantIcon(m.cat || m.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{['Yesterday 2:15PM', 'Last week', '3 days ago', 'This morning'][i]} · Token #{40 + i}</div>
          </div>
          <span style={s.badge('green') as React.CSSProperties}>Served</span>
        </div>
      ))}

      <div style={{ ...s.card, marginTop: 18, padding: '6px' }}>
        {[
          { l: 'Notifications', ic: <Ic.Bell /> },
          { l: 'Privacy & Data', ic: <Ic.Shield /> },
          { l: 'Help & Support', ic: <Ic.Settings /> },
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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{item.ic}</span>
            <span style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{item.l}</span>
            <Ic.ChevR />
          </div>
        ))}
      </div>
    </div>
  )
}
