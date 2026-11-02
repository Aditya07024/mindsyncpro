import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Loader2, ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";
import API from "@/lib/api";

interface FirebaseAuthCardProps {
  mode: "signIn" | "signUp";
  redirectUrl?: string;
  onSuccess?: () => void;
}

export function FirebaseAuthCard({
  mode,
  redirectUrl,
  onSuccess,
}: FirebaseAuthCardProps) {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handlePostAuth = async () => {
    try {
      const intentRole = localStorage.getItem("mymindtherapyfriend_intent_role");
      if (intentRole) {
        await API.auth.setRole(intentRole).catch(() => {});
      }
    } catch {
      // ignore
    }

    if (onSuccess) {
      onSuccess();
      return;
    }

    const target =
      redirectUrl ||
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      ).get("redirect") ||
      (mode === "signUp" ? "/onboarding" : "/dashboard");

    navigate({ to: target as any });
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success(
        mode === "signIn"
          ? "Welcome back to your safe space!"
          : "Account created successfully with Google!"
      );
      await handlePostAuth();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Failed to sign in with Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-5">
      {/* Google Sign In CTA Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full relative group overflow-hidden h-14 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-teal-500/70 shadow-lg hover:shadow-xl hover:shadow-teal-900/10 transition-all duration-300 flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-75 active:scale-[0.98]"
      >
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent pointer-events-none" />

        {googleLoading ? (
          <Loader2 className="size-5 animate-spin text-teal-700" />
        ) : (
          <div className="size-6 p-0.5 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-110 transition duration-200">
            <svg className="size-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
        )}

        <span className="font-display font-bold text-slate-800 group-hover:text-teal-950 text-sm sm:text-base tracking-tight">
          {googleLoading
            ? "Signing in with Google..."
            : mode === "signIn"
            ? "Continue with Google"
            : "Sign up with Google"}
        </span>
      </button>

      {/* Trust micro-features */}
      <div className="pt-1 space-y-2.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-[10px] text-slate-600 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
            <Zap className="size-3 text-amber-500 shrink-0" />
            <span>Instant Access</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-[10px] text-slate-600 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
            <ShieldCheck className="size-3 text-teal-600 shrink-0" />
            <span>100% Private</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-[10px] text-slate-600 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
            <Lock className="size-3 text-emerald-600 shrink-0" />
            <span>Zero Password</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 leading-relaxed font-normal">
          One-click secure login with your Google Account. Your mental wellness data is strictly confidential.
        </p>
      </div>
    </div>
  );
}
