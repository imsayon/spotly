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
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] hover:scale-[1.02]',
          {
            'bg-zinc-100 text-zinc-900 hover:bg-white/90': variant === 'primary',
            'bg-zinc-800 text-zinc-100 hover:bg-zinc-700': variant === 'secondary',
            'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50': variant === 'ghost',
            'bg-red-500/10 text-red-500 hover:bg-red-500/20': variant === 'destructive',
            'bg-[#F5A623] text-black hover:bg-[#F5A623]/90': variant === 'consumer',
            'bg-[#10B981] text-white hover:bg-[#10B981]/90': variant === 'merchant',
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-8': size === 'md',
            'h-14 px-10 text-lg': size === 'lg',
            'h-11 w-11': size === 'icon',
            'opacity-50 pointer-events-none': isLoading || props.disabled,
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
