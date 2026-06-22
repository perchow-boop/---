import type { OrderDetail, OrderSummary } from "@/types/order";
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
    throw new Error("無法連線至訂單 API，請確認 Next.js 開發伺服器是否正常運作");
  }

  let data: { error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("伺服器回應格式錯誤");
  }

  if (!response.ok) {
    throw new Error(data.error || "讀取訂單失敗");
  }

  return data as T;
}

export async function fetchOrders(token: string) {
  const data = await request<{ orders: OrderSummary[] }>(
    INTERNAL_API.orders,
    token,
  );
  return data.orders;
}

export async function fetchOrderDetail(token: string, orderId: number) {
  return request<OrderDetail>(`${INTERNAL_API.orders}/${orderId}`, token);
}

export async function confirmOrder(sessionId: string) {
  const response = await fetch("/api/orders/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });

  const data = (await response.json()) as {
    error?: string;
    order_id?: number | null;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "訂單確認失敗");
  }

  return data;
}
