import type { Request, Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, TherapistInvitation } from "@/models";
import { AppError } from "@/lib/app-error";

export class TherapistController {
  /** GET /therapists — list all verified therapists (for users to browse) with search & filters */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const {
      search,
      specialization,
      language,
      minFee = 0,
      maxFee = 5000,
      verified,
      rating,
      location,
      city,
      state,
      openToCollaboration,
      limit = 50,
      skip = 0,
    } = req.query;

    // Build filter query
    const filter: any = {
      role: "therapist",
      deletedAt: null,
    };

    if (search) {
      filter["therapistProfile.name"] = {
        $regex: String(search),
        $options: "i",
      };
    }

    if (openToCollaboration === "true") {
      filter["therapistProfile.openToCollaboration"] = true;
    }

    // Filter by specialization (array contains)
    if (specialization) {
      filter["therapistProfile.specializations"] = {
        $regex: String(specialization),
        $options: "i",
      };
    }

    // Filter by language
    if (language) {
      filter["therapistProfile.languages"] = {
        $regex: String(language),
        $options: "i",
      };
    }

    // Filter by session fee range
    filter["therapistProfile.sessionFee"] = {
      $gte: Number(minFee),
      $lte: Number(maxFee),
    };

    // Filter by verification status
    if (verified === "true") {
      filter["therapistProfile.verified"] = true;
    }

    // Filter by minimum rating
    if (rating) {
      filter["therapistProfile.rating"] = { $gte: Number(rating) };
    }
    
    // Filter by location, city, and state
    if (location) {
      filter["location"] = {
        $regex: String(location),
        $options: "i",
      };
    }

    if (city) {
      filter["location"] = {
        $regex: String(city),
        $options: "i",
      };
    }

    if (state) {
      if (filter["location"]) {
        const existingRegex = filter["location"];
        filter["$and"] = [
          { location: existingRegex },
          { location: { $regex: String(state), $options: "i" } }
        ];
        delete filter["location"];
      } else {
        filter["location"] = {
          $regex: String(state),
          $options: "i",
        };
      }
    }

