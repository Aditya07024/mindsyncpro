import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISubscription extends Document {
  userId?: Types.ObjectId;
  orgId?: Types.ObjectId;
  planId?: Types.ObjectId; // Link to SubscriptionPlan
  plan: string; // Plan name (historical record)
  status: "pending" | "active" | "cancelled" | "expired";
  razorpaySubscriptionId?: string;
  startDate: Date;
  endDate?: Date;
  paymentMethod?: "razorpay" | "offline_cash" | "offline_upi" | "offline_bank_transfer" | "offline_cheque" | "admin_grant" | "offline_other";
  offlineReference?: string;
  offlineNotes?: string;
  amountPaid?: number;
  assignedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    plan: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled", "expired"],
      default: "pending"
    },
    razorpaySubscriptionId: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "offline_cash", "offline_upi", "offline_bank_transfer", "offline_cheque", "admin_grant", "offline_other"],
      default: "razorpay"
    },
    offlineReference: { type: String },
    offlineNotes: { type: String },
    amountPaid: { type: Number },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Subscription = (mongoose.models.Subscription as mongoose.Model<ISubscription>) || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
