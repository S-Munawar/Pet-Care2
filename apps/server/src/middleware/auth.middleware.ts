import { Request, Response, NextFunction } from "express";
import admin from "@/config/firebaseadmin";
import User from "@/models/User";
import mongoose from "mongoose";
import { Role, RoleStatus, ROLE_STATUSES } from "@repo/shared";

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
  dbUser?: {
    _id: mongoose.Types.ObjectId;
    role: Role;
    roleStatus: RoleStatus;
    requestedRole?: Role;
  };
}

/**
 * Middleware: Verify Firebase ID token.
 * - Extracts and verifies the Bearer token
 * - Attaches decoded token to request
 * - Rejects unauthenticated requests
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing Authorization header" });
      return;
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      res.status(401).json({ message: "Missing token" });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware: Attach database user to request.
 * - Loads user from MongoDB by Firebase UID
 * - MongoDB is source of truth for role state
 * - Rejects if user not registered
 */
export const attachDbUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      res.status(403).json({ message: "User not registered" });
      return;
    }

    req.dbUser = {
      _id: user._id as mongoose.Types.ObjectId,
      role: user.role as Role,
      roleStatus: user.roleStatus as RoleStatus,
      requestedRole: user.requestedRole as Role | undefined,
    };

    next();
  } catch (err) {
    res.status(500).json({ message: "Failed to load user" });
  }
};

/**
 * Middleware: Require approved role status.
 * - Blocks pending or rejected users from accessing protected routes
 * - Must be used after attachDbUser
 */
export const requireApprovedStatus = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.dbUser;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (user.roleStatus === ROLE_STATUSES.PENDING) {
    res.status(403).json({
      message: "Your account is pending approval",
      roleStatus: ROLE_STATUSES.PENDING,
    });
    return;
  }

  if (user.roleStatus === ROLE_STATUSES.REJECTED) {
    res.status(403).json({
      message: "Your role request was rejected",
      roleStatus: ROLE_STATUSES.REJECTED,
    });
    return;
  }

  next();
};

/**
 * Middleware: Enforce role-based access control.
 * - Checks if user has one of the allowed roles
 * - Must be used after attachDbUser
 * - Controllers remain free of authorization logic
 */
export const requireRole =
  (...allowedRoles: Role[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.dbUser;

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: "Forbidden: Insufficient permissions",
        requiredRoles: allowedRoles,
        currentRole: user.role,
      });
      return;
    }

    next();
  };
