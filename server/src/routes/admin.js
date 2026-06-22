import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  ADMIN_ROLES,
  canRegisterRole,
  isValidAdminRole,
} from "../constants/adminRoles.js";
import { authenticateAdmin, requireAdminRole } from "../middleware/adminAuth.js";
import { getTokenExpiry } from "../utils/tokenExpiry.js";
import { getAllOrders, getOrderDetailById, isValidOrderStatus, updateOrderStatus } from "../services/orders.js";

const router = Router();
const SALT_ROUNDS = 12;

function createAdminToken(admin) {
  return jwt.sign(
    {
      admin_id: admin.admin_id,
      role: admin.role,
      type: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "8h",
    },
  );
}

function sanitizeAdmin(row) {
  return {
    admin_id: row.admin_id,
    username: row.username,
    email: row.email,
    role: row.role,
    last_login: row.last_login,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getAdminById(adminId) {
  const [rows] = await pool.execute(
    `SELECT admin_id, username, email, role, last_login, created_at, updated_at
     FROM admins
     WHERE admin_id = ?
     LIMIT 1`,
    [adminId],
  );

  return rows[0] ?? null;
}

async function getAdminCount() {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM admins",
  );
  return Number(rows[0].total);
}

function validateRegisterInput({ username, password, email, role }) {
  if (!username?.trim() || !password) {
    return "請填寫帳號與密碼";
  }

  if (username.trim().length < 3 || username.trim().length > 50) {
    return "帳號長度需為 3–50 個字元";
  }

  if (password.length < 8) {
    return "密碼至少需要 8 個字元";
  }

  if (email && !isValidEmail(email)) {
    return "電郵格式不正確";
  }

  if (role && !isValidAdminRole(role)) {
    return `角色必須為 ${ADMIN_ROLES.join("、")} 之一`;
  }

  return null;
}

// POST /admin/register
router.post("/admin/register", async (req, res) => {
  try {
    const { username, password, email, role = "staff" } = req.body;
    const validationError = validateRegisterInput({
      username,
      password,
      email,
      role,
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const adminCount = await getAdminCount();
    let assignedRole = role;

    if (adminCount === 0) {
      assignedRole = "superadmin";
    } else {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return res.status(401).json({ error: "請先以 superadmin 或 manager 登入後再註冊管理員" });
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "管理員 Token 驗證失敗" });
      }

      if (payload.type !== "admin" || !payload.admin_id) {
        return res.status(401).json({ error: "管理員 Token 無效" });
      }

      const actor = await getAdminById(payload.admin_id);
      if (!actor) {
        return res.status(401).json({ error: "管理員不存在" });
      }

      if (!canRegisterRole(actor.role, assignedRole)) {
        return res.status(403).json({
          error:
            actor.role === "manager"
              ? "manager 僅能註冊 staff 角色"
              : "權限不足，無法註冊此角色",
        });
      }
    }

    const [existing] = await pool.execute(
      "SELECT admin_id FROM admins WHERE username = ? LIMIT 1",
      [username.trim()],
    );

    if (existing.length) {
      return res.status(409).json({ error: "此帳號已被使用" });
    }

    if (email?.trim()) {
      const [existingEmail] = await pool.execute(
        "SELECT admin_id FROM admins WHERE email = ? LIMIT 1",
        [email.trim().toLowerCase()],
      );

      if (existingEmail.length) {
        return res.status(409).json({ error: "此電郵已被使用" });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
      `INSERT INTO admins (username, password_hash, email, role)
       VALUES (?, ?, ?, ?)`,
      [
        username.trim(),
        passwordHash,
        email?.trim().toLowerCase() || null,
        assignedRole,
      ],
    );

    const admin = await getAdminById(result.insertId);

    return res.status(201).json({
      message: "管理員註冊成功",
      admin: sanitizeAdmin(admin),
    });
  } catch (error) {
    console.error("[POST /admin/register]", error);
    return res.status(500).json({ error: "管理員註冊失敗，請稍後再試" });
  }
});

// POST /admin/login
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
      return res.status(400).json({ error: "請填寫帳號與密碼" });
    }

    const [admins] = await pool.execute(
      `SELECT admin_id, username, email, password_hash, role, last_login, created_at, updated_at
       FROM admins
       WHERE username = ?
       LIMIT 1`,
      [username.trim()],
    );

    if (!admins.length) {
      return res.status(401).json({ error: "帳號或密碼錯誤" });
    }

    const admin = admins[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "帳號或密碼錯誤" });
    }

    await pool.execute(
      "UPDATE admins SET last_login = NOW() WHERE admin_id = ?",
      [admin.admin_id],
    );

    const updatedAdmin = await getAdminById(admin.admin_id);
    const token = createAdminToken(updatedAdmin);
    const expiresAt = getTokenExpiry(process.env.ADMIN_JWT_EXPIRES_IN || "8h");

    await pool.execute(
      `INSERT INTO AdminAuth (admin_id, token, expires_at, last_login)
       VALUES (?, ?, ?, NOW())`,
      [updatedAdmin.admin_id, token, expiresAt],
    );

    return res.json({
      message: "管理員登入成功",
      token,
      expires_at: expiresAt,
      admin: sanitizeAdmin(updatedAdmin),
    });
  } catch (error) {
    console.error("[POST /admin/login]", error);
    return res.status(500).json({ error: "管理員登入失敗，請稍後再試" });
  }
});

