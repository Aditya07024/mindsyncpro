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
  Video,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import API from "@/lib/api";

function formatMeetingDateTime(dateStr: string, timeStr: string, durationStr: string) {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    let timeFormatted = timeStr || "11:00 AM";
    if (timeStr && timeStr.includes(":")) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      timeFormatted = `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    }

    const dayStr = `${day}${suffix(day)} ${monthNames[month - 1]} ${year}`;
    return `${dayStr} at ${timeFormatted} IST (${durationStr})`;
  } catch {
    return `${dateStr} at ${timeStr}`;
  }
}

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

  // 4. Fetch All Available Therapists / Counselors for Admin Assignment
  const { data: adminTherapistsData } = useQuery({
    queryKey: ["adminTherapistsListAll"],
    queryFn: () => API.admin.pendingTherapists(),
  });

  const { data: publicTherapistsData } = useQuery({
    queryKey: ["therapistsListPublicVerified"],
    queryFn: () => API.therapist.list({ verified: "true" }),
  });

  const rawTherapistList = [
    ...(adminTherapistsData?.therapists || []),
    ...(publicTherapistsData?.therapists || []),
  ];

  // Include platform counselors deduplicated by ID
  const activeTherapists = Array.from(
    new Map(
      rawTherapistList
        .filter((t: any) => Boolean(t.id || t._id))
        .map((t: any) => [String(t.id || t._id), t])
    ).values()
  );

  // Selection meeting schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    therapistId: "",
    assignedCounselor: "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
    guidanceFee: 499,
    meetingDate: "",
    datePart: "",
    timePart: "11:00",
    duration: "45 mins",
    meetingLink: "",
    adminNotes: "Application approved. Meeting scheduled with senior counselor.",
    status: "approved",
  });

  const updateSelectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      API.careerPrograms.updateCareerSelectionStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
      toast.success("Application status updated successfully");
      setShowScheduleModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update status");
    },
  });

  const adminAssignMutation = useMutation({
    mutationFn: (data: any) => API.careerPrograms.adminAssign(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminCareerSelectionRegistrations"] });
      toast.success(res?.message || "Counselor assigned and meeting scheduled successfully!");
      setShowScheduleModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to schedule counselor meeting");
    },
  });

  const handleOpenScheduleModal = (r: any) => {
    setSelectedRecord(r);

    // Compute tomorrow's date YYYY-MM-DD as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const defaultDatePart = `${yyyy}-${mm}-${dd}`;
    const defaultTimePart = "11:00";
    const defaultDuration = "45 mins";

    const computedDate = formatMeetingDateTime(defaultDatePart, defaultTimePart, defaultDuration);
    const initialDate = r.meetingDate && r.meetingDate.trim() ? r.meetingDate : computedDate;

    const roomSlug = r._id ? String(r._id).slice(-6) : Math.random().toString(36).substring(7);
    const defaultMeetingLink = r.meetingLink && r.meetingLink.trim()
      ? r.meetingLink
      : `https://meet.jit.si/MindSyncPro-Career-${roomSlug}`;

    const initialStatus = r.status === "proposal_sent"
      ? "proposal_sent"
      : "approved";

    setScheduleForm({
      therapistId: r.therapistId || "",
      assignedCounselor: r.assignedCounselor || "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)",
      guidanceFee: r.guidanceFee !== undefined ? Number(r.guidanceFee) : 499,
      meetingDate: initialDate,
      datePart: defaultDatePart,
      timePart: defaultTimePart,
      duration: defaultDuration,
      meetingLink: defaultMeetingLink,
      adminNotes: r.adminNotes || "Application approved. Meeting scheduled with senior counselor.",
      status: initialStatus,
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    const fee = Number(scheduleForm.guidanceFee || 0);

    adminAssignMutation.mutate({
      registrationId: selectedRecord._id,
      therapistId: scheduleForm.therapistId,
      assignedCounselor: scheduleForm.assignedCounselor,
      guidanceFee: fee,
      meetingDate: scheduleForm.meetingDate,
      meetingLink: scheduleForm.meetingLink,
      adminNotes: scheduleForm.adminNotes,
      status: scheduleForm.status,
    });
  };

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      API.careerPrograms.updateTrainingEnrollmentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingEnrollments"] });
      toast.success("Enrollment status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update enrollment status");
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
      toast.success("Training program cohort created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create program");
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
      toast.success("Training program updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update program");
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: (id: string) => API.careerPrograms.deleteTrainingProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCounselingTrainingPrograms"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPrograms"] });
      toast.success("Training program deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete program");
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
                            Approved & Scheduled ✓
                          </span>
                          {r.assignedCounselor && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              With: <strong className="text-teal-200">{r.assignedCounselor}</strong>
                            </div>
                          )}
                        </div>
                      ) : r.status === "proposal_sent" ? (
                        <div>
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">
                            Proposal Sent (₹{r.guidanceFee || 499})
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Awaiting Candidate Payment
                          </div>
                        </div>
                      ) : r.status === "guidance_requested" || r.guidanceRequested ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse block w-fit">
                          ⚡ Guidance Requested
                        </span>
                      ) : r.status === "rejected" ? (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Rejected
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
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
                            disabled={updateSelectionMutation.isPending}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-white space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 text-teal-400">
                  <Calendar className="size-5" /> Assign Counselor & Schedule Meeting
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Applicant: <strong className="text-white">{selectedRecord.fullName}</strong> ({selectedRecord.schoolOrgName})
                  <br />
                  Counseling Domain: <strong className="text-teal-300">{selectedRecord.counselingType || "Clinical Counseling"}</strong>
                  {selectedRecord.phone && <span> · Phone: <span className="font-mono text-slate-300">{selectedRecord.phone}</span></span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* 1. Therapist / Counselor Selection Dropdown */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>1. Select Platform Counselor / Therapist</span>
                  <span className="text-[10px] text-teal-400 font-normal">Choose from registered platform therapists</span>
                </label>
                <select
                  value={scheduleForm.therapistId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const selectedTherapist = activeTherapists.find((t: any) => (t.id || t._id) === selId);
                    const tName = selectedTherapist?.name || selectedTherapist?.fullName || selectedTherapist?.therapistProfile?.name;
                    setScheduleForm({
                      ...scheduleForm,
                      therapistId: selId,
                      assignedCounselor: tName ? `${tName} (Clinical Counselor)` : (selId === "" ? "Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor)" : scheduleForm.assignedCounselor),
                    });
                  }}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-medium"
                >
                  <option value="">-- Dr. Ananya Sharma (Senior Clinical Psychologist & Counselor) --</option>
                  {activeTherapists.map((t: any, idx: number) => {
                    const tId = t.id || t._id || `therapist-${idx}`;
                    const tName = t.name || t.fullName || t.therapistProfile?.name || "Therapist";
                    const tSpecs = Array.isArray(t.specializations)
                      ? t.specializations.join(", ")
                      : t.specializations || t.qualification || "Clinical Counselor";
                    const isVerified = t.verified === true || t.verificationStatus === "verified" || t.verificationStatus === "approved";

                    return (
                      <option key={tId} value={tId}>
                        {tName} — {tSpecs} {isVerified ? "✓ [Verified]" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 2. Counselor Display Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Counselor Display Name</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.assignedCounselor}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, assignedCounselor: e.target.value })}
                  placeholder="e.g. Dr. Ananya Sharma (Senior Clinical Psychologist)"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              {/* 3. Meeting Date & Time Interactive Picker */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-teal-300 font-bold flex items-center gap-1.5 text-xs">
                    <Clock className="size-4" /> 2. Schedule Session Date, Time & Duration
                  </label>
                  <span className="text-[10px] text-slate-400">Interactive Slot Setup</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Date Input */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Session Date</label>
                    <input
                      type="date"
                      value={scheduleForm.datePart}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const formatted = formatMeetingDateTime(newDate, scheduleForm.timePart, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          datePart: newDate,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                    />
                  </div>

                  {/* Time Input */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Start Time</label>
                    <input
                      type="time"
                      value={scheduleForm.timePart}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, newTime, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          timePart: newTime,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                    />
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-slate-400 text-[11px] font-semibold mb-1">Duration</label>
                    <select
                      value={scheduleForm.duration}
                      onChange={(e) => {
                        const newDur = e.target.value;
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, scheduleForm.timePart, newDur);
                        setScheduleForm({
                          ...scheduleForm,
                          duration: newDur,
                          meetingDate: formatted,
                        });
                      }}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs font-medium"
                    >
                      <option value="30 mins">30 Minutes</option>
                      <option value="45 mins">45 Minutes</option>
                      <option value="60 mins">60 Minutes</option>
                      <option value="90 mins">90 Minutes</option>
                    </select>
                  </div>
                </div>

                {/* Quick Time Slot Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick Slots:</span>
                  {[
                    { label: "10:00 AM", val: "10:00" },
                    { label: "11:30 AM", val: "11:30" },
                    { label: "02:00 PM", val: "14:00" },
                    { label: "04:00 PM", val: "16:00" },
                    { label: "06:00 PM", val: "18:00" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => {
                        const formatted = formatMeetingDateTime(scheduleForm.datePart, s.val, scheduleForm.duration);
                        setScheduleForm({
                          ...scheduleForm,
                          timePart: s.val,
                          meetingDate: formatted,
                        });
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        scheduleForm.timePart === s.val
                          ? "bg-teal-500 text-slate-950"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Compiled / Editable String Display */}
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                    Scheduled Meeting Date & Time Display String (Visible to Candidate)
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.meetingDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetingDate: e.target.value })}
                    placeholder="e.g. 15th October 2026 at 11:00 AM IST (45 mins)"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* 4. Video Meeting Link with Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <Video className="size-3.5 text-teal-400" /> Video Meeting Room Link
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const slug = selectedRecord._id ? String(selectedRecord._id).slice(-6) : Math.random().toString(36).substring(7);
                      setScheduleForm({
                        ...scheduleForm,
                        meetingLink: `https://meet.jit.si/MindSyncPro-Career-${slug}-${Date.now().toString().slice(-4)}`,
                      });
                      toast.success("Generated new meeting room link!");
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="size-3" /> Generate MindSync Live Room
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="e.g. https://meet.jit.si/MindSyncPro-CareerSession or Google Meet / Zoom link"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono text-[11px]"
                />
              </div>

              {/* 5. Guidance Fee and Quick Fee Chips */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Guidance Booking Amount / Fee (₹)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    required
                    min={0}
                    value={scheduleForm.guidanceFee}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, guidanceFee: Number(e.target.value) })}
                    placeholder="0 for Free, or amount e.g. 499"
                    className="w-40 rounded-xl bg-slate-800 border border-slate-700 p-3 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono font-bold text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[0, 299, 499, 999, 1499].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setScheduleForm({ ...scheduleForm, guidanceFee: f })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          scheduleForm.guidanceFee === f
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {f === 0 ? "Free (₹0)" : `₹${f}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Meeting Status Workflow Radio Selector */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                <label className="block text-slate-300 font-bold text-xs">
                  Meeting Approval & Status Workflow
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      scheduleForm.status === "approved"
                        ? "bg-teal-950/60 border-teal-400 text-teal-200"
                        : "bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingStatus"
                      value="approved"
                      checked={scheduleForm.status === "approved"}
                      onChange={() => setScheduleForm({ ...scheduleForm, status: "approved" })}
                      className="mt-0.5 text-teal-500 focus:ring-teal-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-emerald-400" /> Approve & Confirm Now
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Candidate gets instant access to join room and scheduled time right away.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      scheduleForm.status === "proposal_sent"
                        ? "bg-teal-950/60 border-teal-400 text-teal-200"
                        : "bg-slate-900 border-slate-700/80 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingStatus"
                      value="proposal_sent"
                      checked={scheduleForm.status === "proposal_sent"}
                      onChange={() => setScheduleForm({ ...scheduleForm, status: "proposal_sent" })}
                      className="mt-0.5 text-teal-500 focus:ring-teal-400"
                    />
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        <Calendar className="size-3.5 text-purple-400" /> Send Fee Proposal First
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Candidate must pay fee (₹{scheduleForm.guidanceFee}) before video room unlocks.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 7. Admin Notes / Guidance Instructions */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Admin Notes / Session Focus</label>
                <textarea
                  rows={2}
                  value={scheduleForm.adminNotes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })}
                  placeholder="Additional instructions or meeting topic for the candidate..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 flex gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminAssignMutation.isPending || updateSelectionMutation.isPending}
                  className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {adminAssignMutation.isPending || updateSelectionMutation.isPending ? (
                    "Saving Changes..."
                  ) : scheduleForm.status === "approved" ? (
                    <>
                      <CheckCircle2 className="size-4" /> Approve & Confirm Session
                    </>
                  ) : (
                    <>
                      <Calendar className="size-4" /> Send ₹{scheduleForm.guidanceFee} Proposal to Candidate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

