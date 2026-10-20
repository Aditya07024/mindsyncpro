import mongoose, { Schema, type Document } from "mongoose";

export interface IAdminNotification extends Document {
  title: string;
  body: string;
  targetType: "all" | "role" | "specific_users" | "device_only";
  targetRole?: string;
  targetCount: number;
  pushSentCount: number;
  sentBy: string; // admin user ID
  sentByEmail?: string;
  type: "custom" | "announcement" | "system" | "promotion";
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetType: {
      type: String,
      enum: ["all", "role", "specific_users", "device_only"],
      required: true,
      default: "all",
    },
    targetRole: { type: String },
    targetCount: { type: Number, default: 0 },
    pushSentCount: { type: Number, default: 0 },
    sentBy: { type: String, ref: "User", required: true },
    sentByEmail: { type: String },
    type: {
      type: String,
      enum: ["custom", "announcement", "system", "promotion"],
      default: "custom",
    },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const AdminNotification =
  mongoose.models.AdminNotification ||
  mongoose.model<IAdminNotification>("AdminNotification", AdminNotificationSchema);
