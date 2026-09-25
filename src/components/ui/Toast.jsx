import React from 'react';
import { useApp } from '../../context/AppContext';

export const ToastContainer = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast show"
          style={{
            position: 'relative',
            bottom: 'auto',
            right: 'auto',
            pointerEvents: 'auto',
            background: 'var(--surface-3)',
            color: 'var(--text)',
            border: '1px solid var(--border-gold)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '10px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <span style={{ color: 'var(--gold)' }}>✦</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
