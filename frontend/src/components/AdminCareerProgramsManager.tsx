import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, GraduationCap, CheckCircle, XCircle, Clock, Search, MapPin, Phone, User, Building2 } from "lucide-react";
import API from "@/lib/api";

export const AdminCareerProgramsManager: React.FC<{ activeSubTab?: "selection" | "training" }> = ({
  activeSubTab = "selection",
}) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"selection" | "training">(activeSubTab);
  const [search, setSearch] = useState("");

  // 1. Fetch Career Selection Registrations
  const { data: selectionData, isLoading: selectionLoading } = useQuery({
    queryKey: ["adminCareerSelectionRegistrations"],
    queryFn: () => API.careerPrograms.getCareerSelectionRegistrations(),
  });

  // 2. Fetch Counseling Training Enrollments
  const { data: trainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ["adminCounselingTrainingEnrollments"],
    queryFn: () => API.careerPrograms.getTrainingEnrollments(),
  });

  const selectionRegistrations = selectionData?.registrations || [];
  const trainingEnrollments = trainingData?.enrollments || [];

  const updateSelectionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      API.careerPrograms.updateCareerSelectionStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      API.careerPrograms.updateTrainingEnrollmentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingEnrollments"] });
    },
  });

  const filteredSelection = selectionRegistrations.filter(
    (r: any) =>
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.schoolOrgName?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  const filteredTraining = trainingEnrollments.filter(
    (e: any) =>
      e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.programTitle?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search)
  );

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState({
    title: "",
    description: "",
    startDate: "15th October 2026",
    duration: "8 Weeks",
    fee: 4999,
    instructor: "Senior Clinical Psychologist",
    totalSeats: 30,
    category: "CBT Certification",
  });

  const createProgramMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.createTrainingProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["counselingTrainingPrograms"] });
      setShowProgramModal(false);
      setProgramForm({
        title: "",
        description: "",
        startDate: "15th October 2026",
        duration: "8 Weeks",
        fee: 4999,
        instructor: "Senior Clinical Psychologist",
        totalSeats: 30,
        category: "CBT Certification",
      });
    },
  });

  const handleCreateProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProgramMutation.mutate(programForm);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("selection")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === "selection"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Briefcase className="size-4" /> Career Selection ({selectionRegistrations.length})
          </button>
          <button
            onClick={() => setSubTab("training")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              subTab === "training"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <GraduationCap className="size-4" /> Counseling Training ({trainingEnrollments.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {subTab === "training" && (
            <button
              onClick={() => setShowProgramModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
            >
              + Create Program Cohort
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, org..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
        </div>
      </div>

      {/* SUB TAB 1: CAREER SELECTION REGISTRATIONS */}
      {subTab === "selection" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {selectionLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Career Selection Registrations...</div>
          ) : filteredSelection.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No career selection registrations found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Applicant Name</th>
                  <th className="p-4">School / Organization</th>
                  <th className="p-4">Location & Age</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredSelection.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-teal-400" />
                        <span>{r.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4">{r.schoolOrgName}</td>
                    <td className="p-4 text-slate-400">
                      {r.city}, {r.state} ({r.age} yrs)
                    </td>
                    <td className="p-4 font-mono text-teal-300">{r.phone}</td>
                    <td className="p-4">
                      {r.status === "approved" ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Approved (Access Granted)
                        </span>
                      ) : r.status === "rejected" ? (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateSelectionMutation.mutate({ id: r._id, status: "approved" })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition"
                        >
                          Approve Permission
                        </button>
                        <button
                          onClick={() => updateSelectionMutation.mutate({ id: r._id, status: "rejected" })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-red-300 font-bold text-[11px] transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB TAB 2: COUNSELING TRAINING ENROLLMENTS */}
      {subTab === "training" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {trainingLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Counseling Training Enrollments...</div>
          ) : filteredTraining.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No counseling training enrollments found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Participant Name</th>
                  <th className="p-4">Program Cohort</th>
                  <th className="p-4">Org & Profession</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredTraining.map((e: any) => (
                  <tr key={e._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-cyan-400" />
                        <span>{e.fullName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-cyan-200">{e.programTitle}</td>
                    <td className="p-4">{e.orgName} ({e.profession})</td>
                    <td className="p-4 font-mono text-cyan-300">{e.phone}</td>
                    <td className="p-4">
                      {e.status === "confirmed" ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Confirmed Seat
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Pending Confirmation
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateEnrollmentMutation.mutate({ id: e._id, status: "confirmed" })}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition"
                        >
                          Confirm Seat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREATE PROGRAM COHORT MODAL */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">Create Counseling Training Program Cohort</h3>

            <form onSubmit={handleCreateProgramSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={programForm.title}
                  onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                  placeholder="e.g. Clinical CBT & Diagnostic Assessment Mastery"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="Program overview, syllabus, learning outcomes..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="text"
                    required
                    value={programForm.startDate}
                    onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                    placeholder="e.g. 15th October 2026"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={programForm.duration}
                    onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                    placeholder="e.g. 8 Weeks (Weekend Batches)"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Enrollment Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={programForm.fee}
                    onChange={(e) => setProgramForm({ ...programForm, fee: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Seats</label>
                  <input
                    type="number"
                    required
                    value={programForm.totalSeats}
                    onChange={(e) => setProgramForm({ ...programForm, totalSeats: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Instructor / Lead Expert</label>
                <input
                  type="text"
                  value={programForm.instructor}
                  onChange={(e) => setProgramForm({ ...programForm, instructor: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sharma (Senior Clinical Psychologist)"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProgramMutation.isPending}
                  className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
                >
                  Create Program Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
