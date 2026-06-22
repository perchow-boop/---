-- 若已建立 Products 表，執行此檔遷移欄位：
-- type_id = 型號，type = 種類
USE lukibou_db;

-- 1. 新增 type_id 欄位（若尚未存在）
ALTER TABLE Products
  ADD COLUMN type_id VARCHAR(50) DEFAULT NULL AFTER product_id;

-- 2. 將舊 type 欄位資料（原為型號）搬至 type_id
UPDATE Products
SET type_id = `type`
WHERE type_id IS NULL AND `type` IS NOT NULL AND `type` <> '';

-- 3. 清空 type，改為存放種類（請於管理頁重新填寫種類）
UPDATE Products SET `type` = NULL;
