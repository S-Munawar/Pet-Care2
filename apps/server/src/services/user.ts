import admin from "@/config/firebaseadmin";
import User, { IUser } from "@/models/User";
import { Role, ROLES, RoleStatus, ROLE_STATUSES } from "@repo/shared";

/**
 * Sync Firebase custom claims with MongoDB role state.
 * MongoDB is the source of truth, Firebase claims are for runtime authorization.
 *
 * Call this after any role change in MongoDB to ensure consistency.
 */
export const syncFirebaseClaims = async (
  firebaseUid: string,
  role: Role,
  roleStatus: RoleStatus
): Promise<void> => {
  try {
    await admin.auth().setCustomUserClaims(firebaseUid, {
      role,
      roleStatus,
    });
    console.log(`Synced Firebase claims for user ${firebaseUid}: ${role}/${roleStatus}`);
  } catch (error) {
    console.error(`Failed to sync Firebase claims for ${firebaseUid}:`, error);
    throw error;
  }
};

/**
 * Verify that Firebase claims match MongoDB state.
 * Use this for consistency checks.
 */
export const verifyClaimsConsistency = async (
  firebaseUid: string
): Promise<{ consistent: boolean; dbRole: Role; claimRole: string | undefined }> => {
  try {
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return { consistent: false, dbRole: ROLES.PET_OWNER, claimRole: undefined };
    }

    const firebaseUser = await admin.auth().getUser(firebaseUid);
    const claimRole = firebaseUser.customClaims?.role as string | undefined;

    const consistent = user.role === claimRole;

    return {
      consistent,
      dbRole: user.role as Role,
      claimRole,
    };
  } catch (error) {
    console.error("Failed to verify claims consistency:", error);
    throw error;
  }
};

/**
 * Force refresh a user's claims from MongoDB.
 * Use when claims may be out of sync.
 */
export const refreshUserClaims = async (firebaseUid: string): Promise<void> => {
  const user = await User.findOne({ firebaseUid });

  if (!user) {
    throw new Error("User not found in database");
  }

  await syncFirebaseClaims(
    firebaseUid,
    user.role as Role,
    user.roleStatus as RoleStatus
  );
};

/**
 * Create the first admin user.
 * This should only be called once during system setup.
 * In production, this should be a protected operation.
 */
export const createInitialAdmin = async (
  firebaseUid: string,
  email: string
): Promise<IUser> => {
  // Check if any admin exists
  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

  if (existingAdmin) {
    throw new Error("An admin already exists");
  }

  const user = await User.create({
    firebaseUid,
    email,
    role: ROLES.ADMIN,
    roleStatus: ROLE_STATUSES.APPROVED,
  });

  await syncFirebaseClaims(firebaseUid, ROLES.ADMIN, ROLE_STATUSES.APPROVED);

  return user;
};