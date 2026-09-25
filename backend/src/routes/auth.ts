import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth";
import { posterUpload } from "@/middleware/upload.middleware";

const router = Router();

// OTP routes removed — auth is now handled by Clerk (Google, Apple, email)
// Clerk auto-provisions MongoDB users on first sign-in via requireAuth middleware

router.get("/me", requireAuth, AuthController.me);
router.patch("/onboarding", requireAuth, AuthController.updateOnboarding);
router.post("/upload-student-id", requireAuth, posterUpload.single("idCard"), AuthController.uploadStudentIdCard);
router.post("/therapist/onboarding", requireAuth, AuthController.therapistOnboarding);
router.patch("/profile", requireAuth, AuthController.updateProfile);
router.delete("/profile", requireAuth, AuthController.deleteProfile);
router.patch("/role", requireAuth, AuthController.setRole);
router.post("/push-token", requireAuth, AuthController.registerPushToken);

export default router;
