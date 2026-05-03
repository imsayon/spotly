'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '@spotly/ui';
import { useAuthStore } from '@/store/auth.store';

type AuthTab = 'email' | 'phone';
type AuthMode = 'sign-in' | 'sign-up';
type PhoneStep = 'input' | 'verify';

interface ConsumerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '14px 15px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.1)',
  background: 'rgba(255,255,255,.04)',
  color: '#fff',
  outline: 'none',
  fontSize: 14,
  transition: 'border-color .2s',
  fontFamily: 'var(--font-sans)',
};

export function ConsumerAuthModal({ isOpen, onClose, title = 'Elevate your experience' }: ConsumerAuthModalProps) {
  const router = useRouter();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [tab, setTab] = useState<AuthTab>('email');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
      router.replace('/home');
    } catch (authError: any) {
      setError(authError?.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const normalizedEmail = email.trim();
      if (mode === 'sign-up') {
        await signUpWithEmail(normalizedEmail, password, name);
      } else {
        await signInWithEmail(normalizedEmail, password);
      }
      onClose();
      router.replace('/home');
    } catch (authError: any) {
      setError(authError?.message || 'Email authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Ensure phone is in E.164 format
      let normalizedPhone = phone.trim();
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+91' + normalizedPhone; // Default to India
      }
      await sendOtp(normalizedPhone);
      setPhone(normalizedPhone);
      setPhoneStep('verify');
    } catch (authError: any) {
      setError(authError?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, otpCode.trim());
      onClose();
      router.replace('/home');
    } catch (authError: any) {
      setError(authError?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError('');
  };

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setError('');
    setPhoneStep('input');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)', cursor: 'pointer' }} onClick={onClose} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#121218', border: '1px solid rgba(255,255,255,.1)', borderRadius: 28, padding: '44px 36px', boxShadow: '0 40px 80px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'rgba(255,255,255,.5)', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          <Ic.X />
        </button>

        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(245,196,24,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f5c418' }}>
            <Ic.Clock />
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: -1.2, lineHeight: 1 }}>{title}</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.5 }}>
            Sign in with Google, email, or phone to continue to Spotly.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 14, color: '#ff4d6d', fontSize: 13, fontWeight: 600, textAlign: 'center', animation: 'shake 0.5s' }}>
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'var(--font-sans)', outline: 'none' }}
          className="hover:bg-[rgba(255,255,255,.07)] active:scale-[0.98]"
        >
          {loading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Ic.Google /> Continue with Google</>}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          <span style={{ color: 'rgba(255,255,255,.28)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>

        {/* Tab Switcher: Email / Phone */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 3 }}>
          {(['email', 'phone'] as AuthTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: tab === t ? 'rgba(245,196,24,.12)' : 'transparent',
                color: tab === t ? '#f5c418' : 'rgba(255,255,255,.4)',
                fontWeight: 800,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {t === 'email' ? <Ic.Mail /> : <Ic.Smartphone />}
              {t === 'email' ? 'Email' : 'Phone'}
            </button>
          ))}
        </div>

        {/* EMAIL TAB */}
        {tab === 'email' && (
          <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: 12 }}>
            {mode === 'sign-up' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                style={INPUT_STYLE}
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={INPUT_STYLE}
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={INPUT_STYLE}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '15px 16px', borderRadius: 15, border: 'none', background: '#f5c418', color: '#000', fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              {loading ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        )}

        {/* PHONE TAB */}
        {tab === 'phone' && phoneStep === 'input' && (
          <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', fontSize: 14, fontWeight: 700, pointerEvents: 'none' }}>
                +91
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                style={{ ...INPUT_STYLE, paddingLeft: 50 }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '15px 16px', borderRadius: 15, border: 'none', background: '#f5c418', color: '#000', fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <Ic.Send /> Send Verification Code
                </>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
              We&apos;ll send a 6-digit code to your phone via SMS.
            </p>
          </form>
        )}

        {tab === 'phone' && phoneStep === 'verify' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 12 }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                Code sent to <span style={{ color: '#f5c418', fontWeight: 700 }}>{phone}</span>
              </p>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              style={{ ...INPUT_STYLE, textAlign: 'center', fontSize: 20, letterSpacing: 8, fontWeight: 800 }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              style={{
                width: '100%',
                padding: '15px 16px',
                borderRadius: 15,
                border: 'none',
                background: otpCode.length === 6 ? '#f5c418' : 'rgba(245,196,24,.3)',
                color: '#000',
                fontWeight: 900,
                fontSize: 15,
                cursor: loading || otpCode.length < 6 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all .2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>
                  <Ic.Check /> Verify & Sign In
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setPhoneStep('input'); setOtpCode(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Change number
            </button>
          </form>
        )}

        {/* Toggle sign-in / sign-up (email tab only) */}
        {tab === 'email' && (
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
            style={{ width: '100%', marginTop: 14, background: 'transparent', border: 'none', color: 'rgba(255,255,255,.52)', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            {mode === 'sign-up' ? 'Already have an account? Sign in' : 'New to Spotly? Create an account'}
          </button>
        )}

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
          By continuing, you agree to Spotly&apos;s <br />
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>

      <style>{`\n        @keyframes spin { to { transform: rotate(360deg); } }\n        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }\n      `}</style>
    </div>
  );
}
