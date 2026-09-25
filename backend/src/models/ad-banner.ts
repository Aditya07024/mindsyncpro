import mongoose, { Schema, Document } from "mongoose";

export interface IAdBanner extends Document {
  title: string;
  badgeText: string;
  description: string;
  imageUrl?: string;
  buttonText: string;
  targetUrl: string;
  isActive: boolean;
  isCreatedByAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adBannerSchema = new Schema<IAdBanner>(
  {
    title: { type: String, default: "" },
    badgeText: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    buttonText: { type: String, default: "" },
    targetUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isCreatedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdBanner =
  (mongoose.models.AdBanner as mongoose.Model<IAdBanner>) ||
  mongoose.model<IAdBanner>("AdBanner", adBannerSchema);
