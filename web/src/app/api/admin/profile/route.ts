import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  return jsonOk({ admin: auth.admin });
}
