import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import { createMemberAuthSession } from "@/lib/server/auth";
import { getMemberWithAddresses } from "@/lib/server/members";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return jsonError("請填寫電郵與密碼", 400);
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!dbUser) {
      return jsonError("電郵或密碼錯誤", 401);
    }

    if (dbUser.status === "suspended") {
      return jsonError("此帳戶已被停用，請聯絡客服", 403);
    }

    const passwordMatch = await bcrypt.compare(password, dbUser.passwordHash);

    if (!passwordMatch) {
      return jsonError("電郵或密碼錯誤", 401);
    }

    const user = await getMemberWithAddresses(dbUser.id);
    if (!user) {
      return jsonError("電郵或密碼錯誤", 401);
    }

    const { token, expiresAt } = await createMemberAuthSession(dbUser.id);

    return jsonOk({
      message: "登入成功",
      token,
      expires_at: expiresAt,
      user,
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return jsonError("登入失敗，請稍後再試", 500);
  }
}
