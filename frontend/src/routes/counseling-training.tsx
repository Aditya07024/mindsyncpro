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
  ArrowLeft,
  ShieldCheck,
  X,
  User,
  Phone as PhoneIcon,
  Mail,
  Briefcase,
  Award,
  Loader2,
  Video,
  Sparkles,
  BookOpen,
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Star,
  HelpCircle,
  Target,
  Layers,
  BadgeCheck,
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
  const [viewingProgramId, setViewingProgramId] = useState<string | null>(null);
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

  // Fetch available public training programs
  const { data: programsData, isLoading: isProgramsLoading } = useQuery({
    queryKey: ["trainingPrograms"],
    queryFn: () => API.careerPrograms.getTrainingPrograms(),
  });

  const programs = (programsData?.programs || []).filter(
    (p: any) => p.isActive !== false && p.isActive === true
  );

  // Fetch user's own enrollments (Pending + Approved) when signed in
  const { data: myEnrollmentsData, isLoading: isMyEnrollmentsLoading } = useQuery({
    queryKey: ["myTrainingEnrollments"],
    queryFn: () => API.careerPrograms.getMyTrainingEnrollments(),
    enabled: !!isSignedIn,
  });

  const myEnrollments = myEnrollmentsData?.enrollments || [];

  // Extract unique categories
  const categories = [
    "All",
    ...(Array.from(new Set(programs.map((p: any) => p.category).filter(Boolean))) as string[]),
  ];

  const filteredPrograms = programs.filter((prog: any) => {
    if (prog.isActive === false) return false;
    const matchesCategory = selectedCategory === "All" || prog.category === selectedCategory;
    const matchesSearch =
      prog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prog.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Determine if we should show the Full Rich Program Showcase:
  // - Automatically when there is exactly 1 active program
  // - Or when the visitor clicks "View Full Program Details & Syllabus" on a cohort card
  const activeDetailProgram =
    programs.length === 1
      ? programs[0]
      : viewingProgramId
      ? programs.find((p: any) => String(p._id) === String(viewingProgramId)) || null
      : null;

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

  const handleViewProgramDetail = (programId: string) => {
    setViewingProgramId(programId);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
      } catch {
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
      <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Enrolled Candidate Dashboard (shown when signed in & has enrollments) */}
          {isLoaded && isSignedIn && myEnrollments.length > 0 && (
            <MyEnrolledProgramsSection
              enrollments={myEnrollments}
              isLoading={isMyEnrollmentsLoading}
            />
          )}

          {/* Loading State */}
          {isProgramsLoading ? (
            <div className="space-y-6">
              <div className="h-80 rounded-[36px] bg-slate-200 animate-pulse" />
              <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            </div>
          ) : activeDetailProgram ? (
            /* FULL RICH IIT-JAMMU-STYLE PROGRAM SHOWCASE */
            <div className="space-y-6">
              {programs.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewingProgramId(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#004038] transition cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    Back to All Training Cohorts ({programs.length})
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {programs.map((p: any) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => handleViewProgramDetail(p._id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                          String(p._id) === String(activeDetailProgram._id)
                            ? "bg-[#004038] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {p.title.length > 34 ? `${p.title.slice(0, 34)}…` : p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <RichProgramDetailShowcase
                prog={activeDetailProgram}
                isSignedIn={Boolean(isLoaded && isSignedIn)}
                existingEnrollment={myEnrollments.find(
                  (e: any) =>
                    String(e.programId?._id || e.programId) === String(activeDetailProgram._id)
                )}
                onEnroll={() => handleOpenEnroll(activeDetailProgram)}
              />
            </div>
          ) : (
            /* MULTI-COHORT DIRECTORY VIEW */
            <>
              {/* Directory Hero Banner */}
              <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#003831] via-[#064e44] to-cyan-900 p-8 sm:p-12 text-white shadow-2xl">
                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 backdrop-blur-md border border-white/15">
                    <GraduationCap className="size-4 text-cyan-300" />
                    Clinical Skill Certification & Supervised Practice
                  </div>
                  <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                    Counseling Training Programs
                  </h1>
                  <p className="text-cyan-100/90 text-sm sm:text-base leading-relaxed">
                    Structured, mentor-guided clinical counseling & CBT training cohorts with real-world case formulation labs, ethical supervision, and verified certification.
                  </p>
                </div>
                <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-cyan-400/15 blur-3xl" />
              </div>

              {/* Category Filters & Search */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-2xl text-slate-900">Active Training Cohorts</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Explore full module-wise curriculum, deliverables, and fee breakdown before enrolling.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-3.5 py-1">
                    {programs.length} Active {programs.length === 1 ? "Cohort" : "Cohorts"}
                  </span>
                </div>

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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cohorts Grid */}
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredPrograms.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                    <GraduationCap className="size-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-slate-700 font-bold text-base">
                      No active training programs found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Try selecting another category or check back soon for upcoming cohorts.
                    </p>
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
                        whileHover={{ y: -5 }}
                        viewport={{ once: true }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-cyan-100 bg-white p-7 shadow-md transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-800 border border-cyan-100">
                              {prog.category || "Certification"}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                prog.availableSeats > 0
                                  ? "text-emerald-700 bg-emerald-50"
                                  : "text-rose-600 bg-rose-50"
                              }`}
                            >
                              {prog.availableSeats > 0
                                ? `${prog.availableSeats} Seats Left`
                                : "Cohort Full"}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-xl group-hover:text-[#004038] transition line-clamp-2">
                            {prog.title}
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {prog.aboutHeadline || prog.description}
                          </p>

                          {/* Rich Feature Pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(prog.modules) && prog.modules.length > 0 && (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                                {prog.modules.length} Curriculum Modules
                              </span>
                            )}
                            {prog.modes && (
                              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg">
                                {prog.modes}
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
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
                              <span className="truncate">Mentor: {prog.instructor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-2xl font-black text-[#004038]">
                                ₹{Number(prog.fee || 0).toLocaleString("en-IN")}
                              </span>
                              {prog.totalProgramValue && (
                                <span className="ml-2 text-xs text-slate-400 line-through font-semibold">
                                  {prog.totalProgramValue}
                                </span>
                              )}
                            </div>

                            {existingEnrollment && (
                              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                {existingEnrollment.status === "confirmed" ||
                                existingEnrollment.status === "approved"
                                  ? "Approved"
                                  : "Pending"}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleViewProgramDetail(prog._id)}
                              className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-800 transition cursor-pointer text-center"
                            >
                              Full Syllabus
                            </button>

                            {existingEnrollment ? (
                              <button
                                type="button"
                                onClick={() => handleViewProgramDetail(prog._id)}
                                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition cursor-pointer text-center"
                              >
                                View Cohort
                              </button>
                            ) : isLoaded && isSignedIn ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEnroll(prog)}
                                disabled={prog.availableSeats <= 0}
                                className={`rounded-2xl px-3 py-2.5 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1 ${
                                  prog.availableSeats > 0
                                    ? "bg-[#004038] hover:bg-[#002f29] cursor-pointer"
                                    : "bg-slate-400 cursor-not-allowed"
                                }`}
                              >
                                {prog.availableSeats > 0 ? "Enroll Now" : "Full"}
                                <ArrowRight className="size-3.5" />
                              </button>
                            ) : (
                              <SignInButton
                                mode="modal"
                                forceRedirectUrl="/counseling-training"
                                signUpForceRedirectUrl="/counseling-training"
                              >
                                <button
                                  type="button"
                                  disabled={prog.availableSeats <= 0}
                                  className={`w-full rounded-2xl px-3 py-2.5 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1 ${
                                    prog.availableSeats > 0
                                      ? "bg-[#004038] hover:bg-[#002f29] cursor-pointer"
                                      : "bg-slate-400 cursor-not-allowed"
                                  }`}
                                >
                                  {prog.availableSeats > 0 ? "Enroll Now" : "Full"}
                                  <ArrowRight className="size-3.5" />
                                </button>
                              </SignInButton>
                            )}
                          </div>
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

      {/* Enrollment & Razorpay Checkout Modal */}
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
                  Official Cohort Registration
                </span>
                <h3 className="font-bold text-slate-900 text-xl mt-1.5">{selectedProgram.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Payable Fee:{" "}
                  <strong className="text-emerald-700 font-mono text-sm">
                    ₹{Number(selectedProgram.fee || 0).toLocaleString("en-IN")}
                  </strong>{" "}
                  • Starts {selectedProgram.startDate}
                </p>
              </div>

              <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                    1. Full Name (For Certificate)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                      Country
                    </label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                      State
                    </label>
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
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                      City
                    </label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                      College / Organization
                    </label>
                    <input
                      type="text"
                      required
                      value={form.orgName}
                      onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                      placeholder="University / Clinic / Org"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                      Current Role / Course
                    </label>
                    <input
                      type="text"
                      required
                      value={form.profession}
                      onChange={(e) => setForm({ ...form, profession: e.target.value })}
                      placeholder="e.g. MA Psychology, Counselor"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px] tracking-wider">
                    4. WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                  <p className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="size-4 text-teal-700" /> Secure Razorpay Checkout + Seat Confirmation
                  </p>
                  <p>
                    Clicking below opens Razorpay to pay{" "}
                    <strong>₹{Number(selectedProgram.fee || 0).toLocaleString("en-IN")}</strong>. Once completed, our Clinical Leads verify and activate your cohort access within 24 hours.
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
                        <Lock className="size-4 text-teal-300" /> Pay ₹
                        {Number(selectedProgram.fee || 0).toLocaleString("en-IN")} & Complete Enrollment{" "}
                        <ArrowRight className="size-4" />
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
                <h3 className="font-bold text-2xl text-slate-900">
                  Payment & Enrollment Submitted!
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your fee payment was received. Your registration has been sent to our Clinical Program Leads for seat confirmation within <strong>24 hours</strong>.
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

// ============================================================================
// RICH IIT-JAMMU-STYLE PROGRAM SHOWCASE COMPONENT
// ============================================================================
function RichProgramDetailShowcase({
  prog,
  isSignedIn,
  existingEnrollment,
  onEnroll,
}: {
  prog: any;
  isSignedIn: boolean;
  existingEnrollment?: any;
  onEnroll: () => void;
}) {
  const modules: any[] = Array.isArray(prog.modules) ? prog.modules : [];
  const keyOutcomes: string[] = Array.isArray(prog.keyOutcomes) ? prog.keyOutcomes : [];
  const objectives: string[] = Array.isArray(prog.objectives) ? prog.objectives : [];
  const targetAudience: string[] = Array.isArray(prog.targetAudience) ? prog.targetAudience : [];
  const whatYouGet: string[] = Array.isArray(prog.whatYouGet) ? prog.whatYouGet : [];
  const careerItems: any[] = Array.isArray(prog.careerEnablementItems)
    ? prog.careerEnablementItems
    : [];
  const feeBreakdown: any[] = Array.isArray(prog.feeBreakdown) ? prog.feeBreakdown : [];
  const testimonials: any[] = Array.isArray(prog.testimonials) ? prog.testimonials : [];
  const faqs: any[] = Array.isArray(prog.faqs) ? prog.faqs : [];
  const tags: string[] = Array.isArray(prog.tags) ? prog.tags : [];

  // Module accordion state (Module 0 open by default)
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({ 0: true });
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    setOpenModules({ 0: true });
    setOpenFaqs({ 0: true });
  }, [prog._id]);

  const allModulesExpanded =
    modules.length > 0 && modules.every((_, idx) => Boolean(openModules[idx]));

  const toggleAllModules = () => {
    if (allModulesExpanded) {
      setOpenModules({});
    } else {
      const next: Record<number, boolean> = {};
      modules.forEach((_, idx) => {
        next[idx] = true;
      });
      setOpenModules(next);
    }
  };

  // Build quick-jump navigation dynamically based on populated sections
  const navItems = [
    { id: "about-program", label: "About Program", show: true },
    { id: "program-objectives", label: "Objectives", show: objectives.length > 0 },
    { id: "program-outline", label: "Program Outline", show: modules.length > 0 },
    {
      id: "what-you-get",
      label: "What You Get",
      show: whatYouGet.length > 0 || Boolean(prog.certificationDetails),
    },
    { id: "career-enablement", label: "Career Support", show: careerItems.length > 0 },
    { id: "fee-structure", label: "Fee Structure", show: true },
    { id: "participant-reviews", label: "Feedbacks", show: testimonials.length > 0 },
    { id: "program-faqs", label: "FAQs", show: faqs.length > 0 },
  ].filter((n) => n.show);

  const renderEnrollCTA = (fullWidth = false) => {
    if (existingEnrollment) {
      const isApproved =
        existingEnrollment.status === "confirmed" ||
        existingEnrollment.status === "approved" ||
        existingEnrollment.status === "completed";
      return (
        <div
          className={`rounded-2xl bg-emerald-500/20 border border-emerald-300/40 px-5 py-3.5 text-xs font-extrabold text-emerald-100 flex items-center justify-center gap-2 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
          {isApproved ? "Enrolled & Approved Cohort Member" : "Fee Paid • Pending Admin Verification"}
        </div>
      );
    }

    if (prog.availableSeats <= 0) {
      return (
        <button
          type="button"
          disabled
          className={`rounded-2xl bg-slate-500/60 px-6 py-4 text-sm font-bold text-white/80 cursor-not-allowed ${
            fullWidth ? "w-full" : ""
          }`}
        >
          Cohort Seats Full
        </button>
      );
    }

    if (isSignedIn) {
      return (
        <button
          type="button"
          onClick={onEnroll}
          className={`rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-7 py-4 text-sm shadow-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center justify-center gap-2 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          Enroll Now <ArrowRight className="size-4" />
        </button>
      );
    }

    return (
      <SignInButton
        mode="modal"
        forceRedirectUrl="/counseling-training"
        signUpForceRedirectUrl="/counseling-training"
      >
        <button
          type="button"
          className={`rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-7 py-4 text-sm shadow-xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center justify-center gap-2 ${
            fullWidth ? "w-full" : ""
          }`}
        >
          Enroll Now <ArrowRight className="size-4" />
        </button>
      </SignInButton>
    );
  };

  return (
    <div className="space-y-10">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#002f29] via-[#004038] to-cyan-950 p-6 sm:p-10 lg:p-12 text-white shadow-2xl border border-teal-800/60">
        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Details */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 border border-cyan-300/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                <GraduationCap className="size-3.5 text-cyan-300" />
                {prog.badgeText || "Clinical Skill Training & Internship"}
              </span>
              {prog.category && (
                <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold text-teal-100">
                  {prog.category}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  prog.availableSeats > 0
                    ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30"
                    : "bg-rose-500/20 text-rose-200 border border-rose-400/30"
                }`}
              >
                {prog.availableSeats > 0
                  ? `${prog.availableSeats} of ${prog.totalSeats} Seats Available`
                  : "Cohort Full"}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.15]">
              {prog.title}
            </h1>

            {prog.tagline && (
              <div className="inline-block rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-amber-200">
                {prog.tagline}
              </div>
            )}

            {/* Metadata Grid (Duration, Modes, Start Date, Mentor) */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl bg-white/8 border border-white/12 p-3.5 flex items-start gap-3">
                <Clock className="size-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-200/80 block">
                    Duration
                  </span>
                  <strong className="text-sm text-white">{prog.duration}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-white/8 border border-white/12 p-3.5 flex items-start gap-3">
                <Calendar className="size-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-200/80 block">
                    Cohort Starts
                  </span>
                  <strong className="text-sm text-white">{prog.startDate}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-white/8 border border-white/12 p-3.5 flex items-start gap-3">
                <Video className="size-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-200/80 block">
                    Training Modes
                  </span>
                  <strong className="text-sm text-white">
                    {prog.modes || "Online Live Interactive | Supervised Case Labs"}
                  </strong>
                </div>
              </div>

              <div className="rounded-2xl bg-white/8 border border-white/12 p-3.5 flex items-start gap-3">
                <User className="size-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-200/80 block">
                    Clinical Lead / Mentor
                  </span>
                  <strong className="text-sm text-white">{prog.instructor}</strong>
                </div>
              </div>
            </div>

            {prog.modeNote && (
              <p className="text-xs text-cyan-100/85 italic">{prog.modeNote}</p>
            )}
          </div>

          {/* Right Hero Registration Card */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 space-y-5 shadow-2xl">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-200">
                  Program Fee
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-white">
                    ₹{Number(prog.fee || 0).toLocaleString("en-IN")}
                  </span>
                  {prog.totalProgramValue && (
                    <span className="text-sm text-cyan-200/70 line-through font-semibold">
                      Value {prog.totalProgramValue}
                    </span>
                  )}
                </div>
                {prog.earlyCohortNote && (
                  <p className="text-[11px] text-emerald-200 leading-relaxed pt-1">
                    {prog.earlyCohortNote}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs text-cyan-50 border-t border-white/15 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
                  <span>Live Mentor-Guided Clinical Supervision</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
                  <span>Practical Case Formulation & Role-Play Labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
                  <span>Verified Training & Internship Certificate</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {renderEnrollCTA(true)}
                {modules.length > 0 && (
                  <a
                    href="#program-outline"
                    className="block w-full text-center rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 py-3 text-xs font-bold text-white transition"
                  >
                    Explore {modules.length}-Module Syllabus ↓
                  </a>
                )}
              </div>

              {prog.organizerInitiative && (
                <p className="text-[11px] text-center text-cyan-200/80 font-medium pt-1 border-t border-white/10">
                  {prog.organizerInitiative}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. STICKY QUICK-JUMP NAVIGATION BAR */}
      {navItems.length > 2 && (
        <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-md flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#004038] hover:text-white transition whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </div>

          {!existingEnrollment && prog.availableSeats > 0 && (
            <div className="hidden md:block shrink-0">
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={onEnroll}
                  className="rounded-xl bg-[#004038] hover:bg-[#002f29] text-white font-bold px-4 py-2 text-xs transition cursor-pointer"
                >
                  Enroll • ₹{Number(prog.fee || 0).toLocaleString("en-IN")}
                </button>
              ) : (
                <SignInButton
                  mode="modal"
                  forceRedirectUrl="/counseling-training"
                  signUpForceRedirectUrl="/counseling-training"
                >
                  <button
                    type="button"
                    className="rounded-xl bg-[#004038] hover:bg-[#002f29] text-white font-bold px-4 py-2 text-xs transition cursor-pointer"
                  >
                    Enroll • ₹{Number(prog.fee || 0).toLocaleString("en-IN")}
                  </button>
                </SignInButton>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. ABOUT THE PROGRAM, KEY OUTCOMES & ELIGIBILITY */}
      <section
        id="about-program"
        className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-900">
            <Sparkles className="size-3.5 text-teal-700" />
            About the Program
          </div>

          {prog.aboutHeadline && (
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {prog.aboutHeadline}
            </h2>
          )}

          <div className="text-sm sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line space-y-4">
            {prog.description}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Key Outcomes ("By the end of this program...") */}
        {keyOutcomes.length > 0 && (
          <div className="rounded-3xl bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-white border border-teal-200/70 p-6 sm:p-8 space-y-5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              By the end of this program, you won&apos;t just know theory — you will:
            </h3>
            <div className="grid sm:grid-cols-2 gap-3.5">
              {keyOutcomes.map((outcome, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-teal-100 shadow-xs"
                >
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who Should Attend / Eligibility */}
        {targetAudience.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="size-5 text-[#004038]" />
              Who Should Attend
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {targetAudience.map((aud, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800"
                >
                  <span className="size-2 rounded-full bg-teal-600 shrink-0" />
                  <span>{aud}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 4. PROGRAM OBJECTIVES */}
      {objectives.length > 0 && (
        <section
          id="program-objectives"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-200 px-3.5 py-1 text-xs font-bold text-cyan-900">
              <Target className="size-3.5 text-cyan-700" />
              Core Goals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              Program Objectives
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {objectives.map((obj, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 hover:border-cyan-300 hover:bg-white transition"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#004038] text-white font-black text-xs">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed pt-1">
                  {obj}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. PROGRAM OUTLINE (EXPANDABLE CURRICULUM MODULES) */}
      {modules.length > 0 && (
        <section
          id="program-outline"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-teal-900">
                <Layers className="size-3.5 text-teal-700" />
                Structured Syllabus
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
                Program Outline ({modules.length} Modules)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any module below to inspect detailed clinical topics and practical learning outcomes.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAllModules}
              className="self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {allModulesExpanded ? "Collapse All Modules" : "Expand All Modules"}
            </button>
          </div>

          <div className="space-y-3.5">
            {modules.map((mod, idx) => {
              const isOpen = Boolean(openModules[idx]);
              const modTopics: string[] = Array.isArray(mod.topics) ? mod.topics : [];

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isOpen
                      ? "border-teal-400 bg-teal-50/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenModules((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#004038] text-white font-extrabold text-xs">
                        M{idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          {mod.title}
                        </h3>
                        {modTopics.length > 0 && (
                          <span className="text-[11px] font-medium text-slate-500">
                            {modTopics.length} Core Topics
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      {isOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                      {modTopics.length > 0 && (
                        <ul className="space-y-2.5 pt-2">
                          {modTopics.map((topic, tIdx) => (
                            <li
                              key={tIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                            >
                              <CheckCircle2 className="size-4 text-teal-600 shrink-0 mt-0.5" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {mod.learningOutcome && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3.5 flex items-start gap-2.5">
                          <BadgeCheck className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                            <strong>Learning Outcome:</strong> {mod.learningOutcome}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. WHAT YOU GET & VERIFIED CERTIFICATION */}
      {(whatYouGet.length > 0 || prog.certificationDetails) && (
        <section
          id="what-you-get"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-8"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-900">
              <Award className="size-3.5 text-emerald-700" />
              Program Deliverables
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              What You Get
            </h2>
          </div>

          {whatYouGet.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {whatYouGet.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed pt-1">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          )}

          {prog.certificationDetails && (
            <div className="rounded-3xl bg-gradient-to-r from-[#004038] to-teal-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-lg">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-300/40 text-amber-300">
                <Award className="size-8" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                  Verified Clinical Training & Supervision Certificate
                </span>
                <p className="text-xs sm:text-sm text-teal-50 leading-relaxed">
                  {prog.certificationDetails}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 7. CAREER ENABLEMENT & SUPERVISION BONUSES */}
      {careerItems.length > 0 && (
        <section
          id="career-enablement"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-200 px-3.5 py-1 text-xs font-bold text-cyan-900">
              <Briefcase className="size-3.5 text-cyan-700" />
              Career Enablement & Readiness
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              Career Enablement Guidance
            </h2>
            {prog.careerEnablementSubtitle && (
              <p className="text-xs sm:text-sm text-slate-600 pt-1">
                {prog.careerEnablementSubtitle}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {careerItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-cyan-100 bg-gradient-to-b from-cyan-50/40 to-white p-6 space-y-2.5 shadow-xs"
              >
                <div className="size-10 rounded-2xl bg-[#004038] text-cyan-200 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                {item.description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. TRANSPARENT FEE STRUCTURE & VALUE BREAKDOWN */}
      <section
        id="fee-structure"
        className="scroll-mt-20 bg-gradient-to-br from-slate-900 via-[#042f2a] to-slate-900 rounded-[36px] p-6 sm:p-10 text-white shadow-xl space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/30 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
              Fee Structure & Value Breakdown
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white pt-1">
              Transparent Cohort Investment
            </h2>
          </div>

          {prog.totalProgramValue && (
            <div className="text-left sm:text-right">
              <span className="text-xs text-teal-200/80 block">Total Program Value</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                {prog.totalProgramValue}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {feeBreakdown.length > 0 && (
            <div className="lg:col-span-7 space-y-3">
              {feeBreakdown.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/8 border border-white/12 px-4 py-3.5 text-xs sm:text-sm"
                >
                  <span className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    {row.item}
                  </span>
                  {row.value && (
                    <span className="font-mono font-bold text-cyan-200 shrink-0">
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`${
              feeBreakdown.length > 0 ? "lg:col-span-5" : "lg:col-span-12 max-w-xl mx-auto w-full"
            } rounded-3xl bg-white/10 border border-white/20 p-6 sm:p-7 space-y-5`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                Cohort Registration Fee
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  ₹{Number(prog.fee || 0).toLocaleString("en-IN")}
                </span>
                {prog.totalProgramValue && (
                  <span className="text-sm text-white/60 line-through font-semibold">
                    {prog.totalProgramValue}
                  </span>
                )}
              </div>
            </div>

            {prog.earlyCohortNote && (
              <p className="text-xs text-emerald-200 leading-relaxed bg-emerald-500/10 border border-emerald-400/25 rounded-2xl p-3.5">
                {prog.earlyCohortNote}
              </p>
            )}

            <div>{renderEnrollCTA(true)}</div>
          </div>
        </div>
      </section>

      {/* 9. LEARNING & COMPLETION SUPPORT ASSURANCE */}
      {prog.supportAssuranceText && (
        <section className="rounded-[32px] bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xs">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#004038] text-emerald-300 shadow-md">
            <ShieldCheck className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {prog.supportAssuranceTitle || "Learning & Completion Support Assurance"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {prog.supportAssuranceText}
            </p>
          </div>
        </section>
      )}

      {/* 10. PARTICIPANT FEEDBACKS / TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section
          id="participant-reviews"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-xs font-bold text-amber-900">
              <Star className="size-3.5 text-amber-600 fill-amber-500" />
              Participant Feedbacks
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              What Past Trainees Say
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/90 bg-slate-50/50 p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(Math.min(5, Math.max(1, Number(t.rating || 5))))].map((_, s) => (
                      <Star key={s} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/70">
                  <div className="font-bold text-sm text-slate-900">{t.name}</div>
                  {t.role && <div className="text-xs text-slate-500">{t.role}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. FREQUENTLY ASKED QUESTIONS (FAQS) */}
      {faqs.length > 0 && (
        <section
          id="program-faqs"
          className="scroll-mt-20 bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-800">
              <HelpCircle className="size-3.5 text-teal-700" />
              Have Questions?
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 pt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = Boolean(openFaqs[idx]);
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/40"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqs((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-50 transition"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                      {isOpen ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 12. INITIATIVE ATTRIBUTION, QUERY CONTACT & OFFICIAL CAUTION NOTE */}
      {(prog.organizerInitiative ||
        prog.contactEmail ||
        prog.contactPhone ||
        prog.cautionNote) && (
        <section className="rounded-[32px] bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900">
                {prog.organizerInitiative ||
                  "An Initiative of My Mind Therapy Friend (MindFirst Clinical Wellness)"}
              </h3>
              <p className="text-xs text-slate-500">
                Need help with eligibility, batch timings, or institutional group enrollments? Reach out to our program desk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              {prog.contactEmail && (
                <a
                  href={`mailto:${prog.contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 transition"
                >
                  <Mail className="size-4 text-teal-700" />
                  {prog.contactEmail}
                </a>
              )}
              {prog.contactPhone && (
                <a
                  href={`tel:${prog.contactPhone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 transition"
                >
                  <PhoneIcon className="size-4 text-teal-700" />
                  {prog.contactPhone}
                </a>
              )}
            </div>
          </div>

          {prog.cautionNote && (
            <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Official Notice:</strong> {prog.cautionNote}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: MY ENROLLED & APPROVED CLINICAL PROGRAMS SECTION
// ============================================================================
function MyEnrolledProgramsSection({
  enrollments,
  isLoading,
}: {
  enrollments: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="h-44 rounded-3xl bg-slate-200 animate-pulse" />;
  }

  const approved = enrollments.filter(
    (e) => e.status === "confirmed" || e.status === "approved" || e.status === "completed"
  );
  const pending = enrollments.filter((e) => e.status === "pending");

  return (
    <div className="bg-white rounded-[36px] border border-teal-500/30 p-6 sm:p-10 shadow-xl space-y-8">
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
                    <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">{title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                      {prog.aboutHeadline ||
                        prog.description ||
                        "Supervised clinical certification and case formulation masterclass."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-emerald-100/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Start Date
                      </span>
                      <strong className="text-slate-900">
                        {prog.startDate || "Upcoming Cohort"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Instructor
                      </span>
                      <strong className="text-slate-900 truncate block">
                        {prog.instructor || "Clinical Lead"}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() =>
                        toast.info(
                          "Cohort live video room link will activate before scheduled sessions."
                        )
                      }
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
                      <Clock className="size-3.5 text-amber-600" /> Payment Received • Pending Approval
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                      Paid: ₹{fee}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
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
