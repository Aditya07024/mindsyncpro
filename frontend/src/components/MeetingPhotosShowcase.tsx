import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import API from "@/lib/api";
import { getNormalizedPosterUrl } from "@/lib/utils";

export function MeetingPhotosShowcase() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [lightboxPhoto, setLightboxPhoto] = useState<any | null>(null);
  const [lightboxImgIdx, setLightboxImgIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  // Extract clean distinct tags for filtering
  const allCategoryTags = useMemo(() => {
    const tagSet = new Set<string>();
    photos.forEach((p) => {
      if (p.meetingType) {
        p.meetingType.split(",").forEach((t: string) => {
          const clean = t.trim();
          if (clean && clean.length > 2 && clean.length < 35) {
            tagSet.add(clean);
          }
        });
      }
    });
    return ["All", ...Array.from(tagSet)];
  }, [photos]);

  // Filtered sessions based on selected category tag
  const displayedSessions = useMemo(() => {
    if (selectedTag === "All") return photos;
    return photos.filter((photo) =>
      photo.meetingType?.toLowerCase().includes(selectedTag.toLowerCase())
    );
  }, [photos, selectedTag]);

  // Handle horizontal scrolling indicators
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
  }, [displayedSessions]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    // Scroll by width of one card + gap
    const scrollAmount =
      container.offsetWidth > 768 ? container.offsetWidth / 2 : container.offsetWidth * 0.85;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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

        {/* Category Filter Pills */}
        {allCategoryTags.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {allCategoryTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
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

      {/* Navigation Header with Previous / Next Arrows (Removed "Scroll horizontally to view all sessions") */}
      <div className="relative z-10 mt-10 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {displayedSessions.length} {displayedSessions.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        {/* Scroll Control Arrows (only if more than 1 session) */}
        {displayedSessions.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className={`flex size-10 items-center justify-center rounded-full border transition-all cursor-pointer shadow-xs ${
                canScrollLeft
                  ? "bg-white text-teal-800 border-teal-200 hover:bg-[#004038] hover:text-white hover:border-[#004038] active:scale-95"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
              }`}
              title="Previous Session"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className={`flex size-10 items-center justify-center rounded-full border transition-all cursor-pointer shadow-xs ${
                canScrollRight
                  ? "bg-white text-teal-800 border-teal-200 hover:bg-[#004038] hover:text-white hover:border-[#004038] active:scale-95"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
              }`}
              title="Next Session"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>

      {/* Sessions Container (Single session takes full width, multiple sessions divide 50/50 and scroll horizontally) */}
      <div className="relative z-10 mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="size-6 text-teal-600 animate-spin" />
            <span className="text-sm font-medium">Loading session gallery...</span>
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-teal-100 bg-white text-center max-w-lg mx-auto shadow-sm">
            <div className="size-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-200">
              <ImageIcon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Session Gallery Coming Soon</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Meeting screenshots and participant testimonials uploaded from the Admin Dashboard will appear here dynamically.
            </p>
          </div>
        ) : (() => {
          const isSingle = displayedSessions.length === 1;

          return (
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollability}
              className={
                isSingle
                  ? "w-full"
                  : "flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              }
            >
              {displayedSessions.map((session, idx) => {
                const imgList: string[] =
                  Array.isArray(session.imageUrls) && session.imageUrls.length > 0
                    ? session.imageUrls
                    : session.imageUrl
                    ? [session.imageUrl]
                    : [];

                const extraImagesCount = imgList.length > 2 ? imgList.length - 2 : 0;
                const imgHeightClass = isSingle ? "h-64 sm:h-80 md:h-96" : "h-48 sm:h-56 md:h-60";

                return (
                  <motion.div
                    key={session._id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`flex flex-col justify-between rounded-3xl border border-teal-100/90 bg-white transition-all duration-300 hover:shadow-xl hover:border-teal-300 group/card ${
                      isSingle
                        ? "w-full p-6 sm:p-8 shadow-lg"
                        : "w-[88vw] sm:w-[75vw] md:w-[calc(50%-12px)] shrink-0 snap-start p-5 sm:p-6 shadow-md"
                    }`}
                  >
                    {/* TOP: Images in One Container (Left Image & Right Image, with 2+ / 3+ if > 2 images) */}
                    {imgList.length === 0 ? (
                      <div className={`${imgHeightClass} w-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400`}>
                        <ImageIcon className="size-8 mb-1" />
                        <span className="text-xs font-medium">No screenshots available</span>
                      </div>
                    ) : imgList.length === 1 ? (
                      // Single Image
                      <div
                        onClick={() => openLightbox(session, 0)}
                        className={`relative ${imgHeightClass} w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group/img`}
                      >
                        <img
                          src={
                            imgList[0].startsWith("http")
                              ? imgList[0]
                              : getNormalizedPosterUrl(imgList[0])
                          }
                          alt={`${session.title} - Photo 1`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40 group-hover/img:opacity-60 transition-opacity" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(session, 0);
                          }}
                          className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md hover:bg-teal-500 transition-all opacity-90 group-hover/img:opacity-100"
                          title="View full image"
                        >
                          <Maximize2 className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      // Two Images Side-by-Side: Left Image & Right Image
                      <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 ${imgHeightClass} w-full`}>
                        {/* Left Side: First Image */}
                        <div
                          onClick={() => openLightbox(session, 0)}
                          className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group/img"
                        >
                          <img
                            src={
                              imgList[0].startsWith("http")
                                ? imgList[0]
                                : getNormalizedPosterUrl(imgList[0])
                            }
                            alt={`${session.title} - Photo 1`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40 group-hover/img:opacity-60 transition-opacity" />
                          <div className="absolute top-2.5 left-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-[10px] font-bold text-white border border-white/15">
                              Photo 1
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(session, 0);
                            }}
                            className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-md bg-teal-600 text-white shadow-xs hover:bg-teal-500 transition-all opacity-90 group-hover/img:opacity-100"
                            title="View image 1"
                          >
                            <Maximize2 className="size-3" />
                          </button>
                        </div>

                        {/* Right Side: Second Image (with 2+ / 3+ overlay if more than 2 images) */}
                        <div
                          onClick={() => openLightbox(session, 1)}
                          className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group/img"
                        >
                          <img
                            src={
                              imgList[1].startsWith("http")
                                ? imgList[1]
                                : getNormalizedPosterUrl(imgList[1])
                            }
                            alt={`${session.title} - Photo 2`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />

                          {extraImagesCount > 0 ? (
                            // Dark frosted overlay with 2+ / 3+ count
                            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all group-hover/img:bg-slate-950/75 p-2 text-center">
                              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow">
                                {extraImagesCount}+
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-teal-300 mt-0.5 tracking-wider uppercase">
                                +{extraImagesCount} More
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-40 group-hover/img:opacity-60 transition-opacity" />
                              <div className="absolute top-2.5 left-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-[10px] font-bold text-white border border-white/15">
                                  Photo 2
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(session, 1);
                                }}
                                className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-md bg-teal-600 text-white shadow-xs hover:bg-teal-500 transition-all opacity-90 group-hover/img:opacity-100"
                                title="View image 2"
                              >
                                <Maximize2 className="size-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  {/* BOTTOM: Title & About (Quote / Caption) & Speaker (Appears only once per session!) */}
                  <div className="mt-5 flex flex-col justify-between flex-1">
                    <div className="space-y-3">
                      {/* Category Pill & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shadow-2xs">
                          <Tag className="size-3.5 text-teal-600" />
                          {session.meetingType?.split(",")[0]?.trim() || "Live Session"}
                        </span>

                        {session.dateText && (
                          <span className="text-xs font-mono text-slate-500 flex items-center gap-1 shrink-0">
                            <Calendar className="size-3.5 text-slate-400" />
                            {session.dateText}
                          </span>
                        )}
                      </div>

                      {/* Title: Only once per session */}
                      <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover/card:text-teal-700 transition-colors leading-snug line-clamp-2">
                        {session.title}
                      </h4>

                      {/* About / Caption Quote: Only once per session */}
                      {session.caption && (
                        <div className="relative rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal shadow-2xs">
                          <MessageSquareQuote className="size-4 text-teal-600 mb-1 inline mr-2 opacity-80" />
                          <span className="italic">"{session.caption}"</span>
                        </div>
                      )}
                    </div>

                    {/* Speaker / Host Details & Stats */}
                    <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                      {session.speakerName ? (
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {session.speakerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{session.speakerName}</p>
                            {session.speakerRole && (
                              <p className="text-[11px] text-teal-700 font-semibold">{session.speakerRole}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        {session.attendeeCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                            <Users className="size-3.5 text-teal-600" /> {session.attendeeCount}
                          </span>
                        )}

                        {session.rating > 0 && (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold shadow-2xs">
                            <Star className="size-3.5 fill-amber-400 text-amber-500" />
                            {session.rating}.0
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })()}
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
                  className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-all shadow-xs cursor-pointer"
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
                          className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-950/80 text-white flex items-center justify-center border border-white/20 hover:bg-teal-500 hover:text-slate-950 transition-all cursor-pointer"
                        >
                          <ChevronLeft className="size-6" />
                        </button>

                        <button
                          onClick={() =>
                            setLightboxImgIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-slate-950/80 text-white flex items-center justify-center border border-white/20 hover:bg-teal-500 hover:text-slate-950 transition-all cursor-pointer"
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
                      {gallery.map((url, idx) => {
                        const thumbUrl = url.startsWith("http")
                          ? url
                          : getNormalizedPosterUrl(url);

                        return (
                          <button
                            key={idx}
                            onClick={() => setLightboxImgIdx(idx)}
                            className={`relative size-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                              idx === lightboxImgIdx
                                ? "border-teal-600 scale-105 shadow-md"
                                : "border-slate-200 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={thumbUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Session Metadata & Caption */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                        {lightboxPhoto.meetingType || "Live Therapy Session"}
                      </span>
                      {lightboxPhoto.dateText && (
                        <span className="text-xs font-mono text-slate-500">
                          {lightboxPhoto.dateText}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {lightboxPhoto.title}
                    </h3>

                    {lightboxPhoto.caption && (
                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-teal-500 pl-4 py-1 bg-teal-50/40 rounded-r-xl">
                        "{lightboxPhoto.caption}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
                      {lightboxPhoto.speakerName && (
                        <span className="font-semibold text-slate-900">
                          Host: {lightboxPhoto.speakerName} ({lightboxPhoto.speakerRole || "Lead Facilitator"})
                        </span>
                      )}
                      {lightboxPhoto.attendeeCount > 0 && (
                        <span className="flex items-center gap-1 font-mono">
                          <Users className="size-3.5 text-teal-600" />
                          {lightboxPhoto.attendeeCount} Verified Attendees
                        </span>
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
