import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const MEMBER_ID_PREFIX = "LKBM-";
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateMemberId() {
  const bytes = crypto.randomBytes(7);
  let suffix = "";
  for (let i = 0; i < 7; i += 1) {
    suffix += CHARSET[bytes[i] % CHARSET.length];
  }
  return `${MEMBER_ID_PREFIX}${suffix}`;
}

export async function generateUniqueMemberId(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const memberId = generateMemberId();
    const existing = await prisma.user.findUnique({
      where: { memberId },
      select: { id: true },
    });
    if (!existing) return memberId;
  }
  throw new Error("無法產生唯一會員編號");
}

export async function ensureMemberId(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memberId: true },
  });

  if (!user) return null;

  const existing = user.memberId?.trim();
  if (existing) return existing;

  const memberId = await generateUniqueMemberId();
  await prisma.user.update({
    where: { id: userId },
    data: { memberId },
  });

  return memberId;
}
