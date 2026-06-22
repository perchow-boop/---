import "dotenv/config";
import pool from "../src/config/db.js";
import { createUniquePaymentNo } from "../src/utils/paymentNo.js";

async function ensureColumn() {
  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orders'
       AND COLUMN_NAME = 'payment_no'`,
  );

  if (!columns.length) {
    await pool.execute(
      "ALTER TABLE orders ADD COLUMN payment_no VARCHAR(20) NULL AFTER stripe_payment_id",
    );
    console.log("Added payment_no column");
  }
}

async function backfillPaymentNos() {
  const [rows] = await pool.execute(
    "SELECT order_id, created_at FROM orders WHERE payment_no IS NULL OR payment_no = ''",
  );

  for (const row of rows) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const paymentNo = await createUniquePaymentNo(
        connection,
        new Date(row.created_at),
      );

      await connection.execute(
        "UPDATE orders SET payment_no = ? WHERE order_id = ?",
        [paymentNo, row.order_id],
      );

      await connection.commit();
      console.log(`order #${row.order_id} -> ${paymentNo}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function ensureConstraints() {
  const [indexes] = await pool.execute(
    `SHOW INDEX FROM orders WHERE Key_name = 'idx_orders_payment_no'`,
  );

  if (!indexes.length) {
    await pool.execute(
      "ALTER TABLE orders ADD UNIQUE INDEX idx_orders_payment_no (payment_no)",
    );
    console.log("Added unique index on payment_no");
  }

  await pool.execute(
    "ALTER TABLE orders MODIFY payment_no VARCHAR(20) NOT NULL",
  );
  console.log("payment_no is NOT NULL");
}

async function main() {
  await ensureColumn();
  await backfillPaymentNos();
  await ensureConstraints();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
