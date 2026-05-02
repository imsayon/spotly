"use client"

import React, { useState, useEffect } from "react"
import { Ic, useToasts, THEME } from "@spotly/ui"
import { useAuthStore } from "@/store/auth.store"
import api from "@/lib/api"
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false,
  loading: () => <div style={{ height: '300px', background: 'rgba(255,255,255,.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
})

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

export default function MerchantBusiness() {
  const { add: addToast } = useToasts()
  const { user, merchantProfile, fetchMerchantProfile } = useAuthStore()

  // Declare profile early so handleUpdate closure captures correct value
  const profile = merchantProfile
  
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    contactEmail: '',
    website: '',
    address: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    foundingYear: '',
    gstNumber: ''
  })

  useEffect(() => {
    if (merchantProfile) {
      setForm({
        name: merchantProfile.name || '',
        category: merchantProfile.category || '',
        description: merchantProfile.description || '',
        phone: merchantProfile.phone || '',
        contactEmail: merchantProfile.contactEmail || '',
        website: merchantProfile.website || '',
        address: merchantProfile.address || '',
        lat: merchantProfile.lat,
        lng: merchantProfile.lng,
        foundingYear: merchantProfile.foundingYear?.toString() || '',
        gstNumber: merchantProfile.gstNumber || ''
      })
    }
  }, [merchantProfile])

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const data = {
        ...form,
        foundingYear: form.foundingYear ? parseInt(form.foundingYear) : undefined,
        lat: form.lat,
        lng: form.lng
      }

      const res = profile 
        ? await api.patch('/merchant/me', data)
        : await api.post('/merchant', data)
      
      if (res.data.success) {
        await fetchMerchantProfile()
        addToast(profile ? 'Business profile updated!' : 'Business profile created!', 'success')
      }
    } catch (err: any) {
      // err may be a plain Error (after axios interceptor) or an axios error
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile'
      console.error('[BusinessProfile] Update failed:', err)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ padding: '36px 36px 40px', maxWidth: 820 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 30, fontWeight: 900, marginBottom: 4 }}>Business Profile</h1>
          <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 14 }}>Manage your brand identity and legal credentials</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: 'rgba(31,217,124,.12)', border: '1px solid rgba(31,217,124,.2)', color: '#1fd97c', fontSize: 12, fontWeight: 800 }}>
          <Ic.Shield /> {(profile as any)?.verified ? 'Verified Merchant' : 'Pending Verification'}
        </div>
      </div>

      {/* OVERVIEW CARD */}
      <div style={{ ...s.card, padding: '28px', marginBottom: 22, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,.02)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(31,217,124,.05)', filter: 'blur(32px)' }} />
        
        <div style={{ width: 84, height: 84, borderRadius: 20, ...s.gradM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0, boxShadow: '0 12px 30px rgba(31,217,124,.25)' }}>
          {profile?.logoUrl ? <img src={profile.logoUrl} alt="Brand Logo" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} /> : '🏪'}
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 900 }}>{profile?.name || "Register Your Business"}</h2>
            <span style={{ ...s.badge('merchant'), fontSize: 10, background: 'rgba(31,217,124,.15)' } as React.CSSProperties}>✓ Active</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, marginBottom: 14 }}>
            {profile?.description || (profile ? "Tell us more about your business..." : "Complete your profile to start managing outlets.")}
          </p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,.25)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Store />{(profile as any)?.outlets?.length || 0} Outlets</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Star />4.8 Rating</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ic.Users />New Partner</span>
          </div>
        </div>
        <button style={{ ...s.btnGhost, gap: 8, fontSize: 13, padding: '10px 18px', borderRadius: 12 }} onClick={() => addToast('Media upload coming soon', 'info')}>
          <Ic.Upload />Update Brand Assets
        </button>
      </div>

      {/* FORM SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="animate-in zoom-in-95 duration-300" style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Ic.Building />Business Details</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Legal Entity Name</label>
            <input 
              style={s.input} 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Acme Corp Pvt Ltd"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>GST Registration</label>
            <input 
              style={s.input} 
              value={form.gstNumber} 
              onChange={e => setForm({...form, gstNumber: e.target.value})}
              placeholder="29AAAAA0000A1Z5"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Business Category</label>
            <input 
              style={s.input} 
              value={form.category} 
              onChange={e => setForm({...form, category: e.target.value})}
              placeholder="e.g. Food & Beverage"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Founding Year</label>
            <input 
              style={s.input} 
              value={form.foundingYear} 
              onChange={e => setForm({...form, foundingYear: e.target.value})}
              placeholder="YYYY"
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Short Description</label>
            <input 
              style={s.input} 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Describe your brand..."
            />
          </div>
        </div>
        
        <div className="animate-in zoom-in-95 duration-300 delay-75" style={{ ...s.card, padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Ic.User />Contact Information</h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Primary Business Email</label>
            <input 
              style={s.input} 
              value={form.contactEmail} 
              onChange={e => setForm({...form, contactEmail: e.target.value})}
              placeholder="contact@business.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Support Phone</label>
            <input 
              style={s.input} 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="+91 00000 00000"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Business Website</label>
            <input 
              style={s.input} 
              value={form.website} 
              onChange={e => setForm({...form, website: e.target.value})}
              placeholder="https://business.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Corporate HQ</label>
            <input 
              style={s.input} 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})}
              placeholder="City, Region"
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Pin exact location</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <MapPicker 
                  lat={form.lat} 
                  lng={form.lng} 
                  onSelect={(lat, lng) => setForm({...form, lat, lng})} 
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                        addToast('Location detected!', 'success');
                      },
                      () => addToast('Failed to detect location', 'error')
                    );
                  }
                }}
                style={{ ...s.btnGhost, padding: '0 12px', height: '44px', borderRadius: 12, flexShrink: 0 }}
                title="Detect current location"
              >
                <Ic.Activity />
              </button>
            </div>
            {form.lat && (
              <div style={{ fontSize: 10, color: 'rgba(31,217,124,.6)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                📍 {form.lat.toFixed(6)}, {form.lng?.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button 
          style={{ ...s.btnM, gap: 8, padding: '14px 32px', fontSize: 15, opacity: loading ? 0.7 : 1 }} 
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? <span className="animate-spin">⌛</span> : <Ic.Check />}
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </div>
  )
}
