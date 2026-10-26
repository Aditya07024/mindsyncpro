import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  CareerSelectionRegistration,
  CounselingTrainingProgram,
  CounselingTrainingEnrollment,
  ProgramCardsConfig,
} from "../models/career-program";
import { User, TherapistBooking } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { AIService } from "../services/ai.service";

async function getValidTherapistId(therapistIdStr?: string): Promise<mongoose.Types.ObjectId | null> {
  if (therapistIdStr && mongoose.Types.ObjectId.isValid(therapistIdStr)) {
    return new mongoose.Types.ObjectId(therapistIdStr);
  }
  const therapistUser = await User.findOne({ role: "therapist" });
  if (therapistUser) {
    return therapistUser._id as mongoose.Types.ObjectId;
  }
  const fallbackUser = await User.findOne();
  return fallbackUser ? (fallbackUser._id as mongoose.Types.ObjectId) : null;
}

const DEFAULT_TRAINING_PROGRAMS = [
  {
    title: "MindFirst: The Art of Mental Health Support & Clinical Counseling",
    badgeText: "Clinical Training & Supervision Cohort 2026",
    tagline: "LEARN, PRACTICE & SUPPORT WITH EMPATHY (Clinical Mentor-Guided, Skill-Based, and Career-Oriented)",
    modes: "Online (Live Interactive) | Case Supervision Labs",
    modeNote: "*Participants receive live supervised roleplay sessions, structured case workbooks, and recorded replays.",
    aboutHeadline:
      "Master Active Listening, Counseling Ethics & Initial Emotional Support from Scratch — and graduate with supervised case experience and a verified certificate.",
    description:
      "A practical mental health skills training programme designed to help students, educators, community volunteers, and aspiring wellbeing facilitators understand mental health and provide appropriate initial emotional support.\n\nParticipants will learn active listening, supportive communication, stress awareness, emotional regulation basics, healthy boundaries, mental health warning signs, crisis awareness, and appropriate referral practices. The programme combines theoretical sessions with practical exercises, case-based learning, and real-world scenarios to build confidence in responding responsibly to everyday mental health concerns. It emphasizes ethical conduct, privacy, empathy, and knowing when to refer someone to a qualified mental health professional.",
    keyOutcomes: [
      "Structured Active Listening & Empathetic Communication Frameworks",
      "Deep Understanding of Stress, Emotional Regulation & Warning Signs",
      "4–5 Supervised Case Roleplays & Crisis Referral Simulations",
      "A Portfolio & Verified Certificate Aligned to Counseling & Wellbeing Roles",
    ],
    objectives: [
      "Build a foundational understanding of mental health, emotional distress, and supportive care from scratch.",
      "Train participants in active listening, non-judgmental communication, and healthy professional boundaries.",
      "Provide hands-on experience through real-world counseling case vignettes, roleplays, and intake simulations.",
      "Equip learners to recognize mental health warning signs, crisis red flags, and ethical referral pathways.",
      "Help participants apply psychological first-aid and emotional regulation tools in schools, workplaces, and communities.",
      "Enable participants to graduate with supervised practical hours and a verified completion certificate.",
    ],
    targetAudience: [
      "Psychology, Counseling & Social Work Students (UG / PG)",
      "Teachers, School Educators & Academic Mentors",
      "Community Volunteers, HR & Workplace Wellbeing Facilitators",
      "Aspiring Counsellors & Mental Health Advocates",
    ],
    modules: [
      {
        title: "Module 1: Foundations of Mental Health & Ethical Support",
        topics: [
          "Understanding mental health, emotional wellbeing, and the mental health continuum",
          "Breaking stigma and myths around psychological support",
          "Core ethical principles: confidentiality, privacy, informed consent, and boundaries",
          "Scope of initial emotional support vs. clinical psychotherapy",
        ],
        learningOutcome:
          "Learners establish a strong conceptual and ethical foundation required to offer safe, responsible mental health support.",
      },
      {
        title: "Module 2: Active Listening & Supportive Communication Mastery",
        topics: [
          "Micro-skills of counseling: attending behavior, open-ended questioning, paraphrasing, and reflection of feeling",
          "Validating emotions without toxic positivity or premature advice-giving",
          "Verbal and non-verbal empathy in high-distress conversations",
          "Live paired roleplay lab with mentor feedback",
        ],
        learningOutcome:
          "Participants conduct structured, empathetic supportive conversations that help individuals feel heard and grounded.",
      },
      {
        title: "Module 3: Stress Awareness, Emotional Regulation & Coping Tools",
        topics: [
          "Recognizing academic, career, interpersonal, and burnout stressors",
          "Evidence-based grounding techniques, breathwork, and cognitive reframing basics",
          "Helping individuals build sustainable self-care and emotional regulation routines",
          "Preventing helper fatigue, vicarious stress, and maintaining self-boundaries",
        ],
        learningOutcome:
          "Learners confidently introduce practical grounding and emotional regulation tools while protecting their own wellbeing.",
      },
      {
        title: "Module 4: Warning Signs, Crisis Awareness & Referral Practice",
        topics: [
          "Identifying early warning signs of anxiety, depression, trauma, and acute distress",
          "Crisis awareness: risk indicators, de-escalation basics, and safety protocols",
          "How and when to refer to clinical psychologists, psychiatrists, or crisis helplines",
          "Capstone case simulation, supervised evaluation & certification review",
        ],
        learningOutcome:
          "Participants demonstrate responsible risk awareness, ethical decision-making, and seamless professional referral practices.",
      },
    ],
    whatYouGet: [
      "52 Days structured live learning-cum-supervision program guided by Senior Counsellors.",
      "Step-by-step curriculum covering foundational empathy to crisis referral protocols.",
      "Weekly live case discussions, peer roleplays & personalized supervisor feedback.",
      "Downloadable Counseling Toolkits, Intake Checklists & Emotional Regulation Workbooks.",
      "Access to community peer group, Q&A mentorship sessions, and career guidance.",
      "Verified Certificate of Completion from MyMindTherapyFriend Clinical Wing.",
    ],
    certificationDetails:
      "Graduates receive a Verified Mental Health Skill Training Certificate issued by MyMindTherapyFriend with unique credential ID suitable for academic portfolios, CV/Resume, and LinkedIn.",
    careerEnablementSubtitle:
      "Structured professional enablement integrated into the cohort to help participants translate counseling skills into academic, institutional, and wellbeing opportunities.",
    careerEnablementItems: [
      {
        title: "Psychology & Wellbeing CV / Portfolio Building",
        description:
          "Learn how to document supervised skill hours, case labs, and competencies effectively on your CV and postgraduate/internship applications.",
      },
      {
        title: "Personalized Supervisor Feedback",
        description:
          "Receive constructive evaluation on your communication style, empathy markers, and boundary management during live roleplays.",
      },
      {
        title: "LinkedIn & Professional Positioning Session",
        description:
          "Position your profile for school counseling internships, NGO mental health projects, corporate wellbeing roles, and clinical pathways.",
      },
      {
        title: "Case Formulation & Interview Prep Kit",
        description:
          "Curated handbook with 40+ real counseling scenario questions, ethical dilemma frameworks, and referral templates.",
      },
      {
        title: "Practical Competency & Case Assessment",
        description:
          "Simulate real-world supportive conversations and ethical referral decisions benchmarked by senior practitioners.",
      },
      {
        title: "1:1 Post-Program Career Guidance Check-in",
        description:
          "Dedicated mentorship guidance on higher studies, RCI/clinical pathways, and specialization choices in mental health.",
      },
    ],
    startDate: "5th November 2026",
    duration: "52 Days",
    fee: 4999,
    totalProgramValue: "₹22,000+",
    earlyCohortNote: "Subsidized Cohort Fee for Limited Seats — Enrollments Open Now",
    feeBreakdown: [
      { item: "Core Live Training & Supervised Roleplay Labs (52 Days)", value: "₹ 10,000" },
      { item: "Practical Counseling Workbooks, Scripts & Referral Toolkits", value: "₹ 3,000" },
      { item: "Career Support — Psychology CV & Portfolio Workshop", value: "₹ 2,500" },
      { item: "Ethical Dilemma & Counseling Interview Prep Kit", value: "₹ 2,500" },
      { item: "Live Case Competency Review & Verified Certificate", value: "₹ 2,000" },
      { item: "1:1 Career Roadmap Mentorship Session", value: "₹ 2,000" },
    ],
    supportAssuranceTitle: "Learning & Cohort Completion Support Assurance",
    supportAssuranceText:
      "If a participant is unable to attend specific live sessions due to exams, health, or emergencies, extended academic support is provided—including session recordings, guided workbook catch-up, and complimentary attendance in the next cohort's missed module so every learner completes their certification with confidence.",
    testimonials: [
      {
        name: "Riya Deshmukh",
        role: "MA Psychology Student",
        comment:
          "The live roleplays and supervisor feedback completely transformed how I listen and hold space without jumping to advice. Way more practical than textbook lectures.",
        rating: 5,
      },
      {
        name: "Arjun Nair",
        role: "High School Educator & Student Mentor",
        comment:
          "Understanding healthy boundaries and exact referral protocols gave me the confidence to support stressed students responsibly and ethically.",
        rating: 5,
      },
    ],
    faqs: [
      {
        question: "Who can enroll in this Counseling Training Program?",
        answer:
          "Psychology/social work students, educators, HR & wellbeing facilitators, healthcare/community volunteers, and anyone passionate about learning structured, ethical mental health support skills can enroll.",
      },
      {
        question: "Do I need a prior clinical degree to join?",
        answer:
          "No prior clinical license is required. The curriculum starts from core foundations and progressively builds practical active listening, emotional regulation, and ethical referral skills.",
      },
      {
        question: "What if I miss a live session during the cohort?",
        answer:
          "Session recordings, summary notes, and practice worksheets are shared with enrolled participants, along with mentor Q&A support so you never fall behind.",
      },
      {
        question: "Will I receive a certificate after completing the program?",
        answer:
          "Yes! Upon completing the training modules and practical case exercises, you will receive an official Verified Certificate of Completion.",
      },
    ],
    organizerInitiative: "An Official Clinical Training Initiative By MyMindTherapyFriend",
    contactEmail: "contact@mymindtherapyfriend.com",
    contactPhone: "Available via Support Desk (10:00 AM – 6:00 PM IST)",
    cautionNote:
      "Only training cohorts listed on mymindtherapyfriend.com are official. Enrollments are processed securely via Razorpay with instant payment receipt and Admin seat verification.",
    instructor: "Senior Counsellor",
    totalSeats: 60,
    availableSeats: 60,
    category: "Mental Health Skill Training Program",
    tags: ["Mental Health Support", "Active Listening", "Counseling Skills", "Certification"],
    isActive: true,
  },
];

