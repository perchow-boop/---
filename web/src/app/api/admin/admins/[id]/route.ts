import bcrypt from "bcrypt";
import { AdminRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import { SALT_ROUNDS, isValidEmail, requireAdmin } from "@/lib/server/auth";
import { mapPrismaAdmin } from "@/lib/server/mappers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    if (auth.admin.role !== "superadmin") {
      return jsonError("權限不足", 403);
    }

    const { id } = await context.params;
    const adminId = Number(id);

    if (!Number.isInteger(adminId) || adminId < 1) {
      return jsonError("無效的管理員 ID", 400);
    }

    const body = await request.json();
    const { email, role, password } = body;

    const existing = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!existing) {
      return jsonError("找不到此管理員", 404);
    }

    const data: {
      email?: string | null;
      role?: AdminRole;
      passwordHash?: string;
    } = {};

    if (email !== undefined) {
      if (email && !isValidEmail(String(email))) {
        return jsonError("電郵格式不正確", 400);
      }
      const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
      if (normalizedEmail) {
        const duplicate = await prisma.admin.findFirst({
          where: { email: normalizedEmail, NOT: { id: adminId } },
        });
        if (duplicate) return jsonError("此電郵已被使用", 409);
      }
      data.email = normalizedEmail;
    }

    if (role !== undefined) {
      const nextRole = role as AdminRole;
      if (!Object.values(AdminRole).includes(nextRole)) {
        return jsonError("無效的角色", 400);
      }
      if (
        nextRole !== AdminRole.superadmin &&
        existing.role === AdminRole.superadmin
      ) {
        const superadminCount = await prisma.admin.count({
          where: { role: AdminRole.superadmin },
        });
        if (superadminCount <= 1) {
          return jsonError("系統至少需要一位 superadmin", 400);
        }
      }
      data.role = nextRole;
    }

    if (password) {
      if (String(password).length < 8) {
        return jsonError("密碼至少需要 8 個字元", 400);
      }
      data.passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data,
    });

    return jsonOk({
      message: "管理員已更新",
      admin: mapPrismaAdmin(updated),
    });
  } catch (error) {
    console.error("[PUT /api/admin/admins/:id]", error);
    return jsonError("更新管理員失敗", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;

    if (auth.admin.role !== "superadmin") {
      return jsonError("權限不足", 403);
    }

    const { id } = await context.params;
    const adminId = Number(id);

    if (!Number.isInteger(adminId) || adminId < 1) {
      return jsonError("無效的管理員 ID", 400);
    }

    if (auth.admin.admin_id === adminId) {
      return jsonError("無法刪除自己的帳號", 400);
    }

    const existing = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!existing) {
      return jsonError("找不到此管理員", 404);
    }

    if (existing.role === AdminRole.superadmin) {
      const superadminCount = await prisma.admin.count({
        where: { role: AdminRole.superadmin },
      });
      if (superadminCount <= 1) {
        return jsonError("系統至少需要一位 superadmin", 400);
      }
    }

    await prisma.admin.delete({ where: { id: adminId } });

    return jsonOk({ message: "管理員已刪除" });
  } catch (error) {
    console.error("[DELETE /api/admin/admins/:id]", error);
    return jsonError("刪除管理員失敗", 500);
  }
}
