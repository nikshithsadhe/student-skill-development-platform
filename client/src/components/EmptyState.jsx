import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There is currently no data to display for this section.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface-card border border-dashed border-border rounded-2xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-surface-lighter border border-border text-text-muted flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-primary-light/70" />
      </div>
      <h3 className="text-base font-bold text-text-heading mb-1.5">{title}</h3>
      <p className="text-xs text-text-muted max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
