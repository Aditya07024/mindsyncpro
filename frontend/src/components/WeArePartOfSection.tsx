import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Heart, Users, Shield, Globe, ExternalLink, X, Award, CheckCircle2, Sparkles } from "lucide-react";
import API from "@/lib/api";

interface PartnerItem {
  _id?: string;
  id?: string;
  name: string;
  category: "Organization" | "NGO" | "Clubs" | "Community" | "Partners";
  logoText: string;
  logoUrl?: string;
  description: string;
  impactMetric: string;
  location: string;
  color: string;
  verified: boolean;
  websiteUrl?: string;
  fullBio: string;
}

const DEFAULT_PARTNER_CATEGORIES = [
  { id: "all", label: "All Network" },
  { id: "Organization", label: "Organization" },
  { id: "NGO", label: "NGO" },
  { id: "Clubs", label: "Clubs" },
  { id: "Community", label: "Community" },
  { id: "Partners", label: "Partners" },
];

export const WeArePartOfSection: React.FC = () => {
  const [activePartnerModal, setActivePartnerModal] = useState<PartnerItem | null>(null);

  const { data: configData } = useQuery({
    queryKey: ["partnersConfig"],
    queryFn: () => API.partners.getConfig(),
  });

  const partnerConfig = configData?.config;

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => API.partners.list(),
  });

  const partners: PartnerItem[] = partnersData?.partners || [];

  return (
    <section id="we-are-part-of" className="mt-24 relative overflow-hidden rounded-[40px] border border-cyan-100 bg-gradient-to-b from-[#f0f9ff] via-white to-[#e6f4ff] px-6 py-20 text-slate-900 shadow-lg sm:px-10 lg:px-16">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
            <Sparkles className="size-4 text-cyan-600" />
            {partnerConfig?.badgeText || "Our Ecosystem & Collaboration Network"}
          </div>

          <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-[#012620] sm:text-5xl">
            {partnerConfig?.sectionTitle || "Organizations & Partners We Work With"}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            {partnerConfig?.sectionSubtitle ||
              "Proudly collaborating with leading Organizations, NGOs, Student Clubs, Peer Communities, and Global Health Partners to democratize mental wellness in India."}
          </p>
        </div>

        {/* Partners Showcase Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
            ))
          ) : partners.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium">
              No network partners found in this category.
            </div>
          ) : (
            partners.map((partner, idx) => (
              <motion.div
                key={partner._id || partner.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setActivePartnerModal(partner)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-cyan-100 bg-white p-7 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    {/* Logo Emblem / Image */}
                    <div className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${partner.color || "from-teal-500 to-emerald-600"} text-white font-black text-lg shadow-lg shrink-0 overflow-hidden`}>
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="size-full object-contain p-1.5 bg-white/95 rounded-2xl"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        partner.logoText || partner.name?.substring(0, 4)
                      )}
                    </div>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 border border-cyan-100">
                      {partner.category}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-xl group-hover:text-cyan-700 transition">
                      {partner.name}
                    </h3>
                    {partner.verified && (
                      <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-500">{partner.location}</p>

                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 pt-1">
                    {partner.description}
                  </p>
                </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                  {partner.impactMetric}
                </span>

                <span className="text-cyan-800 font-bold flex items-center gap-1 group-hover:translate-x-1 transition">
                  View Showcase →
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
      </div>

      {/* Partner Details Modal */}
      <AnimatePresence>
        {activePartnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePartnerModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <button
                onClick={() => setActivePartnerModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${activePartnerModal.color} text-white font-black text-xl shadow-md shrink-0 overflow-hidden`}>
                  {activePartnerModal.logoUrl ? (
                    <img
                      src={activePartnerModal.logoUrl}
                      alt={activePartnerModal.name}
                      className="size-full object-contain p-1.5 bg-white/95 rounded-2xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    activePartnerModal.logoText || activePartnerModal.name?.substring(0, 4)
                  )}
                </div>
                <div>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-800 border border-cyan-100">
                    {activePartnerModal.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-xl mt-1">{activePartnerModal.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{activePartnerModal.location}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Impact Milestone</span>
                  <p className="font-bold text-slate-900 text-base mt-0.5">{activePartnerModal.impactMetric}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Collaboration Overview</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {activePartnerModal.fullBio}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setActivePartnerModal(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={activePartnerModal.websiteUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl bg-[#012620] py-3 text-sm font-bold text-white shadow-lg hover:bg-black transition cursor-pointer flex items-center justify-center gap-2"
                >
                  Visit Network <ExternalLink className="size-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
