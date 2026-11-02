import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FirebaseAuthCard } from "@/components/auth/FirebaseAuthCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  Heart,
  Lock,
  PhoneCall,
  ArrowLeft,
  Quote,
  Shield,
  Wind,
  CheckCircle2,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";
import API from "@/lib/api";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

const PORTAL_NAMES: Record<string, string> = {
  user: "I am a user/Client",
  therapist: "I am a Counsellor",
  org_admin: "Organisation Admin",
  super_admin: "Super Admin",
};

const TESTIMONIALS = [
  {
    quote: "Talking to Manas AI helped me clear my mind when anxiety struck at 2 AM. It felt like talking to a truly caring friend.",
    author: "Ananya R.",
    role: "Verified User",
  },
  {
    quote: "The platform connects me with verified counsellors seamlessly while keeping everything private and confidential.",
    author: "Rahul M.",
    role: "Patient",
  },
  {
    quote: "A safe space to speak your mind freely without any judgment. Apna Dil Kholo.",
    author: "Priya S.",
    role: "Community Member",
  },
];

function SignInPage() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [portalRole, setPortalRole] = useState<string | null>(null);
  const [activeQuote, setActiveQuote] = useState(0);

  useEffect(() => {
    API.health()
      .then(() => setIsHealthy(true))
      .catch(() => setIsHealthy(false));

    const role = localStorage.getItem("mymindtherapyfriend_intent_role");
    setPortalRole(role);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuote((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (isHealthy === null) {
    return (
      <div className="h-screen w-screen bg-[#F4F2EC] flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-teal-600/20 border border-teal-600/30 animate-pulse absolute inset-0" />
            <div className="size-16 rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200 flex items-center justify-center relative z-10 aspect-square">
              <img src={logoUrl} alt="Logo" className="size-full object-contain" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium text-xs animate-pulse pt-1">
            Connecting to safe space...
          </p>
        </div>
      </div>
    );
  }

  if (isHealthy === false) {
    return (
      <div className="h-screen w-screen bg-[#F4F2EC] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="p-6 max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl space-y-3">
          <div className="size-16 rounded-2xl bg-white p-2.5 shadow-md border border-slate-200 flex items-center justify-center mx-auto aspect-square">
            <img
              src={logoUrl}
              alt="MyMindTherapyFriend Logo"
              className="size-full object-contain opacity-60 grayscale"
            />
          </div>
          <h1 className="font-display text-xl font-bold text-teal-900">
            Service Unavailable
          </h1>
          <p className="text-muted-foreground text-xs">
            MyMindTherapyFriend is currently undergoing maintenance. Please try again in a few minutes.
          </p>
          <div className="pt-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#F4F2EC] text-foreground p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 xl:gap-5 relative overflow-hidden selection:bg-teal-500/20">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] size-[450px] bg-teal-300/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[450px] bg-amber-300/20 rounded-full blur-[130px] pointer-events-none" />

      {/* LEFT BOX - Floating Rounded Card with Curved Radius */}
      <div className="hidden lg:flex lg:w-1/2 h-full rounded-[2.25rem] p-7 xl:p-9 flex-col justify-between relative z-10 border border-white/20 bg-gradient-to-br from-[#0F3836] via-[#145350] to-[#0A2625] text-white shadow-2xl overflow-hidden">
        {/* Vibrant Ambient Glow Layers */}
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 size-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 size-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="space-y-5 relative z-10">
          {/* Header Bar with Square Logo Box */}
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="size-11 rounded-2xl bg-white p-2 backdrop-blur-xl border border-white/30 shadow-lg group-hover:scale-105 transition duration-300 flex items-center justify-center shrink-0 aspect-square">
                <img src={logoUrl} alt="Logo" className="size-full object-contain rounded-xl" />
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight block text-white leading-tight">
                  MyMindTherapyFriend
                </span>
                <span className="text-teal-200 text-[10px] font-semibold tracking-wider uppercase">
                  Apna Dil Kholo
                </span>
              </div>
            </Link>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-teal-100 font-medium flex items-center gap-1.5 shadow-sm">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Encrypted
            </div>
          </div>

          {/* Main Hero Pitch */}
          <div className="pt-2 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="size-3 text-amber-300" /> Safe Mental Healthcare Space
            </div>
            <h1 className="font-display text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.18] text-white">
              Open your heart.<br />We are here to listen without judgment.
            </h1>
            <p className="text-teal-100/90 text-xs xl:text-sm max-w-lg leading-relaxed font-normal">
              Empathetic 24/7 AI companion support, CBT tools, mood tracking, and confidential therapy sessions with verified professionals.
            </p>
          </div>

          {/* Mindful Breath Break Micro-Card */}
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg hover:border-white/25 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-400/25 text-amber-300 flex items-center justify-center shrink-0 aspect-square">
                  <Wind className="size-4 animate-breathe" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Mindful Breath Break</h4>
                  <p className="text-teal-100/80 text-[11px]">Take a slow breath before signing in</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-teal-100 border border-white/10">
                Inhale • Exhale
              </span>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
              <ShieldCheck className="size-4 text-emerald-300 mb-1" />
              <h3 className="font-bold text-white text-[11px]">Privacy First</h3>
              <p className="text-teal-200/70 text-[10px] mt-0.5 leading-tight">Zero judgment guarantee.</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
              <Sparkles className="size-4 text-amber-300 mb-1" />
              <h3 className="font-bold text-white text-[11px]">Manas AI 24/7</h3>
              <p className="text-teal-200/70 text-[10px] mt-0.5 leading-tight">Instant CBT guidance.</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
              <Heart className="size-4 text-rose-300 mb-1" />
              <h3 className="font-bold text-white text-[11px]">Verified Experts</h3>
              <p className="text-teal-200/70 text-[10px] mt-0.5 leading-tight">Licensed psychologists.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Quote Box & Footer */}
        <div className="pt-4 border-t border-white/10 relative z-10 space-y-3">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 relative">
            <Quote className="absolute right-2 bottom-1 size-10 text-white/10 pointer-events-none" />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuote}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <p className="text-[11px] italic text-teal-50 font-light leading-snug">
                  "{TESTIMONIALS[activeQuote].quote}"
                </p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-amber-300">
                    — {TESTIMONIALS[activeQuote].author}
                  </span>
                  <span className="text-teal-200/70 font-medium">
                    {TESTIMONIALS[activeQuote].role}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-[11px] text-teal-200/70">
            <span>© {new Date().getFullYear()} MyMindTherapyFriend</span>
            <span>Apna Dil Kholo ❤️</span>
          </div>
        </div>
      </div>

      {/* RIGHT BOX - Floating Rounded Auth Card Box (Scrollable) */}
      <div className="flex-1 h-full rounded-[2.25rem] p-5 sm:p-6 lg:p-7 flex flex-col justify-between relative z-10 bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl overflow-y-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto shrink-0">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 transition">
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
        </div>

        {/* Auth Card Container */}
        <div className="w-full max-w-md mx-auto space-y-5 my-auto shrink-0">
          {/* Logo & Heading Header with Rounded Square Box Logo */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <div className="absolute -inset-2 bg-gradient-to-r from-teal-500/20 to-amber-400/20 rounded-3xl blur-md pointer-events-none" />
              <div className="size-16 rounded-2xl bg-white border border-slate-200/90 p-2.5 flex items-center justify-center relative shadow-lg aspect-square">
                <img src={logoUrl} alt="MyMindTherapyFriend Logo" className="size-full object-contain rounded-xl" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                MyMindTherapyFriend
              </h1>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 text-[11px] font-bold border border-teal-200/80 shadow-2xs">
                  <Heart className="size-3 text-rose-500 fill-rose-500" /> Apna Dil Kholo
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Safe Space</span>
              </div>
            </div>
          </div>

          {/* Original Portal Role Heading (If set from landing page) */}
          {portalRole && PORTAL_NAMES[portalRole] && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50/90 text-teal-900 text-xs font-bold border border-teal-200 shadow-xs">
                <CheckCircle2 className="size-3.5 text-teal-600" />
                {PORTAL_NAMES[portalRole]}
              </span>
            </div>
          )}

          {/* Styled Firebase Google Sign-In Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-emerald-400/15 to-amber-400/20 rounded-[2rem] blur-xl opacity-70 pointer-events-none" />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[1.75rem] border border-slate-200/90 shadow-xl overflow-hidden">
              <FirebaseAuthCard
                mode="signIn"
                redirectUrl={
                  new URLSearchParams(
                    typeof window !== "undefined" ? window.location.search : ""
                  ).get("redirect") || "/dashboard"
                }
              />
            </div>
          </div>

          {/* Emergency Crisis Helpline Banner - Elevated Compassionate Design */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/40 border border-rose-200/80 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative size-9 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 aspect-square shadow-2xs">
                <PhoneCall className="size-4.5 animate-bounce" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="min-w-0">
                <span className="font-display font-bold text-slate-900 block text-xs truncate">
                  Need Immediate Support?
                </span>
                <span className="text-rose-700 text-[11px] font-medium block truncate">
                  National Helpline: <strong>Tele-MANAS 14416</strong> (24/7 Free)
                </span>
              </div>
            </div>
            <a
              href="tel:14416"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <PhoneCall className="size-3" />
              <span>Call 14416</span>
            </a>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="w-full max-w-md mx-auto text-center pt-2 shrink-0 border-t border-slate-200/50">
          <div className="flex items-center justify-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Lock className="size-3 text-emerald-600" /> 256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="size-3 text-teal-600" /> Confidential & Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}





