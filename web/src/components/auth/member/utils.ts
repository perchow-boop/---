import type { User } from "@/lib/auth-api";

export function getMemberDisplayName(user: User) {
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  return fullName || user.name || user.email;
}
