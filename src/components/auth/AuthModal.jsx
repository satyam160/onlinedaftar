import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const AuthModal = () => {
  const { isAuthenticated, login, register, demoLogin } = useAuth();
  const { showToast } = useApp();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, do not render modal
  if (isAuthenticated) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!identifier.trim() || !password) {
          setError('Please enter your username/email and password.');
          setLoading(false);
          return;
        }
        await login({ identifier: identifier.trim(), password });
        showToast('Signed in successfully! Welcome back.');
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setError('Name, email, and password are required.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await register({ username: name.trim(), name: name.trim(), email: email.trim(), password, role });
        showToast('Account created successfully! Welcome to OnlineDaftar.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials or try demo login.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (selectedRole) => {
    demoLogin(selectedRole);
    showToast(`Logged in as Demo ${selectedRole === 'poster' ? 'Poster' : 'Worker'}!`);
  };

  return (
    <div className="auth-overlay" style={{ display: 'flex' }}>
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-brand">
          <div className="brand-mark">O</div>
          <div className="brand-name">OnlineDaftar</div>
        </div>
        <div className="auth-tagline">Real work. Real escrow. Real pay.</div>

        <div className="auth-tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error show" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <>
              <div className="field">
                <label>Username or Email address</label>
                <input
                  type="text"
                  placeholder="e.g. arjun or priya@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn block"
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                {loading ? 'Authenticating…' : 'Sign In with Password'}
              </button>
            </>
          ) : (
            <>
              <div className="field">
                <label>Full Name / Username</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Choose Password (min 6 chars)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Primary Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="worker">Worker — Earn money completing tasks</option>
                  <option value="poster">Poster — Post tasks & hire with escrow</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn block"
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </>
          )}
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ⚡ Fast Interview Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={() => handleDemoLogin('worker')}
              style={{ fontSize: '12px', padding: '9px 12px' }}
            >
              Demo as Worker
            </button>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={() => handleDemoLogin('poster')}
              style={{ fontSize: '12px', padding: '9px 12px' }}
            >
              Demo as Poster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
