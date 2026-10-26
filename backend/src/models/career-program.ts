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
  therapistId?: string;
  meetingDate?: string;
  meetingLink?: string;
  guidanceRequested?: boolean;
  guidanceFee?: number;
  paymentStatus?: "unpaid" | "paid" | "free";
  status: "pending" | "guidance_requested" | "proposal_sent" | "approved" | "rejected";
  adminNotes?: string;
  intelligenceData?: {
    scores: Record<string, number>;
    primaryType: string;
    secondaryType: string;
    goalAlignmentScore: number;
    summaryReport: string;
  };
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
    therapistId: { type: String, default: "" },
    meetingDate: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    guidanceRequested: { type: Boolean, default: false },
    guidanceFee: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "free"], default: "unpaid" },
    status: {
      type: String,
      enum: ["pending", "guidance_requested", "proposal_sent", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String, default: "" },
    intelligenceData: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const CareerSelectionRegistration = mongoose.model<ICareerSelectionRegistration>(
  "CareerSelectionRegistration",
  careerSelectionRegistrationSchema
);

// 2. Counseling Training Program Details Model
export interface ITrainingModule {
  title: string;
  topics: string[];
  learningOutcome?: string;
}

export interface ICareerEnablementItem {
  title: string;
  description: string;
}

export interface IFeeBreakdownItem {
  item: string;
  value: string;
}

export interface IProgramTestimonial {
  name: string;
  role?: string;
  comment: string;
  rating?: number;
}

export interface IProgramFaq {
  question: string;
  answer: string;
}

export interface ICounselingTrainingProgram extends Document {
  title: string;
  badgeText?: string;
  tagline?: string;
  modes?: string;
  modeNote?: string;
  aboutHeadline?: string;
  description: string;
  keyOutcomes?: string[];
  objectives?: string[];
  targetAudience?: string[];
  modules?: ITrainingModule[];
  whatYouGet?: string[];
  certificationDetails?: string;
  careerEnablementSubtitle?: string;
  careerEnablementItems?: ICareerEnablementItem[];
  startDate: string;
  duration: string;
  fee: number;
  totalProgramValue?: string;
  earlyCohortNote?: string;
  feeBreakdown?: IFeeBreakdownItem[];
  supportAssuranceTitle?: string;
  supportAssuranceText?: string;
  testimonials?: IProgramTestimonial[];
  faqs?: IProgramFaq[];
  organizerInitiative?: string;
  contactEmail?: string;
  contactPhone?: string;
  cautionNote?: string;
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
    badgeText: { type: String, default: "", trim: true },
    tagline: { type: String, default: "", trim: true },
    modes: { type: String, default: "Online (Live Interactive)", trim: true },
    modeNote: { type: String, default: "", trim: true },
    aboutHeadline: { type: String, default: "", trim: true },
    description: { type: String, required: true },
    keyOutcomes: [{ type: String }],
    objectives: [{ type: String }],
    targetAudience: [{ type: String }],
    modules: [
      {
        title: { type: String, required: true },
        topics: [{ type: String }],
        learningOutcome: { type: String, default: "" },
      },
    ],
    whatYouGet: [{ type: String }],
    certificationDetails: { type: String, default: "" },
    careerEnablementSubtitle: { type: String, default: "" },
    careerEnablementItems: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
    startDate: { type: String, required: true },
    duration: { type: String, required: true },
    fee: { type: Number, required: true, default: 0 },
    totalProgramValue: { type: String, default: "", trim: true },
    earlyCohortNote: { type: String, default: "", trim: true },
    feeBreakdown: [
      {
        item: { type: String, required: true },
        value: { type: String, default: "" },
      },
    ],
    supportAssuranceTitle: { type: String, default: "", trim: true },
    supportAssuranceText: { type: String, default: "" },
    testimonials: [
      {
        name: { type: String, required: true },
        role: { type: String, default: "" },
        comment: { type: String, required: true },
        rating: { type: Number, default: 5 },
      },
    ],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    organizerInitiative: { type: String, default: "", trim: true },
    contactEmail: { type: String, default: "", trim: true },
    contactPhone: { type: String, default: "", trim: true },
    cautionNote: { type: String, default: "" },
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
  paymentStatus?: "unpaid" | "paid" | "free";
  paymentId?: string;
  fee?: number;
  status: "pending" | "confirmed" | "approved" | "completed" | "rejected";
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
    paymentStatus: { type: String, enum: ["unpaid", "paid", "free"], default: "paid" },
    paymentId: { type: String, default: "" },
    fee: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "confirmed", "approved", "completed", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const CounselingTrainingEnrollment = mongoose.model<ICounselingTrainingEnrollment>(
  "CounselingTrainingEnrollment",
  counselingTrainingEnrollmentSchema
);

// 4. Program Cards Configuration (Landing Page Boxes)
export interface IProgramCardsConfig extends Document {
  // Counseling Training Program Box
  trainingBadgeText: string;
  trainingTitle: string;
  trainingDescription: string;
  trainingButtonText: string;
  trainingButtonLink: string;
  trainingIsActive: boolean;

  // Career Selection Program Box
  selectionBadgeText: string;
  selectionTitle: string;
  selectionDescription: string;
  selectionButtonText: string;
  selectionButtonLink: string;
  selectionIsActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const programCardsConfigSchema = new Schema<IProgramCardsConfig>(
  {
    trainingBadgeText: { type: String, default: "Professional Training", trim: true },
    trainingTitle: { type: String, default: "Counseling Training Program", trim: true },
    trainingDescription: {
      type: String,
      default:
        "Comprehensive hands-on clinical training, CBT case supervision, real-world case simulations, and practical experience to enhance counseling competencies.",
      trim: true,
    },
    trainingButtonText: { type: String, default: "Join Training Program →", trim: true },
    trainingButtonLink: { type: String, default: "/counseling-training", trim: true },
    trainingIsActive: { type: Boolean, default: true },

    selectionBadgeText: { type: String, default: "Specialized Pathway", trim: true },
    selectionTitle: { type: String, default: "Career Selection Program", trim: true },
    selectionDescription: {
      type: String,
      default:
        "Guidance and specialized tools for mental health aspirants and professionals to choose, build, and excel in their ideal counseling career path.",
      trim: true,
    },
    selectionButtonText: { type: String, default: "Explore Career Program →", trim: true },
    selectionButtonLink: { type: String, default: "/career-selection", trim: true },
    selectionIsActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProgramCardsConfig =
  (mongoose.models.ProgramCardsConfig as mongoose.Model<IProgramCardsConfig>) ||
  mongoose.model<IProgramCardsConfig>("ProgramCardsConfig", programCardsConfigSchema);

