import mongoose, { Schema, type Document, type Types } from "mongoose";

export type UserType = "school_student" | "college_student" | "regular";
export type StudentIdVerificationStatus = "pending" | "approved" | "rejected" | "none";
export type UserRole = "user" | "therapist" | "org_admin" | "super_admin";
export type UserTier = "free" | "mann_shanti" | "apna_therapist" | "apna_mann";

export interface IOnboardingState {
  moodScore?: number;
  concerns: string[];
  primaryNeed?: "talk" | "tools" | "express";
  completedAt?: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  clerkId?: string;          // Clerk user ID (set on first OAuth login)
  phoneHash: string;
  phoneMasked: string;
  fullName?: string;
  userType: UserType;
  studentIdCardUrl?: string;
  studentIdVerificationStatus: StudentIdVerificationStatus;
  schoolCollegeName?: string;
  role: UserRole;
  tier: UserTier;
  language: string;
  location?: string;
  department?: string;
  streak: number;
  lastActiveAt?: Date;
  emergencyContact?: string;
  orgId?: Types.ObjectId;
  isAnonymous: boolean;
  verifiedPhoneAt?: Date;
  expoPushTokens: string[];
  onboarding: IOnboardingState;
  walletBalance: number;
  therapistProfile?: {
    name: string;
    email?: string;
    website?: string;
    phone?: string;
    openToCollaboration?: boolean;
    rciNumber?: string;
    verified: boolean;
    verificationStatus: "pending" | "verified" | "rejected";
    qualification?: string;
    experienceYears?: number;
    experienceCategory?: string;
    clinicDetails?: string;
    documents?: {
      degreeUrl?: string;
      licenseUrl?: string;
      governmentIdUrl?: string;
    };
    specializations: string[];
    languages: string[];
    sessionFee: number;
    rating: number;
    sessionCount: number;
    introVideoUrl?: string;
    bio?: string;
    availability: { day: number; slots: string[] }[];
    paymentDetails?: {
      upiId?: string;
      bankDetails?: string;
    };
  };
  memories?: {
    category: "goal" | "concern" | "relationship" | "trigger" | "event";
    content: string;
    timestamp: Date;
  }[];
  phone?: string;
  referralCode?: string;
  referredBy?: string;
  referralPromptProcessed?: boolean;
  freeSessionCredits: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingSchema = new Schema<IOnboardingState>(
  {
    moodScore: { type: Number, min: 1, max: 10 },
    concerns: { type: [String], default: [] },
    primaryNeed: {
      type: String,
      enum: ["talk", "tools", "express"]
    },
    completedAt: { type: Date }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, unique: true, sparse: true, index: true },
    phoneHash: { type: String, required: false, unique: true, sparse: true, index: true },
    phoneMasked: { type: String, required: true },
    phone: { type: String, default: "" },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: String, default: "" },
    referralPromptProcessed: { type: Boolean, default: false },
    freeSessionCredits: { type: Number, default: 0 },
    fullName: { type: String },
    userType: {
      type: String,
      enum: ["school_student", "college_student", "regular"],
      default: "regular"
    },
    studentIdCardUrl: { type: String, default: "" },
    studentIdVerificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "none"],
      default: "none"
    },
    schoolCollegeName: { type: String, default: "" },

    role: {
      type: String,
      enum: ["user", "therapist", "org_admin", "super_admin"],
      default: "user"
    },
    tier: {
      type: String,
      default: "free"
    },
    walletBalance: {
      type: Number,
      default: 0
    },
    language: { type: String, default: "en-IN" },
    location: { type: String },
    department: { type: String },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
    emergencyContact: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    isAnonymous: { type: Boolean, default: true },
    verifiedPhoneAt: { type: Date },
    expoPushTokens: { type: [String], default: [] },
    onboarding: { type: OnboardingSchema, default: () => ({ concerns: [] }) },
    therapistProfile: {
      type: {
        name: { type: String },
        email: { type: String },
        website: { type: String },
        phone: { type: String },
        openToCollaboration: { type: Boolean, default: false },
        rciNumber: { type: String },
        verified: { type: Boolean, default: false },
        verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
        qualification: { type: String },
        experienceYears: { type: Number },
        experienceCategory: { type: String, enum: ["less than 5 yr", "5 to 10 yr", "10 to 15 yr", "more than 15 yr"] },
        clinicDetails: { type: String },
        documents: {
          type: {
            degreeUrl: { type: String },
            licenseUrl: { type: String },
            governmentIdUrl: { type: String }
          },
          required: false
        },
        specializations: { type: [String], default: [] },
        languages: { type: [String], default: [] },
        sessionFee: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        sessionCount: { type: Number, default: 0 },
        introVideoUrl: { type: String },
        bio: { type: String },
        availability: {
          type: [
            {
              _id: false,
              day: { type: Number, required: true },
              slots: { type: [String], default: [] }
            }
          ],
          default: []
        },
        paymentDetails: {
          type: {
            upiId: { type: String },
            bankDetails: { type: String }
          },
          required: false
        }
      },
      required: false
    },
    memories: {
      type: [
        {
          category: { type: String, enum: ["goal", "concern", "relationship", "trigger", "event"], required: true },
          content: { type: String, required: true },
          timestamp: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `MMTP-${randomStr}`;
  }
  next();
});

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);
