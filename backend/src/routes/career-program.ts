import { Router } from "express";
import {
  registerCareerSelection,
  getCareerSelectionStatus,
  getCareerSelectionRegistrations,
  updateCareerSelectionStatus,
  evaluateIntelligenceAI,
  requestCounselorGuidance,
  adminAssignCounselorAndFee,
  payAndConfirmGuidanceBooking,
  getCounselingTrainingPrograms,
  getAdminCounselingTrainingPrograms,
  createCounselingTrainingProgram,
  updateCounselingTrainingProgram,
  deleteCounselingTrainingProgram,
  enrollCounselingTraining,
  getMyCounselingTrainingEnrollments,
  getCounselingTrainingEnrollments,
  updateCounselingTrainingEnrollmentStatus,
} from "../controllers/career-program.controller";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth";

const router = Router();

// --- Career Selection Routes ---
router.post("/career-selection/register", optionalAuth, registerCareerSelection);
router.post("/career-selection/evaluate-ai", optionalAuth, evaluateIntelligenceAI);
router.get("/career-selection/status", optionalAuth, getCareerSelectionStatus);
router.post("/career-selection/request-guidance", requireAuth, requestCounselorGuidance);
router.post("/career-selection/admin-assign", requireAuth, requireRole(["super_admin", "admin"]), adminAssignCounselorAndFee);
router.post("/career-selection/pay-guidance", requireAuth, payAndConfirmGuidanceBooking);
router.get("/career-selection/admin-registrations", requireAuth, requireRole(["super_admin", "admin"]), getCareerSelectionRegistrations);
router.patch("/career-selection/admin-registrations/:id", requireAuth, requireRole(["super_admin", "admin"]), updateCareerSelectionStatus);

// --- Counseling Training Routes ---
router.get("/counseling-training/programs", getCounselingTrainingPrograms);
router.get("/counseling-training/admin-programs", requireAuth, requireRole(["super_admin", "admin"]), getAdminCounselingTrainingPrograms);
router.post("/counseling-training/programs", requireAuth, requireRole(["super_admin", "admin"]), createCounselingTrainingProgram);
router.put("/counseling-training/programs/:id", requireAuth, requireRole(["super_admin", "admin"]), updateCounselingTrainingProgram);
router.delete("/counseling-training/programs/:id", requireAuth, requireRole(["super_admin", "admin"]), deleteCounselingTrainingProgram);
router.post("/counseling-training/enroll", optionalAuth, enrollCounselingTraining);
router.get("/counseling-training/my-enrollments", optionalAuth, getMyCounselingTrainingEnrollments);
router.get("/counseling-training/admin-enrollments", requireAuth, requireRole(["super_admin", "admin"]), getCounselingTrainingEnrollments);
router.patch("/counseling-training/admin-enrollments/:id", requireAuth, requireRole(["super_admin", "admin"]), updateCounselingTrainingEnrollmentStatus);

export default router;

