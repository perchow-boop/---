/**
 * API 基底網址
 * - 留空：使用同網域 Next.js API Routes（/api/...）— 建議
 * - 設為 http://localhost:4000：過渡期仍可指向舊 Express
 */
export function getLegacyApiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

/** 內建 Next.js API（同網域） */
export const INTERNAL_API = {
  auth: "/api/auth",
  products: "/api/products",
  admin: "/api/admin",
  addresses: "/api/addresses",
  favorites: "/api/favorites",
  orders: "/api/orders",
} as const;
