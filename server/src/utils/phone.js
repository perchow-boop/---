const DIAL_CODES = {
  HK: "852",
  TW: "886",
  MO: "853",
};

export function getDialCode(country) {
  if (country === "TW") return DIAL_CODES.TW;
  if (country === "MO") return DIAL_CODES.MO;
  return DIAL_CODES.HK;
}

export function normalizePhone(phone, country) {
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
