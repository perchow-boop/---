import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { setDefaultAddress } from "@/lib/server/addresses";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const addressId = Number(id);

    if (!Number.isInteger(addressId) || addressId < 1) {
      return jsonError("無效的地址 ID", 400);
    }

    const result = await setDefaultAddress(addressId, auth.user.user_id);

    if (!result) {
      return jsonError("找不到此地址", 404);
    }

    return jsonOk({
      message: "已設為預設地址",
      address: result.address,
      user: result.user,
    });
  } catch (error) {
    console.error("[PUT /api/addresses/:id/default]", error);
    return jsonError("設定預設地址失敗，請稍後再試", 500);
  }
}
