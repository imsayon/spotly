'use client';

import { useState } from 'react';
import { Ic } from '@spotly/ui';
import { useAuthStore } from '@/store/auth.store';

type AuthStep = 'options' | 'email' | 'otp';

interface ConsumerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ConsumerAuthModal({ isOpen, onClose, title = 'Elevate your experience' }: ConsumerAuthModalProps) {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const sendEmailOtp = useAuthStore((state) => state.sendEmailOtp);
  const verifyEmailOtp = useAuthStore((state) => state.verifyEmailOtp);

  const [step, setStep] = useState<AuthStep>('options');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      onClose();
    } catch (authError: any) {
      setError(authError?.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendEmailOtp(email.trim());
      setStep('otp');
    } catch (authError: any) {
      setError(authError?.message || 'Could not send verification code.');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verifyEmailOtp(email.trim(), code.trim());
      onClose();
    } catch (authError: any) {
      setError(authError?.message || 'Invalid verification code.');
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    setLoading(false);
    if (step === 'otp') {
      setStep('email');
      return;
    }
    setStep('options');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', cursor: 'pointer' }} onClick={onClose} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#121218', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: '44px 36px', boxShadow: '0 40px 80px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,.5)', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>

        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(245,196,24,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
            ⏱
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: -1.2, lineHeight: 1 }}>{title}</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.5 }}>
            Choose Google or verify your email with a one-time code to continue.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 14, color: '#ff4d6d', fontSize: 13, fontWeight: 600, textAlign: 'center', animation: 'shake 0.5s' }}>
            {error}
          </div>
        )}

        {step === 'options' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'var(--font-sans)', outline: 'none' }}
              className="hover:bg-[rgba(255,255,255,.07)] active:scale-[0.98]"
            >
              {loading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Ic.Google /> Continue with Google</>}
            </button>

            <button
              onClick={() => {
                setError('');
                setStep('email');
              }}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(245,196,24,.09)', color: '#f5c418', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'var(--font-sans)' }}
            >
              Continue with Email OTP
            </button>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 15 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={goBack} style={{ flex: 1, padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Back
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '15px 16px', borderRadius: 14, border: 'none', background: '#f5c418', color: '#000', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyCode} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the 6-digit code"
                style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 15, letterSpacing: 2 }}
              />
              <p style={{ marginTop: 8, color: 'rgba(255,255,255,.35)', fontSize: 12, lineHeight: 1.5 }}>
                We sent a verification code to {email}. Enter it here to continue.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={goBack} style={{ flex: 1, padding: '15px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Back
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '15px 16px', borderRadius: 14, border: 'none', background: '#f5c418', color: '#000', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
          By continuing, you agree to Spotly's <br />
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>

      <style>{`\n        @keyframes spin { to { transform: rotate(360deg); } }\n        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }\n      `}</style>
    </div>
  );
}