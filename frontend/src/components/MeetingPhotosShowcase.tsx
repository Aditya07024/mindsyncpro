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

interface ShowcaseCardItem {
  cardId: string;
  imageUrl: string;
  imgIndex: number;
  totalImages: number;
  photo: any;
  title: string;
  caption: string;
  speakerName: string;
  speakerRole: string;
  meetingType: string;
  attendeeCount: number;
  rating: number;
  dateText: string;
}

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

  // Transform photos into individual showcase cards so each image has its own card with top image + bottom title & about
  const allCards = useMemo<ShowcaseCardItem[]>(() => {
    return photos.flatMap((photo) => {
      const imgList: string[] =
        Array.isArray(photo.imageUrls) && photo.imageUrls.length > 0
          ? photo.imageUrls
          : photo.imageUrl
          ? [photo.imageUrl]
          : [];

      if (imgList.length === 0) return [];

      return imgList.map((url, imgIndex) => ({
        cardId: `${photo._id}-${imgIndex}`,
        imageUrl: url,
        imgIndex,
        totalImages: imgList.length,
        photo,
        title: photo.title,
        caption: photo.caption,
        speakerName: photo.speakerName,
        speakerRole: photo.speakerRole,
        meetingType: photo.meetingType,
        attendeeCount: photo.attendeeCount,
        rating: photo.rating,
        dateText: photo.dateText,
      }));
    });
  }, [photos]);

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

  // Filtered cards based on selected category tag
  const displayedCards = useMemo(() => {
    if (selectedTag === "All") return allCards;
    return allCards.filter((card) =>
      card.meetingType?.toLowerCase().includes(selectedTag.toLowerCase())
    );
  }, [allCards, selectedTag]);

  // Handle horizontal scrolling
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
  }, [displayedCards]);

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

      {/* Navigation Header with Previous / Next Arrows */}
      <div className="relative z-10 mt-10 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {displayedCards.length} Session {displayedCards.length === 1 ? "Photo" : "Photos"}
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Scroll horizontally to view all sessions
          </span>
        </div>

        {/* Scroll Control Arrows */}
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
      </div>

      {/* Horizontally Scrollable Cards Container (Cards Side-by-Side: Top Image, Bottom Title & About) */}
      <div className="relative z-10 mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="size-6 text-teal-600 animate-spin" />
            <span className="text-sm font-medium">Loading session gallery...</span>
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-teal-100 bg-white text-center max-w-lg mx-auto shadow-sm">
            <div className="size-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-200">
              <ImageIcon className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Session Gallery Coming Soon</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Meeting screenshots and participant testimonials uploaded from the Admin Dashboard will appear here dynamically.
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className="flex gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {displayedCards.map((card, idx) => {
              const displayUrl = card.imageUrl.startsWith("http")
                ? card.imageUrl
                : getNormalizedPosterUrl(card.imageUrl);

              return (
                <motion.div
                  key={card.cardId || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="w-[88vw] sm:w-[75vw] md:w-[calc(50%-12px)] shrink-0 snap-start flex flex-col justify-between rounded-3xl border border-teal-100/90 bg-white p-5 sm:p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-teal-300 group/card"
                >
                  {/* TOP: Image */}
                  <div
                    onClick={() => openLightbox(card.photo, card.imgIndex)}
                    className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 shadow-xs cursor-pointer group/img"
                  >
                    <img
                      src={displayUrl}
                      alt={`${card.title} - Photo ${card.imgIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-50" />

                    {/* Photo indicator badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                        <ImageIcon className="size-3 text-teal-400" /> Photo {card.imgIndex + 1} of {card.totalImages}
                      </span>
                    </div>

                    {/* Maximize Lightbox button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(card.photo, card.imgIndex);
                      }}
                      className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md hover:bg-teal-500 transition-all opacity-90 group-hover/img:opacity-100"
                      title="View full image"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>

                  {/* BOTTOM: Title & About (Quote / Caption) & Speaker */}
                  <div className="mt-5 flex flex-col justify-between flex-1">
                    <div className="space-y-3">
                      {/* Category Pill & Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold shadow-2xs">
                          <Tag className="size-3.5 text-teal-600" />
                          {card.meetingType?.split(",")[0]?.trim() || "Live Session"}
                        </span>

                        {card.dateText && (
                          <span className="text-xs font-mono text-slate-500 flex items-center gap-1 shrink-0">
                            <Calendar className="size-3.5 text-slate-400" />
                            {card.dateText}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover/card:text-teal-700 transition-colors leading-snug line-clamp-2">
                        {card.title}
                      </h4>

                      {/* About / Caption Quote */}
                      {card.caption && (
                        <div className="relative rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal shadow-2xs">
                          <MessageSquareQuote className="size-4 text-teal-600 mb-1 inline mr-2 opacity-80" />
                          <span className="italic">"{card.caption}"</span>
                        </div>
                      )}
                    </div>

                    {/* Speaker / Host Details & Stats */}
                    <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                      {card.speakerName ? (
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {card.speakerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{card.speakerName}</p>
                            {card.speakerRole && (
                              <p className="text-[11px] text-teal-700 font-semibold">{card.speakerRole}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        {card.attendeeCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                            <Users className="size-3.5 text-teal-600" /> {card.attendeeCount}
                          </span>
                        )}

                        {card.rating > 0 && (
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold shadow-2xs">
                            <Star className="size-3.5 fill-amber-400 text-amber-500" />
                            {card.rating}.0
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
                      {gallery.map((url, idx) => (
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
