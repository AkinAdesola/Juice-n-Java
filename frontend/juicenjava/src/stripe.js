export const STRIPE_PUBLISHABLE_KEY = "pk_test_51TAy0pEhvCgzDmTehXO8lHjSgT2kMz9mhdt0hKVeaiNjrlyLozYP8Iqn42R00C9BuWGiAamIuRsFO3IyCDcEvz0k00oCGczvBL";

export const PLANS = {
  usd: {
    currency: "USD",
    symbol: "$",
    amount: "29",
    priceId: "price_1TPlUzEhvCgzDmTejr4dFmIB",
    label: "$29 / month",
  },
  ngn: {
    currency: "NGN",
    symbol: "₦",
    amount: "25,000",
    priceId: "price_1TQ7VLEhvCgzDmTeRDdElnyU",
    label: "₦25,000 / month",
  },
};

export async function createCheckoutSession({ currency, vendorEmail, shopName }) {
  const res = await fetch("https://juice-n-java-production.up.railway.app/api/vendor/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currency,
      vendor_email: vendorEmail,
      shop_name: shopName,
    }),
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  return res.json();
}
