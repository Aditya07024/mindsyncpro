import mongoose, { Schema, Document, type Types } from "mongoose";

export interface IWaitingUser {
  userId: Types.ObjectId;
  anonymousName: string; // e.g. "User 1", "User 2"
  requestedAt: Date;
}

export interface IAdmittedUser {
  userId: Types.ObjectId;
  anonymousName: string; // e.g. "User 1", "User 2"
  admittedAt: Date;
}

export interface IGroupAudioSession extends Document {
  title: string;
  description: string;
  counselorId?: Types.ObjectId | null;
  counselorName?: string;
  internalStartTime: Date;
  internalEndTime: Date;
  status: "scheduled" | "active" | "completed" | "cancelled";
  price: number;
  maxUsers: number;
  roomName: string;
  isCounselorCreated: boolean;
  waitingQueue: IWaitingUser[];
  admittedUsers: IAdmittedUser[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const waitingUserSchema = new Schema<IWaitingUser>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    anonymousName: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const admittedUserSchema = new Schema<IAdmittedUser>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    anonymousName: { type: String, required: true },
    admittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const groupAudioSessionSchema = new Schema<IGroupAudioSession>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    counselorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    counselorName: { type: String, default: "" },
    internalStartTime: { type: Date, required: true },
    internalEndTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "active",
    },
    price: { type: Number, default: 0 },
    maxUsers: { type: Number, default: 11 },
    roomName: { type: String, required: true, unique: true, index: true },
    isCounselorCreated: { type: Boolean, default: false },
    waitingQueue: { type: [waitingUserSchema], default: [] },
    admittedUsers: { type: [admittedUserSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const GroupAudioSession =
  (mongoose.models.GroupAudioSession as mongoose.Model<IGroupAudioSession>) ||
  mongoose.model<IGroupAudioSession>("GroupAudioSession", groupAudioSessionSchema);
