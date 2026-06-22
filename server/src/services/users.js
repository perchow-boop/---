import pool from "../config/db.js";
import { normalizePhone } from "../utils/phone.js";
import { generateUniqueMemberId } from "../utils/member-id.js";

const ALLOWED_COUNTRIES = new Set(["HK", "TW", "MO"]);

export function normalizeCountry(country) {
  if (!country?.trim()) return null;
  const code = country.trim().toUpperCase();
  return ALLOWED_COUNTRIES.has(code) ? code : null;
}

export function getDisplayName(user) {
  const first = user.first_name?.trim() || "";
  const last = user.last_name?.trim() || "";
  return `${first} ${last}`.trim() || user.email;
}

export function formatAddress(row) {
  if (!row) return null;

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

export function formatUser(row, addresses = []) {
  const formattedAddresses = addresses.map(formatAddress);
  const defaultAddress =
    formattedAddresses.find((item) => item.is_default) ||
    formattedAddresses[0] ||
    null;

  return {
    user_id: row.user_id,
    member_id: row.member_id?.trim() || null,
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    name: getDisplayName(row),
    email: row.email,
    phone: row.phone,
    status: row.status || "active",
    addresses: formattedAddresses,
    default_address: defaultAddress,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getAddressesForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT address_id, user_id, recipient_name, phone, country, city,
            street_address, postal_code, is_default, created_at
     FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, address_id ASC`,
    [userId],
  );

  return rows.map(formatAddress);
}

export async function ensureMemberId(userId) {
  const [rows] = await pool.execute(
    "SELECT member_id FROM Users WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (!rows.length) {
    return null;
  }

  const existing = rows[0].member_id?.trim();
  if (existing) {
    return existing;
  }

  const memberId = await generateUniqueMemberId();
  const [result] = await pool.execute(
    `UPDATE Users
     SET member_id = ?
     WHERE user_id = ? AND (member_id IS NULL OR TRIM(member_id) = '')`,
    [memberId, userId],
  );

  if (result.affectedRows > 0) {
    return memberId;
  }

  const [refetch] = await pool.execute(
    "SELECT member_id FROM Users WHERE user_id = ? LIMIT 1",
    [userId],
  );

  return refetch[0]?.member_id?.trim() || null;
}

export async function backfillMissingMemberIds() {
  const [users] = await pool.execute(
    `SELECT user_id
     FROM Users
     WHERE member_id IS NULL OR TRIM(member_id) = ''`,
  );

  for (const user of users) {
    await ensureMemberId(user.user_id);
  }

  return users.length;
}

export async function createUser({
  first_name,
  last_name,
  email,
  password_hash,
  phone,
}) {
  const memberId = await generateUniqueMemberId();
  const displayName = `${first_name} ${last_name || ""}`.trim();

  const [result] = await pool.execute(
    `INSERT INTO Users (member_id, first_name, last_name, name, email, password_hash, phone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      memberId,
      first_name,
      last_name || null,
      displayName,
      email.trim().toLowerCase(),
      password_hash,
      phone,
    ],
  );

  const user = await getUserById(result.insertId);

  if (!user?.member_id) {
    const assigned = await ensureMemberId(result.insertId);
    if (assigned && user) {
      user.member_id = assigned;
    }
  }

  return user;
}

export async function getUserById(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id, member_id, first_name, last_name, email, phone, status, created_at, updated_at
     FROM Users
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );

  if (!rows.length) return null;

  const memberId = await ensureMemberId(userId);
  if (memberId) {
    rows[0].member_id = memberId;
  }

  const addresses = await getAddressesForUser(userId);
  return formatUser(rows[0], addresses);
}

