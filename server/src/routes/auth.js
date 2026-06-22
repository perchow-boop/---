import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { normalizePhone } from "../utils/phone.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  getUserByEmail,
  getUserById,
  createUser,
  normalizeCountry,
  upsertDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/users.js";
import {
  addFavorite,
  getFavoritesForUser,
  removeFavorite,
} from "../services/favorites.js";

const router = Router();
const SALT_ROUNDS = 12;

function createToken(userId) {
  return jwt.sign({ user_id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function getTokenExpiry() {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  const now = new Date();

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      now.setDate(now.getDate() + value);
      break;
    case "h":
      now.setHours(now.getHours() + value);
      break;
    case "m":
      now.setMinutes(now.getMinutes() + value);
      break;
    case "s":
      now.setSeconds(now.getSeconds() + value);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }

  return now;
}

async function createAuthSession(userId) {
  const token = createToken(userId);
  const expiresAt = getTokenExpiry();

  await pool.execute(
    `INSERT INTO Auth (user_id, token, expires_at, last_login)
     VALUES (?, ?, ?, NOW())`,
    [userId, token, expiresAt],
  );

  return { token, expiresAt };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function splitLegacyName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: name.trim(), lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// POST /register
router.post("/register", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      name,
      email,
      password,
      phone,
    } = req.body;

    const resolvedFirstName =
      first_name?.trim() || splitLegacyName(name || "").firstName;
    const resolvedLastName =
      last_name?.trim() || splitLegacyName(name || "").lastName;

    if (!resolvedFirstName || !email?.trim() || !password) {
      return res.status(400).json({ error: "請填寫名字、電郵與密碼" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "電郵格式不正確" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "密碼至少需要 8 個字元" });
    }

    const [existing] = await pool.execute(
      "SELECT user_id FROM Users WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()],
    );

    if (existing.length) {
      return res.status(409).json({ error: "此電郵已被註冊" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await createUser({
      first_name: resolvedFirstName,
      last_name: resolvedLastName || null,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      phone: phone?.trim() ? normalizePhone(phone, "HK") : null,
    });

    if (!user) {
      return res.status(500).json({ error: "註冊失敗，請稍後再試" });
    }

    const { token, expiresAt } = await createAuthSession(user.user_id);

    return res.status(201).json({
      message: "註冊成功",
      token,
      expires_at: expiresAt,
      user,
    });
  } catch (error) {
    console.error("[POST /register]", error);
    return res.status(500).json({ error: "註冊失敗，請稍後再試" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "請填寫電郵與密碼" });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "電郵或密碼錯誤" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ error: "此帳戶已被停用，請聯絡客服" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "電郵或密碼錯誤" });
    }

    const { token, expiresAt } = await createAuthSession(user.user_id);

    const { password_hash: _passwordHash, ...publicUser } = user;

    return res.json({
      message: "登入成功",
      token,
      expires_at: expiresAt,
      user: publicUser,
    });
  } catch (error) {
    console.error("[POST /login]", error);
    return res.status(500).json({ error: "登入失敗，請稍後再試" });
  }
});

// GET /profile
router.get("/profile", authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

// PUT /profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      recipient_name,
    } = req.body;

    const resolvedFirstName =
      first_name?.trim() || splitLegacyName(name || req.user.first_name).firstName;
    const resolvedLastName =
      last_name?.trim() ??
      (name ? splitLegacyName(name).lastName : req.user.last_name || "");

    if (!resolvedFirstName) {
      return res.status(400).json({ error: "名字不可為空" });
    }

    if (country?.trim() && !normalizeCountry(country)) {
      return res.status(400).json({ error: "國家／地區僅支援香港、台灣、澳門" });
    }

    const normalizedCountry = normalizeCountry(country);
    const normalizedPhone = normalizePhone(phone, normalizedCountry || "HK");

    await pool.execute(
      `UPDATE Users
       SET first_name = ?, last_name = ?, name = ?, phone = ?
       WHERE user_id = ?`,
      [
        resolvedFirstName,
        resolvedLastName || null,
        `${resolvedFirstName} ${resolvedLastName || ""}`.trim(),
        normalizedPhone,
        req.user.user_id,
      ],
    );

    if (street_address?.trim() || city?.trim() || normalizedCountry) {
      await upsertDefaultAddress(req.user.user_id, {
        recipient_name:
          recipient_name?.trim() ||
          `${resolvedFirstName} ${resolvedLastName || ""}`.trim(),
        phone: normalizedPhone,
        country: normalizedCountry,
        city,
        street_address,
        postal_code,
      });
    }

    const user = await getUserById(req.user.user_id);

    return res.json({
      message: "個人資料已更新",
      user,
    });
  } catch (error) {
    console.error("[PUT /profile]", error);
    return res.status(500).json({ error: "更新失敗，請稍後再試" });
  }
});

