import { Router } from "express";
import { requireAuth, optionalAuth, requireRole } from "@/middleware/auth";
import { AdminController } from "@/controllers/admin.controller";
import { PlanController } from "@/controllers/plan.controller";

const router = Router();

router.get("/stats", optionalAuth, AdminController.platformStats);
router.get("/org-stats", optionalAuth, AdminController.orgStats);
router.get("/therapists", optionalAuth, AdminController.pendingTherapists);
router.get("/users", optionalAuth, AdminController.listAllUsers);
router.patch("/therapist/:id/verify", optionalAuth, AdminController.verifyTherapist);
router.post("/therapists/:id/revoke-org", optionalAuth, AdminController.revokeTherapistOrg);

router.post("/verify-password-public", AdminController.verifyPasswordPublic);
router.post("/verify-password", optionalAuth, AdminController.verifyPassword);

import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/pending-orgs", optionalAuth, AdminController.pendingOrgs);
router.get("/org/:id/linked-users", optionalAuth, AdminController.getOrgLinkedUsers);
router.post("/org/:id/upload-emails", optionalAuth, upload.single("file"), AdminController.uploadOrgEmailsAdmin);
router.patch("/org/:id/verify", optionalAuth, AdminController.verifyOrg);
router.patch("/org/:id/toggle-external-therapists", optionalAuth, AdminController.toggleExternalTherapists);
router.patch("/org/:id/toggle-cover-therapy", optionalAuth, AdminController.toggleCoverMemberTherapyFees);


router.post("/plans", requireAuth, requireRole(["super_admin"]), PlanController.createPlan);
router.put("/plans/:id", requireAuth, requireRole(["super_admin"]), PlanController.updatePlan);
router.delete("/plans/:id", requireAuth, requireRole(["super_admin"]), PlanController.deletePlan);

router.get("/platform-counts", requireAuth, requireRole(["super_admin"]), AdminController.platformCounts);
router.patch("/therapist/:id/mark-paid", requireAuth, requireRole(["super_admin"]), AdminController.markTherapistPaid);
router.delete("/user/:id", requireAuth, requireRole(["super_admin"]), AdminController.deleteUser);

export default router;
