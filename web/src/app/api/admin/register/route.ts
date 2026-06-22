import bcrypt from "bcrypt";
import { AdminRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import {
  SALT_ROUNDS,
  createAdminAuthSession,
  isValidEmail,
  requireAdmin,
} from "@/lib/server/auth";
import { mapPrismaAdmin } from "@/lib/server/mappers";

const ASSIGNABLE_ROLES: AdminRole[] = ["superadmin", "manager", "staff"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!username?.trim() || !password) {
      return jsonError("請填寫帳號與密碼", 400);
    }

    if (email?.trim() && !isValidEmail(email)) {
      return jsonError("電郵格式不正確", 400);
    }

    if (password.length < 8) {
      return jsonError("密碼至少需要 8 個字元", 400);
    }

    const adminCount = await prisma.admin.count();

    let assignedRole: AdminRole = AdminRole.staff;

    if (adminCount === 0) {
      assignedRole = AdminRole.superadmin;
    } else {
      const auth = await requireAdmin(request);
      if (auth instanceof Response) return auth;

      if (auth.admin.role === "superadmin") {
        assignedRole = ASSIGNABLE_ROLES.includes(role)
          ? role
          : AdminRole.staff;
      } else if (auth.admin.role === "manager") {
        assignedRole = AdminRole.staff;
      } else {
        return jsonError("權限不足", 403);
      }
    }

    const existingUsername = await prisma.admin.findUnique({
      where: { username: username.trim() },
    });
    if (existingUsername) {
      return jsonError("此帳號已被使用", 409);
    }

    if (email?.trim()) {
      const existingEmail = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingEmail) {
        return jsonError("此電郵已被使用", 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const dbAdmin = await prisma.admin.create({
      data: {
        username: username.trim(),
        passwordHash,
        email: email?.trim().toLowerCase() || null,
        role: assignedRole,
      },
    });

    const admin = mapPrismaAdmin(dbAdmin);

    if (adminCount === 0) {
      const { token, expiresAt } = await createAdminAuthSession(
        dbAdmin.id,
        dbAdmin.role,
      );
      return jsonOk(
        {
          message: "首位管理員已建立",
          admin,
          token,
          expires_at: expiresAt,
        },
        201,
      );
    }

    return jsonOk({ message: "管理員已註冊", admin }, 201);
  } catch (error) {
    console.error("[POST /api/admin/register]", error);
    return jsonError("註冊失敗，請稍後再試", 500);
  }
}
