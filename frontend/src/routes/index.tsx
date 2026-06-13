import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Heart,
  Wind,
  ShieldCheck,
  Users,
  Building2,
  Shield,
  ChevronRight,
  Play,
  Brain,
  Activity,
  Star,
  Globe2,
  ArrowRight,
  Instagram,
  Twitter,
  Linkedin,
  Check,
  Phone,
  Mail,
} from "lucide-react";
import { useState, useEffect } from "react";
import API from "@/lib/api";
import logoUrl from "@/assets/logo.png";
import user from "@/assets/user.jpg";
import therapist from "@/assets/therapist.avif";
import org from "@/assets/org.avif";
import app from "@/assets/app.png";
import play from "@/assets/play.webp";


const API_BASE = import.meta.env.VITE_API_URL || "https://api.mymindtherapyfriend.online";
const ENTERPRISE_EMAIL = import.meta.env.VITE_ENTERPRISE_EMAIL || "mymindtherapyfriend@outlook.com";

const PRICING_PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Perfect for starting your mental wellness journey.",
    features: ["300 Daily AI Messages", "Basic Mood Tracking", "Community Access", "Public Therapist Listing"],
    buttonText: "Get Started",
    portalId: "user",
    color: "bg-white",
  },
  {
    name: "Mann Shanti",
    price: "₹499",
    period: "/mo",
    description: "Deepen your healing with extended AI support.",
    features: ["Unlimited AI Messages", "Advanced Mood Analytics", "Priority Therapist Booking", "Unlimited Digital Journal"],
    buttonText: "Upgrade Now",
    portalId: "user",
    color: "bg-teal-50 border-teal-200",
    popular: true,
  },
  {
    name: "Therapist Pro",
    price: "₹999",
    period: "/6 mo",
    description: "Manage your practice with AI-powered insights.",
    features: ["Live Video Sessions", "AI Pre-Session Briefs", "Earnings Dashboard", "RCI Verified Badge"],
    buttonText: "Join as Therapist",
    portalId: "therapist",
    color: "bg-white",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Scale wellness across your entire organisation.",
    features: ["Anonymous Team Analytics", "Custom Seat Management", "Crisis Alert System", "Dedicated Support"],
    buttonText: "Contact Sales",
    portalId: "org_admin",
    color: "bg-slate-900 text-white",
    isEnterprise: true,
  },
];

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "mymindtherapyfriend AI Mental Health Platform India" },
      { name: "description", content: "India's AI-powered mental health platform offering Manas AI companion, CBT tools, mood tracking, and RCI-verified therapists. Private, affordable, and free to start." },
    ],
  }),
});

