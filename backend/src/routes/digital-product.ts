import { Router } from "express";
import {
  getDigitalProducts,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  getDigitalProductConfig,
  updateDigitalProductConfig,
  uploadPdf,
  uploadImages,
  purchaseProduct,
  downloadSecurePdf,
} from "../controllers/digital-product.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { protectedPdfUpload, posterUpload } from "../middleware/upload.middleware";

const router = Router();

router.get("/config", getDigitalProductConfig);
router.put("/config", requireAuth, requireRole(["super_admin", "admin"]), updateDigitalProductConfig);

router.get("/", getDigitalProducts);
router.post("/", requireAuth, requireRole(["super_admin", "admin"]), createDigitalProduct);
router.put("/:id", requireAuth, requireRole(["super_admin", "admin"]), updateDigitalProduct);
router.delete("/:id", requireAuth, requireRole(["super_admin", "admin"]), deleteDigitalProduct);

// Admin file upload routes
router.post(
  "/upload-pdf",
  requireAuth,
  requireRole(["super_admin", "admin"]),
  protectedPdfUpload.single("pdfFile"),
  uploadPdf
);

router.post(
  "/upload-images",
  requireAuth,
  requireRole(["super_admin", "admin"]),
  posterUpload.array("images", 10),
  uploadImages
);

// Payment process route (returns verified token)
router.post("/:id/purchase", purchaseProduct);

// Secure stream & download route (Protected by purchase token or admin auth)
router.get("/:id/secure-download", downloadSecurePdf);

export default router;
