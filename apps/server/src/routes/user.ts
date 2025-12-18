import {
  requireAuth,
  attachDbUser,
  requireRole,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import { getUser, getRoleRequestHistory } from "@/controllers/user";
import { register, requestRoleUpgrade } from "@/controllers/auth";
import {
  approveRoleRequest,
  rejectRoleRequest,
  getPendingRoleRequests,
  getAllUsers,
} from "@/controllers/admin";
import { Router } from "express";
import { ROLES } from "@repo/shared";

const router: Router = Router();

// ============================================
// PUBLIC ROUTES (require only Firebase auth)
// ============================================

// Get current user - works for both registered and unregistered users
router.get("/user", requireAuth, getUser);

// Register new user in our system
router.post("/auth/register", requireAuth, register);

// ============================================
// AUTHENTICATED USER ROUTES (require registration)
// ============================================

// Request a role upgrade (vet or admin)
router.post(
  "/auth/request-role",
  requireAuth,
  attachDbUser,
  requestRoleUpgrade
);

// Get user's role request history
router.get(
  "/user/role-history",
  requireAuth,
  attachDbUser,
  getRoleRequestHistory
);

// ============================================
// ADMIN ROUTES (require admin role + approved status)
// ============================================

// Get all pending role requests
router.get(
  "/admin/pending-requests",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  getPendingRoleRequests
);

// Approve a role request
router.post(
  "/admin/approve-role",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  approveRoleRequest
);

// Reject a role request
router.post(
  "/admin/reject-role",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  rejectRoleRequest
);

// Get all users
router.get(
  "/admin/users",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  getAllUsers
);

// ============================================
// VET ROUTES (require vet role + approved status)
// ============================================

// Placeholder for vet-specific routes
// router.get(
//   "/vet/appointments",
//   requireAuth,
//   attachDbUser,
//   requireApprovedStatus,
//   requireRole(ROLES.VET, ROLES.ADMIN),
//   getVetAppointments
// );

export default router;