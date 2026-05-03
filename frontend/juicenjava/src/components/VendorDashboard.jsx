import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { PLANS, createCheckoutSession } from '../stripe';

const VendorDashboard = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCurrency, setSelectedCurrency] = useState('ngn');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const shopName = user?.user_metadata?.shop_name || 'Your Shop';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const { url } = await createCheckoutSession({
        currency: selectedCurrency,
        vendorEmail: user.email,
        shopName
      });
      window.location.href = url;
    } catch (err) {
      setCheckoutError('Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plan = PLANS[selectedCurrency];

  const tabs = ['overview', 'pricing', 'analytics'];

  return (
    <div style={styles.wrap}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span>☕</span>
          <span style={styles.sidebarLogoText}>Juice'n'Java</span>
        </div>

        <div style={styles.vendorInfo}>
          <div style={styles.avatar}>{shopName.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.vendorName}>{shopName}</p>
            <p style={styles.vendorEmail}>{user.email}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {tabs.map(tab => (
            <button
              key={tab}
              style={{ ...styles.navBtn, ...(activeTab === tab ? styles.navBtnActive : {}) }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📊 '}
              {tab === 'pricing' && '💳 '}
              {tab === 'analytics' && '📈 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <button style={styles.signOutBtn} onClick={handleSignOut}>
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h1 style={styles.pageTitle}>Welcome back, {shopName} 👋</h1>
            <p style={styles.pageSubtitle}>Here's how your listing is performing</p>

            <div style={styles.statsGrid}>
              {[
                { label: 'Profile Views', value: '—', note: 'This month' },
                { label: 'Saves / Favourites', value: '—', note: 'All time' },
                { label: 'Review Score', value: '—', note: 'Avg rating' },
                { label: 'Plan', value: 'Free', note: 'Upgrade for more' },
              ].map(s => (
                <div key={s.label} style={styles.statCard}>
                  <p style={styles.statLabel}>{s.label}</p>
                  <p style={styles.statValue}>{s.value}</p>
                  <p style={styles.statNote}>{s.note}</p>
                </div>
              ))}
            </div>

            <div style={styles.ctaBanner}>
              <div>
                <p style={styles.ctaTitle}>Upgrade to Pro</p>
                <p style={styles.ctaText}>Get featured placement, analytics, and verified badge.</p>
              </div>
              <button style={styles.ctaBtn} onClick={() => setActiveTab('pricing')}>
                See Plans →
              </button>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div>
            <h1 style={styles.pageTitle}>Choose Your Plan</h1>
            <p style={styles.pageSubtitle}>Get more visibility and grow your customer base</p>

            {/* Currency Toggle */}
            <div style={styles.currencyToggle}>
              {['ngn', 'usd'].map(c => (
                <button
                  key={c}
                  style={{ ...styles.currencyBtn, ...(selectedCurrency === c ? styles.currencyBtnActive : {}) }}
                  onClick={() => setSelectedCurrency(c)}
                >
                  {c === 'ngn' ? '🇳🇬 NGN' : '🇺🇸 USD'}
                </button>
              ))}
            </div>

            <div style={styles.plansGrid}>
              {/* Free Plan */}
              <div style={styles.planCard}>
                <p style={styles.planName}>Free</p>
                <p style={styles.planPrice}>₦0 <span style={styles.planPer}>/ month</span></p>
                <ul style={styles.featureList}>
                  {['Basic listing', 'Show on map', 'Customer reviews', 'Standard placement'].map(f => (
                    <li key={f} style={styles.featureItem}>✓ {f}</li>
                  ))}
                </ul>
                <button style={styles.planBtnGhost} disabled>Current Plan</button>
              </div>

              {/* Pro Plan */}
              <div style={{ ...styles.planCard, ...styles.planCardPro }}>
                <div style={styles.popularBadge}>Most Popular</div>
                <p style={styles.planName}>Pro</p>
                <p style={styles.planPrice}>
                  {plan.symbol}{plan.amount}
                  <span style={styles.planPer}> / month</span>
                </p>
                <ul style={styles.featureList}>
                  {[
                    'Everything in Free',
                    'Featured placement',
                    'Verified badge',
                    'Analytics dashboard',
                    'Priority support',
                    'Promotional banners'
                  ].map(f => (
                    <li key={f} style={styles.featureItem}>✓ {f}</li>
                  ))}
                </ul>
                {checkoutError && <p style={styles.checkoutError}>{checkoutError}</p>}
                <button
                  style={styles.planBtnPro}
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Redirecting...' : `Upgrade — ${plan.label}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h1 style={styles.pageTitle}>Analytics</h1>
            <p style={styles.pageSubtitle}>Detailed analytics are available on the Pro plan</p>
            <div style={styles.lockedCard}>
              <p style={{ fontSize: '48px', margin: '0 0 1rem' }}>🔒</p>
              <p style={styles.lockedTitle}>Upgrade to unlock Analytics</p>
              <p style={styles.lockedText}>See page views, saves, peak hours, and customer demographics.</p>
              <button style={styles.ctaBtn} onClick={() => setActiveTab('pricing')}>
                View Plans →
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const styles = {
  wrap: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#F5F0E8' },
  sidebar: {
    width: '240px', background: '#1C1009', padding: '1.5rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0
  },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0.5rem' },
  sidebarLogoText: { color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '16px' },
  vendorInfo: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', background: 'rgba(255,255,255,0.08)', borderRadius: '10px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#C47A2B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '16px', flexShrink: 0 },
  vendorName: { color: '#fff', fontSize: '13px', fontWeight: '500', margin: 0 },
  vendorEmail: { color: '#888', fontSize: '11px', margin: 0, wordBreak: 'break-all' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navBtn: { background: 'none', border: 'none', color: '#AAA', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" },
  navBtnActive: { background: 'rgba(255,255,255,0.12)', color: '#fff' },
  signOutBtn: { background: 'none', border: '1px solid #444', color: '#AAA', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" },
  main: { flex: 1, padding: '2.5rem', overflowY: 'auto' },
  pageTitle: { fontSize: '26px', fontWeight: '600', color: '#1C1009', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#888', margin: '0 0 2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.25rem', border: '0.5px solid #E0D8CC' },
  statLabel: { fontSize: '12px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '28px', fontWeight: '600', color: '#1C1009', margin: '0 0 4px' },
  statNote: { fontSize: '11px', color: '#AAA', margin: 0 },
  ctaBanner: { background: '#1C1009', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  ctaTitle: { color: '#fff', fontWeight: '600', fontSize: '16px', margin: '0 0 4px' },
  ctaText: { color: '#AAA', fontSize: '13px', margin: 0 },
  ctaBtn: { background: '#C47A2B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" },
  currencyToggle: { display: 'flex', gap: '8px', marginBottom: '1.5rem' },
  currencyBtn: { padding: '8px 20px', borderRadius: '20px', border: '1px solid #DDD', background: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" },
  currencyBtnActive: { background: '#1C1009', color: '#fff', border: '1px solid #1C1009' },
  plansGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '720px' },
  planCard: { background: '#fff', borderRadius: '16px', padding: '2rem', border: '0.5px solid #E0D8CC', position: 'relative' },
  planCardPro: { border: '2px solid #C47A2B' },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#C47A2B', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' },
  planName: { fontSize: '18px', fontWeight: '600', color: '#1C1009', margin: '0 0 8px' },
  planPrice: { fontSize: '32px', fontWeight: '700', color: '#1C1009', margin: '0 0 1.5rem' },
  planPer: { fontSize: '14px', fontWeight: '400', color: '#888' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  featureItem: { fontSize: '14px', color: '#444' },
  planBtnGhost: { width: '100%', padding: '12px', border: '1px solid #DDD', borderRadius: '8px', background: '#F5F5F5', color: '#AAA', cursor: 'not-allowed', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" },
  planBtnPro: { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#1C1009', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily: "'DM Sans', sans-serif" },
  checkoutError: { fontSize: '12px', color: '#C0392B', marginBottom: '8px' },
  lockedCard: { background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '0.5px solid #E0D8CC', maxWidth: '480px' },
  lockedTitle: { fontSize: '20px', fontWeight: '600', color: '#1C1009', margin: '0 0 8px' },
  lockedText: { fontSize: '14px', color: '#888', margin: '0 0 1.5rem' },
};

export default VendorDashboard;
