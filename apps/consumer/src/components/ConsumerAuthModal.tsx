'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '@spotly/ui';
import { useAuthStore } from '@/store/auth.store';

type AuthMode = 'sign-in' | 'sign-up';

interface ConsumerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ConsumerAuthModal({ isOpen, onClose, title = 'Elevate your experience' }: ConsumerAuthModalProps) {
  const router = useRouter();
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithEmail = useAuthStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAuthStore((state) => state.signUpWithEmail);

  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const switchMode = () => {
    setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError('');
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
            Sign in with Google or use your email to continue to Spotly.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 14, color: '#ff4d6d', fontSize: 13, fontWeight: 600, textAlign: 'center', animation: 'shake 0.5s' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', fontFamily: 'var(--font-sans)', outline: 'none' }}
          className="hover:bg-[rgba(255,255,255,.07)] active:scale-[0.98]"
        >
          {loading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Ic.Google /> Continue with Google</>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          <span style={{ color: 'rgba(255,255,255,.28)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: 12 }}>
          {mode === 'sign-up' && (
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              style={{ width: '100%', padding: '14px 15px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 14 }}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            style={{ width: '100%', padding: '14px 15px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 14 }}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            style={{ width: '100%', padding: '14px 15px', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)', color: '#fff', outline: 'none', fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '15px 16px', borderRadius: 15, border: 'none', background: '#f5c418', color: '#000', fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            {loading ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          disabled={loading}
          style={{ width: '100%', marginTop: 14, background: 'transparent', border: 'none', color: 'rgba(255,255,255,.52)', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          {mode === 'sign-up' ? 'Already have an account? Sign in' : 'New to Spotly? Create an account'}
        </button>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
          By continuing, you agree to Spotly&apos;s <br />
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>

      <style>{`\n        @keyframes spin { to { transform: rotate(360deg); } }\n        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }\n      `}</style>
    </div>
  );
}
