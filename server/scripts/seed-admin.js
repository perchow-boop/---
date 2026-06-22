/**
 * 建立預設管理員帳號（若尚無任何 admin）
 * 用法：cd server && node scripts/seed-admin.js
 * 預設帳號：admin / admin123
 */
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../src/config/db.js";

dotenv.config();

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_EMAIL = "admin@lukibou.com";
const SALT_ROUNDS = 12;

async function seedAdmin() {
  const [existing] = await pool.execute(
    "SELECT admin_id FROM admins WHERE username = ? LIMIT 1",
    [DEFAULT_USERNAME],
  );

  if (existing.length) {
    console.log(`管理員「${DEFAULT_USERNAME}」已存在，略過建立。`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  await pool.execute(
    `INSERT INTO admins (username, password_hash, email, role)
     VALUES (?, ?, ?, 'superadmin')`,
    [DEFAULT_USERNAME, passwordHash, DEFAULT_EMAIL],
  );

  console.log("預設管理員已建立：");
  console.log(`  帳號：${DEFAULT_USERNAME}`);
  console.log(`  密碼：${DEFAULT_PASSWORD}`);
  console.log("請登入後立即修改密碼。");
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("建立管理員失敗：", error);
  process.exit(1);
});
