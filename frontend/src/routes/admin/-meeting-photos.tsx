import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Edit2,
  Star,
  Users,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  X,
  Link as LinkIcon,
  MessageSquareQuote,
  Layers,
} from "lucide-react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getNormalizedPosterUrl } from "@/lib/utils";

interface PhotoForm {
  title: string;
  imageUrl: string;
  imageUrls: string[];
  caption: string;
  speakerName: string;
  speakerRole: string;
  meetingType: string;
  attendeeCount: number;
  rating: number;
  dateText: string;
  displayOrder: number;
  isActive: boolean;
}

const DEFAULT_FORM: PhotoForm = {
  title: "",
  imageUrl: "",
  imageUrls: [],
  caption: "",
  speakerName: "",
  speakerRole: "",
  meetingType: "",
  attendeeCount: 0,
  rating: 5,
  dateText: "",
  displayOrder: 0,
  isActive: true,
};

export function AdminMeetingPhotosTab() {
  const qc = useQueryClient();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PhotoForm>(DEFAULT_FORM);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch all meeting photos for admin
  const { data, isLoading } = useQuery({
    queryKey: ["admin-meeting-photos"],
    queryFn: () => API.meetingPhotos.getAdminAll(),
  });

  const photos = data?.photos || [];

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: PhotoForm) => {
      const primaryUrl = formData.imageUrls[0] || formData.imageUrl || "";
      const payload = {
        ...formData,
        imageUrl: primaryUrl,
        imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : [primaryUrl],
      };

      if (editingId) {
        return API.meetingPhotos.update(editingId, payload);
      }
      return API.meetingPhotos.create(payload);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Meeting photos saved successfully!");
      qc.invalidateQueries({ queryKey: ["admin-meeting-photos"] });
      qc.invalidateQueries({ queryKey: ["public-meeting-photos"] });
      closeModal();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save meeting photo");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.meetingPhotos.delete(id),
    onSuccess: () => {
      toast.success("Meeting photo entry deleted");
      qc.invalidateQueries({ queryKey: ["admin-meeting-photos"] });
      qc.invalidateQueries({ queryKey: ["public-meeting-photos"] });
      setDeleteConfirmId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete meeting photo");
    },
  });

  // Quick toggle active state
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      API.meetingPhotos.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Visibility updated");
      qc.invalidateQueries({ queryKey: ["admin-meeting-photos"] });
      qc.invalidateQueries({ queryKey: ["public-meeting-photos"] });
    },
  });

  const openNewForm = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setCustomUrlInput("");
    setFormModalOpen(true);
  };

  const openEditForm = (item: any) => {
    setEditingId(item._id);
    const existingList = Array.isArray(item.imageUrls) && item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl ? [item.imageUrl] : [];

    setForm({
      title: item.title || "",
      imageUrl: item.imageUrl || existingList[0] || "",
      imageUrls: existingList,
      caption: item.caption || "",
      speakerName: item.speakerName || "",
      speakerRole: item.speakerRole || "",
      meetingType: item.meetingType || "",
      attendeeCount: item.attendeeCount || 0,
      rating: item.rating || 5,
      dateText: item.dateText || "",
      displayOrder: item.displayOrder || 0,
      isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
    });
    setCustomUrlInput("");
    setFormModalOpen(true);
  };

  const closeModal = () => {
    setFormModalOpen(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setCustomUrlInput("");
  };

  // Multi-file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const fileArray = Array.from(files);
      const res = await API.meetingPhotos.uploadPhoto(fileArray);

      const newUrls = res.imageUrls || (res.imageUrl ? [res.imageUrl] : []);
      setForm((prev) => {
        const combined = [...prev.imageUrls, ...newUrls];
        return {
          ...prev,
          imageUrls: combined,
          imageUrl: combined[0] || "",
        };
      });
      toast.success(`${newUrls.length} screenshot(s) uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image file(s)");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    setForm((prev) => {
      const combined = [...prev.imageUrls, url];
      return {
        ...prev,
        imageUrls: combined,
        imageUrl: combined[0] || "",
      };
    });
    setCustomUrlInput("");
    toast.success("Image URL added to session collection");
  };

  const removeImageAt = (index: number) => {
    setForm((prev) => {
      const updated = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: updated,
        imageUrl: updated[0] || "",
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }
    if (form.imageUrls.length === 0 && !form.imageUrl.trim()) {
      toast.error("Please upload at least one screenshot image");
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white shadow-lg border border-teal-500/20">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider border border-teal-500/30">
            <Sparkles className="size-3.5" /> Landing Showcase Controls
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Meeting Photos & Testimonials Gallery
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Upload session screenshots (single or multiple photos per meeting), group therapy photos, and participant testimonials to display dynamically on the Landing Page.
          </p>
        </div>

        <Button
          onClick={openNewForm}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all gap-2 self-start md:self-auto"
        >
          <Plus className="size-4" />
          Add Meeting Screenshot
        </Button>
      </div>

      {/* Grid of uploaded meeting photos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="size-8 text-teal-600 animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
          <div className="size-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <ImageIcon className="size-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No meeting screenshots added yet</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
            Upload your first meeting screenshot or group therapy session photos to feature them on the landing page!
          </p>
          <Button onClick={openNewForm} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
            <Plus className="size-4 mr-2" /> Add First Screenshot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((item: any) => {
            const list = Array.isArray(item.imageUrls) && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl];
            const normalizedImg = getNormalizedPosterUrl(list[0]);
            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  item.isActive ? "border-slate-200" : "border-slate-300 bg-slate-50/50 opacity-75"
                }`}
              >
                {/* Image Preview Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  {normalizedImg ? (
                    <img
                      src={normalizedImg}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <ImageIcon className="size-10" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm ${
                        item.isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {item.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                    {list.length > 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-bold shadow-sm">
                        <Layers className="size-3" /> {list.length} Photos
                      </span>
                    )}
                  </div>

                  {/* Meeting Tag Badge */}
                  {item.meetingType && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-semibold">
                        <Tag className="size-3 text-teal-400" />
                        {item.meetingType}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{item.title}</h3>
                    {item.rating > 0 && (
                      <div className="flex items-center gap-1 shrink-0 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {item.rating}.0
                      </div>
                    )}
                  </div>

                  {item.caption && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 relative">
                      <MessageSquareQuote className="size-3.5 inline mr-1 text-teal-600" />
                      "{item.caption}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      {item.speakerName && (
                        <>
                          <span className="size-2 rounded-full bg-teal-500"></span>
                          <span className="font-bold">{item.speakerName}</span>
                          {item.speakerRole && <span className="text-slate-400 text-[11px]">({item.speakerRole})</span>}
                        </>
                      )}
                    </div>
                    {item.attendeeCount > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Users className="size-3 text-slate-400" />
                        {item.attendeeCount} Attendees
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: item._id, isActive: checked })
                        }
                      />
                      <span className="text-xs text-slate-500 font-medium">Show on Landing</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(item)}
                        className="h-8 px-2.5 rounded-lg text-slate-700 hover:text-teal-700 hover:border-teal-300"
                      >
                        <Edit2 className="size-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal with MULTI-IMAGE UPLOAD SUPPORT */}
      <AnimatePresence>
        {formModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                    <ImageIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingId ? "Edit Meeting Screenshot(s)" : "Add Meeting Screenshot(s) & Testimonial"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload single or multiple photos to display in the landing page gallery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Multi-Image Upload Dropzone / URL Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Screenshot Images ({form.imageUrls.length}) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-teal-600 font-semibold">Multiple photos allowed</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-dashed border-teal-400 bg-teal-50/60 text-teal-800 text-xs font-bold cursor-pointer hover:bg-teal-100/60 transition-all shrink-0">
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-2" /> Uploading Photos...
                        </>
                      ) : (
                        <>
                          <Upload className="size-4 mr-2" /> Upload Multiple Photos
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>

                    <span className="text-xs font-medium text-slate-400 self-center">OR</span>

                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-2.5 size-4 text-slate-400" />
                        <input
                          type="url"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          placeholder="Paste image URL (https://...)"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addCustomUrl}
                        variant="outline"
                        className="px-3 py-2 text-xs font-bold rounded-xl border-slate-200 hover:border-teal-400"
                      >
                        + Add
                      </Button>
                    </div>
                  </div>

                  {/* Multi-Image Thumbnails Gallery in Form */}
                  {form.imageUrls.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-500">Uploaded Photos Collection:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        {form.imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative group/thumb aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-300 shadow-2xs"
                          >
                            <img
                              src={getNormalizedPosterUrl(url)}
                              alt={`Screenshot ${idx + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                            />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-teal-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImageAt(idx)}
                              className="absolute top-1 right-1 size-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 group-hover/thumb:opacity-100 transition-opacity"
                              title="Remove photo"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Meeting / Session Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Weekly Group Mindfulness & CBT Session"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  />
                </div>

                {/* Caption / Testimonial Quote */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Testimonial Quote / Session Highlight
                  </label>
                  <textarea
                    rows={3}
                    value={form.caption}
                    onChange={(e) => setForm({ ...form, caption: e.target.value })}
                    placeholder='e.g. "Sharing feelings with people who genuinely understand made all the difference in my anxiety journey."'
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  />
                </div>

                {/* Speaker Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Host / Participant Name</label>
                    <input
                      type="text"
                      value={form.speakerName}
                      onChange={(e) => setForm({ ...form, speakerName: e.target.value })}
                      placeholder="e.g. Dr. Ananya Sharma / Rahul M."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Role / Designation</label>
                    <input
                      type="text"
                      value={form.speakerRole}
                      onChange={(e) => setForm({ ...form, speakerRole: e.target.value })}
                      placeholder="e.g. Senior Psychologist / Attendee"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Tags, Rating, Attendees, Order */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Category / Tag</label>
                    <input
                      type="text"
                      list="category-suggestions"
                      value={form.meetingType}
                      onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                      placeholder="e.g. Group Therapy, CBT Workshop"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                    <datalist id="category-suggestions">
                      {Array.from(new Set(photos.map((p: any) => p.meetingType).filter((c: any) => Boolean(c)))).map(
                        (cat: any) => (
                          <option key={cat} value={cat} />
                        )
                      )}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Rating (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Attendee Count</label>
                    <input
                      type="number"
                      min={0}
                      value={form.attendeeCount}
                      onChange={(e) => setForm({ ...form, attendeeCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Date & Active Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="space-y-1 w-full sm:w-1/2">
                    <label className="block text-xs font-bold text-slate-700">Date Text (Optional)</label>
                    <input
                      type="text"
                      value={form.dateText}
                      onChange={(e) => setForm({ ...form, dateText: e.target.value })}
                      placeholder="e.g. August 2026"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 sm:pt-0">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                    <span className="text-xs font-bold text-slate-800">Publish Immediately</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="size-4 mr-1.5" /> Save Meeting Photos
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center space-y-4"
            >
              <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Meeting Screenshot Collection?</h3>
                <p className="text-xs text-slate-500">
                  This action will permanently remove this meeting entry and all associated photos.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate(deleteConfirmId)}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded-xl"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
