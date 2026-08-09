import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import {
  User,
  Mood,
  Conversation,
  JournalEntry,
  TherapistBooking,
  Notification,
  SharedReport,
  AIReport,
} from "@/models";

export class AccountController {
  /**
   * DELETE /api/account
   * Permanently deletes the authenticated user's database records and Clerk user account.
   * Authentication is enforced via requireAuth middleware (Clerk session token).
   * Never accepts target userId or email from request body or query string.
   */
  static deleteAccount = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user!.sub;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const clerkIdToDelete = user.clerkId || userId;

    // Delete associated user data from application database
    await Promise.all([
      Mood.deleteMany({ userId }),
      Conversation.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      TherapistBooking.deleteMany({ $or: [{ userId }, { therapistId: userId }] }),
      Notification.deleteMany({ userId }),
      SharedReport.deleteMany({ $or: [{ userId }, { therapistId: userId }] }),
      AIReport.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    // Delete user from Clerk using backend Server SDK
    if (clerkIdToDelete) {
      try {
        const { clerkClient } = await import("@clerk/express");
        await clerkClient.users.deleteUser(clerkIdToDelete);
      } catch (err: any) {
        console.error(`[Account] Failed to delete user ${userId} from Clerk:`, err.message);
      }
    }

    console.log(`[Account] Successfully deleted account for user ID: ${userId}`);

    res.json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  });
}
