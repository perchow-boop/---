import pool from "../config/db.js";
import { createUniquePaymentNo } from "../utils/paymentNo.js";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export function isValidOrderStatus(status) {
  return ORDER_STATUSES.includes(status);
}

export async function findUserIdByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT user_id FROM Users WHERE email = ? LIMIT 1",
    [email.trim().toLowerCase()],
  );
  return rows[0]?.user_id ?? null;
}

export async function getProductForOrder(productId) {
  const [rows] = await pool.execute(
    `SELECT product_id, name, price, image_url, type_id, \`type\` AS product_category, stock
     FROM Products
     WHERE product_id = ?
     LIMIT 1`,
    [productId],
  );
  return rows[0] ?? null;
}

export async function completeOrder({
  stripePaymentId,
  userId,
  cartItems,
  guestName,
  guestEmail,
  guestPhone,
  shippingAddressId,
  shippingAddressText,
  billingAddress,
  totalAmount,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT order_id, payment_no FROM orders WHERE stripe_payment_id = ? LIMIT 1",
      [stripePaymentId],
    );

    if (existing.length) {
      await connection.commit();
      return {
        order_id: existing[0].order_id,
        payment_no: existing[0].payment_no,
        created: false,
      };
    }

    const normalizedItems = [];

    for (const item of cartItems) {
      const productId = Number(item.id ?? item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId < 1) {
        throw new Error("INVALID_PRODUCT");
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("INVALID_QUANTITY");
      }

      const [products] = await connection.execute(
        "SELECT product_id, price, stock FROM Products WHERE product_id = ? LIMIT 1",
        [productId],
      );

      if (!products.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      normalizedItems.push({
        product_id: productId,
        quantity,
        price: Number(products[0].price),
        stock: products[0].stock,
      });
    }

    const paymentNo = await createUniquePaymentNo(connection);
    const computedTotal =
      totalAmount ??
      normalizedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
         user_id, guest_name, guest_email, guest_phone,
         shipping_address_id, shipping_address_text, billing_address,
         stripe_payment_id, payment_no, total_amount, status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [
        userId ?? null,
        guestName ?? null,
        guestEmail ?? null,
        guestPhone ?? null,
        shippingAddressId ?? null,
        shippingAddressText ?? null,
        billingAddress ?? null,
        stripePaymentId,
        paymentNo,
        computedTotal,
      ],
    );

    const orderId = orderResult.insertId;

    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price],
      );

      await connection.execute(
        "UPDATE Products SET stock = stock - ? WHERE product_id = ?",
        [item.quantity, item.product_id],
      );
    }

    await connection.commit();
    return { order_id: orderId, payment_no: paymentNo, created: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrdersForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       o.order_id,
       o.user_id,
       o.stripe_payment_id,
       o.payment_no,
       o.status,
       o.created_at,
       o.updated_at,
       COALESCE(MAX(o.total_amount), SUM(oi.quantity * oi.price), 0) AS total_amount,
       COUNT(oi.item_id) AS item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     WHERE o.user_id = ?
     GROUP BY o.order_id
     ORDER BY o.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    ...row,
    total_amount: Number(row.total_amount),
    item_count: Number(row.item_count),
  }));
}

export async function getOrderDetailForUser(orderId, userId) {
  const [orders] = await pool.execute(
    `SELECT order_id, user_id, stripe_payment_id, payment_no, status, created_at, updated_at
     FROM orders
     WHERE order_id = ? AND user_id = ?
     LIMIT 1`,
    [orderId, userId],
  );

  if (!orders.length) {
    return null;
  }

  const order = orders[0];

  const [items] = await pool.execute(
    `SELECT
       oi.item_id,
       oi.order_id,
       oi.product_id,
       oi.quantity,
       oi.price,
       p.name,
       p.image_url,
       p.type_id,
       p.\`type\` AS product_category
     FROM order_items oi
     INNER JOIN Products p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.item_id ASC`,
    [orderId],
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  return {
    order: {
      ...order,
      total_amount: totalAmount,
    },
    items: items.map((item) => ({
      item_id: item.item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.price),
      name: item.name,
      image_url: item.image_url,
      type_id: item.type_id,
      category: item.product_category,
    })),
  };
}

