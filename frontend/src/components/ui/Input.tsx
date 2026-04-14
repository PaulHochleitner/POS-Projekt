import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-xs text-[#94a3b8] mb-1">{label}</label>}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
