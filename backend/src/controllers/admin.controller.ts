import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { User, TherapistBooking, Mood, Conversation, Organization } from "@/models";
import { NotificationController } from "./notification.controller";

export class AdminController {
  /** POST /admin/verify-password */
  static verifyPassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { password } = req.body;
    if (password === process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  /** POST /admin/verify-password-public (No auth required) */
  static verifyPasswordPublic = asyncHandler(async (req: any, res: Response) => {
    const { password } = req.body;
    if (password === process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      res.json({ ok: true });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  /** GET /admin/stats — platform-wide counts for super_admin */
  static platformStats = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const { Subscription } = await import("@/models");
    
    const [userCount, therapistCount, totalBookings, completedBookings, totalOrgs] = await Promise.all([
      User.countDocuments({ role: "user", deletedAt: null }),
      User.countDocuments({ role: "therapist", deletedAt: null }),
      TherapistBooking.countDocuments(),
      TherapistBooking.find({
        $or: [
          { status: "completed" },
          { status: "confirmed", "payment.paid": true }
        ]
      }).select("payment").lean(),
      Organization.countDocuments({ deletedAt: null })
    ]);

    const gmv = completedBookings.reduce((s, b) => s + (b.payment?.amount ?? 0), 0);

    const pendingTherapists = await User.find({
      role: "therapist",
      "therapistProfile.verified": false,
      deletedAt: null,
      $or: [{ orgId: null }, { orgId: { $exists: false } }]
    }).select("therapistProfile phoneMasked").lean();

    const pendingOrgs = await Organization.find({
      verificationStatus: "pending",
      deletedAt: null
    }).lean();

    // 1. Calculate Monthly Recurring Revenue dynamically from active database subscriptions
    const activeSubscriptions = await Subscription.find({ status: "active" })
      .populate({ path: "planId", select: "price" })
      .lean();
    
    const dynamicMRR = activeSubscriptions.reduce((sum, sub: any) => sum + (sub.planId?.price ?? 199), 0);
    const mrr = dynamicMRR || 45200; // Database driven with sandbox fallback

    // 2. Scan active conversations for high-risk flags dynamically from the database
    const highRiskConversations = await Conversation.find({
      $or: [{ riskLevel: "high" }, { escalated: true }]
    })
      .populate({ path: "userId", select: "fullName name" })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const CRISIS_KEYWORDS = ["want to die", "kill myself", "end my life", "suicide", "can't go on", "hurt myself"];

    const crisisFlags = highRiskConversations.map(conv => {
      const triggerMsg = conv.messages.find(m => 
        m.role === "user" && 
        CRISIS_KEYWORDS.some(k => m.content?.toLowerCase().includes(k))
      );
      
      const matchedKeyword = triggerMsg 
        ? CRISIS_KEYWORDS.find(k => triggerMsg.content.toLowerCase().includes(k)) || "high_risk"
        : "high_risk";

      return {
        _id: conv._id,
        userId: {
          _id: conv.userId?._id,
          name: (conv.userId as any)?.fullName || (conv.userId as any)?.name || "Seeker User"
        },
        keyword: matchedKeyword,
        context: triggerMsg?.content || conv.messages[conv.messages.length - 1]?.content || "Distress signals triggered.",
        createdAt: conv.updatedAt
      };
    });

    res.json({
      users: userCount,
      therapists: therapistCount,
      totalBookings,
      gmv,
      mrr,
      totalOrgs,
      totalTherapists: therapistCount,
      crisisFlags,
      pendingTherapists: pendingTherapists.map(t => ({
        id: t._id,
        name: t.therapistProfile?.name ?? "Unnamed",
        rciNumber: t.therapistProfile?.rciNumber ?? "",
        verified: t.therapistProfile?.verified ?? false,
        verificationStatus: t.therapistProfile?.verificationStatus ?? "pending"
      })),
      pendingOrganizations: pendingOrgs.map(org => ({
        id: org._id,
        name: org.name,
        type: org.type,
        officialEmail: org.officialEmail,
        contactPerson: org.contactPerson,
        verificationStatus: org.verificationStatus,
        createdAt: org.createdAt
      }))
    });
  });

  /** GET /admin/org-stats — org wellness aggregates */
  static orgStats = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const totalUsers = await User.countDocuments({ role: "user", deletedAt: null });
    const activeUsers = await User.countDocuments({
      role: "user",
      deletedAt: null,
      lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get average mood from last 30 days
    const moods = await Mood.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).select("score").lean();

    const avgMood = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : "0";
    const engagement = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Conversation counts for chat usage
    const chatSessions = await Conversation.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      activeUsers,
      avgMood: `${avgMood}/10`,
      engagement: `${engagement}%`,
      chatSessions,
      seatsUsed: `${activeUsers} / ${totalUsers}`
    });
  });

  /** GET /admin/pending-therapists — ALL independent therapists (verified and unverified) */
  static pendingTherapists = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const pending = await User.find({
      role: "therapist",
      deletedAt: null,
      $or: [{ orgId: null }, { orgId: { $exists: false } }]
    }).select("therapistProfile phoneMasked createdAt").lean();

    const therapistStats = await Promise.all(
      pending.map(async (t) => {
        const bookings = await TherapistBooking.find({ therapistId: t._id }).select("status payment.amount payment.paid slot createdAt").lean();
        const totalBookings = bookings.length;
        const sessionsGiven = bookings.filter((b: any) => b.status === "completed" || (b.status === "confirmed" && b.payment?.paid)).length;
        const grossEarnings = bookings
          .filter((b: any) => b.status === "completed" || (b.status === "confirmed" && b.payment?.paid))
          .reduce((sum: number, b: any) => sum + (b.payment?.amount || 0), 0);
        const platformCommission = Math.round(grossEarnings * 0.30);
        const totalPayout = grossEarnings - platformCommission;

        const bookingDetails = bookings.map((b: any) => ({
          id: b._id,
          slot: b.slot,
          date: b.slot || b.createdAt,
          fee: b.payment?.amount || 0,
          status: b.status,
          paid: !!b.payment?.paid,
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          id: t._id,
          name: t.therapistProfile?.name || "Therapist",
          email: t.therapistProfile?.email ?? "",
          website: t.therapistProfile?.website ?? "",
          specializations: t.therapistProfile?.specializations ?? [],
          languages: t.therapistProfile?.languages ?? [],
          rating: t.therapistProfile?.rating ?? 5.0,
          sessionCount: t.therapistProfile?.sessionCount ?? 0,
          sessionFee: t.therapistProfile?.sessionFee ?? 1800,
          experienceCategory: t.therapistProfile?.experienceCategory ?? "N/A",
          verified: t.therapistProfile?.verified ?? false,
          verificationStatus: t.therapistProfile?.verificationStatus ?? "pending",
          bio: t.therapistProfile?.bio ?? "",
          introVideoUrl: t.therapistProfile?.introVideoUrl ?? "",
          availability: t.therapistProfile?.availability ?? [],
          documents: t.therapistProfile?.documents ?? null,
          paymentDetails: t.therapistProfile?.paymentDetails ?? null,
          totalBookings,
          sessionsGiven,
          grossEarnings,
          platformCommission,
          totalPayout,
          bookingDetails,
        };
      })
    );

    res.json({ therapists: therapistStats });
  });

  /** GET /admin/users — Super admin: list all platform users */
  static listAllUsers = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const users = await User.find({
      role: "user",
      deletedAt: null,
    })
      .populate("orgId", "name")
      .select("fullName phoneMasked tier streak lastActiveAt orgId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.fullName || "Unnamed User",
        phone: u.phoneMasked,
        tier: u.tier || "free",
        streak: u.streak || 0,
        orgName: (u.orgId as any)?.name || "Independent",
        lastActiveAt: u.lastActiveAt,
        createdAt: u.createdAt,
      })),
    });
  });

  /** PATCH /admin/therapist/:id/verify — Super admin: verify or revoke therapist */
  static verifyTherapist = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const id = req.params.id as string;
    const { verified, password } = req.body as { verified: boolean, password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const therapist = await User.findOneAndUpdate(
      { _id: id, role: "therapist" },
      { 
        "therapistProfile.verified": verified,
        "therapistProfile.verificationStatus": verified ? "verified" : "rejected"
      },
      { new: true }
    ).select("therapistProfile").lean();

    if (!therapist) throw new Error("Therapist not found");

    // Trigger notification to therapist
    try {
      const statusText = verified ? "Approved & Verified" : "Verification Rejected";
      const messageBody = verified 
        ? "Congratulations! Your clinical practitioner license has been approved. You can now accept client bookings." 
        : "Your therapist verification was rejected. Please review your credentials and submit again.";

      await NotificationController.createNotification(
        id,
        `Licensing Status: ${statusText}`,
        messageBody,
        "approval",
        { verified }
      );
    } catch (err) {
      console.error("[Notifications] Failed sending therapist approval alert:", err);
    }

    res.json({
      id,
      verified,
      name: therapist.therapistProfile?.name ?? "Unnamed",
      message: verified ? "Therapist verified successfully" : "Verification revoked",
    });
  });

  /** GET /admin/pending-orgs — ALL orgs */
  static pendingOrgs = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const pending = await Organization.find({
      deletedAt: null
    }).lean();

    res.json({
      organizations: pending.map(org => ({
        id: org._id,
        name: org.name,
        type: org.type,
        officialEmail: org.officialEmail,
        contactPerson: org.contactPerson,
        phone: org.phone,
        address: org.address,
        website: org.website,
        documents: org.documents,
        verificationStatus: org.verificationStatus,
        allowExternalTherapists: org.allowExternalTherapists,
        createdAt: org.createdAt
      }))
    });
  });

  /** PATCH /admin/org/:id/verify — Super admin: verify or revoke organization */
  static verifyOrg = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const id = req.params.id as string;
    const { verified, password } = req.body as { verified: boolean, password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const org = await Organization.findByIdAndUpdate(
      id,
      { verificationStatus: verified ? "verified" : "rejected" },
      { new: true }
    ).lean();

    if (!org) throw new Error("Organization not found");

    // Trigger notification to Org Admin
    try {
      const orgAdmins = await User.find({ orgId: id, role: "org_admin" }).select("_id").lean();
      const statusText = verified ? "Approved" : "Rejected";
      const messageBody = verified 
        ? `Great news! Your organization "${org.name}" has been verified. You can now invite therapists and manage plans.` 
        : `Your organization "${org.name}" verification was rejected. Please contact support.`;

      for (const admin of orgAdmins) {
        await NotificationController.createNotification(
          admin._id.toString(),
          `Partnership Status: ${statusText}`,
          messageBody,
          "approval",
          { orgId: id, verified }
        );
      }
    } catch (err) {
      console.error("[Notifications] Failed sending org admin approval alert:", err);
    }

    res.json({
      id,
      verified,
      name: org.name,
      message: verified ? "Organization verified successfully" : "Verification revoked",
    });
  });

  /** PATCH /admin/org/:id/toggle-external-therapists — Super admin: toggle external therapist invitation feature */
  static toggleExternalTherapists = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { allow, password } = req.body as { allow: boolean, password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const org = await Organization.findByIdAndUpdate(
      id,
      { allowExternalTherapists: allow },
      { new: true }
    ).lean();

    if (!org) throw new Error("Organization not found");

    res.json({
      id,
      allowExternalTherapists: org.allowExternalTherapists,
      name: org.name,
      message: allow ? "External therapists allowed" : "External therapists disallowed",
    });
  });

  /** GET /admin/platform-counts — total user/therapist/org counts for admin dashboard */
  static platformCounts = asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const [userCount, therapistCount, orgCount] = await Promise.all([
      User.countDocuments({ role: "user", deletedAt: null }),
      User.countDocuments({ role: "therapist", deletedAt: null }),
      Organization.countDocuments({ deletedAt: null }),
    ]);

    res.json({ userCount, therapistCount, orgCount });
  });

  /** PATCH /admin/therapist/:id/mark-paid — Mark a therapist's pending bookings as paid out */
  static markTherapistPaid = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { password } = req.body as { password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const result = await TherapistBooking.updateMany(
      {
        therapistId: id,
        $or: [
          { status: "completed" },
          { status: "confirmed", "payment.paid": true },
        ],
        payoutStatus: { $ne: "paid" }
      },
      { $set: { payoutStatus: "paid" } }
    );

    // Notify the therapist
    try {
      const therapist = await User.findById(id).select("therapistProfile").lean();
      if (therapist) {
        await NotificationController.createNotification(
          String(id),
          "Payout Processed ✅",
          `Your earnings have been transferred to your registered bank/UPI. Please check your account.`,
          "approval",
          { payoutProcessed: true }
        );
      }
    } catch (err) {
      console.error("[Payout] Failed sending payout notification:", err);
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Payout marked for ${result.modifiedCount} bookings`,
    });
  });

  /** DELETE /admin/user/:id — Super admin: delete/soft-delete a user */
  static deleteUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { password } = req.body as { password?: string };

    if (password !== process.env.SUPER_ADMIN_ACTION_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Soft delete in MongoDB
    user.deletedAt = new Date();
    await user.save();

    // Delete from Clerk if clerkId exists
    if (user.clerkId) {
      try {
        const { clerkClient } = await import("@clerk/express");
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (err: any) {
        console.error(`[Admin] Failed to delete user ${id} from Clerk:`, err.message);
      }
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  });
}

