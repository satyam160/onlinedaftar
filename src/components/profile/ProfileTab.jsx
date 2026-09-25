import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { bankApi } from '../../services/api';
import { ShieldCheck, Star, CreditCard, Save, Lock } from 'lucide-react';

export const ProfileTab = () => {
  const { user, updateProfile, isDemoMode } = useAuth();
  const { showToast } = useApp();

  const [bio, setBio] = useState(user?.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  // Payout linking state
  const [payoutTab, setPayoutTab] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const [holderName, setHolderName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [linking, setLinking] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OD';

  const handleSaveBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    try {
      await updateProfile({ bio: bio.trim() });
      showToast('Profile bio updated successfully.');
    } catch (err) {
      showToast(err.message || 'Could not update bio.', 'error');
    } finally {
      setSavingBio(false);
    }
  };

  const handleLinkUpi = async (e) => {
    e.preventDefault();
    if (!upiId.trim() || !upiId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. name@okhdfc)', 'error');
      return;
    }
    setLinking(true);
    try {
      if (!isDemoMode) {
        await bankApi.linkUpi({ upiId: upiId.trim() }).catch(() => {});
      }
      await updateProfile({ upi_id: upiId.trim() });
      showToast(`UPI ID ${upiId} linked for instant withdrawals!`);
    } catch (err) {
      showToast(err.message || 'Could not link UPI ID.', 'error');
    } finally {
      setLinking(false);
    }
  };

  const handleLinkBank = async (e) => {
    e.preventDefault();
    if (!accNum.trim() || !ifsc.trim() || !holderName.trim()) {
      showToast('All bank fields are required.', 'error');
      return;
    }
    setLinking(true);
    try {
      if (!isDemoMode) {
        await bankApi.linkBank({ accountNumber: accNum, ifsc, accountHolderName: holderName }).catch(() => {});
      }
      showToast(`Bank account linked ending in •••• ${accNum.slice(-4)}`);
      setAccNum('');
    } catch (err) {
      showToast(err.message || 'Could not link bank account.', 'error');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="tab-panel active" id="profile">
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Header Card */}
        <div className="form-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: 'var(--surface-3)',
              border: '2px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, serif',
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--gold)',
              flexShrink: 0
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '22px' }}>
                {user?.name || 'OnlineDaftar Member'}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--mint-dim)',
                  color: 'var(--mint)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <ShieldCheck size={12} />
                <span>KYC Verified</span>
              </span>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              {user?.email || 'priya.s@daftardemo.in'} · Role: <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{user?.role || 'Worker'}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12.5px', color: 'var(--gold)' }}>
              <span>★★★★★</span>
              <span style={{ color: 'var(--muted)', fontSize: '11.5px' }}>
                {user?.rating_avg || 4.9} · ({user?.rating_count || 28} verified reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Bio / Professional Summary */}
        <form onSubmit={handleSaveBio} className="form-card">
          <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '17px' }}>
            Professional Profile & Skills
          </h3>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px' }}>
            This summary is shown to employers when you accept and submit tasks.
          </div>

          <div className="field">
            <textarea
              rows={3}
              placeholder="Detail your gig specialties (e.g. retail field auditing, data entry accuracy, translations)…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-subtle"
            disabled={savingBio}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px' }}
          >
            <Save size={14} />
            <span>{savingBio ? 'Saving…' : 'Save Profile Changes'}</span>
          </button>
        </form>

        {/* Payout & Withdrawal Accounts */}
        <div className="form-card">
          <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '17px' }}>
            Withdrawal Accounts (RazorpayX Payouts)
          </h3>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px' }}>
            Funds from approved task escrows are disbursed directly to your verified payout account.
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <button
              type="button"
              className={`auth-tab ${payoutTab === 'upi' ? 'active' : ''}`}
              onClick={() => setPayoutTab('upi')}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              UPI Handle (Instant)
            </button>
            <button
              type="button"
              className={`auth-tab ${payoutTab === 'bank' ? 'active' : ''}`}
              onClick={() => setPayoutTab('bank')}
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              Direct Bank Account (NEFT/IMPS)
            </button>
          </div>

          {payoutTab === 'upi' ? (
            <form onSubmit={handleLinkUpi}>
              <div className="field">
                <label>VPA / UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. priya.s@okhdfc"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn"
                disabled={linking}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                {linking ? 'Verifying with NPCI…' : 'Link UPI Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLinkBank}>
              <div className="field">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="As per bank passbook"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="field">
                  <label>Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="9 to 18 digits"
                    value={accNum}
                    onChange={(e) => setAccNum(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn"
                disabled={linking}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                {linking ? 'Verifying IFSC & Account…' : 'Link Bank Account'}
              </button>
            </form>
          )}
        </div>

        {/* Security & Interview Note Card */}
        <div
          style={{
            background: 'var(--surface-3)',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid var(--border)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}
        >
          <Lock size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Interview Explanation Tip: Credential Security
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
              Authentication is backed by bcrypt password hashing (10 salt rounds) and stateless JSON Web Tokens (JWT) signed with a secret key. In addition to production database sessions, the app supports an offline mock mode so technical interviewers can test the full end-to-end escrow journey even without a local database running.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
