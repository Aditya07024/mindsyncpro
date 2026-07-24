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

    // 3. Check relative to backend directory if running from workspace root
    const backendPath = path.join(process.cwd(), "backend", keyPath);
    if (fs.existsSync(backendPath)) {
      this.privateKeyCache = fs.readFileSync(backendPath, "utf8");
      return this.privateKeyCache;
    }

    // 4. Default production key fallback (Ensures production server generates valid RS256 JWTs even if gitignored file is absent)
    const DEFAULT_PEM = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCGxsckR7j3m0Fr\nh70xixxI4AyvLoTWugcd/nAq7gmqEaxpiz3dqQqa+3hm5+5rk23Ud18h9OjpMA4D\niBrl+OS0iaoJ9SjAjgmYdld9omU8i7RJ+aUaICLUdRdUKSgx7cKldDuAfpCs6K0n\nLnG4ATeFceGIOU/bKYtt9xKCt43/TDbTEhOVQyUweXDZw30U2wQsAHpIaSZqt6CG\nLV4vBTx553DxfsXQoMkn3c/CDj64nGTo5PLeZUhAU4RvjdJyLbR4QyBO6W8/zXoE\nLaNywv5jWL1T4cImxfzWRYVmQMtyclxIYS3YWy1gafyjA13YuVmFKY4vXYNmhfX4\nR/M8IsEfAgMBAAECggEAWW05o6QHYhvdG5lUerQgD2bCY9aNA+Epachy6rlJJlRV\nvy5J3XMVe2JSMI3CEBUhsfGG6QQVKuzcz5EWr/Mm5XfWoIbQBHv6d/RF9zGy1Kqp\n9M+1shESq0AKO6iXaBGnrpriBE92dZRpl+7kO8Bq85ttlzLX/sahIlTnLl7W1Ebm\n9nj67SQ9vb1XFod/ais8s+l++xu/HB1fdDv679gsPuxPrOWKsTy1WNWle7kas0ox\nWKIjRofnZ7Zl8+ITgyGUw3yT+bvbDXO888aZd+VcuWYbxG4HZ+m97lkHhBD1+9C1\nePLBRGKEqRbHFJuKqyuXfOdhNP/oJXGhGAXTf7FywQKBgQDacliD7IV5MkO5moUT\nWy0xngQdPdVdcZsWVWBY8pLImRQLYVpBfebZ02d5vtK6pSjXmg7sWsRnChbOJ5ua\nOuq+nwqNGFoSYgDZDBZ0PzDhtnRUfsL7DxvU21uiwTz7eotPDd89d4+4gGV5ATT5\nJWK7LJJPMSMa8yVlcmUvZbwrIQKBgQCd8i1tsJ9rNiwIViimFOnKAveJYpvHR0cD\nBP+VaXQGIu86NBQ/VWuUh7ofucIXnahC32WBjmaXkRB19QI66rSQaGATHrrmJsbi\n8VKzjtPWcx+LWGdKOMXVENxklvcqp4Wl6wZQlAOAWG32c5hFkMAL6GC4Hh+sg9/I\nBcoEu9OkPwKBgQCzWFnPxeo3fMsZoQFMyPir2d3q3A9G7rSze1jk7hMQ2o0YYs8l\nIebcQ7Kaw85jKqIDkRpbdpH1PtVGYEJiN6ju48hX2vxoR0oG6OOugQry5UdQ79nJ\nIbhp48ayMxCMLyoct3jnEDhQ9ClbVWBWhRkwLwHYPrFhuOqlBWyJo27/wQKBgCIB\naCJ7qncMvMI2up23VvZ1WRItNtja0cEmrFhg0egYUWU4nTtdisH5zurRtaYb/YQY\nUORp4lCznNWooIhKzAFjV3wGW7r9kkh+KI4cLCO5uYrox6RFQOK0tJ67mg+G7dFh\nHoTuuSpC37n1/UzM82wc5eX+JlegNOf9xxbp0ZFFAoGARkYPjWYBO6dbxPBjJxcU\nrNHHbSA9KwxYoYhAi8FzjMHsv7G8wm5QRuCQuiowsl6/MCsJ1IXmYyMQftco5tgC\nClwL6B+jLZyVzI4YJm4CNQS4Ca0GtcR8X1PGYsHwCDs9XBftEQp4W3vx3KpMCHRU\ng7LNei+y4/YQ7uDiJ9RCorw=\n-----END PRIVATE KEY-----`;

    this.privateKeyCache = DEFAULT_PEM;
    return this.privateKeyCache;
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
