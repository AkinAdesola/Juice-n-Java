import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AuthModal from './components/AuthModal';
import VendorDashboard from './components/VendorDashboard';
import './App.css';
import ShopsMap from './components/ShopsMap';

const CURATED_LAGOS_SPOTS = [
  { id: "c1", name: "Cafe Neo (Sabo)", category: "coffee", rating: 4.8, review_count: 124, address: "Commercial Ave, Sabo Yaba", photo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80" },
  { id: "c2", name: "Vibe by Caliente", category: "juice", rating: 4.5, review_count: 89, address: "Yaba, Lagos", photo_url: "https://images.unsplash.com/photo-1622597467827-439933bc3956?w=600&q=80" },
  { id: "c3", name: "My Coffee Lagos", category: "coffee", rating: 4.7, review_count: 56, address: "Yaba Tech Area", photo_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80" },
];

const App = () => {
  const [shops, setShops] = useState(CURATED_LAGOS_SPOTS);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [authModal, setAuthModal] = useState(null); // { role, mode } | null
  const [currentUser, setCurrentUser] = useState(null);

  // Restore session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser(session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (!session?.user) setView('home');
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch shops from Railway backend
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch('https://juice-n-java-production.up.railway.app/api/shops');
        const data = await res.json();
        if (data && data.length > 0) setShops(data);
      } catch (err) {
        console.error('Failed to fetch shops:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModal(null);
    const role = user?.user_metadata?.role;
    if (role === 'vendor') setView('vendor-dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('home');
  };

  const isVendor = currentUser?.user_metadata?.role === 'vendor';

  const categories = [
    { name: 'Coffee', icon: '☕', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop' },
    { name: 'Tea & Matcha', icon: '🍵', img: 'https://images.unsplash.com/photo-1515696955266-4f67e13219e8?q=80&w=800&auto=format&fit=crop' },
    { name: 'Smoothies', icon: '🥤', img: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=800&auto=format&fit=crop' },
    { name: 'Fresh Juice', icon: '🍊', img: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format&fit=crop' },
  ];

  if (view === 'vendor-dashboard' && currentUser && isVendor) {
    return <VendorDashboard user={currentUser} onSignOut={handleSignOut} />;
  }

  return (
    <div className="app-container">
      {authModal && (
        <AuthModal
          initialRole={authModal.role}
          initialMode={authModal.mode}
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setAuthModal(null)}
        />
      )}

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo-section" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">☕</span>
            <span className="logo-text">Juice'n'Java</span>
          </div>
          <div className="nav-links">
            <a href="#discover" className="nav-link active">📍 Discover</a>
            <a href="#about" className="nav-link">🏪 About</a>
            <button
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => {
                if (currentUser && isVendor) setView('vendor-dashboard');
                else setAuthModal({ role: 'vendor', mode: 'login' });
              }}
            >
              📊 Vendors
            </button>
          </div>
          <div className="nav-auth">
            {currentUser ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isVendor && (
                  <button className="btn-get-started" onClick={() => setView('vendor-dashboard')}>
                    My Dashboard
                  </button>
                )}
                <button className="btn-sign-in" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <>
                <button className="btn-sign-in" onClick={() => setAuthModal({ role: 'user', mode: 'login' })}>
                  Sign In
                </button>
                <button className="btn-get-started" onClick={() => setAuthModal({ role: 'user', mode: 'signup' })}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="promo-badge">✨ Discover your next favorite spot</div>
            <h1>Find Your <span className="accent">Perfect</span> Pour</h1>
            <p className="hero-subtitle">The best coffee shops, tea houses, and juice bars in Lagos. Real reviews, real community.</p>
            <div className="hero-cta">
              <button className="btn-primary">🔍 Start Exploring</button>
              <button className="btn-secondary" onClick={() => setAuthModal({ role: 'vendor', mode: 'signup' })}>
                List Your Shop →
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item"><span className="stat-number">500+</span><span className="stat-label">Local Shops</span></div>
              <div className="stat-item"><span className="stat-number">10k+</span><span className="stat-label">Reviews</span></div>
              <div className="stat-item"><span className="stat-number">25k+</span><span className="stat-label">Coffee Lovers</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* Cravings Section */}
      <section className="cravings-section">
        <div className="section-intro">
          <h2>What's Your Craving?</h2>
          <p>Find exactly what you're in the mood for.</p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat.name} className="category-card" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${cat.img})` }}>
              <div className="category-label"><span>{cat.icon} {cat.name}</span></div>
            </div>
          ))}
        </div>
      </section>

      <ShopsMap />

      {/* Featured Spots */}
      <section id="discover" className="featured-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2>Featured Spots</h2>
            <p>Handpicked favourites from the community</p>
          </div>
          <button className="view-all-link">View all →</button>
        </div>
        <div className="shop-grid">
          {loading ? (
            <div className="loading-spinner">Fetching the best of Lagos...</div>
          ) : (
            shops.map((shop) => (
              <div key={shop.id || shop._id} className="shop-card">
                <div className="card-image" style={{ backgroundImage: `url(${shop.photo_url || shop.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800'})` }}>
                  <div className="card-badges">
                    <span className="status-pill open">● Open</span>
                    <button
                      className="heart-btn"
                      onClick={() => !currentUser && setAuthModal({ role: 'user', mode: 'signup' })}
                    >♡</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-header-row">
                    <h3>{shop.name}</h3>
                    <span className="price-tag">$$</span>
                  </div>
                  <div className="rating-row">
                    <span className="stars">★★★★★</span>
                    <span className="rating-text">{shop.rating || '4.5'} ({shop.review_count || shop.reviews_count || '0'})</span>
                  </div>
                  <div className="card-footer">
                    <span>📍 {shop.address || shop.neighborhood || 'Lagos'}</span>
                    <span>🕒 Open until 9pm</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
