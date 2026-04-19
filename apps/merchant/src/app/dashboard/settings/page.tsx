"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/auth.store"
import { useQueueStore } from "@/store/queue.store"
import { useToasts, THEME } from "@spotly/ui"

// ─── Minimal QR encoder (no extra deps) ──────────────────────────────────────
// We use a free public QR API (image tag, no JS lib needed)
function QRCode({ data, size = 160 }: { data: string; size?: number }) {
  const encoded = encodeURIComponent(data)
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=${size}x${size}&bgcolor=0f0f14&color=1fd97c&qzone=1`}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 12, display: 'block' }}
    />
  )
}

// ─── Input component ──────────────────────────────────────────────────────────

function SettingsInput({
  label, value, onChange, type = 'text', placeholder, readOnly,
}: {
  label: string
  value: string
  onChange?: (val: string) => void
  type?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)',
        textTransform: 'uppercase', letterSpacing: 1.2,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px', borderRadius: 12,
          background: readOnly ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.05)',
          border: `1px solid ${readOnly ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.12)'}`,
          color: readOnly ? 'rgba(255,255,255,.45)' : '#fff',
          fontSize: 14, outline: 'none',
          fontFamily: 'var(--font-sans)',
          cursor: readOnly ? 'default' : 'text',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.025)',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 20,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}>
      <h2 style={{
        fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.4)',
        textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
        paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { merchantProfile } = useAuthStore()
  const { add: addToast } = useToasts()
  const store = useQueueStore()

  // Local edit state (display-only — no PATCH endpoint in API contract)
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [address, setAddress]   = useState('')
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('21:00')
  const [copied, setCopied]     = useState(false)

  // Selected outlet for share link
  const outlet = store.outlets[0] ?? null
  const shareUrl = outlet
    ? `${typeof window !== 'undefined' ? window.location.origin.replace(':3002', ':3000') : 'http://localhost:3000'}?outlet=${outlet.id}`
    : ''

  // Fill fields from profile
  useEffect(() => {
    if (merchantProfile) {
      setName(merchantProfile.name ?? '')
      setPhone((merchantProfile as any).phone ?? '')
      setAddress((merchantProfile as any).address ?? '')
    }
  }, [merchantProfile])

  // Fetch outlets for share link
  useEffect(() => {
    if (merchantProfile?.id && store.outlets.length === 0) {
      store.fetchOutlets(merchantProfile.id)
    }
  }, [merchantProfile?.id])

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      addToast('Share link copied!', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      addToast('Failed to copy', 'error')
    }
  }

  const handleSave = () => {
    // No PATCH endpoint in API contract — local display only
    addToast('Settings saved locally (API sync pending endpoint confirmation)', 'info')
  }

  const s = THEME.styles

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '36px 36px 56px', maxWidth: 680 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 14 }}>
          Configure your workspace and outlet preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Queue Status ── */}
        <Section title="Queue Status">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>
                Open / Closed Toggle
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', lineHeight: 1.5 }}>
                When open, consumers can join your queue. When closed, new joins are blocked.
                {' '}<span style={{ color: '#f5c418', fontWeight: 600 }}>API persistence pending endpoint confirmation.</span>
              </div>
            </div>
            <button
              onClick={store.toggleOpen}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 24px', borderRadius: 99, flexShrink: 0,
                background: store.isOpen ? 'rgba(31,217,124,.1)' : 'rgba(255,77,109,.1)',
                border: `1px solid ${store.isOpen ? 'rgba(31,217,124,.3)' : 'rgba(255,77,109,.3)'}`,
                color: store.isOpen ? '#1fd97c' : '#ff4d6d',
                fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all .3s',
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: store.isOpen ? '#1fd97c' : '#ff4d6d',
                boxShadow: store.isOpen ? '0 0 8px rgba(31,217,124,.6)' : '0 0 8px rgba(255,77,109,.6)',
                flexShrink: 0,
              }} />
              {store.isOpen ? 'OPEN' : 'CLOSED'}
            </button>
          </div>
        </Section>

        {/* ── Business Info ── */}
        <Section title="Business Information">
          <SettingsInput label="Business Name" value={name} onChange={setName} placeholder="Your business name" />
          <SettingsInput label="Phone" value={phone} onChange={setPhone} type="tel" placeholder="+91 98765 43210" />
          <SettingsInput label="Address" value={address} onChange={setAddress} placeholder="123 Main Street" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Opening Time
              </label>
              <input
                type="time"
                value={openTime}
                onChange={e => setOpenTime(e.target.value)}
                style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.12)',
                  color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Closing Time
              </label>
              <input
                type="time"
                value={closeTime}
                onChange={e => setCloseTime(e.target.value)}
                style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.12)',
                  color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: '13px 28px', borderRadius: 12,
              background: THEME.gradients.merchant,
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', alignSelf: 'flex-start',
            }}
          >
            Save Changes
          </button>
        </Section>

        {/* ── Share & QR ── */}
        <Section title="Consumer Share Link">
          {outlet ? (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
                Share this link or QR code with customers so they can find and join your queue instantly.
              </div>

              {/* Link + copy */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(255,255,255,.08)',
                  fontSize: 13, color: 'rgba(255,255,255,.5)',
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {shareUrl}
                </div>
                <button
                  onClick={copyShareLink}
                  style={{
                    padding: '12px 20px', borderRadius: 12, flexShrink: 0,
                    background: copied ? 'rgba(31,217,124,.15)' : 'rgba(255,255,255,.06)',
                    border: `1px solid ${copied ? 'rgba(31,217,124,.3)' : 'rgba(255,255,255,.12)'}`,
                    color: copied ? '#1fd97c' : '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              {/* QR code */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                <div style={{
                  padding: 12, borderRadius: 16,
                  background: '#0f0f14',
                  border: '1px solid rgba(255,255,255,.08)',
                  display: 'inline-block',
                }}>
                  <QRCode data={shareUrl} size={140} />
                </div>
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 6 }}>
                    {outlet.name}
                  </div>
                  {outlet.address && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>
                      📍 {outlet.address}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', lineHeight: 1.6 }}>
                    Customers can scan this QR code to open the consumer app pre-loaded with your outlet.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'rgba(255,255,255,.25)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>No outlet found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Complete onboarding to get your share link.</div>
            </div>
          )}
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <SettingsInput
            label="Merchant ID"
            value={merchantProfile?.id ?? '—'}
            readOnly
          />
          <SettingsInput
            label="Category"
            value={merchantProfile?.category ?? '—'}
            readOnly
          />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', lineHeight: 1.6 }}>
            Category changes require re-onboarding. Contact support for major business type changes.
          </div>
        </Section>

      </div>

      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.35); }
      `}</style>
    </motion.div>
  )
}
