-- 為 Users 表新增 country、city 欄位
USE lukibou_db;

ALTER TABLE Users
  ADD COLUMN country VARCHAR(2) DEFAULT NULL AFTER address_2,
  ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER country;
