"use client"

import { useState, type FormEvent } from 'react';
import { Ic } from './Icons';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleAuth: () => Promise<void>;
  onEmailAuth?: (email: string, password: string, mode: 'sign-in' | 'sign-up', name?: string) => Promise<void | string>;
  isLoading?: boolean;
  title?: string;
  variant?: 'consumer' | 'merchant';
}

export function AuthModal({ isOpen, onClose, onGoogleAuth, onEmailAuth, isLoading: externalLoading, title = 'Welcome to Spotly' }: AuthModalProps) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const loading = externalLoading || internalLoading;

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

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!onEmailAuth) return;
    setError('');
    setNotice('');
    setInternalLoading(true);
    try {
      const message = await onEmailAuth(email.trim(), password, mode, name.trim() || undefined);
      if (message) setNotice(message);
    } catch (err: any) {
      setError(err?.message || 'Email authentication failed. Please try again.');
    } finally {
      setInternalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div className="auth-backdrop" onClick={onClose} />
      
      {/* Modal */}
      <div className="auth-dialog">
        {/* Close button */}
        <button className="auth-close" aria-label="Close authentication" onClick={onClose}>✕</button>

        {/* Accent glow */}
        <div className="auth-accent" />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="auth-icon">⏱</div>
          <h2>{title}</h2>
          <p>Sign in with Google or email to continue to Spotly.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error" role="alert">{error}</div>
        )}

        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {/* Google Button */}
        <button 
          onClick={handleGoogleAuth} 
          disabled={loading} 
          className="auth-provider"
        >
          {loading ? (
            <div className="auth-spinner" />
          ) : (
            <>
              <Ic.Google />
              Continue with Google
            </>
          )}
        </button>

        {onEmailAuth && (
          <>
            <div className="auth-divider">
              <span />
              or email
              <span />
            </div>
            <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: 10 }}>
              {mode === 'sign-up' && <input className="auth-field" aria-label="Full name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />}
              <input className="auth-field" aria-label="Email address" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" />
              <input className="auth-field" aria-label="Password" required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? 'Please wait...' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); }} disabled={loading} className="auth-switch">
              {mode === 'sign-up' ? 'Already have an account? Sign in' : 'New to Spotly? Create an account'}
            </button>
          </>
        )}

        <p className="auth-legal">
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
