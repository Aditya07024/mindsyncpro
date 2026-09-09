import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit3, Sparkles, Globe, Building2, Check } from "lucide-react";
import API from "@/lib/api";

export const AdminPartnersManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Organization",
    logoText: "",
    description: "",
    impactMetric: "",
    location: "India",
    color: "from-teal-500 to-emerald-600",
    verified: true,
    websiteUrl: "https://www.mymindtherapyfriend.com",
    fullBio: "",
  });

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["adminPartners"],
    queryFn: () => API.partners.list(),
  });

  const partners = partnersData?.partners || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => API.partners.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPartners"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => API.partners.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPartners"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.partners.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPartners"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      category: "Organization",
      logoText: "",
      description: "",
      impactMetric: "",
      location: "India",
      color: "from-teal-500 to-emerald-600",
      verified: true,
      websiteUrl: "https://www.mymindtherapyfriend.com",
      fullBio: "",
    });
  };

  const handleEdit = (partner: any) => {
    setEditingId(partner._id);
    setForm({
      name: partner.name || "",
      category: partner.category || "Organization",
      logoText: partner.logoText || "",
      description: partner.description || "",
      impactMetric: partner.impactMetric || "",
      location: partner.location || "India",
      color: partner.color || "from-teal-500 to-emerald-600",
      verified: partner.verified !== undefined ? partner.verified : true,
      websiteUrl: partner.websiteUrl || "https://www.mymindtherapyfriend.com",
      fullBio: partner.fullBio || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    badgeText: "Our Ecosystem & Collaboration Network",
    sectionTitle: "We Are Part Of",
    sectionSubtitle:
      "Proudly collaborating with leading Organizations, NGOs, Student Clubs, Peer Communities, and Global Health Partners to democratize mental wellness in India.",
  });

  const { data: configData } = useQuery({
    queryKey: ["adminPartnersConfig"],
    queryFn: () => API.partners.getConfig(),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => API.partners.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPartnersConfig"] });
      queryClient.invalidateQueries({ queryKey: ["partnersConfig"] });
      setShowConfigModal(false);
    },
  });

  const handleOpenConfigModal = () => {
    if (configData?.config) {
      setConfigForm({
        badgeText: configData.config.badgeText || "Our Ecosystem & Collaboration Network",
        sectionTitle: configData.config.sectionTitle || "We Are Part Of",
        sectionSubtitle:
          configData.config.sectionSubtitle ||
          "Proudly collaborating with leading Organizations, NGOs, Student Clubs, Peer Communities, and Global Health Partners to democratize mental wellness in India.",
      });
    }
    setShowConfigModal(true);
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate(configForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="size-5 text-cyan-400" /> Network & Ecosystem Partners Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage partner organizations, NGOs, student clubs, communities, and global health alliances showcased on "We Are Part Of".
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenConfigModal}
            className="rounded-xl bg-slate-700 hover:bg-slate-600 text-cyan-300 font-bold px-4 py-2.5 text-xs flex items-center gap-1.5 border border-slate-600 transition cursor-pointer"
          >
            <Sparkles className="size-4 text-cyan-400" /> Edit Header Text
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Plus className="size-4" /> Add Network Partner
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading network partners...</div>
        ) : partners.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No partners found. Click above to add a partner!</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-4">Partner Name & Emblem</th>
                <th className="p-4">Category</th>
                <th className="p-4">Impact Metric</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {partners.map((p: any) => (
                <tr key={p._id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${p.color || "from-teal-500 to-emerald-600"} text-white font-bold text-xs shadow-md shrink-0`}>
                        {p.logoText || p.name?.substring(0, 4)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{p.name}</p>
                        <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-700 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-emerald-400">
                    {p.impactMetric}
                  </td>
                  <td className="p-4 text-slate-400">
                    {p.location}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
                        title="Edit Partner"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove partner "${p.name}"?`)) {
                            deleteMutation.mutate(p._id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition cursor-pointer"
                        title="Delete Partner"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">
              {editingId ? "Edit Network Partner" : "Add Network Partner"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Partner Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Indian Mental Health Foundation"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="Organization">Organization</option>
                    <option value="NGO">NGO</option>
                    <option value="Clubs">Clubs</option>
                    <option value="Community">Community</option>
                    <option value="Partners">Partners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Logo Text Emblem</label>
                  <input
                    type="text"
                    value={form.logoText}
                    onChange={(e) => setForm({ ...form, logoText: e.target.value })}
                    placeholder="e.g. IMHF"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Short Description</label>
                <textarea
                  required
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief summary shown on cards..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Collaboration Bio</label>
                <textarea
                  required
                  rows={3}
                  value={form.fullBio}
                  onChange={(e) => setForm({ ...form, fullBio: e.target.value })}
                  placeholder="Detailed collaboration bio shown in modal..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Impact Metric</label>
                  <input
                    type="text"
                    value={form.impactMetric}
                    onChange={(e) => setForm({ ...form, impactMetric: e.target.value })}
                    placeholder="e.g. 50,000+ Lives Impacted"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. New Delhi, India"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Website URL</label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
                >
                  {editingId ? "Save Changes" : "Add Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ECOSYSTEM HEADER CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4">
            <h3 className="text-lg font-bold">Edit Ecosystem Network Header</h3>
            <p className="text-xs text-slate-400">
              Customize the section title, subtitle description, and badge shown to public visitors on the landing page.
            </p>

            <form onSubmit={handleConfigSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Badge Text</label>
                <input
                  type="text"
                  required
                  value={configForm.badgeText}
                  onChange={(e) => setConfigForm({ ...configForm, badgeText: e.target.value })}
                  placeholder="e.g. Our Ecosystem & Collaboration Network"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section Title</label>
                <input
                  type="text"
                  required
                  value={configForm.sectionTitle}
                  onChange={(e) => setConfigForm({ ...configForm, sectionTitle: e.target.value })}
                  placeholder="e.g. We Are Part Of"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section Subtitle / Description</label>
                <textarea
                  required
                  rows={3}
                  value={configForm.sectionSubtitle}
                  onChange={(e) => setConfigForm({ ...configForm, sectionSubtitle: e.target.value })}
                  placeholder="e.g. Proudly collaborating with leading Organizations..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
                >
                  Save Header Text
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
