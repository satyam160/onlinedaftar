import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Wallet,
  Bell,
  PlusCircle,
  CheckSquare,
  Video,
  User,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const { activeTab, setActiveTab, mode, toggleMode, unreadNotifications } = useApp();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OD';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'browse', label: 'Browse Tasks', icon: Compass },
    { id: 'wallet', label: 'Passbook & Wallet', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
    { id: 'post', label: 'Post a Task', icon: PlusCircle, isPosterOnly: true },
    { id: 'mytasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'videomarket', label: 'Video Market', icon: Video },
    { id: 'profile', label: 'Profile & Payouts', icon: User }
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">O</div>
        <div className="brand-name">OnlineDaftar</div>
      </div>

      {/* Role / Mode Switcher */}
      <div className="mode-toggle">
        <div className="mode-label">
          Mode: <strong id="modeLabel">{mode === 'poster' ? 'Poster' : 'Worker'}</strong>
        </div>
        <div
          className={`switch ${mode === 'poster' ? 'on' : ''}`}
          id="modeSwitch"
          onClick={toggleMode}
          title="Toggle between Worker and Poster mode"
          style={{ cursor: 'pointer' }}
        >
          <div className="switch-thumb"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ position: 'relative' }}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          onClick={() => setActiveTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--gold)'
            }}
          >
            {initials}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              {user?.name || 'OnlineDaftar User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>
              {user?.role || mode}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
