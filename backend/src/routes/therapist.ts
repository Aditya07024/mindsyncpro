import { Router } from "express";
import { requireAuth, optionalAuth } from "@/middleware/auth";
import { requireSubscription } from "@/middleware/subscription";
import { TherapistController } from "@/controllers/therapist.controller";
import { ReportController } from "@/controllers/report.controller";

const router = Router();

// Recommend therapists (auth required)
router.post("/recommend", requireAuth, TherapistController.recommend);

// Public / Optional Auth: list all therapists with search & filters
router.get("/", optionalAuth, TherapistController.list);

// ⚠️ /me/* routes MUST come before /:id to avoid "me" being matched as an ID param

// Therapist's own portal data (authenticated)
router.get("/me/stats", requireAuth, requireSubscription, TherapistController.myStats);
router.get("/me/bookings", requireAuth, requireSubscription, TherapistController.myBookings);
router.patch(
  "/me/availability",
  requireAuth,
  requireSubscription,
  TherapistController.updateAvailability,
);
router.patch(
  "/me/profile",
  requireAuth,
  requireSubscription,
  TherapistController.updateProfile,
);

router.get("/me/invitations", requireAuth, TherapistController.listInvitations);
router.patch("/me/invitations/:id/respond", requireAuth, TherapistController.respondToInvitation);
router.post("/me/leave-org", requireAuth, TherapistController.leaveOrg);

// Shared Reports (no subscription check — reports are shared directly to therapist)
router.get(
  "/me/shared-reports",
  requireAuth,
  ReportController.getTherapistSharedReports,
);
router.get(
  "/me/shared-reports/:id",
  requireAuth,
  ReportController.getTherapistSharedReportDetail,
);

// Public / Optional Auth: get single therapist details (must be AFTER all /me/* routes)
router.get("/:id", optionalAuth, TherapistController.getDetail);

// Public / Optional Auth: check therapist's available slots
router.get("/:id/availability", optionalAuth, TherapistController.getAvailability);

export default router;
