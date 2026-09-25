import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { tasksApi } from '../../services/api';
import { CheckCircle2, Clock, AlertCircle, FileText, ArrowRight } from 'lucide-react';

export const MyTasksTab = () => {
  const { openTaskDetailModal, showToast, setBalance } = useApp();
  const { user } = useAuth();

  const [subTab, setSubTab] = useState('worker'); // 'worker' or 'poster'

  // Sample active deliverables
  const [workerTasks, setWorkerTasks] = useState([
    {
      id: 'active-1',
      title: 'Store shelf video footage: FMCG shampoo aisle in Bandra West',
      category: 'Field & Retail',
      pay_paise: 240000,
      poster_name: 'RetailLens Analytics',
      status: 'accepted', // accepted | submitted | approved
      deadline: 'Today, 8:00 PM',
      proofNote: '',
      proofUrl: ''
    },
    {
      id: 'active-2',
      title: 'Audit and categorize 250 local business listings in Pune',
      category: 'Data Entry',
      pay_paise: 185000,
      poster_name: 'Vikram Mehta',
      status: 'submitted',
      deadline: 'Under Review',
      proofNote: 'Completed sheet uploaded to Google Drive with verified phone numbers.',
      proofUrl: 'https://docs.google.com/spreadsheets/d/sample'
    },
    {
      id: 'active-3',
      title: 'Translate 12 product description cards to Hindi & Marathi',
      category: 'Translation',
      pay_paise: 125000,
      poster_name: 'Kavita Sharma',
      status: 'approved',
      deadline: 'Completed',
      proofNote: 'Delivered in doc format with colloquial nuances.',
      proofUrl: 'https://drive.google.com/sample'
    }
  ]);

  const [postedTasks, setPostedTasks] = useState([
    {
      id: 'posted-1',
      title: 'Mystery shopper review: Electronics retail store in Koramangala',
      category: 'Field & Retail',
      pay_paise: 220000,
      worker_name: 'Rahul Verma',
      status: 'submitted',
      proofNote: 'Visited store at 3:15 PM, took 6 photos and evaluated staff response time.',
      proofUrl: 'https://photos.app.goo.gl/sample123'
    },
    {
      id: 'posted-2',
      title: 'Data scraping and cleaning: 500 restaurant menus in Delhi NCR',
      category: 'Data Entry',
      pay_paise: 350000,
      worker_name: 'Sunil Nair',
      status: 'open',
      proofNote: '',
      proofUrl: ''
    }
  ]);

  const handleApproveSubmission = async (task) => {
    try {
      if (!task.id.startsWith('posted-')) {
        await tasksApi.approveTask(task.id);
      }
      setPostedTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'approved' } : t))
      );
      showToast(`Submission approved! ₹${(task.pay_paise / 100).toLocaleString('en-IN')} escrow released to ${task.worker_name}.`);
    } catch (err) {
      showToast(err.message || 'Could not approve submission.');
    }
  };

  return (
    <div className="tab-panel active" id="mytasks">
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`auth-tab ${subTab === 'worker' ? 'active' : ''}`}
          onClick={() => setSubTab('worker')}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          My Accepted Gigs (Worker)
        </button>
        <button
          type="button"
          className={`auth-tab ${subTab === 'poster' ? 'active' : ''}`}
          onClick={() => setSubTab('poster')}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          My Created Gigs & Submissions (Poster)
        </button>
      </div>

      {subTab === 'worker' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {workerTasks.map((t) => {
            const amt = Math.round(t.pay_paise / 100);
            return (
              <div
                key={t.id}
                className="form-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 22px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="task-cat">{t.category}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          t.status === 'approved'
                            ? 'var(--mint-dim)'
                            : t.status === 'submitted'
                            ? 'var(--gold-dim)'
                            : 'var(--surface-3)',
                        color:
                          t.status === 'approved'
                            ? 'var(--mint)'
                            : t.status === 'submitted'
                            ? 'var(--gold)'
                            : 'var(--text)'
                      }}
                    >
                      {t.status === 'approved'
                        ? '✓ Escrow Paid Out'
                        : t.status === 'submitted'
                        ? '⏳ Under Review'
                        : '● Accepted - Pending Proof'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{t.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Posted by {t.poster_name} · Deadline: {t.deadline}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-hi)' }}>
                    ₹{amt.toLocaleString('en-IN')}
                  </div>
                  {t.status === 'accepted' ? (
                    <button
                      className="btn"
                      onClick={() => openTaskDetailModal(t)}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      Submit Proof Link
                    </button>
                  ) : t.status === 'submitted' ? (
                    <button
                      className="btn btn-subtle"
                      onClick={() => openTaskDetailModal(t)}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      View Submission
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--mint)', fontWeight: 600 }}>
                      ✓ Credited to Wallet
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {postedTasks.map((t) => {
            const amt = Math.round(t.pay_paise / 100);
            return (
              <div
                key={t.id}
                className="form-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 22px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="task-cat">{t.category}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          t.status === 'approved'
                            ? 'var(--mint-dim)'
                            : t.status === 'submitted'
                            ? 'var(--gold-dim)'
                            : 'var(--surface-3)',
                        color:
                          t.status === 'approved'
                            ? 'var(--mint)'
                            : t.status === 'submitted'
                            ? 'var(--gold)'
                            : 'var(--text)'
                      }}
                    >
                      {t.status === 'approved'
                        ? '✓ Approved & Released'
                        : t.status === 'submitted'
                        ? '★ Submission Ready for Approval'
                        : '● Open for Workers'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{t.title}</h3>
                  {t.worker_name && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Worker: <strong style={{ color: 'var(--text)' }}>{t.worker_name}</strong>
                    </div>
                  )}
                  {t.proofNote && (
                    <div style={{ fontSize: '12px', color: 'var(--gold-soft)', marginTop: '4px' }}>
                      Note: "{t.proofNote}"
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-hi)' }}>
                    ₹{amt.toLocaleString('en-IN')}
                  </div>
                  {t.status === 'submitted' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {t.proofUrl && (
                        <a
                          href={t.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-subtle"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          View Proof
                        </a>
                      )}
                      <button
                        className="btn"
                        onClick={() => handleApproveSubmission(t)}
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Approve & Release Escrow
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
