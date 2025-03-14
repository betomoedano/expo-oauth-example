import * as jose from "jose";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback`;

// Cookie settings
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60; // 60 seconds

// JWT expiration time
const JWT_EXPIRATION_TIME = "60s"; // 60 seconds

export async function POST(request: Request) {
  const body = await request.formData();
  const code = body.get("code") as string;
  const platform = (body.get("platform") as string) || "native"; // Default to native if not specified

  console.log("SERVER - Handling token request for", platform);

  if (!code) {
    return Response.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  const data = await response.json();

  if (!data.id_token) {
    return Response.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const userInfo = jose.decodeJwt(data.id_token) as object;

  // Create a new object without the exp property from the original token
  const { exp, ...userInfoWithoutExp } = userInfo as any;

  // User id
  const sub = (userInfo as { sub: string }).sub;

  // Current timestamp in seconds
  const issuedAt = Math.floor(Date.now() / 1000);

  const customToken = await new jose.SignJWT(userInfoWithoutExp)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .setSubject(sub) // The "sub" (subject) claim identifies the user this token belongs to, typically using their unique ID.
    .setIssuedAt(issuedAt) // Explicitly set the issued at time
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!)); // jose requires you to encode the secret key manually

  if (data.error) {
    return Response.json(
      {
        error: data.error,
        error_description: data.error_description,
        message:
          "OAuth validation error - please ensure the app complies with Google's OAuth 2.0 policy",
      },
      {
        status: 400,
      }
    );
  }

  // Handle web platform with cookies
  if (platform === "web") {
    // Create a response with the token in the body
    const response = Response.json({
      success: true,
      issuedAt: issuedAt,
      expiresAt: issuedAt + COOKIE_MAX_AGE,
    });

    // Set the token in an HTTP-only cookie
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=${customToken}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

    return response;
  }

  // For native platforms, return the token in the response body
  return Response.json(customToken);
}
