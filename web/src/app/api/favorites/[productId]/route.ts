import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { removeFavorite } from "@/lib/server/favorites";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const { productId } = await context.params;
    const id = Number(productId);

    if (!Number.isInteger(id) || id < 1) {
      return jsonError("無效的商品 ID", 400);
    }

    const removed = await removeFavorite(auth.user.user_id, id);

    if (!removed) {
      return jsonError("收藏項不存在", 404);
    }

    return jsonOk({ message: "已移除收藏" });
  } catch (error) {
    console.error("[DELETE /api/favorites/:productId]", error);
    return jsonError("移除收藏失敗", 500);
  }
}
