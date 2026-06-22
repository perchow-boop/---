import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { getOrdersForUser } from "@/lib/server/orders";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const orders = await getOrdersForUser(auth.user.user_id);
    return jsonOk({ orders });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return jsonError("讀取訂單列表失敗", 500);
  }
}
