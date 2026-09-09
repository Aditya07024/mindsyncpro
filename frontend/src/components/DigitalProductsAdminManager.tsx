import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit3, ShoppingBag, Check, Sparkles } from "lucide-react";
import API from "@/lib/api";

export const DigitalProductsAdminManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "workbook",
    price: 199,
    originalPrice: 499,
    imageUrl: "",
    fileUrl: "",
    isFeatured: false,
    tags: "",
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["adminDigitalProducts"],
    queryFn: () => API.digitalProducts.list(),
  });

  const products = productsData?.products || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => API.digitalProducts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDigitalProducts"] });
      queryClient.invalidateQueries({ queryKey: ["digitalProducts"] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => API.digitalProducts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDigitalProducts"] });
      queryClient.invalidateQueries({ queryKey: ["digitalProducts"] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.digitalProducts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDigitalProducts"] });
      queryClient.invalidateQueries({ queryKey: ["digitalProducts"] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      category: "workbook",
      price: 199,
      originalPrice: 499,
      imageUrl: "",
      fileUrl: "",
      isFeatured: false,
      tags: "",
    });
  };

  const handleEdit = (prod: any) => {
    setEditingId(prod._id);
    setForm({
      title: prod.title || "",
      description: prod.description || "",
      category: prod.category || "workbook",
      price: prod.price || 0,
      originalPrice: prod.originalPrice || 0,
      imageUrl: prod.imageUrl || "",
      fileUrl: prod.fileUrl || "",
      isFeatured: !!prod.isFeatured,
      tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : "",
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
    badgeText: "Digital E-Commerce Wellness Store",
    sectionTitle: "Digital Product Shop",
    sectionSubtitle:
      "Download psychologist-curated CBT workbooks, guided meditation audio suites, emotion journals, and self-help tools instantly.",
  });

  const { data: configData } = useQuery({
    queryKey: ["adminDigitalProductsConfig"],
    queryFn: () => API.digitalProducts.getConfig(),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => API.digitalProducts.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDigitalProductsConfig"] });
      queryClient.invalidateQueries({ queryKey: ["digitalProductsConfig"] });
      setShowConfigModal(false);
    },
  });

  const handleOpenConfigModal = () => {
    if (configData?.config) {
      setConfigForm({
        badgeText: configData.config.badgeText || "Digital E-Commerce Wellness Store",
        sectionTitle: configData.config.sectionTitle || "Digital Product Shop",
        sectionSubtitle:
          configData.config.sectionSubtitle ||
          "Download psychologist-curated CBT workbooks, guided meditation audio suites, emotion journals, and self-help tools instantly.",
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
            <ShoppingBag className="size-5 text-teal-400" /> Digital Product Shop Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload, edit, and manage digital products (CBT Workbooks, Audios, Journals, Guides) shown on the public E-Commerce store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenConfigModal}
            className="rounded-xl bg-slate-700 hover:bg-slate-600 text-teal-300 font-bold px-4 py-2.5 text-xs flex items-center gap-1.5 border border-slate-600 transition cursor-pointer"
          >
            <Sparkles className="size-4 text-teal-400" /> Edit Shop Header Text
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Plus className="size-4" /> Add Digital Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No products found. Add your first digital product above!</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {products.map((p: any) => (
                <tr key={p._id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80"}
                        alt={p.title}
                        className="size-12 rounded-xl object-cover bg-slate-900 border border-slate-700"
                      />
                      <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{p.title}</p>
                        <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-700 text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">
                    ₹{p.price}{" "}
                    {p.originalPrice > p.price && (
                      <span className="text-[10px] text-slate-400 line-through font-normal">₹{p.originalPrice}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {p.isFeatured ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        Featured Best Seller
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Standard</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                        title="Edit Product"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.title}"?`)) {
                            deleteMutation.mutate(p._id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition"
                        title="Delete Product"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4">
            <h3 className="text-lg font-bold">
              {editingId ? "Edit Digital Product" : "Upload New Digital Product"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. CBT Mental Wellness Workbook"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Comprehensive exercises, guidance notes..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value="workbook">Workbook</option>
                    <option value="audio">Audio Kit</option>
                    <option value="journal">Journal / Tracker</option>
                    <option value="guide">Guide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">File Download URL</label>
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or S3 link"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="size-4 rounded accent-teal-400"
                />
                <label htmlFor="isFeatured" className="text-slate-300 font-semibold">Mark as Featured / Best Seller</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-slate-800 border border-slate-700 py-3 font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 transition shadow-lg"
                >
                  {editingId ? "Save Changes" : "Upload Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHOP HEADER CONFIG MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-4">
            <h3 className="text-lg font-bold">Edit Digital Product Shop Header</h3>
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
                  placeholder="e.g. Digital E-Commerce Wellness Store"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section Title</label>
                <input
                  type="text"
                  required
                  value={configForm.sectionTitle}
                  onChange={(e) => setConfigForm({ ...configForm, sectionTitle: e.target.value })}
                  placeholder="e.g. Digital Product Shop"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section Subtitle / Description</label>
                <textarea
                  required
                  rows={3}
                  value={configForm.sectionSubtitle}
                  onChange={(e) => setConfigForm({ ...configForm, sectionSubtitle: e.target.value })}
                  placeholder="e.g. Download psychologist-curated CBT workbooks..."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
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
                  className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3 transition shadow-lg cursor-pointer"
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
