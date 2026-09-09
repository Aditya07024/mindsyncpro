import mongoose, { Schema, Document } from "mongoose";

export interface IPartner extends Document {
  name: string;
  category: "Organization" | "NGO" | "Clubs" | "Community" | "Partners";
  logoText: string;
  logoUrl?: string;
  description: string;
  impactMetric: string;
  location: string;
  color?: string;
  verified?: boolean;
  websiteUrl?: string;
  fullBio: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Organization", "NGO", "Clubs", "Community", "Partners"],
      required: true,
    },
    logoText: { type: String, required: true, default: "PARTNER" },
    logoUrl: { type: String, default: "" },
    description: { type: String, required: true },
    impactMetric: { type: String, required: true, default: "Active Collaboration" },
    location: { type: String, required: true, default: "India" },
    color: { type: String, default: "from-teal-500 to-emerald-600" },
    verified: { type: Boolean, default: true },
    websiteUrl: { type: String, default: "https://www.mymindtherapyfriend.com" },
    fullBio: { type: String, required: true },
  },
  { timestamps: true }
);

export const Partner = mongoose.model<IPartner>("Partner", partnerSchema);

export interface IPartnerSectionConfig extends Document {
  badgeText: string;
  sectionTitle: string;
  sectionSubtitle: string;
  categories: { id: string; label: string }[];
}

const partnerSectionConfigSchema = new Schema<IPartnerSectionConfig>(
  {
    badgeText: { type: String, default: "Our Ecosystem & Collaboration Network" },
    sectionTitle: { type: String, default: "We Are Part Of" },
    sectionSubtitle: {
      type: String,
      default:
        "Proudly collaborating with leading Organizations, NGOs, Student Clubs, Peer Communities, and Global Health Partners to democratize mental wellness in India.",
    },
    categories: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [
        { id: "all", label: "All Network" },
        { id: "Organization", label: "Organization" },
        { id: "NGO", label: "NGO" },
        { id: "Clubs", label: "Clubs" },
        { id: "Community", label: "Community" },
        { id: "Partners", label: "Partners" },
      ],
    },
  },
  { timestamps: true }
);

export const PartnerSectionConfig = mongoose.model<IPartnerSectionConfig>(
  "PartnerSectionConfig",
  partnerSectionConfigSchema
);
