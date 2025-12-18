import { Role, ROLES } from "@repo/shared";

/**
 * Check if a role requires admin approval.
 */
export const requiresApproval = (role: Role): boolean => {
  return role === ROLES.VET || role === ROLES.ADMIN;
};

/**
 * Check if a role is valid.
 */
export const isValidRole = (role: string): role is Role => {
  return Object.values(ROLES).includes(role as Role);
};

/**
 * Get role display name.
 */
export const getRoleDisplayName = (role: Role): string => {
  const displayNames: Record<Role, string> = {
    [ROLES.PET_OWNER]: "Pet Owner",
    [ROLES.VET]: "Veterinarian",
    [ROLES.ADMIN]: "Administrator",
  };
  return displayNames[role] || role;
};

/**
 * Check if role A has higher privilege than role B.
 */
export const hasHigherPrivilege = (roleA: Role, roleB: Role): boolean => {
  const privileges: Record<Role, number> = {
    [ROLES.PET_OWNER]: 1,
    [ROLES.VET]: 2,
    [ROLES.ADMIN]: 3,
  };
  return privileges[roleA] > privileges[roleB];
};