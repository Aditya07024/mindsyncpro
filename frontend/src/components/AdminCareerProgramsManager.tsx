import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  MapPin,
  Phone,
  User,
  Building2,
  Edit2,
  Trash2,
  Plus,
  Eye,
  Calendar,
  Users,
  Tag,
} from "lucide-react";
import API from "@/lib/api";

export const AdminCareerProgramsManager: React.FC<{ activeSubTab?: "selection" | "training" }> = ({
  activeSubTab = "selection",
}) => {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<"selection" | "training">(activeSubTab);
  const [trainingViewMode, setTrainingViewMode] = useState<"programs" | "enrollments">("programs");
  const [search, setSearch] = useState("");

  // 1. Fetch Career Selection Registrations
  const { data: selectionData, isLoading: selectionLoading } = useQuery({
    queryKey: ["adminCareerSelectionRegistrations"],
    queryFn: () => API.careerPrograms.getCareerSelectionRegistrations(),
  });

  // 2. Fetch Counseling Training Programs (Admin view, includes inactive)
  const { data: adminProgramsData, isLoading: adminProgramsLoading } = useQuery({
    queryKey: ["adminCounselingTrainingPrograms"],
    queryFn: () => API.careerPrograms.getAdminTrainingPrograms(),
  });

  // 3. Fetch Counseling Training Enrollments
  const { data: trainingData, isLoading: trainingLoading } = useQuery({
    queryKey: ["adminCounselingTrainingEnrollments"],
    queryFn: () => API.careerPrograms.getTrainingEnrollments(),
  });

  const selectionRegistrations = selectionData?.registrations || [];
  const adminPrograms = adminProgramsData?.programs || [];
  const trainingEnrollments = trainingData?.enrollments || [];

  // 4. Fetch Active Therapists for Admin Assignment
  const { data: therapistsData } = useQuery({
    queryKey: ["therapistsList"],
    queryFn: () => API.therapist.list(),
  });

  const activeTherapists = therapistsData?.therapists || [];

  // Selection meeting schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    therapistId: "",
    assignedCounselor: "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
    guidanceFee: 499,
    meetingDate: "15th October 2026 at 11:00 AM",
    meetingLink: "https://meet.jit.si/MindSyncPro-CareerSession",
    adminNotes: "Admin assigned senior counselor for 1-on-1 guidance consultation.",
    status: "proposal_sent",
  });

  const adminAssignMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.adminAssign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
      setShowScheduleModal(false);
    },
  });

  const handleOpenScheduleModal = (r: any) => {
    setSelectedRecord(r);
    setScheduleForm({
      therapistId: r.therapistId || "",
      assignedCounselor: r.assignedCounselor || "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
      guidanceFee: r.guidanceFee || 499,
      meetingDate: r.meetingDate || "15th October 2026 at 11:00 AM",
      meetingLink: r.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
      adminNotes: r.adminNotes || "Admin assigned senior counselor for 1-on-1 guidance consultation.",
      status: "proposal_sent",
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    adminAssignMutation.mutate({
      registrationId: selectedRecord._id,
      ...scheduleForm,
    });
  };

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      API.careerPrograms.updateTrainingEnrollmentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingEnrollments"] });
    },
  });

  // Program mutations (Create, Update, Delete)
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const initialFormState = {
    title: "",
    description: "",
    startDate: "15th October 2026",
    duration: "8 Weeks (Weekend Batches)",
    fee: 4999,
    instructor: "Dr. Ananya Sharma (Senior Clinical Psychologist)",
    totalSeats: 30,
    availableSeats: 30,
    category: "CBT Certification",
    tags: "CBT, Clinical, Certification",
    isActive: true,
  };

  const [programForm, setProgramForm] = useState(initialFormState);

  const createProgramMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.createTrainingProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      setShowProgramModal(false);
      resetProgramForm();
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      API.careerPrograms.updateTrainingProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      setShowProgramModal(false);
      resetProgramForm();
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (id: string) => API.careerPrograms.deleteTrainingProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
    },
  });

  const resetProgramForm = () => {
    setEditingProgramId(null);
    setProgramForm(initialFormState);
  };

  const handleOpenCreateProgram = () => {
    resetProgramForm();
    setShowProgramModal(true);
  };

  const handleOpenEditProgram = (prog: any) => {
    setEditingProgramId(prog._id);
    setProgramForm({
      title: prog.title || "",
      description: prog.description || "",
      startDate: prog.startDate || "",
      duration: prog.duration || "",
      fee: prog.fee || 0,
      instructor: prog.instructor || "",
      totalSeats: prog.totalSeats || 30,
      availableSeats: prog.availableSeats ?? prog.totalSeats ?? 30,
      category: prog.category || "CBT Certification",
      tags: Array.isArray(prog.tags) ? prog.tags.join(", ") : prog.tags || "",
      isActive: prog.isActive !== false,
    });
    setShowProgramModal(true);
  };

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProgramId) {
      updateProgramMutation.mutate({ id: editingProgramId, data: programForm });
    } else {
      createProgramMutation.mutate(programForm);
    }
  };

  const handleToggleActive = (prog: any) => {
    updateProgramMutation.mutate({
      id: prog._id,
      data: { isActive: !prog.isActive },
    });
  };

  const filteredSelection = selectionRegistrations.filter(
    (r: any) =>
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.schoolOrgName?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  const filteredPrograms = adminPrograms.filter(
    (p: any) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTraining = trainingEnrollments.filter(
    (e: any) =>
      e.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      e.programTitle?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search)
  );

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
            <GraduationCap className="size-4" /> Counseling Training ({adminPrograms.length} Programs)
          </button>
        </div>

        <div className="flex items-center gap-3">
          {subTab === "training" && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setTrainingViewMode("programs")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  trainingViewMode === "programs"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Programs List ({adminPrograms.length})
              </button>
              <button
                onClick={() => setTrainingViewMode("enrollments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  trainingViewMode === "enrollments"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Student Enrollments ({trainingEnrollments.length})
              </button>
            </div>
          )}

          {subTab === "training" && (
            <button
              onClick={handleOpenCreateProgram}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="size-4" /> Create Program Cohort
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, program..."
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
                  <th className="p-4">College / Organization</th>
                  <th className="p-4">Counseling Domain</th>
                  <th className="p-4">Location & Contact</th>
                  <th className="p-4">Meeting Status</th>
                  <th className="p-4 text-right">Approval & Counselor Meeting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredSelection.map((r: any) => (
                  <tr key={r._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-teal-400" />
                        <div>
                          <span>{r.fullName}</span>
                          <div className="text-[10px] text-slate-500 font-normal">Age: {r.age} yrs</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{r.schoolOrgName}</td>
                    <td className="p-4">
                      <span className="bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded text-[11px] font-semibold block w-fit">
                        {r.counselingType || "Clinical Psychology & Psychotherapy"}
                      </span>
                      {r.preferredGoals && (
                        <span className="text-[10px] text-slate-400 italic line-clamp-1 mt-1 block">
                          "{r.preferredGoals}"
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300">{r.city}, {r.state}</div>
                      <div className="font-mono text-teal-300 text-[11px]">{r.phone}</div>
                    </td>
                    <td className="p-4">
                      {r.status === "approved" ? (
                        <div>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">
                            Approved & Scheduled
                          </span>
                          {r.assignedCounselor && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              With: <strong className="text-teal-200">{r.assignedCounselor}</strong>
                            </div>
                          )}
                        </div>
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
                          onClick={() => handleOpenScheduleModal(r)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] shadow transition cursor-pointer flex items-center gap-1"
                        >
                          <Calendar className="size-3.5" /> {r.status === "approved" ? "Edit Meeting" : "Approve & Schedule Meeting"}
                        </button>
                        {r.status !== "rejected" && (
                          <button
                            onClick={() => updateSelectionMutation.mutate({ id: r._id, data: { status: "rejected" } })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-red-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SUB TAB 2: COUNSELING TRAINING (PROGRAMS LIST OR ENROLLMENTS) */}
      {subTab === "training" && trainingViewMode === "programs" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {adminProgramsLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading Counseling Training Programs...</div>
          ) : filteredPrograms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No counseling training programs created yet. Click "+ Create Program Cohort" above.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-4">Program Title & Category</th>
                  <th className="p-4">Start Date & Duration</th>
                  <th className="p-4">Seats & Fee</th>
                  <th className="p-4">Instructor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredPrograms.map((prog: any) => (
                  <tr key={prog._id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-bold text-white">
                      <div>
                        <div className="text-sm text-cyan-300 font-semibold">{prog.title}</div>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {prog.category || "Certification"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-medium">{prog.startDate}</div>
                      <div className="text-[11px] text-slate-500">{prog.duration}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-emerald-400">₹{prog.fee}</div>
                      <div className="text-[11px] text-slate-400">
                        {prog.availableSeats} / {prog.totalSeats} Available Seats
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">{prog.instructor}</td>
                    <td className="p-4">
                      {prog.isActive ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Active (Visible)
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          Inactive (Draft)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(prog)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            prog.isActive
                              ? "bg-slate-700 text-amber-300 hover:bg-slate-600"
                              : "bg-emerald-600/80 text-white hover:bg-emerald-600"
                          }`}
                        >
                          {prog.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleOpenEditProgram(prog)}
                          className="p-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/60 text-cyan-200 transition cursor-pointer"
                          title="Edit Program"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${prog.title}"?`)) {
                              deleteProgramMutation.mutate(prog._id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-200 transition cursor-pointer"
                          title="Delete Program"
                        >
                          <Trash2 className="size-4" />
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
      {subTab === "training" && trainingViewMode === "enrollments" && (
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
                  <th className="p-4">Location</th>
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
                    <td className="p-4 text-slate-400">{e.city}, {e.state}</td>
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
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition cursor-pointer"
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

      {/* CREATE / EDIT PROGRAM COHORT MODAL */}
      {showProgramModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">
              {editingProgramId ? "Edit Counseling Training Program Cohort" : "Create Counseling Training Program Cohort"}
            </h3>

            <form onSubmit={handleProgramSubmit} className="space-y-4 text-xs">
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
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={programForm.category}
                    onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="CBT Certification">CBT Certification</option>
                    <option value="Child Psychology">Child Psychology</option>
                    <option value="Trauma Care">Trauma Care</option>
                    <option value="Clinical Supervision">Clinical Supervision</option>
                    <option value="General Counseling">General Counseling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Instructor / Lead Expert</label>
                  <input
                    type="text"
                    required
                    value={programForm.instructor}
                    onChange={(e) => setProgramForm({ ...programForm, instructor: e.target.value })}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fee (₹)</label>
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

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Available Seats</label>
                  <input
                    type="number"
                    required
                    value={programForm.availableSeats}
                    onChange={(e) => setProgramForm({ ...programForm, availableSeats: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={programForm.tags}
                  onChange={(e) => setProgramForm({ ...programForm, tags: e.target.value })}
                  placeholder="e.g. CBT, Clinical, DSM-5"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={programForm.isActive}
                  onChange={(e) => setProgramForm({ ...programForm, isActive: e.target.checked })}
                  className="size-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Is Program Active & Visible to Students?
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramModal(false);
                    resetProgramForm();
                  }}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProgramMutation.isPending || updateProgramMutation.isPending}
                  className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
                >
                  {editingProgramId ? "Update Program Cohort" : "Create Program Cohort"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE & SCHEDULE COUNSELOR MEETING MODAL */}
      {showScheduleModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold flex items-center gap-2 text-teal-400">
              <Calendar className="size-5" /> Assign Counselor & Send Fee Proposal
            </h3>
            <p className="text-xs text-slate-400">
              Applicant: <strong className="text-white">{selectedRecord.fullName}</strong> ({selectedRecord.schoolOrgName})
              <br />
              Requested Domain: <strong className="text-teal-300">{selectedRecord.counselingType || "Clinical Counseling"}</strong>
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Therapist Selection Dropdown */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Active System Counselor / Therapist</label>
                <select
                  value={scheduleForm.therapistId}
                  onChange={(e) => {
                    const selectedTherapist = activeTherapists.find((t: any) => t._id === e.target.value);
                    setScheduleForm({
                      ...scheduleForm,
                      therapistId: e.target.value,
                      assignedCounselor: selectedTherapist?.fullName || scheduleForm.assignedCounselor,
                    });
                  }}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-medium"
                >
                  <option value="">-- Custom / Senior Clinical Counselor --</option>
                  {activeTherapists.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} ({t.specialization || "Psychologist"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assigned Counselor Display Name</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.assignedCounselor}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assignedCounselor: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sharma (Senior Clinical Psychologist)"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Guidance Booking Amount / Fee (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={scheduleForm.guidanceFee}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, guidanceFee: Number(e.target.value) })}
                  placeholder="e.g. 499"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Scheduled Meeting Date & Time</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.meetingDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingDate: e.target.value })}
                  placeholder="e.g. 15th October 2026 at 11:00 AM"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Video Meeting Link (LiveKit / Jitsi / Google Meet)</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="e.g. https://meet.jit.si/MindSyncPro-CareerSession"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Admin Notes / Guidance Instructions</label>
                <textarea
                  rows={2}
                  value={scheduleForm.adminNotes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })}
                  placeholder="Additional guidelines for the candidate..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminAssignMutation.isPending}
                  className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
                >
                  {adminAssignMutation.isPending ? "Sending Proposal..." : "Send Proposal & Fee to Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

