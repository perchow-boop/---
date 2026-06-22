-- 會員系統 v2：Users 拆分姓名、獨立地址表、訂單支援訪客、收藏清單
USE lukibou_db;

-- Users：新增 first_name / last_name / status
ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(50) NULL AFTER first_name,
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER password_hash;

-- 將舊 name 欄資料搬到 first_name（若尚未遷移）
UPDATE Users
SET first_name = TRIM(name)
WHERE (first_name IS NULL OR first_name = '')
  AND name IS NOT NULL
  AND TRIM(name) <> '';

UPDATE Users SET status = 'active' WHERE status IS NULL;

-- 會員地址表
CREATE TABLE IF NOT EXISTS user_addresses (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipient_name VARCHAR(100) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  country VARCHAR(50) DEFAULT NULL,
  city VARCHAR(50) DEFAULT NULL,
  street_address VARCHAR(255) DEFAULT NULL,
  postal_code VARCHAR(20) DEFAULT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  INDEX idx_user_addresses_user_id (user_id),
  INDEX idx_user_addresses_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 從 Users 舊地址欄位匯入預設地址
INSERT INTO user_addresses (
  user_id, recipient_name, phone, country, city, street_address, is_default
)
SELECT
  u.user_id,
  u.name,
  u.phone,
  u.country,
  u.city,
  u.address_1,
  TRUE
FROM Users u
WHERE (u.address_1 IS NOT NULL OR u.city IS NOT NULL OR u.country IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM user_addresses ua WHERE ua.user_id = u.user_id
  );

-- 收藏清單
CREATE TABLE IF NOT EXISTS favorites (
  favorite_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_favorites_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
  INDEX idx_favorites_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 訂單表擴充（保留 payment_no / order_items）
ALTER TABLE orders
  MODIFY COLUMN user_id INT NULL,
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(100) NULL AFTER guest_name,
  ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20) NULL AFTER guest_email,
  ADD COLUMN IF NOT EXISTS shipping_address_id INT NULL AFTER guest_phone,
  ADD COLUMN IF NOT EXISTS shipping_address_text TEXT NULL AFTER shipping_address_id,
  ADD COLUMN IF NOT EXISTS billing_address TEXT NULL AFTER shipping_address_text,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NULL AFTER billing_address;

-- 擴充訂單狀態（保留 refunded 以相容舊資料）
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'
  ) NOT NULL DEFAULT 'pending';

-- 外鍵（若尚未存在）
-- MySQL 不支援 IF NOT EXISTS for FK，由 migrate script 處理