// --- 1. CAREER SELECTION PROGRAM ---

export async function registerCareerSelection(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { fullName, country, state, city, schoolOrgName, age, phone, counselingType, preferredGoals, intelligenceData } = req.body;

    if (!fullName || !state || !city || !schoolOrgName || !age || !phone) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    let finalIntelligenceData = intelligenceData;

    // Use Manas AI model to calculate Goal Alignment Accuracy Score & Summary Analysis
    if (intelligenceData && intelligenceData.scores) {
      try {
        const aiEvaluation = await AIService.evaluateCareerIntelligence({
          fullName,
          counselingType: counselingType || "Clinical Psychology & Psychotherapy",
          scores: intelligenceData.scores,
          schoolOrgName,
          age: Number(age),
        });

        finalIntelligenceData = {
          scores: intelligenceData.scores,
          primaryType: aiEvaluation.primaryType,
          secondaryType: aiEvaluation.secondaryType,
          goalAlignmentScore: aiEvaluation.goalAlignmentScore,
          summaryReport: aiEvaluation.summaryReport,
        };
      } catch (aiErr) {
        console.warn("Manas AI calculation fallback:", aiErr);
      }
    }

    const registration = await CareerSelectionRegistration.create({
      userId: req.user?.sub || "",
      userEmail: req.user?.sub ? "" : "",
      fullName,
      country: country || "India",
      state,
      city,
      schoolOrgName,
      age: Number(age),
      phone,
      counselingType: counselingType || "Clinical Psychology & Psychotherapy",
      preferredGoals: preferredGoals || "",
      intelligenceData: finalIntelligenceData || null,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      registration,
      message: "Registration submitted successfully! Our team will connect with you within 24 hours.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to register" });
  }
}

