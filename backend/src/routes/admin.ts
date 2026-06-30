import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { AdminController } from "@/controllers/admin.controller";
import { PlanController } from "@/controllers/plan.controller";

const router = Router();

router.get("/stats", requireAuth, requireRole(["super_admin"]), AdminController.platformStats);
router.get("/org-stats", requireAuth, AdminController.orgStats);
router.get("/therapists", requireAuth, requireRole(["super_admin"]), AdminController.pendingTherapists);
router.get("/users", requireAuth, requireRole(["super_admin"]), AdminController.listAllUsers);
router.patch("/therapist/:id/verify", requireAuth, requireRole(["super_admin"]), AdminController.verifyTherapist);

router.post("/verify-password-public", AdminController.verifyPasswordPublic);
router.post("/verify-password", requireAuth, requireRole(["super_admin"]), AdminController.verifyPassword);

router.get("/pending-orgs", requireAuth, requireRole(["super_admin"]), AdminController.pendingOrgs);
router.patch("/org/:id/verify", requireAuth, requireRole(["super_admin"]), AdminController.verifyOrg);
router.patch("/org/:id/toggle-external-therapists", requireAuth, requireRole(["super_admin"]), AdminController.toggleExternalTherapists);

router.post("/plans", requireAuth, requireRole(["super_admin"]), PlanController.createPlan);
router.put("/plans/:id", requireAuth, requireRole(["super_admin"]), PlanController.updatePlan);
router.delete("/plans/:id", requireAuth, requireRole(["super_admin"]), PlanController.deletePlan);

router.get("/platform-counts", requireAuth, requireRole(["super_admin"]), AdminController.platformCounts);
router.patch("/therapist/:id/mark-paid", requireAuth, requireRole(["super_admin"]), AdminController.markTherapistPaid);
router.delete("/user/:id", requireAuth, requireRole(["super_admin"]), AdminController.deleteUser);

export default router;
