import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, DEMO_NOTIFICATIONS } from '../../services/api';
import { Bell, CheckCheck, ShieldCheck, Sparkles } from 'lucide-react';

export const NotificationsTab = () => {
  const { setUnreadNotifications, showToast } = useApp();
  const { isDemoMode } = useAuth();

  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const handleMarkAllRead = async () => {
    try {
      if (!isDemoMode) {
        await notificationsApi.markAllRead().catch(() => {});
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
      showToast('All notifications marked as read.');
    } catch (err) {
      // keep
    }
  };

  return (
    <div className="tab-panel active" id="notifications">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: 0 }}>
              Activity & Escrow Alerts
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
              Real-time events regarding your escrow funds, submissions, and tasks.
            </div>
          </div>

          <button
            className="btn btn-subtle"
            onClick={handleMarkAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
          >
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => {
            const timeStr = new Date(n.created_at).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={n.id}
                className="form-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  background: n.read ? 'var(--surface)' : 'var(--surface-2)',
                  borderColor: n.read ? 'var(--border)' : 'var(--border-gold)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: n.read ? 'var(--surface-3)' : 'var(--mint-dim)',
                    color: n.read ? 'var(--muted)' : 'var(--mint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bell size={16} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '14.5px', color: n.read ? 'var(--text)' : 'var(--gold-hi)' }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{timeStr}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.45 }}>
                    {n.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
