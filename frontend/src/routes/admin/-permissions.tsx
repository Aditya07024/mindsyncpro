import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  UserCheck,
  Video,
  Users,
  Building2,
  BarChart2,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Mail,
  Lock,
  Sparkles,
  ShieldAlert,
  UserPlus,
  BadgeCheck,
} from "lucide-react";
import API from "@/lib/api";
import { toast } from "sonner";

export function AdminPermissionsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    email: "",
    name: "",
    roleTitle: "Meeting Host",
    canHostMeeting: true,
    canViewRegistrations: true,
    canManageUsers: false,
    canManageTherapists: false,
    canManageOrganizations: false,
    canViewAnalytics: false,
    canManageWorkshopPopup: false,
    isFullAdmin: false,
  });

  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: () => API.admin.permissions.list(),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => API.admin.permissions.upsert(data),
    onSuccess: (res) => {
      toast.success(res.message || "Permissions saved successfully!");
      setModalOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => API.admin.permissions.revoke(id),
    onSuccess: (res) => {
      toast.success(res.message || "Permissions revoked ✓");
      setRevokeConfirmId(null);
      qc.invalidateQueries({ queryKey: ["admin-permissions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({
      email: "",
      name: "",
      roleTitle: "Meeting Host",
      canHostMeeting: true,
      canViewRegistrations: true,
      canManageUsers: false,
      canManageTherapists: false,
      canManageOrganizations: false,
      canViewAnalytics: false,
      canManageWorkshopPopup: false,
      isFullAdmin: false,
    });
    setEditingItem(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      email: item.email || "",
      name: item.name || "",
      roleTitle: item.roleTitle || "Delegated Admin",
      canHostMeeting: Boolean(item.canHostMeeting),
      canViewRegistrations: Boolean(item.canViewRegistrations),
      canManageUsers: Boolean(item.canManageUsers),
      canManageTherapists: Boolean(item.canManageTherapists),
      canManageOrganizations: Boolean(item.canManageOrganizations),
      canViewAnalytics: Boolean(item.canViewAnalytics),
      canManageWorkshopPopup: Boolean(item.canManageWorkshopPopup),
      isFullAdmin: Boolean(item.isFullAdmin),
    });
    setModalOpen(true);
  };

  const handlePresetChange = (preset: string) => {
    if (preset === "meeting_host") {
      setForm((prev) => ({
        ...prev,
        roleTitle: "Meeting Host",
        canHostMeeting: true,
        canViewRegistrations: true,
        canManageUsers: false,
        canManageTherapists: false,
        canManageOrganizations: false,
        canViewAnalytics: false,
        isFullAdmin: false,
      }));
    } else if (preset === "registration_auditor") {
      setForm((prev) => ({
        ...prev,
        roleTitle: "Registrations Auditor",
        canHostMeeting: false,
        canViewRegistrations: true,
        canManageUsers: false,
        canManageTherapists: false,
        canManageOrganizations: false,
        canViewAnalytics: false,
        isFullAdmin: false,
      }));
    } else if (preset === "user_therapist_manager") {
      setForm((prev) => ({
        ...prev,
        roleTitle: "User & Therapist Manager",
        canHostMeeting: false,
        canViewRegistrations: false,
        canManageUsers: true,
        canManageTherapists: true,
        canManageOrganizations: false,
        canViewAnalytics: false,
        isFullAdmin: false,
      }));
    } else if (preset === "financial_auditor") {
      setForm((prev) => ({
        ...prev,
        roleTitle: "Financial Auditor",
        canHostMeeting: false,
        canViewRegistrations: false,
        canManageUsers: false,
        canManageTherapists: false,
        canManageOrganizations: false,
        canViewAnalytics: true,
        isFullAdmin: false,
      }));
    } else if (preset === "full_admin") {
      setForm((prev) => ({
        ...prev,
        roleTitle: "Co-Host Super Admin",
        canHostMeeting: true,
        canViewRegistrations: true,
        canManageUsers: true,
        canManageTherapists: true,
        canManageOrganizations: true,
        canViewAnalytics: true,
        isFullAdmin: true,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    upsertMutation.mutate(form);
  };

  const permissionsList: any[] = permissionsData?.permissions || [];
  const filteredList = permissionsList.filter(
    (item) =>
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.roleTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: permissionsList.length,
    hosts: permissionsList.filter((p) => p.canHostMeeting || p.isFullAdmin).length,
    auditors: permissionsList.filter((p) => p.canViewRegistrations || p.isFullAdmin).length,
    fullAdmins: permissionsList.filter((p) => p.isFullAdmin).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-900 border border-violet-800/40 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-violet-400 font-bold text-sm tracking-wider uppercase">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
            <span>Delegated Access & Email Permissions</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Capability Delegation</h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
            Grant specific email addresses tailored capabilities (e.g. hosting video conferences, viewing member registrations, user administration, or financial analytics).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Grant Email Access
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Delegated Emails</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Meeting Hosts</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.hosts}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Registration Auditors</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.auditors}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BadgeCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Co-Host Super Admins</div>
            <div className="text-xl font-black text-white mt-0.5">{stats.fullAdmins}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, label name, or role title..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Delegated Access Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading delegated permissions...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
            <div>No delegated email permissions found.</div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition"
            >
              Grant Access to Email
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Target Email & Name</th>
                  <th className="p-4">Assigned Role Title</th>
                  <th className="p-4">Enabled Capabilities</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredList.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span>{item.email}</span>
                      </div>
                      {item.name && <div className="text-[11px] text-slate-400 mt-0.5">{item.name}</div>}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                        {item.roleTitle || "Delegated Admin"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {item.isFullAdmin ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            🛡️ Full Admin Access
                          </span>
                        ) : (
                          <>
                            {item.canHostMeeting && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                🎥 Host Meetings
                              </span>
                            )}
                            {item.canViewRegistrations && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                👥 View Registrations
                              </span>
                            )}
                            {item.canManageUsers && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                👤 Manage Users
                              </span>
                            )}
                            {item.canManageTherapists && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                                🩺 Manage Therapists
                              </span>
                            )}
                            {item.canManageOrganizations && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                                🏢 Manage Orgs
                              </span>
                            )}
                            {item.canViewAnalytics && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                📊 View Analytics
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRevokeConfirmId(item._id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">
                    {editingItem ? "Edit Email Permissions" : "Grant Email Access"}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300 block">Target Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. host@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Name / Label Input */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300 block">Owner Name / Label (Optional)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins - Event Lead"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Role Presets */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="font-medium text-slate-300 block">Quick Role Preset</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetChange("meeting_host")}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left"
                    >
                      🎥 Meeting Host
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("registration_auditor")}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left"
                    >
                      👥 Registrations Auditor
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("user_therapist_manager")}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left"
                    >
                      👤 User & Therapist Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("financial_auditor")}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold text-left"
                    >
                      📊 Financial Auditor
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange("full_admin")}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-[11px] font-semibold text-left col-span-2 sm:col-span-1"
                    >
                      🛡️ Co-Host Super Admin
                    </button>
                  </div>
                </div>

                {/* Granular Capabilities Toggles */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <label className="font-medium text-slate-300 block">Granular Capabilities</label>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-rose-400" /> Host Video Conferences
                        </div>
                        <div className="text-[10px] text-slate-400">Allows creating, editing, and hosting live video meetings</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canHostMeeting}
                        onChange={(e) => setForm({ ...form, canHostMeeting: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" /> View Meeting Registrations
                        </div>
                        <div className="text-[10px] text-slate-400">Allows viewing registered members and exporting attendee stats</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canViewRegistrations}
                        onChange={(e) => setForm({ ...form, canViewRegistrations: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Manage Platform Users
                        </div>
                        <div className="text-[10px] text-slate-400">Allows viewing and managing registered user accounts</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canManageUsers}
                        onChange={(e) => setForm({ ...form, canManageUsers: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Manage Therapists
                        </div>
                        <div className="text-[10px] text-slate-400">Allows verifying and managing therapist applications</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canManageTherapists}
                        onChange={(e) => setForm({ ...form, canManageTherapists: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Manage Organizations
                        </div>
                        <div className="text-[10px] text-slate-400">Allows verifying organizations and managing corporate fee coverage</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canManageOrganizations}
                        onChange={(e) => setForm({ ...form, canManageOrganizations: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-purple-400" /> View Analytics & Revenue
                        </div>
                        <div className="text-[10px] text-slate-400">Allows viewing overall financial stats and revenue reports</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canViewAnalytics}
                        onChange={(e) => setForm({ ...form, canViewAnalytics: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Manage Workshop Popup
                        </div>
                        <div className="text-[10px] text-slate-400">Allows configuring upcoming workshop popup announcements and poster uploads</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.canManageWorkshopPopup}
                        onChange={(e) => setForm({ ...form, canManageWorkshopPopup: e.target.checked })}
                        className="w-4 h-4 accent-violet-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-amber-950/20 border border-amber-500/40 cursor-pointer hover:border-amber-500/60">
                      <div>
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-amber-400" /> Full Co-Host Super Admin Access
                        </div>
                        <div className="text-[10px] text-amber-400/80">Grants unrestricted administrative access to all tabs & controls</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.isFullAdmin}
                        onChange={(e) => setForm({ ...form, isFullAdmin: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={upsertMutation.isPending}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition shadow-lg shadow-violet-600/30"
                  >
                    {upsertMutation.isPending ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Confirmation Modal */}
      <AnimatePresence>
        {revokeConfirmId && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Revoke Delegated Access?</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Are you sure you want to remove all delegated permissions for this email address? They will immediately lose admin access.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setRevokeConfirmId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => revokeMutation.mutate(revokeConfirmId)}
                  disabled={revokeMutation.isPending}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20"
                >
                  {revokeMutation.isPending ? "Revoking..." : "Revoke Access"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
