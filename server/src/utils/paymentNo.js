import crypto from "crypto";

function formatDatePart(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function generatePaymentNo(date = new Date()) {
  const randomPart = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  return `Luk${formatDatePart(date)}${randomPart}`;
}

export async function createUniquePaymentNo(connection, date = new Date()) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const paymentNo = generatePaymentNo(date);
    const [rows] = await connection.execute(
      "SELECT order_id FROM orders WHERE payment_no = ? LIMIT 1",
      [paymentNo],
    );

    if (!rows.length) {
      return paymentNo;
    }
  }

  throw new Error("PAYMENT_NO_COLLISION");
}
