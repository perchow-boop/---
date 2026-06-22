import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import pool from "../src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sqlPath = path.join(__dirname, "..", "sql", "orders.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const statements = sql
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("--") && !part.startsWith("USE "));

  for (const statement of statements) {
    await pool.execute(statement);
    console.log("OK:", statement.split("\n")[0].slice(0, 60));
  }

  const [tables] = await pool.execute(
    "SHOW TABLES LIKE 'orders'",
  );
  console.log("orders table:", tables.length ? "exists" : "missing");

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
