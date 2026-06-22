import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";
import { createAddress, normalizeCountry } from "@/lib/server/addresses";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

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

    const result = await createAddress(auth.user.user_id, {
      recipient_name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      is_default,
    });

    return jsonOk(
      {
        message: "地址已新增",
        address: result.address,
        user: result.user,
      },
      201,
    );
  } catch (error) {
    console.error("[POST /api/addresses]", error);
    return jsonError("新增地址失敗，請稍後再試", 500);
  }
}
