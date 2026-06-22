import type { UserAddress as PrismaUserAddress } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UserAddress } from "@/lib/auth-api";
import { normalizePhone } from "@/lib/server/phone";
import { getMemberWithAddresses } from "@/lib/server/members";

const ALLOWED_COUNTRIES = new Set(["HK", "TW", "MO"]);

export function normalizeCountry(country: string | undefined) {
  if (!country?.trim()) return null;
  const code = country.trim().toUpperCase();
  return ALLOWED_COUNTRIES.has(code) ? code : null;
}

export function mapPrismaAddress(row: PrismaUserAddress): UserAddress {
  return {
    address_id: row.id,
    user_id: row.userId,
    recipient_name: row.recipientName,
    phone: row.phone,
    country: row.country,
    city: row.city,
    street_address: row.streetAddress,
    postal_code: row.postalCode,
    is_default: row.isDefault,
    created_at: row.createdAt.toISOString(),
  };
}

function normalizeAddressInput(address: {
  recipient_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  street_address?: string;
  postal_code?: string;
}) {
  const country = normalizeCountry(address.country);
  return {
    recipientName: address.recipient_name?.trim() || null,
    phone: normalizePhone(address.phone, country || "HK"),
    country,
    city: address.city?.trim() || null,
    streetAddress: address.street_address?.trim() || null,
    postalCode: address.postal_code?.trim() || null,
  };
}

export async function getAddressById(addressId: number, userId: number) {
  const row = await prisma.userAddress.findFirst({
    where: { id: addressId, userId },
  });
  return row ? mapPrismaAddress(row) : null;
}

export async function upsertDefaultAddress(
  userId: number,
  address: {
    recipient_name?: string;
    phone?: string | null;
    country?: string | null;
    city?: string;
    street_address?: string;
    postal_code?: string;
  },
) {
  const data = normalizeAddressInput({
    recipient_name: address.recipient_name,
    phone: address.phone || undefined,
    country: address.country || undefined,
    city: address.city,
    street_address: address.street_address,
    postal_code: address.postal_code,
  });

  const existing = await prisma.userAddress.findFirst({
    where: { userId, isDefault: true },
  });

  if (existing) {
    await prisma.userAddress.update({
      where: { id: existing.id },
      data,
    });
    return existing.id;
  }

  const created = await prisma.userAddress.create({
    data: { userId, ...data, isDefault: true },
  });

  return created.id;
}

export async function createAddress(
  userId: number,
  address: {
    recipient_name: string;
    phone?: string;
    country?: string;
    city: string;
    street_address: string;
    postal_code?: string;
    is_default?: boolean;
  },
) {
  const data = normalizeAddressInput(address);
  const makeDefault = Boolean(address.is_default);

  const existingCount = await prisma.userAddress.count({ where: { userId } });
  const isDefault = makeDefault || existingCount === 0;

  if (makeDefault) {
    await prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const created = await prisma.userAddress.create({
    data: { userId, ...data, isDefault },
  });

  const user = await getMemberWithAddresses(userId);
  return {
    address: mapPrismaAddress(created),
    user: user!,
  };
}

export async function updateAddress(
  addressId: number,
  userId: number,
  address: {
    recipient_name: string;
    phone?: string;
    country?: string;
    city: string;
    street_address: string;
    postal_code?: string;
    is_default?: boolean;
  },
) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return null;

  const data = normalizeAddressInput(address);

  await prisma.userAddress.update({
    where: { id: addressId },
    data,
  });

  if (address.is_default) {
    await setDefaultAddress(addressId, userId);
  }

  const updated = await getAddressById(addressId, userId);
  const user = await getMemberWithAddresses(userId);

  return {
    address: updated!,
    user: user!,
  };
}

export async function deleteAddress(addressId: number, userId: number) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return null;

  await prisma.userAddress.delete({ where: { id: addressId } });

  if (existing.is_default) {
    const remaining = await prisma.userAddress.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
    });

    if (remaining) {
      await prisma.userAddress.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
  }

  return getMemberWithAddresses(userId);
}

export async function setDefaultAddress(addressId: number, userId: number) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return null;

  await prisma.$transaction([
    prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  const address = await getAddressById(addressId, userId);
  const user = await getMemberWithAddresses(userId);

  return {
    address: address!,
    user: user!,
  };
}
