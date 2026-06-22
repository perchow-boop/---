import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  completeOrder,
  findUserIdByEmail,
  getOrderDetailForUser,
  getOrdersForUser,
} from "../services/orders.js";

const router = Router();

function verifyOrderWebhookSecret(req, res) {
  const secret = req.headers["x-order-secret"];
  if (!process.env.ORDER_WEBHOOK_SECRET) {
    res.status(500).json({ error: "ORDER_WEBHOOK_SECRET 未設定" });
    return false;
  }

  if (secret !== process.env.ORDER_WEBHOOK_SECRET) {
    res.status(401).json({ error: "未授權的訂單寫入請求" });
    return false;
  }

  return true;
}

// POST /orders/stripe-complete — 由 Stripe webhook / 結帳確認呼叫
router.post("/orders/stripe-complete", async (req, res) => {
  try {
    if (!verifyOrderWebhookSecret(req, res)) return;

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
    } = req.body;

    if (!stripe_payment_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "訂單資料不完整" });
    }

    let userId = user_id ? Number(user_id) : null;

    if (!userId && (customer_email || guest_email)) {
      userId = await findUserIdByEmail(customer_email || guest_email);
    }

    if (!userId && !guest_email && !guest_name && !customer_email) {
      return res.status(400).json({
        error: "訪客訂單缺少聯絡資料",
      });
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

    return res.json({
      message: result.created ? "訂單已建立" : "訂單已存在",
      order_id: result.order_id,
      payment_no: result.payment_no,
      created: result.created,
    });
  } catch (error) {
    console.error("[POST /orders/stripe-complete]", error);

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(400).json({ error: "訂單包含不存在的商品" });
    }

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        error: "orders 資料表不存在，請執行 server/sql/orders.sql",
      });
    }

    return res.status(500).json({
      error: "建立訂單失敗",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /orders — 會員訂單列表
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await getOrdersForUser(req.user.user_id);
    return res.json({ orders });
  } catch (error) {
    console.error("[GET /orders]", error);
    return res.status(500).json({ error: "讀取訂單列表失敗" });
  }
});

// GET /orders/:id — 會員訂單詳情
router.get("/orders/:id", authenticateToken, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ error: "無效的訂單 ID" });
    }

    const detail = await getOrderDetailForUser(orderId, req.user.user_id);
    if (!detail) {
      return res.status(404).json({ error: "找不到此訂單" });
    }

    return res.json(detail);
  } catch (error) {
    console.error("[GET /orders/:id]", error);
    return res.status(500).json({ error: "讀取訂單詳情失敗" });
  }
});

export default router;
