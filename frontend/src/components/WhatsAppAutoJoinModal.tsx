import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Sparkles,
  ShieldCheck,
  Users,
  ArrowRight,
  Pause,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const DEFAULT_WHATSAPP_GROUP_URL =
  import.meta.env.VITE_WHATSAPP_GROUP_URL ||
  "https://chat.whatsapp.com/CbMYSt00R0KDEdiEsp9IeL";

interface WhatsAppAutoJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappUrl?: string;
  autoStartSeconds?: number;
  userName?: string;
}

export function WhatsAppAutoJoinModal({
  isOpen,
  onClose,
  whatsappUrl = DEFAULT_WHATSAPP_GROUP_URL,
  autoStartSeconds = 5,
  userName,
}: WhatsAppAutoJoinModalProps) {
  const [timeLeft, setTimeLeft] = useState(autoStartSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset countdown whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(autoStartSeconds);
      setIsPaused(false);
      setHasRedirected(false);
    }
  }, [isOpen, autoStartSeconds]);

  // Handle countdown interval
  useEffect(() => {
    if (!isOpen || isPaused || hasRedirected) return;

    if (timeLeft <= 0) {
      triggerJoin();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, isPaused, timeLeft, hasRedirected]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const triggerJoin = () => {
    if (hasRedirected) return;
    setHasRedirected(true);

    try {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Failed to auto open WhatsApp link:", e);
    }

    // Dismiss modal shortly after triggering redirect
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPaused(true);
    onClose();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  if (!isOpen) return null;

  const progressPercent = ((autoStartSeconds - timeLeft) / autoStartSeconds) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Main Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-emerald-950/90 to-slate-950 text-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/30 z-10 flex flex-col my-auto"
        >
          {/* Top Decorative Header */}
          <div className="relative p-6 sm:p-7 pb-4 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleCancel}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer backdrop-blur-md"
            >
              <X className="size-5" />
            </button>

            {/* WhatsApp Logo Avatar with Pulse Ring */}
            <div className="relative size-20 mx-auto mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping opacity-75" />
              <div className="relative size-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-4 shadow-xl border border-emerald-300/40 flex items-center justify-center text-white transform hover:scale-105 transition">
                <MessageSquare className="size-10 fill-white/20" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles className="size-3.5" />
              <span>Registration Successful!</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {userName ? `Welcome, ${userName}!` : "Welcome to the Community!"}
            </h2>

            <p className="text-emerald-100/80 text-xs sm:text-sm mt-2 max-w-sm mx-auto">
              Auto-redirecting you to join our official WhatsApp Community Group for peer support & daily wellness.
            </p>
          </div>

          {/* Countdown & Progress Section */}
          <div className="px-6 sm:px-8 py-3 space-y-3 text-center">
            {hasRedirected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="size-5 text-emerald-400" />
                <span>Redirecting to WhatsApp Group...</span>
              </motion.div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    Auto Action in Progress
                  </span>
                  <button
                    onClick={togglePause}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-white transition underline cursor-pointer"
                  >
                    {isPaused ? (
                      <>
                        <Play className="size-3" /> Resume Timer
                      </>
                    ) : (
                      <>
                        <Pause className="size-3" /> Pause Timer
                      </>
                    )}
                  </button>
                </div>

                {/* Big Number Timer Display */}
                <div className="flex items-baseline justify-center gap-1.5 py-1">
                  <span className="font-display text-5xl font-black text-white tracking-tight">
                    {timeLeft}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    seconds
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="relative h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-xs text-slate-200">
                <Users className="size-4 text-teal-400 shrink-0" />
                <span>24/7 Peer Support</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-xs text-slate-200">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <span>Confidential Safe Space</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 sm:p-7 pt-3 space-y-2.5">
            <Button
              onClick={triggerJoin}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <MessageSquare className="size-4 fill-white/20" />
              <span>Join WhatsApp Group Now</span>
              <ArrowRight className="size-4" />
            </Button>

            <button
              onClick={handleCancel}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition text-center cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
