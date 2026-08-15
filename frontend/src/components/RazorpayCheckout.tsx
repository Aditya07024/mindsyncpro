import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import API from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader } from "lucide-react";

interface RazorpayCheckoutProps {
  bookingId: string;
  amount: number;
  userName?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({
  bookingId,
  amount,
  userName,
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const scriptLoaded = useRef(false);

  // Initialize payment mutation
  const initiateMutation = useMutation({
    mutationFn: () => API.payment.initiate({ bookingId }),
    onError: (error) => {
      onError?.((error as Error).message);
    },
  });

  // Verify payment mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { orderId: string; paymentId: string; signature: string }) =>
      API.payment.verify({ bookingId, ...data }),
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error) => {
      onError?.((error as Error).message);
    },
  });

  // Load Razorpay script
  useEffect(() => {
    if (scriptLoaded.current) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle payment
  const handlePayment = async () => {
    if (!window.Razorpay) {
      onError?.("Razorpay script not loaded");
      return;
    }

    // Step 1: Initiate payment
    const paymentData = await initiateMutation.mutateAsync();

    // Step 2: Open Razorpay checkout
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TQ764nZF0N6bzR",
      amount: amount * 100, // Amount in paise
      currency: "INR",
      order_id: paymentData.orderId,
      name: "MindBloom Therapy",
      description: `Therapy Session with ${userName}`,
      prefill: {
        name: userName || "User",
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // Step 3: Verify payment
        verifyMutation.mutate({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          onError?.("Payment cancelled by user");
        },
      },
      theme: {
        color: "#2563eb",
      },
    };

    const checkout = new window.Razorpay(options);
    checkout.open();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Complete Payment</h2>

        {/* Order Summary */}
        <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-600">Session Fee</span>
            <span className="font-semibold text-slate-900">₹{amount}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-3">
            <span>Total Amount</span>
            <span className="text-blue-600">₹{amount}</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Secure Payment</p>
            <p>
              Your payment is processed securely by Razorpay. You'll receive a confirmation SMS with
              video room details.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {initiateMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{(initiateMutation.error as Error).message}</p>
          </div>
        )}

        {verifyMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{(verifyMutation.error as Error).message}</p>
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={initiateMutation.isPending || verifyMutation.isPending}
          size="lg"
          className="w-full h-12 rounded-lg"
        >
          {initiateMutation.isPending || verifyMutation.isPending ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${amount} with Razorpay`
          )}
        </Button>

        <p className="text-xs text-slate-500 text-center mt-4">
          By clicking "Pay", you agree to the terms and conditions
        </p>
      </Card>
    </motion.div>
  );
}
