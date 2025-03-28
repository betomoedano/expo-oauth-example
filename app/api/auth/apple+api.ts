import * as jose from "jose";
import crypto from "crypto";
import { JWT_EXPIRATION_TIME, REFRESH_TOKEN_EXPIRY } from "@/utils/constants";
import { JWT_SECRET } from "@/utils/constants";

/**
 * To verify the identity token, your app server must:
 * Verify the JWS E256 signature using the server's public key
 * Verify the nonce for the authentication
 * Verify that the iss field contains https://appleid.apple.com
 * Verify that the aud field is the developer's client_id
 * Verify that the time is earlier than the exp value of the token
 */
export async function POST(req: Request) {
  const { identityToken, rawNonce, givenName, familyName, email } =
    await req.json();
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

    // Log values for debugging
    console.log("Raw nonce received:", rawNonce);
    console.log("Received nonce from Apple:", payload.nonce);
    console.log("Nonce supported:", (payload as any).nonce_supported);

    // If nonce_supported is true, Apple returns the raw nonce
    // If false, Apple returns the hashed nonce
    if ((payload as any).nonce_supported) {
      // For nonce_supported=true, compare raw nonces
      if (payload.nonce !== rawNonce) {
        throw new Error("Invalid nonce");
      }
    } else {
      // For nonce_supported=false, compare hashed nonces
      const computedHashedNonce = crypto
        .createHash("sha256")
        .update(Buffer.from(rawNonce, "utf8"))
        .digest("base64url");

      console.log("Computed hashed nonce:", computedHashedNonce);

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

    // For native platforms, return both tokens in the response body
    return Response.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}
