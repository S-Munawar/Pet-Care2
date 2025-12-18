import { Response } from "express";
import { AuthenticatedRequest } from "@/middleware/auth.middleware";
import User from "@/models/User";
import RoleRequest from "@/models/RoleRequest";
import { ROLE_STATUSES } from "@repo/shared";

/**
 * Get current user's profile from database.
 * - Returns role and status from MongoDB (source of truth)
 */
const getUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      // User authenticated with Firebase but not registered in our system
      res.status(404).json({
        message: "User not registered",
        registered: false,
      });
      return;
    }

    // Check for any pending role requests
    const pendingRequest = await RoleRequest.findOne({
      userId: user._id,
      status: ROLE_STATUSES.PENDING,
    });

    res.json({
      uid: firebaseUid,
      email: user.email,
      role: user.role,
      roleStatus: user.roleStatus,
      requestedRole: user.requestedRole,
      hasPendingRequest: !!pendingRequest,
      registered: true,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
  }
};

/**
 * Get user's role request history.
 */
const getRoleRequestHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const dbUser = req.dbUser;

    if (!dbUser) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const requests = await RoleRequest.find({ userId: dbUser._id })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({ requests });
  } catch (error) {
    console.error("Get role history error:", error);
    res.status(500).json({ message: "Failed to get role history" });
  }
};

export { getUser, getRoleRequestHistory };