export async function getAllOrders() {
  const [rows] = await pool.execute(
    `SELECT
       o.order_id,
       o.user_id,
       o.stripe_payment_id,
       o.payment_no,
       o.status,
       o.created_at,
       o.updated_at,
       o.shipping_address_text,
       o.billing_address,
       CASE
         WHEN o.user_id IS NOT NULL THEN TRIM(CONCAT(
           TRIM(COALESCE(u.first_name, '')),
           CASE
             WHEN u.last_name IS NULL OR TRIM(u.last_name) = '' THEN ''
             ELSE CONCAT(' ', TRIM(u.last_name))
           END
         ))
         ELSE COALESCE(o.guest_name, '訪客')
       END AS customer_name,
       COALESCE(u.email, o.guest_email) AS customer_email,
       COALESCE(u.phone, o.guest_phone) AS customer_phone,
       u.member_id AS customer_member_id,
       (o.user_id IS NULL) AS is_guest,
       COALESCE(MAX(o.total_amount), SUM(oi.quantity * oi.price), 0) AS total_amount,
       COUNT(oi.item_id) AS item_count
     FROM orders o
     LEFT JOIN Users u ON u.user_id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     GROUP BY o.order_id
     ORDER BY o.created_at DESC`,
  );

  return rows.map((row) => ({
    ...row,
    is_guest: Boolean(row.is_guest),
    total_amount: Number(row.total_amount),
    item_count: Number(row.item_count),
  }));
}

export async function getOrderDetailById(orderId) {
  const [orders] = await pool.execute(
    `SELECT
       o.order_id,
       o.user_id,
       o.stripe_payment_id,
       o.payment_no,
       o.status,
       o.created_at,
       o.updated_at,
       o.shipping_address_text,
       o.billing_address,
       CASE
         WHEN o.user_id IS NOT NULL THEN TRIM(CONCAT(
           TRIM(COALESCE(u.first_name, '')),
           CASE
             WHEN u.last_name IS NULL OR TRIM(u.last_name) = '' THEN ''
             ELSE CONCAT(' ', TRIM(u.last_name))
           END
         ))
         ELSE COALESCE(o.guest_name, '訪客')
       END AS customer_name,
       COALESCE(u.email, o.guest_email) AS customer_email,
       COALESCE(u.phone, o.guest_phone) AS customer_phone,
       u.member_id AS customer_member_id,
       (o.user_id IS NULL) AS is_guest
     FROM orders o
     LEFT JOIN Users u ON u.user_id = o.user_id
     WHERE o.order_id = ?
     LIMIT 1`,
    [orderId],
  );

  if (!orders.length) {
    return null;
  }

  const order = orders[0];

  const [items] = await pool.execute(
    `SELECT
       oi.item_id,
       oi.order_id,
       oi.product_id,
       oi.quantity,
       oi.price,
       p.name,
       p.image_url,
       p.type_id,
       p.\`type\` AS product_category
     FROM order_items oi
     INNER JOIN Products p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.item_id ASC`,
    [orderId],
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  return {
    order: {
      ...order,
      is_guest: Boolean(order.is_guest),
      total_amount: totalAmount,
      item_count: items.length,
    },
    items: items.map((item) => ({
      item_id: item.item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.price),
      name: item.name,
      image_url: item.image_url,
      type_id: item.type_id,
      category: item.product_category,
    })),
  };
}

export async function updateOrderStatus(orderId, status) {
  const [result] = await pool.execute(
    `UPDATE orders
     SET status = ?
     WHERE order_id = ?`,
    [status, orderId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT order_id, status, updated_at
     FROM orders
     WHERE order_id = ?
     LIMIT 1`,
    [orderId],
  );

  return rows[0] ?? null;
}
