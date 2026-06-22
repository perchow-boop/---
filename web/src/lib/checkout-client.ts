import type { CheckoutRequest } from "@/types/checkout";

export async function startCheckout(
  payload: CheckoutRequest,
  token?: string | null,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "結帳失敗，請稍後再試。");
  }

  return data.url;
}