export async function evaluateIntelligenceAI(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, counselingType, scores, schoolOrgName, age } = req.body;
    const aiEvaluation = await AIService.evaluateCareerIntelligence({
      fullName: fullName || "Candidate",
      counselingType: counselingType || "Clinical Psychology & Psychotherapy",
      scores: scores || {},
      schoolOrgName,
      age: Number(age) || 21,
    });
    res.json({ success: true, evaluation: aiEvaluation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Evaluation failed" });
  }
}

export async function getCareerSelectionStatus(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.json({ success: true, registration: null });
      return;
    }

    const registration = await CareerSelectionRegistration.findOne({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, registration });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch status" });
  }
}

export async function getCareerSelectionRegistrations(_req: Request, res: Response): Promise<void> {
  try {
    const registrations = await CareerSelectionRegistration.find().sort({ createdAt: -1 });
    res.json({ success: true, registrations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch registrations" });
  }
}

export async function updateCareerSelectionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedCounselor, therapistId, guidanceFee, meetingDate, meetingLink } = req.body;

    const updateFields: any = {};
    if (status !== undefined) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;
    if (assignedCounselor !== undefined) updateFields.assignedCounselor = assignedCounselor;
    if (therapistId !== undefined) updateFields.therapistId = therapistId;
    if (guidanceFee !== undefined) updateFields.guidanceFee = Number(guidanceFee);
    if (meetingDate !== undefined) updateFields.meetingDate = meetingDate;
    if (meetingLink !== undefined) updateFields.meetingLink = meetingLink;

    if (status === "approved") {
      updateFields.paymentStatus = Number(guidanceFee || 0) > 0 ? "paid" : "free";
    }

    const registration = await CareerSelectionRegistration.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!registration) {
      res.status(404).json({ success: false, message: "Registration record not found" });
      return;
    }

    // Auto-create TherapistBooking on approval if candidate userId exists
    if (status === "approved" && registration.userId) {
      try {
        const existingBooking = await TherapistBooking.findOne({
          userId: registration.userId,
          notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
        });

        if (!existingBooking) {
          const slotTime = registration.meetingDate
            ? new Date(registration.meetingDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);

          const targetTherapistId = await getValidTherapistId(registration.therapistId);

          if (targetTherapistId) {
            await TherapistBooking.create({
              userId: registration.userId,
              therapistId: targetTherapistId,
              slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
              status: "confirmed",
              videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
              therapistNotes: `Career Guidance Session: ${registration.counselingType || "Career Selection"} with ${registration.assignedCounselor || "Counselor"}`,
              payment: {
                amount: registration.guidanceFee || 0,
                paid: true,
              },
            });
          }
        }
      } catch (err) {
        console.error("Non-fatal TherapistBooking creation error:", err);
      }
    }

    res.json({ success: true, registration, message: `Status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update status" });
  }
}

function normalizeLines(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function buildRichProgramPayload(body: any, isUpdate = false): Record<string, any> {
  const payload: Record<string, any> = {};

  const setIfDefined = (key: string, transform?: (v: any) => any) => {
    if (body[key] !== undefined) {
      payload[key] = transform ? transform(body[key]) : body[key];
    } else if (!isUpdate) {
      // leave undefined so schema defaults apply on create
    }
  };

  setIfDefined("title", (v) => String(v || "").trim());
  setIfDefined("badgeText", (v) => String(v || "").trim());
  setIfDefined("tagline", (v) => String(v || "").trim());
  setIfDefined("modes", (v) => String(v || "").trim());
  setIfDefined("modeNote", (v) => String(v || "").trim());
  setIfDefined("aboutHeadline", (v) => String(v || "").trim());
  setIfDefined("description", (v) => String(v || ""));
  setIfDefined("keyOutcomes", normalizeLines);
  setIfDefined("objectives", normalizeLines);
  setIfDefined("targetAudience", normalizeLines);

  if (body.modules !== undefined) {
    payload.modules = Array.isArray(body.modules)
      ? body.modules
          .filter((m: any) => m && String(m.title || "").trim())
          .map((m: any) => ({
            title: String(m.title || "").trim(),
            topics: normalizeLines(m.topics),
            learningOutcome: String(m.learningOutcome || "").trim(),
          }))
      : [];
  }

  setIfDefined("whatYouGet", normalizeLines);
  setIfDefined("certificationDetails", (v) => String(v || "").trim());
  setIfDefined("careerEnablementSubtitle", (v) => String(v || "").trim());

  if (body.careerEnablementItems !== undefined) {
    payload.careerEnablementItems = Array.isArray(body.careerEnablementItems)
      ? body.careerEnablementItems
          .filter((item: any) => item && String(item.title || "").trim())
          .map((item: any) => ({
            title: String(item.title || "").trim(),
            description: String(item.description || "").trim(),
          }))
      : [];
  }

  setIfDefined("startDate", (v) => String(v || "").trim());
  setIfDefined("duration", (v) => String(v || "").trim());
  setIfDefined("fee", (v) => Number(v || 0));
  setIfDefined("totalProgramValue", (v) => String(v || "").trim());
  setIfDefined("earlyCohortNote", (v) => String(v || "").trim());

  if (body.feeBreakdown !== undefined) {
    payload.feeBreakdown = Array.isArray(body.feeBreakdown)
      ? body.feeBreakdown
          .filter((row: any) => row && String(row.item || "").trim())
          .map((row: any) => ({
            item: String(row.item || "").trim(),
            value: String(row.value || "").trim(),
          }))
      : [];
  }

  setIfDefined("supportAssuranceTitle", (v) => String(v || "").trim());
  setIfDefined("supportAssuranceText", (v) => String(v || "").trim());

  if (body.testimonials !== undefined) {
    payload.testimonials = Array.isArray(body.testimonials)
      ? body.testimonials
          .filter((t: any) => t && String(t.name || "").trim() && String(t.comment || "").trim())
          .map((t: any) => ({
            name: String(t.name || "").trim(),
            role: String(t.role || "").trim(),
            comment: String(t.comment || "").trim(),
            rating: Number(t.rating || 5),
          }))
      : [];
  }

  if (body.faqs !== undefined) {
    payload.faqs = Array.isArray(body.faqs)
      ? body.faqs
          .filter((f: any) => f && String(f.question || "").trim() && String(f.answer || "").trim())
          .map((f: any) => ({
            question: String(f.question || "").trim(),
            answer: String(f.answer || "").trim(),
          }))
      : [];
  }

  setIfDefined("organizerInitiative", (v) => String(v || "").trim());
  setIfDefined("contactEmail", (v) => String(v || "").trim());
  setIfDefined("contactPhone", (v) => String(v || "").trim());
  setIfDefined("cautionNote", (v) => String(v || "").trim());
  setIfDefined("instructor", (v) => String(v || "Clinical Expert").trim());
  setIfDefined("totalSeats", (v) => Number(v || 30));
  setIfDefined("availableSeats", (v) => Number(v ?? body.totalSeats ?? 30));
  setIfDefined("category", (v) => String(v || "Certification").trim());

  if (body.tags !== undefined) {
    payload.tags = Array.isArray(body.tags)
      ? body.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : String(body.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }

  if (body.isActive !== undefined) {
    payload.isActive = Boolean(body.isActive);
  } else if (!isUpdate) {
    payload.isActive = true;
  }

  return payload;
}

// --- 2. COUNSELING TRAINING PROGRAM ---

export async function getCounselingTrainingPrograms(_req: Request, res: Response): Promise<void> {
  try {
    let programs = await CounselingTrainingProgram.find({ isActive: true }).sort({ createdAt: -1 });
    if (programs.length === 0) {
      const totalCount = await CounselingTrainingProgram.countDocuments();
      if (totalCount === 0) {
        await CounselingTrainingProgram.insertMany(DEFAULT_TRAINING_PROGRAMS);
        programs = await CounselingTrainingProgram.find({ isActive: true }).sort({ createdAt: -1 });
      }
    }
    res.json({ success: true, programs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch training programs" });
  }
}

export async function createCounselingTrainingProgram(req: Request, res: Response): Promise<void> {
  try {
    const createPayload = buildRichProgramPayload(req.body, false);
    const program = await CounselingTrainingProgram.create(createPayload);

    res.status(201).json({ success: true, program, message: "Training program created successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create program" });
  }
}

export async function enrollCounselingTraining(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { programId, fullName, country, state, city, orgName, profession, phone, paymentStatus, paymentId, fee } = req.body;

    if (!programId || !fullName || !state || !city || !orgName || !profession || !phone) {
      res.status(400).json({ success: false, message: "All fields are required" });
      return;
    }

    const program = await CounselingTrainingProgram.findById(programId);
    if (!program) {
      res.status(404).json({ success: false, message: "Training program not found" });
      return;
    }

    const enrollment = await CounselingTrainingEnrollment.create({
      programId: program._id,
      programTitle: program.title,
      userId: req.user?.sub || "",
      fullName,
      country: country || "India",
      state,
      city,
      orgName,
      profession,
      phone,
      paymentStatus: paymentStatus || (program.fee > 0 ? "paid" : "free"),
      paymentId: paymentId || "",
      fee: fee !== undefined ? Number(fee) : program.fee,
      status: "pending", // Pending Admin Approval!
    });

    // Decrease available seat
    if (program.availableSeats > 0) {
      program.availableSeats -= 1;
      await program.save();
    }

    res.status(201).json({
      success: true,
      enrollment,
      message: "Enrollment submitted successfully with payment! Awaiting Admin Approval.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to enroll" });
  }
}

export async function getMyCounselingTrainingEnrollments(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.json({ success: true, enrollments: [] });
      return;
    }

    const enrollments = await CounselingTrainingEnrollment.find({ userId })
      .populate("programId")
      .sort({ createdAt: -1 });

    res.json({ success: true, enrollments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch my enrollments" });
  }
}

export async function getAdminCounselingTrainingPrograms(_req: Request, res: Response): Promise<void> {
  try {
    let programs = await CounselingTrainingProgram.find().sort({ createdAt: -1 });
    if (programs.length === 0) {
      await CounselingTrainingProgram.insertMany(DEFAULT_TRAINING_PROGRAMS);
      programs = await CounselingTrainingProgram.find().sort({ createdAt: -1 });
    }
    res.json({ success: true, programs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch admin training programs" });
  }
}

export async function updateCounselingTrainingProgram(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateFields = buildRichProgramPayload(req.body, true);

    const program = await CounselingTrainingProgram.findByIdAndUpdate(id, updateFields, { new: true });
    if (!program) {
      res.status(404).json({ success: false, message: "Program not found" });
      return;
    }

    res.json({ success: true, program, message: "Training program updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update program" });
  }
}

export async function deleteCounselingTrainingProgram(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const program = await CounselingTrainingProgram.findByIdAndDelete(id);

    if (!program) {
      res.status(404).json({ success: false, message: "Program not found" });
      return;
    }

    res.json({ success: true, message: "Training program deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete program" });
  }
}

export async function getCounselingTrainingEnrollments(_req: Request, res: Response): Promise<void> {
  try {
    const enrollments = await CounselingTrainingEnrollment.find().sort({ createdAt: -1 });
    res.json({ success: true, enrollments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch enrollments" });
  }
}

export async function updateCounselingTrainingEnrollmentStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enrollment = await CounselingTrainingEnrollment.findByIdAndUpdate(id, { status }, { new: true });
    if (!enrollment) {
      res.status(404).json({ success: false, message: "Enrollment not found" });
      return;
    }

    res.json({ success: true, enrollment, message: `Enrollment status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update enrollment status" });
  }
}

