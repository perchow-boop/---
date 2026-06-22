import { NextResponse } from "next/server";
import {
  resolveCheckoutItems,
  toStripeLineItems,
  toStripeShippingLineItem,
} from "@/lib/checkout";
import {
  createGuestStripeCustomer,
  getOrCreateStripeCustomer,
  updateStripeCustomerFromCheckout,
  type CheckoutMember,
} from "@/lib/stripe-customer";
import { getShippingFee } from "@/lib/shipping";
import { getAppUrl, getStripe } from "@/lib/stripe";
import type { CheckoutAddress, CheckoutRequest } from "@/types/checkout";
import { resolveUserFromRequest } from "@/lib/server/auth";
import { updateMemberProfile } from "@/lib/server/members";

function isValidEmail(email: string | undefined) {
  return Boolean(email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
}

function isValidAddress(
  address: CheckoutAddress | undefined,
): address is CheckoutAddress {
  if (!address) return false;

  return Boolean(
    address.firstName?.trim() &&
      isValidEmail(address.email) &&
      address.phone?.trim() &&
      address.country?.trim() &&
      address.city?.trim() &&
      address.address1?.trim(),
  );
}

function formatAddressText(address: CheckoutAddress) {
  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.phone,
    address.address1,
    address.address2,
    address.city,
    address.country,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(" · ");
}

function guestDisplayName(address: CheckoutAddress) {
  return `${address.firstName} ${address.lastName}`.trim() || address.email;
}

async function resolveUser(request: Request): Promise<CheckoutMember | null> {
  const user = await resolveUserFromRequest(request);
  if (!user?.user_id || !user.email) return null;
  return user;
}

async function syncMemberProfile(
  request: Request,
  billing: CheckoutAddress,
  shipping: CheckoutAddress,
) {
  const user = await resolveUserFromRequest(request);
  if (!user) return null;

  return updateMemberProfile(user.user_id, {
    first_name: billing.firstName,
    last_name: billing.lastName || null,
    phone: billing.phone,
    country: shipping.country,
    city: shipping.city,
    street_address: shipping.address1,
    postal_code: shipping.postalCode,
    recipient_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const resolved = await resolveCheckoutItems(body.items ?? []);

    if (!resolved) {
      return NextResponse.json(
        { error: "購物車內容無效，請重新選擇商品。" },
        { status: 400 },
      );
    }

    if (!isValidAddress(body.billing)) {
      return NextResponse.json(
        { error: "請填寫完整的帳單地址與電郵。" },
        { status: 400 },
      );
    }

    const billing = body.billing;

    let shippingAddress: CheckoutAddress;
    if (body.shippingSameAsBilling) {
      shippingAddress = billing;
    } else if (!isValidAddress(body.shipping)) {
      return NextResponse.json(
        { error: "請填寫完整的配送地址與電郵。" },
        { status: 400 },
      );
    } else {
      shippingAddress = body.shipping;
    }

    const shippingMethod = body.shippingMethod === "pickup" ? "pickup" : "delivery";
    const authHeader = request.headers.get("authorization");
    const isMember = authHeader?.startsWith("Bearer ");

    const user = isMember
      ? (await syncMemberProfile(request, billing, shippingAddress)) ||
        (await resolveUser(request))
      : null;

    const stripe = getStripe();
    const appUrl = getAppUrl();
    const lineItems = toStripeLineItems(resolved);
    const shippingLineItem = toStripeShippingLineItem(shippingMethod);

    if (shippingLineItem) {
      lineItems.push(shippingLineItem);
    }

    const subtotal = resolved.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const totalAmount = subtotal + getShippingFee(shippingMethod);

    const guestName = guestDisplayName(shippingAddress);
    const guestEmail = billing.email.trim().toLowerCase();
    const guestPhone = shippingAddress.phone;

    const metadata: Record<string, string> = {
      source: "lukibou-web",
      shipping_method: shippingMethod,
      order_notes: body.orderNotes?.trim() || "",
      shipping_address_text: formatAddressText(shippingAddress),
      billing_address: formatAddressText(billing),
      total_amount: String(totalAmount),
      cart: JSON.stringify(
        resolved.map(({ product, quantity }) => ({
          id: product.id,
          quantity,
        })),
      ),
    };

    let customerId: string;

    if (user) {
      metadata.user_id = String(user.user_id);
      metadata.shipping_address_id = String(user.default_address?.address_id || "");
      metadata.guest_name = guestName;
      metadata.guest_email = user.email;
      metadata.guest_phone = guestPhone;

      const customer = await getOrCreateStripeCustomer(stripe, user);
      await updateStripeCustomerFromCheckout(
        stripe,
        customer.id,
        user,
        billing,
        shippingAddress,
      );
      customerId = customer.id;
    } else {
      metadata.user_id = "";
      metadata.guest_name = guestName;
      metadata.guest_email = guestEmail;
      metadata.guest_phone = guestPhone;
      metadata.shipping_address_id = "";

      const customer = await createGuestStripeCustomer(
        stripe,
        billing,
        shippingAddress,
      );
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: lineItems,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      locale: "zh-HK",
      metadata,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "無法建立結帳連結，請稍後再試。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout]", error);
    const message =
      error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
        ? "Stripe 尚未設定，請在 .env.local 填入 API 金鑰。"
        : error instanceof Error
          ? error.message
          : "結帳服務暫時無法使用，請稍後再試。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
