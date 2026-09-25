import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Check, X, Loader2 } from 'lucide-react';

export const PaymentModal = () => {
  const { paymentModal, closePaymentModal } = useApp();

  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [step, setStep] = useState('pay'); // 'pay' | 'processing' | 'success'
  const [upiVpa, setUpiVpa] = useState('arjun@okhdfc');

  if (!paymentModal.isOpen) return null;

  const handleProcessPayment = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        if (paymentModal.onSuccess) {
          paymentModal.onSuccess();
        }
        closePaymentModal();
        setStep('pay');
      }, 1400);
    }, 1600);
  };

  return (
    <div className="paygw-overlay show">
      <div className="paygw-modal" style={{ maxWidth: '460px' }}>
        <div className="paygw-header">
          <div className="paygw-lock">
            <ShieldCheck size={16} />
            <span>Razorpay Escrow Gateway</span>
          </div>
          {step !== 'processing' && (
            <button className="paygw-close" onClick={closePaymentModal}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          {step === 'pay' && (
            <>
              <div className="paygw-amount-row" style={{ marginBottom: '10px' }}>
                <div className="lbl">Escrow Amount</div>
                <div className="val mono" style={{ fontSize: '24px', color: 'var(--gold-hi)' }}>
                  ₹{Number(paymentModal.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="paygw-purpose" style={{ marginBottom: '18px' }}>
                {paymentModal.purpose || 'Escrow deposit'}
              </div>

              <div className="paygw-methods" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className={`paygw-tab ${method === 'upi' ? 'active' : ''}`}
                  onClick={() => setMethod('upi')}
                >
                  UPI (GPay / PhonePe)
                </button>
                <button
                  type="button"
                  className={`paygw-tab ${method === 'card' ? 'active' : ''}`}
                  onClick={() => setMethod('card')}
                >
                  Card
                </button>
                <button
                  type="button"
                  className={`paygw-tab ${method === 'netbanking' ? 'active' : ''}`}
                  onClick={() => setMethod('netbanking')}
                >
                  Netbanking
                </button>
              </div>

              {method === 'upi' && (
                <div className="field">
                  <label>Virtual Payment Address (VPA / UPI)</label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="yourname@okhdfc"
                  />
                </div>
              )}

              {method === 'card' && (
                <div>
                  <div className="field">
                    <label>Card Number</label>
                    <input type="text" placeholder="4111 •••• •••• 1111" defaultValue="4111 2222 3333 4444" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field">
                      <label>Valid Thru</label>
                      <input type="text" placeholder="MM/YY" defaultValue="12/28" />
                    </div>
                    <div className="field">
                      <label>CVV</label>
                      <input type="password" placeholder="•••" defaultValue="123" />
                    </div>
                  </div>
                </div>
              )}

              {method === 'netbanking' && (
                <div className="field">
                  <label>Select Bank</label>
                  <select defaultValue="HDFC Bank">
                    <option>HDFC Bank</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                className="btn block"
                onClick={handleProcessPayment}
                style={{ marginTop: '16px', padding: '12px' }}
              >
                Pay & Secure in Escrow (₹{Number(paymentModal.amount || 0).toLocaleString('en-IN')})
              </button>

              <div className="paygw-safe-note" style={{ marginTop: '12px' }}>
                🔒 256-bit encrypted escrow gateway · Funds remain in trust until deliverable approval.
              </div>
            </>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <div className="paygw-spinner" style={{ margin: '0 auto 18px' }} />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                Locking Funds in Escrow…
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
                Communicating with Razorpay gateway. Please do not refresh.
              </div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '36px 12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--mint-dim)',
                  color: 'var(--mint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <Check size={28} strokeWidth={3} />
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
                Escrow Deposit Confirmed!
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
                ₹{Number(paymentModal.amount || 0).toLocaleString('en-IN')} is safely secured in the task escrow vault.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
