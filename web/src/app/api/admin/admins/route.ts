import { AdminRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { mapPrismaAdmin } from "@/lib/server/mappers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  if (auth.admin.role !== "superadmin") {
    return jsonError("權限不足", 403);
  }

  try {
    const admins = await prisma.admin.findMany({
      orderBy: { id: "asc" },
    });

    return jsonOk({ admins: admins.map(mapPrismaAdmin) });
  } catch (error) {
    console.error("[GET /api/admin/admins]", error);
    return jsonError("讀取管理員列表失敗", 500);
  }
}
