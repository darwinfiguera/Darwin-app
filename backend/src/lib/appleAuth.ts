import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export interface AppleTokenClaims {
  sub: string;
  email?: string;
}

/** Verifies an Apple `identityToken` (from expo-apple-authentication) against Apple's public keys. */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleTokenClaims> {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: env.appleClientId || undefined,
  });
  return { sub: payload.sub as string, email: payload.email as string | undefined };
}
