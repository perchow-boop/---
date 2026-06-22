import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { addFavorite, getFavoritesForUser } from "@/lib/server/favorites";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const favorites = await getFavoritesForUser(auth.user.user_id);
    return jsonOk({ favorites });
  } catch (error) {
    console.error("[GET /api/favorites]", error);
    return jsonError("讀取收藏清單失敗", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const productId = Number((await request.json()).product_id);

    if (!Number.isInteger(productId) || productId < 1) {
      return jsonError("無效的商品 ID", 400);
    }

    const result = await addFavorite(auth.user.user_id, productId);

    if (result.error === "PRODUCT_NOT_FOUND") {
      return jsonError("找不到此商品", 404);
    }

    return jsonOk({ message: "已加入收藏" }, 201);
  } catch (error) {
    console.error("[POST /api/favorites]", error);
    return jsonError("加入收藏失敗", 500);
  }
}
