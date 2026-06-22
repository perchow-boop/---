import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import { createAdminAuthSession } from "@/lib/server/auth";
import { mapPrismaAdmin } from "@/lib/server/mappers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username?.trim() || !password) {
      return jsonError("請填寫帳號與密碼", 400);
    }

    const dbAdmin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    });

    if (!dbAdmin) {
      return jsonError("帳號或密碼錯誤", 401);
    }

    const passwordMatch = await bcrypt.compare(password, dbAdmin.passwordHash);

    if (!passwordMatch) {
      return jsonError("帳號或密碼錯誤", 401);
    }

    const { token, expiresAt } = await createAdminAuthSession(
      dbAdmin.id,
      dbAdmin.role,
    );

    return jsonOk({
      message: "登入成功",
      token,
      expires_at: expiresAt,
      admin: mapPrismaAdmin(dbAdmin),
    });
  } catch (error) {
    console.error("[POST /api/admin/login]", error);
    return jsonError("登入失敗，請稍後再試", 500);
  }
}
