import React from 'react';
import { THEME } from '@spotly/ui';

export const s = {
  ...THEME.styles,
  btnC: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 26px',
    borderRadius: 12,
    background: THEME.gradients.consumer,
    color: '#000',
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

  gradC: { background: THEME.gradients.consumer } as React.CSSProperties,
  gradCText: THEME.gradients.consumerText,
  badge: THEME.badge,
};
