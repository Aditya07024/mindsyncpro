import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2, Sparkles, User, Mail, Phone, Calendar } from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface ConferenceRegisterModalProps {
  conference: {
    _id: string;
    title: string;
    priceType: "free" | "paid" | "custom";
    price: number;
    meetingDate: string;
    meetingTime: string;
    roomName: string;
    platform?: string;
    meetingLink?: string;
    banner?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessJoin?: (conferenceId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const ConferenceRegisterModal: React.FC<ConferenceRegisterModalProps> = ({
  conference,
  isOpen,
  onClose,
  onSuccessJoin,
}) => {
  const { user, isSignedIn } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.firstName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user]);

  // Load Razorpay script dynamically if needed
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen || !conference) return null;

  const isFree = conference.priceType === "free" || conference.price === 0;

  const enterMeeting = () => {
    onClose();
    if (onSuccessJoin) {
      onSuccessJoin(conference._id);
    } else {
      window.location.href = `/conferences/${conference._id}/room`;
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
      errs.age = "Please enter a valid age (1-120)";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (phone && !/^\+?[0-9\s-]{8,15}$/.test(phone.trim())) {
      errs.phone = "Please enter a valid phone number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      // Save guest info locally for seamless room join
      localStorage.setItem("guest_conf_email", email.trim().toLowerCase());
      localStorage.setItem("guest_conf_name", fullName.trim());

      const res = await API.conference.register({
        conferenceId: conference._id,
        fullName: fullName.trim(),
        age: Number(age),
        email: email.trim(),
        phone: phone.trim(),
      });

      if (res.isAlreadyRegistered || !res.isPaid || !res.orderId) {
        toast.success("Registration confirmed!");
        enterMeeting();
        return;
      }

      // PAID CONFERENCE -> Trigger Razorpay Payment with fallback
      if (!window.Razorpay) {
        toast.info("Entering meeting room...");
        enterMeeting();
        return;
      }

      const options = {
        key: res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(res.amount * 100),
        currency: res.currency || "INR",
        name: "MyMindTherapyFriend",
        description: `Registration for ${conference.title}`,
        order_id: res.orderId,
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        theme: {
          color: "#0F766E",
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await API.conference.verifyPayment({
              conferenceId: conference._id,
              orderId: res.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            toast.success("Payment verified!");
            enterMeeting(verifyRes.platform || res.platform, verifyRes.meetingLink || res.meetingLink);
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.warning("Payment cancelled. You can retry anytime.");
            setLoading(false);
          },
        },
      };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(response.error?.description || "Payment transaction failed");
          setLoading(false);
        });
        rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden bg-slate-900/90 border border-teal-500/20 shadow-2xl rounded-3xl text-slate-100 backdrop-blur-xl"
        >
          {/* Top Gradient Banner */}
          <div className="relative h-28 bg-gradient-to-r from-teal-900/80 via-emerald-800/80 to-slate-900 flex items-center px-6 justify-between border-b border-teal-500/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-2xl text-teal-300">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-xs font-semibold tracking-wider text-teal-300 uppercase rounded-full bg-teal-500/20 border border-teal-400/20 mb-1">
                  {isFree ? "Free Conference" : `₹${conference.price} Payment Required`}
                </span>
                <h3 className="text-lg font-bold text-white line-clamp-1">{conference.title}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleRegister} className="p-6 space-y-4">
            {/* {!isSignedIn && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-amber-200 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>You need to sign in before joining this conference.</span>
                </div>
                <button
                  type="button"
                  onClick={() => clerk.openSignIn()}
                  className="px-3 py-1.5 font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shrink-0"
                >
                  Sign In
                </button>
              </div>
            )} */}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" /> Full Name <span className="text-teal-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Ananya Sharma"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
              />
              {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" /> Age <span className="text-teal-400">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                />
                {errors.age && <p className="text-xs text-rose-400 mt-1">{errors.age}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-teal-400" /> Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                />
                {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" /> Email Address <span className="text-teal-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
            </div>

            {/* Payment / Guarantee notice */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                {isFree
                  ? "Instant access to video room upon registration. Encrypted & private."
                  : `Secure 256-bit Razorpay checkout. Immediate entry upon payment.`}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isFree ? "Join Meeting Now" : `Proceed to Pay ₹${conference.price}`}</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
