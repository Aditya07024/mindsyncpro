import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth, useUser, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
  User,
  Phone as PhoneIcon,
  Building2,
  Briefcase,
  Award,
  Loader2,
  Video,
  Sparkles,
  BookOpen,
  Lock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { openTrainingEnrollmentCheckout } from "@/lib/razorpay";

export const Route = createFileRoute("/counseling-training")({
  component: CounselingTrainingPage,
});

function CounselingTrainingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [show24hPopup, setShow24hPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [form, setForm] = useState({
    fullName: "",
    country: "India",
    state: "",
    city: "",
    orgName: "",
    profession: "",
    phone: "",
  });

  // Auto-fill user details from Clerk when loaded
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || user.firstName || "",
      }));
    }
  }, [user]);

  // Fetch available training programs
  const { data: programsData, isLoading: isProgramsLoading } = useQuery({
    queryKey: ["trainingPrograms"],
    queryFn: () => API.careerPrograms.getTrainingPrograms(),
  });

  const programs = programsData?.programs || [];

  // Fetch user's own enrollments (Pending + Approved)
  const { data: myEnrollmentsData, isLoading: isMyEnrollmentsLoading } = useQuery({
    queryKey: ["myTrainingEnrollments"],
    queryFn: () => API.careerPrograms.getMyTrainingEnrollments(),
    enabled: !!isSignedIn,
  });

  const myEnrollments = myEnrollmentsData?.enrollments || [];

  // Extract unique categories
  const categories = [
    "All",
    ...Array.from(new Set(programs.map((p: any) => p.category).filter(Boolean))) as string[],
  ];

  const filteredPrograms = programs.filter((prog: any) => {
    const matchesCategory = selectedCategory === "All" || prog.category === selectedCategory;
    const matchesSearch =
      prog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const enrollMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.enrollTrainingProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["myTrainingEnrollments"] });
      setSelectedProgram(null);
      setIsProcessingPayment(false);
      setShow24hPopup(true);
      toast.success("Payment successful & enrollment submitted for Admin approval!");
    },
    onError: (err: any) => {
      setIsProcessingPayment(false);
      toast.error(err?.message || "Failed to submit enrollment");
    },
  });

  const handleOpenEnroll = (program: any) => {
    setSelectedProgram(program);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;

    if (
      !form.fullName.trim() ||
      !form.state.trim() ||
      !form.city.trim() ||
      !form.orgName.trim() ||
      !form.profession.trim() ||
      !form.phone.trim()
    ) {
      toast.error("Please fill out all required fields before completing enrollment.");
      return;
    }

    const feeAmount = Number(selectedProgram.fee || 0);

    if (feeAmount > 0) {
      setIsProcessingPayment(true);
      try {
        await openTrainingEnrollmentCheckout({
          amount: feeAmount,
          programTitle: selectedProgram.title,
          fullName: form.fullName,
          phone: form.phone,
          onSuccess: (paymentId) => {
            enrollMutation.mutate({
              programId: selectedProgram._id,
              ...form,
              paymentStatus: "paid",
              paymentId,
              fee: feeAmount,
            });
          },
          onCancel: () => setIsProcessingPayment(false),
        });
      } catch (err: any) {
        setIsProcessingPayment(false);
        toast.error("Payment checkout failed to open");
      }
    } else {
      enrollMutation.mutate({
        programId: selectedProgram._id,
        ...form,
        paymentStatus: "free",
        fee: 0,
      });
    }
  };

  return (
    <AppShell requireAuth={false} hideSOS={true} hideBottomNav={true}>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-cyan-800 to-teal-900 p-8 sm:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 backdrop-blur-md">
                <GraduationCap className="size-4 text-cyan-300" />
                Clinical Skill Certification & Supervision
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Counseling Training Program
              </h1>
              <p className="text-cyan-100/90 text-sm sm:text-base leading-relaxed">
                Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies.
              </p>
            </div>
            <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* AUTH GATE CHECK: Require Clerk Login to access Training Program */}
          {!isLoaded ? (
            <div className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
          ) : !isSignedIn ? (
            <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-slate-200 shadow-xl text-center max-w-xl mx-auto space-y-6">
              <div className="size-16 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center mx-auto shadow-inner">
                <GraduationCap className="size-8 text-cyan-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Sign In Required</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Please sign in with your Clerk account to view active Counseling Training Program cohorts, access CBT supervision masterclasses, enroll in clinical certifications, and track your approved programs.
              </p>
              <div className="pt-2">
                <SignInButton mode="modal" forceRedirectUrl="/counseling-training" signUpForceRedirectUrl="/counseling-training">
                  <button className="w-full rounded-2xl bg-[#004038] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer">
                    Sign In to Access Counseling Training
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : (
            <>
              {/* COMPONENT: MY ENROLLED & APPROVED CLINICAL PROGRAMS SECTION */}
              {myEnrollments.length > 0 && (
                <MyEnrolledProgramsSection enrollments={myEnrollments} isLoading={isMyEnrollmentsLoading} />
              )}

              {/* Section Header with Category Filters & Search */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-2xl text-slate-900">Upcoming Training Cohorts</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Select an active training program updated by our clinical leads to view syllabus and enroll.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-3.5 py-1">
                    {programs.length} Active Cohorts
                  </span>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-[#004038] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search programs or topics..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Programs Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isProgramsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
                  ))
                ) : filteredPrograms.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <GraduationCap className="size-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-700 font-bold text-base">No programs found</h3>
                    <p className="text-xs text-slate-500 mt-1">Try selecting another category or clear your search query.</p>
                  </div>
                ) : (
                  filteredPrograms.map((prog: any) => {
                    const existingEnrollment = myEnrollments.find(
                      (e: any) => String(e.programId?._id || e.programId) === String(prog._id)
                    );

                    return (
                      <motion.div
                        key={prog._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -6 }}
                        viewport={{ once: true }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-cyan-100 bg-white p-7 shadow-md transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-800 border border-cyan-100">
                              {prog.category || "Certification"}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                prog.availableSeats > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                              }`}
                            >
                              {prog.availableSeats > 0 ? `${prog.availableSeats} Seats Left` : "Cohort Full"}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-xl group-hover:text-cyan-800 transition line-clamp-2">
                            {prog.title}
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {prog.description}
                          </p>

                          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-cyan-600 shrink-0" />
                              <span>Starts: {prog.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-cyan-600 shrink-0" />
                              <span>Duration: {prog.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-cyan-600 shrink-0" />
                              <span className="truncate">Instructor: {prog.instructor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-black text-[#004038]">
                              ₹{prog.fee}
                            </span>
                          </div>

                          {existingEnrollment ? (
                            <span className="rounded-2xl bg-emerald-100 text-emerald-800 px-4 py-2 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="size-4 text-emerald-600" />
                              {existingEnrollment.status === "confirmed" || existingEnrollment.status === "approved"
                                ? "Enrolled & Approved"
                                : "Application Received"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenEnroll(prog)}
                              disabled={prog.availableSeats <= 0}
                              className={`rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition flex items-center gap-1.5 ${
                                prog.availableSeats > 0
                                  ? "bg-[#004038] hover:bg-[#002f29] hover:scale-105 active:scale-95 cursor-pointer"
                                  : "bg-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {prog.availableSeats > 0 ? "Enroll Now" : "Full"} <ArrowRight className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isProcessingPayment) setSelectedProgram(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button
                disabled={isProcessingPayment}
                onClick={() => setSelectedProgram(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                  Program Enrollment
                </span>
                <h3 className="font-bold text-slate-900 text-xl mt-1">{selectedProgram.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Fee: <strong className="text-emerald-700 font-mono text-sm">₹{selectedProgram.fee}</strong> • Starts {selectedProgram.startDate}
                </p>
              </div>

              <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">1. Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                {/* 2. Country, State, City */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">Country</label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">State</label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="State"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">City</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* 3. Organization Name and Profession */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={form.orgName}
                      onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                      placeholder="Hospital / Org / College"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">Profession</label>
                    <input
                      type="text"
                      required
                      value={form.profession}
                      onChange={(e) => setForm({ ...form, profession: e.target.value })}
                      placeholder="e.g. Psychologist, Student"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* 4. Phone No */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">4. Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                {/* Info Note on Razorpay & Admin Approval */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="size-4 text-teal-700" /> Razorpay Instant Checkout + Admin Verification
                  </p>
                  <p>
                    Clicking complete registration will open Razorpay to pay <strong>₹{selectedProgram.fee}</strong>. Once paid, your application will be routed to Admin for seat approval.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enrollMutation.isPending || isProcessingPayment}
                    className="w-full rounded-2xl bg-[#004038] py-4 text-sm font-bold text-white shadow-xl hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {enrollMutation.isPending || isProcessingPayment ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-teal-300" /> Processing Razorpay Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="size-4 text-teal-300" /> Pay ₹{selectedProgram.fee} & Complete Registration <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="size-20 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto text-4xl shadow-inner">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-2xl text-slate-900">Payment & Enrollment Submitted!</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your fee payment was received. Your registration has been sent to our Clinical Program Leads for admin seat approval within <strong>24 hours</strong>.
                </p>
              </div>

              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-xs text-cyan-800 font-medium">
                Status: <strong>Payment Confirmed • Awaiting Admin Approval</strong>
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

// SUB-COMPONENT: MY ENROLLED & APPROVED CLINICAL PROGRAMS SECTION
function MyEnrolledProgramsSection({ enrollments, isLoading }: { enrollments: any[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="h-44 rounded-3xl bg-slate-200 animate-pulse" />;
  }

  const approved = enrollments.filter(
    (e) => e.status === "confirmed" || e.status === "approved" || e.status === "completed"
  );
  const pending = enrollments.filter((e) => e.status === "pending");

  return (
    <div className="bg-white rounded-[36px] border border-teal-500/30 p-6 sm:p-10 shadow-xl space-y-8">
      {/* Component Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 font-bold border border-teal-200">
            <GraduationCap className="size-7 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200">
                Candidate Dashboard
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {enrollments.length} Enrolled Registrations
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
              My Clinical Training Programs
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {approved.length} Approved Programs
          </span>
        </div>
      </div>

      {/* APPROVED PROGRAMS CARDS */}
      {approved.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Award className="size-5 text-emerald-600" /> Approved & Active Clinical Cohorts
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {approved.map((item) => {
              const prog = item.programId || {};
              const title = prog.title || item.programTitle || "Clinical Training Cohort";
              const fee = item.fee || prog.fee || 0;

              return (
                <div
                  key={item._id}
                  className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-6 shadow-md space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold px-3 py-1 border border-emerald-300">
                      <CheckCircle2 className="size-3.5 text-emerald-600" /> Approved & Active Cohort
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      Fee Paid: ₹{fee} ✓
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {prog.description || "Supervised clinical certification and case formulation masterclass."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-emerald-100/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Start Date</span>
                      <strong className="text-slate-900">{prog.startDate || "15th October 2026"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Instructor</span>
                      <strong className="text-slate-900 truncate block">{prog.instructor || "Clinical Lead"}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => toast.info("Cohort live video room link will activate before scheduled sessions.")}
                      className="w-full sm:w-auto flex-1 rounded-2xl bg-[#004038] hover:bg-[#002f29] text-white font-bold py-3 px-5 text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Video className="size-4 text-teal-300" /> Join Live Cohort Session
                    </button>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-center">
                      Certification Eligible
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PENDING ADMIN APPROVAL CARDS */}
      {pending.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Clock className="size-5 text-amber-600" /> Pending Admin Approval
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {pending.map((item) => {
              const prog = item.programId || {};
              const title = prog.title || item.programTitle || "Clinical Training Cohort";
              const fee = item.fee || prog.fee || 0;

              return (
                <div
                  key={item._id}
                  className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 border border-amber-300">
                      <Clock className="size-3.5 text-amber-600" /> Payment Received • Pending Admin Approval
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      Paid: ₹{fee}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Your fee payment of <strong>₹{fee}</strong> has been received via Razorpay. Our clinical program leads are verifying your seat allocation and will approve your access within 24 hours.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-amber-100 text-xs text-amber-900 font-medium">
                    Status: <strong>Verification in progress by Super Admin</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
