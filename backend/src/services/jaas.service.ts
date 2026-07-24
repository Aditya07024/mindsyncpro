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
   * Read RSA Private Key from environment variable or file
   */
  public static getPrivateKey(): string {
    if (this.privateKeyCache) return this.privateKeyCache;

    // 1. Check if raw PEM string is provided in env
    if (process.env.JAAS_PRIVATE_KEY) {
      this.privateKeyCache = process.env.JAAS_PRIVATE_KEY.replace(/\\n/g, "\n");
      return this.privateKeyCache;
    }

    // 2. Check file path (e.g. ./keys/jaas-private.pem or absolute path)
    const keyPath = process.env.JAAS_PRIVATE_KEY_PATH || "./keys/jaas-private.pem";
    const absolutePath = path.isAbsolute(keyPath)
      ? keyPath
      : path.join(process.cwd(), keyPath);

    if (fs.existsSync(absolutePath)) {
      this.privateKeyCache = fs.readFileSync(absolutePath, "utf8");
      return this.privateKeyCache;
    }

    // Also check relative to backend directory if running from workspace root
    const backendPath = path.join(process.cwd(), "backend", keyPath);
    if (fs.existsSync(backendPath)) {
      this.privateKeyCache = fs.readFileSync(backendPath, "utf8");
      return this.privateKeyCache;
    }

    throw new AppError(
      `JaaS RSA Private key file not found at ${absolutePath}. Please check JAAS_PRIVATE_KEY_PATH.`,
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
    moderator = true,
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
    const appId =
      process.env.JAAS_APP_ID ||
      "vpaas-magic-cookie-b417268e55554d20b3e8c5a64a71f374";
    const kid =
      process.env.JAAS_KID ||
      `${appId}/192f7f`;

    const privateKey = this.getPrivateKey();

    // 2. Room formatting: backend automatically prepends app ID prefix
    let cleanRoom = roomName.trim();
    if (cleanRoom.startsWith(`${appId}/`)) {
      cleanRoom = cleanRoom.replace(`${appId}/`, "");
    }

    const formattedRoomName = `${appId}/${cleanRoom}`;
    const now = Math.floor(Date.now() / 1000);

    const isMod = Boolean(moderator);

    // 3. Construct JaaS JWT Payload
    const payload = {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: cleanRoom, // or "*" for wildcard room access
      exp: now + expirySeconds,
      nbf: now - 10,
      moderator: isMod,
      context: {
        user: {
          id: user.id || user.email || `user_${Date.now()}`,
          name: user.name.trim(),
          email: user.email || `${user.name.toLowerCase().replace(/\s+/g, ".")}@mymindtherapyfriend.com`,
          avatar: user.avatar || "",
          moderator: isMod,
          role: isMod ? "moderator" : "participant",
        },
        features: {
          recording: isMod || (features.recording ?? true) ? "true" : "false",
          livestreaming: isMod || (features.livestreaming ?? true) ? "true" : "false",
          transcription: isMod || (features.transcription ?? true) ? "true" : "false",
          "file-upload": isMod || (features.fileUpload ?? true) ? "true" : "false",
          "outbound-call": "false",
          moderation: isMod ? "true" : "false",
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
