import crypto from "crypto";
import pool from "../config/db.js";

const MEMBER_ID_PREFIX = "LKBM-";
const MEMBER_ID_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MEMBER_ID_SUFFIX_LENGTH = 7;

export function generateMemberId() {
  const bytes = crypto.randomBytes(MEMBER_ID_SUFFIX_LENGTH);
  let suffix = "";

  for (let index = 0; index < MEMBER_ID_SUFFIX_LENGTH; index += 1) {
    suffix += MEMBER_ID_CHARSET[bytes[index] % MEMBER_ID_CHARSET.length];
  }

  return `${MEMBER_ID_PREFIX}${suffix}`;
}

export async function generateUniqueMemberId(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const memberId = generateMemberId();

    const [rows] = await pool.execute(
      "SELECT user_id FROM Users WHERE member_id = ? LIMIT 1",
      [memberId],
    );

    if (!rows.length) {
      return memberId;
    }
  }

  throw new Error("無法產生唯一會員編號");
}
