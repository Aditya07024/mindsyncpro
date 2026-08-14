import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a 24-hour time string (e.g., "19:00", "09:30", "20:15") into 12-hour format with AM/PM (e.g., "7:00 PM", "9:30 AM", "8:15 PM").
 */
export function formatTime12Hour(timeStr?: string): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(":");
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a date string (e.g., "2026-08-12") into DD/MM/YYYY format (e.g., "12/08/2026").
 */
export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.trim().split("T")[0];
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return `${day}/${month}/${year}`;
    }
  }

  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getNormalizedPosterUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Data URLs and blob URLs returned by file inputs or canvas
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const apiBase = (import.meta.env.VITE_API_URL || "https://api.mymindtherapyfriend.com").replace(/\/$/, "");

  // If it's already a full HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("/uploads/images/")) {
      const parts = trimmed.split("/uploads/images/");
      const filename = parts[parts.length - 1];
      return filename ? `${apiBase}/uploads/images/${filename}` : trimmed;
    }
    return trimmed;
  }

  // If relative path containing /uploads/images/
  if (trimmed.includes("/uploads/images/")) {
    const parts = trimmed.split("/uploads/images/");
    const filename = parts[parts.length - 1];
    return filename ? `${apiBase}/uploads/images/${filename}` : trimmed;
  }

  // If raw filename like "conference-poster-1786674296151-qytdjkr.jpeg"
  const parts = trimmed.split("/");
  const filename = parts[parts.length - 1];
  return filename ? `${apiBase}/uploads/images/${filename}` : trimmed;
}


