import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Calendar, Clock, Users, CheckCircle2, ArrowRight, ShieldCheck, X, User, Phone as PhoneIcon, Building2, Briefcase } from "lucide-react";
import API from "@/lib/api";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/counseling-training")({
  component: CounselingTrainingPage,
});

function CounselingTrainingPage() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [show24hPopup, setShow24hPopup] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    country: "India",
    state: "",
    city: "",
    orgName: "",
    profession: "",
    phone: "",
  });

  const { data: programsData, isLoading } = useQuery({
    queryKey: ["trainingPrograms"],
    queryFn: () => API.careerPrograms.getTrainingPrograms(),
  });

  const programs = programsData?.programs || [];

  const enrollMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.enrollTrainingProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      setSelectedProgram(null);
      setShow24hPopup(true);
    },
  });

  const handleOpenEnroll = (program: any) => {
    setSelectedProgram(program);
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !isSignedIn) return;
    enrollMutation.mutate({
      programId: selectedProgram._id,
      ...form,
    });
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-cyan-800 to-teal-900 p-8 sm:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 backdrop-blur-md">
                <GraduationCap className="size-4 text-cyan-300" />
                Clinical Skill Certification
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Counseling Training Program
              </h1>
              <p className="text-cyan-100/90 text-sm sm:text-base leading-relaxed">
                Explore upcoming clinical training cohorts, CBT masterclasses, and hands-on supervision programs to elevate your counseling practice.
              </p>
            </div>
            <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-2xl text-slate-900">Upcoming Training Programs</h2>
              <p className="text-xs text-slate-500 mt-1">Select an active cohort to check program dates, syllabus, and enroll.</p>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-teal-100 text-teal-800 text-xs font-bold px-3.5 py-1">
              {programs.length} Cohorts Active
            </span>
          </div>

          {/* Programs Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
              ))
            ) : (
              programs.map((prog: any) => (
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
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {prog.availableSeats} Seats Left
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

                    <button
                      onClick={() => handleOpenEnroll(prog)}
                      className="rounded-2xl bg-[#004038] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#002f29] hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      Enroll Now <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProgram(null)}
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
                onClick={() => setSelectedProgram(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="size-5" />
              </button>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-100">
                  Program Enrollment
                </span>
                <h3 className="font-bold text-slate-900 text-xl mt-1">{selectedProgram.title}</h3>
                <p className="text-xs text-slate-500">Fee: ₹{selectedProgram.fee} • Starts {selectedProgram.startDate}</p>
              </div>

              {!isSignedIn ? (
                <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-4 border border-slate-200">
                  <p className="text-xs text-slate-600">Please sign in to complete your enrollment registration.</p>
                  <SignInButton mode="modal">
                    <button className="w-full rounded-xl bg-[#004038] py-3 text-xs font-bold text-white shadow hover:bg-[#002f29] transition">
                      Sign In to Enroll
                    </button>
                  </SignInButton>
                </div>
              ) : (
                <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
                  {/* 1. Full Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">1. Full Name</label>
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
                      <label className="block text-slate-700 font-bold mb-1">Country</label>
                      <input
                        type="text"
                        required
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">State</label>
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
                      <label className="block text-slate-700 font-bold mb-1">City</label>
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
                      <label className="block text-slate-700 font-bold mb-1">Organization Name</label>
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
                      <label className="block text-slate-700 font-bold mb-1">Profession</label>
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
                    <label className="block text-slate-700 font-bold mb-1">4. Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-slate-900 focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none transition"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={enrollMutation.isPending}
                      className="w-full rounded-xl bg-[#004038] py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#002f29] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      Complete Enrollment Registration <ArrowRight className="size-4" />
                    </button>
                  </div>
                </form>
              )}
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
                <h3 className="font-bold text-2xl text-slate-900">Enrollment Submitted!</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our Program Team will connect with you within 24 hours on your registered phone number to confirm your cohort seat.
                </p>
              </div>

              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-xs text-cyan-800 font-medium">
                Application Status: <strong>Pending Confirmation</strong>
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
