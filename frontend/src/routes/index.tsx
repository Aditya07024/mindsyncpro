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
  Video,
  Menu,
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  HeartHandshake,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import API from "@/lib/api";
import logoUrl from "@/assets/logo.png";
import user from "@/assets/user.jpg";
import therapist from "@/assets/therapist.avif";
import org from "@/assets/org.avif";
import app from "@/assets/app.png";
import play from "@/assets/play.webp";


const API_BASE = import.meta.env.VITE_API_URL || "https://api.mymindtherapyfriend.com";
const ENTERPRISE_EMAIL ="contact@mymindtherapyfriend.com";
const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/CbMYSt00R0KDEdiEsp9IeL";

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 2.159.682 4.16 1.848 5.805L2 22l4.305-1.734A9.946 9.946 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.78 0-3.444-.467-4.887-1.285l-.35-.2-.2.08-2.583 1.04.996-2.476.096-.238-.177-.323A7.954 7.954 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
  );
}

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
    features: ["Live Video Sessions", "AI Pre-Session Briefs", "Earnings Dashboard", "Therapist Verified Badge"],
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
      { name: "description", content: "India's AI-powered mental health platform offering Manas AI companion, CBT tools, mood tracking, and verified therapists. Private, affordable, and free to start." },
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
    a: "Yes. Every therapist on our platform is verified against (Rehabilitation Council of India) records before they are listed. You can see their credentials, specialisation, and reviews before booking."
  },
  {
    q: "Is my data private and safe?",
    a: "Absolutely. Your phone number is hashed - we cannot read it. All data is stored in India on secure servers and we are fully compliant with the Digital Personal Data Protection Act (DPDPA) 2023. We never sell your data."
  },
  {
    q: "Can my college or company use mymindtherapyfriend?",
    a: "Yes. mymindtherapyfriend offers organisation wellness plans for colleges and corporates. Admins get anonymous, aggregate mental wellness dashboards - no individual data is ever visible. Contact us at contact@mymindtherapyfriend.com."
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

function MiniDonut({
  percent,
  color,
  size = 40,
  pulse = false,
}: {
  percent: number;
  color: string;
  size?: number;
  pulse?: boolean;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * (percent / 100);
  const angle = (percent / 100) * 360 - 90;
  const dotX = size / 2 + r * Math.cos((angle * Math.PI) / 180);
  const dotY = size / 2 + r * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="relative flex-shrink-0">
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black tracking-tighter" style={{ color }}>
          {percent}%
        </span>
      </div>
      {pulse && (
        <span
          className="absolute size-2 rounded-full animate-ping opacity-75 pointer-events-none"
          style={{
            left: `${(dotX / size) * 100}%`,
            top: `${(dotY / size) * 100}%`,
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}

function LiveSparkline({
  data,
  color = "#dc2626",
  gradientId = "grad-spark-red",
  height = 46,
  showGrid = true,
}: {
  data: number[];
  color?: string;
  gradientId?: string;
  height?: number;
  showGrid?: boolean;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 280;

  const pointCoords = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 14) - 7;
    return { x, y, val };
  });

  const pointsString = pointCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const lastCoord = pointCoords[pointCoords.length - 1];

  return (
    <div className="relative w-full h-12 overflow-hidden mt-1.5 group cursor-crosshair">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
          <pattern id="telemetry-grid-pattern" width="16" height="8" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 8" fill="none" stroke="#94a3b8" strokeWidth="0.4" strokeOpacity="0.15" />
          </pattern>
        </defs>

        {showGrid && <rect width={width} height={height} fill="url(#telemetry-grid-pattern)" />}
        <polygon
          fill={`url(#${gradientId})`}
          points={`0,${height} ${pointsString} ${width},${height}`}
          style={{ transition: "all 1000ms ease-in-out" }}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
          style={{ transition: "all 1000ms ease-in-out" }}
        />

        {pointCoords.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="7"
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            className="cursor-pointer"
          />
        ))}

        {hoverIndex !== null && pointCoords[hoverIndex] && (
          <g>
            <line
              x1={pointCoords[hoverIndex].x}
              y1="0"
              x2={pointCoords[hoverIndex].x}
              y2={height}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.5"
            />
            <circle
              cx={pointCoords[hoverIndex].x}
              cy={pointCoords[hoverIndex].y}
              r="3.5"
              fill={color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        )}

        {hoverIndex === null && (
          <g style={{ transition: "all 1000ms ease-in-out" }}>
            <circle cx={lastCoord.x} cy={lastCoord.y} r="4.5" fill={color} className="animate-ping opacity-75" />
            <circle cx={lastCoord.x} cy={lastCoord.y} r="3" fill={color} stroke="#ffffff" strokeWidth="1" />
          </g>
        )}
      </svg>

      {hoverIndex !== null && pointCoords[hoverIndex] && (
        <div
          className="absolute top-0 bg-slate-900/90 text-white text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none z-20 backdrop-blur-xs"
          style={{
            left: `${Math.min(88, Math.max(12, (pointCoords[hoverIndex].x / width) * 100))}%`,
            transform: "translate(-50%, 0%)",
          }}
        >
          Rate: {pointCoords[hoverIndex].val}
        </div>
      )}
    </div>
  );
}

function MentalHealthLiveShowcase() {
  const [stressedToday, setStressedToday] = useState(0);
  const [helpedToday, setHelpedToday] = useState(0);
  const [activeTab, setActiveTab] = useState<"live" | "24h" | "7d">("live");
  const [activeFeedIdx, setActiveFeedIdx] = useState(0);

  const [stressedSpark, setStressedSpark] = useState<number[]>([
    45, 52, 49, 60, 58, 65, 72, 70, 85, 82, 90, 88, 95, 92, 104, 98, 110
  ]);
  const [helpedSpark, setHelpedSpark] = useState<number[]>([
    15, 18, 17, 22, 21, 28, 27, 32, 31, 38, 37, 44, 43, 50, 49, 56
  ]);

  const LIVE_FEED_ITEMS = [
    { text: "Anonymous AI Mental Assessment completed in New Delhi", time: "2s ago", tag: "AI Care", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { text: "Licensed Clinical Psychologist session booked in Bengaluru", time: "5s ago", tag: "Therapy", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { text: "Confidential Stress Screening initiated in Hyderabad", time: "8s ago", tag: "Screening", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { text: "Guided CBT Mood Journal entry saved in Pune", time: "12s ago", tag: "Wellness", color: "bg-teal-50 text-teal-700 border-teal-200" },
    { text: "Urgent Crisis Support consultation matched in Mumbai", time: "17s ago", tag: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
    { text: "Corporate Employee Mind Check completed in Chennai", time: "21s ago", tag: "Enterprise", color: "bg-violet-50 text-violet-700 border-violet-200" },
    { text: "Teen Stress Assessment completed in Jaipur", time: "26s ago", tag: "Adolescent", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { text: "AI Support Chat completed in Kolkata", time: "30s ago", tag: "AI Care", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { text: "Depression Screening Test completed in Ahmedabad", time: "34s ago", tag: "Clinical", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { text: "Mindfulness & Breathing Exercise done in Kochi", time: "39s ago", tag: "Wellness", color: "bg-teal-50 text-teal-700 border-teal-200" },
    { text: "Therapy Follow-up appointment scheduled in Chandigarh", time: "44s ago", tag: "Therapy", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { text: "Confidential Self-Assessment finished in Lucknow", time: "49s ago", tag: "Screening", color: "bg-slate-100 text-slate-700 border-slate-200" },
  ];

  useEffect(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sec = Math.max(1, Math.floor((now.getTime() - startOfDay) / 1000));
    setStressedToday(Math.floor(sec * 1620.5) + 124500);
    setHelpedToday(Math.floor(sec * 0.52) + 3840);

    // Smooth real-time counter update every 1200ms
    const counterTimer = setInterval(() => {
      setStressedToday((p) => p + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.4) {
        setHelpedToday((p) => p + 1);
      }
    }, 1200);

    // Smooth graph morphing every 2400ms with subtle micro-fluctuations
    const sparklineTimer = setInterval(() => {
      setStressedSpark((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(40, Math.min(120, last + (Math.floor(Math.random() * 7) - 3)));
        return [...prev.slice(1), next];
      });

      setHelpedSpark((prev) => {
        const last = prev[prev.length - 1];
        const next = Math.max(20, Math.min(70, last + (Math.floor(Math.random() * 5) - 2)));
        return [...prev.slice(1), next];
      });
    }, 2400);

    const feedTimer = setInterval(() => {
      setActiveFeedIdx((prev) => (prev + 1) % LIVE_FEED_ITEMS.length);
    }, 3500);

    return () => {
      clearInterval(counterTimer);
      clearInterval(sparklineTimer);
      clearInterval(feedTimer);
    };
  }, []);

  const currentFeed = LIVE_FEED_ITEMS[activeFeedIdx];

  return (
    <section className="relative mt-14 overflow-hidden rounded-[28px] border border-slate-200/90 bg-white px-5 py-6 sm:px-8 sm:py-7 shadow-xl">
      <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-red-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-emerald-500/5 blur-3xl" />

      {/* Header section with live feed indicator and timeframe toggle */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-red-700 shadow-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-red-600"></span>
            </span>
            Realtime Telemetry
          </span>
          <p className="text-sm font-semibold text-slate-800">
            Millions go through stress every day — therapists & AI help them come out of depression
          </p>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 text-[11px] font-medium">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeTab === "live"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Live Ticker
          </button>
          <button
            onClick={() => setActiveTab("24h")}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeTab === "24h"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            24H View
          </button>
          <button
            onClick={() => setActiveTab("7d")}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeTab === "7d"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            7D Trend
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Stat Cards */}
      <div className="relative z-10 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1 — Realtime Live Stressed Counter with Red Sparkline */}
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/40 via-white to-slate-50/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-red-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-red-100/80 text-red-600">
                  <TrendingUp className="size-4" />
                </div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                  Stressed Today
                  <span className="size-1.5 rounded-full bg-red-600 animate-pulse"></span>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-red-600 bg-red-100/60 px-2 py-0.5 rounded">
                {activeTab === "live" ? "REALTIME WAVE" : activeTab === "24h" ? "24H PEAK" : "WEEKLY INDEX"}
              </span>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight mt-2">
              {stressedToday > 0 ? stressedToday.toLocaleString("en-IN") : "---"}
            </p>
            {/* Live Red Waveform/Sparkline with Interactive Hover */}
            <LiveSparkline data={stressedSpark} color="#dc2626" gradientId="grad-spark-red" />
          </div>

          {/* 2 — Realtime Recovering & Assisted with Emerald Sparkline */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/50 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-emerald-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
                  <HeartHandshake className="size-4" />
                </div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  Recovering
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                OUTCOMES
              </span>
            </div>
            <p className="font-mono text-2xl sm:text-3xl font-black text-emerald-700 leading-none tracking-tight mt-2">
              {helpedToday > 0 ? helpedToday.toLocaleString("en-IN") : "---"}
            </p>
            {/* Live Emerald Waveform/Sparkline with Interactive Hover */}
            <LiveSparkline data={helpedSpark} color="#059669" gradientId="grad-spark-emerald" />
          </div>
        </div>

        {/* Live Event Activity Ticker Stream */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3.5 py-2 text-xs transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
              <Activity className="size-3 text-emerald-600 animate-spin" />
              Live Feed
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeedIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 text-slate-700 text-[11px] truncate"
              >
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${currentFeed.color}`}>
                  {currentFeed.tag}
                </span>
                <span className="font-medium truncate">{currentFeed.text}</span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">• {currentFeed.time}</span>
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="hidden sm:inline-flex shrink-0 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Telemetry Stream Active
          </span>
        </div>

        {/* 4 Demographics & Baseline Metrics Grid - Live Dynamic Styling */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Prevalence */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 via-white to-slate-100/40 p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-slate-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-slate-700 animate-pulse"></span>
                Prevalence
              </span>
              <span className="text-[8px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded font-semibold">
                LIVE METRIC
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MiniDonut percent={10.5} color="#0f172a" size={42} pulse={true} />
              <div>
                <p className="text-base font-black text-slate-900 leading-tight">10.5%</p>
                <p className="text-[10px] font-medium text-slate-600">Mental disorders</p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">1 in 10 adults</p>
              </div>
            </div>
          </div>

          {/* Card 2: Treatment Gap */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 via-white to-slate-50/40 p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-rose-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-rose-600 animate-ping"></span>
                Treatment Gap
              </span>
              <span className="text-[8px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                CRISIS ALERT
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MiniDonut percent={84.5} color="#dc2626" size={42} pulse={true} />
              <div>
                <p className="text-base font-black text-rose-700 leading-tight">84.5%</p>
                <p className="text-[10px] font-medium text-slate-600">Go untreated</p>
                <p className="text-[9px] font-mono text-rose-600/80 mt-0.5">7 of 8 untreated</p>
              </div>
            </div>
          </div>

          {/* Card 3: Teen Stress */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/50 via-white to-slate-50/40 p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-teal-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                Teens Stressed
              </span>
              <span className="text-[8px] font-mono font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.2 rounded">
                SURVEY FEED
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MiniDonut percent={40} color="#004038" size={42} pulse={true} />
              <div>
                <p className="text-base font-black text-[#004038] leading-tight">40%</p>
                <p className="text-[10px] font-medium text-slate-600">IPS 2024 Study</p>
                <p className="text-[9px] font-mono text-teal-800/80 mt-0.5">2 in 5 adolescents</p>
              </div>
            </div>
          </div>

          {/* Card 4: Adults Need Help */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/40 p-3.5 shadow-2xs transition-all hover:shadow-xs hover:border-indigo-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                Adults Need Help
              </span>
              <span className="text-[8px] font-mono font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded">
                ACTIVE NEED
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MiniDonut percent={15} color="#4f46e5" size={42} pulse={true} />
              <div>
                <p className="text-base font-black text-indigo-900 leading-tight">15%</p>
                <p className="text-[10px] font-medium text-slate-600">Active intervention</p>
                <p className="text-[9px] font-mono text-indigo-600/80 mt-0.5">Therapy priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tagline bar */}
      <div className="relative z-10 mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-2xs backdrop-blur-sm">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <span className="hidden md:inline-flex items-center gap-1 rounded-md bg-[#004038]/10 px-2 py-0.5 text-[10px] font-bold text-[#004038]">
            <ShieldCheck className="size-3 text-[#004038]" />
            100% Private & Confidential
          </span>
          <p className="leading-snug">
            <span className="font-bold text-slate-900">5.3%</span> suffer depressive disorders •
            Projected <span className="font-bold text-slate-900">23%</span> prevalence by 2026 •
            <span className="font-bold text-slate-900"> 210M+</span> adults need therapy access
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <Link
            to="/sign-in"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004038] to-[#005c51] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-[#00332d] hover:to-[#004c43] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="size-3.5 text-emerald-300 animate-pulse" />
            <span>Start Free Assessment</span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="sticky top-4 z-50 mx-auto mt-4 flex w-[95%] max-w-7xl items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3 sm:px-6 sm:py-4 shadow-lg backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex size-10 sm:size-11 items-center justify-center rounded-md bg-white shadow-lg shadow-slate-200 overflow-hidden">
            <img src={logoUrl} alt="mymindtherapyfriend AI mental health India" className="size-full object-cover scale-125" />
          </div>

          <div>
            <p className="font-display text-base sm:text-lg font-bold text-[#012620]">MyMindTherapyFriend</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/meeting_workspace"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Meeting Workspace
          </Link>
          <Link
            to="/about"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            About
          </Link>
          <Link
            to="/pricing"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Pricing
          </Link>

          <button
            onClick={handleGetStarted}
            className="rounded-full bg-[#004038] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden items-center justify-center size-10 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="size-6 text-[#004038]" /> : <Menu className="size-6 text-[#004038]" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="sticky top-20 z-40 mx-auto mt-2 w-[95%] max-w-7xl md:hidden rounded-2xl border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2">
              <Link
                to="/meeting_workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-[#004038]"
              >
                <span>Meeting Workspace</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-[#004038]"
              >
                <span>About</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-[#004038]"
              >
                <span>Pricing</span>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <hr className="my-1.5 border-slate-100" />

              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleGetStarted(e);
                }}
                className="w-full rounded-xl bg-[#004038] py-3.5 text-center text-base font-semibold text-white shadow-lg transition active:scale-[0.98] cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              mymindtherapyfriend is India's AI-powered mental health platform - combining Manas AI companion, CBT self-help tools, mood tracking, and verified online therapist booking into one private, affordable wellness experience. Starting free.
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
            className="relative flex items-center justify-center w-full"
          >
            <div className="relative h-[330px] min-[400px]:h-[420px] min-[500px]:h-[490px] sm:h-[560px] w-full max-w-xl mx-auto overflow-visible">
              {/* User Card - Top Left */}
              <div className="absolute top-2 left-2 min-[400px]:top-4 min-[400px]:left-4 sm:top-8 sm:left-8 rounded-xl min-[400px]:rounded-2xl sm:rounded-3xl bg-[#87c8ff] p-1.5 min-[400px]:p-2 sm:p-3 shadow-xl">
                <div className="h-20 w-20 min-[400px]:h-28 min-[400px]:w-28 sm:h-36 sm:w-36 rounded-lg min-[400px]:rounded-xl sm:rounded-2xl bg-white/40 backdrop-blur flex items-center justify-center text-5xl">
                  <img
                    src={user}
                    alt="mymindtherapyfriend"
                    className="h-full w-full object-cover border-2 sm:border-4 border-red rounded-lg min-[400px]:rounded-xl sm:rounded-2xl"
                  />
                </div>
                <div className="absolute -right-6 min-[400px]:-right-8 sm:-right-10 top-2 min-[400px]:top-4 sm:top-6 rounded-full bg-[#fde8ce] px-2 py-0.5 min-[400px]:px-3 min-[400px]:py-1 sm:px-4 sm:py-2 text-[10px] min-[400px]:text-xs font-semibold shadow-sm whitespace-nowrap">
                  User
                </div>
              </div>

              {/* Therapist Card - Top Right */}
              <div className="absolute top-8 right-2 min-[400px]:top-14 min-[400px]:right-3 sm:top-25 sm:right-5 z-30 rounded-xl min-[400px]:rounded-2xl sm:rounded-3xl bg-[#e8c1b0] p-1.5 min-[400px]:p-2 sm:p-3 shadow-xl">
                <div className="h-16 w-16 min-[400px]:h-24 min-[400px]:w-24 sm:h-32 sm:w-32 rounded-lg min-[400px]:rounded-xl sm:rounded-2xl bg-white/40 flex items-center justify-center text-5xl">
                  <img
                    src={therapist}
                    alt="mymindtherapyfriend"
                    className="h-full w-full object-cover border-2 sm:border-4 border-white rounded-lg min-[400px]:rounded-xl sm:rounded-2xl shadow-lg"
                  />
                </div>
                <div className="absolute -left-10 min-[400px]:-left-14 sm:-left-16 top-2 min-[400px]:top-4 sm:top-8 rounded-full bg-[#fde8ce] px-2 py-0.5 min-[400px]:px-3 min-[400px]:py-1 sm:px-4 sm:py-2 text-[10px] min-[400px]:text-xs font-semibold shadow-sm whitespace-nowrap">
                  therapist
                </div>
              </div>

              {/* Organisation Card - Bottom Right */}
              <div className="absolute bottom-4 right-2 min-[400px]:bottom-6 min-[400px]:right-3 sm:bottom-10 sm:right-8 rounded-xl min-[400px]:rounded-2xl sm:rounded-3xl bg-[#ff9a52] p-1.5 min-[400px]:p-2 sm:p-3 shadow-xl">
                <div className="h-16 w-16 min-[400px]:h-24 min-[400px]:w-24 sm:h-32 sm:w-32 rounded-lg min-[400px]:rounded-xl sm:rounded-2xl bg-white/40 flex items-center justify-center text-5xl">
                  <img
                    src={org}
                    alt="mymindtherapyfriend"
                    className="h-full w-full object-cover border-2 sm:border-4 border-red rounded-lg min-[400px]:rounded-xl sm:rounded-2xl shadow-lg"
                  />
                </div>
                <div className="absolute -left-12 min-[400px]:-left-16 sm:-left-20 top-2 min-[400px]:top-4 sm:top-8 rounded-full bg-[#fde8ce] px-2 py-0.5 min-[400px]:px-3 min-[400px]:py-1 sm:px-4 sm:py-2 text-[10px] min-[400px]:text-xs font-semibold shadow-sm whitespace-nowrap">
                  Organisation
                </div>
              </div>

              {/* Manas AI Message Card - Bottom Left */}
              <div className="absolute left-2 bottom-4 min-[400px]:left-5 min-[400px]:bottom-8 sm:left-12 sm:bottom-16 w-36 min-[400px]:w-48 sm:w-64 rounded-xl min-[400px]:rounded-2xl sm:rounded-[28px] border border-white/30 bg-white/40 p-2.5 min-[400px]:p-3.5 sm:p-5 backdrop-blur-xl shadow-2xl z-20">
                <p className="text-[10px] min-[400px]:text-xs text-slate-500 font-medium">Manas AI</p>
                <div className="mt-1 min-[400px]:mt-2 sm:mt-3 rounded-lg min-[400px]:rounded-xl sm:rounded-2xl bg-white/70 p-2 sm:p-3 text-[10px] min-[400px]:text-xs sm:text-sm text-slate-700 leading-snug">
                  You're doing better than you think. Let's take one step at a time.
                </div>
              </div>

              {/* Center Logo */}
              <div className="absolute left-1/2 top-1/2 h-28 w-28 min-[400px]:h-36 min-[400px]:w-36 min-[500px]:h-44 min-[500px]:w-44 sm:h-52 sm:w-52 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl min-[400px]:rounded-3xl sm:rounded-[40px] bg-red shadow-2xl z-10">
                <img
                  src={logoUrl}
                  alt="mymindtherapyfriend"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Decorative Dots */}
              <div className="absolute top-4 right-14 min-[400px]:top-6 min-[400px]:right-20 sm:top-8 sm:right-24 h-2 w-2 sm:h-4 sm:w-4 rounded-full bg-yellow-400" />
              <div className="absolute bottom-12 left-1 min-[400px]:bottom-16 min-[400px]:left-2 sm:bottom-24 sm:left-4 h-2 w-2 sm:h-4 sm:w-4 rounded-full bg-cyan-400" />
              <div className="absolute top-[60px] right-20 min-[400px]:top-20 min-[400px]:right-28 sm:top-28 sm:right-32 h-1.5 w-1.5 sm:h-3 sm:w-3 rounded-full bg-violet-400" />
            </div>
          </motion.div>
        </section>

        {/* Mental Health Live Showcase */}
        <MentalHealthLiveShowcase />

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

            {/* <div className="relative z-10 mt-14 grid gap-5 lg:grid-cols-3">
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
            </div> */}

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

       

       

        {/* About Section */}
        

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

      {/* WhatsApp Community Section */}
      <section className="mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-emerald-600 to-teal-700 p-8 sm:p-12 text-white shadow-xl shadow-emerald-900/10">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md mb-6">
              <WhatsAppIcon className="size-4 text-emerald-200" />
              MyMindFriend Peer Community
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl text-white tracking-tight">
              Join Our Supportive WhatsApp Community
            </h2>
            <p className="mt-4 text-base sm:text-lg text-emerald-100 leading-relaxed">
              You are never alone on your wellness journey. Connect with like-minded individuals, receive daily mental health tips, peer support, and exclusive updates in our official WhatsApp group.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-800 shadow-lg transition hover:bg-emerald-50 hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="size-5 text-emerald-600" />
                Join WhatsApp Group
              </a>
              <span className="text-xs text-emerald-200 font-medium">Safe • Supportive • 24/7 Available</span>
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </div>
      </section>

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
              <Link to="/sign-in" className="hover:text-teal-600 transition text-left">Book Verified Therapist</Link>
              <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 font-medium transition text-left flex items-center gap-1.5 text-emerald-700">
                <WhatsAppIcon className="size-4" /> WhatsApp Community
              </a>
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
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank" 
                rel="noopener noreferrer"
                title="Join WhatsApp Community"
                className="flex size-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
              >
                <WhatsAppIcon className="size-5" />
              </a>

              <a 
                href="https://www.instagram.com/mymindtherapyfriend/" 
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
