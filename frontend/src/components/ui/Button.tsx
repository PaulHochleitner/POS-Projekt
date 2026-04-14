import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[#4ade80] text-[#0f172a] hover:bg-[#22c55e]',
  secondary: 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569] hover:text-white',
  danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
};

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary', size = 'md', children, className = '', disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
