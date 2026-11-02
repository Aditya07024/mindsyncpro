import type { NextFunction, Request, Response } from "express";
import { AppError } from "@/lib/app-error";
import {
  verifyFirebaseToken,
  getFirebaseUser,
} from "@/lib/firebase";
import {
  getClerkUserAnyInstance,
  verifyBearerTokenMultiInstance,
} from "@/lib/clerk-multi";
import { User } from "@/models";

export type AuthedRequest = Request & {
  user?: {
    sub: string;
    role: string;
    firebaseUid?: string;
    clerkId?: string; // backwards compatibility
    email?: string;
  };
};

/**
 * requireAuth — verifies Firebase ID token from Authorization: Bearer header.
 * Also supports legacy Clerk session tokens during migration.
 * On success, attaches req.user = { sub: mongoUserId, role, firebaseUid, clerkId, email }.
 */
export async function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    let authUid: string | undefined;
    let verifiedEmail: string | undefined;
    let verifiedName: string | undefined;
    let verifiedRole: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      // 1. Try Firebase verification first
      const fbVerified = await verifyFirebaseToken(token);
      if (fbVerified?.uid) {
        authUid = fbVerified.uid;
        verifiedEmail = fbVerified.email;
        verifiedName = fbVerified.name;
        verifiedRole = fbVerified.role;
      } else {
        // 2. Fallback to legacy Clerk token verification
        const clerkVerified = await verifyBearerTokenMultiInstance(token);
        if (clerkVerified?.sub) {
          authUid = clerkVerified.sub;
          verifiedEmail = clerkVerified.email;
        }
      }
    }

    if (!authUid) {
      return next(new AppError("Unauthorized - No Valid Session", 401));
    }

    // Look up or auto-provision the MongoDB user
    let user: any = await User.findOne({
      $or: [
        { firebaseUid: authUid },
        { firebaseUids: authUid },
        { clerkId: authUid },
        { clerkIds: authUid },
        { phoneHash: authUid },
      ],
    }).lean();

    if (user && user.deletedAt) {
      // Reactivate: user is signing up again after deleting their account
      await User.updateOne(
        { _id: user._id },
        {
          $unset: { deletedAt: 1 },
          $set: { firebaseUid: user.firebaseUid || authUid },
          $addToSet: { firebaseUids: authUid },
        },
      );
      user.deletedAt = undefined;
      user.firebaseUid = user.firebaseUid || authUid;
    }

    if (user && !user.firebaseUid) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { firebaseUid: authUid },
          $addToSet: { firebaseUids: authUid },
        },
      );
      user.firebaseUid = authUid;
    } else if (
      user &&
      (!Array.isArray(user.firebaseUids) || !user.firebaseUids.includes(authUid))
    ) {
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { firebaseUids: authUid } },
      );
    }

    if (!user) {
      // First login with this auth ID
      let email = verifiedEmail || "";
      let fullName = verifiedName || "";

      // Try fetching Firebase user info if needed
      if (!email || !fullName) {
        try {
          const fbUser = await getFirebaseUser(authUid);
          if (fbUser) {
            email = fbUser.email || email;
            fullName = fbUser.displayName || fullName;
          }
        } catch {
          // ignore
        }
      }

      // Try fetching Clerk user info if it's a legacy Clerk ID
      if (!email && authUid.startsWith("user_")) {
        try {
          const clerkUser = await getClerkUserAnyInstance(authUid);
          if (clerkUser) {
            email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
            fullName = [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ");
          }
        } catch {
          // ignore
        }
      }

      if (email) {
        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        user = await User.findOne({
          $or: [
            { email: email.toLowerCase() },
            { phoneMasked: email },
            { phoneMasked: email.toLowerCase() },
            { phoneMasked: { $regex: new RegExp(`^${escapedEmail}$`, "i") } },
          ],
        }).lean();

        if (user) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                firebaseUid: user.firebaseUid || authUid,
                email: user.email || email.toLowerCase(),
              },
              $addToSet: { firebaseUids: authUid },
            },
          );
          user.firebaseUid = user.firebaseUid || authUid;
        }
      }

      if (!user) {
        try {
          let intentRole =
            (req.headers["x-intent-role"] as string) || verifiedRole || "";

          if (intentRole === "super admin" || intentRole === "super-admin")
            intentRole = "super_admin";
          if (intentRole === "org admin" || intentRole === "org-admin")
            intentRole = "org_admin";

          const validRoles = ["user", "therapist", "org_admin", "super_admin"];
          const roleToAssign = validRoles.includes(intentRole)
            ? intentRole
            : "user";

          const created = await User.create({
            firebaseUid: authUid,
            firebaseUids: [authUid],
            clerkId: authUid, // keep for compatibility
            clerkIds: [authUid],
            phoneHash: authUid,
            phoneMasked: email || authUid.slice(-8),
            email: email ? email.toLowerCase() : undefined,
            fullName: fullName || undefined,
            role: roleToAssign,
            tier: "free",
            isAnonymous: false,
            onboarding: { concerns: [] },
          });
          user = created.toObject() as any;
        } catch (createErr: any) {
          if (createErr.code === 11000) {
            user = await User.findOne({
              $or: [
                { firebaseUid: authUid },
                { firebaseUids: authUid },
                { clerkId: authUid },
                { clerkIds: authUid },
              ],
            }).lean();
          }
          if (!user) throw createErr;
        }
      }
    }

    if (!user) {
      return next(new AppError("Failed to create or fetch user", 500));
    }

    // Auto-link user to Organization if email is in Organization's allowedEmails
    if (!user.orgId && (user.phoneMasked?.includes("@") || user.email)) {
      try {
        const userEmail = (user.email || user.phoneMasked || "").toLowerCase().trim();
        if (userEmail) {
          const { Organization } = await import("@/models/organization");
          const matchingOrg = await Organization.findOne({
            allowedEmails: userEmail,
            verificationStatus: "verified",
          });

          if (matchingOrg) {
            await User.updateOne({ _id: user._id }, { $set: { orgId: matchingOrg._id } });
            user.orgId = matchingOrg._id;

            // Auto approve join request if present
            await Organization.updateOne(
              { _id: matchingOrg._id, "pendingJoinRequests.userId": user._id },
              { $set: { "pendingJoinRequests.$.status": "approved", "pendingJoinRequests.$.autoApproved": true } }
            );
          }
        }
      } catch (orgLinkErr) {
        console.error("Auto org link check failed:", orgLinkErr);
      }
    }

    req.user = {
      sub: String(user._id),
      role: user.role || "user",
      firebaseUid: authUid,
      clerkId: user.clerkId || authUid,
      email: user.email || verifiedEmail,
    };

    next();
  } catch (err: any) {
    console.error("Auth Token Verification Failed:", err.message);
    return next(new AppError("Invalid or expired session", 401));
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

export async function getPossibleUserEmails(req: AuthedRequest): Promise<string[]> {
  if (!req.user) return [];
  const emails: string[] = [];

  try {
    const { User } = await import("@/models/user");
    const dbUser: any = await User.findById(req.user.sub).select("email phoneMasked therapistProfile role firebaseUid");
    if (dbUser?.email) emails.push(dbUser.email);
    if (dbUser?.phoneMasked) emails.push(dbUser.phoneMasked);
    if (dbUser?.therapistProfile?.email) emails.push(dbUser.therapistProfile.email);
  } catch (e) {}

  if (req.user.email) {
    emails.push(req.user.email);
  }

  if (req.user.firebaseUid) {
    try {
      const fbUser = await getFirebaseUser(req.user.firebaseUid);
      if (fbUser?.email) emails.push(fbUser.email);
    } catch (e) {}
  }

  if (req.user.clerkId && req.user.clerkId.startsWith("user_")) {
    try {
      const clerkUser = await getClerkUserAnyInstance(req.user.clerkId);
      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        emails.push(clerkUser.emailAddresses[0].emailAddress);
      }
    } catch (e) {}
  }

  return Array.from(new Set(emails.map((e) => String(e).toLowerCase().trim()).filter(Boolean)));
}

export function requirePermission(permissionName: string) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const runPermissionCheck = async () => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      if (req.user.role === "super_admin" || req.user.role === "admin") {
        return next();
      }

      try {
        const { DelegatedAccess } = await import("@/models/delegated-access");
        const userEmails = await getPossibleUserEmails(req);

        for (const email of userEmails) {
          const access: any = await DelegatedAccess.findOne({ email });
          if (access && (access.isFullAdmin || access[permissionName])) {
            return next();
          }
        }
      } catch (err) {
        console.error("[requirePermission] Error checking permissions:", err);
      }

      return next(new AppError("Forbidden: Insufficient delegated permissions", 403));
    };

    if (!req.user) {
      return requireAuth(req, res, runPermissionCheck as any);
    }
    return runPermissionCheck();
  };
}

export async function optionalAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return requireAuth(req, res, (err?: any) => {
        if (err) {
          console.warn("[optionalAuth] Auth attempt failed, continuing as guest:", err.message);
          req.user = undefined;
          return next();
        }
        return next();
      });
    }
  } catch (e) {
    // ignore token errors for optional auth
  }
  req.user = undefined;
  next();
}
