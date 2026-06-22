import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember, splitLegacyName } from "@/lib/server/auth";
import { normalizeCountry } from "@/lib/server/addresses";
import { updateMemberProfile } from "@/lib/server/members";
import { normalizePhone } from "@/lib/server/phone";

export async function GET(request: NextRequest) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;

  return jsonOk({ user: auth.user });
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const {
      first_name,
      last_name,
      name,
      phone,
      country,
      city,
      street_address,
      postal_code,
      recipient_name,
    } = body;

    const resolvedFirstName =
      first_name?.trim() ||
      splitLegacyName(name || auth.user.first_name).firstName;
    const resolvedLastName =
      last_name?.trim() ??
      (name ? splitLegacyName(name).lastName : auth.user.last_name || "");

    if (!resolvedFirstName) {
      return jsonError("名字不可為空", 400);
    }

    if (country?.trim() && !normalizeCountry(country)) {
      return jsonError("國家／地區僅支援香港、台灣、澳門", 400);
    }

    const normalizedCountry = normalizeCountry(country);
    const normalizedPhone = normalizePhone(
      phone,
      normalizedCountry || "HK",
    );

    const user = await updateMemberProfile(auth.user.user_id, {
      first_name: resolvedFirstName,
      last_name: resolvedLastName || null,
      phone: normalizedPhone,
      country: normalizedCountry,
      city,
      street_address,
      postal_code,
      recipient_name:
        recipient_name?.trim() ||
        `${resolvedFirstName} ${resolvedLastName || ""}`.trim(),
    });

    return jsonOk({
      message: "個人資料已更新",
      user,
    });
  } catch (error) {
    console.error("[PUT /api/auth/profile]", error);
    return jsonError("更新失敗，請稍後再試", 500);
  }
}
