import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import AuthModal from './components/AuthModal';
import VendorDashboard from './components/VendorDashboard';
import ShopsMap from './components/ShopsMap';
import './App.css';

const API = 'https://juice-n-java-production.up.railway.app/api';

const CURATED = [
  { id: "c1", name: "Cafe Neo (Sabo)", category: "coffee", rating: 4.8, review_count: 124, address: "Commercial Ave, Sabo Yaba", amenities: ["Wi-Fi","Seating"], hours: "Mon-Sun 7am-10pm", phone: "+234 800 000 0001", photo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80", color: "#c8743a", description: "A beloved community café known for specialty coffee and warm vibes." },
  { id: "c2", name: "Vibe by Caliente", category: "juice", rating: 4.5, review_count: 89, address: "Yaba, Lagos", amenities: ["Outdoor","Seating"], hours: "Mon-Sat 8am-9pm", phone: "+234 800 000 0002", photo_url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80", color: "#e8a87c", description: "Fresh juices and smoothies made from locally sourced Lagos fruits." },
  { id: "c3", name: "My Coffee Lagos", category: "coffee", rating: 4.7, review_count: 56, address: "Yaba Tech Area", amenities: ["Wi-Fi","Outlets","Seating"], hours: "Mon-Fri 7am-9pm", phone: "+234 800 000 0003", photo_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", color: "#3d2b1f", description: "A haven for remote workers and coffee enthusiasts in the heart of Yaba." },
];

const CATEGORY_IMGS = {
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
  matcha: "https://images.unsplash.com/photo-1515696955266-4f67e13219e8?q=80&w=800&auto=format&fit=crop",
  smoothie: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=800&auto=format&fit=crop",
  juice: "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=800&auto=format&fit=crop",
};

function Stars({ rating, size = 14 }) {
  return (
    <span style={{ color: '#C9900C', fontSize: size, letterSpacing: 1 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

function PriceLevel({ level = 2 }) {
  return (
    <span style={{ color: '#C9900C', fontSize: 13, fontWeight: 600 }}>
      {'$'.repeat(level)}<span style={{ opacity: 0.3 }}>{'$'.repeat(3 - level)}</span>
    </span>
  );
}

function StatusBadge({ status }) {
  const s = status || 'open';
  const map = { open: { label: 'Open', bg: '#dcfce7', color: '#16a34a' }, busy: { label: 'Busy', bg: '#fef9c3', color: '#ca8a04' }, closing: { label: 'Closing Soon', bg: '#fee2e2', color: '#dc2626' } };
  const cfg = map[s] || map.open;
  return <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>● {cfg.label}</span>;
}

// ── Shop Modal ────────────────────────────────────────────────
function ShopModal({ shop, user, onClose, saved, onSave }) {
  const [tab, setTab] = useState('menu');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    fetch(`${API}/reviews/${encodeURIComponent(shop.name)}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [shop.name]);

  const submitReview = async () => {
    if (!user) { setReviewError('Please sign in to leave a review.'); return; }
    if (myRating === 0) { setReviewError('Please select a rating.'); return; }
    if (!reviewText.trim()) { setReviewError('Please write a comment.'); return; }
    setSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shop.name,
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          rating: myRating,
          comment: reviewText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setReviewSuccess('Review submitted!');
      setMyRating(0);
      setReviewText('');
      const updated = await fetch(`${API}/reviews/${encodeURIComponent(shop.name)}`).then(r => r.json());
      setReviews(updated.reviews || []);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const icon = { coffee: '☕', matcha: '🍵', smoothie: '🥤', juice: '🍊', tea: '🫖' };
  const shopColor = shop.color || '#c8743a';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hero" style={{ background: shopColor }}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <div style={{ fontSize: 44 }}>{icon[shop.category] || '☕'}</div>
          <div className="modal-shop-name">{shop.name}</div>
          <div className="modal-shop-address">{shop.address}</div>
          <div className="modal-meta-row">
            <StatusBadge status={shop.status} />
            {shop.distance && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>📍 {shop.distance} km</span>}
            <Stars rating={shop.rating || 4.5} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{shop.rating || '4.5'} ({shop.review_count || 0})</span>
            <button onClick={() => onSave(shop.id || shop.name)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 9999, padding: '4px 14px', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>
        {shop.description && (
          <div style={{ padding: '14px 28px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, margin: 0 }}>{shop.description}</p>
          </div>
        )}
        <div className="modal-tabs">
          {['menu', 'reviews', 'info'].map(t => (
            <button key={t} className={`modal-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'menu' && (
            <div>
              <p className="form-label" style={{ marginBottom: 14, letterSpacing: '0.08em' }}>Menu Highlights</p>
              {shop.menu?.length ? shop.menu.map(item => (
                <div key={item.name} className="menu-item">
                  <span className="menu-item-name">{item.name}</span>
                  <span className="menu-item-price">{item.price}</span>
                </div>
              )) : <p style={{ color: 'var(--muted-brown)', fontSize: 14 }}>Menu details coming soon.</p>}
            </div>
          )}
          {tab === 'reviews' && (
            <div>
              {loadingReviews ? <p style={{ color: 'var(--muted-brown)', fontSize: 14 }}>Loading reviews...</p> : reviews.length === 0 ? <p style={{ color: 'var(--muted-brown)', fontSize: 14 }}>No reviews yet. Be the first!</p> : reviews.map((r, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <span className="review-user">{r.user_name || 'Anonymous'}</span>
                    <Stars rating={r.rating} size={13} />
                  </div>
                  <p className="review-text">{r.comment}</p>
                </div>
              ))}
              <div className="write-review">
                <h4>Write a Review</h4>
                <div className="star-picker">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} className="star-btn" onClick={() => setMyRating(s)}>
                      <span style={{ color: s <= myRating ? '#f59e0b' : '#e5d0b0' }}>★</span>
                    </button>
                  ))}
                </div>
                <textarea className="review-input" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." />
                {reviewError && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0' }}>{reviewError}</p>}
                {reviewSuccess && <p style={{ color: '#16a34a', fontSize: 13, margin: '4px 0' }}>{reviewSuccess}</p>}
                <button className="btn btn-amber btn-sm" onClick={submitReview} disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </div>
          )}
          {tab === 'info' && (
            <div>
              {[
                { icon: '🕐', label: 'HOURS', value: shop.hours || 'Mon-Sun 8am-9pm' },
                { icon: '📍', label: 'ADDRESS', value: shop.address },
                { icon: '📞', label: 'PHONE', value: shop.phone || 'N/A' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="info-row">
                  <span className="info-icon">{icon}</span>
                  <div>
                    <div className="info-label">{label}</div>
                    <div className="info-value">{value}</div>
                  </div>
                </div>
              ))}
              {shop.amenities?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="info-label" style={{ marginBottom: 10 }}>AMENITIES</div>
                  <div className="shop-tags">
                    {shop.amenities.map(t => <span key={t} className="shop-tag">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shop Card ─────────────────────────────────────────────────
function ShopCard({ shop, onSelect, saved, onSave }) {
  const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800';
  return (
    <div className="shop-card" onClick={() => onSelect(shop)}>
      <div className="shop-card-image" style={{ backgroundImage: `url(${shop.photo_url || shop.image_url || fallback})` }}>
        <div className="shop-card-badges"><StatusBadge status={shop.status} /></div>
        <button className={`shop-card-save ${saved ? 'saved' : ''}`} onClick={e => { e.stopPropagation(); onSave(shop.id || shop.name); }}>
          {saved ? '♥' : '♡'}
        </button>
      </div>
      <div className="shop-card-body">
        <div className="shop-card-top">
          <span className="shop-card-name">{shop.name}</span>
          <PriceLevel level={shop.price_level || 2} />
        </div>
        <div className="shop-card-rating">
          <Stars rating={shop.rating || 4.5} />
          <span className="shop-card-rating-num">{shop.rating || '4.5'}</span>
          <span className="shop-card-rating-count">({shop.review_count || 0})</span>
        </div>
        {shop.amenities?.length > 0 && (
          <div className="shop-tags">
            {shop.amenities.slice(0, 3).map(t => <span key={t} className="shop-tag">{t}</span>)}
          </div>
        )}
        <div className="shop-card-meta">
          <span className="shop-card-meta-item">📍 {shop.address || 'Lagos'}</span>
          <span className="shop-card-meta-item">🕐 {shop.hours ? shop.hours.split('·')[0].trim() : 'Mon-Sun 8am-9pm'}</span>
        </div>
      </div>
    </div>
  );
}

// ── Discover Page ─────────────────────────────────────────────
function DiscoverPage({ shops, onSelect, saved, onSave, initialCategory }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || 'all');
  const [sort, setSort] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', 'coffee', 'matcha', 'tea', 'smoothie', 'juice'];
  const sorts = ['distance', 'rating', 'price', 'popularity'];

  const chipStyle = active => ({
    padding: '6px 16px', borderRadius: 9999,
    border: `1.5px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
    background: active ? 'var(--amber)' : 'var(--bg-card)',
    color: active ? 'white' : 'var(--muted-brown)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", textTransform: 'capitalize',
    transition: 'all 0.18s',
  });

  const filtered = shops.filter(s => {
    if (category !== 'all' && s.category !== category && s.drink_types !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !(s.address || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'distance') return (a.distance || 99) - (b.distance || 99);
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'price') return (a.price_level || 2) - (b.price_level || 2);
    return (b.review_count || 0) - (a.review_count || 0);
  });

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '20px 6%', position: 'sticky', top: 68, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: showFilters ? 20 : 0 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cafés, neighbourhoods, drinks..." className="form-input" style={{ paddingLeft: 42, fontSize: 15 }} />
            </div>
            <button onClick={() => setShowFilters(f => !f)} className={`btn ${showFilters ? 'btn-espresso' : 'btn-ghost'} btn-sm`}>⚙ Filters</button>
          </div>
          {showFilters && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Drink Type</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {categories.map(c => <button key={c} style={chipStyle(category === c)} onClick={() => setCategory(c)}>{c}</button>)}
                </div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Sort By</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sorts.map(s => <button key={s} style={chipStyle(sort === s)} onClick={() => setSort(s)}>{s}</button>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>{filtered.length} {filtered.length === 1 ? 'spot' : 'spots'} found</h2>
          <span style={{ fontSize: 14, color: 'var(--muted-brown)' }}>📍 Lagos</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted-brown)' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: 'var(--body-brown)', marginBottom: 8 }}>No results found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="featured-grid">
            {filtered.map((shop, idx) => (
              <ShopCard key={shop.id || shop._id || idx} shop={shop} onSelect={onSelect} saved={saved.includes(shop.id || shop.name)} onSave={onSave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Why Section ───────────────────────────────────────────────
function WhySection() {
  const features = [
    { icon: '📍', title: 'Location-Based Discovery', desc: 'Find the perfect spot near you with real-time location search and smart recommendations.' },
    { icon: '⭐', title: 'Authentic Reviews', desc: 'Read honest reviews from real coffee lovers. Rate and share your own experiences.' },
    { icon: '🏪', title: 'For Shop Owners', desc: 'Claim your listing, showcase your menu, and connect with customers who love great beverages.' },
    { icon: '📈', title: 'Analytics & Insights', desc: 'Premium vendors get detailed analytics on visits, reviews, and customer trends.' },
  ];
  return (
    <section className="why-section" id="about">
      <div className="container">
        <div className="section-header">
          <h2>Why Juice'n'Java?</h2>
          <p>We're building the best way to discover and share great beverage spots.</p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon-wrap">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────
function CTASection({ onListShop }) {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-banner">
          <div className="cta-content">
            <h2>Own a Coffee Shop?</h2>
            <p>Join hundreds of local vendors on Juice'n'Java. Claim your listing, showcase your menu, and connect with customers who love great coffee.</p>
            <button className="btn btn-amber" onClick={onListShop}>🏪 List Your Shop</button>
          </div>
          <div className="cta-card">
            <div className="cta-card-top">
              <div className="cta-card-icon">📈</div>
              <div>
                <div className="cta-card-title">Get Found</div>
                <div className="cta-card-sub">By local customers</div>
              </div>
            </div>
            <div className="cta-feature-list">
              {['Free basic listing', 'Menu & photo updates', 'Customer analytics', 'Promotion tools'].map(item => (
                <div key={item} className="cta-feature-item"><span className="cta-check">✓</span>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>☕</div>
            </div>
            <div className="footer-brand-name">Juice'n'Java</div>
            <p className="footer-desc">The best way to discover, review, and share great beverage spots in your city.</p>
          </div>
          {[
            { title: 'Discover', links: ['Browse Shops', 'Top Rated', 'New Openings', 'Near Me'] },
            { title: 'For Vendors', links: ['List Your Shop', 'Premium Plans', 'Analytics', 'Support'] },
            { title: 'Company', links: ['About Us', 'Blog', 'Privacy Policy', 'Terms'] },
          ].map(col => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <div className="footer-links">
                {col.links.map(l => <a key={l} href="#!">{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {new Date().getFullYear()} Juice'n'Java. All rights reserved.</span>
          <span style={{ fontSize: 13 }}>Built with ☕ · Lagos, Nigeria</span>
        </div>
      </div>
    </footer>
  );
}

// ── Root App ──────────────────────────────────────────────────
const App = () => {
  const [shops, setShops] = useState(CURATED);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [authModal, setAuthModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [savedShops, setSavedShops] = useState([]);
  const [discoverCategory, setDiscoverCategory] = useState('all');

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

  useEffect(() => {
    fetch(`${API}/shops/discover?lat=6.455&lng=3.384&radius=20`)
      .then(r => r.json())
      .then(d => { if (d.shops?.length > 0) setShops(d.shops); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setAuthModal(null);
    if (user?.user_metadata?.role === 'vendor') setView('vendor-dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('home');
  };

  const toggleSave = useCallback((id) => {
    if (!currentUser) { setAuthModal({ role: 'user', mode: 'signup' }); return; }
    setSavedShops(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [currentUser]);

  const isVendor = currentUser?.user_metadata?.role === 'vendor';

  const CRAVINGS = [
    { label: 'Coffee', icon: '☕', category: 'coffee', image: CATEGORY_IMGS.coffee },
    { label: 'Tea & Matcha', icon: '🍵', category: 'matcha', image: CATEGORY_IMGS.matcha },
    { label: 'Smoothies', icon: '🥤', category: 'smoothie', image: CATEGORY_IMGS.smoothie },
    { label: 'Fresh Juice', icon: '🍊', category: 'juice', image: CATEGORY_IMGS.juice },
  ];

  if (view === 'vendor-dashboard' && currentUser && isVendor) {
    return <VendorDashboard user={currentUser} onSignOut={handleSignOut} />;
  }

  return (
    <div className="App">
      {authModal && (
        <AuthModal initialRole={authModal.role} initialMode={authModal.mode} onAuthSuccess={handleAuthSuccess} onClose={() => setAuthModal(null)} />
      )}
      {selectedShop && (
        <ShopModal shop={selectedShop} user={currentUser} onClose={() => setSelectedShop(null)} saved={savedShops.includes(selectedShop.id || selectedShop.name)} onSave={toggleSave} />
      )}

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          <div className="navbar-logo">☕</div>
          <span className="navbar-name">Juice'n'Java</span>
        </div>
        <div className="navbar-links">
          <button className={`navbar-link ${view === 'discover' ? 'active' : ''}`} onClick={() => setView('discover')}>📍 Discover</button>
          <a href="#about" className="navbar-link">🏪 About</a>
          <button className="navbar-link" onClick={() => { if (currentUser && isVendor) setView('vendor-dashboard'); else setAuthModal({ role: 'vendor', mode: 'login' }); }}>📊 Vendors</button>
        </div>
        <div className="navbar-actions">
          {currentUser ? (
            <>
              {isVendor && <button className="btn btn-ghost btn-sm" onClick={() => setView('vendor-dashboard')}>My Dashboard</button>}
              <button className="btn btn-espresso btn-sm" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setAuthModal({ role: 'user', mode: 'login' })}>Sign In</button>
              <button className="btn btn-espresso btn-sm" onClick={() => setAuthModal({ role: 'user', mode: 'signup' })}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {view === 'discover' && (
        <>
          <DiscoverPage shops={shops} onSelect={setSelectedShop} saved={savedShops} onSave={toggleSave} initialCategory={discoverCategory} />
          <Footer />
        </>
      )}

      {view === 'home' && (
        <>
          {/* ── HERO ── */}
          <section className="hero">
            <div className="hero-bg" />
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge badge-amber">✨ Discover your next favorite spot</span>
              </div>
              <h1>Find Your <em>Perfect</em> Pour</h1>
              <p className="hero-sub">The best coffee shops, tea houses, and juice bars in Lagos. Real reviews, real community.</p>
              <div className="hero-actions">
                <button className="btn btn-espresso" onClick={() => setView('discover')}>🔍 Start Exploring</button>
                <button className="btn btn-ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setAuthModal({ role: 'vendor', mode: 'signup' })}>List Your Shop →</button>
              </div>
              <div className="hero-stats">
                {[{ num: '500+', label: 'Local Shops' }, { num: '10k+', label: 'Reviews' }, { num: '25k+', label: 'Coffee Lovers' }].map(s => (
                  <div key={s.label}>
                    <div className="hero-stat-number">{s.num}</div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CRAVINGS ── */}
          <section className="cravings-section">
            <div className="container">
              <div className="section-header">
                <h2>What's Your Craving?</h2>
                <p>From artisan espresso to refreshing smoothies, find exactly what you're in the mood for.</p>
              </div>
              <div className="cravings-grid">
                {CRAVINGS.map(c => (
                  <div key={c.label} className="craving-card" style={{ backgroundImage: `url(${c.image})` }} onClick={() => { setDiscoverCategory(c.category); setView('discover'); }} role="button" tabIndex={0}>
                    <div className="craving-card-content">
                      <div className="craving-card-icon">{c.icon}</div>
                      <h3>{c.label}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── MAP ── */}
          <ShopsMap />

          {/* ── FEATURED ── */}
          <section className="featured-section">
            <div className="container">
              <div className="section-header-row">
                <div>
                  <h2>Featured Spots</h2>
                  <p style={{ marginTop: 6 }}>Handpicked favourites from our community</p>
                </div>
                <button className="btn-text" onClick={() => setView('discover')}>View all →</button>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-brown)' }}>Fetching the best of Lagos...</div>
              ) : (
                <div className="featured-grid">
                  {shops.slice(0, 3).map((shop, idx) => (
                    <ShopCard key={shop.id || shop._id || idx} shop={shop} onSelect={setSelectedShop} saved={savedShops.includes(shop.id || shop.name)} onSave={toggleSave} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <WhySection />
          <CTASection onListShop={() => setAuthModal({ role: 'vendor', mode: 'signup' })} />
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;
