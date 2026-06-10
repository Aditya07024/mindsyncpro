import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { TherapistBooking, User, AIReport } from "@/models";
import { AppError } from "@/lib/app-error";
import PaymentService from "@/services/payment.service";
import mongoose from "mongoose";
import { sendPaymentConfirmedToTherapist } from "@/services/email.service";
import { AIService } from "@/services/ai.service";

export class PaymentController {
  /**
   * Initiate a payment for a booking
   */
  static initiatePayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.body as { bookingId: string };

      if (!bookingId) {
        throw new AppError("bookingId is required", 400);
      }

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.payment.paid) {
        throw new AppError("This booking is already paid", 400);
      }

      const user = await User.findById(req.user!.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Validate user.phoneMasked: if it contains "@", it's an email; if it is a valid 10-digit number, it's contact info.
      const isEmail = user.phoneMasked?.includes("@");
      const userEmail = isEmail ? user.phoneMasked : undefined;
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      const userPhone = (!isEmail && phoneRegex.test(user.phoneMasked)) ? user.phoneMasked : undefined;

      // Create Razorpay Payment Link (hosted page — works in mobile in-app browsers)
      const callbackUrl = `${process.env.API_URL}/api/payment/${bookingId}/callback`;
      const link = await PaymentService.createPaymentLink({
        amount: booking.payment.amount,
        bookingId,
        userName: user.fullName,
        userContact: userPhone,
        userEmail: userEmail,
        callbackUrl,
      });

      // Store payment link id on the booking for later verification
      booking.payment.razorpayOrderId = link.paymentLinkId;
      await booking.save();

      res.json({
        paymentLinkId: link.paymentLinkId,
        shortUrl: link.shortUrl,
        amount: booking.payment.amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId,
        userName: user.fullName,
      });
    },
  );


  /**
   * Verify payment and confirm booking
   */
  static verifyPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId, orderId, paymentId, signature } = req.body as {
        bookingId: string;
        orderId: string;
        paymentId: string;
        signature: string;
      };

      if (!bookingId || !orderId || !paymentId || !signature) {
        throw new AppError("Missing required payment details", 400);
      }

      // Verify signature
      const isValid = PaymentService.verifyPaymentSignature(
        orderId,
        paymentId,
        signature,
      );
      if (!isValid) {
        throw new AppError("Invalid payment signature", 400);
      }

      // Verify payment with Razorpay
      const paymentDetails = await PaymentService.getPaymentDetails(paymentId);
      if (paymentDetails.status !== "captured") {
        throw new AppError("Payment not captured", 400);
      }

      // Update booking
      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      booking.payment.paid = true;
      booking.payment.razorpayPaymentId = paymentId;
      booking.status = "confirmed";
      await booking.save();

      // Send payment-confirmed email to therapist
      try {
        const therapist = await User.findById(booking.therapistId).select("therapistProfile").lean();
        const seeker = await User.findById(booking.userId).select("fullName").lean();
        const therapistEmail = therapist?.therapistProfile?.email;
        if (therapistEmail) {
          sendPaymentConfirmedToTherapist({
            therapistEmail,
            therapistName: therapist?.therapistProfile?.name || "Therapist",
            seekerName: seeker?.fullName || "Client",
            slot: booking.slot,
            fee: booking.payment.amount,
            bookingId: booking._id.toString(),
          }).catch(err => console.error("[Email] Payment confirmed email failed:", err));
        }
      } catch (err) {
        console.error("[Email] Could not send payment confirmed email:", err);
      }

      res.json({
        message: "Payment verified and booking confirmed",
        booking: {
          id: booking._id,
          status: booking.status,
          paid: booking.payment.paid,
          videoRoomId: booking.videoRoomId,
        },
      });
    },
  );

  /**
   * Demo: Bypass Razorpay for testing
   */
  static demoVerifyPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.body as { bookingId: string };

      if (!bookingId) throw new AppError("Missing bookingId", 400);

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) throw new AppError("Booking not found", 404);

      booking.payment.paid = true;
      booking.status = "confirmed";
      await booking.save();

      // Send payment-confirmed email to therapist (demo mode)
      try {
        const therapist = await User.findById(booking.therapistId).select("therapistProfile").lean();
        const seeker = await User.findById(booking.userId).select("fullName").lean();
        const therapistEmail = therapist?.therapistProfile?.email;
        if (therapistEmail) {
          sendPaymentConfirmedToTherapist({
            therapistEmail,
            therapistName: therapist?.therapistProfile?.name || "Therapist",
            seekerName: seeker?.fullName || "Client",
            slot: booking.slot,
            fee: booking.payment.amount,
            bookingId: booking._id.toString(),
          }).catch(err => console.error("[Email] Demo payment confirmed email failed:", err));
        }
      } catch (err) {
        console.error("[Email] Could not send demo payment email:", err);
      }

      res.json({
        message: "Demo Payment verified",
        booking: {
          id: booking._id,
          status: booking.status,
          paid: booking.payment.paid,
          videoRoomId: booking.videoRoomId,
        },
      });
    },
  );

  /**
   * Handle Razorpay webhook
   */
  static handleWebhook = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const event = req.body;
      const signature = req.headers["x-razorpay-signature"];

      // Verify webhook signature
      const body = JSON.stringify(event);
      const expectedSignature = require("crypto")
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest("hex");

      if (expectedSignature !== signature) {
        throw new AppError("Invalid webhook signature", 400);
      }

      if (event.event === "payment.captured") {
        const { id: paymentId, notes } = event.payload.payment.entity;
        const { bookingId } = notes;

        if (bookingId && bookingId.startsWith("report_")) {
          const reportId = bookingId.replace("report_", "");
          const report = await AIReport.findById(reportId);
          if (report && !report.paid) {
            report.paid = true;
            report.razorpayPaymentId = paymentId;
            try {
              const analysis = await AIService.generateAIReportAnalysis(
                report.userId.toString(),
                report.startDate,
                report.endDate
              );
              report.aiAnalysis = analysis;
            } catch (err) {
              console.error("AI report generation failed during webhook:", err);
              report.aiAnalysis = "Clinical Report by Dr. Manas:\n\nBased on your weekly activity logs, I notice that you are actively utilizing journaling to reframe negative thoughts, which is a great practice. I highly recommend booking a dedicated session with our professional therapist to delve deeper into these reframing patterns and work on long-term emotional resilience.";
            }
            await report.save();
          }
        } else {
          const booking = await TherapistBooking.findById(bookingId);
          if (booking && !booking.payment.paid) {
            booking.payment.paid = true;
            booking.payment.razorpayPaymentId = paymentId;
            booking.status = "confirmed";
            await booking.save();
          }
        }
      } else if (event.event === "payment.failed") {
        const { id: paymentId, notes } = event.payload.payment.entity;
        const { bookingId } = notes;

        if (bookingId && !bookingId.startsWith("report_")) {
          const booking = await TherapistBooking.findById(bookingId);
          if (booking) {
            booking.status = "cancelled";
            await booking.save();
          }
        }
      }

      res.json({ received: true });
    },
  );

  /**
   * Get payment details for a booking
   */
  static getPaymentStatus = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      res.json({
        bookingId,
        paid: booking.payment.paid,
        amount: booking.payment.amount,
        razorpayOrderId: booking.payment.razorpayOrderId,
        status: booking.status,
      });
    },
  );

  /**
   * Refund a booking payment
   */
  static refundBooking = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { bookingId } = req.params;

      const booking = await TherapistBooking.findOne({
        _id: bookingId,
        userId: req.user!.sub,
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (!booking.payment.paid) {
        throw new AppError("No payment to refund", 400);
      }

      if (booking.status === "completed") {
        throw new AppError("Cannot refund a completed session", 400);
      }

      // Find payment ID from Razorpay (in production, store this)
      // For now, we'll need to fetch from Razorpay using the order ID
      // In production, you should store the paymentId when verifying payment

      booking.status = "cancelled";
      booking.payment.paid = false;
      await booking.save();

      res.json({
        message: "Booking refunded successfully",
        bookingId,
      });
    },
  );

  /**
   * Handle Razorpay Payment Link callback after payment completes.
   * Razorpay redirects to this URL with query params after the user pays.
   */
  static handleCallback = asyncHandler(
    async (req: any, res: Response) => {
      const { bookingId } = req.params;
      const {
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_status,
        razorpay_signature,
      } = req.query as Record<string, string>;

      const booking = await TherapistBooking.findById(bookingId);
      if (!booking) {
        return res.status(404).send("<h1>Booking not found</h1>");
      }

      // Mark as paid if Razorpay signals success
      if (razorpay_payment_link_status === "paid" && razorpay_payment_id) {
        if (!booking.payment.paid) {
          booking.payment.paid = true;
          booking.payment.razorpayPaymentId = razorpay_payment_id;
          booking.status = "confirmed";
          await booking.save();

          // Send confirmation email to therapist
          try {
            const therapist = await User.findById(booking.therapistId)
              .select("therapistProfile")
              .lean();
            const seeker = await User.findById(booking.userId)
              .select("fullName")
              .lean();
            const therapistEmail = therapist?.therapistProfile?.email;
            if (therapistEmail) {
              const { sendPaymentConfirmedToTherapist } = await import(
                "@/services/email.service"
              );
              sendPaymentConfirmedToTherapist({
                therapistEmail,
                therapistName:
                  therapist?.therapistProfile?.name || "Therapist",
                seekerName: seeker?.fullName || "Client",
                slot: booking.slot,
                fee: booking.payment.amount,
                bookingId: booking._id.toString(),
              }).catch((err: any) =>
                console.error("[Email] Callback payment email failed:", err),
              );
            }
          } catch (err) {
            console.error("[Email] Could not send callback payment email:", err);
          }
        }
      }

      const paid = booking.payment.paid;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mindsyncpro – Payment ${paid ? "Confirmed" : "Pending"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; margin: 0; background-color: #F8FBFB;
      color: #2E6E65; padding: 20px; box-sizing: border-box; text-align: center;
    }
    .card {
      background: white; padding: 30px; border-radius: 16px;
      box-shadow: 0 4px 20px rgba(46,110,101,0.08); max-width: 380px;
      width: 100%; border: 1px solid #E6EFEF;
    }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h2 { margin: 0 0 12px; font-size: 22px; color: #2E6E65; }
    p { color: #608F87; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${paid ? "✅" : "⏳"}</div>
    <h2>${paid ? "Payment Confirmed!" : "Payment Pending"}</h2>
    <p>${
      paid
        ? "Your therapy session has been booked successfully. Please close this window and return to the Mindsyncpro app to view your booking."
        : "Your payment is being processed. Once confirmed, please sync in the app. You can close this window and return to Mindsyncpro."
    }</p>
  </div>
</body>
</html>
      `;
      res.send(html);
    },
  );

  /**
   * Initiate payment for 1-week premium AI report analysis
   */
  static initiateReportPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { startDate, endDate } = req.body as {
        startDate: string;
        endDate: string;
      };

      if (!startDate || !endDate) {
        throw new AppError("startDate and endDate are required", 400);
      }

      const user = await User.findById(req.user!.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Create a pending report purchase
      const report = await AIReport.create({
        userId: new mongoose.Types.ObjectId(req.user!.sub),
        startDate: start,
        endDate: end,
        paid: false,
        amount: 29,
      });

      const isEmail = user.phoneMasked?.includes("@");
      const userEmail = isEmail ? user.phoneMasked : undefined;
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      const userPhone = (!isEmail && phoneRegex.test(user.phoneMasked)) ? user.phoneMasked : undefined;

      const callbackUrl = `${process.env.API_URL}/api/payment/report/${report._id}/callback`;
      
      const link = await PaymentService.createPaymentLink({
        amount: 29,
        bookingId: `report_${report._id}`,
        userName: user.fullName,
        userContact: userPhone,
        userEmail: userEmail,
        callbackUrl,
      });

      report.razorpayPaymentLinkId = link.paymentLinkId;
      await report.save();

      res.json({
        paymentLinkId: link.paymentLinkId,
        shortUrl: link.shortUrl,
        amount: 29,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        reportId: report._id,
        userName: user.fullName,
      });
    }
  );

  /**
   * Demo verify premium AI report analysis (bypass Razorpay)
   */
  static demoVerifyReportPayment = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const { reportId } = req.body as { reportId: string };

      if (!reportId) throw new AppError("Missing reportId", 400);

      const report = await AIReport.findOne({
        _id: reportId,
        userId: req.user!.sub,
      });

      if (!report) throw new AppError("Report not found", 404);

      report.paid = true;

      try {
        const analysis = await AIService.generateAIReportAnalysis(
          req.user!.sub,
          report.startDate,
          report.endDate
        );
        report.aiAnalysis = analysis;
      } catch (err) {
        console.error("AI report generation failed during demo verify:", err);
        report.aiAnalysis = "Clinical Report by Dr. Manas:\n\nBased on your weekly activity logs, I notice that you are actively utilizing journaling to reframe negative thoughts, which is a great practice. I highly recommend booking a dedicated session with our professional therapist to delve deeper into these reframing patterns and work on long-term emotional resilience.";
      }

      await report.save();

      res.json({
        message: "Demo Payment verified for AI Report",
        report: {
          id: report._id,
          paid: report.paid,
          aiAnalysis: report.aiAnalysis,
        },
      });
    }
  );

  /**
   * Razorpay callback redirect for report payment link status checking
   */
  static handleReportCallback = asyncHandler(
    async (req: any, res: Response) => {
      const { reportId } = req.params;
      const {
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_status,
      } = req.query as Record<string, string>;

      const report = await AIReport.findById(reportId);
      if (!report) {
        return res.status(404).send("<h1>Report not found</h1>");
      }

      if (razorpay_payment_link_status === "paid" && razorpay_payment_id) {
        if (!report.paid) {
          report.paid = true;
          report.razorpayPaymentId = razorpay_payment_id;

          try {
            const analysis = await AIService.generateAIReportAnalysis(
              report.userId.toString(),
              report.startDate,
              report.endDate
            );
            report.aiAnalysis = analysis;
          } catch (err) {
            console.error("AI report generation failed during report callback:", err);
            report.aiAnalysis = "Clinical Report by Dr. Manas:\n\nBased on your weekly activity logs, I notice that you are actively utilizing journaling to reframe negative thoughts, which is a great practice. I highly recommend booking a dedicated session with our professional therapist to delve deeper into these reframing patterns and work on long-term emotional resilience.";
          }

          await report.save();
        }
      }

      const paid = report.paid;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mindsyncpro – Report Payment ${paid ? "Confirmed" : "Pending"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; margin: 0; background-color: #F8FBFB;
      color: #2E6E65; padding: 20px; box-sizing: border-box; text-align: center;
    }
    .card {
      background: white; padding: 30px; border-radius: 16px;
      box-shadow: 0 4px 20px rgba(46,110,101,0.08); max-width: 380px;
      width: 100%; border: 1px solid #E6EFEF;
    }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h2 { margin: 0 0 12px; font-size: 22px; color: #2E6E65; }
    p { color: #608F87; font-size: 14px; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${paid ? "✅" : "⏳"}</div>
    <h2>${paid ? "Payment Confirmed!" : "Payment Pending"}</h2>
    <p>${
      paid
        ? "Your premium AI Therapist analysis has been unlocked successfully. Please close this window and return to the Mindsyncpro app to view your analysis."
        : "Your payment is being processed. Once confirmed, your report will be generated. You can close this window and return to Mindsyncpro."
    }</p>
  </div>
</body>
</html>
      `;
      res.send(html);
    }
  );
}

