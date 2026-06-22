import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  SALT_ROUNDS,
  createMemberAuthSession,
  isValidEmail,
  splitLegacyName,
} from "@/lib/server/auth";
import { getMemberWithAddresses } from "@/lib/server/members";
import { generateUniqueMemberId } from "@/lib/server/member-id";
import { normalizePhone } from "@/lib/server/phone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, name, email, password, phone } = body;

    const resolvedFirstName =
      first_name?.trim() || splitLegacyName(name || "").firstName;
    const resolvedLastName =
      last_name?.trim() || splitLegacyName(name || "").lastName;

    if (!resolvedFirstName || !email?.trim() || !password) {
      return jsonError("請填寫名字、電郵與密碼", 400);
    }

    if (!isValidEmail(email)) {
      return jsonError("電郵格式不正確", 400);
    }

    if (password.length < 8) {
      return jsonError("密碼至少需要 8 個字元", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return jsonError("此電郵已被註冊", 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const memberId = await generateUniqueMemberId();
    const displayName =
      `${resolvedFirstName} ${resolvedLastName || ""}`.trim();

    const dbUser = await prisma.user.create({
      data: {
        memberId,
        firstName: resolvedFirstName,
        lastName: resolvedLastName || null,
        name: displayName,
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() ? normalizePhone(phone, "HK") : null,
        country: "",
        address1: "",
      },
    });

    const user = (await getMemberWithAddresses(dbUser.id))!;
    const { token, expiresAt } = await createMemberAuthSession(dbUser.id);

    return jsonOk(
      {
        message: "註冊成功",
        token,
        expires_at: expiresAt,
        user,
      },
      201,
    );
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return jsonError("註冊失敗，請稍後再試", 500);
  }
}
