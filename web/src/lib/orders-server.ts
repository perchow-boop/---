import type Stripe from "stripe";
import { completeOrder, findUserIdByEmail } from "@/lib/server/orders";

type CartItem = {
  id: string;
  quantity: number;
};

export async function persistOrderFromStripeSession(
  session: Stripe.Checkout.Session,
) {
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
  let userId = rawUserId && rawUserId.trim() ? Number(rawUserId) : null;

  const guestEmail =
    session.metadata?.guest_email ||
    session.customer_details?.email ||
    null;

  if (!userId && guestEmail) {
    userId = await findUserIdByEmail(guestEmail);
  }

  try {
    return await completeOrder({
      stripePaymentId,
      userId,
      cartItems: cart,
      guestName: session.metadata?.guest_name || null,
      guestEmail,
      guestPhone: session.metadata?.guest_phone || null,
      shippingAddressId: session.metadata?.shipping_address_id
        ? Number(session.metadata.shipping_address_id)
        : null,
      shippingAddressText: session.metadata?.shipping_address_text || null,
      billingAddress: session.metadata?.billing_address || null,
      totalAmount: session.metadata?.total_amount
        ? Number(session.metadata.total_amount)
        : null,
    });
  } catch (error) {
    console.error("[orders] persist failed", error);
    throw error;
  }
}
