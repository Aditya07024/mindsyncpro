import { Router } from "express";
import { requireAuth, requireRole, optionalAuth } from "@/middleware/auth";
import { ConferenceController } from "@/controllers/conference.controller";
import { posterUpload } from "@/middleware/upload.middleware";

const router = Router();

// Public / Optionally authenticated routes (Allows guests and logged-in users to list, register, and join conferences)
router.get("/", optionalAuth, ConferenceController.getAllConferences);
router.get("/public", optionalAuth, ConferenceController.getAllConferences);
router.get("/public/:id", optionalAuth, ConferenceController.getConferenceById);
router.post("/register", optionalAuth, ConferenceController.registerConference);
router.post("/payments/verify", optionalAuth, ConferenceController.verifyPayment);
router.get("/:id", optionalAuth, ConferenceController.getConferenceById);
router.get("/:id/join", optionalAuth, ConferenceController.getJoinInfo);
router.post("/:id/track", optionalAuth, ConferenceController.trackAttendance);
router.get("/:id/waiting-room", optionalAuth, ConferenceController.getWaitingRoomAttendees);
router.post("/:id/waiting-room/admit", optionalAuth, ConferenceController.admitAttendee);
router.post("/:id/waiting-room/allow-waiting", optionalAuth, ConferenceController.allowWaitingRoom);
router.post("/:id/waiting-room/admit-all", optionalAuth, ConferenceController.admitAllAttendees);
router.post("/:id/waiting-room/deny", optionalAuth, ConferenceController.denyAttendee);

// Admin endpoints require authentication and role checks
router.use(requireAuth);

// Admin endpoints
const adminRoles = ["super_admin", "admin", "org_admin"];

router.post("/upload-poster", requireRole(adminRoles), posterUpload.single("poster"), ConferenceController.uploadPoster);
router.post("/:id/poster", requireRole(adminRoles), posterUpload.single("poster"), ConferenceController.uploadConferencePosterById);
router.post("/", requireRole(adminRoles), ConferenceController.createConference);
router.put("/:id", requireRole(adminRoles), ConferenceController.updateConference);
router.delete("/:id", requireRole(adminRoles), ConferenceController.deleteConference);
router.patch("/:id/publish", requireRole(adminRoles), ConferenceController.togglePublish);

// Admin Attendee & Analytics routes
router.get("/admin/:id/attendees", requireRole(adminRoles), ConferenceController.getAttendees);
router.get("/admin/:id/analytics", requireRole(adminRoles), ConferenceController.getAnalytics);
router.patch("/admin/:id/attendees/:registrationId", requireRole(adminRoles), ConferenceController.updateAttendee);
router.delete("/admin/:id/attendees/:registrationId", requireRole(adminRoles), ConferenceController.removeAttendee);
router.get("/admin/:id/export", requireRole(adminRoles), ConferenceController.exportAttendees);

export default router;
