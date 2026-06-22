import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import pool from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function columnExists(name) {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'Users'
       AND COLUMN_NAME = ?`,
    [name],
  );
  return rows.length > 0;
}

async function main() {
  if (!(await columnExists("country"))) {
    const sqlPath = path.join(
      __dirname,
      "..",
      "sql",
      "migrate_users_country_city.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = sql
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith("--") && !part.startsWith("USE "));

    for (const statement of statements) {
      await pool.execute(statement);
      console.log("OK:", statement.split("\n")[0].slice(0, 60));
    }
  } else {
    console.log("country / city columns already exist");
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
