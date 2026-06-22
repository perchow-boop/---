-- 管理員 session（與會員 Auth 表相同模式）
USE lukibou_db;

CREATE TABLE IF NOT EXISTS AdminAuth (
  auth_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
  INDEX idx_admin_auth_admin_id (admin_id),
  INDEX idx_admin_auth_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
