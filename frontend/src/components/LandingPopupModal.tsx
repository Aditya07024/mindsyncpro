import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Calendar, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNormalizedPosterUrl } from "@/lib/utils";

export function LandingPopupModal({ announcement, onClose }: LandingPopupModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!announcement || !announcement.isActive) return null;

  const handleNavigateToConference = () => {
    const targetUrl = announcement.conferenceUrl || "/conferences";
    onClose();
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate({ to: targetUrl as any });
    }
  };

  const posterSrc = getNormalizedPosterUrl(announcement.posterUrl);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Darkened blur backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-teal-500/20 z-10 flex flex-col my-auto max-h-[90vh]"
        >
          {/* Close Cross Button */}
          <button
            onClick={onClose}
            aria-label="Close popup"
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white/90 hover:text-white transition-all shadow-xl backdrop-blur-md group border border-white/20 cursor-pointer"
          >
            <X className="size-6 transition-transform group-hover:rotate-90 duration-200" />
          </button>

          {/* Poster Image Section - Clean Full Display */}
          {posterSrc ? (
            <div className="relative w-full overflow-hidden group shrink-0">
              <img
                src={posterSrc}
                alt={announcement.title}
                className="w-full h-auto max-h-[60vh] object-cover object-center transition-transform duration-500 group-hover:scale-[1.02] block"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="relative w-full h-44 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-800 p-6 flex flex-col justify-end shrink-0">
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white shadow-md backdrop-blur-md border border-white/30">
                  <Sparkles className="size-4" />
                  {announcement.badgeText || "Live Workshop"}
                </span>
              </div>
            </div>
          )}

          {/* Content Details Section */}
          <div className="p-6 sm:p-8 space-y-4 text-left overflow-y-auto">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                {announcement.title}
              </h2>

              {announcement.dateText && (
                <div className="mt-2.5 flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400">
                  <Calendar className="size-4 shrink-0" />
                  <span>{announcement.dateText}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
              {announcement.description}
            </p>

            {/* Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={handleNavigateToConference}
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Video className="size-4" />
                <span>{announcement.buttonText || "Go to Conference Page"}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto h-12 px-5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl cursor-pointer"
              >
                Dismiss
              </Button> */}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
