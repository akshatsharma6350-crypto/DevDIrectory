import { useState } from 'react';

const ICONS = { error: '⚠️', success: '✅', info: 'ℹ️', warning: '🔔' };

/** Dismissible alert. Pass onRetry to render a "Retry" button (network errors). */
export default function AlertBanner({ variant = 'error', title, children, onRetry, onDismiss }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const dismiss = () => {
    setOpen(false);
    onDismiss?.();
  };

  return (
    <div className={`alert alert-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <span className="alert-icon" aria-hidden="true">{ICONS[variant]}</span>
      <div className="alert-body">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      <div className="alert-actions">
        {onRetry && <button type="button" className="btn btn-sm btn-ghost" onClick={onRetry}>Retry</button>}
        <button type="button" className="alert-close" aria-label="Dismiss" onClick={dismiss}>×</button>
      </div>
    </div>
  );
}
