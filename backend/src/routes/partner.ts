import { Router } from "express";
import {
  getPartners,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerConfig,
  updatePartnerConfig,
  uploadPartnerLogo,
} from "../controllers/partner.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { posterUpload } from "../middleware/upload.middleware";

const router = Router();

router.get("/config", getPartnerConfig);
router.put("/config", requireAuth, requireRole(["super_admin", "admin"]), updatePartnerConfig);

router.get("/", getPartners);
router.post("/", requireAuth, requireRole(["super_admin", "admin"]), createPartner);
router.put("/:id", requireAuth, requireRole(["super_admin", "admin"]), updatePartner);
router.delete("/:id", requireAuth, requireRole(["super_admin", "admin"]), deletePartner);

// Logo image upload
router.post(
  "/upload-logo",
  requireAuth,
  requireRole(["super_admin", "admin"]),
  posterUpload.single("logo"),
  uploadPartnerLogo
);

export default router;
