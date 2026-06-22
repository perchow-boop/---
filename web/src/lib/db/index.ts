import mysql, {
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

type SqlParam = string | number | boolean | Date | null | Buffer;

export type DbDriver = "mysql" | "postgres";

/**
 * 資料庫連線設定
 *
 * 目前：MySQL（XAMPP / 主機商 MySQL）
 * 未來 Neon：DB_DRIVER=postgres + DATABASE_URL=postgresql://...
 * 未來 Supabase：DATABASE_URL 或 SUPABASE_DB_URL（Postgres 連線字串）
 */
function getDriver(): DbDriver {
  const driver = process.env.DB_DRIVER?.toLowerCase();
  if (driver === "postgres") return "postgres";
  return "mysql";
}

let pool: Pool | null = null;

export function getDbDriver(): DbDriver {
  return getDriver();
}

export function getPool(): Pool {
  if (getDriver() !== "mysql") {
    throw new Error(
      "目前程式使用 mysql2。切換至 Neon/Supabase 時請將查詢改為 postgres 驅動，或先用 Supabase REST API。",
    );
  }

  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl?.startsWith("mysql://")) {
      pool = mysql.createPool(databaseUrl);
    } else {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "lukibou_db",
        waitForConnections: true,
        connectionLimit: 10,
        charset: "utf8mb4",
      });
    }
  }

  return pool;
}

export async function query<T = RowDataPacket[]>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T;
}

export async function execute(
  sql: string,
  params: SqlParam[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}
