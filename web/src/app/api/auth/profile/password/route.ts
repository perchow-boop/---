import bcrypt from "bcrypt";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/http";
import { SALT_ROUNDS, requireMember } from "@/lib/server/auth";
import { getMemberPasswordHash, updateMemberPassword } from "@/lib/server/members";

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireMember(request);
    if (auth instanceof Response) return auth;

    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return jsonError("請填寫目前密碼與新密碼", 400);
    }

    if (new_password.length < 8) {
      return jsonError("新密碼至少需要 8 個字元", 400);
    }

    const passwordHash = await getMemberPasswordHash(auth.user.user_id);
    if (!passwordHash) {
      return jsonError("找不到會員帳戶", 404);
    }

    const passwordMatch = await bcrypt.compare(current_password, passwordHash);
    if (!passwordMatch) {
      return jsonError("目前密碼不正確", 401);
    }

    const nextHash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await updateMemberPassword(auth.user.user_id, nextHash);

    return jsonOk({ message: "密碼已更新" });
  } catch (error) {
    console.error("[PUT /api/auth/profile/password]", error);
    return jsonError("更新密碼失敗，請稍後再試", 500);
  }
}
