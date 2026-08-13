import { Router } from "express";
import { requireAuth, requirePermission, optionalAuth } from "@/middleware/auth";
import { PopupAnnouncementController } from "@/controllers/popup-announcement.controller";
import { posterUpload } from "@/middleware/upload.middleware";

const router = Router();

// Public route to fetch active announcement for landing page
router.get("/active", optionalAuth, PopupAnnouncementController.getActive);

// Admin routes requiring authentication & permissions
router.get("/", requireAuth, requirePermission("canHostMeeting"), PopupAnnouncementController.getConfig);
router.post("/", requireAuth, requirePermission("canHostMeeting"), PopupAnnouncementController.updateConfig);
router.post(
  "/upload-poster",
  requireAuth,
  requirePermission("canHostMeeting"),
  posterUpload.single("poster"),
  PopupAnnouncementController.uploadPoster
);

export default router;
