import { Request, Response } from "express";
import {
  CareerSelectionRegistration,
  CounselingTrainingProgram,
  CounselingTrainingEnrollment,
} from "../models/career-program";
import { User, TherapistBooking } from "../models";
import { AuthedRequest } from "../middleware/auth";
import { AIService } from "../services/ai.service";

const DEFAULT_TRAINING_PROGRAMS = [
  {
    title: "Clinical CBT & Diagnostic Assessment Mastery",
    description: "Comprehensive 8-week intensive certification covering Cognitive Behavioral Therapy frameworks, DSM-5 diagnostic interviewing, case formulation, and live supervised roleplays.",
    startDate: "15th October 2026",
    duration: "8 Weeks (Weekend Batches)",
    fee: 4999,
    instructor: "Dr. Ananya Sharma (Senior Clinical Psychologist)",
    totalSeats: 30,
    availableSeats: 12,
    category: "CBT Certification",
    tags: ["CBT", "Clinical", "Certification"],
    isActive: true,
  },
  {
    title: "Child & Adolescent Therapy Supervised Cohort",
    description: "Specialized clinical training in play therapy, school counseling techniques, ADHD/Autism behavioral interventions, and parent guidance strategies.",
    startDate: "1st November 2026",
    duration: "6 Weeks",
    fee: 3999,
    instructor: "Dr. Rajesh Verma (Child Psychologist)",
    totalSeats: 25,
    availableSeats: 8,
    category: "Child Psychology",
    tags: ["Child Therapy", "ADHD", "School Counseling"],
    isActive: true,
  },
  {
    title: "Trauma-Informed Counseling & Crisis Intervention",
    description: "Practical masterclass on Somatic Grounding, PTSD recovery protocols, crisis de-escalation, and ethical boundaries in private practice.",
    startDate: "20th November 2026",
    duration: "4 Weeks",
    fee: 2999,
    instructor: "Dr. Meera Nambiar (Trauma Specialist)",
    totalSeats: 30,
    availableSeats: 15,
    category: "Trauma Care",
    tags: ["Trauma", "PTSD", "Crisis Support"],
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
      const existingBooking = await TherapistBooking.findOne({
        userId: registration.userId,
        notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
      });

      if (!existingBooking) {
        const slotTime = registration.meetingDate
          ? new Date(registration.meetingDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        let targetTherapistId: any = registration.therapistId;
        if (!targetTherapistId) {
          const therapistUser = await User.findOne({ role: "therapist" });
          if (therapistUser) targetTherapistId = therapistUser._id;
        }

        if (targetTherapistId) {
          await TherapistBooking.create({
            userId: registration.userId,
            therapistId: targetTherapistId,
            therapistName: registration.assignedCounselor || "Senior Clinical Counselor",
            slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
            status: "confirmed",
            videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
            notes: `Career Guidance Session: ${registration.counselingType || "Career Selection"}`,
            payment: {
              amount: registration.guidanceFee || 0,
              paid: true,
            },
          });
        }
      }
    }

    res.json({ success: true, registration, message: `Status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update status" });
  }
}

// --- 2. COUNSELING TRAINING PROGRAM ---

export async function getCounselingTrainingPrograms(_req: Request, res: Response): Promise<void> {
  try {
    let programs = await CounselingTrainingProgram.find({ isActive: true }).sort({ createdAt: -1 });

    if (programs.length === 0) {
      await CounselingTrainingProgram.insertMany(DEFAULT_TRAINING_PROGRAMS);
      programs = await CounselingTrainingProgram.find({ isActive: true }).sort({ createdAt: -1 });
    }

    res.json({ success: true, programs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch training programs" });
  }
}

export async function createCounselingTrainingProgram(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, startDate, duration, fee, instructor, totalSeats, availableSeats, category, tags } = req.body;

    const program = await CounselingTrainingProgram.create({
      title,
      description,
      startDate,
      duration,
      fee: Number(fee || 0),
      instructor: instructor || "Clinical Expert",
      totalSeats: Number(totalSeats || 30),
      availableSeats: Number(availableSeats || totalSeats || 30),
      category: category || "Certification",
      tags: Array.isArray(tags) ? tags : String(tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      isActive: true,
    });

    res.status(201).json({ success: true, program, message: "Training program created successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create program" });
  }
}

export async function enrollCounselingTraining(req: AuthedRequest, res: Response): Promise<void> {
  try {
    const { programId, fullName, country, state, city, orgName, profession, phone } = req.body;

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
      status: "pending",
    });

    // Decrease available seat
    if (program.availableSeats > 0) {
      program.availableSeats -= 1;
      await program.save();
    }

    res.status(201).json({
      success: true,
      enrollment,
      message: "Enrollment submitted successfully! Our team will connect with you within 24 hours.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to enroll" });
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
    const { title, description, startDate, duration, fee, instructor, totalSeats, availableSeats, category, tags, isActive } = req.body;

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (startDate !== undefined) updateFields.startDate = startDate;
    if (duration !== undefined) updateFields.duration = duration;
    if (fee !== undefined) updateFields.fee = Number(fee);
    if (instructor !== undefined) updateFields.instructor = instructor;
    if (totalSeats !== undefined) updateFields.totalSeats = Number(totalSeats);
    if (availableSeats !== undefined) updateFields.availableSeats = Number(availableSeats);
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) {
      updateFields.tags = Array.isArray(tags) ? tags : String(tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (isActive !== undefined) updateFields.isActive = Boolean(isActive);

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
    // If fee is 0, session is immediately approved and free. If fee > 0, candidate must pay first (proposal_sent).
    const targetStatus = status ? status : (numericFee > 0 ? "proposal_sent" : "approved");
    const paymentStatus = numericFee > 0 ? (targetStatus === "approved" ? "paid" : "unpaid") : "free";

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
        paymentStatus,
      },
      { new: true }
    );

    if (!registration) {
      res.status(404).json({ success: false, message: "Registration record not found" });
      return;
    }

    // Auto-create TherapistBooking if approved & session is free or paid
    if (targetStatus === "approved" && registration.userId) {
      const existingBooking = await TherapistBooking.findOne({
        userId: registration.userId,
        notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
      });

      if (!existingBooking) {
        const slotTime = registration.meetingDate
          ? new Date(registration.meetingDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        let targetTherapistId: any = registration.therapistId;
        if (!targetTherapistId) {
          const therapistUser = await User.findOne({ role: "therapist" });
          if (therapistUser) targetTherapistId = therapistUser._id;
        }

        if (targetTherapistId) {
          await TherapistBooking.create({
            userId: registration.userId,
            therapistId: targetTherapistId,
            therapistName: registration.assignedCounselor || "Senior Clinical Counselor",
            slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
            status: "confirmed",
            videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
            notes: `Career Guidance Session: ${registration.counselingType || "Career Selection"}`,
            payment: {
              amount: numericFee,
              paid: true,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      registration,
      message: numericFee > 0
        ? `Proposal sent to ${registration.fullName}! Assigned counselor: ${registration.assignedCounselor}, Fee: ₹${registration.guidanceFee}`
        : `Free guidance session approved & scheduled for ${registration.fullName}!`,
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
    const existingBooking = await TherapistBooking.findOne({
      userId,
      notes: { $regex: registration.counselingType || "Career Selection", $options: "i" },
      status: { $in: ["pending", "confirmed"] },
    });

    let booking = existingBooking;
    if (!booking) {
      const slotTime = registration.meetingDate
        ? new Date(registration.meetingDate)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      let targetTherapistId: any = registration.therapistId;
      if (!targetTherapistId) {
        const therapistUser = await User.findOne({ role: "therapist" });
        if (therapistUser) targetTherapistId = therapistUser._id;
      }

      if (targetTherapistId) {
        booking = await TherapistBooking.create({
          userId,
          therapistId: targetTherapistId,
          therapistName: registration.assignedCounselor || "Senior Clinical Counselor",
          slot: isNaN(slotTime.getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : slotTime,
          status: "confirmed",
          videoRoomId: registration.meetingLink || "https://meet.jit.si/MindSyncPro-CareerSession",
          notes: `Career Guidance Session: ${registration.counselingType || "Career Selection"}`,
          payment: {
            amount: registration.guidanceFee || 0,
            paid: true,
          },
        });
      }
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

