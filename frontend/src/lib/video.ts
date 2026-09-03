/**
 * video.ts — Helper functions to parse, format, and embed intro video URLs across various providers.
 * Supports YouTube (watch, shorts, embed, youtu.be), Google Drive, Loom, Vimeo, and direct video files.
 */

export interface ParsedVideo {
  type: "youtube" | "googledrive" | "loom" | "vimeo" | "direct" | "unknown";
  embedUrl: string;
  originalUrl: string;
  id?: string;
}

export function parseVideoUrl(url?: string | null): ParsedVideo {
  if (!url || typeof url !== "string") {
    return { type: "unknown", embedUrl: "", originalUrl: "" };
  }

  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { type: "unknown", embedUrl: "", originalUrl: "" };
  }

  // 1. YouTube (standard watch, shorts, embed, youtu.be, m.youtube, music.youtube)
  const ytRegExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?/\s]{11})/;
  const ytMatch = cleanUrl.match(ytRegExp);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      originalUrl: cleanUrl,
      id,
    };
  }

  // 2. Google Drive
  const driveMatch = cleanUrl.match(/(?:id=|\/file\/d\/|usercontent\.google\.com\/download\?id=)([^&/?#\s]+)/);
  if (cleanUrl.includes("drive.google.com") || cleanUrl.includes("drive.usercontent.google.com") || driveMatch) {
    const id = driveMatch ? driveMatch[1] : undefined;
    return {
      type: "googledrive",
      embedUrl: id ? `https://drive.google.com/file/d/${id}/preview` : cleanUrl,
      originalUrl: cleanUrl,
      id,
    };
  }

  // 3. Loom
  const loomMatch = cleanUrl.match(/loom\.com\/(?:share|embed)\/([^?&\s]+)/);
  if (loomMatch && loomMatch[1]) {
    const id = loomMatch[1];
    return {
      type: "loom",
      embedUrl: `https://www.loom.com/embed/${id}`,
      originalUrl: cleanUrl,
      id,
    };
  }

  // 4. Vimeo
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/(?:video\/)?)([^?&\s]+)/);
  if (vimeoMatch && vimeoMatch[1] && !isNaN(Number(vimeoMatch[1]))) {
    const id = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}`,
      originalUrl: cleanUrl,
      id,
    };
  }

  // 5. Direct Upload / Direct Video (.mp4, .webm, .ogg, /uploads/...)
  const apiBase = (import.meta.env.VITE_API_URL || "https://api.mymindtherapyfriend.com").replace(/\/$/, "");
  let directUrl = cleanUrl;

  if (cleanUrl.startsWith("/uploads/")) {
    directUrl = `${apiBase}${cleanUrl}`;
  } else if (cleanUrl.startsWith("uploads/")) {
    directUrl = `${apiBase}/${cleanUrl}`;
  } else if (cleanUrl.includes("/uploads/")) {
    // Contains relative path segment
    const parts = cleanUrl.split("/uploads/");
    directUrl = `${apiBase}/uploads/${parts[parts.length - 1]}`;
  } else if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("blob:") && !cleanUrl.startsWith("data:")) {
    directUrl = `https://${cleanUrl}`;
  }

  return {
    type: "direct",
    embedUrl: directUrl,
    originalUrl: cleanUrl,
  };
}

export function getYouTubeId(url?: string | null): string | null {
  const parsed = parseVideoUrl(url);
  return parsed.type === "youtube" ? parsed.id || null : null;
}

export function getGoogleDriveId(url?: string | null): string | null {
  const parsed = parseVideoUrl(url);
  return parsed.type === "googledrive" ? parsed.id || null : null;
}
