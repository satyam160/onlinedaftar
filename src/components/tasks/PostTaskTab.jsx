import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { tasksApi } from '../../services/api';
import { ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const PostTaskTab = () => {
  const { openPaymentModal, showToast, setActiveTab } = useApp();
  const { isDemoMode } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Field & Retail');
  const [payout, setPayout] = useState(1500);
  const [description, setDescription] = useState('');
  const [proofType, setProofType] = useState('photo');
  const [deadlineDays, setDeadlineDays] = useState('2');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title.', 'error');
      return;
    }
    if (!payout || payout < 100) {
      showToast('Minimum task payout is ₹100.', 'error');
      return;
    }

    const payPaise = Math.round(Number(payout) * 100);

    // Open Payment Gateway to fund escrow first
    openPaymentModal({
      purpose: `Fund escrow for task: "${title.slice(0, 30)}…"`,
      amount: Number(payout),
      onSuccess: async () => {
        setLoading(true);
        try {
          if (!isDemoMode) {
            await tasksApi.createTask({
              title: title.trim(),
              description: description.trim(),
              category,
              payPaise,
              proofType,
              deadline: new Date(Date.now() + Number(deadlineDays) * 86400000).toISOString()
            });
          }
          showToast(`Task published & ₹${payout.toLocaleString('en-IN')} escrow locked!`);
          setTitle('');
          setDescription('');
          setPayout(1500);
          setActiveTab('browse');
        } catch (err) {
          showToast(err.message || 'Payment funded but failed to create task.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="tab-panel active" id="post">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', margin: '0 0 6px' }}>
            Post a New Task with Escrow
          </h2>
          <div style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            Every task on OnlineDaftar requires 100% upfront escrow deposit. Funds remain protected
            and are only disbursed when you review and approve the worker's submitted proof.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-card">
          <div className="field">
            <label>Task Title</label>
            <input
              type="text"
              placeholder="e.g. Audit store facings for cosmetic aisle in Indiranagar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Field & Retail">Field & Retail</option>
                <option value="Data Entry">Data Entry</option>
                <option value="Translation">Translation</option>
                <option value="QA Testing">QA Testing</option>
                <option value="Admin">Admin</option>
                <option value="Design">Design</option>
              </select>
            </div>

            <div className="field">
              <label>Worker Payout (₹ INR)</label>
              <input
                type="number"
                min="100"
                step="50"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Detailed Instructions & Deliverables</label>
            <textarea
              rows={4}
              placeholder="Specify the exact requirements, checklist items, and quality benchmarks…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field">
              <label>Proof Verification Format</label>
              <select value={proofType} onChange={(e) => setProofType(e.target.value)}>
                <option value="photo">Photo / Screenshot URL</option>
                <option value="file">File Upload / Cloud Link</option>
                <option value="link">Public Live Link (Docs, Sheets)</option>
                <option value="text">Written Report / Code</option>
              </select>
            </div>

            <div className="field">
              <label>Submission Deadline</label>
              <select value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)}>
                <option value="1">Within 24 Hours</option>
                <option value="2">Within 48 Hours</option>
                <option value="5">Within 5 Days</option>
                <option value="7">Within 1 Week</option>
              </select>
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-3)',
              borderRadius: '8px',
              padding: '14px 16px',
              margin: '16px 0',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Total Escrow Deposit
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                0% platform fee for initial gig posting
              </div>
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold-hi)' }}>
              ₹{Number(payout || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="submit"
            className="btn block"
            disabled={loading}
            style={{ padding: '12px' }}
          >
            {loading ? 'Processing…' : `Fund Escrow & Publish (₹${Number(payout || 0).toLocaleString('en-IN')})`}
          </button>
        </form>
      </div>
    </div>
  );
};
