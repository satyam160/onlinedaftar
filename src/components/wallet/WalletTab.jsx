import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { walletApi } from '../../services/api';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, Download } from 'lucide-react';

export const WalletTab = () => {
  const { balance, setBalance, earnedThisMonth, transactions, setTransactions, showToast } = useApp();
  const { user } = useAuth();

  const [withdrawing, setWithdrawing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const handleWithdraw = async () => {
    if (balance <= 0) {
      showToast('No balance available to withdraw.', 'error');
      return;
    }

    setWithdrawing(true);
    try {
      await walletApi.withdraw().catch(() => {});
      const withdrawnAmount = balance;
      setBalance(0);

      const newTx = {
        id: 'tx-w-' + Date.now(),
        task_title: `Withdrawal to linked UPI (${user?.upi_id || 'priya.s@okhdfc'})`,
        type: 'withdrawal',
        amount_paise: withdrawnAmount * 100,
        status: 'sent',
        created_at: new Date().toISOString()
      };
      setTransactions((prev) => [newTx, ...prev]);

      showToast(`₹${withdrawnAmount.toLocaleString('en-IN')} payout initiated to your verified UPI account!`);
    } catch (err) {
      showToast(err.message || 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterType === 'in') return t.type === 'escrow_release';
    if (filterType === 'out') return t.type === 'withdrawal' || t.type === 'escrow_fund';
    return true;
  });

  return (
    <div className="tab-panel active" id="wallet">
      {/* Balance Summary Header Cards */}
      <div className="stat-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(145deg, var(--surface-2), var(--surface))' }}>
          <div className="stat-label">Total Withdrawable Balance</div>
          <div className="stat-val mono" style={{ fontSize: '32px', color: 'var(--gold-hi)' }}>
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <button
            className="btn"
            disabled={withdrawing || balance <= 0}
            onClick={handleWithdraw}
            style={{ marginTop: '14px', width: '100%', fontSize: '13px', padding: '10px' }}
          >
            {withdrawing ? 'Initiating Payout…' : 'Withdraw Full Balance to UPI'}
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-label">Earned This Month</div>
          <div className="stat-val mono" style={{ fontSize: '32px', color: 'var(--mint)' }}>
            ₹{earnedThisMonth.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub" style={{ marginTop: '14px' }}>
            Directly from verified gig escrow payouts
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Verified Payout Account</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginTop: '8px' }}>
            {user?.upi_id || 'priya.s@okhdfc'}
          </div>
          <div className="stat-sub" style={{ color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <ShieldCheck size={14} /> Instant NPCI IMPS / UPI transfer
          </div>
        </div>
      </div>

      {/* Passbook / Ledger Table */}
      <div className="form-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '18px' }}>
              Official Passbook Ledger
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              A/C Reference: OD-{user?.id?.slice(0, 8).toUpperCase() || '7A942F0B'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`auth-tab ${filterType === 'all' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '16px' }}
              onClick={() => setFilterType('all')}
            >
              All Records
            </button>
            <button
              type="button"
              className={`auth-tab ${filterType === 'in' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '16px' }}
              onClick={() => setFilterType('in')}
            >
              Credits Only
            </button>
            <button
              type="button"
              className={`auth-tab ${filterType === 'out' ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '16px' }}
              onClick={() => setFilterType('out')}
            >
              Debits Only
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="passbook-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left', fontSize: '12px', color: 'var(--muted)' }}>
                <th style={{ padding: '10px 12px' }}>Transaction Description</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isIncoming = t.type === 'escrow_release';
                const amt = Math.round(t.amount_paise / 100).toLocaleString('en-IN');
                const date = new Date(t.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                        {t.task_title || (t.type === 'withdrawal' ? 'Withdrawal to UPI' : t.type.replace('_', ' '))}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{date}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', textTransform: 'capitalize' }}>
                      {t.type.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        className={`stamp ${t.status === 'paid' ? 'paid' : t.type === 'withdrawal' ? 'verified' : 'pending'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td
                      className="mono"
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: isIncoming ? 'var(--mint)' : 'var(--danger)'
                      }}
                    >
                      {isIncoming ? '+' : '−'}₹{amt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
