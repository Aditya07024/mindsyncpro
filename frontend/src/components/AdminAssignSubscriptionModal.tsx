import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

interface AdminAssignSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist?: {
    id: string;
    name: string;
    email?: string;
    subscription?: {
      id?: string;
      plan?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
      offlineReference?: string;
      offlineNotes?: string;
      amountPaid?: number;
    } | null;
  } | null;
  allTherapists?: Array<{
    id: string;
    name: string;
    email?: string;
    subscription?: any;
  }>;
  plans?: Array<{
    _id: string;
    name: string;
    price: number;
    durationMonths?: number;
    audience: string;
    features?: string[];
  }>;
  onSuccess: () => void;
}

const DURATION_PRESETS = [
  { label: "1 Month", months: 1 },
  { label: "3 Months", months: 3 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
  { label: "2 Years", months: 24 },
];

const PAYMENT_MODES = [
  { id: "offline_upi", label: "Direct UPI (GPay / PhonePe / Paytm / BHIM)" },
  { id: "offline_cash", label: "Cash (Hand-to-Hand)" },
  { id: "offline_bank_transfer", label: "Bank Transfer (NEFT / IMPS / RTGS)" },
  { id: "offline_cheque", label: "Cheque / Demand Draft" },
  { id: "admin_grant", label: "Admin Complimentary / Waiver" },
  { id: "offline_other", label: "Other Offline Method" },
];

export function AdminAssignSubscriptionModal({
  isOpen,
  onClose,
  therapist,
  allTherapists = [],
  plans = [],
  onSuccess,
}: AdminAssignSubscriptionModalProps) {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isCustomPlan, setIsCustomPlan] = useState<boolean>(false);
  const [customPlanName, setCustomPlanName] = useState<string>("Counsellor Pro");
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [paymentMethod, setPaymentMethod] = useState<string>("offline_upi");
  const [reference, setReference] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number | "">(999);
  const [notes, setNotes] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [extendExisting, setExtendExisting] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [revokeReason, setRevokeReason] = useState<string>("");
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<boolean>(false);

  // Filter therapist plans
  const therapistPlans = plans.filter(
    (p) => p.audience === "therapist" || !p.audience
  );

  // Sync state when therapist or plans change
  useEffect(() => {
    if (therapist?.id) {
      setSelectedTherapistId(therapist.id);
    } else if (allTherapists.length > 0 && !selectedTherapistId) {
      setSelectedTherapistId(allTherapists[0].id);
    }
  }, [therapist, allTherapists]);

  // Set default plan
  useEffect(() => {
    if (therapistPlans.length > 0 && !selectedPlanId && !isCustomPlan) {
      const defaultPlan = therapistPlans[0];
      setSelectedPlanId(defaultPlan._id);
      setDurationMonths(defaultPlan.durationMonths || 6);
      setAmountPaid(defaultPlan.price ?? 999);
    }
  }, [therapistPlans]);

  // Handle plan change
  const handlePlanSelect = (planId: string) => {
    if (planId === "custom") {
      setIsCustomPlan(true);
      setSelectedPlanId("");
      setCustomPlanName("Counsellor Pro");
    } else {
      setIsCustomPlan(false);
      setSelectedPlanId(planId);
      const chosen = therapistPlans.find((p) => p._id === planId);
      if (chosen) {
        setDurationMonths(chosen.durationMonths || 6);
        setAmountPaid(chosen.price ?? 999);
      }
    }
  };

  const activeTherapist =
    therapist || allTherapists.find((t) => t.id === selectedTherapistId);
  const currentSub = activeTherapist?.subscription;
  const isCurrentlyActive = currentSub?.status === "active";

  // Compute start and end dates
  const now = new Date();
  const baseDate =
    isCurrentlyActive && extendExisting && currentSub?.endDate && new Date(currentSub.endDate) > now
      ? new Date(currentSub.endDate)
      : now;
  const computedEndDate = new Date(
    baseDate.getTime() + (durationMonths || 1) * 30 * 24 * 60 * 60 * 1000
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapistId) {
      toast.error("Please select a counsellor.");
      return;
    }
    if (!password) {
      toast.error("Admin action password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const planDoc = therapistPlans.find((p) => p._id === selectedPlanId);
      const res = await API.admin.assignTherapistSubscription(selectedTherapistId, {
        planId: isCustomPlan ? undefined : selectedPlanId,
        customPlanName: isCustomPlan ? customPlanName : (planDoc?.name || customPlanName),
        durationMonths,
        paymentMethod,
        reference,
        amountPaid: amountPaid === "" ? 0 : Number(amountPaid),
        notes,
        password,
        extendExisting: isCurrentlyActive && extendExisting,
      });

      toast.success(res.message || "Subscription successfully activated!");
      setPassword("");
      setNotes("");
      setReference("");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[AssignSubscriptionModal] Error:", err);
      toast.error(err.message || "Failed to assign subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedTherapistId) return;
    if (!password) {
      toast.error("Please enter admin password to revoke.");
      return;
    }

    setIsRevoking(true);
    try {
      const res = await API.admin.revokeTherapistSubscription(selectedTherapistId, {
        password,
        reason: revokeReason || "Offline payment cancellation by administrator",
      });
      toast.success(res.message || "Subscription revoked successfully.");
      setShowRevokeConfirm(false);
      setPassword("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke subscription.");
    } finally {
      setIsRevoking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl my-8 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Assign Offline Subscription
              </h3>
              <p className="text-xs text-slate-400">
                Grant counsellor plan access when paid directly to admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Counsellor Card / Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Counsellor
            </label>
            {therapist ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-slate-700 font-bold text-white">
                    {therapist.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Dr. {therapist.name}
                    </p>
                    {therapist.email && (
                      <p className="text-xs text-slate-400">{therapist.email}</p>
                    )}
                  </div>
                </div>

                {/* Current Subscription Status Badge */}
                <div>
                  {isCurrentlyActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-950/70 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active: {currentSub.plan}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/60 bg-amber-950/70 px-3 py-1 text-xs font-semibold text-amber-300">
                      <AlertTriangle className="size-3" />
                      No Active Plan
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <select
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {allTherapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.email ? `(${t.email})` : ""} {t.subscription?.status === "active" ? "• [Active Sub]" : "• [No Sub]"}
                  </option>
                ))}
              </select>
            )}

            {/* Active Subscription Details & Option to Extend/Revoke */}
            {isCurrentlyActive && (
              <div className="mt-3 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-200">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Current Expiry:{" "}
                    {currentSub.endDate
                      ? new Date(currentSub.endDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "No expiry"}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Mode: {currentSub.paymentMethod || "online"}
                  </span>
                </div>

                <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={extendExisting}
                      onChange={(e) => setExtendExisting(e.target.checked)}
                      className="size-4 rounded text-violet-600 focus:ring-violet-500 border-slate-700 bg-slate-800"
                    />
                    <span>Extend from current expiry date</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowRevokeConfirm(!showRevokeConfirm)}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    {showRevokeConfirm ? "Cancel Revoke" : "Revoke Current Plan"}
                  </button>
                </div>

                {/* Revoke Section */}
                {showRevokeConfirm && (
                  <div className="mt-2.5 pt-2.5 border-t border-rose-900/50 space-y-2 bg-rose-950/30 p-2.5 rounded-xl border">
                    <p className="text-[11px] text-rose-300 font-medium">
                      Revoking immediately resets this counsellor to the Free Tier and disables practitioner access until another subscription is assigned.
                    </p>
                    <input
                      type="text"
                      placeholder="Reason for revoking (e.g. Offline payment bounced)"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      className="w-full rounded-lg border border-rose-900/60 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="password"
                        placeholder="Admin password to confirm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isRevoking || !password}
                        onClick={handleRevoke}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                      >
                        {isRevoking ? "Revoking..." : "Confirm Revoke"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Subscription Plan
              </label>
              <select
                value={isCustomPlan ? "custom" : selectedPlanId}
                onChange={(e) => handlePlanSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {therapistPlans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{p.price} / {p.durationMonths || 1} mo)
                  </option>
                ))}
                <option value="custom">+ Custom Plan Name</option>
              </select>
            </div>

            {isCustomPlan ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Custom Plan Name
                </label>
                <input
                  type="text"
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="e.g. Counsellor Pro (6 Months)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) =>
                    setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="e.g. 999"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
                />
              </div>
            )}
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Duration (Months)
              </label>
              <span className="text-xs text-violet-400 font-semibold">
                {durationMonths} Month{durationMonths > 1 ? "s" : ""} Validity
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.months}
                  type="button"
                  onClick={() => setDurationMonths(preset.months)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${
                    durationMonths === preset.months
                      ? "bg-violet-600 text-white border-violet-500 shadow-sm"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Months Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={durationMonths}
                onChange={(e) =>
                  setDurationMonths(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-28 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
              />
              <span className="text-xs text-slate-400">
                months from {baseDate === now ? "today" : "current expiry"}
              </span>
            </div>

            {/* Realtime Start/End Date Computation Display */}
            <div className="mt-2.5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="size-3.5 text-violet-400" />
                Starts:{" "}
                <strong className="text-white">
                  {baseDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
              <ArrowRight className="size-3 text-slate-600" />
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Clock className="size-3.5 text-emerald-400" />
                Valid Until:{" "}
                <strong className="text-emerald-200">
                  {computedEndDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Offline Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Ref / UTR / Receipt #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UPI-428190284 or Cash Receipt"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Internal Admin Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received ₹999 via GPay to admin official account on 31 Oct"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Admin Action Password */}
          <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="size-3.5 text-amber-400" />
              Admin Authorization Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Action Password"
              className="w-full rounded-xl border border-amber-900/60 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Required to authorize offline subscription activation on counsellor accounts.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-4 py-2.5 text-sm font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Assign &amp; Activate Plan
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
