import { Router } from "express";
import pool from "../config/db.js";
import { authenticateAdmin, requireProductWriteAccess } from "../middleware/adminAuth.js";

const router = Router();

const PRODUCT_FIELDS = `
  product_id,
  type_id AS product_type_id,
  \`type\` AS product_category,
  name,
  description,
  price,
  stock,
  image_url,
  created_at,
  updated_at
`;

function mapProduct(row) {
  return {
    product_id: row.product_id,
    type_id: row.product_type_id ?? null,
    type: row.product_category ?? null,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    image_url: row.image_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function validateProductBody(body, isUpdate = false) {
  const { type_id, type, name, description, price, stock, image_url } = body;

  if (!isUpdate && (!name?.trim() || price === undefined || price === null)) {
    return "請填寫商品名稱與價格";
  }

  if (type_id !== undefined && type_id !== null && String(type_id).length > 50) {
    return "型號不可超過 50 個字元";
  }

  if (type !== undefined && type !== null && String(type).length > 20) {
    return "種類不可超過 20 個字元";
  }

  if (name !== undefined && !name?.trim()) {
    return "商品名稱不可為空";
  }

  if (price !== undefined && (Number.isNaN(Number(price)) || Number(price) < 0)) {
    return "價格必須為 0 或以上的數字";
  }

  if (stock !== undefined && !Number.isInteger(Number(stock))) {
    return "庫存必須為整數";
  }

  if (image_url !== undefined && image_url !== null && String(image_url).length > 255) {
    return "圖片網址過長";
  }

  return null;
}

router.get("/products", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${PRODUCT_FIELDS} FROM Products ORDER BY product_id DESC`,
    );
    return res.json({ products: rows.map(mapProduct) });
  } catch (error) {
    console.error("[GET /products]", error);
    return res.status(500).json({ error: "讀取商品列表失敗" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${PRODUCT_FIELDS} FROM Products WHERE product_id = ? LIMIT 1`,
      [req.params.id],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "找不到此商品" });
    }

    return res.json({ product: mapProduct(rows[0]) });
  } catch (error) {
    console.error("[GET /products/:id]", error);
    return res.status(500).json({ error: "讀取商品失敗" });
  }
});

router.post("/products", authenticateAdmin, requireProductWriteAccess, async (req, res) => {
  try {
    const error = validateProductBody(req.body);
    if (error) return res.status(400).json({ error });

    const { type_id, type, name, description, price, stock = 0, image_url } =
      req.body;

    const [result] = await pool.execute(
      `INSERT INTO Products (type_id, \`type\`, name, description, price, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        type_id?.trim() || null,
        type?.trim() || null,
        name.trim(),
        description?.trim() || null,
        Number(price),
        Number(stock),
        image_url?.trim() || null,
      ],
    );

    const [rows] = await pool.execute(
      `SELECT ${PRODUCT_FIELDS} FROM Products WHERE product_id = ? LIMIT 1`,
      [result.insertId],
    );

    return res.status(201).json({
      message: "商品已新增",
      product: mapProduct(rows[0]),
    });
  } catch (error) {
    console.error("[POST /products]", error);
    return res.status(500).json({ error: "新增商品失敗" });
  }
});

router.put("/products/:id", authenticateAdmin, requireProductWriteAccess, async (req, res) => {
  try {
    const error = validateProductBody(req.body, true);
    if (error) return res.status(400).json({ error });

    const [existing] = await pool.execute(
      "SELECT product_id FROM Products WHERE product_id = ? LIMIT 1",
      [req.params.id],
    );

    if (!existing.length) {
      return res.status(404).json({ error: "找不到此商品" });
    }

    const { type_id, type, name, description, price, stock, image_url } =
      req.body;

    await pool.execute(
      `UPDATE Products
       SET type_id = ?, \`type\` = ?, name = ?, description = ?, price = ?, stock = ?, image_url = ?
       WHERE product_id = ?`,
      [
        type_id?.trim() || null,
        type?.trim() || null,
        name.trim(),
        description?.trim() || null,
        Number(price),
        Number(stock),
        image_url?.trim() || null,
        req.params.id,
      ],
    );

    const [rows] = await pool.execute(
      `SELECT ${PRODUCT_FIELDS} FROM Products WHERE product_id = ? LIMIT 1`,
      [req.params.id],
    );

    return res.json({
      message: "商品已更新",
      product: mapProduct(rows[0]),
    });
  } catch (error) {
    console.error("[PUT /products/:id]", error);
    return res.status(500).json({ error: "更新商品失敗" });
  }
});

router.delete("/products/:id", authenticateAdmin, requireProductWriteAccess, async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM Products WHERE product_id = ?",
      [req.params.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "找不到此商品" });
    }

    return res.json({ message: "商品已刪除" });
  } catch (error) {
    console.error("[DELETE /products/:id]", error);
    return res.status(500).json({ error: "刪除商品失敗" });
  }
});

export default router;
