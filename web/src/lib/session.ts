export const MEMBER_TOKEN_KEY = "lukibou-token";
export const MEMBER_USER_KEY = "lukibou-user";
export const ADMIN_TOKEN_KEY = "lukibou-admin-token";
export const ADMIN_KEY = "lukibou-admin";

const MEMBER_SESSION_KEYS = [MEMBER_TOKEN_KEY, MEMBER_USER_KEY] as const;

function isValidStoredToken(value: string | null): value is string {
  return Boolean(value && value.trim() && value !== "undefined" && value !== "null");
}

export function readMemberToken() {
  if (typeof window === "undefined") return null;

  const fromLocal = localStorage.getItem(MEMBER_TOKEN_KEY);
  if (isValidStoredToken(fromLocal)) return fromLocal;

  const fromSession = sessionStorage.getItem(MEMBER_TOKEN_KEY);
  if (isValidStoredToken(fromSession)) return fromSession;

  return null;
}

export function clearMemberSession() {
  if (typeof window === "undefined") return;

  for (const key of MEMBER_SESSION_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
}
