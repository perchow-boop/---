import type { AdminOrderDetail, AdminOrderSummary } from "@/types/order";
import { INTERNAL_API } from "@/lib/api-client";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error("無法連線至管理員訂單 API，請確認 Next.js 開發伺服器是否正常運作");
  }

  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤");
  }

  if (!response.ok) {
    throw new Error(data.error || "讀取訂貨單失敗");
  }

  return data as T;
}

export async function fetchAdminOrders(token: string) {
  const data = await request<{ orders: AdminOrderSummary[] }>(
    `${INTERNAL_API.admin}/orders`,
    token,
  );
  return data.orders;
}

export async function fetchAdminOrderDetail(token: string, orderId: number) {
  return request<AdminOrderDetail>(
    `${INTERNAL_API.admin}/orders/${orderId}`,
    token,
  );
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: number,
  status: string,
) {
  return request<{
    message: string;
    order_id: number;
    status: string;
    updated_at: string;
  }>(`${INTERNAL_API.admin}/orders/${orderId}/status`, token, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
