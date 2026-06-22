import type { OrderDetail, OrderSummary } from "@/types/order";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `無法連線至訂單 API（${API_URL}）。請確認已啟動後端：在 server 資料夾執行 npm run dev`,
    );
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
  const data = await request<{ orders: OrderSummary[] }>("/orders", token);
  return data.orders;
}

export async function fetchOrderDetail(token: string, orderId: number) {
  return request<OrderDetail>(`/orders/${orderId}`, token);
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
