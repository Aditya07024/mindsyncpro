import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { AppError } from "@/lib/app-error";

export interface JaasUser {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface JaasTokenOptions {
  roomName: string;
  user: JaasUser;
  moderator?: boolean;
  expirySeconds?: number;
  features?: {
    recording?: boolean;
    livestreaming?: boolean;
    transcription?: boolean;
    fileUpload?: boolean;
    outboundCall?: boolean;
  };
}

export class JaasService {
  private static privateKeyCache: string | null = null;

  /**
   * Read RSA Private Key strictly from environment variable or key file path specified in env
   */
  public static getPrivateKey(): string {
    if (this.privateKeyCache) return this.privateKeyCache;

    // 1. Check if raw PEM string is provided in env
    if (process.env.JAAS_PRIVATE_KEY) {
      this.privateKeyCache = process.env.JAAS_PRIVATE_KEY.replace(/\\n/g, "\n");
      return this.privateKeyCache;
    }

    // 2. Check file path configured in env (e.g. JAAS_PRIVATE_KEY_PATH=./keys/jaas-private.pem)
    const keyPath = process.env.JAAS_PRIVATE_KEY_PATH;
    if (!keyPath) {
      throw new AppError(
        "Neither JAAS_PRIVATE_KEY nor JAAS_PRIVATE_KEY_PATH is set in environment variables (.env)",
        500
      );
    }

    const absolutePath = path.isAbsolute(keyPath)
      ? keyPath
      : path.join(process.cwd(), keyPath);

    if (fs.existsSync(absolutePath)) {
      this.privateKeyCache = fs.readFileSync(absolutePath, "utf8");
      return this.privateKeyCache;
    }

    // Check relative to backend directory if process ran from workspace root
    const backendPath = path.join(process.cwd(), "backend", keyPath);
    if (fs.existsSync(backendPath)) {
      this.privateKeyCache = fs.readFileSync(backendPath, "utf8");
      return this.privateKeyCache;
    }

    throw new AppError(
      `JaaS private key file not found at: ${keyPath}. Please verify JAAS_PRIVATE_KEY_PATH in your .env file.`,
      500
    );
  }

  /**
   * Helper function: generateMeetingToken()
   * Reusable token generator for conferences, webinars, appointments, consultations, and live events.
   */
  public static generateMeetingToken({
    roomName,
    user,
    moderator = false,
    expirySeconds = 3600,
    features = {},
  }: JaasTokenOptions) {
    // 1. Validation
    if (!roomName || !roomName.trim()) {
      throw new AppError("roomName is required for JaaS token generation", 400);
    }

    if (!user) {
      throw new AppError("user object is required for JaaS token generation", 400);
    }

    if (!user.name || !user.name.trim()) {
      throw new AppError("user.name is required for JaaS token generation", 400);
    }

    const domain = process.env.JAAS_DOMAIN || "8x8.vc";
    const appId = process.env.JAAS_APP_ID;
    if (!appId) {
      throw new AppError("JAAS_APP_ID is not configured in environment variables (.env)", 500);
    }

    const kid = process.env.JAAS_KID;
    if (!kid) {
      throw new AppError("JAAS_KID is not configured in environment variables (.env)", 500);
    }

    const privateKey = this.getPrivateKey();

    // 2. Room formatting: backend automatically prepends app ID prefix
    let cleanRoom = roomName.trim();
    if (cleanRoom.startsWith(`${appId}/`)) {
      cleanRoom = cleanRoom.replace(`${appId}/`, "");
    }

    const formattedRoomName = `${appId}/${cleanRoom}`;
    const isMod = moderator !== false;
    const now = Math.floor(Date.now() / 1000);

    // 3. Construct JaaS JWT Payload according to official 8x8 JaaS specification
    // Reference: https://developer.8x8.com/jaas/docs/jaas-jwt-structure
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: cleanRoom, // clean room name without app id prefix
      exp: now + expirySeconds,
      nbf: now - 10,
      iat: now,
      context: {
        user: {
          id: user.id || user.email || `user_${Date.now()}`,
          name: user.name.trim(),
          email: user.email || `${user.name.toLowerCase().replace(/\s+/g, ".")}@mymindtherapyfriend.com`,
          avatar: user.avatar || "",
          moderator: isMod ? "true" : "false",
        },
        features: {
          recording: isMod || (features.recording ?? true) ? "true" : "false",
          livestreaming: isMod || (features.livestreaming ?? true) ? "true" : "false",
          transcription: isMod || (features.transcription ?? true) ? "true" : "false",
          "file-upload": isMod || (features.fileUpload ?? true) ? "true" : "false",
          "outbound-call": "false",
        },
      },
    };

    // 4. Sign RS256 JWT
    let token: string;
    try {
      token = jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        header: {
          alg: "RS256",
          typ: "JWT",
          kid: kid,
        },
      });
    } catch (jwtErr: any) {
      throw new AppError(`JWT generation failed: ${jwtErr.message}`, 500);
    }

    // 5. Debug Logging (Verify against 8x8 JaaS JWT specification)
    const decoded = jwt.decode(token, { complete: true });
    console.log("[JaaS JWT Debug] Token Generated Successfully:");
    console.log("  Header:", JSON.stringify(decoded?.header));
    console.log("  Payload:", JSON.stringify(decoded?.payload));
    console.log("  Formatted Room Name:", formattedRoomName);
    console.log("  Raw Room Name:", cleanRoom);
    console.log("  Sub (App ID):", appId);
    console.log("  KID:", kid);
    console.log("  Moderator Flag:", payload.context.user.moderator);
    console.log("  Expires At:", new Date(payload.exp * 1000).toISOString());

    return {
      success: true,
      token,
      roomName: formattedRoomName,
      rawRoomName: cleanRoom,
      domain,
      appId,
    };
  }
}