export async function getUserByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT user_id, member_id, first_name, last_name, email, phone, password_hash, status,
            created_at, updated_at
     FROM Users
     WHERE email = ?
     LIMIT 1`,
    [email.trim().toLowerCase()],
  );

  if (!rows.length) return null;

  const memberId = await ensureMemberId(rows[0].user_id);
  if (memberId) {
    rows[0].member_id = memberId;
  }

  const addresses = await getAddressesForUser(rows[0].user_id);
  return {
    ...formatUser(rows[0], addresses),
    password_hash: rows[0].password_hash,
  };
}

export async function upsertDefaultAddress(userId, address) {
  const recipientName = address.recipient_name?.trim() || null;
  const phone = normalizePhone(address.phone, normalizeCountry(address.country) || "HK");
  const country = normalizeCountry(address.country);
  const city = address.city?.trim() || null;
  const streetAddress = address.street_address?.trim() || null;
  const postalCode = address.postal_code?.trim() || null;

  const [existing] = await pool.execute(
    `SELECT address_id
     FROM user_addresses
     WHERE user_id = ? AND is_default = TRUE
     LIMIT 1`,
    [userId],
  );

  if (existing.length) {
    await pool.execute(
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

  const [result] = await pool.execute(
    `INSERT INTO user_addresses (
       user_id, recipient_name, phone, country, city, street_address, postal_code, is_default
     ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [userId, recipientName, phone, country, city, streetAddress, postalCode],
  );

  return result.insertId;
}

export async function getAddressById(addressId, userId) {
  const [rows] = await pool.execute(
    `SELECT address_id, user_id, recipient_name, phone, country, city,
            street_address, postal_code, is_default, created_at
     FROM user_addresses
     WHERE address_id = ? AND user_id = ?
     LIMIT 1`,
    [addressId, userId],
  );

  return rows[0] ? formatAddress(rows[0]) : null;
}

export async function createAddress(userId, address) {
  const recipientName = address.recipient_name?.trim() || null;
  const phone = normalizePhone(address.phone, normalizeCountry(address.country) || "HK");
  const country = normalizeCountry(address.country);
  const city = address.city?.trim() || null;
  const streetAddress = address.street_address?.trim() || null;
  const postalCode = address.postal_code?.trim() || null;
  const makeDefault = Boolean(address.is_default);

  if (makeDefault) {
    await pool.execute(
      "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?",
      [userId],
    );
  }

  const [existing] = await pool.execute(
    "SELECT address_id FROM user_addresses WHERE user_id = ? LIMIT 1",
    [userId],
  );

  const isDefault = makeDefault || !existing.length;

  const [result] = await pool.execute(
    `INSERT INTO user_addresses (
       user_id, recipient_name, phone, country, city, street_address, postal_code, is_default
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, recipientName, phone, country, city, streetAddress, postalCode, isDefault],
  );

  return getAddressById(result.insertId, userId);
}

export async function updateAddress(addressId, userId, address) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return null;

  const recipientName = address.recipient_name?.trim() || null;
  const phone = normalizePhone(address.phone, normalizeCountry(address.country) || "HK");
  const country = normalizeCountry(address.country);
  const city = address.city?.trim() || null;
  const streetAddress = address.street_address?.trim() || null;
  const postalCode = address.postal_code?.trim() || null;

  await pool.execute(
    `UPDATE user_addresses
     SET recipient_name = ?, phone = ?, country = ?, city = ?,
         street_address = ?, postal_code = ?
     WHERE address_id = ? AND user_id = ?`,
    [
      recipientName,
      phone,
      country,
      city,
      streetAddress,
      postalCode,
      addressId,
      userId,
    ],
  );

  if (address.is_default) {
    await setDefaultAddress(addressId, userId);
  }

  return getAddressById(addressId, userId);
}

export async function deleteAddress(addressId, userId) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return false;

  await pool.execute(
    "DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?",
    [addressId, userId],
  );

  if (existing.is_default) {
    const [remaining] = await pool.execute(
      `SELECT address_id FROM user_addresses
       WHERE user_id = ?
       ORDER BY address_id ASC
       LIMIT 1`,
      [userId],
    );

    if (remaining.length) {
      await pool.execute(
        "UPDATE user_addresses SET is_default = TRUE WHERE address_id = ?",
        [remaining[0].address_id],
      );
    }
  }

  return true;
}

export async function setDefaultAddress(addressId, userId) {
  const existing = await getAddressById(addressId, userId);
  if (!existing) return null;

  await pool.execute(
    "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?",
    [userId],
  );

  await pool.execute(
    "UPDATE user_addresses SET is_default = TRUE WHERE address_id = ? AND user_id = ?",
    [addressId, userId],
  );

  return getAddressById(addressId, userId);
}

export function formatAddressText(address) {
  if (!address) return null;

  const parts = [
    address.recipient_name,
    address.phone,
    address.street_address,
    address.city,
    address.country,
    address.postal_code,
  ].filter(Boolean);

  return parts.join(" · ");
}
