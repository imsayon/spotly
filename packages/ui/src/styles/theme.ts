import React from 'react';

/**
 * Shared design tokens and style objects from the Spotly Professionalized prototype.
 * Separation of styles from JSX logic helps prevent SWC compilation issues 
 * and maintains consistency across the consumer and merchant apps.
 */

export const THEME = {
  // Common Colors & Gradients
  colors: {
    bg: '#050509',
    s1: '#0c0c12',
    s2: '#12121a',
    s3: '#1a1a24',
    gold: '#f5c418',
    orange: '#ff6316',
    emerald: '#1fd97c',
    teal: '#00cfff',
    red: '#ff4d6d',
    t1: '#fff',
    t2: 'rgba(255,255,255,.6)',
    t3: 'rgba(255,255,255,.35)',
    t4: 'rgba(255,255,255,.15)',
    border: 'rgba(255,255,255,.06)',
    borderStrong: 'rgba(255,255,255,.12)',
  },

  gradients: {
    consumer: 'linear-gradient(135deg,#f5c418 0%,#ff6316 100%)',
    merchant: 'linear-gradient(135deg,#1fd97c,#0ea860)',
    consumerText: {
      background: 'linear-gradient(135deg,#f5c418,#ff6316)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } as React.CSSProperties,
    merchantText: {
      background: 'linear-gradient(135deg,#1fd97c,#0ea860)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } as React.CSSProperties,
  },

  // Shared Style Objects
  styles: {
    glass: {
      background: 'rgba(255,255,255,.035)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,.06)',
    } as React.CSSProperties,

    glassStrong: {
      background: 'rgba(255,255,255,.07)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      border: '1px solid rgba(255,255,255,.12)',
    } as React.CSSProperties,

    card: {
      background: '#0c0c12',
      border: '1px solid rgba(255,255,255,.06)',
      borderRadius: 18,
      padding: 22,
      transition: 'all .3s cubic-bezier(.25,.46,.45,.94)',
    } as React.CSSProperties,
  },

  // Dynamic style helpers
  badge: (type: 'consumer' | 'merchant') => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    background: type === 'consumer' ? 'rgba(245,196,24,.12)' : 'rgba(31,217,124,.12)',
    color: type === 'consumer' ? '#f5c418' : '#1fd97c',
    border: `1px solid ${type === 'consumer' ? 'rgba(245,196,24,.22)' : 'rgba(31,217,124,.22)'}`,
  } as React.CSSProperties),
};
