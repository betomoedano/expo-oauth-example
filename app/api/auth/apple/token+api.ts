import {
  APPLE_CLIENT_ID,
  APPLE_CLIENT_SECRET,
  APPLE_REDIRECT_URI,
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  JWT_EXPIRATION_TIME,
  JWT_SECRET,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  REFRESH_TOKEN_EXPIRY,
} from "@/utils/constants";
import * as jose from "jose";

export async function POST(request: Request) {
  const body = await request.formData();
  const code = body.get("code") as string;
  const platform = (body.get("platform") as string) || "native"; // Default to native if not specified

  if (!code) {
    return Response.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  // Prepare params and log them for debugging
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    client_secret: APPLE_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: APPLE_REDIRECT_URI,
  });

  const response = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (response.status === 200) {
    const data = await response.json();
    const { access_token, id_token } = data;

    const userInfo = jose.decodeJwt(id_token) as object;

    const { exp, ...userInfoWithoutExp } = userInfo as any;

    const issuedAt = Math.floor(Date.now() / 1000);

    const jti = crypto.randomUUID();

    const sub = (userInfo as { sub: string }).sub;

    const accessToken = await new jose.SignJWT(userInfoWithoutExp)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    const refreshToken = await new jose.SignJWT({
      sub,
      jti,
      type: "refresh",
      ...userInfo,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Handle web platform with cookies
    if (platform === "web") {
      // Create a response with the token in the body
      const response = Response.json({
        success: true,
        issuedAt: issuedAt,
        expiresAt: issuedAt + COOKIE_MAX_AGE,
      });

      // Set the access token in an HTTP-only cookie
      response.headers.set(
        "Set-Cookie",
        `${COOKIE_NAME}=${accessToken}; Max-Age=${
          COOKIE_OPTIONS.maxAge
        }; Path=${COOKIE_OPTIONS.path}; ${
          COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""
        } ${COOKIE_OPTIONS.secure ? "Secure;" : ""} SameSite=${
          COOKIE_OPTIONS.sameSite
        }`
      );

      // Set the refresh token in a separate HTTP-only cookie
      response.headers.append(
        "Set-Cookie",
        `${REFRESH_COOKIE_NAME}=${refreshToken}; Max-Age=${
          REFRESH_COOKIE_OPTIONS.maxAge
        }; Path=${REFRESH_COOKIE_OPTIONS.path}; ${
          REFRESH_COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""
        } ${REFRESH_COOKIE_OPTIONS.secure ? "Secure;" : ""} SameSite=${
          REFRESH_COOKIE_OPTIONS.sameSite
        }`
      );

      return response;
    }

    return Response.json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } else if (response.status === 400) {
    // Get the error details from the response
    const errorData = await response.json();
    let errorMessage = "Invalid request";

    // Map Apple's error codes to descriptive messages
    switch (errorData.error) {
      case "invalid_request":
        errorMessage =
          "The request is missing parameters or contains unsupported parameters";
        break;
      case "invalid_client":
        errorMessage =
          "Client authentication failed - invalid client ID, secret or redirect URI";
        break;
      case "invalid_grant":
        errorMessage = "Invalid or expired authorization code";
        break;
      case "unauthorized_client":
        errorMessage =
          "Client not authorized to use this authorization grant type";
        break;
      case "unsupported_grant_type":
        errorMessage = "This grant type is not supported";
        break;
      case "invalid_scope":
        errorMessage = "The requested scope is invalid";
        break;
    }

    return Response.json(
      { error: errorMessage, details: errorData },
      { status: 400 }
    );
  } else {
    // Try to get more information about the error
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = "Could not read response body";
      }
    }

    return Response.json(
      { error: "Failed to fetch token", details: errorData },
      { status: response.status }
    );
  }
}

/**
 * To generate an apple client secret
 *
 * 1. Create a Key: In your Apple Developer account, generate a new key and note your Key ID and Apple Team ID.
 * 2. Build a JWT
 * •	iss: Your Apple Team ID.
 * •	iat: The current timestamp.
 * •	exp: Expiration time (up to 6 months ahead).
 * •	aud: "https://appleid.apple.com".
 * •	sub: Your Services ID (client ID).
 * 3. Sign the JWT using the private key.
 * 4. Base64 encode the JWT and send it to the token endpoint.
 */
