"use client"

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'consumer' | 'merchant';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex min-h-11 items-center justify-center rounded-lg border font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
          {
            'border-[var(--border-strong)] bg-[var(--brand)] text-[var(--on-brand)] hover:brightness-95': variant === 'primary' || variant === 'consumer' || variant === 'merchant',
            'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]': variant === 'secondary',
            'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]': variant === 'ghost',
            'border-[var(--danger)] bg-transparent text-[var(--danger)] hover:bg-[var(--danger-soft)]': variant === 'destructive',
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-5': size === 'md',
            'h-14 px-7 text-lg': size === 'lg',
            'h-11 w-11 px-0': size === 'icon',
            'pointer-events-none': isLoading,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
