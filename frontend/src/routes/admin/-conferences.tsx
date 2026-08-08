import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Users,
  DollarSign,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  FileText,
  User,
  Mail,
  Shield,
  Activity,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Upload,
  Loader2,
} from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export function AdminConferencesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingConference, setEditingConference] = useState<any | null>(null);
  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [selectedConferenceForAttendees, setSelectedConferenceForAttendees] = useState<any | null>(null);

  const [posterUploading, setPosterUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    banner: "",
    posterUrl: "",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTime: "18:00",
    endTime: "19:00",
    platform: "jitsi" as "jitsi" | "teams",
    meetingLink: "",
    duration: 60,
    meetingType: "public" as "public" | "private" | "webinar" | "workshop",
    priceType: "free" as "free" | "paid" | "custom",
    price: 0,
    maxParticipants: 100,
    enableWaitingRoom: false,
    enableRecording: false,
    enablePassword: false,
    password: "",
    hostEmail: "",
    roomName: "",
    autoGenerateRoomName: true,
    instructions: "",
    status: "published" as "published" | "draft",
  });

  const { data: conferences = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-conferences"],
    queryFn: () => API.conference.list({ status: statusFilter === "all" ? undefined : statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => API.conference.create(data),
    onSuccess: () => {
      toast.success("Conference created successfully!");
      setCreateModalOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-conferences"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => API.conference.update(id, data),
    onSuccess: () => {
      toast.success("Conference updated successfully!");
      setEditingConference(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-conferences"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.conference.delete(id),
    onSuccess: () => {
      toast.success("Conference deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-conferences"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => API.conference.togglePublish(id, status),
    onSuccess: () => {
      toast.success("Conference status updated");
      qc.invalidateQueries({ queryKey: ["admin-conferences"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handlePosterUpload = async (file: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, WEBP, GIF, or AVIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB limit.");
      return;
    }

    setPosterUploading(true);
    try {
      if (editingConference?._id) {
        const res = await API.conference.uploadPosterForId(editingConference._id, file);
        setForm((prev) => ({ ...prev, posterUrl: res.posterUrl }));
        toast.success("Conference poster uploaded ✓");
      } else {
        const res = await API.conference.uploadPoster(file);
        setForm((prev) => ({ ...prev, posterUrl: res.posterUrl }));
        toast.success("Poster uploaded ✓");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload poster image");
    } finally {
      setPosterUploading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      banner: "",
      posterUrl: "",
      meetingDate: new Date().toISOString().split("T")[0],
      meetingTime: "18:00",
      endTime: "19:00",
      platform: "jitsi",
      meetingLink: "",
      duration: 60,
      meetingType: "public",
      priceType: "free",
      price: 0,
      maxParticipants: 100,
      enableWaitingRoom: false,
      enableRecording: false,
      enablePassword: false,
      password: "",
      hostEmail: "",
      roomName: "",
      autoGenerateRoomName: true,
      instructions: "",
      status: "published",
    });
  };

  const handleEditClick = (conf: any) => {
    setEditingConference(conf);
    setForm({
      title: conf.title || "",
      description: conf.description || "",
      banner: conf.banner || "",
      posterUrl: conf.posterUrl || "",
      meetingDate: conf.meetingDate || "",
      meetingTime: conf.meetingTime || "",
      endTime: conf.endTime || "",
      platform: conf.platform || "jitsi",
      meetingLink: conf.meetingLink || "",
      duration: conf.duration || 60,
      meetingType: conf.meetingType || "public",
      priceType: conf.priceType || "free",
      price: conf.price || 0,
      maxParticipants: conf.maxParticipants || 100,
      enableWaitingRoom: conf.enableWaitingRoom || false,
      enableRecording: conf.enableRecording || false,
      enablePassword: conf.enablePassword || false,
      password: conf.password || "",
      hostEmail: conf.hostEmail || "",
      roomName: conf.roomName || "",
      autoGenerateRoomName: false,
      instructions: conf.instructions || "",
      status: conf.status || "published",
    });
    setCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.platform === "teams") {
      if (!form.meetingLink.trim()) {
        toast.error("Meeting Link is required for Microsoft Teams meetings.");
        return;
      }
      try {
        const parsed = new URL(form.meetingLink.trim());
        const host = parsed.hostname.toLowerCase();
        const valid =
          (parsed.protocol === "http:" || parsed.protocol === "https:") &&
          (host === "teams.microsoft.com" ||
            host.endsWith(".teams.microsoft.com") ||
            host === "teams.live.com" ||
            host.endsWith(".teams.live.com") ||
            host === "teams.microsoft.us");
        if (!valid) {
          toast.error("Please enter a valid Microsoft Teams meeting URL.");
          return;
        }
      } catch {
        toast.error("Please enter a valid Microsoft Teams meeting URL.");
        return;
      }
    }
    if (editingConference) {
      updateMutation.mutate({ id: editingConference._id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const copyInviteLink = (conf: any) => {
    const origin = window.location.origin;
    const link = `${origin}/conferences`;
    navigator.clipboard.writeText(link);
    toast.success("Conference link copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" /> Conference Management Module
          </div>
          <h2 className="text-2xl font-bold text-white">Video Conferences & Webinars</h2>
          <p className="text-slate-400 text-sm mt-1">
            Create, publish, monitor live video sessions, and manage attendee registrations & analytics.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingConference(null);
            resetForm();
            setCreateModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Conference
        </button>
      </div>

      {/* Conference Cards List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading conferences...</div>
        ) : conferences.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No conferences created yet</p>
            <p className="text-slate-500 text-xs mt-1">Click 'Create Conference' to set up your first video webinar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {conferences.map((conf: any) => {
              const isLive = conf.computedStatus === "live";
              return (
                <div
                  key={conf._id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-24 h-24 rounded-2xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center p-1">
                      {conf.posterUrl || conf.banner ? (
                        <img
                          src={conf.posterUrl || conf.banner}
                          alt={conf.title}
                          className="max-w-full max-h-full object-contain rounded-lg"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-teal-400/40" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-lg">{conf.title}</span>
                        {conf.status === "draft" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Draft
                          </span>
                        ) : isLive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                            LIVE NOW
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {conf.computedStatus || "Published"}
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          {conf.priceType === "free" ? "FREE" : `₹${conf.price}`}
                        </span>

                        {conf.platform === "teams" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            🔵 Microsoft Teams
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            🟢 Jitsi Meet
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{conf.description}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                        <span>
                          📅 {conf.meetingDate} at {conf.meetingTime} ({conf.duration}m)
                        </span>
                        <span>👤 Host/Leader: <strong className="text-teal-300">{conf.hostEmail || conf.createdBy?.email || "Admin"}</strong></span>
                        <span>👥 Registered: {conf.registeredCount || 0} / {conf.maxParticipants}</span>
                        <span>🔑 Room: {conf.roomName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                    <button
                      onClick={() => {
                        window.location.href = `/conferences/${conf._id}/room`;
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 fill-white" /> Join Meeting as Host
                    </button>

                    <button
                      onClick={() => {
                        setSelectedConferenceForAttendees(conf);
                        setAttendeesModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" /> View Attendees & Stats
                    </button>

                    <button
                      onClick={() => copyInviteLink(conf)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Copy Invite Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        publishMutation.mutate({
                          id: conf._id,
                          status: conf.status === "published" ? "draft" : "published",
                        })
                      }
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title={conf.status === "published" ? "Unpublish" : "Publish"}
                    >
                      {conf.status === "published" ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-teal-400" />}
                    </button>

                    <button
                      onClick={() => handleEditClick(conf)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this conference?")) {
                          deleteMutation.mutate(conf._id);
                        }
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingConference ? "Edit Conference" : "Create New Video Conference"}
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Conference Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mindfulness & Stress Relief Workshop"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description of what attendees will learn..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                />
              </div>

              {/* Conference Poster Upload Section */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="font-medium text-slate-300 block">Conference Poster / Image</label>
                {form.posterUrl ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-3">
                    <div className="relative max-h-64 w-full flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden p-2">
                      <img
                        src={form.posterUrl}
                        alt="Conference Poster Preview"
                        className="max-h-60 w-auto max-w-full object-contain rounded-lg shadow-md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Poster</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePosterUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, posterUrl: "" }))}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Poster</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-900/80">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
                      {posterUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      {posterUploading ? "Uploading poster image..." : "Upload Conference Poster"}
                    </p>
                    <p className="text-[11px] text-slate-400">Click or drag & drop image file</p>
                    <p className="text-[10px] text-slate-500 mt-1">Supported: JPG, PNG, WEBP, GIF, AVIF | Max size: 10 MB</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      className="hidden"
                      disabled={posterUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePosterUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Banner Image URL</label>
                  <input
                    type="url"
                    value={form.banner}
                    onChange={(e) => setForm({ ...form, banner: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Mental Health / Therapy"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div> */}

              {/* Meeting Platform Selection */}
              <div className="space-y-2 border-y border-slate-800 py-3">
                <label className="font-medium text-slate-300 block">Meeting Platform *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, platform: "jitsi", meetingLink: "" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      form.platform === "jitsi"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Jitsi Meet (Default)</div>
                      <div className="text-[10px] text-slate-400">Integrated video conferencing room</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, platform: "teams" })}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      form.platform === "teams"
                        ? "bg-blue-500/10 border-blue-500 text-blue-300 font-semibold"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Microsoft Teams</div>
                      <div className="text-[10px] text-slate-400">External Teams invitation link</div>
                    </div>
                  </button>
                </div>

                {/* Microsoft Teams Specific Section */}
                {form.platform === "teams" && (
                  <div className="mt-3 p-4 rounded-2xl bg-blue-950/30 border border-blue-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-200">Create meeting in MS Teams:</span>
                      <button
                        type="button"
                        onClick={() => window.open("https://teams.live.com/v2", "_blank")}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Create Teams Meeting
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-slate-200">Meeting Link *</label>
                      <input
                        type="url"
                        required
                        value={form.meetingLink}
                        onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                        className="w-full px-3 py-2 bg-slate-900 border border-blue-700/60 rounded-xl text-white text-xs focus:border-blue-400 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400">
                        Paste the copied Microsoft Teams meeting invitation URL here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Meeting Date *</label>
                  <input
                    type="date"
                    required
                    value={form.meetingDate}
                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={form.meetingTime}
                    onChange={(e) => setForm({ ...form, meetingTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Duration (Mins)</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Price Type</label>
                  <select
                    value={form.priceType}
                    onChange={(e) => setForm({ ...form, priceType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  >
                    <option value="free">FREE</option>
                    <option value="paid">PAID (₹)</option>
                    <option value="custom">CUSTOM QUOTE</option>
                  </select>
                </div>

                {form.priceType === "paid" && (
                  <div className="space-y-1">
                    <label className="font-medium text-slate-300">Price (INR ₹)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Max Participants</label>
                  <input
                    type="number"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Designated Meeting Host / Leader Email(s) (Optional)</label>
                <input
                  type="text"
                  value={form.hostEmail}
                  onChange={(e) => setForm({ ...form, hostEmail: e.target.value })}
                  placeholder="e.g. host1@example.com, host2@example.com (Separate multiple emails with commas)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Room Name</label>
                  <input
                    type="text"
                    value={form.roomName}
                    onChange={(e) => setForm({ ...form, roomName: e.target.value, autoGenerateRoomName: false })}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Meeting Password (Optional)</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value, enablePassword: Boolean(e.target.value) })}
                    placeholder="Secret passcode"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableWaitingRoom}
                    onChange={(e) => setForm({ ...form, enableWaitingRoom: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-teal-500"
                  />
                  <span>Enable Waiting Room</span>
                </label>

                {/* <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableRecording}
                    onChange={(e) => setForm({ ...form, enableRecording: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-teal-500"
                  />
                  <span>Enable Recording</span>
                </label> */}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                >
                  {editingConference ? "Save Changes" : "Create & Publish"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Attendee Management & Analytics Modal */}
      {attendeesModalOpen && selectedConferenceForAttendees && (
        <AttendeeManagementModal
          conference={selectedConferenceForAttendees}
          onClose={() => setAttendeesModalOpen(false)}
        />
      )}
    </div>
  );
}

function AttendeeManagementModal({ conference, onClose }: { conference: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [attendanceFilter, setAttendanceFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [selectedAttendee, setSelectedAttendee] = useState<any | null>(null);

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["admin-analytics", conference._id],
    queryFn: () => API.conference.adminAnalytics(conference._id),
    refetchInterval: 10000, // auto real-time refresh every 10s
  });

  const { data: attendees = [], isLoading, refetch: refetchAttendees } = useQuery({
    queryKey: ["admin-attendees", conference._id, search, paymentFilter, attendanceFilter, sortBy],
    queryFn: () =>
      API.conference.adminAttendees(conference._id, {
        search,
        paymentStatus: paymentFilter,
        attendanceStatus: attendanceFilter,
        sortBy,
      }),
  });

  const updateAttendeeMutation = useMutation({
    mutationFn: ({ regId, data }: { regId: string; data: any }) =>
      API.conference.adminUpdateAttendee(conference._id, regId, data),
    onSuccess: () => {
      toast.success("Attendee record updated");
      refetchAttendees();
    },
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: (regId: string) => API.conference.adminRemoveAttendee(conference._id, regId),
    onSuccess: () => {
      toast.success("Attendee removed");
      refetchAttendees();
      refetchAnalytics();
    },
  });

  const allowAttendeeMutation = useMutation({
    mutationFn: (regId: string) => API.conference.admitAttendee(conference._id, regId),
    onSuccess: (data) => {
      toast.success(data.message || "Allowed member into room ✓");
      refetchAttendees();
      refetchAnalytics();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to allow member"),
  });

  const allowAllMutation = useMutation({
    mutationFn: () => API.conference.admitAllAttendees(conference._id),
    onSuccess: (data) => {
      toast.success(data.message || "Allowed all waiting members into room ✓");
      refetchAttendees();
      refetchAnalytics();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to allow all members"),
  });

  const handleRefresh = () => {
    refetchAttendees();
    refetchAnalytics();
    toast.success("Live attendee list refreshed!");
  };

  const copyEmails = () => {
    const emails = attendees.map((a: any) => a.email).filter(Boolean).join(", ");
    navigator.clipboard.writeText(emails);
    toast.success(`Copied ${attendees.length} email addresses!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" /> Live Attendee Management & Analytics
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{conference.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Meeting Dashboard Metrics Cards */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Total Registered</span>
            <p className="text-lg font-bold text-white mt-1">{analytics?.totalRegistered || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-xs text-emerald-400 font-medium">Active in Meeting</span>
            <p className="text-lg font-bold text-emerald-300 mt-1">{analytics?.currentlyInMeeting || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-xs text-amber-400 font-medium">Waiting Room</span>
            <p className="text-lg font-bold text-amber-300 mt-1">{analytics?.usersWaiting || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Left Meeting</span>
            <p className="text-lg font-bold text-slate-300 mt-1">{analytics?.usersLeft || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-xs text-rose-400 font-medium">No Show</span>
            <p className="text-lg font-bold text-rose-300 mt-1">{analytics?.noShow || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30">
            <span className="text-xs text-teal-400 font-medium">Total Revenue</span>
            <p className="text-lg font-bold text-teal-300 mt-1">₹{analytics?.totalRevenue || 0}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Avg Duration</span>
            <p className="text-lg font-bold text-white mt-1">{analytics?.avgSessionDuration || 0}m</p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search attendees by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="All">All Payment</option>
              <option value="free">FREE</option>
              <option value="paid">PAID</option>
              <option value="pending">PENDING</option>
            </select>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="All">All Status</option>
              <option value="waiting">Waiting Room</option>
              <option value="joined">Joined</option>
              <option value="registered">Registered</option>
              <option value="left">Left</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
              title="Refresh Live Attendee Data"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>

            {(analytics?.usersWaiting > 0 || attendees.some((a: any) => a.currentStatus === "waiting" || a.admitStatus === "waiting")) && (
              <button
                onClick={() => allowAllMutation.mutate()}
                disabled={allowAllMutation.isPending}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow animate-pulse"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Allow All Waiting ({analytics?.usersWaiting || attendees.filter((a: any) => a.currentStatus === "waiting" || a.admitStatus === "waiting").length})
              </button>
            )}

            <button
              onClick={copyEmails}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Copy Emails
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Print Attendee List"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading attendee records...</div>
          ) : attendees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No registered attendees matching filters.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                  <th className="p-3">Attendee</th>
                  <th className="p-3">Email / Phone</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Join / Leave</th>
                  <th className="p-3">Duration & %</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendees.map((att: any) => (
                  <tr key={att._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{att.fullName}</div>
                      <div className="text-[10px] text-slate-400">Age: {att.age}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300">{att.email}</div>
                      <div className="text-[10px] text-slate-500">{att.phone || "N/A"}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          att.paymentStatus === "paid"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : att.paymentStatus === "free"
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {att.paymentStatus.toUpperCase()} (₹{att.paymentAmount || 0})
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          att.currentStatus === "joined"
                            ? "bg-emerald-500 text-slate-950 animate-pulse font-bold"
                            : att.currentStatus === "waiting" || att.admitStatus === "waiting"
                            ? "bg-amber-500 text-slate-950 font-bold animate-pulse"
                            : att.currentStatus === "left"
                            ? "bg-slate-800 text-slate-400"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {att.currentStatus === "waiting" || att.admitStatus === "waiting" ? "Waiting Room" : att.currentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      <div>In: {att.joinTime ? new Date(att.joinTime).toLocaleTimeString() : "N/A"}</div>
                      <div>Out: {att.leaveTime ? new Date(att.leaveTime).toLocaleTimeString() : "N/A"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{att.totalDuration || 0} mins</div>
                      <div className="text-[10px] text-teal-400">{att.attendancePercentage || 0}% session</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(att.currentStatus === "waiting" || att.admitStatus === "waiting" || !att.admitted) ? (
                          <button
                            onClick={() => allowAttendeeMutation.mutate(att._id)}
                            disabled={allowAttendeeMutation.isPending}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow transition-all"
                            title="Allow member into room"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Allow Member
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            ✓ Allowed
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedAttendee(att)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remove attendee registration?")) {
                              removeAttendeeMutation.mutate(att._id);
                            }
                          }}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Side Detail Modal */}
        {selectedAttendee && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-end z-50">
            <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-white text-base">Attendee Profile</h4>
                  <button onClick={() => setSelectedAttendee(null)} className="p-1 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p><span className="text-slate-400">Name:</span> <strong className="text-white">{selectedAttendee.fullName}</strong></p>
                  <p><span className="text-slate-400">Email:</span> {selectedAttendee.email}</p>
                  <p><span className="text-slate-400">Phone:</span> {selectedAttendee.phone || "N/A"}</p>
                  <p><span className="text-slate-400">Payment ID:</span> {selectedAttendee.razorpayPaymentId || "N/A"}</p>
                  <p><span className="text-slate-400">Device Info:</span> {selectedAttendee.deviceInfo || "N/A"}</p>
                  <p><span className="text-slate-400">Browser:</span> {selectedAttendee.browserInfo || "N/A"}</p>
                  <p><span className="text-slate-400">IP Address:</span> {selectedAttendee.ipAddress || "N/A"}</p>
                  <p><span className="text-slate-400">Rejoins:</span> {selectedAttendee.rejoinCount || 0} times</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Admin Notes</label>
                  <textarea
                    rows={3}
                    defaultValue={selectedAttendee.adminNotes || ""}
                    onBlur={(e) =>
                      updateAttendeeMutation.mutate({
                        regId: selectedAttendee._id,
                        data: { adminNotes: e.target.value },
                      })
                    }
                    placeholder="Add private admin notes for this attendee..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedAttendee(null)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
