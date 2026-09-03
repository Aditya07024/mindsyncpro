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

// Inline Photo Frame Component for Session Cards — Separates 2 images clearly and auto-animates right-to-left if > 2 images
function SessionInlinePhotoFrame({
  photo,
  imgList,
  onOpenLightbox,
}: {
  photo: any;
  imgList: string[];
  onOpenLightbox: (photo: any, index: number) => void;
}) {
  const [slideIdx, setSlideIdx] = useState(0);

  // Auto-slide right-to-left every 4 seconds if more than 2 photos are present
  useEffect(() => {
    if (imgList.length <= 2) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 2 >= imgList.length ? 0 : prev + 2));
    }, 4000);
    return () => clearInterval(timer);
  }, [imgList.length]);

  const prevPair = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIdx((prev) => (prev - 2 < 0 ? Math.max(0, imgList.length - 2) : prev - 2));
  };

  const nextPair = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIdx((prev) => (prev + 2 >= imgList.length ? 0 : prev + 2));
  };

  // If only 1 image uploaded
  if (imgList.length <= 1) {
    const singleUrl = imgList[0] || "";
    const displayUrl = singleUrl.startsWith("http") ? singleUrl : getNormalizedPosterUrl(singleUrl);

    return (
      <div
        onClick={() => onOpenLightbox(photo, 0)}
        className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-md cursor-pointer group/img"
      >
        <img
          src={displayUrl}
          alt={photo.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox(photo, 0);
          }}
          className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md hover:bg-teal-500 transition-all"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    );
  }

  // Slice 2 photos for current display frame
  const visiblePairIndices = imgList.length === 2 ? [0, 1] : [slideIdx, (slideIdx + 1) % imgList.length];

  return (
    <div className="relative w-full space-y-2">
      {/* Slideshow Top Navigation Bar if > 2 photos */}
      {imgList.length > 2 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Auto-sliding Photos ({slideIdx + 1}-{Math.min(slideIdx + 2, imgList.length)} of {imgList.length})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevPair}
              className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white shadow-xs transition-all"
              title="Previous Photos"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={nextPair}
              className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white shadow-xs transition-all"
              title="Next Photos"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2 Distinct Separated Image Cards Side-by-Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <AnimatePresence mode="popLayout">
          {visiblePairIndices.map((imgIndex, pos) => {
            const rawUrl = imgList[imgIndex] || "";
            const displayUrl = rawUrl.startsWith("http") ? rawUrl : getNormalizedPosterUrl(rawUrl);

            return (
              <motion.div
                key={`${imgIndex}-${pos}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                onClick={() => onOpenLightbox(photo, imgIndex)}
                className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-200 shadow-md cursor-pointer group/img transition-all hover:border-teal-400 hover:shadow-lg"
              >
                <img
                  src={displayUrl}
                  alt={`${photo.title} - Photo ${imgIndex + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60" />

                {/* Photo Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    <ImageIcon className="size-3 text-teal-400" /> Photo {imgIndex + 1} of {imgList.length}
                  </span>
                </div>

                {/* Expand Lightbox Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox(photo, imgIndex);
                  }}
                  className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md hover:bg-teal-500 transition-all opacity-90 group-hover/img:opacity-100"
                  title="Expand Photo"
                >
                  <Maximize2 className="size-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Category Section Component — Full-width sessions per category
function CategorySection({
  categoryName,
  items,
  onOpenLightbox,
}: {
  categoryName: string;
  items: any[];
  onOpenLightbox: (photo: any, index?: number) => void;
}) {
  return (
    <div className="w-full space-y-6 rounded-3xl border border-teal-100/90 bg-white p-6 sm:p-8 shadow-lg">
      {/* Category Section Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
            <Tag className="size-5 text-teal-600" />
          </span>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{categoryName}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {items.length} session{items.length > 1 ? "s" : ""} in this category
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 shrink-0">
          {items.length} Entry{items.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Full-width Sequential Session Cards Stack (Each session takes 100% width, next session in next row) */}
      <div className="flex flex-col gap-8 w-full">
        {items.map((photo, idx) => {
          const imgList: string[] =
            Array.isArray(photo.imageUrls) && photo.imageUrls.length > 0
              ? photo.imageUrls
              : photo.imageUrl
              ? [photo.imageUrl]
              : [];

          return (
            <motion.div
              key={photo._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="group relative w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-50/50 p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-300 hover:bg-white"
            >
              {/* Header Badges & Attendees */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shadow-2xs">
                  <Tag className="size-3.5 text-teal-600" />
                  {photo.meetingType || categoryName}
                </span>

                <div className="flex items-center gap-2">
                  {photo.attendeeCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                      <Users className="size-3.5 text-teal-600" /> {photo.attendeeCount} Attendees Joined
                    </span>
                  )}

                  {photo.rating > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold shadow-2xs">
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      {photo.rating}.0
                    </div>
                  )}
                </div>
              </div>

              {/* Separated 2-Image Inline Photo Frame (Auto-slides Right-to-Left if > 2 Photos) */}
              <SessionInlinePhotoFrame photo={photo} imgList={imgList} onOpenLightbox={onOpenLightbox} />

              {/* Session Content Details */}
              <div className="mt-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                    {photo.title}
                  </h4>
                  {photo.dateText && (
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1 shrink-0">
                      <Calendar className="size-3.5 text-slate-400" />
                      {photo.dateText}
                    </span>
                  )}
                </div>

                {photo.caption && (
                  <div className="relative rounded-2xl bg-white p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed font-normal shadow-2xs">
                    <MessageSquareQuote className="size-4 text-teal-600 mb-1 inline mr-2 opacity-80" />
                    <span className="italic">"{photo.caption}"</span>
                  </div>
                )}

                {/* Host / Speaker Details */}
                {(photo.speakerName || photo.speakerRole) && (
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {photo.speakerName ? photo.speakerName.charAt(0).toUpperCase() : "M"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{photo.speakerName || "MindSync Host"}</p>
                        {photo.speakerRole && <p className="text-xs text-teal-700 font-semibold">{photo.speakerRole}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

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

  // Group photos by Category/Tag
  const groupedCategories = photos.reduce((acc: Record<string, any[]>, photo) => {
    const cat = photo.meetingType ? photo.meetingType.trim() : "General Session";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(photo);
    return acc;
  }, {});

  const availableCategoryNames = Object.keys(groupedCategories);
  const tags = availableCategoryNames.length > 0 ? ["All", ...availableCategoryNames] : [];

  // Filter categories to display
  const displayedCategories = availableCategoryNames.filter((cat) => {
    if (selectedTag === "All") return true;
    return cat.toLowerCase() === selectedTag.toLowerCase();
  });

  const openLightbox = (photo: any, imgIndex: number = 0) => {
    setLightboxPhoto(photo);
    setLightboxImgIdx(imgIndex);
  };

  return (
    <section className="relative mt-24 overflow-hidden rounded-[36px] border border-teal-100/90 bg-gradient-to-b from-teal-50/60 via-white to-slate-50/80 p-6 sm:p-10 text-slate-900 shadow-xl">
      {/* Background Lighting Accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Section Header */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-800 shadow-xs">
          <Camera className="size-4 text-teal-600" />
          Live Session Showcase & Testimonials
        </div>

        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#012620] tracking-tight leading-tight">
          Inside Our Live Therapy & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 bg-clip-text text-transparent">
            Group Healing Sessions
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
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
                    ? "bg-[#004038] text-white border-[#004038] shadow-md scale-105"
                    : "bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-800 shadow-2xs"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-width Category Blocks — Each session takes 100% width, sequential sessions in next row */}
      <div className="relative z-10 mt-12 space-y-12">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="size-6 text-teal-600 animate-spin" />
            <span className="text-sm font-medium">Loading session gallery...</span>
          </div>
        ) : photos.length === 0 ? (
          /* Clean Light Theme Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-teal-100 bg-white text-center max-w-lg mx-auto shadow-sm">
            <div className="size-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-200">
              <ImageIcon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Session Gallery Coming Soon</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Meeting screenshots and participant testimonials uploaded from the Admin Dashboard will appear here dynamically.
            </p>
          </div>
        ) : displayedCategories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No meeting photos found in category "<span className="text-teal-700 font-bold">{selectedTag}</span>".
          </div>
        ) : (
          displayedCategories.map((catName) => (
            <CategorySection
              key={catName}
              categoryName={catName}
              items={groupedCategories[catName]}
              onOpenLightbox={openLightbox}
            />
          ))
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-all shadow-xs"
                >
                  <X className="size-5" />
                </button>

                <div className="space-y-6">
                  {/* Main Gallery Image Slider */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-200 shadow-inner group/slider">
                    <img
                      src={displayCurrentUrl}
                      alt={`${lightboxPhoto.title} - Photo ${lightboxImgIdx + 1}`}
                      className="h-full w-full object-contain bg-slate-950 transition-all duration-300"
                    />

                    {/* Gallery Navigation Arrows */}
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

                  {/* Thumbnail Bar */}
                  {gallery.length > 1 && (
                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                      {gallery.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLightboxImgIdx(idx)}
                          className={`relative size-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                            idx === lightboxImgIdx
                              ? "border-teal-600 scale-105 shadow-md"
                              : "border-slate-200 opacity-60 hover:opacity-100"
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
                        <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                          {lightboxPhoto.meetingType}
                        </span>
                      )}
                      {lightboxPhoto.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {Array.from({ length: lightboxPhoto.rating }).map((_, i) => (
                            <Star key={i} className="size-4 fill-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{lightboxPhoto.title}</h3>

                    {lightboxPhoto.caption && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 italic leading-relaxed">
                        "{lightboxPhoto.caption}"
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      <div>
                        {lightboxPhoto.speakerName && <p className="font-bold text-slate-900 text-sm">{lightboxPhoto.speakerName}</p>}
                        {lightboxPhoto.speakerRole && <p className="text-teal-700 font-semibold">{lightboxPhoto.speakerRole}</p>}
                      </div>
                      {lightboxPhoto.attendeeCount > 0 && (
                        <div className="flex items-center gap-1 text-slate-500 font-mono font-medium">
                          <Users className="size-4 text-teal-600" />
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
