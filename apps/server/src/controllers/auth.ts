import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import User from "@/models/User";
import RoleRequest from "@/models/RoleRequest";
import admin from "@/config/firebaseadmin";
import { ROLES, ROLE_STATUSES } from "@repo/shared";

/**
 * Register a new user in the system.
 * - All users start as pet-owner with approved status
 * - If requesting vet/admin role, a role request is created for admin approval
 * - Never trust client-provided roles for direct assignment
 */
const register = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { uid, email } = req.user || {};
    const { requestedRole } = req.body;

    if (!uid || !email) {
      res.status(400).json({ message: "Invalid user data" });
      return;
    }

    const existingUser = await User.findOne({ firebaseUid: uid });

    if (existingUser) {
      res.status(400).json({ message: "User already registered" });
      return;
    }

    // All users start as pet-owner with approved status (lowest privilege)
    const user = await User.create({
      firebaseUid: uid,
      email: email,
      role: ROLES.PET_OWNER,
      roleStatus: ROLE_STATUSES.APPROVED,
      requestedRole:
        requestedRole === ROLES.VET || requestedRole === ROLES.ADMIN
          ? requestedRole
          : undefined,
    });

    // Set Firebase custom claims to match database
    await admin.auth().setCustomUserClaims(uid, {
      role: ROLES.PET_OWNER,
      roleStatus: ROLE_STATUSES.APPROVED,
    });

    // If user requested a higher role, create a role request for admin approval
    if (requestedRole === ROLES.VET || requestedRole === ROLES.ADMIN) {
      await RoleRequest.create({
        userId: user._id,
        requestedRole: requestedRole,
        status: ROLE_STATUSES.PENDING,
      });

      res.status(201).json({
        message: "User registered. Role upgrade request submitted for approval.",
        role: ROLES.PET_OWNER,
        roleStatus: ROLE_STATUSES.APPROVED,
        requestedRole: requestedRole,
      });
      return;
    }

    res.status(201).json({
      message: "User registered successfully",
      role: ROLES.PET_OWNER,
      roleStatus: ROLE_STATUSES.APPROVED,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

/**
 * Request a role upgrade (vet or admin).
 * - Only authenticated, registered users can request
 * - Creates auditable role request record
 * - Does NOT assign the role directly
 */
const requestRoleUpgrade = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { requestedRole, licenseNumber, licenseCountry } = req.body;
    const dbUser = req.dbUser;

    if (!dbUser) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Validate requested role
    if (requestedRole !== ROLES.VET && requestedRole !== ROLES.ADMIN) {
      res.status(400).json({ message: "Invalid role requested" });
      return;
    }

    // Check if user already has this role
    if (dbUser.role === requestedRole && dbUser.roleStatus === ROLE_STATUSES.APPROVED) {
      res.status(400).json({ message: "You already have this role" });
      return;
    }

    // Check for pending request
    const pendingRequest = await RoleRequest.findOne({
      userId: dbUser._id,
      status: ROLE_STATUSES.PENDING,
    });

    if (pendingRequest) {
      res.status(400).json({ message: "You already have a pending role request" });
      return;
    }

    // For vet role, license info is required
    if (requestedRole === ROLES.VET && (!licenseNumber || !licenseCountry)) {
      res.status(400).json({
        message: "License number and country are required for vet role",
      });
      return;
    }

    // Create the role request
    await RoleRequest.create({
      userId: dbUser._id,
      requestedRole: requestedRole,
      status: ROLE_STATUSES.PENDING,
      reason: requestedRole === ROLES.VET 
        ? `License: ${licenseNumber}, Country: ${licenseCountry}`
        : undefined,
    });

    // Update user's requestedRole field
    await User.findByIdAndUpdate(dbUser._id, {
      requestedRole: requestedRole,
    });

    res.status(201).json({
      message: "Role upgrade request submitted for admin approval",
      requestedRole: requestedRole,
    });
  } catch (error) {
    console.error("Role request error:", error);
    res.status(500).json({ message: "Failed to submit role request" });
  }
};

export { register, requestRoleUpgrade };