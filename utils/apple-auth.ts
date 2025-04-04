import * as jose from "jose";
import crypto from "crypto";
import {
  JWT_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
} from "@/utils/constants";

interface AppleAuthResult {
  accessToken: string;
  refreshToken: string;
}

interface AppleUserInfo {
  identityToken: string;
  rawNonce: string;
  givenName?: string;
  familyName?: string;
  email?: string;
}

export async function verifyAndCreateTokens({
  identityToken,
  rawNonce,
  givenName,
  familyName,
  email,
}: AppleUserInfo): Promise<AppleAuthResult> {
  const isFirstSignIn = givenName && email;

  // Get Apple's public keys from their JWKS endpoint
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://appleid.apple.com/auth/keys")
  );

  try {
    // Verify the token signature and claims
    const { payload } = await jose.jwtVerify(identityToken, JWKS, {
      issuer: "https://appleid.apple.com",
      audience: "com.beto.expoauthexample",
    });

    // Verify token hasn't expired first
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTimestamp) {
      throw new Error("Token has expired");
    }

    // Verify required claims are present
    if (!payload.sub || !payload.iss || !payload.aud || !payload.nonce) {
      throw new Error("Missing required claims in token");
    }

    // Verify nonce
    if ((payload as any).nonce_supported) {
      if (payload.nonce !== rawNonce) {
        throw new Error("Invalid nonce");
      }
    } else {
      const computedHashedNonce = crypto
        .createHash("sha256")
        .update(Buffer.from(rawNonce, "utf8"))
        .digest("base64url");

      if (payload.nonce !== computedHashedNonce) {
        throw new Error("Invalid nonce");
      }
    }

    // Create a new object without the exp property from the original token
    const { exp, ...userInfoWithoutExp } = payload;

    // user id
    const sub = (payload as { sub: string }).sub;

    // Current timestamp in seconds
    const issuedAt = Math.floor(Date.now() / 1000);

    // Generate a unique jti (JWT ID) for the refresh token
    const jti = crypto.randomUUID();

    // Create access token (short-lived)
    const accessToken = await new jose.SignJWT({
      ...userInfoWithoutExp,
      email: isFirstSignIn ? email : "example@icloud.com",
      name: isFirstSignIn ? `${givenName} ${familyName}` : "apple-user",
      email_verified: (payload as any).email_verified ?? false,
      is_private_email: (payload as any).is_private_email ?? false,
      real_user_status: (payload as any).real_user_status ?? 0,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Create refresh token (long-lived)
    const refreshToken = await new jose.SignJWT({
      sub,
      jti,
      type: "refresh",
      email: isFirstSignIn ? email : "example@icloud.com",
      name: isFirstSignIn ? `${givenName} ${familyName}` : "apple-user",
      email_verified: (payload as any).email_verified ?? false,
      is_private_email: (payload as any).is_private_email ?? false,
      real_user_status: (payload as any).real_user_status ?? 0,
      nonce_supported: (payload as any).nonce_supported ?? false,
      iss: "https://appleid.apple.com",
      aud: (payload as any).aud,
      ...userInfoWithoutExp,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
}
