"use client"

import { useState } from 'react';
import { Ic } from './Icons';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleAuth: () => Promise<void>;
  isLoading?: boolean;
  title?: string;
  variant?: 'consumer' | 'merchant';
}

export function AuthModal({ isOpen, onClose, onGoogleAuth, isLoading: externalLoading, title = 'Welcome to Spotly', variant = 'consumer' }: AuthModalProps) {
  const [error, setError] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading || internalLoading;

  const accent = variant === 'merchant' ? '#1fd97c' : '#f5c418';
  const accentHex = variant === 'merchant' ? 'rgba(31,217,124,0.15)' : 'rgba(245,196,24,0.15)';

  const handleGoogleAuth = async () => {
    setError('');
    setInternalLoading(true);
    try {
      await onGoogleAuth();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
      setInternalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', cursor: 'pointer' }} onClick={onClose} />
      
      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: '#121218', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: '48px 36px', boxShadow: '0 40px 80px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,.5)', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>

        {/* Accent glow */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: accentHex, filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>⏱</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: -1.2, lineHeight: 1 }}>{title}</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.5 }}>Sign in with your Google account to continue to Spotly.</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 14, color: '#ff4d6d', fontSize: 13, fontWeight: 600, textAlign: 'center', animation: 'shake 0.5s' }}>{error}</div>
        )}

        {/* Google Button */}
        <button 
          onClick={handleGoogleAuth} 
          disabled={loading} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'var(--font-sans)', outline: 'none' }}
          className="hover:bg-[rgba(255,255,255,.07)] active:scale-[0.98]"
        >
          {loading ? (
            <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <Ic.Google />
              Continue with Google
            </>
          )}
        </button>

        <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
          By continuing, you agree to Spotly's <br /> 
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
}
