import os
import math
import asyncio
from typing import Optional
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime
import httpx
import logging
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://juice-n-java.vercel.app")
PRICE_IDS = {
    "usd": "price_1TPlUzEhvCgzDmTejr4dFmIB",
    "ngn": "price_1TQ7VLEhvCgzDmTeRDdElnyU",
}

app = FastAPI(title="Juice n Java API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://juice-n-java.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = mongo_client.juicenjava

FALLBACK_SHOPS = [
    {"id": "f1", "name": "Roast and Ground", "latitude": 6.451, "longitude": 3.389, "source": "community", "distance": 0.7, "address": "Palms Shopping Mall, Lekki Phase 1", "hours": "Mon-Sun 8am-9pm", "phone": "+234 800 000 0007"},
    {"id": "f2", "name": "My Coffee House", "latitude": 6.4379, "longitude": 3.4122, "source": "community", "distance": 3.64, "address": "15 Akin Adesola St, Victoria Island", "hours": "Mon-Fri 7am-9pm", "phone": "+234 800 000 0002"},
    {"id": "f3", "name": "Purple Jasmine Cafe", "latitude": 6.4428, "longitude": 3.421, "source": "community", "distance": 4.3, "address": "10 Adeola Odeku St, Victoria Island", "hours": "Mon-Sun 8am-10pm", "phone": "+234 800 000 0003"},
    {"id": "f4", "name": "Lobby Cafe", "latitude": 6.435, "longitude": 3.423, "source": "community", "distance": 4.84, "address": "Eko Hotel and Suites, Victoria Island", "hours": "Daily 6am-11pm", "phone": "+234 800 000 0004"},
    {"id": "f5", "name": "Cafe Neo Fourteen36", "latitude": 6.4314, "longitude": 3.4263, "source": "community", "distance": 5.35, "address": "1436 Sanusi Fafunwa St, Victoria Island", "hours": "Daily 7am-10pm", "phone": "+234 800 000 0006"},
    {"id": "f6", "name": "Cafe Neo Landmark", "latitude": 6.4229, "longitude": 3.4479, "source": "community", "distance": 7.9, "address": "Landmark Village, Victoria Island", "hours": "Mon-Sun 7am-10pm", "phone": "+234 800 000 0001"},
    {"id": "f7", "name": "Artisan Coffee Lagos", "latitude": 6.4402, "longitude": 3.4601, "source": "community", "distance": 8.56, "address": "12 Bode Thomas St, Surulere", "hours": "Mon-Fri 7am-8pm", "phone": "+234 800 000 0008"},
    {"id": "f8", "name": "Lagos Tea House", "latitude": 6.4475, "longitude": 3.4692, "source": "community", "distance": 9.44, "address": "235 Igbosere Rd, Lagos Island", "hours": "Mon-Sat 9am-8pm", "phone": "+234 800 000 0005"},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

async def fetch_external_shops(lat, lng, radius):
    try:
        capped = min(int(radius * 1000), 50000)
        query = f'[out:json][timeout:15];node["amenity"="cafe"](around:{capped},{lat},{lng});out body qt 80;'
        async with httpx.AsyncClient(timeout=20.0) as c:
            r = await c.post("https://overpass-api.de/api/interpreter", data=query)
            if r.status_code != 200:
                return []
            elements = r.json().get("elements", [])
            return [{"id": f"osm_{n['id']}", "name": n.get("tags", {}).get("name", "Local Cafe"),
                     "latitude": n["lat"], "longitude": n["lon"], "source": "community",
                     "distance": round(haversine_distance(lat, lng, n["lat"], n["lon"]), 2)} for n in elements]
    except Exception as e:
        logging.warning(f"Overpass error: {e}")
        return []

@api_router.get("/shops/discover")
async def discover_shops(lat: float, lng: float, radius: float = 5.0, drink_type: Optional[str] = None):
    vendor_list = []
    try:
        query = {"status": "active"}
        if drink_type and drink_type != "all":
            query["drink_types"] = drink_type
        vendors = await asyncio.wait_for(
            db.shops.find(query, {"_id": 0}).to_list(100),
            timeout=3.0
        )
        for s in vendors:
            d = haversine_distance(lat, lng, s["latitude"], s["longitude"])
            if d <= radius:
                s["distance"] = round(d, 2)
                s["source"] = "vendor"
                vendor_list.append(s)
    except Exception as e:
        logging.warning(f"DB unavailable: {e}")
    external = await fetch_external_shops(lat, lng, radius)
    if not external and not vendor_list:
        for shop in FALLBACK_SHOPS:
            shop["distance"] = round(haversine_distance(lat, lng, shop["latitude"], shop["longitude"]), 2)
        external = sorted(FALLBACK_SHOPS, key=lambda x: x["distance"])
    combined = sorted(vendor_list + external, key=lambda x: x["distance"])
    return {"shops": combined, "total": len(combined), "address_coords": [lat, lng]}

# ── REVIEWS ─────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    shop_name: str
    user_id: str
    user_email: str
    user_name: str
    rating: int
    comment: str

@api_router.post("/reviews")
async def create_review(review: ReviewCreate):
    if not 1 <= review.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    if not review.comment.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    # Check if user already reviewed this shop
    existing = await db.reviews.find_one({
        "shop_name": review.shop_name,
        "user_id": review.user_id
    })
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this shop")

    doc = {
        "shop_name": review.shop_name,
        "user_id": review.user_id,
        "user_email": review.user_email,
        "user_name": review.user_name,
        "rating": review.rating,
        "comment": review.comment.strip(),
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.reviews.insert_one(doc)

    # Update shop's average rating and review count
    all_reviews = await db.reviews.find(
        {"shop_name": review.shop_name}, {"rating": 1}
    ).to_list(1000)
    avg = round(sum(r["rating"] for r in all_reviews) / len(all_reviews), 1)
    await db.shops.update_one(
        {"name": review.shop_name},
        {"$set": {"rating": avg, "review_count": len(all_reviews)}}
    )

    return {"message": "Review submitted", "rating": review.rating}

@api_router.get("/reviews/{shop_name}")
async def get_reviews(shop_name: str):
    reviews = await db.reviews.find(
        {"shop_name": shop_name},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else 0
    return {
        "shop_name": shop_name,
        "reviews": reviews,
        "total": len(reviews),
        "average_rating": avg
    }

# ── STRIPE ──────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    currency: str
    vendor_email: str
    shop_name: str

@api_router.post("/vendor/subscribe")
async def create_checkout_session(req: CheckoutRequest):
    currency = req.currency.lower()
    if currency not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Currency must be usd or ngn")
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=req.vendor_email,
            line_items=[{"price": PRICE_IDS[currency], "quantity": 1}],
            metadata={"shop_name": req.shop_name, "currency": currency},
            success_url=f"{FRONTEND_URL}/vendor?subscribed=true",
            cancel_url=f"{FRONTEND_URL}/vendor?subscribed=false",
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except Exception as e:
        logging.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/vendor/subscription-status")
async def subscription_status(email: str):
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if not customers.data:
            return {"status": "free", "plan": None}
        customer = customers.data[0]
        subscriptions = stripe.Subscription.list(customer=customer.id, status="active", limit=1)
        if not subscriptions.data:
            return {"status": "free", "plan": None}
        sub = subscriptions.data[0]
        price_id = sub["items"]["data"][0]["price"]["id"]
        currency = "usd" if price_id == PRICE_IDS["usd"] else "ngn"
        return {"status": "premium", "plan": "monthly", "currency": currency}
    except Exception as e:
        logging.error(f"Stripe status error: {e}")
        return {"status": "free", "plan": None}

app.include_router(api_router)
