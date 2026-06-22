import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  await prisma.adminAuth.deleteMany({
    where: { adminId: auth.admin.admin_id },
  });

  return jsonOk({ message: "已登出" });
}
