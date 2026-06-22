-- 為 Users 表新增地址欄位
USE lukibou_db;

ALTER TABLE Users
  ADD COLUMN address_1 VARCHAR(255) DEFAULT NULL AFTER phone,
  ADD COLUMN address_2 VARCHAR(255) DEFAULT NULL AFTER address_1;
