import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const OverviewTab = () => {
  const { balance, earnedThisMonth, transactions, setActiveTab, mode, openTaskDetailModal } = useApp();
  const { user } = useAuth();

  const firstName = (user?.name || 'there').split(' ')[0];

  return (
    <div className="tab-panel active" id="overview">
      {/* Greeting Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', margin: '0 0 6px' }}>
          Namaste, {firstName} ✦
        </h1>
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Real work. Real ledger. Real pay. Every rupee is secured in bank escrow before work starts.
        </div>
      </div>

      {/* Escrow Guarantee Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--mint-dim)',
          border: '1px solid rgba(63,168,115,0.28)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '28px',
          color: 'var(--mint)',
          fontSize: '13px'
        }}
      >
        <ShieldCheck size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>Escrow Guarantee:</strong> When a task is accepted, 100% of the payout is pre-locked in
          escrow. Once you submit proof and the employer approves, funds credit immediately to your passbook.
        </div>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Available Ledger Balance</div>
          <div className="stat-val mono" style={{ color: 'var(--gold-hi)' }}>
            ₹{balance.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub" style={{ color: 'var(--mint)' }}>
            Ready for instant UPI / Bank withdrawal
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Earned This Month</div>
          <div className="stat-val mono" style={{ color: 'var(--mint)' }}>
            ₹{earnedThisMonth.toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">Across verified escrow releases</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Escrow In Transit</div>
          <div className="stat-val mono" style={{ color: 'var(--text)' }}>
            ₹3,250
          </div>
          <div className="stat-sub">Locked in active task submissions</div>
        </div>
      </div>

      {/* Two Column Layout: Recent Ledger & Quick Workflow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Recent Ledger Entries */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '18px' }}>Today's Ledger</h3>
            <button
              className="btn btn-subtle"
              onClick={() => setActiveTab('wallet')}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              Full Passbook →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.slice(0, 4).map((tx) => {
              const isIncoming = tx.type === 'escrow_release';
              const isPaid = tx.status === 'paid';
              const amt = Math.round(tx.amount_paise / 100).toLocaleString('en-IN');
              const dateStr = new Date(tx.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isIncoming ? 'var(--mint-dim)' : 'var(--danger-dim)',
                        color: isIncoming ? 'var(--mint)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isIncoming ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                        {tx.task_title || (tx.type === 'withdrawal' ? 'Withdrawal to UPI' : tx.type)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {dateStr} · {isPaid ? 'Settled in Ledger' : 'Processing'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isIncoming ? 'var(--mint)' : 'var(--danger)'
                      }}
                    >
                      {isIncoming ? '+' : '−'}₹{amt}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        color: isPaid ? 'var(--mint)' : 'var(--gold)',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {isPaid ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Escrow Lifecycle */}
        <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '18px' }}>
            Quick Operations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn block"
              onClick={() => setActiveTab('browse')}
              style={{ textAlign: 'left', padding: '12px 16px' }}
            >
              <div style={{ fontWeight: 600 }}>Explore Available Tasks</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                Accept open gigs with pre-funded escrow
              </div>
            </button>

            <button
              className="btn btn-subtle block"
              onClick={() => setActiveTab('post')}
              style={{ textAlign: 'left', padding: '12px 16px' }}
            >
              <div style={{ fontWeight: 600 }}>Post a New Gig</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Hire field workers or analysts with Razorpay escrow
              </div>
            </button>

            <button
              className="btn btn-subtle block"
              onClick={() => setActiveTab('wallet')}
              style={{ textAlign: 'left', padding: '12px 16px' }}
            >
              <div style={{ fontWeight: 600 }}>Withdraw to Bank / UPI</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Instant disbursement of verified earnings
              </div>
            </button>
          </div>

          <div
            style={{
              marginTop: 'auto',
              background: 'var(--surface-3)',
              borderRadius: '8px',
              padding: '14px',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', marginBottom: '6px', fontSize: '12px', fontWeight: 600 }}>
              <Sparkles size={14} />
              <span>How Escrow Works on OnlineDaftar</span>
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
              <li>Poster creates gig & pre-funds escrow</li>
              <li>Worker completes task & submits proof link/note</li>
              <li>Poster reviews submission & approves</li>
              <li>Escrow auto-releases to worker's passbook</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
