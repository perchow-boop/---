import type Stripe from "stripe";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type CartItem = {
  id: string;
  quantity: number;
};

export async function persistOrderFromStripeSession(session: Stripe.Checkout.Session) {
  const secret = process.env.ORDER_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[orders] ORDER_WEBHOOK_SECRET not set, skip order persist");
    return null;
  }

  let cart: CartItem[] = [];

  if (session.metadata?.cart) {
    try {
      cart = JSON.parse(session.metadata.cart) as CartItem[];
    } catch {
      cart = [];
    }
  }

  if (!cart.length) {
    return null;
  }

  const stripePaymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.id;

  const rawUserId = session.metadata?.user_id;
  const userId =
    rawUserId && rawUserId.trim() ? Number(rawUserId) : null;

  const response = await fetch(`${API_URL}/orders/stripe-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Order-Secret": secret,
    },
    body: JSON.stringify({
      stripe_payment_id: stripePaymentId,
      user_id: userId,
      customer_email: session.customer_details?.email || null,
      guest_name: session.metadata?.guest_name || null,
      guest_email:
        session.metadata?.guest_email ||
        session.customer_details?.email ||
        null,
      guest_phone: session.metadata?.guest_phone || null,
      shipping_address_id: session.metadata?.shipping_address_id || null,
      shipping_address_text: session.metadata?.shipping_address_text || null,
      billing_address: session.metadata?.billing_address || null,
      total_amount: session.metadata?.total_amount || null,
      items: cart,
    }),
  });

  const data = (await response.json()) as {
    error?: string;
    order_id?: number;
    payment_no?: string;
    created?: boolean;
  };

  if (!response.ok) {
    throw new Error(data.error || "建立訂單失敗");
  }

  return data;
}
