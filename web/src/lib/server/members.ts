import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/auth-api";
import { mapPrismaAddress, upsertDefaultAddress } from "@/lib/server/addresses";
import { ensureMemberId } from "@/lib/server/member-id";
import { mapPrismaUserToMember } from "@/lib/server/mappers";
import { normalizePhone } from "@/lib/server/phone";

export async function getMemberWithAddresses(userId: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      },
    },
  });

  if (!user) return null;

  const memberId = user.memberId?.trim() || (await ensureMemberId(userId));
  if (memberId && memberId !== user.memberId) {
    user.memberId = memberId;
  }

  const addresses = user.addresses.map(mapPrismaAddress);
  const defaultAddress =
    addresses.find((item) => item.is_default) || addresses[0] || null;

  return mapPrismaUserToMember(user, addresses, defaultAddress);
}

export async function getMemberByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return null;
  return getMemberWithAddresses(user.id);
}

export async function getMemberPasswordHash(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return user?.passwordHash ?? null;
}

export async function updateMemberProfile(
  userId: number,
  input: {
    first_name: string;
    last_name?: string | null;
    phone?: string | null;
    country?: string | null;
    city?: string;
    street_address?: string;
    postal_code?: string;
    recipient_name?: string;
  },
) {
  const phone = input.phone
    ? normalizePhone(input.phone, input.country || "HK")
    : null;

  const displayName = `${input.first_name} ${input.last_name || ""}`.trim();

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.first_name,
      lastName: input.last_name || null,
      name: displayName,
      phone,
      country: input.country?.trim() || "",
      city: input.city?.trim() || null,
      address1: input.street_address?.trim() || "",
    },
  });

  if (input.street_address?.trim() || input.city?.trim() || input.country) {
    await upsertDefaultAddress(userId, {
      recipient_name:
        input.recipient_name ||
        `${input.first_name} ${input.last_name || ""}`.trim(),
      phone,
      country: input.country,
      city: input.city,
      street_address: input.street_address,
      postal_code: input.postal_code,
    });
  }

  return getMemberWithAddresses(userId);
}

export async function updateMemberPassword(userId: number, passwordHash: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
