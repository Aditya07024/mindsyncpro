import React, { useState } from "react";
import { parseVideoUrl } from "@/lib/video";
import { ExternalLink, Play, AlertCircle } from "lucide-react";

interface IntroVideoPlayerProps {
  url?: string | null;
  mode?: "card" | "modal";
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  fallbackName?: string;
}

export const IntroVideoPlayer: React.FC<IntroVideoPlayerProps> = ({
  url,
  mode = "modal",
  className = "",
  autoplay = true,
  muted = false,
  controls = true,
  fallbackName,
}) => {
  const [hasError, setHasError] = useState(false);
  const parsed = parseVideoUrl(url);

  if (!url || !parsed.embedUrl || parsed.type === "unknown" || hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-4 text-center ${className}`}>
        {fallbackName ? (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center text-2xl font-bold mb-2 shadow-lg">
            {fallbackName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
        )}
        <span className="text-xs font-medium text-slate-400">
          {url ? "Video unavailable to stream" : "No intro video provided"}
        </span>
        {url && (
          <a
            href={parsed.originalUrl || url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 text-xs text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
          >
            Open external video <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  const isCard = mode === "card";

  if (parsed.type === "youtube") {
    const embedParams = isCard
      ? `autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&playsinline=1`
      : `autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&rel=0&controls=${controls ? 1 : 0}&playsinline=1`;

    return (
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
        <iframe
          src={`${parsed.embedUrl}?${embedParams}`}
          title="Therapist Intro Video"
          className={`w-full h-full border-0 ${isCard ? "pointer-events-none" : ""}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  if (parsed.type === "googledrive") {
    return (
      <div className={`relative w-full h-full bg-black overflow-hidden group ${className}`}>
        <iframe
          src={parsed.embedUrl}
          title="Therapist Intro Video (Google Drive)"
          className={`w-full h-full border-0 ${isCard ? "pointer-events-none" : ""}`}
          allow="autoplay; fullscreen"
          allowFullScreen
          onError={() => setHasError(true)}
        />
        {!isCard && (
          <a
            href={parsed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 z-10 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded-lg text-xs flex items-center gap-1.5 backdrop-blur-sm transition shadow"
            title="Open in Google Drive"
          >
            Drive Video <ExternalLink className="w-3 h-3 text-teal-400" />
          </a>
        )}
      </div>
    );
  }

  if (parsed.type === "loom") {
    return (
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
        <iframe
          src={parsed.embedUrl}
          title="Therapist Intro Video (Loom)"
          className={`w-full h-full border-0 ${isCard ? "pointer-events-none" : ""}`}
          allow="autoplay; fullscreen"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  if (parsed.type === "vimeo") {
    const embedParams = isCard
      ? "autoplay=1&muted=1&loop=1&background=1"
      : `autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}`;

    return (
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
        <iframe
          src={`${parsed.embedUrl}?${embedParams}`}
          title="Therapist Intro Video (Vimeo)"
          className={`w-full h-full border-0 ${isCard ? "pointer-events-none" : ""}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Direct MP4 / WebM / relative server video file
  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
      <video
        src={parsed.embedUrl}
        autoPlay={isCard ? true : autoplay}
        muted={isCard ? true : muted}
        controls={isCard ? false : controls}
        loop={isCard}
        playsInline
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
