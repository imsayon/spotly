import React from 'react';

/**
 * Shared design tokens and style objects from the Spotly Professionalized prototype.
 * Separation of styles from JSX logic helps prevent SWC compilation issues 
 * and maintains consistency across the consumer and merchant apps.
 */

export const THEME = {
  // Semantic tokens are defined by each app's global stylesheet.
  colors: {
    bg: 'var(--page-bg)',
    s1: 'var(--surface)',
    s2: 'var(--surface-raised)',
    s3: 'var(--surface-strong)',
    gold: 'var(--brand)',
    orange: 'var(--brand-strong)',
    emerald: 'var(--success)',
    teal: 'var(--info)',
    red: 'var(--danger)',
    t1: 'var(--text-primary)',
    t2: 'var(--text-secondary)',
    t3: 'var(--text-muted)',
    t4: 'var(--text-subtle)',
    border: 'var(--border)',
    borderStrong: 'var(--border-strong)',
  },

  gradients: {
    consumer: 'var(--brand)',
    merchant: 'var(--brand)',
    consumerText: {
      color: 'var(--brand-strong)',
    } as React.CSSProperties,
    merchantText: {
      color: 'var(--brand-strong)',
    } as React.CSSProperties,
  },

  // Shared Style Objects
  styles: {
    glass: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    } as React.CSSProperties,

    glassStrong: {
      background: 'var(--surface-raised)',
      border: '1px solid var(--border-strong)',
    } as React.CSSProperties,

    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 22,
      transition: 'border-color .18s ease, background .18s ease',
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
    background: 'var(--surface-raised)',
    color: type === 'consumer' ? 'var(--brand-strong)' : 'var(--success)',
    border: '1px solid var(--border-strong)',
  } as React.CSSProperties),
};
