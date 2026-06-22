import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { getOrderDetailForUser } from "@/lib/server/orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId < 1) {
      return jsonError("無效的訂單 ID", 400);
    }

    const detail = await getOrderDetailForUser(orderId, auth.user.user_id);

    if (!detail) {
      return jsonError("找不到此訂單", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    console.error("[GET /api/orders/:id]", error);
    return jsonError("讀取訂單詳情失敗", 500);
  }
}
