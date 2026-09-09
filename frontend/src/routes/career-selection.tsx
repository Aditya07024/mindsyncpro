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
    <AppShell>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#004038] to-[#01584c] p-8 sm:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-200 backdrop-blur-md">
                <Briefcase className="size-4 text-teal-300" />
                Specialized Career Guidance
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Career Selection Program
              </h1>
              <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed">
                Discover your ideal counseling specialization, assess your psychological competencies, and receive expert mentorship to build a flourishing counseling career.
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
                Please sign in to register for the Career Selection Program and access your personalized career assessment portal.
              </p>
              <div className="pt-2">
                <SignInButton mode="modal">
                  <button className="w-full rounded-2xl bg-[#004038] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer">
                    Sign In to Apply
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : registration && registration.status === "approved" ? (
            /* APPROVED VIEW: Career Selection Program Dashboard */
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-center gap-4">
                <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-lg">Application Approved!</h3>
                  <p className="text-xs text-emerald-700">Welcome to your Career Selection Program Dashboard. Your personalized career roadmaps and assessment tools are unlocked below.</p>
                </div>
              </div>

              {/* Career Selection Program Dashboard Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Psychological Assessment</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Evaluate your core counseling strengths, active listening aptitude, and ideal therapy domain fit.</p>
                  <button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 text-xs shadow transition">Start Assessment</button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                    <BookOpen className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Career Pathway Map</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Detailed breakdown of Clinical Psychology, School Counseling, Organizational Wellness, and CBT practice.</p>
                  <button className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 text-xs shadow transition">Explore Pathways</button>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="size-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Award className="size-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Mentorship Session</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">Book a 1-on-1 career guidance session with a senior licensed supervisor.</p>
                  <button className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 text-xs shadow transition">Schedule Mentorship</button>
                </div>
              </div>
            </div>
          ) : registration && registration.status === "pending" ? (
            /* PENDING REVIEW VIEW */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-amber-200 shadow-lg text-center max-w-xl mx-auto space-y-6">
              <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="size-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-amber-900">Registration Under Review</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Thank you, <strong>{registration.fullName}</strong>! Your application for <strong>{registration.schoolOrgName}</strong> has been received. Our career counseling team is reviewing your profile and will connect with you within 24 hours.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 font-medium">
                Status: Pending Admin Approval • Phone: {registration.phone}
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM VIEW */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-2xl mx-auto space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Career Selection Registration</h2>
                <p className="text-xs text-slate-500 mt-1">Please fill in your details to apply for personalized career selection mentorship.</p>
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

                {/* 2. Country, State, City */}
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

                {/* 3. School / Organization Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">3. School / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={form.schoolOrgName}
                    onChange={(e) => setForm({ ...form, schoolOrgName: e.target.value })}
                    placeholder="Enter your school, college, or company name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition"
                  />
                </div>

                {/* 4. Age and Phone No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">4. Age</label>
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">5. Phone Number</label>
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full rounded-2xl bg-[#004038] py-4 text-base font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    Register for Career Selection Program <ArrowRight className="size-5" />
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
                <h3 className="font-bold text-2xl text-slate-900">Registration Successful!</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our Career Selection Team will connect with you within <strong>24 hours</strong> on your registered phone number.
                </p>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-xs text-teal-800 font-medium">
                Application Status: <strong>Pending Admin Review</strong>
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
