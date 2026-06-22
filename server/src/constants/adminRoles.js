export const ADMIN_ROLES = ["superadmin", "manager", "staff"];

export const ROLE_RANK = {
  superadmin: 3,
  manager: 2,
  staff: 1,
};

export function isValidAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function canRegisterRole(actorRole, targetRole) {
  if (actorRole === "superadmin") {
    return isValidAdminRole(targetRole);
  }

  if (actorRole === "manager") {
    return targetRole === "staff";
  }

  return false;
}

export function canManageProducts(role) {
  return role === "superadmin" || role === "manager";
}
