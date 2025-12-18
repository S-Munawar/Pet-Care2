import { Router } from "express";
import {
  requireAuth,
  attachDbUser,
  requireRole,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import {
  addPet,
  getMyPets,
  getPetById,
  updatePet,
  removePet,
  restorePet,
  searchPets,
  getPetsByOwner,
} from "@/controllers/pet";
import { ROLES } from "@repo/shared";

const router: Router = Router();

// ============================================
// PET OWNER ROUTES (pet owners only)
// ============================================

/**
 * Add a new pet (pet owners only - vets cannot add pets)
 * POST /api/pets
 */
router.post(
  "/pets",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.PET_OWNER),
  addPet
);

/**
 * Get all my pets
 * GET /api/pets
 */
router.get(
  "/pets",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getMyPets
);

/**
 * Search pets (role-based visibility)
 * GET /api/pets/search
 */
router.get(
  "/pets/search",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  searchPets
);

/**
 * Get a specific pet by ID
 * GET /api/pets/:petId
 */
router.get(
  "/pets/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getPetById
);

/**
 * Update a pet (owner only)
 * PUT /api/pets/:petId
 */
router.put(
  "/pets/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  updatePet
);

/**
 * Remove (archive) a pet (owner only)
 * DELETE /api/pets/:petId
 */
router.delete(
  "/pets/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  removePet
);

/**
 * Restore an archived pet (owner only)
 * POST /api/pets/:petId/restore
 */
router.post(
  "/pets/:petId/restore",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  restorePet
);

// ============================================
// VET/ADMIN ROUTES (require vet or admin role)
// ============================================

/**
 * Get pets by owner ID (vets and admins only)
 * GET /api/pets/owner/:ownerId
 */
router.get(
  "/pets/owner/:ownerId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  requireRole(ROLES.VET, ROLES.ADMIN),
  getPetsByOwner
);

export default router;
