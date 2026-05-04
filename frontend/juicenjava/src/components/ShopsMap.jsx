import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const vendorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const communityIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const LAGOS_CENTER = [6.4550, 3.3841];

const ShopsMap = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState(LAGOS_CENTER);

  useEffect(() => {
    // Try to get user location, fall back to Lagos center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
        () => setUserCoords(LAGOS_CENTER)
      );
    }
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const [lat, lng] = userCoords;
        const res = await fetch(
          `https://juice-n-java-production.up.railway.app/api/shops/discover?lat=${lat}&lng=${lng}&radius=15`
        );
        const data = await res.json();
        setShops(data.shops || []);
      } catch (err) {
        setError('Could not load map data.');
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [userCoords]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Explore on the Map</h2>
          <p style={styles.subtitle}>
            {loading ? 'Loading shops...' : `${shops.length} spots near you`}
          </p>
        </div>
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#E67E22' }} /> Verified Vendors
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#2980B9' }} /> Community Spots
          </span>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.mapWrapper}>
        {!loading && (
          <MapContainer
            center={userCoords}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '16px' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {shops.map((shop, idx) => {
              if (!shop.latitude || !shop.longitude) return null;
              const icon = shop.source === 'vendor' ? vendorIcon : communityIcon;
              return (
                <Marker
                  key={shop.id || idx}
                  position={[shop.latitude, shop.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div style={styles.popup}>
                      <p style={styles.popupName}>{shop.name}</p>
                      {shop.address && <p style={styles.popupDetail}>📍 {shop.address}</p>}
                      {shop.distance !== undefined && (
                        <p style={styles.popupDetail}>📏 {shop.distance} km away</p>
                      )}
                      {shop.hours && <p style={styles.popupDetail}>🕒 {shop.hours}</p>}
                      {shop.source === 'vendor' && (
                        <span style={styles.verifiedBadge}>✓ Verified Vendor</span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
        {loading && (
          <div style={styles.loadingOverlay}>
            <p style={styles.loadingText}>☕ Mapping Lagos spots...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    padding: '3rem 2rem',
    background: '#FAF7F2',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1C1009',
    margin: '0 0 4px',
    fontFamily: "'DM Serif Display', serif",
  },
  subtitle: { fontSize: '14px', color: '#888', margin: 0 },
  legend: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  mapWrapper: {
    height: '480px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '0.5px solid #E0D8CC',
    position: 'relative',
  },
  loadingOverlay: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F0E8',
  },
  loadingText: { fontSize: '16px', color: '#888' },
  error: { fontSize: '14px', color: '#C0392B', marginBottom: '1rem' },
  popup: { fontFamily: "'DM Sans', sans-serif", minWidth: '160px' },
  popupName: { fontWeight: '600', fontSize: '14px', color: '#1C1009', margin: '0 0 6px' },
  popupDetail: { fontSize: '12px', color: '#555', margin: '2px 0' },
  verifiedBadge: {
    display: 'inline-block', marginTop: '6px',
    background: '#FEF3E2', color: '#C47A2B',
    fontSize: '11px', fontWeight: '600',
    padding: '2px 8px', borderRadius: '12px',
  },
};

export default ShopsMap;
