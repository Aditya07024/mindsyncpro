import mongoose, { Schema, Document } from "mongoose";

export interface IAdBanner extends Document {
  title: string;
  badgeText: string;
  description: string;
  imageUrl?: string;
  buttonText: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adBannerSchema = new Schema<IAdBanner>(
  {
    title: {
      type: String,
      required: true,
      default: "Exclusive Student & Professional Therapy Workshop 2026",
    },
    badgeText: { type: String, default: "Featured Announcement" },
    description: {
      type: String,
      required: true,
      default:
        "Book 1-on-1 confidential counseling sessions with RCI certified psychologists, explore self-care toolkits, and join live clinical webinars.",
    },
    imageUrl: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    },
    buttonText: { type: String, default: "Explore Programs & Book" },
    targetUrl: { type: String, default: "#counseling" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AdBanner =
  (mongoose.models.AdBanner as mongoose.Model<IAdBanner>) ||
  mongoose.model<IAdBanner>("AdBanner", adBannerSchema);
