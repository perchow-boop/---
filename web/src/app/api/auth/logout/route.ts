import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/server/http";
import { requireMember } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;

  await prisma.auth.deleteMany({
    where: { userId: auth.user.user_id },
  });

  return jsonOk({ message: "已登出" });
}
