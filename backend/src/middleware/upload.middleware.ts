import multer from "multer";
import path from "path";
import fs from "fs";
import { AppError } from "@/lib/app-error";

// Target VPS upload directory as required
const VPS_UPLOAD_DIR = "/var/www/MindGod-uploads/images";
// Fallback local directory for local dev environments
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads", "images");

export function getUploadDirectory(): string {
  // If running on VPS / linux server where /var/www/MindGod-uploads/images can be created/used
  try {
    if (fs.existsSync("/var/www/MindGod-uploads") || process.platform === "linux") {
      if (!fs.existsSync(VPS_UPLOAD_DIR)) {
        fs.mkdirSync(VPS_UPLOAD_DIR, { recursive: true });
      }
      return VPS_UPLOAD_DIR;
    }
  } catch (e) {
    // fallback to local directory
  }

  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  return LOCAL_UPLOAD_DIR;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const targetDir = getUploadDirectory();
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".webp";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext) ? ext : ".webp";
    const uniqueFilename = `conference-poster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}${safeExt}`;
    cb(null, uniqueFilename);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPG, PNG, WEBP, GIF, and AVIF images are allowed.", 400));
  }
};

export const posterUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export function getPublicUrlForFilename(filename: string): string {
  const baseUrl = process.env.VITE_API_URL || process.env.API_URL || "https://api.mymindtherapyfriend.com";
  return `${baseUrl}/uploads/images/${filename}`;
}

export function deleteFileFromStorage(posterUrlOrPath?: string | null) {
  if (!posterUrlOrPath) return;

  try {
    const filename = path.basename(posterUrlOrPath);
    const targetDir = getUploadDirectory();
    const filePath = path.join(targetDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Error deleting file from storage:", err);
  }
}
