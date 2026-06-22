import pool from "../config/db.js";

export async function getFavoritesForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       f.favorite_id,
       f.user_id,
       f.product_id,
       f.created_at,
       p.name,
       p.price,
       p.image_url,
       p.type_id,
       p.\`type\` AS product_category,
       p.stock
     FROM favorites f
     INNER JOIN Products p ON p.product_id = f.product_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
  );

  return rows.map((row) => ({
    favorite_id: row.favorite_id,
    user_id: row.user_id,
    product_id: row.product_id,
    created_at: row.created_at,
    product: {
      product_id: row.product_id,
      name: row.name,
      price: Number(row.price),
      image_url: row.image_url,
      type_id: row.type_id,
      category: row.product_category,
      stock: row.stock,
    },
  }));
}

export async function addFavorite(userId, productId) {
  const [products] = await pool.execute(
    "SELECT product_id FROM Products WHERE product_id = ? LIMIT 1",
    [productId],
  );

  if (!products.length) {
    return { error: "PRODUCT_NOT_FOUND" };
  }

  await pool.execute(
    `INSERT INTO favorites (user_id, product_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE favorite_id = favorite_id`,
    [userId, productId],
  );

  return { ok: true };
}

export async function removeFavorite(userId, productId) {
  const [result] = await pool.execute(
    "DELETE FROM favorites WHERE user_id = ? AND product_id = ?",
    [userId, productId],
  );

  return result.affectedRows > 0;
}
