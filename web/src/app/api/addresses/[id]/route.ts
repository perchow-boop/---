import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import {
  deleteAddress,
  normalizeCountry,
  updateAddress,
} from "@/lib/server/addresses";

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

    const body = await request.json();
    const {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    } = body;

    if (!recipient_name?.trim() || !street_address?.trim() || !city?.trim()) {
      return jsonError("請填寫收件人、地區與地址", 400);
    }

    if (country?.trim() && !normalizeCountry(country)) {
      return jsonError("國家／地區僅支援香港、台灣、澳門", 400);
    }

    const result = await updateAddress(addressId, auth.user.user_id, {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    });

    if (!result) {
      return jsonError("找不到此地址", 404);
    }

    return jsonOk({
      message: "地址已更新",
      address: result.address,
      user: result.user,
    });
  } catch (error) {
    console.error("[PUT /api/addresses/:id]", error);
    return jsonError("更新地址失敗，請稍後再試", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const { id } = await context.params;
    const addressId = Number(id);

    if (!Number.isInteger(addressId) || addressId < 1) {
      return jsonError("無效的地址 ID", 400);
    }

    const user = await deleteAddress(addressId, auth.user.user_id);

    if (!user) {
      return jsonError("找不到此地址", 404);
    }

    return jsonOk({
      message: "地址已刪除",
      user,
    });
  } catch (error) {
    console.error("[DELETE /api/addresses/:id]", error);
    return jsonError("刪除地址失敗，請稍後再試", 500);
  }
}
