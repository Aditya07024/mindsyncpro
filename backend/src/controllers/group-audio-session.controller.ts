import type { Response } from "express";
import { asyncHandler } from "@/lib/async-handler";
import type { AuthedRequest } from "@/middleware/auth";
import { GroupAudioSession, User } from "@/models";
import { AppError } from "@/lib/app-error";
import LiveKitService from "@/services/livekit.service";
import mongoose from "mongoose";

export class GroupAudioSessionController {
  /**
   * POST /api/group-sessions
   * Create a new group audio session (Counselor or Admin)
   */
  static createSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { title, description, internalStartTime, internalEndTime, maxUsers, price } = req.body;

    if (!title) {
      throw new AppError("Session title is required", 400);
    }

    const userId = req.user!.sub;
    const user = await User.findById(userId).lean();
    const isCounselor = user?.role === "therapist" || req.user?.role === "therapist";

    const startTime = internalStartTime ? new Date(internalStartTime) : new Date();
    const endTime = internalEndTime
      ? new Date(internalEndTime)
      : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // default 2 hour window

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const roomName = `audio-group-${Date.now()}-${randomSuffix}`;

    const session = await GroupAudioSession.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      counselorId: isCounselor ? new mongoose.Types.ObjectId(userId) : null,
      counselorName: isCounselor ? (user?.fullName || "Counselor") : "",
      internalStartTime: startTime,
      internalEndTime: endTime,
      status: "active",
      price: price !== undefined ? Number(price) : 0,
      maxUsers: maxUsers ? Number(maxUsers) : 11,
      roomName,
      isCounselorCreated: isCounselor,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return res.status(201).json({
      message: "Group audio session created successfully",
      session,
    });
  });

  /**
   * GET /api/group-sessions
   * List group audio sessions
   * - Counselors see all sessions with Red/Green status (Green = No counselor assigned)
   * - Users see ONLY active live sessions (future sessions and raw timings hidden)
   */
  static getAllSessions = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user?.sub;
    let userRole = req.user?.role || "user";

    if (userId) {
      const dbUser = await User.findById(userId).select("role").lean();
      if (dbUser?.role) {
        userRole = dbUser.role;
      }
    }

    const isCounselorOrAdmin = userRole === "therapist" || userRole === "super_admin" || userRole === "admin";

    if (isCounselorOrAdmin) {
      // Counselor/Admin view: return all sessions with Red/Green indicator
      const sessions = await GroupAudioSession.find()
        .sort({ createdAt: -1 })
        .lean();

      const formattedSessions = sessions.map((s) => {
        const isCounselorAssigned = Boolean(s.counselorId);
        return {
          ...s,
          isCounselorAssigned,
          indicatorColor: isCounselorAssigned ? "red" : "green",
          indicatorLabel: isCounselorAssigned
            ? `Assigned: ${s.counselorName || "Counselor"}`
            : "No Counselor Assigned - Available to Join",
        };
      });

      return res.json({ sessions: formattedSessions });
    } else {
      // User view: return ONLY active live sessions, hiding future sessions & raw timings
      const sessions = await GroupAudioSession.find({
        status: "active",
      })
        .sort({ createdAt: -1 })
        .lean();

      const sanitizedSessions = sessions.map((s) => {
        const isUserAdmitted = Boolean(
          userId && s.admittedUsers.some((u) => u.userId.toString() === userId.toString())
        );
        const isUserWaiting = Boolean(
          userId && s.waitingQueue.some((u) => u.userId.toString() === userId.toString())
        );

        return {
          _id: s._id,
          title: s.title,
          description: s.description,
          status: s.status,
          price: s.price,
          maxUsers: s.maxUsers,
          roomName: s.roomName,
          counselorName: s.counselorName || "Certified Counselor",
          isUserAdmitted,
          isUserWaiting,
          admittedCount: s.admittedUsers.length,
          // Note: internalStartTime and internalEndTime are intentionally omitted for users
        };
      });

      return res.json({ sessions: sanitizedSessions });
    }
  });

  /**
   * POST /api/group-sessions/:id/claim
   * Claim an unassigned session as Counselor (Green -> Red)
   */
  static claimCounselorSlot = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const user = await User.findById(userId).lean();
    if (user?.role !== "therapist" && req.user?.role !== "therapist" && req.user?.role !== "super_admin") {
      throw new AppError("Only certified counselors can claim a group session slot", 403);
    }

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    if (session.counselorId && session.counselorId.toString() === userId.toString()) {
      session.counselorId = undefined as any;
      session.counselorName = "";
      await session.save();

      return res.json({
        message: "You have unassigned yourself from this session slot",
        session,
      });
    }

    if (session.counselorId) {
      throw new AppError("This session is already assigned to another counselor (Occupied - Red Indicator)", 400);
    }

    session.counselorId = new mongoose.Types.ObjectId(userId);
    session.counselorName = user?.fullName || "Counselor";
    await session.save();

    return res.json({
      message: "You have successfully claimed this session slot as Counselor",
      session,
    });
  });

  /**
   * POST /api/group-sessions/:id/join-request
   * User requests to join the group audio session
   */
  static requestJoin = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    const currentTotal = session.waitingQueue.length + session.admittedUsers.length;
    if (currentTotal >= (session.maxUsers || 11)) {
      throw new AppError(`This group audio session has reached the maximum capacity limit of ${session.maxUsers || 11} users`, 400);
    }

    const existingAdmitted = session.admittedUsers.find(
      (u) => u.userId.toString() === userId.toString()
    );
    if (existingAdmitted) {
      return res.json({
        message: "Already admitted to session",
        status: "admitted",
        anonymousName: existingAdmitted.anonymousName,
        session,
      });
    }

    const existingWaiting = session.waitingQueue.find(
      (u) => u.userId.toString() === userId.toString()
    );
    if (existingWaiting) {
      return res.json({
        message: "Waiting for counselor approval",
        status: "waiting",
        anonymousName: existingWaiting.anonymousName,
        session,
      });
    }

    // Generate deterministic anonymous label: "User 1", "User 2", etc.
    const totalCount = session.waitingQueue.length + session.admittedUsers.length + 1;
    const anonymousName = `User ${totalCount}`;

    const userObjId = new mongoose.Types.ObjectId(userId);

    // If counselor created or session has counselor host, place in waiting queue
    if (session.isCounselorCreated || session.counselorId) {
      session.waitingQueue.push({
        userId: userObjId,
        anonymousName,
        requestedAt: new Date(),
      });
      await session.save();

      return res.json({
        message: "Join request submitted. Waiting for counselor to allow entry.",
        status: "waiting",
        anonymousName,
        session,
      });
    } else {
      // Direct admit if open session
      session.admittedUsers.push({
        userId: userObjId,
        anonymousName,
        admittedAt: new Date(),
      });
      await session.save();

      return res.json({
        message: "Admitted to session",
        status: "admitted",
        anonymousName,
        session,
      });
    }
  });

  /**
   * POST /api/group-sessions/:id/approve-user
   * Counselor allows user entry into session (or denies entry)
   * Counselor ONLY sees anonymous label: "User 1", "User 2"
   */
  static approveUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { targetUserId, action = "allow" } = req.body; // action: 'allow' | 'deny'
    const userId = req.user!.sub;

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    // Check if user is host counselor or admin
    const isHost =
      (session.counselorId && session.counselorId.toString() === userId.toString()) ||
      (session.createdBy && session.createdBy.toString() === userId.toString()) ||
      req.user?.role === "super_admin" ||
      req.user?.role === "admin";

    if (!isHost) {
      throw new AppError("Only the assigned counselor can approve waiting users", 403);
    }

    const queueIndex = session.waitingQueue.findIndex(
      (u) => u.userId.toString() === targetUserId.toString()
    );

    if (queueIndex === -1) {
      throw new AppError("User not found in waiting queue", 404);
    }

    const waitingUser = session.waitingQueue[queueIndex];
    session.waitingQueue.splice(queueIndex, 1);

    if (action === "allow") {
      session.admittedUsers.push({
        userId: waitingUser.userId,
        anonymousName: waitingUser.anonymousName,
        admittedAt: new Date(),
      });
    }

    await session.save();

    return res.json({
      message: action === "allow" ? `${waitingUser.anonymousName} admitted to session` : `${waitingUser.anonymousName} denied entry`,
      session,
    });
  });

  /**
   * GET /api/group-sessions/:id/audio-token
   * Returns WebRTC audio session token & anonymous participant config
   */
  static getAudioToken = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    const isCounselorHost =
      session.counselorId && session.counselorId.toString() === userId.toString();

    const admittedEntry = session.admittedUsers.find(
      (u) => u.userId.toString() === userId.toString()
    );

    if (!isCounselorHost && !admittedEntry && req.user?.role !== "super_admin") {
      throw new AppError("You are not admitted to this audio session yet", 403);
    }

    const participantName = isCounselorHost
      ? `${session.counselorName || "Counselor"}`
      : admittedEntry?.anonymousName || "Participant";

    let token: string | null = null;
    try {
      token = await LiveKitService.generateToken({
        roomName: session.roomName,
        userName: participantName,
        userId,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });
    } catch (err) {
      console.error("[LiveKit] Group audio token generation failed:", err);
    }

    return res.json({
      success: true,
      token,
      livekitUrl: LiveKitService.getLiveKitURL() || "",
      roomName: session.roomName,
      sessionTitle: session.title,
      participantName,
      isCounselor: Boolean(isCounselorHost),
      audioOnly: true, // Strictly audio-only WebRTC
      videoEnabled: false, // Strictly NO video
    });
  });

  /**
   * PUT /api/group-sessions/:id/pricing
   * Update session price (Admin)
   */
  static updatePricing = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const { price } = req.body;

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    session.price = Number(price);
    await session.save();

    return res.json({
      message: "Group audio session price updated successfully",
      session,
    });
  });

  /**
   * DELETE /api/group-sessions/:id
   * Delete a group audio session (Counselor or Admin)
   */
  static deleteSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.sub;

    const user = await User.findById(userId).lean();
    const isCounselorOrAdmin =
      user?.role === "therapist" ||
      req.user?.role === "therapist" ||
      req.user?.role === "super_admin" ||
      req.user?.role === "admin";

    if (!isCounselorOrAdmin) {
      throw new AppError("Only certified counselors and administrators can delete audio sessions", 403);
    }

    const session = await GroupAudioSession.findById(id);
    if (!session) {
      throw new AppError("Group audio session not found", 404);
    }

    await GroupAudioSession.findByIdAndDelete(id);

    return res.json({
      message: "Group audio session deleted successfully",
    });
  });
}
