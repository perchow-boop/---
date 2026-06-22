import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { canManageProducts } from "../constants/adminRoles.js";

export async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "未提供管理員驗證 token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type !== "admin" || !payload.admin_id) {
      return res.status(401).json({ error: "管理員 Token 無效" });
    }

    const [authRows] = await pool.execute(
      `SELECT auth_id, admin_id, expires_at
       FROM AdminAuth
       WHERE admin_id = ? AND token = ? AND expires_at > NOW()
       LIMIT 1`,
      [payload.admin_id, token],
    );

    if (!authRows.length) {
      return res.status(401).json({ error: "管理員 Token 無效或已過期" });
    }

    const [rows] = await pool.execute(
      `SELECT admin_id, username, email, role, last_login, created_at, updated_at
       FROM admins
       WHERE admin_id = ?
       LIMIT 1`,
      [payload.admin_id],
    );

    if (!rows.length) {
      return res.status(401).json({ error: "管理員不存在" });
    }

    req.admin = rows[0];
    req.adminToken = token;
    next();
  } catch {
    return res.status(401).json({ error: "管理員 Token 驗證失敗" });
  }
}

export function requireAdminRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: "請先登入管理員帳號" });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "權限不足" });
    }

    next();
  };
}

export function requireProductWriteAccess(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ error: "請先登入管理員帳號" });
  }

  if (!canManageProducts(req.admin.role)) {
    return res.status(403).json({ error: "此角色無法修改商品（僅 superadmin / manager）" });
  }

  next();
}
