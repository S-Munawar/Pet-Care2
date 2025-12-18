export type Role = "admin" | "pet-owner" | "vet";
export type RoleStatus = "approved" | "pending" | "rejected";

// Define role constants, to be used throughout the application. This helps avoid typos.
export const ROLES = {
  ADMIN: "admin" as Role,
  PET_OWNER: "pet-owner" as Role,
  VET: "vet" as Role,
};

export const ROLE_STATUSES = {
  APPROVED: "approved" as RoleStatus,
  PENDING: "pending" as RoleStatus,
  REJECTED: "rejected" as RoleStatus,
};
