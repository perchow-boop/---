import type { ShippingCountryCode } from "@/lib/shipping";

const DIAL_CODES: Record<ShippingCountryCode, string> = {
  HK: "852",
  TW: "886",
  MO: "853",
};

export function getDialCode(country: string | null | undefined) {
  if (country === "TW") return DIAL_CODES.TW;
  if (country === "MO") return DIAL_CODES.MO;
  return DIAL_CODES.HK;
}

export function toE164Phone(
  phone: string | null | undefined,
  country: string | null | undefined,
) {
  if (!phone?.trim()) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const dialCode = getDialCode(country);

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

export function formatPhoneForInput(
  phone: string | null | undefined,
  country: string | null | undefined,
) {
  if (!phone?.trim()) return "";

  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  const dialCode = getDialCode(country);

  if (digits.startsWith(dialCode)) {
    return digits.slice(dialCode.length);
  }

  if (digits.startsWith("852") && country === "HK") {
    return digits.slice(3);
  }

  if (digits.startsWith("886") && country === "TW") {
    return digits.slice(3);
  }

  if (digits.startsWith("853") && country === "MO") {
    return digits.slice(3);
  }

  return digits;
}
