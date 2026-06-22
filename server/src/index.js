import "dotenv/config";
import app from "./app.js";
import { testConnection } from "./config/db.js";
import { backfillMissingMemberIds } from "./services/users.js";

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("錯誤：請在 .env 設定 JWT_SECRET");
    process.exit(1);
  }

  try {
    await testConnection();
    console.log("MySQL 連線成功 (lukibou_db)");
  } catch (error) {
    console.error("MySQL 連線失敗，請確認 XAMPP MySQL 已啟動並執行 sql/schema.sql");
    console.error(error.message);
    process.exit(1);
  }

  const backfilled = await backfillMissingMemberIds();
  if (backfilled > 0) {
    console.log(`已補齊 ${backfilled} 位會員的 member_id`);
  }

  app.listen(PORT, () => {
    console.log(`Lukibou Auth API 運行於 http://localhost:${PORT}`);
    console.log("可用端點：POST /register, POST /login, GET /profile");
    console.log("管理員：POST /admin/register, POST /admin/login, GET /admin/profile");
    console.log("管理員 CRUD：GET/PUT/DELETE /admin/admins（需 superadmin）");
    console.log("訂貨單：GET /admin/orders, GET /admin/orders/:id, PUT /admin/orders/:id/status（需管理員登入）");
    console.log("訂單：GET /orders, GET /orders/:id, POST /orders/stripe-complete");
  });
}

start();
