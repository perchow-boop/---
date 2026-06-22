import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  completeOrder,
  findUserIdByEmail,
  getOrderDetailForUser,
  getOrdersForUser,
} from "@/lib/server/orders";

function verifyOrderWebhookSecret(request: NextRequest) {
  const secret = request.headers.get("x-order-secret");
  if (!process.env.ORDER_WEBHOOK_SECRET) {
    return jsonError("ORDER_WEBHOOK_SECRET 未設定", 500);
  }
  if (secret !== process.env.ORDER_WEBHOOK_SECRET) {
    return jsonError("未授權的訂單寫入請求", 401);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authError = verifyOrderWebhookSecret(request);
    if (authError) return authError;

    const body = await request.json();
    const {
      stripe_payment_id,
      user_id,
      customer_email,
      items,
      guest_name,
      guest_email,
      guest_phone,
      shipping_address_id,
      shipping_address_text,
      billing_address,
      total_amount,
    } = body;

    if (!stripe_payment_id || !Array.isArray(items) || !items.length) {
      return jsonError("訂單資料不完整", 400);
    }

    let userId = user_id ? Number(user_id) : null;

    if (!userId && (customer_email || guest_email)) {
      userId = await findUserIdByEmail(customer_email || guest_email);
    }

    if (!userId && !guest_email && !guest_name && !customer_email) {
      return jsonError("訪客訂單缺少聯絡資料", 400);
    }

    const result = await completeOrder({
      stripePaymentId: String(stripe_payment_id),
      userId,
      cartItems: items,
      guestName: guest_name,
      guestEmail: guest_email || customer_email,
      guestPhone: guest_phone,
      shippingAddressId: shipping_address_id
        ? Number(shipping_address_id)
        : null,
      shippingAddressText: shipping_address_text,
      billingAddress: billing_address,
      totalAmount: total_amount ? Number(total_amount) : null,
    });

    return jsonOk({
      message: result.created ? "訂單已建立" : "訂單已存在",
      order_id: result.order_id,
      payment_no: result.payment_no,
      created: result.created,
    });
  } catch (error) {
    console.error("[POST /api/orders/stripe-complete]", error);

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return jsonError("訂單包含不存在的商品", 400);
    }

    return jsonError("建立訂單失敗", 500);
  }
}
