import admin from "@/config/firebaseadmin";
import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import User from "@/models/User";
import RoleRequest from "@/models/RoleRequest";
import VetProfile from "@/models/vet";
import { ROLES, ROLE_STATUSES } from "@repo/shared";

/**
 * Approve a role request.
 * - Only admins can approve
 * - Updates MongoDB first (source of truth)
 * - Then syncs Firebase custom claims
 * - Creates vet profile if approving vet role
 */
const approveRoleRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { requestId } = req.body;
    const adminUser = req.dbUser;

    if (!adminUser || adminUser.role !== ROLES.ADMIN) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const roleRequest = await RoleRequest.findById(requestId).populate("userId");

    if (!roleRequest) {
      res.status(404).json({ message: "Role request not found" });
      return;
    }

    if (roleRequest.status !== ROLE_STATUSES.PENDING) {
      res.status(400).json({ message: "Request already processed" });
      return;
    }

    const targetUser = await User.findById(roleRequest.userId);

    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update MongoDB first (source of truth)
    targetUser.role = roleRequest.requestedRole;
    targetUser.roleStatus = ROLE_STATUSES.APPROVED;
    targetUser.requestedRole = undefined;
    await targetUser.save();

    // Update role request record for audit
    roleRequest.status = ROLE_STATUSES.APPROVED;
    roleRequest.reviewedBy = adminUser._id;
    roleRequest.reviewedAt = new Date();
    await roleRequest.save();

    // Create vet profile if approving vet role
    if (roleRequest.requestedRole === ROLES.VET) {
      console.log("Creating vet profile for user:", targetUser._id);
      console.log("Role request reason:", roleRequest.reason);
      
      const licenseMatch = roleRequest.reason?.match(/License: (.+), Country: (.+)/);
      if (licenseMatch) {
        console.log("License info found:", { license: licenseMatch[1], country: licenseMatch[2] });
        
        try {
          const vetProfile = await VetProfile.findOneAndUpdate(
            { userId: targetUser._id },
            {
              userId: targetUser._id,
              licenseNumber: licenseMatch[1]?.trim(),
              licenseCountry: licenseMatch[2]?.trim(),
              verified: true,
              verifiedAt: new Date(),
              verificationSource: "admin_approval",
            },
            { upsert: true, new: true }
          );
          console.log("Vet profile created/updated:", vetProfile._id);
        } catch (vetProfileError) {
          console.error("Failed to create vet profile:", vetProfileError);
          // Don't fail the entire approval process if vet profile creation fails
        }
      } else {
        console.log("No license info found in reason field, creating basic vet profile");
        try {
          const vetProfile = await VetProfile.findOneAndUpdate(
            { userId: targetUser._id },
            {
              userId: targetUser._id,
              licenseNumber: "PENDING_VERIFICATION",
              licenseCountry: "UNKNOWN",
              verified: false,
              verificationSource: "admin_approval_pending_license",
            },
            { upsert: true, new: true }
          );
          console.log("Basic vet profile created:", vetProfile._id);
        } catch (vetProfileError) {
          console.error("Failed to create basic vet profile:", vetProfileError);
        }
      }
    }

    // Sync Firebase custom claims with MongoDB
    await admin.auth().setCustomUserClaims(targetUser.firebaseUid, {
      role: targetUser.role,
      roleStatus: ROLE_STATUSES.APPROVED,
    });

    res.json({
      message: `Role ${roleRequest.requestedRole} approved for user`,
      userId: targetUser._id,
      newRole: targetUser.role,
    });
  } catch (error) {
    console.error("Approve role error:", error);
    res.status(500).json({ message: "Failed to approve role" });
  }
};

/**
 * Reject a role request.
 * - Only admins can reject
 * - User remains with current role
 * - Records rejection reason for audit
 */
const rejectRoleRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { requestId, reason } = req.body;
    const adminUser = req.dbUser;

    if (!adminUser || adminUser.role !== ROLES.ADMIN) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const roleRequest = await RoleRequest.findById(requestId);

    if (!roleRequest) {
      res.status(404).json({ message: "Role request not found" });
      return;
    }

    if (roleRequest.status !== ROLE_STATUSES.PENDING) {
      res.status(400).json({ message: "Request already processed" });
      return;
    }

    const targetUser = await User.findById(roleRequest.userId);

    if (!targetUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Update role request for audit
    roleRequest.status = ROLE_STATUSES.REJECTED;
    roleRequest.reviewedBy = adminUser._id;
    roleRequest.reviewedAt = new Date();
    roleRequest.reason = reason || "Request rejected by admin";
    await roleRequest.save();

    // Clear the requested role from user
    targetUser.requestedRole = undefined;
    await targetUser.save();

    res.json({
      message: "Role request rejected",
      userId: targetUser._id,
    });
  } catch (error) {
    console.error("Reject role error:", error);
    res.status(500).json({ message: "Failed to reject role" });
  }
};

/**
 * Get all pending role requests.
 * - Only admins can view
 */
const getPendingRoleRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const adminUser = req.dbUser;

    if (!adminUser || adminUser.role !== ROLES.ADMIN) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const pendingRequests = await RoleRequest.find({
      status: ROLE_STATUSES.PENDING,
    })
      .populate("userId", "email firebaseUid")
      .sort({ createdAt: -1 });

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error("Get pending requests error:", error);
    res.status(500).json({ message: "Failed to get pending requests" });
  }
};

/**
 * Get all users (admin only).
 */
const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const adminUser = req.dbUser;

    if (!adminUser || adminUser.role !== ROLES.ADMIN) {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to get users" });
  }
};

export {
  approveRoleRequest,
  rejectRoleRequest,
  getPendingRoleRequests,
  getAllUsers,
};