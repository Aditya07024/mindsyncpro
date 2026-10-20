import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Smartphone,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Check,
  X,
  Trash2,
  Info,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Radio,
  RefreshCw,
  Eye,
  Sliders,
} from "lucide-react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminCustomNotificationsTab() {
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"custom" | "announcement" | "system" | "promotion">("announcement");
  const [targetType, setTargetType] = useState<"all" | "role" | "device_only" | "specific_users">("all");
  const [targetRole, setTargetRole] = useState<"user" | "therapist" | "org_admin" | "all">("all");
  const [link, setLink] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [previewMode, setPreviewMode] = useState<"lockscreen" | "inbox">("lockscreen");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch stats
  const { data: statsData, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["admin-notification-stats"],
    queryFn: () => API.admin.notifications.getStats(),
  });

  // Fetch history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["admin-notification-history"],
    queryFn: () => API.admin.notifications.getHistory(),
  });

  // Fetch users for specific user selection
  const { data: usersData } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: () => API.admin.users(),
    enabled: targetType === "specific_users",
  });

  const allUsers: any[] = usersData?.users || [];
  const filteredUsers = allUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.fullName || u.name || "").toLowerCase().includes(q) ||
      (u.email || u.phoneMasked || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  // Send Mutation
  const sendMutation = useMutation({
    mutationFn: () =>
      API.admin.notifications.send({
        title,
        body,
        targetType,
        targetRole,
        userIds: selectedUserIds,
        type,
        link: link.trim() || undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.message || "Custom notification sent successfully!");
      setIsConfirmModalOpen(false);
      setTitle("");
      setBody("");
      setLink("");
      setSelectedUserIds([]);
      qc.invalidateQueries({ queryKey: ["admin-notification-history"] });
      qc.invalidateQueries({ queryKey: ["admin-notification-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send notification");
    },
  });

  // Delete History Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.admin.notifications.deleteHistory(id),
    onSuccess: () => {
      toast.success("History record removed");
      qc.invalidateQueries({ queryKey: ["admin-notification-history"] });
      qc.invalidateQueries({ queryKey: ["admin-notification-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete history record");
    },
  });

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFilteredUsers = () => {
    const ids = filteredUsers.map((u) => u._id);
    setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...ids])));
  };

  const clearSelectedUsers = () => {
    setSelectedUserIds([]);
  };

  const stats = statsData?.stats || {
    totalUsers: 0,
    usersWithMobileApp: 0,
    totalMobileDevices: 0,
    usersByRole: {},
    totalBroadcasts: 0,
  };

  // Estimate audience count
  const estimatedAudienceCount = (() => {
    if (targetType === "specific_users") return selectedUserIds.length;
    if (targetType === "device_only") return stats.usersWithMobileApp;
    if (targetType === "role") {
      if (targetRole === "all") return stats.totalUsers;
      return stats.usersByRole[targetRole] || 0;
    }
    return stats.totalUsers;
  })();

  const handleSendClick = () => {
    if (!title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a notification message body");
      return;
    }
    if (targetType === "specific_users" && selectedUserIds.length === 0) {
      toast.error("Please select at least one recipient user");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-slate-900/80 border border-violet-700/40 rounded-2xl p-6 backdrop-blur shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-violet-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold tracking-wide">
              <Smartphone className="size-3.5" /> Mobile App & In-App Broadcast System
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              Send Custom Mobile Notifications
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Dispatch custom push notifications straight to your users' physical mobile devices (Android & iOS via Expo Push) and update their in-app notification inbox in real-time.
            </p>
          </div>
          <button
            onClick={() => {
              refetchStats();
              qc.invalidateQueries({ queryKey: ["admin-notification-history"] });
              toast.success("Notification metrics refreshed");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer self-start md:self-auto shrink-0"
          >
            <RefreshCw className="size-3.5" /> Refresh Stats
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="size-11 rounded-xl bg-violet-500/15 border border-violet-500/30 grid place-items-center shrink-0">
            <Smartphone className="size-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Mobile Devices</p>
            <p className="text-xl font-bold text-white">{isStatsLoading ? "…" : stats.totalMobileDevices}</p>
            <p className="text-[11px] text-emerald-400 font-medium">Expo Push Tokens</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="size-11 rounded-xl bg-purple-500/15 border border-purple-500/30 grid place-items-center shrink-0">
            <Users className="size-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Mobile App Users</p>
            <p className="text-xl font-bold text-white">{isStatsLoading ? "…" : stats.usersWithMobileApp}</p>
            <p className="text-[11px] text-slate-400">Reachable on phone</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="size-11 rounded-xl bg-sky-500/15 border border-sky-500/30 grid place-items-center shrink-0">
            <Layers className="size-5 text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Platform Users</p>
            <p className="text-xl font-bold text-white">{isStatsLoading ? "…" : stats.totalUsers}</p>
            <p className="text-[11px] text-sky-400">In-App Inbox Recipients</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 grid place-items-center shrink-0">
            <Send className="size-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Broadcasts</p>
            <p className="text-xl font-bold text-white">{isStatsLoading ? "…" : stats.totalBroadcasts}</p>
            <p className="text-[11px] text-amber-400">Campaigns Sent</p>
          </div>
        </div>
      </div>

      {/* Main Composer & Live Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Notification Composer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-violet-600/20 text-violet-400 grid place-items-center">
                <Bell className="size-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Notification Composer</h3>
                <p className="text-xs text-slate-400">Craft title, message and target your mobile audience</p>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              Est. Recipients: <span className="font-bold text-violet-400">{estimatedAudienceCount}</span>
            </span>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <label>Notification Title <span className="text-rose-400">*</span></label>
              <span className={`text-[11px] ${title.length > 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                {title.length}/60
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Free Mental Health Session Today 🌿"
              maxLength={70}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {/* Message Body Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <label>Message Body <span className="text-rose-400">*</span></label>
              <span className={`text-[11px] ${body.length > 180 ? 'text-amber-400' : 'text-slate-500'}`}>
                {body.length}/250
              </span>
            </div>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Discover our new clinical wellness features and connect with an accredited therapist right from your mobile app!"
              maxLength={300}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition resize-none leading-relaxed"
            />
          </div>

          {/* Category / Type & Optional Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Notification Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition cursor-pointer"
              >
                <option value="announcement">📢 Announcement</option>
                <option value="custom">🔔 General Notification</option>
                <option value="system">⚡ Platform Update</option>
                <option value="promotion">🎁 Promotion / Workshop</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Action Link (Optional)</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/conferences or /counseling-training"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          {/* Target Audience Selector */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Target Audience</span>
              <span className="text-[11px] text-slate-400 font-normal">Who should receive this alert?</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "all", label: "All Users", desc: "Every user & device" },
                { id: "role", label: "By User Role", desc: "Seekers, counsellors..." },
                { id: "device_only", label: "Mobile Only", desc: "Devices with app installed" },
                { id: "specific_users", label: "Select Users", desc: "Custom user picker" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetType(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    targetType === opt.id
                      ? "bg-violet-600/20 border-violet-500 text-white shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <p className="font-semibold text-xs text-white">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Sub-selector for Roles */}
            {targetType === "role" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 mt-2"
              >
                <p className="text-xs text-slate-300 font-medium">Select target role group:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Roles", count: stats.totalUsers },
                    { id: "user", label: "Seekers (Normal Users)", count: stats.usersByRole?.user || 0 },
                    { id: "therapist", label: "Counsellors & Therapists", count: stats.usersByRole?.therapist || 0 },
                    { id: "org_admin", label: "Organization Admins", count: stats.usersByRole?.org_admin || 0 },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setTargetRole(r.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        targetRole === r.id
                          ? "bg-violet-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/60 text-slate-300">
                        {r.count}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Sub-selector for Specific Users with Search */}
            {targetType === "specific_users" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 mt-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-300 font-medium">
                      Selected: <span className="font-bold text-violet-400">{selectedUserIds.length} users</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllFilteredUsers}
                      className="text-violet-400 hover:underline cursor-pointer"
                    >
                      Select all filtered
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={clearSelectedUsers}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="size-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-4">No matching users found.</p>
                  ) : (
                    filteredUsers.slice(0, 50).map((u) => {
                      const isSelected = selectedUserIds.includes(u._id);
                      const hasPhoneApp = u.expoPushTokens && u.expoPushTokens.length > 0;
                      return (
                        <div
                          key={u._id}
                          onClick={() => toggleSelectUser(u._id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? "bg-violet-950/60 border-violet-600 text-white"
                              : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-violet-600 border-violet-500" : "border-slate-700 bg-slate-800"
                              }`}
                            >
                              {isSelected && <Check className="size-3 text-white" />}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate">{u.fullName || u.name || "Anonymous Member"}</p>
                              <p className="text-[10px] text-slate-500 truncate">{u.email || u.phoneMasked || u._id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {hasPhoneApp && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                <Smartphone className="size-2.5" /> App
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                              {u.role || "user"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle("");
                setBody("");
                setLink("");
                setSelectedUserIds([]);
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer text-xs"
            >
              Reset Form
            </Button>
            <Button
              type="button"
              onClick={handleSendClick}
              disabled={sendMutation.isPending || !title.trim() || !body.trim()}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-violet-700/25 cursor-pointer flex items-center gap-2"
            >
              <Send className="size-3.5" />
              {sendMutation.isPending ? "Dispatching..." : "Send Notification"}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Mobile Smartphone Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="size-3.5 text-violet-400" /> Live Device Preview
            </h4>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setPreviewMode("lockscreen")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  previewMode === "lockscreen"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Push Banner
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("inbox")}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  previewMode === "inbox"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                In-App Inbox
              </button>
            </div>
          </div>

          {/* Smartphone Frame */}
          <div className="mx-auto w-[310px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative">
            {/* Screen Bezel */}
            <div className="w-full bg-[#0F172A] rounded-[34px] overflow-hidden flex flex-col h-[520px] relative border border-slate-800">
              {/* Dynamic Island / Notch */}
              <div className="pt-2 px-6 flex items-center justify-between text-white text-[10px] font-semibold z-20">
                <span>9:41</span>
                <div className="w-20 h-4 bg-black rounded-full" />
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-sm border border-white flex items-center p-0.5">
                    <div className="w-full h-full bg-white rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Screen Body */}
              {previewMode === "lockscreen" ? (
                /* LOCK SCREEN MODE */
                <div className="flex-1 p-3 flex flex-col justify-start pt-8 relative overflow-hidden bg-gradient-to-b from-indigo-950/80 via-slate-900 to-black">
                  {/* Subtle wallpaper elements */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center text-white/90">
                    <p className="text-[11px] text-white/70 font-medium">Wednesday, October 21</p>
                    <h1 className="text-4xl font-light tracking-tight mt-0.5">09:41</h1>
                  </div>

                  {/* Push Notification Card Banner */}
                  <div className="mt-28">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl text-white space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <div className="size-4 rounded-md bg-[#2E6E65] flex items-center justify-center text-[9px] font-bold text-white">
                            M
                          </div>
                          <span className="font-semibold text-white tracking-wide text-[10px]">
                            MYMINDTHERAPYFRIEND
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400">now</span>
                      </div>

                      <div className="pt-0.5">
                        <p className="font-semibold text-xs text-white leading-tight">
                          {title.trim() || "Notification Title Preview"}
                        </p>
                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-3 mt-0.5">
                          {body.trim() || "Your custom notification message text will be displayed prominently here on the user's phone lock screen."}
                        </p>
                      </div>

                      {link && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-violet-400">
                          <ExternalLink className="size-2.5" />
                          <span className="truncate">Tap to open: {link}</span>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Lock Screen Bottom Bar */}
                  <div className="mt-auto pb-4 flex justify-between px-6">
                    <div className="size-9 rounded-full bg-white/10 backdrop-blur grid place-items-center text-white">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="size-9 rounded-full bg-white/10 backdrop-blur grid place-items-center text-white">
                      <Smartphone className="size-4" />
                    </div>
                  </div>
                  <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mb-1" />
                </div>
              ) : (
                /* IN-APP INBOX MODE */
                <div className="flex-1 bg-[#FAFAF9] text-slate-900 flex flex-col overflow-hidden">
                  {/* In-app Header */}
                  <div className="px-4 py-3 bg-white border-b border-stone-200 flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900">Notifications</span>
                    <span className="text-[10px] font-bold text-[#2E6E65] bg-[#2E6E65]/10 px-2 py-0.5 rounded-full">
                      1 new alert
                    </span>
                  </div>

                  {/* Notification List in App */}
                  <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
                    {/* The Live Notification Card */}
                    <div className="bg-white rounded-xl p-3 border border-[#2E6E65]/30 shadow-sm relative overflow-hidden">
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-lg bg-[#2E6E65]/10 text-[#2E6E65] grid place-items-center shrink-0">
                          <Bell className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-stone-900 truncate">
                              {title.trim() || "Notification Title"}
                            </p>
                            <span className="size-2 rounded-full bg-[#2E6E65] shrink-0" />
                          </div>
                          <p className="text-[11px] text-stone-600 line-clamp-3 mt-0.5 leading-snug">
                            {body.trim() || "Your notification message will appear in the member's in-app inbox."}
                          </p>
                          <p className="text-[9px] text-stone-400 mt-1">Today · Just now</p>
                        </div>
                      </div>
                    </div>

                    {/* Placeholder previous cards */}
                    <div className="bg-white rounded-xl p-3 border border-stone-200 opacity-60">
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 rounded-lg bg-stone-100 text-stone-600 grid place-items-center shrink-0">
                          <CheckCircle2 className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-stone-800">Booking Confirmed</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">Your clinical session has been scheduled.</p>
                          <p className="text-[9px] text-stone-400 mt-1">Yesterday</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* In-app bottom home indicator */}
                  <div className="w-24 h-1 bg-stone-300 rounded-full mx-auto my-1.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-violet-400" />
            <h3 className="font-bold text-white text-base">Past Notification Broadcasts</h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Logged: <span className="font-bold text-white">{historyData?.total || 0}</span>
          </span>
        </div>

        {isHistoryLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading notification history...</div>
        ) : !historyData?.notifications || historyData.notifications.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Bell className="size-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No custom notifications sent yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the composer above to dispatch your first custom notification to mobile devices and user inboxes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Title & Message</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4 text-center">In-App Recip.</th>
                  <th className="py-3 px-4 text-center">Mobile Push</th>
                  <th className="py-3 px-4">Sent By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyData.notifications.map((item: any) => {
                  const dateStr = new Date(item.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-white truncate">{item.title}</p>
                        <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{item.body}</p>
                        {item.link && (
                          <span className="text-[10px] text-violet-400 inline-flex items-center gap-1 mt-0.5">
                            <ExternalLink className="size-2.5" /> {item.link}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-950/60 text-violet-300 border border-violet-800/40">
                          {item.type || "custom"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {item.targetType === "all"
                            ? "All Users"
                            : item.targetType === "device_only"
                            ? "Mobile Devices Only"
                            : item.targetType === "role"
                            ? `Role: ${item.targetRole || "All"}`
                            : `${item.targetCount} Specific Users`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-slate-200">
                        {item.targetCount}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-emerald-400">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          <Smartphone className="size-2.5" /> {item.pushSentCount || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {item.sentByEmail || "Admin"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Remove this notification log entry?")) {
                              deleteMutation.mutate(item._id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded-lg transition cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-violet-600/20 text-violet-400 grid place-items-center">
                  <Send className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Confirm Broadcast</h3>
                  <p className="text-xs text-slate-400">Review before dispatching to mobile devices</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Title:</span>
                  <p className="font-bold text-white text-sm mt-0.5">{title}</p>
                </div>
                <div>
                  <span className="text-slate-400">Message:</span>
                  <p className="text-slate-300 mt-0.5">{body}</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target Audience:</span>
                  <span className="font-semibold text-violet-400">
                    {targetType === "all"
                      ? "All Users"
                      : targetType === "device_only"
                      ? "Mobile Devices Only"
                      : targetType === "role"
                      ? `Role: ${targetRole}`
                      : `${selectedUserIds.length} Selected Users`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Est. In-App Inboxes:</span>
                  <span className="font-bold text-white">{estimatedAudienceCount} users</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Registered Phone Devices:</span>
                  <span className="font-bold text-emerald-400">{stats.totalMobileDevices} devices</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs px-5 cursor-pointer flex items-center gap-2"
                >
                  {sendMutation.isPending ? "Sending..." : "Yes, Dispatch Now"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