const PORTALS = [
  {
    id: "user",
    icon: MessageCircle,
    title: "Sign in for User/Patient",
    subtitle: "For people who want to chat with Manas AI, use mental health tools, track mood, or talk to real therapists.",
    color: "from-teal-500/10 to-teal-600/5 border-teal-200 hover:border-teal-400",
    iconBg: "bg-teal-100 text-teal-700",
    dest: "/sign-in",
  },
  {
    id: "therapist",
    icon: Users,
    title: "Sign in for Therapists",
    subtitle: "For professional therapists to manage bookings, read AI summary notes, and do video calls with clients.",
    color: "from-blue-500/10 to-blue-600/5 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100 text-blue-700",
    dest: "/sign-in",
  },
  {
    id: "org_admin",
    icon: Building2,
    title: "Organisation Admin",
    subtitle: "Anonymous employee mental wellness analytics, manage team seats, access wellness reports",
    color: "from-violet-500/10 to-violet-600/5 border-violet-200 hover:border-violet-400",
    iconBg: "bg-violet-100 text-violet-700",
    dest: "/sign-in",
  },
  {
    id: "super_admin",
    icon: Shield,
    title: "Super Admin",
    subtitle: "Platform operations, therapist verification, and mental health analytics dashboard",
    color: "from-slate-500/10 to-slate-600/5 border-slate-200 hover:border-slate-400",
    iconBg: "bg-slate-100 text-slate-700",
    dest: "/sign-in",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Is mymindtherapyfriend free to use?",
    a: "Yes. mymindtherapyfriend is a free mental health app for students and everyone else, offering a free plan with 300 daily AI messages, basic mood tracking, and access to our therapist listing. Paid plans start at ₹499/month for unlimited AI support and priority therapist booking."
  },
  {
    q: "How does Manas AI work?",
    a: "Manas is mymindtherapyfriend's AI mental health companion, trained in Cognitive Behavioural Therapy (CBT). It has emotion-aware conversations, suggests CBT exercises, tracks your mood patterns, and prepares an AI brief for your therapist before each session."
  },
  {
    q: "Are the therapists on mymindtherapyfriend verified?",
    a: "Yes. Every therapist on our platform is verified against RCI (Rehabilitation Council of India) records before they are listed. You can see their credentials, specialisation, and reviews before booking."
  },
  {
    q: "Is my data private and safe?",
    a: "Absolutely. Your phone number is hashed - we cannot read it. All data is stored in India on secure servers and we are fully compliant with the Digital Personal Data Protection Act (DPDPA) 2023. We never sell your data."
  },
  {
    q: "Can my college or company use mymindtherapyfriend?",
    a: "Yes. mymindtherapyfriend offers organisation wellness plans for colleges and corporates. Admins get anonymous, aggregate mental wellness dashboards - no individual data is ever visible. Contact us at mymindtherapyfriend@outlook.com."
  },
  {
    q: "What mental health tools does mymindtherapyfriend offer?",
    a: "mymindtherapyfriend includes 18+ CBT tools for anxiety India including thought records, mood calendar, 4-7-8 breathing, box breathing, 5-4-3-2-1 grounding, body scan, journaling, and a crisis support overlay with icall helpline access."
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-display text-lg font-bold text-slate-900 focus:outline-none cursor-pointer group"
      >
        <span className="group-hover:text-teal-600 transition-colors duration-200">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-4 text-teal-600 flex-shrink-0"
        >
          <ChevronRight className="size-5 rotate-90" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-slate-600 leading-relaxed pr-6 text-sm sm:text-base font-normal">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  // Auto-redirect signed-in users to their role's portal
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    API.auth
      .me()
      .then((me: any) => {
        const role = me?.role ?? "user";
        if (role === "therapist") navigate({ to: "/therapist/dashboard" });
        else if (role === "org_admin") navigate({ to: "/org/dashboard" });
        else if (role === "super_admin") navigate({ to: "/admin/dashboard" });
        else navigate({ to: "/dashboard" });
      })
      .catch(() => navigate({ to: "/dashboard" }));
  }, [isSignedIn, isLoaded, navigate]);

  const handlePortalClick = (e: React.MouseEvent, portalId: string, dest: string) => {
    e.preventDefault();
    if (portalId === "super_admin") {
      setAdminModalOpen(true);
    } else {
      localStorage.setItem("mymindtherapyfriend_intent_role", portalId);
      navigate({ to: dest });
    }
  };

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem("mymindtherapyfriend_intent_role", "user");
    navigate({ to: "/sign-in" });
  };

  const verifyAdminPassword = async () => {
    setIsVerifying(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/verify-password-public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!r.ok) throw new Error("Invalid password");

      localStorage.setItem("mymindtherapyfriend_intent_role", "super_admin");
      navigate({ to: "/sign-in" });
    } catch (err: any) {
      setError(err.message);
      setAdminPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fff9e6] relative text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,102,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,235,153,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,193,7,0.10),transparent_35%)]" />
      {/* Header */}
      <header className="sticky top-4 z-50 mx-auto mt-4 flex w-[95%] max-w-7xl items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-6 py-4 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-white shadow-lg shadow-slate-200 overflow-hidden">
            <img src={logoUrl} alt="mymindtherapyfriend AI mental health India" className="size-full object-cover scale-125" />
          </div>

          <div>
            <p className="font-display text-lg font-bold text-[#012620]">MyMindTherapyFriend</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/about"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:block"
          >
            About
          </Link>
          <a
            href="#pricing"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:block"
          >
            Pricing
          </a>

          <button
            onClick={handleGetStarted}
            className="rounded-full bg-[#004038] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-5 pt-2 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative grid min-h-[82vh] items-center lg:grid-cols-[55%_50%]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm"
            >
              <Sparkles className="size-4" />
              India’s AI Wellness Companion
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="mt-7 font-display text-5xl font-bold leading-[1.02] tracking-tight text-[#012620] sm:text-6xl lg:text-7xl"
            >
              <span className="block text-xl sm:text-2xl lg:text-3xl font-medium text-[#333942] mb-4">
                The future-ready wellness platform
              </span>
              India's AI-Powered
              <br />
              Mental Wellness
              <span className="bg-gradient-to-r from-[#004038] to-[#00a693] bg-clip-text text-transparent">
                {" "}Experience
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-[#333942]"
            >
              mymindtherapyfriend is India's AI-powered mental health platform - combining Manas AI companion, CBT self-help tools, mood tracking, and RCI-verified online therapist booking into one private, affordable wellness experience. Starting free.
            </motion.p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <a
                href="#pricing"
                className="text-[#004038] font-semibold hover:translate-x-1 transition"
              >
                Request a demo →
              </a>

              <button
                onClick={handleGetStarted}
                className="rounded-2xl bg-[#004038] px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] cursor-pointer"
              >
                Start a free trial →
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-teal-500" />
                Secure & Private
              </div>

              <div className="flex items-center gap-2">
                <Heart className="size-4 text-rose-500" />
                Emotion-Aware AI
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Therapist Integrated
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              scale: { duration: 0.8 },
              opacity: { duration: 0.8 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative flex items-center justify-center"
          >
            <div className="relative h-[560px] w-full max-w-xl">
              <div className="absolute top-10 left-8 rounded-3xl bg-[#87c8ff] p-3 shadow-xl">
                <div className="h-36 w-36 rounded-2xl bg-white/40 backdrop-blur flex items-center justify-center text-5xl">
                  <img
                  src={user}
                  alt="mymindtherapyfriend"
                  className="h-full w-full object-cover border-4 border-red rounded-2xl"
                />
                </div>
                <div className="absolute -right-10 top-6 rounded-full bg-[#fde8ce] px-4 py-2 text-xs font-semibold">
                  User
                </div>
              </div>

              <div className="absolute top-36 right-4 rounded-3xl bg-[#e8c1b0] p-3 shadow-xl">
                <div className="h-32 w-32 rounded-2xl bg-white/40 flex items-center justify-center text-5xl">
                  <img
                  src={therapist}
                  alt="mymindtherapyfriend"
                  className="h-full w-full object-cover border-4 border-white rounded-2xl shadow-lg"
                />
                </div>
                <div className="absolute -left-16 top-8 rounded-full bg-[#fde8ce] px-4 py-2 text-xs font-semibold">
                  therapist
                </div>
              </div>

              <div className="absolute bottom-10 right-8 rounded-3xl bg-[#ff9a52] p-3 shadow-xl">
               <div className="h-32 w-32 rounded-2xl bg-white/40 flex items-center justify-center text-5xl">
                  <img
                  src={org}
                  alt="mymindtherapyfriend"
                  className="h-full w-full object-cover border-4 border-red rounded-2xl shadow-lg"
                />
                </div>
                <div className="absolute -left-20 top-8 rounded-full bg-[#fde8ce] px-4 py-2 text-xs font-semibold">
                  Organisation
                </div>
              </div>

              <div className="absolute left-12 bottom-16 w-64 rounded-[28px] border border-white/30 bg-white/40 p-5 backdrop-blur-xl shadow-2xl">
                <p className="text-xs text-slate-500">Manas AI</p>
                <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm text-slate-700">
                  You're doing better than you think. Let's take one step at a time.
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[40px] bg-red shadow-2xl">
                <img
                  src={logoUrl}
                  alt="mymindtherapyfriend"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="absolute top-8 right-24 h-4 w-4 rounded-full bg-yellow-400" />
              <div className="absolute bottom-24 left-4 h-4 w-4 rounded-full bg-cyan-400" />
              <div className="absolute top-28 right-32 h-3 w-3 rounded-full bg-violet-400" />
            </div>
          </motion.div>
        </section>

        {/* Experience Section */}
        <section
          id="portals-section"
          className="relative mt-14 overflow-hidden rounded-[40px] border border-teal-100 bg-gradient-to-br from-[#fff5ee] via-[#fff9f4] to-[#fde8ce] px-6 py-20 text-[#012620] shadow-[0_20px_80px_rgba(20,184,166,0.08)] sm:px-10 lg:px-16"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.10),transparent_32%)]" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-medium text-teal-700 shadow-sm backdrop-blur-xl">
                <Sparkles className="size-4" />
                Designed For Every Mind
              </div>

              <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-[#012620] sm:text-5xl">
                One AI Mental Health Platform
                <br />
                for Every Role in India
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Whether you need emotional support, therapy tools, organisation wellness insights,
                or platform administration — mymindtherapyfriend adapts to your role beautifully.
              </p>
            </motion.div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              {PORTALS.map((p, i) => (
                <motion.a
                  key={p.id}
                  href={p.dest}
                  onClick={(e) => handlePortalClick(e, p.id, p.dest)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, scale: 1.015 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, scale: { duration: 0.2 }, y: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-[32px] border border-teal-100 bg-white/80 p-7 shadow-lg backdrop-blur-2xl transition-shadow duration-300 hover:border-teal-300 hover:bg-white hover:shadow-[0_25px_80px_rgba(20,184,166,0.12)]"
                >
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl transition-all duration-500 group-hover:scale-125" />

                  <div className="relative z-10 flex items-start justify-between gap-6">
                    <div>
                      <div
                        className={`flex size-16 items-center justify-center rounded-3xl shadow-xl ${p.iconBg}`}
                      >
                        <p.icon className="size-7" />
                      </div>

                  <h3 className="mt-6 font-display text-2xl font-bold text-[#012620]">
                    {p.title}
                  </h3>

                      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                        {p.subtitle}
                      </p>
                    </div>

                    <div className="rounded-full border border-teal-100 bg-teal-50 p-3 text-teal-700 transition group-hover:border-teal-300 group-hover:bg-teal-100">
                      <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Enter Portal
                    <div className="h-px flex-1 bg-gradient-to-r from-teal-400/40 to-transparent" />
                  </div>
                </motion.a>
              ))}
            </div>

            <div className="relative z-10 mt-14 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: MessageCircle,
                  title: "AI Conversations",
                  desc: "Emotion-aware conversations that feel deeply personal and calming.",
                },
                {
                  icon: Activity,
                  title: "Mental Insights",
                  desc: "Track mood patterns, emotional states, and wellness progress over time.",
                },
                {
                  icon: Wind,
                  title: "Calm Experiences",
                  desc: "Breathing exercises, grounding tools, and mindful recovery support.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onClick={(e) => handlePortalClick(e, 'user', '/sign-in')}
                  className="rounded-[28px] border border-teal-100 bg-white/70 p-7 shadow-sm backdrop-blur-xl cursor-pointer transition hover:border-teal-300 hover:shadow-lg"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <feature.icon className="size-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-[#012620]">{feature.title}</h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 mt-14 rounded-[32px] border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-8 shadow-sm backdrop-blur-xl">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                    Unified Access
                  </p>

              <h3 className="mt-3 font-display text-3xl font-bold text-[#012620]">
                    One Login. Smart Role Detection.
                  </h3>

                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    mymindtherapyfriend automatically detects your assigned role after sign-in and routes you to
                    the right dashboard experience instantly.
                  </p>
                </div>

                <a
                  href="#portals-section"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#004038] px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.03]"
                >
                  Continue To Sign In
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
              <Activity className="size-4" />
              Simple, Transparent Pricing
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold text-[#012620] sm:text-5xl">
              Free Mental Health Support
              <br />
              & Affordable Plans
            </h2>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-4">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, scale: { duration: 0.2 }, y: { duration: 0.2 } }}
                className={`relative flex flex-col rounded-[32px] border border-slate-200 p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl ${plan.color}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`text-xl font-bold ${plan.isEnterprise ? "text-teal-400" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium opacity-60">{plan.period}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed opacity-70">
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-10 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={`size-5 shrink-0 ${plan.isEnterprise ? "text-teal-400" : "text-teal-600"}`} />
                      <span className="opacity-80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.isEnterprise ? (
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-400">
                      <Mail className="size-3" /> {ENTERPRISE_EMAIL}
                    </div>
                    <button
                      onClick={(e) => handlePortalClick(e, plan.portalId, "/sign-in")}
                      className="w-full rounded-2xl bg-teal-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-teal-400"
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handlePortalClick(e, plan.portalId, "/sign-in")}
                    className={`mt-auto w-full rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition hover:scale-[1.02] ${
                      plan.popular 
                        ? "bg-[#004038] text-white hover:bg-[#00362c]" 
                        : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="mt-24 rounded-[40px] border border-slate-200 bg-white px-8 py-16 shadow-sm sm:px-12"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <Sparkles className="size-4" />
              About mymindtherapyfriend
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold text-[#012620] sm:text-5xl">
              About mymindtherapyfriend - India's AI Mental Health Platform
            </h2>

            <div className="mt-6 space-y-4 text-left text-base leading-relaxed text-slate-600 sm:text-lg">
              <p>mymindtherapyfriend is an AI-powered mental health and wellness platform built specifically for India. Our platform combines Manas - a culturally aware AI companion trained in Cognitive Behavioural Therapy (CBT) - with mood tracking, breathing exercises, grounding tools, and a marketplace of RCI-verified online therapists.</p>
              <p>Whether you are a student managing exam stress, a professional dealing with burnout, or an organisation looking to support employee mental health - mymindtherapyfriend offers affordable, private, and always-available mental health support starting at ₹0/month.</p>
              <p>We are DPDPA-compliant, store all data in India, and your conversations are always private.</p>
            </div>

            <div className="mt-10 grid gap-6 text-left md:grid-cols-3">
              <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-6">
                <Brain className="size-8 text-teal-600" />
                <h3 className="mt-4 text-lg font-semibold text-[#012620]">AI Emotional Support</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Smart conversations that adapt to emotions and provide calming guidance.
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-6">
                <Heart className="size-8 text-rose-500" />
                <h3 className="mt-4 text-lg font-semibold text-[#012620]">Human-Centered Care</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Connect with therapists and wellness experiences designed for real people.
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-6">
                <ShieldCheck className="size-8 text-violet-600" />
                <h3 className="mt-4 text-lg font-semibold text-[#012620]">Private & Secure</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Your emotional wellness data stays protected with secure and private systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm">
              <Star className="size-4" />
              Trusted Wellness Experience
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold text-[#012620] sm:text-5xl">
              Trusted for Employee Mental Wellness
              <br />
              & Student Support
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              mymindtherapyfriend is designed to feel emotionally warm, calming, and deeply human.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {[
              {
                name: "Engineering Student",
                quote: "mymindtherapyfriend helped me calm my anxiety during stressful exam weeks.",
              },
              {
                name: "Therapist Portal User",
                quote: "The therapist dashboard feels modern, clean, and emotionally aware.",
              },
              {
                name: "HR Wellness Lead",
                quote: "The organisation analytics gave us meaningful wellness insights privately.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-[30px] border border-teal-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400" />
                  ))}
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-600">“{t.quote}”</p>

                <div className="mt-6">
                  <p className="font-semibold text-[#012620]">{t.name}</p>
                  <p className="text-xs text-slate-500">mymindtherapyfriend User</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mt-24 rounded-[40px] border border-slate-200 bg-white px-8 py-16 shadow-sm sm:px-12">
          <div className="grid gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "24/7", label: "AI Support" },
              { value: "10+", label: "Wellness Tools" },
              { value: "100%", label: "Private Sessions" },
              { value: "4 Roles", label: "Unified Platform" },
            ].map((stat) => (
              <div key={stat.label}>
                <h3 className="text-4xl font-bold text-teal-600">{stat.value}</h3>
                <p className="mt-3 text-sm uppercase tracking-[0.25em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative mt-24 overflow-hidden rounded-[42px] bg-[#004038] px-8 py-20 text-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:px-12 lg:px-16">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex items-center justify-center">
            <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.5fr_1fr_1fr]">
              <a
                href="#portals-section"
                className="group relative overflow-hidden rounded-[32px] bg-white min-h-[260px] p-5 shadow-2xl transition hover:scale-[1.03]"
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="h-24 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#004038]">mymindtherapyfriend Dashboard</span>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1 text-[9px] text-slate-700">
                          <span>Manas AI</span>
                          <span>Online</span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-white/70 px-2 py-1 text-[9px] text-slate-700">
                          <span>Mood Score</span>
                          <span>92%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="h-2 w-full rounded-full bg-slate-100" />
                      <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                      <div className="h-2 w-2/3 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <h3 className="text-xl font-bold text-[#004038]">Web App</h3>
                  <p className="text-sm text-slate-500">Available Now</p>
                </div>
              </a>

              <a
                href="#"
                className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition hover:scale-[1.03]"
              >
                <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-3xl">
                  <img src={play}/>
                </div>

                <h3 className="text-xl font-bold text-white">Google Play</h3>
                <p className="mt-2 text-white/70">Coming Soon</p>
              </a>

              <a
                href="#"
                className="flex min-h-[260px] flex-col items-center justify-center rounded-[32px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition hover:scale-[1.03]"
              >
                <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-3xl ">
                  <img src={app}/>
                </div>

                <h3 className="text-xl font-bold text-white">App Store</h3>
                <p className="mt-2 text-white/70">Coming Soon</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Section */}
      <section className="mt-24 mb-24 mx-auto max-w-4xl rounded-[40px] border border-slate-200 bg-white px-8 py-16 shadow-sm sm:px-12 text-left relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
            <MessageCircle className="size-4" />
            Got Questions?
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold text-[#012620] sm:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <FAQItem key={idx} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md bg-white shadow-lg shadow-slate-200 overflow-hidden">
                <img src={logoUrl} alt="mymindtherapyfriend AI mental health India" className="size-full object-cover scale-125" />
              </div>

              <div>
                <p className="font-display text-lg font-bold text-[#012620]">mymindtherapyfriend</p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
              mymindtherapyfriend - India's AI-powered mental health platform. Affordable, private, and always available.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#012620]">
              Platform
            </h3>

            <div className="mt-5 space-y-3 text-sm text-slate-600 flex flex-col items-start">
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Manas AI Companion</Link>
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">CBT Self-Help Tools Online</Link>
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Daily Mood Tracker</Link>
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Book RCI-Verified Therapist</Link>
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Employee Mental Wellness</Link>
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Free Crisis Support India</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#012620]">
              Company
            </h3>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <Link to="/about" className="block hover:text-teal-600 transition">About mymindtherapyfriend</Link>
              <Link to="/privacy" className="block hover:text-teal-600 transition">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-teal-600 transition">Terms & Conditions</Link>
              <Link to="/support" className="block hover:text-teal-600 transition">Support Center</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#012620]">
              Stay Connected
            </h3>

            <div className="mt-5 flex items-center gap-3">
              <a 
                href="https://www.instagram.com/mymindtherapyfriendindia/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
              >
                <Instagram className="size-5" />
              </a>

              <a 
                href="https://www.linkedin.com/company/107088242" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
              >
                <Linkedin className="size-5" />
              </a>

              <a 
                href={`mailto:${ENTERPRISE_EMAIL}`}
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:text-teal-600"
              >
                <Mail className="size-5" />
              </a>
            </div>

            <p className="mt-6 text-sm text-slate-500">© 2026 mymindtherapyfriend™. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Super Admin Password Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Shield className="size-4 text-violet-400" /> Super Admin Access
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">
                Please enter the portal password to proceed to the Super Admin sign-in.
              </p>

              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyAdminPassword()}
                placeholder="Enter password"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
              />
              {error && <p className="text-xs text-red-400 mt-2 font-semibold">{error}</p>}
            </div>
            <div className="px-5 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAdminModalOpen(false);
                  setAdminPassword("");
                  setError("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                disabled={!adminPassword || isVerifying}
                onClick={verifyAdminPassword}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Proceed"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
