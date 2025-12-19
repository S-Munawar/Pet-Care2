import { Router } from "express";
import {
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
} from "@/middleware/auth.middleware";
import { chatWithAgent, getPetContext } from "@/controllers/aiChat";

const router: Router = Router();

// ============================================
// AI CHAT ROUTES
// ============================================

/**
 * Chat with AI agent for pet education
 * POST /api/ai/chat
 * Body: { message: string, petId?: string, conversationHistory?: Array }
 */
router.post(
  "/ai/chat",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  chatWithAgent
);

/**
 * Get pet context for AI chat
 * GET /api/ai/pet-context/:petId
 */
router.get(
  "/ai/pet-context/:petId",
  requireAuth,
  attachDbUser,
  requireApprovedStatus,
  getPetContext
);

export default router;
