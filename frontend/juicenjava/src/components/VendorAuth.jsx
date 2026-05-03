import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const VendorAuth = ({ onAuthSuccess, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { shop_name: shopName, role: 'vendor' } }
        });
        if (error) throw error;
        setMessage('Check your email to confirm your account, then log in.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onAuthSuccess(data.user, data.session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>☕</span>
          <span style={styles.logoText}>Juice'n'Java</span>
        </div>

        <h2 style={styles.title}>
          {mode === 'login' ? 'Vendor Sign In' : 'List Your Shop'}
        </h2>
        <p style={styles.subtitle}>
          {mode === 'login'
            ? 'Access your vendor dashboard'
            : 'Join 500+ Lagos spots on the platform'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Shop Name</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Cafe Neo Yaba"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                required
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@yourshop.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.toggleText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={styles.toggleLink}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem'
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '2rem',
    width: '100%', maxWidth: '420px', position: 'relative',
    fontFamily: "'DM Sans', sans-serif"
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'none', border: 'none', fontSize: '16px',
    cursor: 'pointer', color: '#888'
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' },
  logoIcon: { fontSize: '20px' },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#1C1009' },
  title: { fontSize: '22px', fontWeight: '600', color: '#1C1009', margin: '0 0 4px' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#444' },
  input: {
    padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #DDD', fontSize: '14px',
    outline: 'none', fontFamily: "'DM Sans', sans-serif"
  },
  error: { fontSize: '13px', color: '#C0392B', margin: 0 },
  success: { fontSize: '13px', color: '#27AE60', margin: 0 },
  submitBtn: {
    padding: '12px', background: '#1C1009', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '15px',
    fontWeight: '500', cursor: 'pointer', marginTop: '0.5rem',
    fontFamily: "'DM Sans', sans-serif"
  },
  toggleText: { textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '1rem' },
  toggleLink: { color: '#C47A2B', cursor: 'pointer', fontWeight: '500' }
};

export default VendorAuth;
