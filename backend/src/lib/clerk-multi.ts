import crypto from "crypto";
import jwt from "jsonwebtoken";
import { clerkClient, createClerkClient } from "@clerk/express";
import { env } from "@/config/env";

/**
 * Trusted Clerk Frontend API issuers across Web Production & Play Store Mobile App.
 * - https://clerk.mymindtherapyfriend.com  -> Web Production (ins_3EKcTJ2wJVNvBmoNCJAvQVi8wRK)
 * - https://famous-caiman-64.clerk.accounts.dev -> Deployed Play Store Mobile App (ins_3DRsgU1v9niNz5mdoLexS30V5IB)
 * - https://clerk.mindsyncpro.online -> Previous Web Custom Domain
 */
const TRUSTED_CLERK_ISSUERS = new Set([
  "https://clerk.mymindtherapyfriend.com",
  "https://famous-caiman-64.clerk.accounts.dev",
  "https://clerk.mindsyncpro.online",
]);

type CachedJwks = {
  fetchedAt: number;
  keysByKid: Map<string, string>; // kid -> PEM public key
};

const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour cache
const jwksCache = new Map<string, CachedJwks>();

const mobileClerkClient = env.CLERK_MOBILE_SECRET_KEY
  ? createClerkClient({ secretKey: env.CLERK_MOBILE_SECRET_KEY })
  : null;

async function getPemKeyForIssuerAndKid(
  issuer: string,
  kid: string,
  forceRefresh = false,
): Promise<string | null> {
  const cleanIssuer = issuer.replace(/\/+$/, "");
  if (!TRUSTED_CLERK_ISSUERS.has(cleanIssuer)) return null;

  const existing = jwksCache.get(cleanIssuer);
  if (
    !forceRefresh &&
    existing &&
    Date.now() - existing.fetchedAt < JWKS_TTL_MS &&
    existing.keysByKid.has(kid)
  ) {
    return existing.keysByKid.get(kid)!;
  }

  try {
    const res = await fetch(`${cleanIssuer}/.well-known/jwks.json`);
    if (!res.ok) return null;
    const data: any = await res.json();
    const keysByKid = new Map<string, string>();

    if (Array.isArray(data?.keys)) {
      for (const jwk of data.keys) {
        if (jwk?.kid && jwk?.kty === "RSA") {
          const pubKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
          const pem = pubKey
            .export({ type: "spki", format: "pem" })
            .toString();
          keysByKid.set(String(jwk.kid), pem);
        }
      }
    }

    jwksCache.set(cleanIssuer, { fetchedAt: Date.now(), keysByKid });
    return keysByKid.get(kid) || null;
  } catch (err: any) {
    console.warn(`[clerk-multi] Failed to fetch JWKS from ${cleanIssuer}:`, err?.message || err);
    return existing?.keysByKid.get(kid) || null;
  }
}

/**
 * Cryptographically verifies a Clerk session JWT issued by EITHER the Web Production
 * Clerk instance OR the Play Store Mobile App Clerk instance using RS256 JWKS.
 */
export async function verifyBearerTokenMultiInstance(
  token: string,
): Promise<{ sub: string; iss?: string; email?: string } | null> {
  try {
    const decodedComplete: any = jwt.decode(token, { complete: true });
    if (!decodedComplete?.header || !decodedComplete?.payload) return null;

    const kid = String(decodedComplete.header.kid || "");
    const iss = String(decodedComplete.payload.iss || "").replace(/\/+$/, "");
    const sub = String(decodedComplete.payload.sub || "");

    if (!sub || !iss || !TRUSTED_CLERK_ISSUERS.has(iss)) {
      return null;
    }

    if (kid) {
      let pem = await getPemKeyForIssuerAndKid(iss, kid, false);
      if (!pem) {
        pem = await getPemKeyForIssuerAndKid(iss, kid, true);
      }
      if (!pem) return null;

      const verified: any = jwt.verify(token, pem, {
        algorithms: ["RS256"],
        issuer: iss,
        clockTolerance: 60,
      });

      if (verified?.sub) {
        return {
          sub: String(verified.sub),
          iss,
          email: typeof verified.email === "string" ? verified.email : undefined,
        };
      }
    }

    return null;
  } catch (err: any) {
    console.warn("[clerk-multi] Token verification failed:", err?.message || err);
    return null;
  }
}

/**
 * Fetches a Clerk user profile from either the Primary (Web Production) Clerk instance
 * or the Secondary (Play Store Mobile) Clerk instance if CLERK_MOBILE_SECRET_KEY is configured.
 */
export async function getClerkUserAnyInstance(clerkUserId: string): Promise<any | null> {
  if (!clerkUserId) return null;

  try {
    return await clerkClient.users.getUser(clerkUserId);
  } catch {
    // User ID may belong to the Play Store Mobile Clerk instance
  }

  if (mobileClerkClient) {
    try {
      return await mobileClerkClient.users.getUser(clerkUserId);
    } catch {
      // Not found in secondary instance either
    }
  }

  return null;
}

/**
 * Deletes a Clerk user from whichever Clerk instance(s) hold the account.
 */
export async function deleteClerkUserAnyInstance(
  clerkIds: Array<string | undefined | null>,
): Promise<void> {
  const uniqueIds = Array.from(new Set(clerkIds.filter(Boolean) as string[]));
  for (const id of uniqueIds) {
    try {
      await clerkClient.users.deleteUser(id);
    } catch {
      // Ignore if not in primary instance
    }
    if (mobileClerkClient) {
      try {
        await mobileClerkClient.users.deleteUser(id);
      } catch {
        // Ignore if not in mobile instance
      }
    }
  }
}
