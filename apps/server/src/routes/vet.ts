import { Router } from "express";
import {
  requireAuth,
  attachDbUser,
  requireRole,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import {
  getMyVetProfile,
  updateVetProfile,
  getVetPublicProfile,
  searchVets,
  getSpecializations,
  getAllVetProfiles,
  verifyVet,
} from "@/controllers/vet";
import { ROLES } from "@repo/shared";

const router: Router = Router();

// ============================================
// PUBLIC ROUTES (require only Firebase auth)
// ============================================

/**
 * Get all available specializations
 * GET /api/vets/specializations
 */
router.get("/vets/specializations", getSpecializations);

/**
 * Search for vets (public - only returns approved vets)
 * GET /api/vets/search
 */
router.get(
  "/vets/search",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  searchVets
);

/**
 * Get a vet's public profile
 * GET /api/vets/:vetId
 */
router.get(
  "/vets/:vetId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getVetPublicProfile
);

// ============================================
// VET ROUTES (require vet role + approved status)
// ============================================

/**
 * Get current vet's profile
 * GET /api/vet/profile
 */
router.get(
  "/vet/profile",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.VET),
  getMyVetProfile
);

/**
 * Update current vet's profile
 * PUT /api/vet/profile
 */
router.put(
  "/vet/profile",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.VET),
  updateVetProfile
);

// ============================================
// ADMIN ROUTES (require admin role + approved status)
// ============================================

/**
 * Get all vet profiles (admin only)
 * GET /api/admin/vets
 */
router.get(
  "/admin/vets",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  getAllVetProfiles
);

/**
 * Verify a vet's credentials (admin only)
 * POST /api/admin/vets/:vetId/verify
 */
router.post(
  "/admin/vets/:vetId/verify",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.ADMIN),
  verifyVet
);

export default router;
