import React, { useState, useEffect } from 'react';

const API = 'https://juice-n-java-production.up.railway.app/api';

const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '6px', margin: '0.5rem 0' }}>
    {[1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        onClick={() => onChange(star)}
        style={{
          fontSize: '28px',
          cursor: 'pointer',
          color: star <= value ? '#C47A2B' : '#DDD',
          transition: 'color 0.15s'
        }}
      >★</span>
    ))}
  </div>
);

const ReviewModal = ({ shop, user, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API}/reviews/${encodeURIComponent(shop.name)}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setError('Please sign in to leave a review.'); return; }
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!comment.trim()) { setError('Please write a comment.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shop.name,
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0],
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit review');
      setSuccess('Review submitted!');
      setRating(0);
      setComment('');
      fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        <div style={styles.shopHeader}>
          <h2 style={styles.shopName}>{shop.name}</h2>
          <p style={styles.shopAddress}>📍 {shop.address || 'Lagos'}</p>
        </div>

        {/* Write a review */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            {user ? 'Write a Review' : 'Sign in to leave a review'}
          </h3>
          {user ? (
            <form onSubmit={handleSubmit}>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                style={styles.textarea}
                placeholder="Share your experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div style={styles.charCount}>{comment.length}/500</div>
              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}
              <button style={styles.submitBtn} type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p style={styles.signInNote}>
              You need to be signed in as a customer to leave a review.
            </p>
          )}
        </div>

        <hr style={styles.divider} />

        {/* Existing reviews */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            {loadingReviews ? 'Loading reviews...' : `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}`}
          </h3>
          {!loadingReviews && reviews.length === 0 && (
            <p style={styles.noReviews}>No reviews yet. Be the first!</p>
          )}
          <div style={styles.reviewList}>
            {reviews.map((r, idx) => (
              <div key={idx} style={styles.reviewCard}>
                <div style={styles.reviewTop}>
                  <div style={styles.reviewAvatar}>
                    {(r.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.reviewAuthor}>{r.user_name || 'Anonymous'}</p>
                    <p style={styles.reviewDate}>{formatDate(r.created_at)}</p>
                  </div>
                  <div style={styles.reviewStars}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                </div>
                <p style={styles.reviewComment}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
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
    width: '100%', maxWidth: '480px', position: 'relative',
    fontFamily: "'DM Sans', sans-serif", maxHeight: '85vh',
    overflowY: 'auto'
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'none', border: 'none', fontSize: '16px',
    cursor: 'pointer', color: '#888'
  },
  shopHeader: { marginBottom: '1.5rem' },
  shopName: { fontSize: '20px', fontWeight: '600', color: '#1C1009', margin: '0 0 4px', fontFamily: "'DM Serif Display', serif" },
  shopAddress: { fontSize: '13px', color: '#888', margin: 0 },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#1C1009', margin: '0 0 1rem' },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #DDD', fontSize: '14px', resize: 'vertical',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box'
  },
  charCount: { fontSize: '11px', color: '#AAA', textAlign: 'right', marginTop: '4px' },
  error: { fontSize: '13px', color: '#C0392B', margin: '8px 0 0' },
  success: { fontSize: '13px', color: '#27AE60', margin: '8px 0 0' },
  submitBtn: {
    marginTop: '1rem', padding: '10px 24px', background: '#1C1009',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
  },
  signInNote: { fontSize: '14px', color: '#888' },
  divider: { border: 'none', borderTop: '0.5px solid #EEE', margin: '0 0 1.5rem' },
  noReviews: { fontSize: '14px', color: '#AAA' },
  reviewList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  reviewCard: { padding: '1rem', background: '#FAF7F2', borderRadius: '10px' },
  reviewTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  reviewAvatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: '#C47A2B', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '600', flexShrink: 0
  },
  reviewAuthor: { fontSize: '13px', fontWeight: '600', color: '#1C1009', margin: 0 },
  reviewDate: { fontSize: '11px', color: '#AAA', margin: 0 },
  reviewStars: { marginLeft: 'auto', color: '#C47A2B', fontSize: '14px' },
  reviewComment: { fontSize: '13px', color: '#444', margin: 0, lineHeight: '1.5' },
};

export default ReviewModal;