// --- 3. COUNSELOR GUIDANCE WORKFLOW (REQUEST, ADMIN PROPOSAL, PAYMENT & DUAL BOOKING SYNC) ---

export async function requestCounselorGuidance(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const registration = await CareerSelectionRegistration.findOne({ userId }).sort({ createdAt: -1 });
    if (!registration) {
      res.status(404).json({ success: false, message: "Registration profile not found" });
      return;
    }

    registration.guidanceRequested = true;
    registration.status = "guidance_requested";
    await registration.save();

    res.json({
      success: true,
      registration,
      message: "Guidance request submitted! Admin will assign a counselor and guidance fee details shortly.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit guidance request" });
  }
}

export async function adminAssignCounselorAndFee(req: Request, res: Response): Promise<void> {
  try {
    const { registrationId, therapistId, assignedCounselor, guidanceFee, meetingDate, meetingLink, adminNotes, status } = req.body;

    if (!registrationId) {
      res.status(400).json({ success: false, message: "Registration ID is required" });
      return;
    }

    let counselorName = assignedCounselor;
    if (therapistId && (!counselorName || counselorName === "Senior Clinical Counselor")) {
      const counselorUser = await User.findById(therapistId);
      if (counselorUser) counselorName = counselorUser.fullName;
    }

    const numericFee = Number(guidanceFee || 0);
    // Use admin's specified status if provided; otherwise fallback to proposal_sent if fee > 0 else approved
    const targetStatus = status ? status : (numericFee > 0 ? "proposal_sent" : "approved");
    const paymentStatus = targetStatus === "approved" ? (numericFee > 0 ? "paid" : "free") : (numericFee > 0 ? "unpaid" : "free");

    const registration = await CareerSelectionRegistration.findByIdAndUpdate(
      registrationId,
      {
        therapistId: therapistId || "",
        assignedCounselor: counselorName || "Senior Clinical Counselor",
        guidanceFee: numericFee,
        meetingDate: meetingDate || "",
        meetingLink: meetingLink || "",
        adminNotes: adminNotes || "",
        status: targetStatus,
        guidanceRequested: targetStatus === "approved" || targetStatus === "proposal_sent" ? false : true,
        paymentStatus,
      },
      { new: true }
    );

    if (!registration) {
      res.status(404).json({ success: false, message: "Registration record not found" });
      return;
    }

    // Auto-create or update TherapistBooking if approved
    if (targetStatus === "approved" && registration.userId) {
      try {
        const existingBooking = await TherapistBooking.findOne({
          userId: registration.userId,
          notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
        });

        const slotTime = registration.meetingDate
          ? new Date(registration.meetingDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        const targetTherapistId = await getValidTherapistId(registration.therapistId);

        if (!existingBooking) {
          if (targetTherapistId) {
            await TherapistBooking.create({
              userId: registration.userId,
              therapistId: targetTherapistId,
              slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
              status: "confirmed",
              videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
              therapistNotes: `Career Guidance Session: ${registration.counselingType || "Career Selection"} with ${registration.assignedCounselor || "Counselor"}`,
              payment: {
                amount: numericFee,
                paid: true,
              },
            });
          }
        } else {
          await TherapistBooking.findByIdAndUpdate(existingBooking._id, {
            slot: isNaN(slotTime.getTime()) ? existingBooking.slot : slotTime,
            videoRoomId: registration.meetingLink || existingBooking.videoRoomId,
            therapistNotes: `Career Guidance Session: ${registration.counselingType || "Career Selection"} with ${registration.assignedCounselor || "Counselor"}`,
            ...(targetTherapistId ? { therapistId: targetTherapistId } : {}),
            status: "confirmed",
            payment: {
              amount: numericFee,
              paid: true,
            },
          });
        }
      } catch (err) {
        console.error("Non-fatal TherapistBooking creation error:", err);
      }
    }

    res.json({
      success: true,
      registration,
      message: targetStatus === "approved"
        ? `Meeting approved & scheduled with ${registration.assignedCounselor} for ${registration.fullName}!`
        : `Fee proposal of ₹${registration.guidanceFee} sent to ${registration.fullName}!`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to assign counselor proposal" });
  }
}

export async function payAndConfirmGuidanceBooking(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const registration = await CareerSelectionRegistration.findOne({ userId }).sort({ createdAt: -1 });
    if (!registration) {
      res.status(404).json({ success: false, message: "Registration record not found" });
      return;
    }

    registration.paymentStatus = "paid";
    registration.status = "approved";
    await registration.save();

    // Dual Sync: Create a formal TherapistBooking record if not already created
    let booking = null;
    try {
      const existingBooking = await TherapistBooking.findOne({
        userId,
        notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
        status: { $in: ["pending", "confirmed"] },
      });

      booking = existingBooking;
      if (!booking) {
        const slotTime = registration.meetingDate
          ? new Date(registration.meetingDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        const targetTherapistId = await getValidTherapistId(registration.therapistId);

        if (targetTherapistId) {
          booking = await TherapistBooking.create({
            userId,
            therapistId: targetTherapistId,
            slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
            status: "confirmed",
            videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
            therapistNotes: `Career Guidance Session: ${registration.counselingType || "Career Selection"} with ${registration.assignedCounselor || "Counselor"}`,
            payment: {
              amount: registration.guidanceFee || 0,
              paid: true,
            },
          });
        }
      }
    } catch (bookingErr) {
      console.error("Non-fatal TherapistBooking sync error:", bookingErr);
    }

    res.json({
      success: true,
      registration,
      booking,
      message: "Payment confirmed! Your counselor guidance session has been booked successfully.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to confirm payment and booking" });
  }
}

// --- 3. PROGRAM CARDS CONFIG (HOMEPAGE BOXES) ---

export async function getProgramCardsConfig(_req: Request, res: Response): Promise<void> {
  try {
    let config = await ProgramCardsConfig.findOne();
    if (!config) {
      config = await ProgramCardsConfig.create({});
    }
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch program cards config" });
  }
}

export async function updateProgramCardsConfig(req: Request, res: Response): Promise<void> {
  try {
    const {
      trainingBadgeText,
      trainingTitle,
      trainingDescription,
      trainingButtonText,
      trainingButtonLink,
      trainingIsActive,
      selectionBadgeText,
      selectionTitle,
      selectionDescription,
      selectionButtonText,
      selectionButtonLink,
      selectionIsActive,
    } = req.body;

    let config = await ProgramCardsConfig.findOne();
    if (!config) {
      config = new ProgramCardsConfig();
    }

    if (trainingBadgeText !== undefined) config.trainingBadgeText = String(trainingBadgeText).trim();
    if (trainingTitle !== undefined) config.trainingTitle = String(trainingTitle).trim();
    if (trainingDescription !== undefined) config.trainingDescription = String(trainingDescription).trim();
    if (trainingButtonText !== undefined) config.trainingButtonText = String(trainingButtonText).trim();
    if (trainingButtonLink !== undefined) config.trainingButtonLink = String(trainingButtonLink).trim();
    if (trainingIsActive !== undefined) config.trainingIsActive = Boolean(trainingIsActive);

    if (selectionBadgeText !== undefined) config.selectionBadgeText = String(selectionBadgeText).trim();
    if (selectionTitle !== undefined) config.selectionTitle = String(selectionTitle).trim();
    if (selectionDescription !== undefined) config.selectionDescription = String(selectionDescription).trim();
    if (selectionButtonText !== undefined) config.selectionButtonText = String(selectionButtonText).trim();
    if (selectionButtonLink !== undefined) config.selectionButtonLink = String(selectionButtonLink).trim();
    if (selectionIsActive !== undefined) config.selectionIsActive = Boolean(selectionIsActive);

    await config.save();

    res.json({
      success: true,
      config,
      message: "Homepage program box content saved successfully!",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update program cards config" });
  }
}