    // Filter by subscription status
    // 1. Independent therapists must have tier != free
    // 2. Attached therapists must belong to an organization with an active subscription
    const pipeline: any[] = [
      { $match: filter },
      // Join with organization to check its subscription status if therapist is attached
      {
        $lookup: {
          from: "subscriptions",
          let: { orgId: "$orgId", userId: "$_id", userTier: "$tier" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$orgId", "$$orgId"] }, { $eq: ["$status", "active"] }] },
                    { $and: [{ $eq: ["$userId", "$$userId"] }, { $eq: ["$status", "active"] }] }
                  ]
                }
              }
            }
          ],
          as: "activeSubs"
        }
      },
      // Keep if (independent AND tier != free) OR has active subscription record
      {
        $match: {
          $or: [
            { activeSubs: { $not: { $size: 0 } } },
            { $and: [{ orgId: null }, { tier: { $ne: "free" } }] }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
        {
          $project: {
            therapistProfile: 1,
            location: 1,
            phoneMasked: 1,
            createdAt: 1
          }
        }
    ];

    const therapists = await User.aggregate(pipeline);
    
    // Count total matching (re-run aggregation without skip/limit for total)
    const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, project
    countPipeline.push({ $count: "total" });
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total ?? 0;

    res.json({
      therapists: therapists.map((t) => ({
        id: t._id,
        name: t.therapistProfile?.name || "Therapist",
        email: t.therapistProfile?.email ?? "",
        website: t.therapistProfile?.website ?? "",
        phone: t.therapistProfile?.phone ?? "",
        openToCollaboration: !!t.therapistProfile?.openToCollaboration,
        qualification: t.therapistProfile?.qualification ?? "",
        experienceYears: t.therapistProfile?.experienceYears ?? 0,
        specializations: t.therapistProfile?.specializations ?? [],
        languages: t.therapistProfile?.languages ?? [],
        rating: t.therapistProfile?.rating ?? 5.0,
        sessionCount: t.therapistProfile?.sessionCount ?? 0,
        sessionFee: t.therapistProfile?.sessionFee ?? 1800,
        verified: t.therapistProfile?.verified ?? false,
        bio: t.therapistProfile?.bio ?? "",
        introVideoUrl: t.therapistProfile?.introVideoUrl ?? "",
        availability: t.therapistProfile?.availability ?? [],
        location: t.location ?? "",
      })),
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /** GET /therapists/:id — get single therapist details */
  static getDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const therapist = await User.findOne({
      _id: id,
      role: "therapist",
      deletedAt: null,
    })
      .select("therapistProfile phoneMasked createdAt")
      .lean();

    // Fetch reviews
    const reviews = await TherapistBooking.find({
      therapistId: id,
      status: "completed",
      rating: { $exists: true },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("userId", "fullName")
      .lean();

    if (!therapist || !therapist.therapistProfile) {
      throw new AppError("Therapist not found", 404);
    }

    res.json({
      id: therapist._id,
      name: therapist.therapistProfile.name || "Therapist",
      email: therapist.therapistProfile.email || "",
      website: therapist.therapistProfile.website || "",
      phone: therapist.therapistProfile.phone || "",
      openToCollaboration: !!therapist.therapistProfile.openToCollaboration,
      rciNumber: therapist.therapistProfile.rciNumber,
      verified: therapist.therapistProfile.verified,
      specializations: therapist.therapistProfile.specializations,
      languages: therapist.therapistProfile.languages,
      rating: therapist.therapistProfile.rating,
      sessionCount: therapist.therapistProfile.sessionCount,
      sessionFee: therapist.therapistProfile.sessionFee,
      bio: therapist.therapistProfile.bio,
      introVideoUrl: therapist.therapistProfile.introVideoUrl,
      availability: therapist.therapistProfile.availability,
      reviews: reviews.map((r) => ({
        id: r._id,
        userName: (r.userId as any)?.fullName ?? "Anonymous",
        rating: r.rating,
        review: r.review,
        date: r.updatedAt,
      })),
    });
  });

  /** GET /therapists/:id/availability — check therapist's available slots */
  static getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const therapist = await User.findOne({
      _id: id,
      role: "therapist",
      deletedAt: null,
    })
      .select("therapistProfile")
      .lean();

    if (!therapist || !therapist.therapistProfile) {
      throw new AppError("Therapist not found", 404);
    }

    // Get booked slots for the date
    const dateObj = date ? new Date(String(date)) : new Date();
    const dayOfWeek = dateObj.getDay();

    // Clean up old pending_payment bookings (older than 30 minutes)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    await TherapistBooking.updateMany(
      { status: "pending_payment", createdAt: { $lt: thirtyMinsAgo } },
      { status: "cancelled" }
    );

    const bookedSlots = await TherapistBooking.find({
      therapistId: id,
      slot: {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999)),
      },
      status: { $in: ["pending", "confirmed"] },
    })
      .select("slot")
      .lean();

    const bookedTimes = bookedSlots.map((b) =>
      b.slot.toISOString().split("T")[1].slice(0, 5),
    );
    const availability = therapist.therapistProfile.availability.find(
      (a) => a.day === dayOfWeek,
    );

    res.json({
      date: dateObj.toISOString().split("T")[0],
      availableSlots: availability?.slots ?? [],
      bookedSlots: bookedTimes,
      openSlots: (availability?.slots ?? []).filter(
        (s) => !bookedTimes.includes(s),
      ),
    });
  });

  /** GET /therapists/me/stats — therapist's own earnings + session counts */
  static myStats = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;

    const therapist = await User.findById(userId).lean();
    if (!therapist || therapist.role !== "therapist") {
      throw new AppError("Not a therapist account", 403);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBookings, monthBookings, completedAll, completedMonth] =
      await Promise.all([
        TherapistBooking.countDocuments({ therapistId: userId }),
        TherapistBooking.countDocuments({
          therapistId: userId,
          createdAt: { $gte: startOfMonth },
        }),
        TherapistBooking.find({
          therapistId: userId,
          $or: [
            { status: "completed" },
            { status: "confirmed", "payment.paid": true },
          ],
        })
          .select("payment")
          .lean(),
        TherapistBooking.find({
          therapistId: userId,
          $or: [
            { status: "completed" },
            { status: "confirmed", "payment.paid": true },
          ],
          updatedAt: { $gte: startOfMonth },
        })
          .select("payment")
          .lean(),
      ]);

    const totalEarned = completedAll.reduce(
      (sum, b) => sum + (b.payment?.amount ?? 0),
      0,
    );
    const monthEarned = completedMonth.reduce(
      (sum, b) => sum + (b.payment?.amount ?? 0),
      0,
    );
    const sessionFee = therapist.therapistProfile?.sessionFee ?? 1800;
    const nextPayout = Math.round(monthEarned * 0.70);

    res.json({
      profile: {
        name: therapist.therapistProfile?.name ?? "",
        email: therapist.therapistProfile?.email ?? "",
        website: therapist.therapistProfile?.website ?? "",
        phone: therapist.therapistProfile?.phone ?? "",
        openToCollaboration: !!therapist.therapistProfile?.openToCollaboration,
        rciNumber: therapist.therapistProfile?.rciNumber ?? "",
        specializations: therapist.therapistProfile?.specializations ?? [],
        languages: therapist.therapistProfile?.languages ?? [],
        sessionFee,
        rating: therapist.therapistProfile?.rating ?? 0,
        verified: therapist.therapistProfile?.verified ?? false,
        bio: therapist.therapistProfile?.bio ?? "",
        introVideoUrl: therapist.therapistProfile?.introVideoUrl ?? "",
        availability: therapist.therapistProfile?.availability ?? [],
      },
      stats: {
        totalBookings,
        monthBookings,
        totalEarned,
        monthEarned,
        nextPayout,
        completedSessions: completedAll.length,
        completedMonthSessions: completedMonth.length,
      },
    });
  });

  /** GET /therapists/me/bookings — upcoming + past bookings for this therapist */
  static myBookings = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;

      const bookings = await TherapistBooking.find({ therapistId: userId })
        .sort({ slot: 1 })
        .populate("userId", "fullName orgId")
        .lean();

      // Build monthly revenue buckets for chart
      const revenueByMonth: Record<string, number> = {};
      for (const b of bookings) {
        if (b.status !== "completed" && !(b.status === "confirmed" && b.payment?.paid)) continue;
        const key = `${b.slot.getFullYear()}-${String(b.slot.getMonth() + 1).padStart(2, "0")}`;
        revenueByMonth[key] =
          (revenueByMonth[key] ?? 0) + (b.payment?.amount ?? 0);
      }

      res.json({
        bookings: bookings.map((b) => ({
          id: b._id,
          clientId: (b.userId as any)?._id || b.userId,
          clientName: (b.userId as any)?.fullName || "Corporate Seeker",
          clientOrgId: (b.userId as any)?.orgId || null,
          slot: b.slot,
          status: b.status,
          topic: "Therapy session",
          fee: b.payment?.amount ?? 0,
          paid: b.payment?.paid ?? false,
          videoRoomId: b.videoRoomId,
          journalShareState: b.journalShareState || "none",
        })),
        revenueByMonth,
      });
    },
  );

  /** PATCH /therapists/me/availability — save weekly availability slots */
  static updateAvailability = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;
      const { availability } = req.body as {
        availability: { day: number; slots: string[] }[];
      };

      await User.findByIdAndUpdate(userId, {
        "therapistProfile.availability": availability,
      });

      res.json({ message: "Availability updated" });
    },
  );

  /** PATCH /therapists/me/profile — save therapist profile details */
  static updateProfile = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      const userId = req.user!.sub;
      const { bio, fee, specializations, introVideoUrl, email, website, phone, openToCollaboration } = req.body;

      const user = await User.findById(userId);
      if (!user) throw new AppError("User not found", 404);

      if (!user.therapistProfile) {
        user.therapistProfile = {
          name: user.fullName ?? "Therapist",
          specializations: [],
          languages: ["English", "Hindi"],
          availability: [],
          rating: 0,
          sessionCount: 0,
          sessionFee: 1500,
          verified: false,
          verificationStatus: "pending",
        };
      }

      const profile = user.therapistProfile!;
      if (bio !== undefined) profile.bio = bio;
      if (fee !== undefined) {
        let f = Number(fee);
        if (f < 0) f = 0;
        profile.sessionFee = f;
      }
      if (specializations !== undefined) {
        profile.specializations = specializations.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      if (introVideoUrl !== undefined) profile.introVideoUrl = introVideoUrl;
      if (email !== undefined) profile.email = email;
      if (website !== undefined) profile.website = website;
      if (phone !== undefined) profile.phone = phone;
      if (openToCollaboration !== undefined) profile.openToCollaboration = !!openToCollaboration;

      await user.save();

      res.json({ message: "Profile updated" });
    },
  );

  /** GET /therapists/me/invitations — Therapist lists received invitations */
  static listInvitations = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;

    const invitations = await TherapistInvitation.find({
      therapistId: userId,
      status: "pending"
    })
      .populate("orgId", "name officialEmail type verificationStatus")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ invitations });
  });

  /** PATCH /therapists/me/invitations/:id/respond — Therapist accepts or rejects */
  static respondToInvitation = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { action } = req.body as { action: "accepted" | "rejected" };

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'accepted' or 'rejected'." });
    }

    const invitation = await TherapistInvitation.findOne({
      _id: id,
      therapistId: userId,
      status: "pending"
    });

    if (!invitation) return res.status(404).json({ error: "Pending invitation not found" });

    invitation.status = action;
    await invitation.save();

    if (action === "accepted") {
      // Link therapist to org
      await User.findByIdAndUpdate(userId, { orgId: invitation.orgId });
      
      // Reject all other pending invitations for this therapist
      await TherapistInvitation.updateMany(
        { therapistId: userId, status: "pending", _id: { $ne: invitation._id } },
        { status: "rejected" }
      );
    }

    res.json({ message: `Invitation ${action}`, status: action });
  });
}
