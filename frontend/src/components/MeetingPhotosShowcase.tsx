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

// Category Slider Component — Light Theme — renders 2 cards at a time with smooth sliding & auto-play
function CategorySlideshow({
  categoryName,
  items,
  onOpenLightbox,
}: {
  categoryName: string;
  items: any[];
  onOpenLightbox: (photo: any, index?: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide right to left every 5 seconds if there are more than 2 items
  useEffect(() => {
    if (items.length <= 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 2 >= items.length ? 0 : prev + 2));
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 2 < 0 ? Math.max(0, items.length - 2) : prev - 2));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 2 >= items.length ? 0 : prev + 2));
  };

  // Slice 2 visible cards at a time
  const visibleItems = items.slice(currentIndex, currentIndex + 2);

  return (
    <div className="w-full space-y-4 rounded-3xl border border-teal-100/90 bg-white p-6 shadow-lg">
      {/* Category Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Tag className="size-4 text-teal-600" />
          </span>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{categoryName}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {items.length} session photo{items.length > 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Page Indicator */}
        {items.length > 2 && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {Math.floor(currentIndex / 2) + 1} / {Math.ceil(items.length / 2)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevSlide}
                className="flex size-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white transition-all shadow-xs"
                title="Previous 2 Sessions"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextSlide}
                className="flex size-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-teal-600 hover:text-white transition-all shadow-xs"
                title="Next 2 Sessions"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2-Card Grid View per Slide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {visibleItems.map((photo, idx) => {
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
                key={photo._id || idx}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-300 hover:-translate-y-1"
              >
                {/* Image Showcase Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-900">
                  <img
                    src={displayUrl}
                    alt={photo.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-teal-300 text-[11px] font-bold">
                      {photo.meetingType || categoryName}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {imgList.length > 1 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black shadow-sm">
                          <Layers className="size-3" /> {imgList.length} Photos
                        </span>
                      )}

                      {photo.rating > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold backdrop-blur-md">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          {photo.rating}.0
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand Lightbox Button */}
                  <button
                    onClick={() => onOpenLightbox(photo, 0)}
                    className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md backdrop-blur-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all hover:bg-teal-500"
                    title="View Full Screenshot"
                  >
                    <Maximize2 className="size-3.5" />
                  </button>

                  {/* Attendees Count Badge */}
                  {photo.attendeeCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-200 text-[11px] font-mono font-medium border border-white/10">
                      <Users className="size-3 text-emerald-400 mr-1" />
                      {photo.attendeeCount} Attendees
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="mt-4 space-y-2.5">
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                    {photo.title}
                  </h4>

                  {photo.caption && (
                    <div className="relative rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                      <MessageSquareQuote className="size-3.5 text-teal-600 mb-0.5 inline mr-1 opacity-80" />
                      <span className="italic">"{photo.caption}"</span>
                    </div>
                  )}

                  {/* Speaker Details */}
                  {(photo.speakerName || photo.speakerRole || photo.dateText) && (
                    <div className="flex items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
                      {photo.speakerName ? (
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                            {photo.speakerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{photo.speakerName}</p>
                            {photo.speakerRole && <p className="text-[10px] text-teal-700 font-semibold">{photo.speakerRole}</p>}
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      {photo.dateText && (
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                          <Calendar className="size-3 text-slate-400" />
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

      {/* Full-width Category Slideshow Blocks */}
      <div className="relative z-10 mt-12 space-y-10">
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
            <CategorySlideshow
              key={catName}
              categoryName={catName}
              items={groupedCategories[catName]}
              onOpenLightbox={openLightbox}
            />
          ))
        )}
      </div>

      {/* Lightbox Gallery Modal with Multi-Photo Controls — Light Theme */}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
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
