import API from "./api";

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

interface OpenSubscriptionCheckoutOptions {
  subscriptionId: string;
  planName: string;
  userEmail?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export async function openSubscriptionCheckout({
  subscriptionId,
  planName,
  userEmail,
  onSuccess,
  onCancel,
}: OpenSubscriptionCheckoutOptions) {
  const loaded = await loadRazorpay();
  if (!loaded) {
    throw new Error("Razorpay SDK failed to load");
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    subscription_id: subscriptionId,
    name: "MyMindTherapyFriend",
    description: `Subscription for ${planName}`,
    prefill: {
      email: userEmail || "",
    },
    handler: async () => {
      try {
        await API.subscription.sync();
        onSuccess();
      } catch (err) {
        console.error("Sync after subscription payment failed:", err);
        // Fallback: still trigger onSuccess so UI updates
        onSuccess();
      }
    },
    modal: {
      ondismiss: () => {
        onCancel?.();
      },
    },
    theme: {
      color: "#0d9488", // Teal theme color
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
