import { Router } from "express";
import {
  registerCareerSelection,
  getCareerSelectionStatus,
  getCareerSelectionRegistrations,
  updateCareerSelectionStatus,
  getCounselingTrainingPrograms,
  createCounselingTrainingProgram,
  enrollCounselingTraining,
  getCounselingTrainingEnrollments,
  updateCounselingTrainingEnrollmentStatus,
} from "../controllers/career-program.controller";
import { requireAuth, optionalAuth, requireRole } from "../middleware/auth";

const router = Router();

// --- Career Selection Routes ---
router.post("/career-selection/register", optionalAuth, registerCareerSelection);
router.get("/career-selection/status", optionalAuth, getCareerSelectionStatus);
router.get("/career-selection/admin-registrations", requireAuth, requireRole(["super_admin", "admin"]), getCareerSelectionRegistrations);
router.patch("/career-selection/admin-registrations/:id", requireAuth, requireRole(["super_admin", "admin"]), updateCareerSelectionStatus);

// --- Counseling Training Routes ---
router.get("/counseling-training/programs", getCounselingTrainingPrograms);
router.post("/counseling-training/programs", requireAuth, requireRole(["super_admin", "admin"]), createCounselingTrainingProgram);
router.post("/counseling-training/enroll", optionalAuth, enrollCounselingTraining);
router.get("/counseling-training/admin-enrollments", requireAuth, requireRole(["super_admin", "admin"]), getCounselingTrainingEnrollments);
router.patch("/counseling-training/admin-enrollments/:id", requireAuth, requireRole(["super_admin", "admin"]), updateCounselingTrainingEnrollmentStatus);

export default router;
