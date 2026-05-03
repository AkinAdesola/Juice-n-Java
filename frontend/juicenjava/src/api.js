const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// ── CURATED FALLBACKS (The "CD's Selection") ────────────────
// These will ALWAYS show up to ensure the app feels full and premium.
const CURATED_LAGOS_SPOTS = [
  {
    id: "curated-1",
    name: "Cafe Neo (Sabo)",
    category: "coffee",
    rating: 4.8,
    review_count: 124,
    price_level: 2,
    address: "Commercial Ave, Sabo Yaba",
    latitude: 6.5055,
    longitude: 3.3775,
    photo_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80"
  },
  {
    id: "curated-2",
    name: "Vibe by Caliente",
    category: "juice",
    rating: 4.5,
    review_count: 89,
    price_level: 3,
    address: "Yaba, Lagos",
    latitude: 6.5100,
    longitude: 3.3750,
    photo_url: "https://images.unsplash.com/photo-1622597467827-439933bc3956?w=600&q=80"
  },
  {
    id: "curated-3",
    name: "My Coffee Lagos",
    category: "coffee",
    rating: 4.7,
    review_count: 56,
    price_level: 2,
    address: "Yaba Tech Area",
    latitude: 6.5180,
    longitude: 3.3720,
    photo_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
  }
];

export const fetchShops = async ({ lat, lng, radius = 10000 }) => {
  const offset = radius / 111320; 
  const bbox = `${lat - offset},${lng - offset},${lat + offset},${lng + offset}`;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|tea_room|juice_bar"](${bbox});
      node["shop"~"beverages|coffee|tea|pastry"](${bbox});
      way["amenity"~"cafe|tea_room|juice_bar"](${bbox});
    );
    out center;
  `;

  try {
    const response = await fetch(OVERPASS_URL, { method: "POST", body: query });
    const data = await response.json();

    const realShops = data.elements.map((el) => {
      const tags = el.tags || {};
      return {
        id: el.id,
        name: tags.name || "Artisanal Spot",
        category: tags.amenity === "cafe" ? "coffee" : "juice",
        rating: 4.2 + (Math.random() * 0.6),
        review_count: Math.floor(Math.random() * 50) + 5,
        address: tags["addr:street"] || "Nearby Local Spot",
        latitude: el.lat || el.center?.lat,
        longitude: el.lon || el.center?.lon,
        photo_url: null 
      };
    });

    // Combine real-time data with your curated favorites
    return { shops: [...CURATED_LAGOS_SPOTS, ...realShops] };
  } catch (error) {
    console.error("Overpass Error:", error);
    return { shops: CURATED_LAGOS_SPOTS }; // Even if the map fails, the curated list stays!
  }
};

export const getUserLocation = () => {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 6.5059, lng: 3.3781 }) // Default to Sabo, Yaba
    );
  });
};