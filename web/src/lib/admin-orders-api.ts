import type { AdminOrderDetail, AdminOrderSummary } from "@/types/order";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `無法連線至 API（${API_URL}）。請確認 server 已執行 npm run dev`,
    );
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
    "/admin/orders",
    token,
  );
  return data.orders;
}

export async function fetchAdminOrderDetail(token: string, orderId: number) {
  return request<AdminOrderDetail>(`/admin/orders/${orderId}`, token);
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
  }>(`/admin/orders/${orderId}/status`, token, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
