import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { getUserById } from "../services/users.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "未提供驗證 token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [authRows] = await pool.execute(
      `SELECT auth_id, user_id, expires_at
       FROM Auth
       WHERE user_id = ? AND token = ? AND expires_at > NOW()
       LIMIT 1`,
      [payload.user_id, token],
    );

    if (!authRows.length) {
      return res.status(401).json({ error: "Token 無效或已過期" });
    }

    const user = await getUserById(payload.user_id);

    if (!user) {
      return res.status(401).json({ error: "使用者不存在" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ error: "此帳戶已被停用" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ error: "Token 驗證失敗" });
  }
}
