import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Star,
  Users,
  Tag,
  MessageSquareQuote,
  Maximize2,
  X,
  Calendar,
  Sparkles,
  Loader2,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import API from "@/lib/api";
import { getNormalizedPosterUrl } from "@/lib/utils";

export function MeetingPhotosShowcase() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const [lightboxImgIdx, setLightboxImgIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchPhotos() {
      try {
        setLoading(true);
        const res = await API.meetingPhotos.getPublic();
        if (isMounted && res?.photos) {
          setPhotos(res.photos);
        }
      } catch (err) {
        console.error("Failed to load meeting photos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPhotos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically extract unique categories ONLY from uploaded photos
  const availableCategories = Array.from(
    new Set(
      photos
        .map((p) => (p.meetingType ? p.meetingType.trim() : ""))
        .filter((cat) => cat.length > 0)
    )
  );

  const tags = availableCategories.length > 0 ? ["All", ...availableCategories] : [];

  // Filter photos strictly based on selected category
  const filteredPhotos = photos.filter((item) => {
    if (selectedTag === "All") return true;
    return item.meetingType?.trim().toLowerCase() === selectedTag.toLowerCase();
  });

  const openLightbox = (photo: any, imgIndex: number = 0) => {
    setLightboxPhoto(photo);
    setLightboxImgIdx(imgIndex);
  };

  return (
    <section className="relative mt-24 overflow-hidden rounded-[36px] border border-teal-100 bg-gradient-to-b from-slate-900 via-[#012620] to-slate-950 p-6 sm:p-10 text-white shadow-2xl">
      {/* Background Lighting & Glow Accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Section Header */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-300 backdrop-blur-md shadow-sm">
          <Camera className="size-4 text-teal-400" />
          Live Session Showcase & Testimonials
        </div>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Inside Our Live Therapy & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            Group Healing Sessions
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Explore real meeting screenshots, participant stories, and expert-guided mindfulness workshops uploaded by our platform administrators.
        </p>

        {/* Dynamic Category Filter Pills */}
        {tags.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                  selectedTag === tag
                    ? "bg-teal-500 text-slate-950 border-teal-400 shadow-lg shadow-teal-500/20 scale-105"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area: Photos Grid or Loading State or Empty State */}
      <div className="relative z-10 mt-12">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="size-6 text-teal-400 animate-spin" />
            <span className="text-sm font-medium">Loading session gallery...</span>
          </div>
        ) : photos.length === 0 ? (
          /* Clean Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md text-center max-w-lg mx-auto">
            <div className="size-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
              <ImageIcon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Session Gallery Coming Soon</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Meeting screenshots and participant testimonials uploaded from the Admin Dashboard will appear here dynamically.
            </p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          /* Empty filter result */
          <div className="text-center py-12 text-slate-400 text-sm">
            No meeting photos found in category "<span className="text-teal-300 font-bold">{selectedTag}</span>".
          </div>
        ) : (
          /* Grid of Admin-Uploaded Photos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPhotos.map((photo, index) => {
                const imgList: string[] =
                  Array.isArray(photo.imageUrls) && photo.imageUrls.length > 0
                    ? photo.imageUrls
                    : photo.imageUrl
                    ? [photo.imageUrl]
                    : [];

                const primaryUrl = imgList[0] || "";
                const displayUrl = primaryUrl.startsWith("http") ? primaryUrl : getNormalizedPosterUrl(primaryUrl);

                return (
                  <motion.div
                    key={photo._id || index}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-5 shadow-xl transition-all duration-300 hover:border-teal-400/50 hover:bg-white/10 hover:-translate-y-1"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-950">
                      <img
                        src={displayUrl}
                        alt={photo.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        {photo.meetingType && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-teal-300 text-xs font-semibold">
                            <Tag className="size-3.5 text-teal-400" />
                            {photo.meetingType}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {imgList.length > 1 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/90 text-slate-950 text-xs font-black backdrop-blur-md shadow-sm">
                              <Layers className="size-3.5" />
                              {imgList.length} Photos
                            </span>
                          )}

                          {photo.rating > 0 && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold backdrop-blur-md">
                              <Star className="size-3.5 fill-amber-400 text-amber-400" />
                              {photo.rating}.0
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lightbox Expand Button */}
                      <button
                        onClick={() => openLightbox(photo, 0)}
                        className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-xl bg-teal-500/90 text-slate-950 shadow-lg backdrop-blur-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all hover:bg-teal-400"
                        title="View Full Screenshot Gallery"
                      >
                        <Maximize2 className="size-4" />
                      </button>

                      {/* Attendees Badge */}
                      {photo.attendeeCount > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-200 text-xs font-mono font-medium border border-white/10">
                          <Users className="size-3.5 text-emerald-400" />
                          {photo.attendeeCount} Attendees
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="mt-5 space-y-3">
                      <h3 className="text-xl font-extrabold text-white group-hover:text-teal-300 transition-colors leading-snug">
                        {photo.title}
                      </h3>

                      {photo.caption && (
                        <div className="relative rounded-2xl bg-white/5 p-4 border border-white/10 text-xs text-slate-200 leading-relaxed font-normal">
                          <MessageSquareQuote className="size-4 text-teal-400 mb-1 inline mr-1.5 opacity-80" />
                          <span className="italic">"{photo.caption}"</span>
                        </div>
                      )}

                      {/* Speaker / Host Details */}
                      {(photo.speakerName || photo.speakerRole || photo.dateText) && (
                        <div className="flex items-center justify-between gap-3 pt-2 text-xs border-t border-white/10">
                          {photo.speakerName ? (
                            <div className="flex items-center gap-2">
                              <div className="size-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                                {photo.speakerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-100">{photo.speakerName}</p>
                                {photo.speakerRole && <p className="text-[11px] text-teal-300/80">{photo.speakerRole}</p>}
                              </div>
                            </div>
                          ) : (
                            <div />
                          )}

                          {photo.dateText && (
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                              <Calendar className="size-3 text-slate-500" />
                              {photo.dateText}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Lightbox Gallery Modal with Multi-Photo Controls */}
      <AnimatePresence>
        {lightboxPhoto && (() => {
          const gallery: string[] =
            Array.isArray(lightboxPhoto.imageUrls) && lightboxPhoto.imageUrls.length > 0
              ? lightboxPhoto.imageUrls
              : lightboxPhoto.imageUrl
              ? [lightboxPhoto.imageUrl]
              : [];

          const currentUrl = gallery[lightboxImgIdx] || gallery[0] || "";
          const displayCurrentUrl = currentUrl.startsWith("http")
            ? currentUrl
            : getNormalizedPosterUrl(currentUrl);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-teal-500/30 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-teal-500 hover:text-slate-950 transition-all"
                >
                  <X className="size-5" />
                </button>

                <div className="space-y-6">
                  {/* Main Gallery Image Slider */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-white/10 shadow-inner group/slider">
                    <img
                      src={displayCurrentUrl}
                      alt={`${lightboxPhoto.title} - Photo ${lightboxImgIdx + 1}`}
                      className="h-full w-full object-contain bg-slate-950 transition-all duration-300"
                    />

                    {/* Gallery Navigation Arrows (if multiple photos) */}
                    {gallery.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setLightboxImgIdx((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))
                          }
                          className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-950/80 text-white flex items-center justify-center border border-white/20 hover:bg-teal-500 hover:text-slate-950 transition-all"
                        >
                          <ChevronLeft className="size-6" />
                        </button>

                        <button
                          onClick={() =>
                            setLightboxImgIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-950/80 text-white flex items-center justify-center border border-white/20 hover:bg-teal-500 hover:text-slate-950 transition-all"
                        >
                          <ChevronRight className="size-6" />
                        </button>

                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-mono font-bold text-teal-300 border border-white/15">
                          {lightboxImgIdx + 1} of {gallery.length} Photos
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Bar if multiple photos exist */}
                  {gallery.length > 1 && (
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                      {gallery.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightboxImgIdx(idx)}
                          className={`relative size-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                            idx === lightboxImgIdx
                              ? "border-teal-400 scale-105 shadow-md shadow-teal-500/20"
                              : "border-white/20 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={getNormalizedPosterUrl(url)}
                            alt={`Thumb ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {lightboxPhoto.meetingType && (
                        <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                          {lightboxPhoto.meetingType}
                        </span>
                      )}
                      {lightboxPhoto.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                          {Array.from({ length: lightboxPhoto.rating }).map((_, i) => (
                            <Star key={i} className="size-4 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white">{lightboxPhoto.title}</h3>

                    {lightboxPhoto.caption && (
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200 italic leading-relaxed">
                        "{lightboxPhoto.caption}"
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
                      <div>
                        {lightboxPhoto.speakerName && <p className="font-bold text-white text-sm">{lightboxPhoto.speakerName}</p>}
                        {lightboxPhoto.speakerRole && <p className="text-teal-300">{lightboxPhoto.speakerRole}</p>}
                      </div>
                      {lightboxPhoto.attendeeCount > 0 && (
                        <div className="flex items-center gap-1 text-slate-400 font-mono">
                          <Users className="size-4 text-teal-400" />
                          {lightboxPhoto.attendeeCount} Total Attendees
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
