import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Wallet, Bell, Plus, ShieldCheck } from 'lucide-react';

export const Topbar = () => {
  const { activeTab, setActiveTab, mode, balance, unreadNotifications } = useApp();
  const { user } = useAuth();

  const tabTitles = {
    overview: 'Workspace Overview',
    browse: 'Browse Escrow Tasks',
    wallet: 'Passbook & Escrow Ledger',
    notifications: 'Notifications Stream',
    post: 'Create New Escrow Task',
    mytasks: 'Active Deliverables & Submissions',
    videomarket: 'Creator Video Market',
    profile: 'Profile, KYC & Payout Accounts'
  };

  return (
    <div className="topbar">
      <div>
        <h1 style={{ margin: 0, fontSize: '20px', fontFamily: 'Fraunces, serif', fontWeight: 600 }}>
          {tabTitles[activeTab] || 'Workspace'}
        </h1>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
          {mode === 'poster' ? 'Employer / Poster Console' : 'Verified Worker Console'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Escrow Protected Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--mint-dim)',
            color: 'var(--mint)',
            border: '1px solid rgba(63,168,115,0.3)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <ShieldCheck size={14} />
          <span>100% Escrow Protected</span>
        </div>

        {/* Quick Wallet Balance Pill */}
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-gold)',
            color: 'var(--gold-hi)',
            borderRadius: '20px',
            padding: '5px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Wallet size={15} style={{ color: 'var(--gold)' }} />
          <span className="mono">₹{balance.toLocaleString('en-IN')}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            position: 'relative',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Bell size={16} />
          {unreadNotifications > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--danger)',
                width: '8px',
                height: '8px',
                borderRadius: '50%'
              }}
            />
          )}
        </button>

        {/* Action Button based on mode */}
        {mode === 'poster' ? (
          <button
            className="btn"
            onClick={() => setActiveTab('post')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Post Task</span>
          </button>
        ) : (
          <button
            className="btn btn-subtle"
            onClick={() => setActiveTab('browse')}
            style={{ fontSize: '13px', padding: '7px 16px' }}
          >
            Find Work
          </button>
        )}
      </div>
    </div>
  );
};
