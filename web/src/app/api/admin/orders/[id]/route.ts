import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { getOrderDetailById } from "@/lib/server/orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId < 1) {
      return jsonError("無效的訂單 ID", 400);
    }

    const detail = await getOrderDetailById(orderId);

    if (!detail) {
      return jsonError("找不到此訂貨單", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    console.error("[GET /api/admin/orders/:id]", error);
    return jsonError("讀取訂貨單詳情失敗", 500);
  }
}
