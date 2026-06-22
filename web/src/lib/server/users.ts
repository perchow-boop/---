import { execute, query } from "@/lib/db";
import { generateUniqueMemberId } from "@/lib/server/member-id";
import { normalizePhone } from "@/lib/server/phone";
import type { User, UserAddress } from "@/lib/auth-api";

const ALLOWED_COUNTRIES = new Set(["HK", "TW", "MO"]);

type UserRow = {
  user_id: number;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  password_hash?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type AddressRow = {
  address_id: number;
  user_id: number;
  recipient_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  is_default: number | boolean;
  created_at?: string;
};

export function normalizeCountry(country: string | undefined) {
  if (!country?.trim()) return null;
  const code = country.trim().toUpperCase();
  return ALLOWED_COUNTRIES.has(code) ? code : null;
}

function getDisplayName(row: UserRow) {
  const first = row.first_name?.trim() || "";
  const last = row.last_name?.trim() || "";
  return `${first} ${last}`.trim() || row.email;
}

function formatAddress(row: AddressRow): UserAddress {
  return {
    address_id: row.address_id,
    user_id: row.user_id,
    recipient_name: row.recipient_name,
    phone: row.phone,
    country: row.country,
    city: row.city,
    street_address: row.street_address,
    postal_code: row.postal_code,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
  };
}

function formatUser(row: UserRow, addresses: UserAddress[] = []): User {
  const defaultAddress =
    addresses.find((item) => item.is_default) || addresses[0] || null;

  return {
    user_id: row.user_id,
    member_id: row.member_id?.trim() || null,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    name: getDisplayName(row),
    email: row.email,
    phone: row.phone,
    status: (row.status as User["status"]) || "active",
    addresses,
    default_address: defaultAddress,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getAddressesForUser(userId: number) {
  const rows = await query<AddressRow[]>(
    `SELECT address_id, user_id, recipient_name, phone, country, city,
            street_address, postal_code, is_default, created_at
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, address_id ASC`,
    [userId],
  );
  return rows.map(formatAddress);
}

async function ensureMemberId(userId: number) {
  const rows = await query<{ member_id: string | null }[]>(
    "SELECT member_id FROM Users WHERE user_id = ? LIMIT 1",
    [userId],
  );
  if (!rows.length) return null;

  const existing = rows[0].member_id?.trim();
  if (existing) return existing;

  const memberId = await generateUniqueMemberId();
  await execute(
    `UPDATE Users SET member_id = ?
     WHERE user_id = ? AND (member_id IS NULL OR TRIM(member_id) = '')`,
    [memberId, userId],
  );
  return memberId;
}

export async function createUser(input: {
  first_name: string;
  last_name: string | null;
  email: string;
  password_hash: string;
  phone: string | null;
}) {
  const memberId = await generateUniqueMemberId();
  const displayName = `${input.first_name} ${input.last_name || ""}`.trim();

  const result = await execute(
    `INSERT INTO Users (member_id, first_name, last_name, name, email, password_hash, phone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      memberId,
      input.first_name,
      input.last_name,
      displayName,
      input.email.trim().toLowerCase(),
      input.password_hash,
      input.phone,
    ],
  );

  return getUserById(result.insertId);
}

export async function getUserById(userId: number) {
  const rows = await query<UserRow[]>(
    `SELECT user_id, member_id, first_name, last_name, email, phone, status, created_at, updated_at
     FROM Users WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  if (!rows.length) return null;

  const memberId = await ensureMemberId(userId);
  if (memberId) rows[0].member_id = memberId;

  const addresses = await getAddressesForUser(userId);
  return formatUser(rows[0], addresses);
}

export async function getUserByEmail(email: string) {
  const rows = await query<UserRow[]>(
    `SELECT user_id, member_id, first_name, last_name, email, phone, password_hash, status,
            created_at, updated_at
     FROM Users WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()],
  );
  if (!rows.length) return null;

  const memberId = await ensureMemberId(rows[0].user_id);
  if (memberId) rows[0].member_id = memberId;

  const addresses = await getAddressesForUser(rows[0].user_id);
  return {
    ...formatUser(rows[0], addresses),
    password_hash: rows[0].password_hash!,
  };
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
  const recipientName = address.recipient_name?.trim() || null;
  const phone = normalizePhone(
    address.phone || undefined,
    normalizeCountry(address.country || undefined) || "HK",
  );
  const country = normalizeCountry(address.country || undefined);
  const city = address.city?.trim() || null;
  const streetAddress = address.street_address?.trim() || null;
  const postalCode = address.postal_code?.trim() || null;

  const existing = await query<{ address_id: number }[]>(
    `SELECT address_id FROM user_addresses WHERE user_id = ? AND is_default = TRUE LIMIT 1`,
    [userId],
  );

  if (existing.length) {
    await execute(
      `UPDATE user_addresses
       SET recipient_name = ?, phone = ?, country = ?, city = ?,
           street_address = ?, postal_code = ?
       WHERE address_id = ?`,
      [
        recipientName,
        phone,
        country,
        city,
        streetAddress,
        postalCode,
        existing[0].address_id,
      ],
    );
    return existing[0].address_id;
  }

  const result = await execute(
    `INSERT INTO user_addresses (
       user_id, recipient_name, phone, country, city, street_address, postal_code, is_default
     ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [userId, recipientName, phone, country, city, streetAddress, postalCode],
  );

  return result.insertId;
}

export async function updateUserProfile(
  userId: number,
  input: {
    first_name: string;
    last_name: string | null;
    phone: string | null;
    country?: string | null;
    city?: string;
    street_address?: string;
    postal_code?: string;
    recipient_name?: string;
  },
) {
  const displayName = `${input.first_name} ${input.last_name || ""}`.trim();

  await execute(
    `UPDATE Users SET first_name = ?, last_name = ?, name = ?, phone = ? WHERE user_id = ?`,
    [input.first_name, input.last_name, displayName, input.phone, userId],
  );

  if (input.street_address?.trim() || input.city?.trim() || input.country) {
    await upsertDefaultAddress(userId, {
      recipient_name: input.recipient_name || displayName,
      phone: input.phone,
      country: input.country,
      city: input.city,
      street_address: input.street_address,
      postal_code: input.postal_code,
    });
  }

  return getUserById(userId);
}
