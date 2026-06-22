import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    return "http://localhost:3000";
  }
  return url.replace(/\/$/, "");
}
