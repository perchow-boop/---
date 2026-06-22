import jwt, { type SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/auth-api";
import type { Admin } from "@/lib/admin-api";
import { jsonError } from "@/lib/server/http";
import { getMemberWithAddresses } from "@/lib/server/members";
import { mapPrismaAdmin } from "@/lib/server/mappers";

const SALT_ROUNDS = 12;

export { SALT_ROUNDS };

type MemberJwtPayload = {
  user_id: number;
};

type AdminJwtPayload = {
  admin_id: number;
  role: AdminRole;
  type: "admin";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 未設定");
  }
  return secret;
}

function getMemberTokenExpiry() {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return parseExpiry(expiresIn);
}

function getAdminTokenExpiry() {
  const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || "8h";
  return parseExpiry(expiresIn);
}

function parseExpiry(expiresIn: string) {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  const now = new Date();

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      now.setDate(now.getDate() + value);
      break;
    case "h":
      now.setHours(now.getHours() + value);
      break;
    case "m":
      now.setMinutes(now.getMinutes() + value);
      break;
    case "s":
      now.setSeconds(now.getSeconds() + value);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }

  return now;
}

export function createMemberToken(userId: number) {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign({ user_id: userId }, getJwtSecret(), { expiresIn });
}

export function createAdminToken(adminId: number, role: AdminRole) {
  const expiresIn = (process.env.ADMIN_JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"];
  return jwt.sign({ admin_id: adminId, role, type: "admin" }, getJwtSecret(), {
    expiresIn,
  });
}

export async function createMemberAuthSession(userId: number) {
  const token = createMemberToken(userId);
  const expiresAt = getMemberTokenExpiry();

  await prisma.auth.create({
    data: {
      userId,
      token,
      expiresAt,
      lastLogin: new Date(),
    },
  });

  return { token, expiresAt };
}

export async function createAdminAuthSession(adminId: number, role: AdminRole) {
  const token = createAdminToken(adminId, role);
  const expiresAt = getAdminTokenExpiry();

  await prisma.$transaction([
    prisma.adminAuth.create({
      data: {
        adminId,
        token,
        expiresAt,
        lastLogin: new Date(),
      },
    }),
    prisma.admin.update({
      where: { id: adminId },
      data: { lastLogin: new Date() },
    }),
  ]);

  return { token, expiresAt };
}

export function getBearerToken(request: NextRequest | Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function requireMember(
  request: NextRequest,
): Promise<{ user: User; token: string } | Response> {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("未提供驗證 token", 401);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as MemberJwtPayload;

    const authRow = await prisma.auth.findFirst({
      where: {
        userId: payload.user_id,
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!authRow) {
      return jsonError("Token 無效或已過期", 401);
    }

    const user = await getMemberWithAddresses(payload.user_id);

    if (!user || user.status === "suspended") {
      return jsonError("使用者不存在", 401);
    }

    return { user, token };
  } catch {
    return jsonError("Token 驗證失敗", 401);
  }
}

export async function requireAdmin(
  request: NextRequest | Request,
): Promise<{ admin: Admin; token: string } | Response> {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("未提供驗證 token", 401);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;

    if (payload.type !== "admin" || !payload.admin_id) {
      return jsonError("管理員驗證失敗", 401);
    }

    const authRow = await prisma.adminAuth.findFirst({
      where: {
        adminId: payload.admin_id,
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!authRow) {
      return jsonError("Token 無效或已過期", 401);
    }

    const dbAdmin = await prisma.admin.findUnique({
      where: { id: payload.admin_id },
    });

    if (!dbAdmin) {
      return jsonError("管理員不存在", 401);
    }

    return { admin: mapPrismaAdmin(dbAdmin), token };
  } catch {
    return jsonError("管理員驗證失敗", 401);
  }
}

export async function resolveUserFromRequest(
  request: NextRequest | Request,
): Promise<User | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as MemberJwtPayload;

    const authRow = await prisma.auth.findFirst({
      where: {
        userId: payload.user_id,
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!authRow) return null;

    const user = await getMemberWithAddresses(payload.user_id);
    if (!user || user.status === "suspended") return null;

    return user;
  } catch {
    return null;
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function splitLegacyName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: name.trim(), lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function canManageProducts(role: AdminRole) {
  return role === "superadmin" || role === "manager";
}
