import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Video,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";
import { getNormalizedPosterUrl } from "@/lib/utils";

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
    isRedirectOnly?: boolean;
    banner?: string;
    posterUrl?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessJoin?: (conferenceId: string) => void;
  initialMode?: "register" | "already_registered";
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
  initialMode = "register",
}) => {
  const { user } = useUser();

  const [mode, setMode] = useState<"register" | "already_registered">(initialMode);

  // New Registration fields
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<string>("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Already Registered fields
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || "register");
      setLookupError(null);
      setErrors({});
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (user) {
      const uName = user.fullName || user.firstName || "";
      const uEmail = user.primaryEmailAddress?.emailAddress || "";
      setFullName((prev) => prev || uName);
      setEmail((prev) => prev || uEmail);
      setLookupEmail((prev) => prev || uEmail);
    }
  }, [user]);

  const [emailStatusInfo, setEmailStatusInfo] = useState<{
    isExempt: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!conference || !emailRegex.test(cleanEmail)) {
      setEmailStatusInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await API.conference.checkEmailStatus(conference._id, cleanEmail);
        if (res.isExemptFromPayment) {
          setEmailStatusInfo({
            isExempt: true,
            message: res.statusMessage || "Allowed by Admin / Host (No payment required)",
          });
        } else {
          setEmailStatusInfo(null);
        }
      } catch (e) {
        setEmailStatusInfo(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, conference]);

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
    if (!phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(phone.trim())) {
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
      const cleanEmail = email.trim().toLowerCase();
      // Save guest info locally for seamless room join
      localStorage.setItem("guest_conf_email", cleanEmail);
      localStorage.setItem("guest_conf_name", fullName.trim());

      const res = await API.conference.register({
        conferenceId: conference._id,
        fullName: fullName.trim(),
        age: Number(age),
        email: cleanEmail,
        phone: phone.trim(),
      });

      if (res.isAlreadyRegistered || res.isAllowedByAdmin || res.isHost || !res.isPaid || !res.orderId) {
        toast.success(res.message || "Registration confirmed!");
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
        key: res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TQ764nZF0N6bzR",
        amount: Math.round(res.amount * 100),
        currency: res.currency || "INR",
        name: "MyMindTherapyFriend",
        description: `Registration for ${conference.title}`,
        order_id: res.orderId,
        prefill: {
          name: fullName,
          email: cleanEmail,
          contact: phone,
        },
        theme: {
          color: "#0F766E",
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            await API.conference.verifyPayment({
              conferenceId: conference._id,
              orderId: res.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            toast.success("Payment verified!");
            enterMeeting();
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

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = lookupEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setLookupError("Please enter a valid email address");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await API.conference.verifyEmail(conference._id, cleanEmail);

      // Save verified attendee locally for room join
      localStorage.setItem("guest_conf_email", cleanEmail);
      if (res.fullName) {
        localStorage.setItem("guest_conf_name", res.fullName);
      }

      // If user can join directly (free, paid, allowed by admin, host)
      if (res.canJoin) {
        toast.success(res.message || "Registration verified! Entering conference room...");
        enterMeeting();
        return;
      }

      // If conference is paid and user has a pending payment record
      if (res.requiresPayment && res.orderId) {
        if (!window.Razorpay) {
          toast.info("Entering meeting room...");
          enterMeeting();
          return;
        }

        const options = {
          key: res.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TQ764nZF0N6bzR",
          amount: Math.round(res.amount * 100),
          currency: res.currency || "INR",
          name: "MyMindTherapyFriend",
          description: `Registration for ${conference.title}`,
          order_id: res.orderId,
          prefill: {
            name: res.fullName || "",
            email: cleanEmail,
            contact: res.phone || "",
          },
          theme: {
            color: "#0F766E",
          },
          handler: async (response: any) => {
            try {
              setLookupLoading(true);
              await API.conference.verifyPayment({
                conferenceId: conference._id,
                orderId: res.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              toast.success("Payment verified! Joining conference room...");
              enterMeeting();
            } catch (err: any) {
              toast.error(err.message || "Payment verification failed");
            } finally {
              setLookupLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast.warning("Payment cancelled. You can retry anytime.");
              setLookupLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast.error(response.error?.description || "Payment transaction failed");
          setLookupLoading(false);
        });
        rzp.open();
        return;
      }

      toast.success(res.message || "Registration verified!");
      enterMeeting();
    } catch (err: any) {
      const msg = err.message || "No registration found for this email";
      setLookupError(msg);
      toast.error(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const posterSrc = getNormalizedPosterUrl(conference.posterUrl || conference.banner);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg my-auto overflow-hidden bg-slate-900/95 border border-teal-500/25 shadow-2xl rounded-2xl sm:rounded-3xl text-slate-100 backdrop-blur-xl flex flex-col max-h-[92dvh]"
        >
          {/* Header */}
          <div className="relative py-3.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-teal-950 via-emerald-950/90 to-slate-900 flex items-center justify-between border-b border-teal-500/20 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 pr-2 min-w-0">
              <div className="p-2 sm:p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-xl sm:rounded-2xl text-teal-300 shrink-0">
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-teal-300 uppercase rounded-full bg-teal-500/20 border border-teal-400/20 mb-0.5 sm:mb-1">
                  {mode === "already_registered"
                    ? "Existing Attendee"
                    : isFree
                    ? "Free Conference"
                    : `₹${conference.price} Payment Required`}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate leading-snug">
                  {conference.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Scrollable Container */}
          <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Poster Banner */}
            {posterSrc && (
              <div className="relative w-full bg-slate-950/80 flex items-center justify-center p-2 rounded-xl sm:rounded-2xl border border-teal-500/15 max-h-36 sm:max-h-48 overflow-hidden">
                <img
                  src={posterSrc}
                  alt={conference.title}
                  className="max-w-full max-h-32 sm:max-h-44 object-contain rounded-lg sm:rounded-xl shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {mode === "already_registered" ? (
              /* ================= ALREADY REGISTERED MODE ================= */
              <form onSubmit={handleLookupSubmit} className="space-y-4">
                {/* Switch back banner */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-teal-200">
                    <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Already registered? Enter your email ID below.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setLookupError(null);
                    }}
                    className="text-teal-300 hover:text-teal-100 font-semibold underline shrink-0 transition-colors"
                  >
                    New registration? Click here
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-400" />
                    Registered Email ID <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="email"
                    autoFocus
                    value={lookupEmail}
                    onChange={(e) => {
                      setLookupEmail(e.target.value);
                      setLookupError(null);
                    }}
                    placeholder="name@example.com"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                  />
                  {lookupError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mt-2 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{lookupError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setEmail(lookupEmail);
                          setLookupError(null);
                        }}
                        className="text-teal-300 hover:text-teal-200 font-bold underline pl-6 block text-left"
                      >
                        Not registered yet? Click here to register as a new attendee →
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    No need to re-enter your name or phone. We will verify your registration in the database directly.
                  </p>
                </div>

                {/* Guarantee notice */}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Instant database lookup. Direct entry upon verification.</span>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={lookupLoading}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {lookupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Email...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter Room</span>
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* ================= NEW REGISTRATION MODE ================= */
              <form onSubmit={handleRegister} className="space-y-3.5 sm:space-y-4">
                {/* Already Registered prompt banner */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-teal-200">
                    <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Already registered for this conference?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("already_registered");
                      setLookupEmail(email || "");
                      setLookupError(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-teal-950 bg-teal-300 hover:bg-teal-200 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    Click here
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-400" /> Full Name <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                  />
                  {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
                </div>

                {/* Age & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" /> Age <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                    />
                    {errors.age && <p className="text-xs text-rose-400 mt-1">{errors.age}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-teal-400" /> Phone <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                    />
                    {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-400" /> Email Address <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white placeholder-slate-500 text-sm transition-all"
                  />
                  {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                  {emailStatusInfo?.isExempt && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold mt-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{emailStatusInfo.message}</span>
                    </div>
                  )}
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

                {/* Secondary link to switch to Already Registered */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("already_registered");
                      setLookupEmail(email || "");
                      setLookupError(null);
                    }}
                    className="text-xs text-teal-400 hover:text-teal-300 hover:underline transition-colors font-medium inline-flex items-center gap-1"
                  >
                    Already registered? Click here to enter with your email ID →
                  </button>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{isFree || emailStatusInfo?.isExempt ? "Join Meeting Now" : `Proceed to Pay ₹${conference.price}`}</span>
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
