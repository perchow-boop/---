-- 若已建立 lukibou_db，可單獨執行此檔新增 Products 表
USE lukibou_db;

CREATE TABLE IF NOT EXISTS Products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  type_id VARCHAR(50) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
