import { Router } from "express";
import {
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import { mlAnalysisRateLimit } from "@/middleware/rateLimiter";
import {
  performHealthAnalysis,
  getMLServiceStatus,
} from "@/controllers/mlAnalysis";

const router: Router = Router();

// ============================================
// ML ANALYSIS ROUTES
// ============================================

/**
 * Perform health analysis for a specific pet
 * POST /api/ml-analysis/pet/:petId
 */
router.post(
  "/ml-analysis/pet/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  mlAnalysisRateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  performHealthAnalysis
);

/**
 * Get ML service status and model information
 * GET /api/ml-analysis/status
 */
router.get(
  "/ml-analysis/status",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getMLServiceStatus
);

export default router;