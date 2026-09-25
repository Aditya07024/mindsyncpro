import mongoose, { Schema, Document } from "mongoose";

export interface ICounselingPricing extends Document {
  schoolStudentFee: number;
  collegeStudentFee: number;
  regularPersonFee: number;
  updatedAt: Date;
  createdAt: Date;
}

const counselingPricingSchema = new Schema<ICounselingPricing>(
  {
    schoolStudentFee: { type: Number, required: true, default: 299 },
    collegeStudentFee: { type: Number, required: true, default: 499 },
    regularPersonFee: { type: Number, required: true, default: 799 },
  },
  { timestamps: true }
);

export const CounselingPricing =
  (mongoose.models.CounselingPricing as mongoose.Model<ICounselingPricing>) ||
  mongoose.model<ICounselingPricing>("CounselingPricing", counselingPricingSchema);
