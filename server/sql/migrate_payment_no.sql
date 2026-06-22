-- 為既有 orders 表新增 payment_no 欄位
USE lukibou_db;

ALTER TABLE orders
  ADD COLUMN payment_no VARCHAR(20) NULL AFTER stripe_payment_id;

-- 既有訂單的 payment_no 請執行：npm run migrate:payment-no
