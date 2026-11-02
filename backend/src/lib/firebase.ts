import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "@/config/env";

const projectId = env.FIREBASE_PROJECT_ID || "my-mind-therapy-friend";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

export const firebaseAdmin = admin;

export interface VerifiedFirebaseToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  phone_number?: string;
  role?: string;
}

// Google JWK cache for fallback verification
let cachedJwks: { fetchedAt: number; keys: Map<string, string> } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

async function getGooglePublicKey(kid: string): Promise<string | null> {
  if (cachedJwks && Date.now() - cachedJwks.fetchedAt < JWKS_TTL_MS && cachedJwks.keys.has(kid)) {
    return cachedJwks.keys.get(kid)!;
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const map = new Map<string, string>();
    if (Array.isArray(data?.keys)) {
      for (const jwk of data.keys) {
        if (jwk?.kid && jwk?.kty === "RSA") {
          const pubKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
          map.set(jwk.kid, pubKey.export({ type: "spki", format: "pem" }).toString());
        }
      }
    }
    cachedJwks = { fetchedAt: Date.now(), keys: map };
    return map.get(kid) || null;
  } catch (err: any) {
    console.warn("[Firebase] Failed to fetch Google public JWKS:", err?.message || err);
    return cachedJwks?.keys.get(kid) || null;
  }
}

export async function verifyFirebaseToken(
  token: string
): Promise<VerifiedFirebaseToken | null> {
  if (!token) return null;

  // 1. Try Firebase Admin SDK native verifyIdToken
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded?.uid) {
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        phone_number: decoded.phone_number,
        role: (decoded as any).role,
      };
    }
  } catch (_adminErr: any) {
    // Proceed to fallback JWKS RS256 verification
  }

  // 2. Direct RS256 signature verification via Google SecureToken JWKS
  try {
    const decodedHeader: any = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) return null;

    const kid = decodedHeader.header.kid;
    const pubKey = await getGooglePublicKey(kid);
    if (!pubKey) return null;

    const verified: any = jwt.verify(token, pubKey, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      clockTolerance: 60,
    });

    if (verified?.user_id || verified?.sub) {
      return {
        uid: verified.user_id || verified.sub,
        email: verified.email,
        name: verified.name,
        picture: verified.picture,
        phone_number: verified.phone_number,
        role: verified.role,
      };
    }
  } catch (jwkErr: any) {
    console.warn("[Firebase] Token verification failed:", jwkErr?.message || jwkErr);
  }

  return null;
}

export async function getFirebaseUser(uid: string) {
  try {
    return await admin.auth().getUser(uid);
  } catch {
    return null;
  }
}

export async function deleteFirebaseUsers(
  uids: Array<string | undefined | null>
): Promise<void> {
  const uniqueIds = Array.from(new Set(uids.filter(Boolean) as string[]));
  for (const uid of uniqueIds) {
    try {
      await admin.auth().deleteUser(uid);
    } catch {
      // Ignore if user doesn't exist in Firebase
    }
  }
}
