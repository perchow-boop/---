-- 為既有 Products 表新增 type（型號）欄位（只需執行一次）
USE lukibou_db;

ALTER TABLE Products
  ADD COLUMN `type` VARCHAR(50) DEFAULT NULL AFTER product_id;
