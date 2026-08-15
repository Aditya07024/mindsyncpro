import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { FREE_DAILY_LIMIT } from "@/lib/store";

interface MessageCounterProps {
  onCrisisMode?: (active: boolean) => void;
}

export function MessageCounter({ onCrisisMode }: MessageCounterProps) {
  const navigate = useNavigate();
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => API.subscription.get(),
  });

  const dailyLimit = subscription?.usage?.dailyLimit ?? 7;
  const isUnlimited = subscription?.usage?.dailyLimit === null;
  const messagesUsed = subscription?.usage?.messagesUsedToday || 0;
  const messagesRemaining = isUnlimited ? null : dailyLimit - messagesUsed;
  const percentageUsed = isUnlimited ? 0 : (messagesUsed / dailyLimit) * 100;
  const isAtLimit = !isUnlimited && messagesRemaining === 0;
  const isFree = !subscription?.tier || subscription?.tier === "free";

  if (isUnlimited) {
    return null; // Hide counter for unlimited plans
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
    >
      {isAtLimit ? (
        // At limit message
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Daily limit reached</p>
              <p className="text-sm text-slate-600 mt-1">
                You've used all {dailyLimit} messages for today. Upgrade to send more.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: "/subscription" })}
              size="sm"
              className="gap-2 rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade Now
            </Button>
            <Button
              onClick={() => onCrisisMode?.(true)}
              size="sm"
              variant="outline"
              className="gap-2 rounded-lg border-red-300 text-red-700 hover:bg-red-50"
            >
              <AlertCircle className="w-4 h-4" />
              Crisis Help
            </Button>
          </div>
        </motion.div>
      ) : (
        // Normal counter
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {messagesRemaining} of {dailyLimit} messages remaining
              </span>
              {messagesRemaining !== null && messagesRemaining <= 1 && messagesRemaining > 0 && (
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                  Running low
                </span>
              )}
            </div>
            {isFree && (
              <button
                onClick={() => navigate({ to: "/subscription" })}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Upgrade
              </button>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              layoutId="progress"
              initial={{ width: 0 }}
              animate={{
                width: `${percentageUsed}%`,
                backgroundColor:
                  percentageUsed < 70 ? "#3b82f6" : percentageUsed < 90 ? "#f59e0b" : "#ef4444",
              }}
              transition={{ duration: 0.5 }}
              className="h-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Crisis Mode Overlay Component
interface CrisisModeProps {
  active: boolean;
  onClose: () => void;
}

export function CrisisMode({ active, onClose }: CrisisModeProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Blur background content */}
            <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-md" />

            {/* Content */}
            <div className="relative space-y-6 p-8 text-center">
              {/* Pulsing alert icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto"
              >
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
              </motion.div>

              {/* Heading */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">We're Here for You</h2>
                <p className="text-slate-600">
                  If you're in crisis, please reach out to someone immediately
                </p>
              </div>

              {/* Helpline Numbers */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <Phone className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-slate-600">MANAS</p>
                    <p className="text-lg font-bold text-orange-600">14416 / 1800891446</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <Phone className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-slate-600">KIRAN Rehabilitation Helpline</p>
                    <p className="text-lg font-bold text-red-600">18005990019</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-slate-600">NIMHANS</p>
                    <p className="text-lg font-bold text-blue-600">08046110007</p>
                  </div>
                </div>
              </div>

              {/* Emergency Text */}
              <div className="absolute left-4 top-4">
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
              <div className="text-xs text-slate-500 italic">
                If you're in immediate danger, please call 112 (emergency)
              </div>

              {/* Close Button */}
              <Button onClick={onClose} variant="outline" className="w-full rounded-lg">
                I'm Safe, Close This
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MessageCounter;
