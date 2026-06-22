import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { persistOrderFromStripeSession } from "@/lib/orders-server";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      try {
        const result = await persistOrderFromStripeSession(session);
        console.info("[stripe-webhook] checkout completed", {
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          amountTotal: session.amount_total,
          orderId: result?.order_id,
        });
      } catch (error) {
        console.error("[stripe-webhook] failed to persist order", error);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
