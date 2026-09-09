import { Router } from "express";
import {
  getDigitalProducts,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  getDigitalProductConfig,
  updateDigitalProductConfig,
} from "../controllers/digital-product.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/config", getDigitalProductConfig);
router.put("/config", requireAuth, requireRole(["super_admin", "admin"]), updateDigitalProductConfig);

router.get("/", getDigitalProducts);
router.post("/", requireAuth, requireRole(["super_admin", "admin"]), createDigitalProduct);
router.put("/:id", requireAuth, requireRole(["super_admin", "admin"]), updateDigitalProduct);
router.delete("/:id", requireAuth, requireRole(["super_admin", "admin"]), deleteDigitalProduct);

export default router;