// GET /admin/profile
router.get("/admin/profile", authenticateAdmin, async (req, res) => {
  return res.json({ admin: sanitizeAdmin(req.admin) });
});

// POST /admin/logout
router.post("/admin/logout", authenticateAdmin, async (req, res) => {
  try {
    await pool.execute("DELETE FROM AdminAuth WHERE admin_id = ?", [
      req.admin.admin_id,
    ]);

    return res.json({ message: "管理員已登出" });
  } catch (error) {
    console.error("[POST /admin/logout]", error);
    return res.status(500).json({ error: "管理員登出失敗" });
  }
});

// GET /admin/admins — superadmin only
router.get(
  "/admin/admins",
  authenticateAdmin,
  requireAdminRole("superadmin"),
  async (_req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT admin_id, username, email, role, last_login, created_at, updated_at
         FROM admins
         ORDER BY admin_id ASC`,
      );

      return res.json({ admins: rows.map(sanitizeAdmin) });
    } catch (error) {
      console.error("[GET /admin/admins]", error);
      return res.status(500).json({ error: "讀取管理員列表失敗" });
    }
  },
);

// PUT /admin/admins/:id — superadmin only
router.put(
  "/admin/admins/:id",
  authenticateAdmin,
  requireAdminRole("superadmin"),
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);
      if (!Number.isInteger(adminId) || adminId < 1) {
        return res.status(400).json({ error: "無效的管理員 ID" });
      }

      const existing = await getAdminById(adminId);
      if (!existing) {
        return res.status(404).json({ error: "找不到此管理員" });
      }

      const { email, role, password } = req.body;

      if (role !== undefined && !isValidAdminRole(role)) {
        return res.status(400).json({
          error: `角色必須為 ${ADMIN_ROLES.join("、")} 之一`,
        });
      }

      if (email !== undefined && email !== null && email !== "" && !isValidEmail(email)) {
        return res.status(400).json({ error: "電郵格式不正確" });
      }

      if (password !== undefined && password !== null && password !== "") {
        if (password.length < 8) {
          return res.status(400).json({ error: "密碼至少需要 8 個字元" });
        }
      }

      if (
        role !== undefined &&
        role !== "superadmin" &&
        existing.role === "superadmin"
      ) {
        const [superadmins] = await pool.execute(
          "SELECT COUNT(*) AS total FROM admins WHERE role = 'superadmin'",
        );
        if (Number(superadmins[0].total) <= 1) {
          return res.status(400).json({ error: "系統至少需要一位 superadmin" });
        }
      }

      if (email?.trim()) {
        const [duplicateEmail] = await pool.execute(
          "SELECT admin_id FROM admins WHERE email = ? AND admin_id <> ? LIMIT 1",
          [email.trim().toLowerCase(), adminId],
        );
        if (duplicateEmail.length) {
          return res.status(409).json({ error: "此電郵已被使用" });
        }
      }

      const nextRole = role ?? existing.role;
      const nextEmail =
        email === undefined
          ? existing.email
          : email?.trim()
            ? email.trim().toLowerCase()
            : null;

      if (password) {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        await pool.execute(
          `UPDATE admins SET email = ?, role = ?, password_hash = ? WHERE admin_id = ?`,
          [nextEmail, nextRole, passwordHash, adminId],
        );
      } else {
        await pool.execute(
          `UPDATE admins SET email = ?, role = ? WHERE admin_id = ?`,
          [nextEmail, nextRole, adminId],
        );
      }

      const updated = await getAdminById(adminId);
      return res.json({
        message: "管理員已更新",
        admin: sanitizeAdmin(updated),
      });
    } catch (error) {
      console.error("[PUT /admin/admins/:id]", error);
      return res.status(500).json({ error: "更新管理員失敗" });
    }
  },
);

// DELETE /admin/admins/:id — superadmin only
router.delete(
  "/admin/admins/:id",
  authenticateAdmin,
  requireAdminRole("superadmin"),
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);
      if (!Number.isInteger(adminId) || adminId < 1) {
        return res.status(400).json({ error: "無效的管理員 ID" });
      }

      if (req.admin.admin_id === adminId) {
        return res.status(400).json({ error: "無法刪除自己的帳號" });
      }

      const existing = await getAdminById(adminId);
      if (!existing) {
        return res.status(404).json({ error: "找不到此管理員" });
      }

      if (existing.role === "superadmin") {
        const [superadmins] = await pool.execute(
          "SELECT COUNT(*) AS total FROM admins WHERE role = 'superadmin'",
        );
        if (Number(superadmins[0].total) <= 1) {
          return res.status(400).json({ error: "系統至少需要一位 superadmin" });
        }
      }

      await pool.execute("DELETE FROM admins WHERE admin_id = ?", [adminId]);

      return res.json({ message: "管理員已刪除" });
    } catch (error) {
      console.error("[DELETE /admin/admins/:id]", error);
      return res.status(500).json({ error: "刪除管理員失敗" });
    }
  },
);

// PATCH /admin/orders/:id/status — 更新訂單狀態（須在 /admin/orders/:id 之前註冊）
async function handleOrderStatusUpdate(req, res) {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ error: "無效的訂單 ID" });
    }

    const { status } = req.body;
    if (!status || !isValidOrderStatus(status)) {
      return res.status(400).json({ error: "無效的訂單狀態" });
    }

    const updated = await updateOrderStatus(orderId, status);
    if (!updated) {
      return res.status(404).json({ error: "找不到此訂單" });
    }

    return res.json({
      message: "訂單狀態已更新",
      order_id: updated.order_id,
      status: updated.status,
      updated_at: updated.updated_at,
    });
  } catch (error) {
    console.error("[PUT /admin/orders/:id/status]", error);
    return res.status(500).json({ error: "更新訂單狀態失敗" });
  }
}

router.put("/admin/orders/:id/status", authenticateAdmin, handleOrderStatusUpdate);
router.patch("/admin/orders/:id/status", authenticateAdmin, handleOrderStatusUpdate);

// GET /admin/orders — 訂貨單列表
router.get("/admin/orders", authenticateAdmin, async (_req, res) => {
  try {
    const orders = await getAllOrders();
    return res.json({ orders });
  } catch (error) {
    console.error("[GET /admin/orders]", error);

    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        error: "orders 資料表不存在，請執行 server/sql/orders.sql",
      });
    }

    return res.status(500).json({ error: "讀取訂貨單列表失敗" });
  }
});

// GET /admin/orders/:id — 訂貨單詳情
router.get("/admin/orders/:id", authenticateAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ error: "無效的訂單 ID" });
    }

    const detail = await getOrderDetailById(orderId);
    if (!detail) {
      return res.status(404).json({ error: "找不到此訂單" });
    }

    return res.json(detail);
  } catch (error) {
    console.error("[GET /admin/orders/:id]", error);
    return res.status(500).json({ error: "讀取訂貨單詳情失敗" });
  }
});

export { SALT_ROUNDS };
export default router;
