import type { DbProduct } from "@/types/db-product";
import { INTERNAL_API } from "@/lib/api-client";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("無法連線至商品 API，請確認 Next.js 開發伺服器是否正常運作");
  }

  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤");
  }

  if (!response.ok) {
    throw new Error(data.error || "請求失敗");
  }

  return data as T;
}

export async function fetchProducts() {
  return request<{ products: DbProduct[] }>(INTERNAL_API.products);
}

export async function fetchProduct(id: number, options: RequestInit = {}) {
  return request<{ product: DbProduct }>(
    `${INTERNAL_API.products}/${id}`,
    options,
  );
}

export async function createProduct(
  token: string,
  payload: Omit<DbProduct, "product_id" | "created_at" | "updated_at">,
) {
  return request<{ message: string; product: DbProduct }>(INTERNAL_API.products, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  token: string,
  id: number,
  payload: Omit<DbProduct, "product_id" | "created_at" | "updated_at">,
) {
  return request<{ message: string; product: DbProduct }>(
    `${INTERNAL_API.products}/${id}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteProduct(token: string, id: number) {
  return request<{ message: string }>(`${INTERNAL_API.products}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
