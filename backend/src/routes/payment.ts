import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { PaymentController } from "@/controllers/payment.controller";

const router = Router();

// POST /api/payment/webhook - Razorpay webhook (no auth required)
router.post("/webhook", PaymentController.handleWebhook);

// GET /api/payment/:bookingId/callback - Razorpay Payment Link redirect after payment
router.get("/:bookingId/callback", PaymentController.handleCallback);

// GET /api/payment/report/:reportId/callback - Razorpay redirect for report payment
router.get("/report/:reportId/callback", PaymentController.handleReportCallback);

// All payment routes below require authentication
router.use(requireAuth);

// POST /api/payment/initiate - Initiate a payment
router.post("/initiate", PaymentController.initiatePayment);

// POST /api/payment/verify - Verify payment and confirm booking
router.post("/verify", PaymentController.verifyPayment);

// POST /api/payment/demo-verify - Demo bypass
router.post("/demo-verify", PaymentController.demoVerifyPayment);

// POST /api/payment/report/initiate - Initiate report payment
router.post("/report/initiate", PaymentController.initiateReportPayment);

// POST /api/payment/report/demo-verify - Demo verify report payment
router.post("/report/demo-verify", PaymentController.demoVerifyReportPayment);

// GET /api/payment/:bookingId - Get payment status
router.get("/:bookingId", PaymentController.getPaymentStatus);

// POST /api/payment/:bookingId/refund - Refund a booking
router.post("/:bookingId/refund", PaymentController.refundBooking);

export default router;
