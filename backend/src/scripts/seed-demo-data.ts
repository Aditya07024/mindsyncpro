import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import {
  User,
  Organization,
  SubscriptionPlan,
  Subscription,
  TherapistBooking,
} from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export async function seedDemoDataLogic() {
  console.log("[Seed] Starting demo data generation...");

  // 1. Ensure Subscription Plans exist
  let apnaMannPlan = await SubscriptionPlan.findOne({ name: "Apna Mann" });
  if (!apnaMannPlan) {
    apnaMannPlan = await SubscriptionPlan.create({
      name: "Apna Mann",
      price: 199,
      audience: "user",
      isActive: true,
      features: ["1000 messages/day limit", "Weekly clinical evaluation", "CBT Journal"],
    });
  }

  let mannShantiPlan = await SubscriptionPlan.findOne({ name: "Mann Shanti" });
  if (!mannShantiPlan) {
    mannShantiPlan = await SubscriptionPlan.create({
      name: "Mann Shanti",
      price: 499,
      audience: "user",
      isActive: true,
      features: ["Unlimited messages/day", "Daily therapist recommendation", "10% therapist discount"],
    });
  }

  let orgEnterprisePlan = await SubscriptionPlan.findOne({ name: "Enterprise Wellness Tier 1" });
  if (!orgEnterprisePlan) {
    orgEnterprisePlan = await SubscriptionPlan.create({
      name: "Enterprise Wellness Tier 1",
      price: 10000,
      audience: "organization",
      isActive: true,
      features: ["Unlimited employee seats", "Dedicated therapist roster", "Full analytics"],
    });
  }

  let orgCorporatePlan = await SubscriptionPlan.findOne({ name: "Corporate Team Care" });
  if (!orgCorporatePlan) {
    orgCorporatePlan = await SubscriptionPlan.create({
      name: "Corporate Team Care",
      price: 5000,
      audience: "organization",
      isActive: true,
      features: ["Up to 100 seats", "Standard analytics", "Therapist coverage"],
    });
  }

  // 2. Create/Upsert Organizations (4 Orgs)
  const orgsData = [
    { name: "Infosys Human Resources", officialEmail: "wellness@infosys.com", contactPerson: "Rishi Kapoor", seats: 250, planId: orgEnterprisePlan._id, subPrice: 10000 },
    { name: "TCS MindCare Initiative", officialEmail: "mindcare@tcs.com", contactPerson: "Sunita Menon", seats: 200, planId: orgEnterprisePlan._id, subPrice: 10000 },
    { name: "Zomato Employee Health", officialEmail: "people@zomato.com", contactPerson: "Deepinder S.", seats: 150, planId: orgCorporatePlan._id, subPrice: 5000 },
    { name: "Razorpay People Experience", officialEmail: "people@razorpay.com", contactPerson: "Harshil M.", seats: 100, planId: orgCorporatePlan._id, subPrice: 5000 },
  ];

  const orgDocMap = new Map<string, any>();
  for (const o of orgsData) {
    let org = await Organization.findOne({ name: o.name });
    const contract = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
      pepm: 199,
    };

    if (!org) {
      org = await Organization.create({
        name: o.name,
        type: "Corporate",
        officialEmail: o.officialEmail,
        contactPerson: o.contactPerson,
        seats: o.seats,
        contract,
        verificationStatus: "verified",
        coverMemberTherapyFees: true,
        allowExternalTherapists: true,
      });
    } else {
      org.verificationStatus = "verified";
      org.coverMemberTherapyFees = true;
      org.allowExternalTherapists = true;
      if (!org.contract || !org.contract.start) {
        org.contract = contract;
      }
      await org.save();
    }
    orgDocMap.set(o.name, { org, subPrice: o.subPrice, planId: o.planId });
  }

  // 3. Create/Upsert Patient Users (6 Seekers)
  const patientsData = [
    { fullName: "Aarav Sharma", phoneMasked: "+91 98201 11223", email: "aarav.sharma@example.com", tier: "mann_shanti", planId: mannShantiPlan._id },
    { fullName: "Ananya Iyer", phoneMasked: "+91 98192 22334", email: "ananya.iyer@example.com", tier: "mann_shanti", planId: mannShantiPlan._id },
    { fullName: "Rohan Deshmukh", phoneMasked: "+91 98334 33445", email: "rohan.deshmukh@example.com", tier: "mann_shanti", planId: mannShantiPlan._id },
    { fullName: "Priyanshu Gupta", phoneMasked: "+91 98765 44556", email: "priyanshu.gupta@example.com", tier: "apna_mann", planId: apnaMannPlan._id },
    { fullName: "Sneha Kulkarni", phoneMasked: "+91 98111 55667", email: "sneha.kulkarni@example.com", tier: "apna_mann", planId: apnaMannPlan._id },
    { fullName: "Tanvi Verma", phoneMasked: "+91 98222 66778", email: "tanvi.verma@example.com", tier: "apna_mann", planId: apnaMannPlan._id },
  ];

  const patientDocs: any[] = [];
  for (const p of patientsData) {
    let user = await User.findOne({ phoneMasked: p.phoneMasked });
    if (!user) {
      user = await User.create({
        phoneMasked: p.phoneMasked,
        fullName: p.fullName,
        role: "user",
        tier: p.tier,
        isAnonymous: false,
        streak: 5,
        lastActiveAt: new Date(),
      });
    } else {
      user.fullName = p.fullName;
      user.tier = p.tier;
      user.deletedAt = undefined;
      await user.save();
    }
    patientDocs.push({ user, planId: p.planId });
  }

  // 4. Create/Upsert 10 Therapists (3 Verified, 7 Pending)
  const verifiedTherapistsData = [
    {
      fullName: "Dr. Ananya Sharma",
      email: "dr.ananya@mymindtherapyfriend.com",
      phoneMasked: "+91 98110 12345",
      rciNumber: "CRR/A78491/2018",
      qualification: "Ph.D. Clinical Psychology (NIMHANS)",
      experienceYears: 9,
      sessionFee: 1500,
      rating: 4.9,
      sessionCount: 14,
      specializations: ["CBT", "Anxiety & Panic", "Workplace Stress"],
      bio: "Passionate clinical psychologist specializing in evidence-based CBT for anxiety, depression, and corporate burnout.",
    },
    {
      fullName: "Dr. Rajesh V. Verma",
      email: "dr.rajesh@mymindtherapyfriend.com",
      phoneMasked: "+91 98200 23456",
      rciNumber: "CRR/B62910/2016",
      qualification: "M.D. Psychiatry (AIIMS New Delhi)",
      experienceYears: 12,
      sessionFee: 2000,
      rating: 4.8,
      sessionCount: 10,
      specializations: ["Depression", "PTSD & Trauma", "Mood Disorders"],
      bio: "Integrating psychopharmacology with deep psychodynamic therapy to help individuals overcome trauma and depression.",
    },
    {
      fullName: "Dr. Meera Nair",
      email: "dr.meera@mymindtherapyfriend.com",
      phoneMasked: "+91 98300 34567",
      rciNumber: "CRR/C94102/2020",
      qualification: "M.A. Counseling Psychology (TISS Mumbai)",
      experienceYears: 7,
      sessionFee: 1800,
      rating: 4.9,
      sessionCount: 5,
      specializations: ["Couples Therapy", "Family Dynamics", "Emotional Regulation"],
      bio: "Helping couples and individuals navigate interpersonal conflicts, rebuild intimacy, and develop healthy emotional boundaries.",
    },
  ];

  const pendingTherapistsData = [
    { fullName: "Kavita Sundaram", email: "kavita.s@example.com", phoneMasked: "+91 98400 45678", rciNumber: "CRR/D11045/2022", qualification: "M.Sc. Counseling Psychology", experienceYears: 4, sessionFee: 1200 },
    { fullName: "Dr. Amit Patel", email: "dr.amit.patel@example.com", phoneMasked: "+91 98500 56789", rciNumber: "CRR/E88129/2021", qualification: "Ph.D. Clinical Neuropsychology", experienceYears: 6, sessionFee: 1600 },
    { fullName: "Priya Deshmukh", email: "priya.deshmukh@example.com", phoneMasked: "+91 98600 67890", rciNumber: "CRR/F33019/2023", qualification: "M.Phil Behavioral Therapy", experienceYears: 3, sessionFee: 1000 },
    { fullName: "Siddharth Rao", email: "siddharth.rao@example.com", phoneMasked: "+91 98700 78901", rciNumber: "CRR/G44102/2023", qualification: "M.A. Mindfulness & Psychotherapy", experienceYears: 5, sessionFee: 1400 },
    { fullName: "Neha Kapoor", email: "neha.kapoor@example.com", phoneMasked: "+91 98800 89012", rciNumber: "CRR/H55912/2022", qualification: "M.Sc. Child & Adolescent Psychology", experienceYears: 4, sessionFee: 1300 },
    { fullName: "Vikram Sengupta", email: "vikram.sengupta@example.com", phoneMasked: "+91 98900 90123", rciNumber: "CRR/I66041/2020", qualification: "M.D. Neuro-psychiatry", experienceYears: 8, sessionFee: 1900 },
    { fullName: "Tanya Saxena", email: "tanya.saxena@example.com", phoneMasked: "+91 98000 01234", rciNumber: "CRR/J77890/2023", qualification: "M.Phil Expressive Arts Therapy", experienceYears: 3, sessionFee: 1100 },
  ];

  const verifiedTherapistDocs: any[] = [];
  for (const t of verifiedTherapistsData) {
    let user = await User.findOne({ phoneMasked: t.phoneMasked });
    const profile = {
      name: t.fullName,
      email: t.email,
      phone: t.phoneMasked,
      rciNumber: t.rciNumber,
      verified: true,
      verificationStatus: "verified" as const,
      qualification: t.qualification,
      experienceYears: t.experienceYears,
      sessionFee: t.sessionFee,
      rating: t.rating,
      sessionCount: t.sessionCount,
      specializations: t.specializations,
      languages: ["English", "Hindi"],
      bio: t.bio,
      availability: [
        { day: 1, slots: ["10:00 AM", "02:00 PM", "05:00 PM"] },
        { day: 3, slots: ["11:00 AM", "03:00 PM"] },
        { day: 5, slots: ["10:00 AM", "04:00 PM"] },
      ],
    };

    if (!user) {
      user = await User.create({
        fullName: t.fullName,
        phoneMasked: t.phoneMasked,
        role: "therapist",
        tier: "apna_therapist",
        isAnonymous: false,
        lastActiveAt: new Date(),
        therapistProfile: profile,
      });
    } else {
      user.fullName = t.fullName;
      user.role = "therapist";
      user.therapistProfile = profile;
      user.deletedAt = undefined;
      await user.save();
    }
    verifiedTherapistDocs.push({ user, data: t });
  }

  for (const t of pendingTherapistsData) {
    let user = await User.findOne({ phoneMasked: t.phoneMasked });
    const profile = {
      name: t.fullName,
      email: t.email,
      phone: t.phoneMasked,
      rciNumber: t.rciNumber,
      verified: false,
      verificationStatus: "pending" as const,
      qualification: t.qualification,
      experienceYears: t.experienceYears,
      sessionFee: t.sessionFee,
      rating: 4.5,
      sessionCount: 0,
      specializations: ["General Mental Health"],
      languages: ["English", "Hindi"],
      bio: `Professional therapist awaiting verification.`,
      availability: [],
    };

    if (!user) {
      await User.create({
        fullName: t.fullName,
        phoneMasked: t.phoneMasked,
        role: "therapist",
        tier: "apna_therapist",
        isAnonymous: false,
        lastActiveAt: new Date(),
        therapistProfile: profile,
      });
    } else {
      user.fullName = t.fullName;
      user.role = "therapist";
      user.therapistProfile = profile;
      user.deletedAt = undefined;
      await user.save();
    }
  }

  // 5. Seed Completed Session Bookings (Target Session Revenue = ₹50,000)
  // Dr. Ananya Sharma: 14 sessions @ ₹1,500 = ₹21,000
  // Dr. Rajesh V. Verma: 10 sessions @ ₹2,000 = ₹20,000
  // Dr. Meera Nair: 5 sessions @ ₹1,800 = ₹9,000
  // Total = ₹50,000
  console.log("[Seed] Clearing old demo bookings...");
  const therapistIds = verifiedTherapistDocs.map((vt) => vt.user._id);
  await TherapistBooking.deleteMany({ therapistId: { $in: therapistIds } });

  let totalBookingRevenue = 0;
  let bookingCount = 0;

  const sampleNotes = [
    "Patient reported steady progress in anxiety management. Practiced 5-4-3-2-1 grounding technique.",
    "Reviewed cognitive reframing journal. Identified negative automatic thoughts effectively.",
    "Discussed workplace boundary setting and sleep hygiene improvements.",
    "Explored emotional triggers during high-stress scenarios. Recommended breathing exercises.",
    "Couples conflict resolution strategy evaluated. Improved active listening habits noted.",
  ];

  for (const vt of verifiedTherapistDocs) {
    const { user: therapist, data: spec } = vt;
    const count = spec.sessionCount;
    const fee = spec.sessionFee;

    for (let i = 0; i < count; i++) {
      const patient = patientDocs[i % patientDocs.length].user;
      const dateOffset = Math.floor(Math.random() * 25) + 1;
      const slotDate = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000);

      await TherapistBooking.create({
        userId: patient._id,
        therapistId: therapist._id,
        slot: slotDate,
        status: "completed",
        payment: {
          razorpayOrderId: `order_demo_${Date.now()}_${i}`,
          razorpayPaymentId: `pay_demo_${Date.now()}_${i}`,
          amount: fee,
          paid: true,
        },
        videoRoomId: `room_${therapist._id}_${i}`,
        therapistNotes: sampleNotes[i % sampleNotes.length],
        rating: Math.random() > 0.3 ? 5 : 4,
        review: "Extremely helpful session! Really felt listened to and supported.",
        payoutStatus: "paid",
      });

      totalBookingRevenue += fee;
      bookingCount++;
    }
  }

  console.log(`[Seed] Created ${bookingCount} completed bookings generating ₹${totalBookingRevenue} session revenue.`);

  // 6. Seed Exactly 10 Active Subscriptions
  // Clear old active demo subscriptions to ensure exact count = 10
  console.log("[Seed] Clearing existing subscriptions to reset active subscription count to 10...");
  await Subscription.deleteMany({});

  let subCount = 0;
  // A. 4 Organization Subscriptions (Total ₹30,000 sub revenue approx)
  for (const entry of orgDocMap.values()) {
    const { org, planId } = entry;
    await Subscription.create({
      orgId: org._id,
      planId: planId,
      plan: org.name.includes("Enterprise") ? "Enterprise Wellness Tier 1" : "Corporate Team Care",
      status: "active",
      razorpaySubscriptionId: `sub_org_${org._id}`,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
    });
    subCount++;
  }

  // B. 6 Individual User Subscriptions
  for (const pd of patientDocs) {
    const { user, planId } = pd;
    await Subscription.create({
      userId: user._id,
      planId: planId,
      plan: user.tier === "mann_shanti" ? "Mann Shanti" : "Apna Mann",
      status: "active",
      razorpaySubscriptionId: `sub_user_${user._id}`,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });
    subCount++;
  }

  console.log(`[Seed] Successfully created ${subCount} Active Subscriptions.`);
  console.log(`[Seed] Demo Data Generation Complete! Target Metrics Achieved:
  - Active Subscriptions: ${subCount}
  - Total Therapists: 10 (3 Verified, 7 Pending Review)
  - Total Session Booking Revenue: ₹${totalBookingRevenue}
  - Target Total Gross Revenue: ₹80,000`);

  return {
    activeSubscriptions: subCount,
    verifiedTherapists: 3,
    totalTherapists: 10,
    sessionRevenue: totalBookingRevenue,
    totalGrossRevenue: 80000,
  };
}

async function runStandalone() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from environment.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for demo data seeding...");

  await seedDemoDataLogic();

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB. Done!");
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error("Error running seed script:", err);
    process.exit(1);
  });
}
