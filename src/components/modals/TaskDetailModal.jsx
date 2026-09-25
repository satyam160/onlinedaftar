import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { tasksApi } from '../../services/api';
import { CheckCircle2, X } from 'lucide-react';

export const TaskDetailModal = () => {
  const { taskDetailModal, closeTaskDetailModal, showToast } = useApp();
  const { isDemoMode } = useAuth();

  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!taskDetailModal.isOpen || !taskDetailModal.task) return null;

  const task = taskDetailModal.task;
  const payInRupees = Math.round(task.pay_paise / 100);
  const isApproved = task.status === 'approved';
  const isSubmitted = task.status === 'submitted';

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!note.trim() && !proofUrl.trim()) {
      showToast('Please provide a submission note or proof URL.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (!isDemoMode && !task.id.startsWith('active-') && !task.id.startsWith('demo-')) {
        await tasksApi.submitProof(task.id, { proofUrl: proofUrl.trim(), note: note.trim() });
      }
      showToast('Deliverable submitted! Waiting for poster review and escrow release.');
      task.status = 'submitted';
      task.proofNote = note.trim();
      task.proofUrl = proofUrl.trim();
      closeTaskDetailModal();
    } catch (err) {
      showToast(err.message || 'Could not submit proof.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="paygw-overlay show">
      <div className="paygw-modal" style={{ maxWidth: '520px' }}>
        <div className="paygw-header">
          <div className="paygw-lock">
            <span>✦</span>
            <span>Task Deliverable & Proof</span>
          </div>
          <button className="paygw-close" onClick={closeTaskDetailModal}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="paygw-amount-row" style={{ marginBottom: '8px' }}>
            <div className="lbl" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              {task.title}
            </div>
            <div className="val mono" style={{ fontSize: '20px', color: 'var(--gold-hi)' }}>
              ₹{payInRupees.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '18px' }}>
            Category: {task.category} · Poster: {task.poster_name}
          </div>

          {isApproved ? (
            <div
              style={{
                background: 'var(--mint-dim)',
                color: 'var(--mint)',
                border: '1px solid rgba(63,168,115,0.3)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>This deliverable was approved and payout has been credited to your passbook.</span>
            </div>
          ) : isSubmitted ? (
            <div style={{ background: 'var(--surface-3)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold-hi)', marginBottom: '6px' }}>
                Submission Under Review
              </div>
              {task.proofNote && (
                <div style={{ fontSize: '12.5px', color: 'var(--text)', marginBottom: '4px' }}>
                  <strong>Your Note:</strong> {task.proofNote}
                </div>
              )}
              {task.proofUrl && (
                <div style={{ fontSize: '12.5px', color: 'var(--mint)' }}>
                  <strong>Proof Link:</strong>{' '}
                  <a href={task.proofUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                    {task.proofUrl}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitProof}>
              <div className="field">
                <label>Submission Note / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detail the actions completed, timestamp of work, and key results…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Proof Link (Photos, Drive folder, GitHub, Sheets)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn block"
                disabled={submitting}
                style={{ marginTop: '14px', padding: '10px' }}
              >
                {submitting ? 'Submitting…' : 'Submit Proof for Poster Approval'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
