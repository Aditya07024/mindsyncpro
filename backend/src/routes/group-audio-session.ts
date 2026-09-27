import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { GroupAudioSessionController } from "@/controllers/group-audio-session.controller";

const router = Router();

// List all group audio sessions (Public / Auth)
router.get("/", requireAuth, GroupAudioSessionController.getAllSessions);

// Create a new group audio session (Counselor or Admin)
router.post("/", requireAuth, GroupAudioSessionController.createSession);

// Counselor claim open slot (Green -> Red)
router.post("/:id/claim", requireAuth, GroupAudioSessionController.claimCounselorSlot);

// User request join (adds to waiting room with User 1 / User 2 label)
router.post("/:id/join-request", requireAuth, GroupAudioSessionController.requestJoin);

// Counselor approve / admit user from waiting queue
router.post("/:id/approve-user", requireAuth, GroupAudioSessionController.approveUser);

// Get WebRTC audio-only token
router.get("/:id/audio-token", requireAuth, GroupAudioSessionController.getAudioToken);

// Update session price (Admin)
router.put("/:id/pricing", requireAuth, requireRole(["super_admin", "admin"]), GroupAudioSessionController.updatePricing);

export default router;
