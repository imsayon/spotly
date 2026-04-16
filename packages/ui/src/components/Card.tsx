"use client"

import React from 'react';
import { cn } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  glowColor?: 'emerald' | 'golden' | 'none';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glowColor = 'none', hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/10 p-6 transition-all duration-300',
          variant === 'glass' ? 'bg-white/5 backdrop-blur-xl' : 'bg-zinc-900/80',
          {
            'hover:border-[#10B981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1': glowColor === 'emerald' && hoverEffect,
            'hover:border-[#F5A623]/50 hover:shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:-translate-y-1': glowColor === 'golden' && hoverEffect,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
