import mongoose, { Schema, Document } from "mongoose";

export interface IDigitalProduct extends Document {
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  fileUrl?: string;
  previewUrl?: string;
  isFeatured?: boolean;
  salesCount?: number;
  rating?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const digitalProductSchema = new Schema<IDigitalProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, default: "workbook" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    previewUrl: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const DigitalProduct = mongoose.model<IDigitalProduct>("DigitalProduct", digitalProductSchema);

export interface IDigitalProductShopConfig extends Document {
  badgeText: string;
  sectionTitle: string;
  sectionSubtitle: string;
  categories: { id: string; label: string }[];
}

const digitalProductShopConfigSchema = new Schema<IDigitalProductShopConfig>(
  {
    badgeText: { type: String, default: "Digital E-Commerce Wellness Store" },
    sectionTitle: { type: String, default: "Digital Product Shop" },
    sectionSubtitle: {
      type: String,
      default:
        "Download psychologist-curated CBT workbooks, guided meditation audio suites, emotion journals, and self-help tools instantly.",
    },
    categories: {
      type: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [
        { id: "all", label: "All Products" },
        { id: "workbook", label: "Workbooks" },
        { id: "audio", label: "Audio Kits" },
        { id: "journal", label: "Journals & Trackers" },
        { id: "guide", label: "Guides" },
      ],
    },
  },
  { timestamps: true }
);

export const DigitalProductShopConfig = mongoose.model<IDigitalProductShopConfig>(
  "DigitalProductShopConfig",
  digitalProductShopConfigSchema
);
