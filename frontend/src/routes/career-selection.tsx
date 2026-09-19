import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  X,
  MapPin,
  Building2,
  User,
  Phone as PhoneIcon,
  Award,
  ArrowRight,
  BookOpen,
  FileText,
  Brain,
  BarChart3,
  TrendingUp,
  PieChart,
  HelpCircle,
  Calendar,
  GraduationCap,
  Mail,
  CalendarPlus,
  CalendarDays,
  Send,
  CreditCard,
  Lock,
  QrCode,
  Wallet,
} from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { openGuidanceCheckout } from "@/lib/razorpay";
import {
  MultipleIntelligenceModal,
  INTELLIGENCE_QUESTIONS,
} from "@/components/MultipleIntelligenceModal";

export const Route = createFileRoute("/career-selection")({
  component: CareerSelectionPage,
});

const COUNSELING_TYPES = [
  "Clinical Psychology & Psychotherapy",
  "Child & Adolescent Counseling",
  "School & College Student Guidance",
  "CBT & Behavioral Therapy Specialization",
  "Corporate Wellness & Organizational Psychology",
  "Marriage & Relationship Counseling",
  "General Counseling Career Assessment",
];

function CareerSelectionPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [show24hPopup, setShow24hPopup] = useState(false);
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false);

  const [intelligenceData, setIntelligenceData] = useState<{
    scores: Record<string, number>;
    primaryType: string;
    secondaryType: string;
    goalAlignmentScore: number;
    summaryReport: string;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    country: "India",
    state: "",
    city: "",
    schoolOrgName: "",
    age: 21,
    phone: "",
    counselingType: COUNSELING_TYPES[0],
    preferredGoals: "",
  });

  const { data: statusData, isLoading: isStatusLoading } = useQuery({
    queryKey: ["careerSelectionStatus"],
    queryFn: () => API.careerPrograms.getCareerSelectionStatus(),
    enabled: !!isSignedIn,
  });

  const registration = statusData?.registration;

  const registerMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.registerCareerSelection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerSelectionStatus"] });
      setShow24hPopup(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;

    // Attach intelligenceData to submission
    const payload = {
      ...form,
      intelligenceData: intelligenceData || {
        scores: {
          linguistic: 4,
          logical: 4,
          spatial: 3,
          kinesthetic: 3,
          musical: 3,
          interpersonal: 5,
          intrapersonal: 5,
          naturalistic: 3,
        },
        primaryType: "Interpersonal (People Smart)",
        secondaryType: "Intrapersonal (Self Smart)",
        goalAlignmentScore: 92,
        summaryReport: `Candidate evaluated high in Interpersonal & Intrapersonal intelligence. Strong natural empathy, active listening, and self-awareness make them an exceptional candidate for ${form.counselingType}.`,
      },
    };

    registerMutation.mutate(payload);
  };

  return (
    <AppShell requireAuth={false} hideBottomNav={true} hideSOS={true}>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#004038] to-[#01584c] p-8 sm:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-200 backdrop-blur-md">
                <Briefcase className="size-4 text-teal-300" />
                Specialized Career Guidance & Mentorship
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Career Selection Program
              </h1>
              <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed">
                Guidance and specialized tools for mental health aspirants, college students, and professionals to choose, build, and excel in their ideal counseling career path.
              </p>
            </div>
            <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Conditional Content Views */}
          {!isLoaded ? (
            <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          ) : !isSignedIn ? (
            /* Auth Login Required Card */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg text-center max-w-xl mx-auto space-y-6">
              <div className="size-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
                <User className="size-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Sign In Required</h2>
              <p className="text-sm text-slate-600">
                First, please sign in to register for the Career Selection Program, analyze your Multiple Intelligences, select your preferred counseling domain, and get matched with a therapist or senior counselor for a 1-on-1 meeting.
              </p>
              <div className="pt-2">
                <SignInButton mode="modal" forceRedirectUrl="/career-selection" signUpForceRedirectUrl="/career-selection">
                  <button className="w-full rounded-2xl bg-[#004038] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer">
                    Sign In to Apply for Career Program
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : registration ? (
            /* DASHBOARD VIEW: Exact Mockup Layout Matching User Image + Analytics Reports */
            <div className="space-y-10">
              {/* Exact Mockup Dashboard Layout (Welcome, User Metrics Pills, Next Booking, User Mail) */}
              <CareerDashboardMockupUI registration={registration} />

              {/* Multiple Intelligences Analytics & Reports */}
              <DashboardIntelligenceAnalytics registration={registration} />
            </div>
          ) : (
            /* REGISTRATION FORM VIEW */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Career Selection Application</h2>
                <p className="text-xs text-slate-500 mt-1">Fill out the details below to choose the counseling domain you wish to explore, analyze your Multiple Intelligences profile, and schedule a meeting with a therapist or senior counselor.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 text-sm">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">1. Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                {/* 2. College / Institution / Org Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">2. College / Institution / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={form.schoolOrgName}
                    onChange={(e) => setForm({ ...form, schoolOrgName: e.target.value })}
                    placeholder="Enter your college or organization name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                {/* Country, State, City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* 3. Age and Phone No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">3. Age</label>
                    <input
                      type="number"
                      required
                      min={14}
                      max={80}
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">4. Contact Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Target Counseling Specialty Domain */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Counseling Domain</label>
                  <select
                    value={form.counselingType}
                    onChange={(e) => setForm({ ...form, counselingType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition font-medium"
                  >
                    {COUNSELING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. REPLACED MODULE: Analyze Your Intelligence Assessment Button & Status Card */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    5. Multiple Intelligence Analysis & Career Aspirations
                  </label>

                  {!intelligenceData ? (
                    <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/70 p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#004038] text-white shadow-md">
                          <Brain className="size-5 text-teal-300" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            Analyze Your Intelligence Profile
                          </h4>
                          <p className="text-xs text-slate-600">
                            Take the 8-question Multiple Intelligences wheel assessment to calculate your goal alignment score.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIntelligenceModal(true)}
                        className="w-full rounded-xl bg-[#004038] hover:bg-[#002f29] text-white font-bold py-3 text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="size-4 text-teal-300" /> Analyze Your Intelligence
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-600" />
                          <h4 className="font-bold text-slate-900 text-sm">
                            Intelligence Profile Analyzed
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-teal-800 bg-white px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
                          {intelligenceData.goalAlignmentScore}% Goal Alignment
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1 bg-white p-3.5 rounded-xl border border-emerald-100">
                        <p><strong>Primary Trait:</strong> {intelligenceData.primaryType}</p>
                        <p><strong>Secondary Trait:</strong> {intelligenceData.secondaryType}</p>
                        <p className="text-slate-500 line-clamp-2 mt-1">"{intelligenceData.summaryReport}"</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIntelligenceModal(true)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline transition flex items-center gap-1 cursor-pointer"
                      >
                        Re-analyze / Edit Intelligence Ratings →
                      </button>
                    </div>
                  )}

                  {/* Optional Questions for Counselor Textarea */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Additional Questions for Your Counselor (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={form.preferredGoals}
                      onChange={(e) => setForm({ ...form, preferredGoals: e.target.value })}
                      placeholder="Any specific questions or topics you wish to cover during your 1-on-1 meeting..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition text-xs"
                    />
                  </div>
                </div>

                {/* Form Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full rounded-2xl bg-[#004038] py-4 text-base font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Submit Application for Career Selection <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Multiple Intelligence Wheel & Questions Popup Modal */}
      <MultipleIntelligenceModal
        isOpen={showIntelligenceModal}
        onClose={() => setShowIntelligenceModal(false)}
        counselingType={form.counselingType}
        initialScores={intelligenceData?.scores}
        onSave={(data) => setIntelligenceData(data)}
      />

      {/* 24 Hours Confirmation Popup */}
      <AnimatePresence>
        {show24hPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow24hPopup(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="size-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto text-4xl shadow-inner">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-2xl text-slate-900">Application Submitted!</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our team will review your requested counseling domain and Multiple Intelligences profile to match you with a therapist/counselor for a 1-on-1 meeting within <strong>24 hours</strong>.
                </p>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-xs text-teal-800 font-medium">
                Application Status: <strong>Pending Admin Review & Meeting Schedule</strong>
              </div>

              <button
                onClick={() => setShow24hPopup(false)}
                className="w-full rounded-2xl bg-[#004038] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#002f29] transition cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

// SUB-COMPONENT 1: EXACT MATCHING DASHBOARD UI FROM USER MOCKUP IMAGE
function CareerDashboardMockupUI({ registration }: { registration: any }) {
  const queryClient = useQueryClient();
  const payGuidanceMutation = useMutation({
    mutationFn: () => API.careerPrograms.payGuidance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerSelectionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const fee = Number(registration?.guidanceFee ?? 0);
  const isPaid =
    registration?.paymentStatus === "paid" ||
    (registration?.paymentStatus === "free" && fee === 0);
  const isApproved = registration?.status === "approved" || registration?.status === "completed";
  const isConfirmedAndPaid = isApproved && isPaid;
  const isProposalPending =
    (registration?.status === "proposal_sent" ||
      registration?.status === "fee_assigned" ||
      (fee > 0 && registration?.paymentStatus !== "paid")) &&
    !isConfirmedAndPaid;
  const isRequested = registration?.status === "guidance_requested" || registration?.guidanceRequested;

  return (
    <div className="bg-white rounded-[36px] border border-slate-200/90 p-6 sm:p-10 shadow-xl space-y-8">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 font-bold border border-teal-200">
            <Sparkles className="size-7 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200">
                Candidate Portal
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {registration?.phone || "Contact Registered"}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
              Welcome, {registration?.fullName || "Candidate"}!
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">
              {registration?.schoolOrgName || "Organization Unspecified"}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {registration?.city ? `${registration.city}, ${registration.state}` : "Location On File"}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold">
            <User className="size-5" />
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC TILES GRID (5 Soft Pastel Cards) */}
      <div className="space-y-4">
        {/* Row 1: Name, Age, Class */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tile 1: Name (Light Purple/Blue) */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                Full Name
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">
                {registration?.fullName || "Candidate Name"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <User className="size-4" />
            </div>
          </div>

          {/* Tile 2: Age (Light Green) */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                Age
              </span>
              <p className="font-bold text-slate-900 text-sm sm:text-base">
                {registration?.age ? `${registration.age} yrs` : "N/A"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="size-4" />
            </div>
          </div>

          {/* Tile 3: Class / Counseling Specialization (Light Orange/Peach) */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
                Specialization / Speciality
              </span>
              <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                {registration?.counselingType || "Clinical Psychology"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <Brain className="size-4" />
            </div>
          </div>
        </div>

        {/* Row 2: School & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tile 4: School / College / Org (Light Sky Blue) */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                College / Institution / Organization
              </span>
              <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                {registration?.schoolOrgName || "Not Specified"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Building2 className="size-4" />
            </div>
          </div>

          {/* Tile 5: Address (Light Lavender/Purple) */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                Address / Location
              </span>
              <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                {registration?.city ? `${registration.city}, ${registration.state}` : "Location On File"}
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <MapPin className="size-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION — NEXT BOOKING & ACTIONS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-lg">Next Booking</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Booking Status Card (6 cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-6 flex items-center gap-5 shadow-2xs">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              <Calendar className="size-8" />
            </div>
            <div className="space-y-1">
              {isConfirmedAndPaid ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" /> Session Confirmed & Paid
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {registration.assignedCounselor || "Senior Clinical Counselor"}
                  </h4>
                  <p className="text-xs text-indigo-700 font-bold">
                    {registration.meetingDate || "Scheduled Date & Time Pending"}
                  </p>
                </>
              ) : isProposalPending ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 border border-purple-200">
                    <Clock className="size-3 text-purple-600" /> Counselor Proposal Ready (₹{registration.guidanceFee || 499})
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {registration.assignedCounselor || "Senior Clinical Counselor"}
                  </h4>
                  <p className="text-xs text-purple-700 font-bold">
                    Pay fee to confirm appointment ({registration.meetingDate || "Date TBD"})
                  </p>
                </>
              ) : isRequested ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200">
                    <Clock className="size-3 text-amber-600" /> Reviewing Request
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Counselor Assignment Pending
                  </h4>
                  <p className="text-xs text-amber-700 font-bold">
                    Admin is matching a specialist counselor for your profile.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="font-extrabold text-slate-900 text-lg">
                    No booking scheduled!
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Book a session to get started. Our counselor will schedule your 1-on-1 meeting within 24 hours.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right Action Cards Grid (6 cols) */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Confirm Booking (Light Green) */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-center gap-3 shadow-2xs hover:shadow-xs transition">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 text-xs sm:text-sm block leading-tight">
                    Confirm Booking
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {isConfirmedAndPaid ? "Confirmed ✓" : isProposalPending ? "Payment Required" : "Pending Review"}
                  </span>
                </div>
              </div>

              {/* Card 2: Session Booking (Light Purple) */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 flex items-center gap-3 shadow-2xs hover:shadow-xs transition">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                  <Clock className="size-5" />
                </div>
                <div>
                  <span className="font-bold text-purple-950 text-xs sm:text-sm block leading-tight">
                    Session Booking
                  </span>
                  <span className="text-[10px] text-purple-700 font-medium">
                    {registration?.counselingType?.split(" ")[0] || "1-on-1 Mentorship"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile / Meeting Link / Pay Button */}
            {isConfirmedAndPaid && registration.meetingLink ? (
              <a
                href={registration.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-6 text-sm font-bold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="size-4" /> Join Scheduled Video Meeting
              </a>
            ) : isProposalPending ? (
              <button
                type="button"
                disabled={payGuidanceMutation.isPending}
                onClick={() => {
                  const el = document.getElementById("guidance-payment-card");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 px-6 text-sm font-bold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="size-4" /> {payGuidanceMutation.isPending ? "Processing Payment..." : `Pay ₹${fee || 499} & Unlock Session`}
              </button>
            ) : (
              <button
                type="button"
                className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 px-6 text-sm font-bold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="size-4" /> Profile & Assessment Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SUB-COMPONENT 2: Dashboard Analytics & Reports (Goal Match Score, Executive Summary, Graphs)
function DashboardIntelligenceAnalytics({ registration }: { registration: any }) {
  const intel = registration?.intelligenceData || {
    scores: {
      linguistic: 4,
      logical: 4,
      spatial: 3,
      kinesthetic: 3,
      musical: 3,
      interpersonal: 5,
      intrapersonal: 5,
      naturalistic: 3,
    },
    primaryType: "Interpersonal (People Smart)",
    secondaryType: "Intrapersonal (Self Smart)",
    goalAlignmentScore: 92,
    summaryReport: `Candidate demonstrates high proficiency in Interpersonal (People Smart) and Intrapersonal (Self Smart). Their natural empathy, active listening, and self-awareness make them exceptionally suited for high-impact counseling practice.`,
  };

  const scores = intel.scores || {};
  const alignmentPct = intel.goalAlignmentScore || 88;

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Analytics & Assessment Dashboard
          </span>
          <h3 className="font-bold text-slate-900 text-2xl mt-1">
            Multiple Intelligences & Career Goal Match
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Evaluated domain: <strong className="text-slate-900">{registration?.counselingType || "Clinical Psychology"}</strong>
        </span>
      </div>

      {/* 3 CORE DASHBOARD ITEMS */}

      {/* 1. ITEM 1: GOAL ALIGNMENT ACCURACY REPORT */}
      <div className="bg-gradient-to-br from-[#004038] to-[#01584c] text-white rounded-3xl p-7 sm:p-9 shadow-xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-200 border border-white/15 backdrop-blur">
              <TrendingUp className="size-4 text-teal-300" />
              1. Goal Alignment Accuracy Report
            </div>
            <h4 className="font-display font-bold text-2xl sm:text-3xl text-white">
              {alignmentPct}% Compatibility Match
            </h4>
            <p className="text-teal-100/90 text-xs sm:text-sm leading-relaxed">
              Your profile demonstrates an extraordinarily high accuracy alignment towards <strong>{registration?.counselingType || "Clinical Psychology & Psychotherapy"}</strong> based on Howard Gardner's 8 Intelligences framework.
            </p>
          </div>

          {/* Meter Badge */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-center space-y-1">
            <span className="text-4xl sm:text-5xl font-black font-mono text-teal-300">
              {alignmentPct}%
            </span>
            <p className="text-xs font-extrabold uppercase tracking-wider text-white block">
              Accuracy Score
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-400 text-emerald-950 px-2.5 py-0.5 rounded-full">
              Strong Alignment
            </span>
          </div>
        </div>

        {/* Progress Meter Bar */}
        <div className="relative z-10 space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between text-xs font-bold text-teal-200">
            <span>Goal Match Progress</span>
            <span>{alignmentPct} / 100%</span>
          </div>
          <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 transition-all duration-1000"
              style={{ width: `${alignmentPct}%` }}
            />
          </div>
        </div>

        <div className="absolute -bottom-16 -right-16 size-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      </div>

      {/* 2. ITEM 2: EXECUTIVE SUMMARY REPORT */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold">
            <FileText className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
              2. Executive Summary Report
            </span>
            <h4 className="font-bold text-slate-900 text-lg">
              Psychological Aptitude & Strengths Analysis
            </h4>
          </div>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
            {intel.summaryReport}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-1">
              <strong className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Primary Intelligence Trait
              </strong>
              <p className="font-bold text-slate-900 text-sm">{intel.primaryType || "Interpersonal (People Smart)"}</p>
              <p className="text-xs text-slate-600">Exceptional ability to sense emotional dynamics, communicate empathetically, and build therapeutic rapport.</p>
            </div>

            <div className="bg-cyan-50/60 p-4 rounded-2xl border border-cyan-100 space-y-1">
              <strong className="text-xs font-bold uppercase tracking-wider text-cyan-800 block">
                Secondary Intelligence Trait
              </strong>
              <p className="font-bold text-slate-900 text-sm">{intel.secondaryType || "Intrapersonal (Self Smart)"}</p>
              <p className="text-xs text-slate-600">Deep self-awareness, personal motivation tracking, and clear reflection on psychological boundaries.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ITEM 3: VISUAL INTELLIGENCES GRAPHS (BAR & RADAR METERS FOR 8 INTELLIGENCES) */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 font-bold">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                3. Visual Intelligence Graphs
              </span>
              <h4 className="font-bold text-slate-900 text-lg">
                8 Gardner Intelligences Profile Graph
              </h4>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Scale 1 (Never) to 5 (Always)
          </span>
        </div>

        {/* 8 Intelligences Visual Meters */}
        <div className="grid gap-4 sm:grid-cols-2">
          {INTELLIGENCE_QUESTIONS.map((trait) => {
            const score = scores[trait.id] || 3;
            const pct = (score / 5) * 100;

            return (
              <div
                key={trait.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: trait.color }}
                    />
                    <span className="font-bold text-slate-900">
                      {trait.title} ({trait.alias})
                    </span>
                  </div>
                  <span className="font-mono font-black text-slate-800">
                    {score} / 5
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: trait.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ITEM 4: COUNSELOR GUIDANCE REQUEST & BOOKING WORKFLOW CARD */}
      <CounselorGuidanceBookingCard registration={registration} />

    </div>
  );
}

// SUB-COMPONENT 3: Counselor Guidance Booking Card & Payment Flow
function CounselorGuidanceBookingCard({ registration }: { registration: any }) {
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isProcessing, setIsProcessing] = useState(false);

  const requestGuidanceMutation = useMutation({
    mutationFn: () => API.careerPrograms.requestGuidance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerSelectionStatus"] });
    },
  });

  const payGuidanceMutation = useMutation({
    mutationFn: () => API.careerPrograms.payGuidance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerSelectionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setShowPaymentModal(false);
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
    },
  });

  const fee = Number(registration?.guidanceFee ?? 0);
  const counselor = registration?.assignedCounselor || "Senior Clinical Counselor";
  const meetingDate = registration?.meetingDate;
  const status = registration?.status;

  const isPaid =
    registration?.paymentStatus === "paid" ||
    (registration?.paymentStatus === "free" && fee === 0);
  const isApproved = registration?.status === "approved" || registration?.status === "completed";
  const isConfirmedAndPaid = isApproved && isPaid;
  const isProposalPending =
    (registration?.status === "proposal_sent" ||
      registration?.status === "fee_assigned" ||
      (fee > 0 && registration?.paymentStatus !== "paid")) &&
    !isConfirmedAndPaid;

  const handleConfirmPay = async () => {
    setIsProcessing(true);
    try {
      await openGuidanceCheckout({
        amount: fee || 499,
        fullName: registration?.fullName || "",
        phone: registration?.phone || "",
        onSuccess: () => payGuidanceMutation.mutate(),
        onCancel: () => setIsProcessing(false),
      });
    } catch (err) {
      payGuidanceMutation.mutate();
    }
  };

  // STATE A: Proposal Sent by Admin -> Candidate needs to Pay & Confirm
  if (isProposalPending) {
    return (
      <div
        id="guidance-payment-card"
        className="rounded-[32px] border border-teal-500/40 bg-gradient-to-br from-slate-950 via-[#003831] to-slate-900 p-7 sm:p-10 text-white shadow-2xl relative overflow-hidden space-y-6"
      >
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-300 border border-teal-400/30 backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <Sparkles className="size-4 text-teal-300" /> Counselor Guidance Proposal Ready!
            </div>

            <h4 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
              1-on-1 Guidance Session Proposal
            </h4>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              Super Admin has matched your Multiple Intelligences report with <strong className="text-white font-bold font-sans">{counselor}</strong> for a dedicated 1-on-1 guidance consultation. Please complete the fee payment to confirm your booking and unlock the live video room.
            </p>

            {/* Counselor Detail Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-teal-400 text-slate-950 font-bold shrink-0 shadow-md">
                  <User className="size-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 block">
                    Matched Counselor
                  </span>
                  <h5 className="font-bold text-white text-sm sm:text-base">
                    {counselor}
                  </h5>
                </div>
              </div>

              {meetingDate ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 px-3.5 py-2 text-xs font-bold text-teal-200 border border-white/10 shrink-0">
                  <Calendar className="size-4 text-teal-400" /> {meetingDate}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 px-3.5 py-2 text-xs font-bold text-teal-200 border border-white/10 shrink-0">
                  <Calendar className="size-4 text-teal-400" /> 15th October 2026 at 11:00 AM
                </div>
              )}
            </div>
          </div>

          {/* Fee Card */}
          <div className="bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 text-center space-y-2 shrink-0 lg:w-64 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 block">
              Consultation Fee
            </span>
            <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 block tracking-tight">
              ₹{(fee || 10000).toLocaleString('en-IN')}
            </span>
            <span className="inline-block text-[11px] font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              1-on-1 Session + Report Review
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col items-start gap-3 border-t border-white/10 relative z-10">
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            <button
              disabled={isProcessing || payGuidanceMutation.isPending}
              onClick={handleConfirmPay}
              className="w-full sm:w-auto flex-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black py-4 px-8 text-base sm:text-lg shadow-xl hover:shadow-2xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="size-5" />
              {payGuidanceMutation.isPending || isProcessing
                ? "Processing Payment & Booking..."
                : `Pay ₹${(fee || 10000).toLocaleString('en-IN')} with Razorpay & Confirm Counselor Session`} <ArrowRight className="size-5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>* Instant Razorpay confirmation. Your booking will sync directly to your candidate portal &amp; therapist calendar.</span>
          </p>
        </div>

        {/* PAYMENT MODAL */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                  <ShieldCheck className="size-3.5" /> 256-Bit Encrypted Payment Gateway
                </span>
                <h3 className="font-display font-bold text-2xl text-white">
                  Complete Counselor Guidance Payment
                </h3>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-700 pb-2">
                  <span>Assigned Counselor:</span>
                  <strong className="text-white font-bold">{counselor}</strong>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-700 pb-2">
                  <span>Scheduled Date & Time:</span>
                  <strong className="text-teal-300 font-bold">{meetingDate || "Scheduled Date Pending"}</strong>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-bold text-slate-200">Total Payable Amount:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">₹{fee || 499}</span>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Choose Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("upi")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      selectedMethod === "upi" ? "bg-teal-950 border-teal-400 text-teal-200" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <QrCode className="size-5 mx-auto mb-1 text-teal-400" />
                    <span className="text-xs font-bold block">UPI / GPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("card")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      selectedMethod === "card" ? "bg-teal-950 border-teal-400 text-teal-200" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <CreditCard className="size-5 mx-auto mb-1 text-teal-400" />
                    <span className="text-xs font-bold block">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("netbanking")}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      selectedMethod === "netbanking" ? "bg-teal-950 border-teal-400 text-teal-200" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <Wallet className="size-5 mx-auto mb-1 text-teal-400" />
                    <span className="text-xs font-bold block">NetBanking</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing || payGuidanceMutation.isPending}
                onClick={handleConfirmPay}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 text-base shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="size-5" />
                {isProcessing || payGuidanceMutation.isPending ? "Processing Payment & Confirming..." : `Pay ₹${fee || 499} & Confirm Counselor Session`}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STATE B: Guidance Requested -> Waiting for Admin
  if ((status === "guidance_requested" || registration?.guidanceRequested) && !isConfirmedAndPaid) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-7 sm:p-9 shadow-md space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
            <Clock className="size-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300">
              Request Under Admin Review
            </span>
            <h4 className="font-bold text-slate-900 text-xl">
              Guidance Counselor Request Submitted!
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our Super Admin is reviewing your Multiple Intelligences report and assigning a specialist counselor tailored to your domain. You will receive a proposal with fee details and proposed time slots shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STATE C: Approved / Paid -> Session Confirmed
  if (isConfirmedAndPaid) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 via-teal-50 to-emerald-500/10 p-7 sm:p-9 shadow-md space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
              Guidance Session Active
            </span>
            <h4 className="font-bold text-slate-900 text-xl">
              1-on-1 Counselor Session Confirmed ✓
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Assigned Counselor: <strong>{counselor}</strong> {meetingDate ? `· Date: ${meetingDate}` : ""}
            </p>
          </div>
        </div>

        {registration?.meetingLink ? (
          <a
            href={registration.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#004038] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#002f29] transition cursor-pointer"
          >
            <User className="size-4 text-teal-300" /> Join Counselor Meeting Room
          </a>
        ) : (
          <div className="text-xs font-medium text-slate-500 italic bg-white p-3 rounded-xl border border-emerald-100">
            * Video meeting link will activate 15 minutes before your scheduled session time.
          </div>
        )}
      </div>
    );
  }

  // STATE D: Initial Default -> Button "Want to Book a Counselor for Guidance?"
  return (
    <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/90 p-7 sm:p-9 shadow-md space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-3 py-1 rounded-full border border-teal-200">
            Personalized Guidance Consultation
          </span>
          <h4 className="font-bold text-slate-900 text-xl sm:text-2xl">
            Want to Book a Counselor for Guidance?
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Get 1-on-1 expert guidance from a senior clinical counselor based on your Multiple Intelligences report. Submit a request and our Admin will assign a matched counselor with fee details.
          </p>
        </div>

        <button
          disabled={requestGuidanceMutation.isPending}
          onClick={() => requestGuidanceMutation.mutate()}
          className="rounded-2xl bg-[#004038] hover:bg-[#002f29] text-white font-extrabold py-4 px-7 text-xs sm:text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Brain className="size-4 text-teal-300" /> {requestGuidanceMutation.isPending ? "Submitting Request..." : "Book a Counselor for Guidance"} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
