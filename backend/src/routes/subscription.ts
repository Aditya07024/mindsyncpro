import { Router } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { SubscriptionController } from "@/controllers/subscription.controller";

const router = Router();

// User routes
router.get("/", requireAuth, SubscriptionController.getMySubscription);
router.post("/upgrade", requireAuth, SubscriptionController.upgradeSubscription);
router.post("/cancel", requireAuth, SubscriptionController.cancelSubscription);
router.post("/demo-activate", requireAuth, SubscriptionController.demoActivate);
router.post("/sync", requireAuth, SubscriptionController.syncSubscription);

// Cron job / Keep-alive endpoints (no auth required for external uptime monitoring & cron triggers)
router.get("/cron-sync", SubscriptionController.cronSync);
router.get("/keep-alive", (req, res) => res.json({ status: "ok", message: "Server is online", timestamp: new Date().toISOString() }));

// Razorpay webhook (no auth — verified by signature)
router.post("/webhook", SubscriptionController.webhook);

// Super admin
router.get(
  "/admin/all",
  requireAuth,
  requireRole(["super_admin"]),
  SubscriptionController.adminListAll,
);

export default router;
