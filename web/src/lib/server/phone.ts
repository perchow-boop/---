import { getDialCode } from "@/lib/phone";

export function normalizePhone(phone: string | undefined, country: string | null) {
  if (!phone?.trim()) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const dialCode = getDialCode(country || "HK");

  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith(dialCode)) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+${dialCode}${digits.slice(1)}`;
  }

  return `+${dialCode}${digits}`;
}
