import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import pool from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function columnExists(table, column) {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows.length > 0;
}

async function tableExists(table) {
  const [rows] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  return rows.length > 0;
}

async function runStatement(sql) {
  await pool.execute(sql);
  console.log("OK:", sql.split("\n")[0].slice(0, 70));
}

async function main() {
  if (!(await columnExists("Users", "first_name"))) {
    await runStatement(
      "ALTER TABLE Users ADD COLUMN first_name VARCHAR(50) NULL AFTER user_id",
    );
  }

  if (!(await columnExists("Users", "last_name"))) {
    await runStatement(
      "ALTER TABLE Users ADD COLUMN last_name VARCHAR(50) NULL AFTER first_name",
    );
  }

  if (!(await columnExists("Users", "status"))) {
    await runStatement(
      "ALTER TABLE Users ADD COLUMN status ENUM('active', 'suspended') NOT NULL DEFAULT 'active' AFTER password_hash",
    );
  }

  if (await columnExists("Users", "name")) {
    await pool.execute(
      `UPDATE Users
       SET first_name = TRIM(name)
       WHERE (first_name IS NULL OR first_name = '')
         AND name IS NOT NULL AND TRIM(name) <> ''`,
    );
    console.log("OK: migrated Users.name -> first_name");
  }

  if (!(await tableExists("user_addresses"))) {
    const sqlPath = path.join(__dirname, "..", "sql", "migrate_member_v2.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const createAddresses = sql
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.includes("CREATE TABLE IF NOT EXISTS user_addresses"));

    if (createAddresses) {
      await pool.execute(createAddresses);
      console.log("OK: created user_addresses");
    }
  }

  if (await columnExists("Users", "address_1")) {
    const [existing] = await pool.execute(
      "SELECT COUNT(*) AS total FROM user_addresses",
    );
    if (Number(existing[0].total) === 0) {
      await pool.execute(
        `INSERT INTO user_addresses (
           user_id, recipient_name, phone, country, city, street_address, is_default
         )
         SELECT user_id, name, phone, country, city, address_1, TRUE
         FROM Users
         WHERE address_1 IS NOT NULL OR city IS NOT NULL OR country IS NOT NULL`,
      );
      console.log("OK: imported legacy addresses");
    }
  }

  if (!(await tableExists("favorites"))) {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS favorites (
        favorite_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_favorites_user_product (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
        INDEX idx_favorites_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    console.log("OK: created favorites");
  }

  if (!(await columnExists("orders", "guest_name"))) {
    await runStatement("ALTER TABLE orders MODIFY COLUMN user_id INT NULL");
    await runStatement(
      "ALTER TABLE orders ADD COLUMN guest_name VARCHAR(100) NULL AFTER user_id",
    );
    await runStatement(
      "ALTER TABLE orders ADD COLUMN guest_email VARCHAR(100) NULL AFTER guest_name",
    );
    await runStatement(
      "ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_email",
    );
    await runStatement(
      "ALTER TABLE orders ADD COLUMN shipping_address_id INT NULL AFTER guest_phone",
    );
    await runStatement(
      "ALTER TABLE orders ADD COLUMN shipping_address_text TEXT NULL AFTER shipping_address_id",
    );
  }

  if (!(await columnExists("orders", "billing_address"))) {
    await runStatement(
      "ALTER TABLE orders ADD COLUMN billing_address TEXT NULL AFTER shipping_address_text",
    );
  }

  if (!(await columnExists("orders", "total_amount"))) {
    await runStatement(
      "ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) NULL AFTER billing_address",
    );
  }

  await pool.execute(
    `ALTER TABLE orders
     MODIFY COLUMN status ENUM(
       'pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'
     ) NOT NULL DEFAULT 'pending'`,
  );
  console.log("OK: orders.status enum updated");

  console.log("Member v2 migration complete");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
