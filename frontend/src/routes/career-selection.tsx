import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, CheckCircle2, Clock, ShieldCheck, Sparkles, X, MapPin, Building2, User, Phone as PhoneIcon, Award, ArrowRight, BookOpen, FileText } from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";

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
    registerMutation.mutate(form);
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
                First, please sign in to register for the Career Selection Program, select your preferred counseling domain, and get matched with a therapist or senior counselor for a 1-on-1 meeting.
              </p>
              <div className="pt-2">
                <SignInButton mode="modal" forceRedirectUrl="/career-selection" signUpForceRedirectUrl="/career-selection">
                  <button className="w-full rounded-2xl bg-[#004038] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer">
                    Sign In to Apply for Career Program
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : registration && registration.status === "approved" ? (
            /* APPROVED VIEW: Scheduled Counselor Meeting & Dashboard */
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 border border-emerald-200">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Application Approved
                  </div>
                  <h3 className="font-bold text-slate-900 text-2xl">Your 1-on-1 Counselor Meeting is Scheduled!</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    An admin has reviewed your career guidance application for <strong>{registration.counselingType || "Counseling Guidance"}</strong> and paired you with an expert therapist/counselor.
                  </p>
                </div>

                {registration.meetingLink && (
                  <a
                    href={registration.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-2xl bg-[#004038] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#002f29] transition flex items-center gap-2"
                  >
                    Join Video Meeting <ArrowRight className="size-4" />
                  </a>
                )}
              </div>

              {/* Scheduled Session Card Details */}
              <div className="bg-white rounded-3xl p-7 border border-teal-100 shadow-md space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                    Meeting Confirmation Details
                  </span>
                  <h4 className="font-bold text-slate-900 text-xl mt-1">1-on-1 Career Mentorship Session</h4>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">Assigned Counselor / Therapist</span>
                    <p className="text-sm font-bold text-slate-900">{registration.assignedCounselor || "Senior Clinical Counselor"}</p>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">Scheduled Date & Time</span>
                    <p className="text-sm font-bold text-teal-700">{registration.meetingDate || "Pending Schedule Confirmation"}</p>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">Counseling Specialization</span>
                    <p className="text-sm font-bold text-slate-900">{registration.counselingType || "Clinical Psychology"}</p>
                  </div>
                </div>

                {registration.adminNotes && (
                  <div className="bg-cyan-50/60 border border-cyan-100 p-4 rounded-2xl text-xs text-cyan-900 space-y-1">
                    <strong className="font-bold">Message from Admin / Mentor:</strong>
                    <p>{registration.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Career Assessment Tools Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Psychological Aptitude Test</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Evaluate your core counseling strengths, active listening aptitude, and therapy domain fit.</p>
                  <button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 text-xs shadow transition cursor-pointer">Start Assessment</button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                    <BookOpen className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Career Pathway Map</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Detailed breakdown of Clinical Psychology, School Counseling, Organizational Wellness, and CBT practice.</p>
                  <button className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 text-xs shadow transition cursor-pointer">Explore Pathways</button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">1-on-1 Guidance Session</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Review session notes and follow-up recommendations with your assigned therapist.</p>
                  <button className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 text-xs shadow transition cursor-pointer">View Session Notes</button>
                </div>
              </div>
            </div>
          ) : registration && registration.status === "pending" ? (
            /* PENDING REVIEW VIEW */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200 shadow-lg text-center max-w-xl mx-auto space-y-6">
              <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="size-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-amber-900">Application Under Review</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Thank you, <strong>{registration.fullName}</strong>! Your application for <strong>{registration.counselingType || "Career Selection"}</strong> has been received. Our team is reviewing your profile and will assign a counselor/therapist for your 1-on-1 meeting within 24 hours.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 font-medium">
                Status: Pending Admin Approval & Meeting Schedule • Phone: {registration.phone}
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM VIEW */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Career Selection Application</h2>
                <p className="text-xs text-slate-500 mt-1">Fill out the details below to choose the counseling domain you wish to explore and schedule a meeting with a therapist or senior counselor.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-sm">
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

                {/* 5. Career Goals / Specific Questions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">5. Career Aspirations & Questions for Your Counselor</label>
                  <textarea
                    rows={3}
                    value={form.preferredGoals}
                    onChange={(e) => setForm({ ...form, preferredGoals: e.target.value })}
                    placeholder="Briefly state your career background, target guidance topics, or questions for your therapist/counselor..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  />
                </div>

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
                  Our team will review your requested counseling domain and match you with a therapist/counselor for a 1-on-1 meeting within <strong>24 hours</strong>.
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
