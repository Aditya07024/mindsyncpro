import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Save,
  Trash2,
  Calendar,
  Link as LinkIcon,
  Video,
  Eye,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getNormalizedPosterUrl } from "@/lib/utils";

export function AdminPopupAnnouncementTab() {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "",
    badgeText: "",
    description: "",
    dateText: "",
    posterUrl: "",
    conferenceUrl: "/conferences",
    buttonText: "Go to Conference Page",
    isActive: true,
  });

  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Fetch current popup config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["admin-popup-announcement"],
    queryFn: () => API.popupAnnouncement.getAdminConfig(),
  });

  // Fetch conferences list for conference picker dropdown
  const { data: conferencesData } = useQuery({
    queryKey: ["admin-conferences-list"],
    queryFn: () => API.conference.list(),
  });

  useEffect(() => {
    if (configData?.announcement) {
      const a = configData.announcement;
      setForm({
        title: a.title || "",
        badgeText: a.badgeText || "Live Workshop",
        description: a.description || "",
        dateText: a.dateText || "",
        posterUrl: a.posterUrl || "",
        conferenceUrl: a.conferenceUrl || "/conferences",
        buttonText: a.buttonText || "Go to Conference Page",
        isActive: a.isActive !== undefined ? Boolean(a.isActive) : true,
      });
    }
  }, [configData]);

  // Mutation to update config
  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => API.popupAnnouncement.updateConfig(data),
    onSuccess: (res) => {
      toast.success(res.message || "Popup announcement saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-popup-announcement"] });
      qc.invalidateQueries({ queryKey: ["active-popup-announcement"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update popup announcement");
    },
  });

  // Handle poster image upload
  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WEBP, GIF)");
      return;
    }

    setUploadingPoster(true);
    try {
      const res = await API.popupAnnouncement.uploadPoster(file);
      setForm((prev) => ({ ...prev, posterUrl: res.posterUrl }));
      toast.success("Poster image uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload poster image");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Announcement title is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Announcement description is required");
      return;
    }
    updateMutation.mutate(form);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const conferencesList = conferencesData?.conferences || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 p-6 sm:p-8 rounded-3xl border border-teal-500/20 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30 mb-3">
          <Sparkles className="size-3.5" />
          <span>Landing Page Announcement Modal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Workshop Popup Configuration</h2>
        <p className="mt-1 text-sm text-slate-300 max-w-xl">
          Configure details for upcoming workshops, upload event poster images, and direct landing page visitors to your conference page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Popup Details
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {form.isActive ? "Active (Showing)" : "Inactive (Hidden)"}
                </span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                  className="data-[state=checked]:bg-teal-500"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Workshop / Event Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. MindSync Workshop: Stress Relief & Emotional Wellness"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm transition-all"
                required
              />
            </div>

            {/* Badge & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Badge Tag Text
                </label>
                <input
                  type="text"
                  value={form.badgeText}
                  onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                  placeholder="e.g. Live Workshop, Webinar"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Date / Time Tag
                </label>
                <input
                  type="text"
                  value={form.dateText}
                  onChange={(e) => setForm({ ...form, dateText: e.target.value })}
                  placeholder="e.g. Saturday, Aug 22 at 5:00 PM IST"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Description / Overview <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Provide details about the workshop session, what users will learn, and expert speakers..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm leading-relaxed"
                required
              />
            </div>

            {/* Poster Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Workshop Poster Image
              </label>

              <div className="space-y-3">
                {form.posterUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 group">
                    <img
                      src={getNormalizedPosterUrl(form.posterUrl)}
                      alt="Workshop Poster Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setForm({ ...form, posterUrl: "" })}
                        className="rounded-xl flex items-center gap-1.5"
                      >
                        <Trash2 className="size-4" />
                        Remove Poster
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                    <input
                      type="file"
                      id="poster-file-input"
                      accept="image/*"
                      onChange={handlePosterFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="poster-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      {uploadingPoster ? (
                        <Loader2 className="size-8 animate-spin text-teal-600 mb-2" />
                      ) : (
                        <div className="p-3 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl mb-3">
                          <Upload className="size-6" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {uploadingPoster ? "Uploading Poster..." : "Click to upload Poster Image"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        PNG, JPG, WEBP or GIF (Max 10MB)
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium shrink-0">Or enter Image URL:</span>
                  <input
                    type="url"
                    value={form.posterUrl}
                    onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                    placeholder="https://example.com/poster.jpg"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Conference Target Link */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Conference Navigation Target
              </label>

              {conferencesList.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    Select active conference:
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setForm({ ...form, conferenceUrl: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">-- Select Specific Conference --</option>
                    <option value="/conferences">Main Conferences Hub (/conferences)</option>
                    {conferencesList.map((conf: any) => (
                      <option key={conf._id} value={`/conferences?id=${conf._id}`}>
                        {conf.title} ({conf.meetingDate} {conf.meetingTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Target Route / URL:
                </span>
                <div className="relative">
                  <LinkIcon className="size-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={form.conferenceUrl}
                    onChange={(e) => setForm({ ...form, conferenceUrl: e.target.value })}
                    placeholder="/conferences"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Button Text */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                CTA Button Text
              </label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                placeholder="Go to Conference Page"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Save className="size-5" />
                    <span>Save Popup Settings</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="size-4 text-teal-400" />
              <span>Live Landing Page Preview</span>
            </h3>
            <span className="text-xs text-slate-300 font-medium">
              Simulated modal overlay
            </span>
          </div>

          <div className="relative rounded-3xl p-4 sm:p-6 bg-slate-950 border border-slate-800 shadow-2xl min-h-[460px] flex items-center justify-center overflow-hidden">
            {/* Background representation */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none" />

            {/* Simulated Modal Card */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-teal-500/30 z-10">
              {/* Close Button */}
              <div className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-slate-900/60 text-white/90">
                <X className="size-4" />
              </div>

              {/* Poster */}
              {form.posterUrl ? (
                <div className="relative w-full overflow-hidden shrink-0">
                  <img
                    src={getNormalizedPosterUrl(form.posterUrl)}
                    alt="Poster Preview"
                    className="w-full h-auto max-h-72 object-cover object-center block"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-teal-600 to-emerald-700 p-4 flex flex-col justify-end">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/20 text-white w-max">
                    <Sparkles className="size-3" />
                    {form.badgeText || "Live Workshop"}
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {form.title || "Workshop Title Placeholder"}
                </h4>

                {form.dateText && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                    <Calendar className="size-3.5" />
                    <span>{form.dateText}</span>
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {form.description || "Workshop description details will appear here for visitors..."}
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-md">
                    <Video className="size-3.5" />
                    <span>{form.buttonText || "Go to Conference Page"}</span>
                  </div>
                  <div className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-medium text-center">
                    Dismiss
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
