import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

interface CreateOrderParams {
  amount: number | string | null;
  bookingId: string;
  userEmail?: string | null;
  userName?: string | null;
}

interface CreatePaymentLinkParams {
  amount: number | string | null;
  bookingId: string;
  userName?: string | null;
  userContact?: string | null;
  userEmail?: string | null;
  callbackUrl?: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  [key: string]: any;
}

export class PaymentService {
  /**
   * Create a Razorpay order for a booking
   */
  static async createOrder({
    amount,
    bookingId,
    userEmail,
    userName,
  }: CreateOrderParams) {
    try {
      const numAmount =
        typeof amount === "string" ? parseFloat(amount) : amount || 0;
      const order: RazorpayOrderResponse = (await razorpay.orders.create({
        amount: Math.round(numAmount * 100), // Convert to paise
        currency: "INR",
        receipt: `booking_${bookingId}`,
        notes: {
          bookingId,
          userEmail: userEmail || "",
          userName: userName || "",
        },
      })) as RazorpayOrderResponse;

      return {
        orderId: order.id,
        amount: (order.amount || 0) / 100, // Convert back to rupees
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new Error("Failed to create payment order");
    }
  }

  /**
   * Create a Razorpay Payment Link for a booking.
   * Returns a short_url (hosted on razorpay.com) that works in mobile in-app browsers.
   */
  static async createPaymentLink({
    amount,
    bookingId,
    userName,
    userContact,
    userEmail,
    callbackUrl,
  }: CreatePaymentLinkParams) {
    try {
      const numAmount =
        typeof amount === "string" ? parseFloat(amount) : amount || 0;

      const linkPayload: any = {
        amount: Math.round(numAmount * 100), // paise
        currency: "INR",
        description: "Therapy Session – Mindsyncpro",
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: { bookingId },
      };

      if (userContact || userEmail) {
        linkPayload.customer = {};
        if (userName) linkPayload.customer.name = userName;
        if (userContact) linkPayload.customer.contact = userContact;
        if (userEmail) linkPayload.customer.email = userEmail;
      }

      if (callbackUrl) {
        linkPayload.callback_url = callbackUrl;
        linkPayload.callback_method = "get";
      }

      const link = await (razorpay as any).paymentLink.create(linkPayload);

      return {
        paymentLinkId: link.id as string,
        shortUrl: link.short_url as string,
      };
    } catch (error) {
      console.error("Razorpay payment link creation failed:", error);
      throw new Error("Failed to create payment link");
    }
  }

  /**
   * Verify payment signature from Razorpay webhook
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  /**
   * Fetch payment details from Razorpay
   */
  static async getPaymentDetails(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      const paymentAmount =
        typeof payment.amount === "number" ? payment.amount : 0;
      return {
        id: payment.id,
        amount: paymentAmount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
      };
    } catch (error) {
      console.error("Failed to fetch payment details:", error);
      throw new Error("Failed to fetch payment details");
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(paymentId: string, amount?: number) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: (refund.amount || 0) / 100,
        status: refund.status,
        notes: refund.notes,
      };
    } catch (error) {
      console.error("Refund failed:", error);
      throw new Error("Failed to process refund");
    }
  }
}

export default PaymentService;
