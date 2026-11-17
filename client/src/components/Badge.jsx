import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variants = {
    default: 'bg-surface-lighter text-text-muted border-border',
    purple: 'bg-primary/15 text-primary-light border-primary/30',
    blue: 'bg-accent-blue/15 text-blue-400 border-accent-blue/30',
    success: 'bg-accent-emerald/15 text-emerald-400 border-accent-emerald/30',
    warning: 'bg-accent-amber/15 text-amber-400 border-accent-amber/30',
    danger: 'bg-accent-rose/15 text-rose-400 border-accent-rose/30',
    cyan: 'bg-accent-cyan/15 text-cyan-400 border-accent-cyan/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const dotColors = {
    default: 'bg-text-dim',
    purple: 'bg-primary-light',
    blue: 'bg-blue-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    cyan: 'bg-cyan-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variants[variant] || variants.default} ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  );
}
