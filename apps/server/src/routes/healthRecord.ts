import { Router } from "express";
import {
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import {
  getPetHealthRecords,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getHealthRecordsByType,
} from "@/controllers/healthRecord";

const router: Router = Router();

// ============================================
// HEALTH RECORD ROUTES
// ============================================

/**
 * Get all health records for a specific pet
 * GET /api/health-records/pet/:petId
 */
router.get(
  "/health-records/pet/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getPetHealthRecords
);

/**
 * Get health records by type for a specific pet
 * GET /api/health-records/pet/:petId/type/:recordType
 */
router.get(
  "/health-records/pet/:petId/type/:recordType",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getHealthRecordsByType
);

/**
 * Create a new health record
 * POST /api/health-records
 */
router.post(
  "/health-records",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  createHealthRecord
);

/**
 * Update a health record
 * PUT /api/health-records/:recordId
 */
router.put(
  "/health-records/:recordId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  updateHealthRecord
);

/**
 * Delete a health record
 * DELETE /api/health-records/:recordId
 */
router.delete(
  "/health-records/:recordId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  deleteHealthRecord
);

export default router;