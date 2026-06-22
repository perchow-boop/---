import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { getAllOrders } from "@/lib/server/orders";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const orders = await getAllOrders();
    return jsonOk({ orders });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return jsonError("讀取訂貨單列表失敗", 500);
  }
}
