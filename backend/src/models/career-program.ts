import mongoose, { Schema, Document } from "mongoose";

// 1. Career Selection Program Registration Model
export interface ICareerSelectionRegistration extends Document {
  userId?: string;
  userEmail?: string;
  fullName: string;
  country: string;
  state: string;
  city: string;
  schoolOrgName: string;
  age: number;
  phone: string;
  counselingType?: string;
  preferredGoals?: string;
  assignedCounselor?: string;
  meetingDate?: string;
  meetingLink?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const careerSelectionRegistrationSchema = new Schema<ICareerSelectionRegistration>(
  {
    userId: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "India" },
    state: { type: String, required: true },
    city: { type: String, required: true },
    schoolOrgName: { type: String, required: true },
    age: { type: Number, required: true },
    phone: { type: String, required: true },
    counselingType: { type: String, default: "Clinical Psychology & Psychotherapy" },
    preferredGoals: { type: String, default: "" },
    assignedCounselor: { type: String, default: "" },
    meetingDate: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CareerSelectionRegistration = mongoose.model<ICareerSelectionRegistration>(
  "CareerSelectionRegistration",
  careerSelectionRegistrationSchema
);

// 2. Counseling Training Program Details Model
export interface ICounselingTrainingProgram extends Document {
  title: string;
  description: string;
  startDate: string;
  duration: string;
  fee: number;
  instructor: string;
  totalSeats: number;
  availableSeats: number;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const counselingTrainingProgramSchema = new Schema<ICounselingTrainingProgram>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    startDate: { type: String, required: true },
    duration: { type: String, required: true },
    fee: { type: Number, required: true, default: 0 },
    instructor: { type: String, default: "Expert Clinical Psychologist" },
    totalSeats: { type: Number, default: 30 },
    availableSeats: { type: Number, default: 30 },
    category: { type: String, default: "CBT Certification" },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CounselingTrainingProgram = mongoose.model<ICounselingTrainingProgram>(
  "CounselingTrainingProgram",
  counselingTrainingProgramSchema
);

// 3. Counseling Training Program Enrollment Model
export interface ICounselingTrainingEnrollment extends Document {
  programId: mongoose.Types.ObjectId | string;
  programTitle: string;
  userId?: string;
  userEmail?: string;
  fullName: string;
  country: string;
  state: string;
  city: string;
  orgName: string;
  profession: string;
  phone: string;
  status: "pending" | "confirmed" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const counselingTrainingEnrollmentSchema = new Schema<ICounselingTrainingEnrollment>(
  {
    programId: { type: Schema.Types.ObjectId, ref: "CounselingTrainingProgram", required: true },
    programTitle: { type: String, default: "" },
    userId: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    fullName: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "India" },
    state: { type: String, required: true },
    city: { type: String, required: true },
    orgName: { type: String, required: true },
    profession: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
  },
  { timestamps: true }
);

export const CounselingTrainingEnrollment = mongoose.model<ICounselingTrainingEnrollment>(
  "CounselingTrainingEnrollment",
  counselingTrainingEnrollmentSchema
);