// PUT /profile/password
router.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: "請填寫目前密碼與新密碼" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: "新密碼至少需要 8 個字元" });
    }

    const user = await getUserByEmail(req.user.email);

    if (!user) {
      return res.status(404).json({ error: "找不到會員帳戶" });
    }

    const passwordMatch = await bcrypt.compare(
      current_password,
      user.password_hash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "目前密碼不正確" });
    }

    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await pool.execute("UPDATE Users SET password_hash = ? WHERE user_id = ?", [
      passwordHash,
      req.user.user_id,
    ]);

    return res.json({ message: "密碼已更新" });
  } catch (error) {
    console.error("[PUT /profile/password]", error);
    return res.status(500).json({ error: "更新密碼失敗，請稍後再試" });
  }
});

// POST /addresses
router.post("/addresses", authenticateToken, async (req, res) => {
  try {
    const {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    } = req.body;

    if (!recipient_name?.trim() || !street_address?.trim() || !city?.trim()) {
      return res.status(400).json({ error: "請填寫收件人、地區與地址" });
    }

    if (country?.trim() && !normalizeCountry(country)) {
      return res.status(400).json({ error: "國家／地區僅支援香港、台灣、澳門" });
    }

    const address = await createAddress(req.user.user_id, {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    });

    const user = await getUserById(req.user.user_id);

    return res.status(201).json({
      message: "地址已新增",
      address,
      user,
    });
  } catch (error) {
    console.error("[POST /addresses]", error);
    return res.status(500).json({ error: "新增地址失敗，請稍後再試" });
  }
});

// PUT /addresses/:addressId
router.put("/addresses/:addressId", authenticateToken, async (req, res) => {
  try {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      return res.status(400).json({ error: "無效的地址 ID" });
    }

    const {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    } = req.body;

    if (!recipient_name?.trim() || !street_address?.trim() || !city?.trim()) {
      return res.status(400).json({ error: "請填寫收件人、地區與地址" });
    }

    if (country?.trim() && !normalizeCountry(country)) {
      return res.status(400).json({ error: "國家／地區僅支援香港、台灣、澳門" });
    }

    const address = await updateAddress(addressId, req.user.user_id, {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    });

    if (!address) {
      return res.status(404).json({ error: "找不到此地址" });
    }

    const user = await getUserById(req.user.user_id);

    return res.json({
      message: "地址已更新",
      address,
      user,
    });
  } catch (error) {
    console.error("[PUT /addresses/:addressId]", error);
    return res.status(500).json({ error: "更新地址失敗，請稍後再試" });
  }
});

// DELETE /addresses/:addressId
router.delete("/addresses/:addressId", authenticateToken, async (req, res) => {
  try {
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      return res.status(400).json({ error: "無效的地址 ID" });
    }

    const removed = await deleteAddress(addressId, req.user.user_id);

    if (!removed) {
      return res.status(404).json({ error: "找不到此地址" });
    }

    const user = await getUserById(req.user.user_id);

    return res.json({
      message: "地址已刪除",
      user,
    });
  } catch (error) {
    console.error("[DELETE /addresses/:addressId]", error);
    return res.status(500).json({ error: "刪除地址失敗，請稍後再試" });
  }
});

// PUT /addresses/:addressId/default
router.put(
  "/addresses/:addressId/default",
  authenticateToken,
  async (req, res) => {
    try {
      const addressId = Number(req.params.addressId);
      if (!Number.isInteger(addressId) || addressId < 1) {
        return res.status(400).json({ error: "無效的地址 ID" });
      }

      const address = await setDefaultAddress(addressId, req.user.user_id);

      if (!address) {
        return res.status(404).json({ error: "找不到此地址" });
      }

      const user = await getUserById(req.user.user_id);

      return res.json({
        message: "已設為預設地址",
        address,
        user,
      });
    } catch (error) {
      console.error("[PUT /addresses/:addressId/default]", error);
      return res.status(500).json({ error: "設定預設地址失敗，請稍後再試" });
    }
  },
);

// GET /favorites
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const favorites = await getFavoritesForUser(req.user.user_id);
    return res.json({ favorites });
  } catch (error) {
    console.error("[GET /favorites]", error);
    return res.status(500).json({ error: "讀取收藏清單失敗" });
  }
});

// POST /favorites
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const productId = Number(req.body.product_id);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: "無效的商品 ID" });
    }

    const result = await addFavorite(req.user.user_id, productId);
    if (result.error === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ error: "找不到此商品" });
    }

    return res.status(201).json({ message: "已加入收藏" });
  } catch (error) {
    console.error("[POST /favorites]", error);
    return res.status(500).json({ error: "加入收藏失敗" });
  }
});

// DELETE /favorites/:productId
router.delete("/favorites/:productId", authenticateToken, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({ error: "無效的商品 ID" });
    }

    const removed = await removeFavorite(req.user.user_id, productId);
    if (!removed) {
      return res.status(404).json({ error: "收藏項不存在" });
    }

    return res.json({ message: "已移除收藏" });
  } catch (error) {
    console.error("[DELETE /favorites/:productId]", error);
    return res.status(500).json({ error: "移除收藏失敗" });
  }
});

// POST /logout — 清除該會員所有登入 session
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    await pool.execute("DELETE FROM Auth WHERE user_id = ?", [req.user.user_id]);

    return res.json({ message: "已登出" });
  } catch (error) {
    console.error("[POST /logout]", error);
    return res.status(500).json({ error: "登出失敗，請稍後再試" });
  }
});

export default router;
