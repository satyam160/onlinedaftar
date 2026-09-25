import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DEMO_LISTINGS, listingsApi } from '../../services/api';
import { Video, ShieldCheck, Download, Plus, ShoppingBag } from 'lucide-react';

export const VideoMarketTab = () => {
  const { openPaymentModal, showToast } = useApp();
  const { isDemoMode } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('browse');
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [library, setLibrary] = useState([]);

  const handlePurchase = (item) => {
    const priceRupees = Math.round(item.price_paise / 100);

    openPaymentModal({
      purpose: `Purchase footage license: "${item.title.slice(0, 30)}…"`,
      amount: priceRupees,
      onSuccess: () => {
        setLibrary((prev) => [
          {
            ...item,
            purchase_id: 'pur-' + Date.now(),
            purchased_at: new Date().toISOString(),
            download_url: 'https://cdn.onlinedaftar.in/sample_4k_prores.zip'
          },
          ...prev
        ]);
        showToast(`Asset unlocked! Download link available in "My Library".`);
        setActiveSubTab('library');
      }
    });
  };

  return (
    <div className="tab-panel active" id="videomarket">
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          type="button"
          className={`auth-tab ${activeSubTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('browse')}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          Creator Footage Marketplace
        </button>
        <button
          type="button"
          className={`auth-tab ${activeSubTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('library')}
          style={{ padding: '8px 18px', fontSize: '13px' }}
        >
          My Library ({library.length})
        </button>
      </div>

      {activeSubTab === 'browse' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {listings.map((item) => {
            const price = Math.round(item.price_paise / 100);
            return (
              <div
                key={item.id}
                className="form-card"
                style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  style={{
                    height: '160px',
                    backgroundImage: `url(${item.preview_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--gold-hi)',
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '15px', lineHeight: 1.3 }}>{item.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                    Creator: {item.seller_name} · 4K ProRes
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-hi)' }}>
                      ₹{price.toLocaleString('en-IN')}
                    </div>
                    <button
                      className="btn"
                      onClick={() => handlePurchase(item)}
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      Buy License
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {library.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}
            >
              <ShoppingBag size={32} style={{ color: 'var(--muted)', marginBottom: '10px' }} />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: 'var(--text)', marginBottom: '6px' }}>
                Your Library is Empty
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Purchase footage or B-roll packs from the marketplace to unlock original master files here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {library.map((item) => (
                <div
                  key={item.purchase_id}
                  className="form-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'var(--mint-dim)',
                        color: 'var(--mint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Video size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '15px' }}>{item.title}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Licensed to you · Commercial Usage Permitted
                      </div>
                    </div>
                  </div>

                  <a
                    href={item.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '12px' }}
                  >
                    <Download size={14} />
                    <span>Download Master</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
