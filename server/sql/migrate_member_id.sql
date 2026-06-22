-- 對外會員編號 member_id（格式：LKBM-70X9B2K，共 12 字元）
USE lukibou_db;

ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS member_id VARCHAR(20) NULL AFTER user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_member_id ON Users (member_id);
