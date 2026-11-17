import React from 'react';

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtext,
  color = 'purple',
  className = '',
}) {
  const colorMap = {
    purple: {
      bg: 'bg-primary/10',
      text: 'text-primary-light',
      border: 'border-primary/20',
    },
    blue: {
      bg: 'bg-accent-blue/10',
      text: 'text-blue-400',
      border: 'border-accent-blue/20',
    },
    emerald: {
      bg: 'bg-accent-emerald/10',
      text: 'text-emerald-400',
      border: 'border-accent-emerald/20',
    },
    amber: {
      bg: 'bg-accent-amber/10',
      text: 'text-amber-400',
      border: 'border-accent-amber/20',
    },
    rose: {
      bg: 'bg-accent-rose/10',
      text: 'text-rose-400',
      border: 'border-accent-rose/20',
    },
  };

  const scheme = colorMap[color] || colorMap.purple;

  return (
    <div className={`bg-surface border border-border rounded-2xl p-5 shadow-lg relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-heading tracking-tight">
            {value !== undefined && value !== null ? value : 0}
          </h3>
          {subtext && <p className="text-[11px] text-text-dim mt-1.5">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center border ${scheme.border} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
