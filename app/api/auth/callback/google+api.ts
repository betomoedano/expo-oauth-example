import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`;

// Extract platform from state
function extractPlatformFromState(state: string): string | null {
  const parts = state.split(".");
  return parts.length > 1 ? parts[1] : null;
}

// Validate state parameter format
function isValidState(state: string): boolean {
  // State should be either 64 chars (32 bytes in hex)
  // or 64 chars + dot + platform
  const parts = state.split(".");

  if (parts.length > 2) return false;
  if (parts[0].length !== 64) return false;
  if (parts.length === 2 && !["web", "native"].includes(parts[1])) return false;

  // Verify the hex format of the random part
  return /^[a-f0-9]{64}$/i.test(parts[0]);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Validate the authorization code
  if (!code) {
    return Response.json(
      { error: "Authorization code is missing" },
      { status: 400 }
    );
  }

  // Validate state parameter
  if (!state || !isValidState(state)) {
    return Response.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  try {
    // Extract platform from state
    const platform = extractPlatformFromState(state);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) {
      throw new Error("Failed to get ID token");
    }

    // Verify ID token by fetching user info directly from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await userInfoResponse.json();
    console.log("USER DATA FROM GOOGLE", userData);
    const user = {
      id: userData.sub,
      email: userData.email,
      name: userData.name,
      given_name: userData.given_name,
      family_name: userData.family_name,
      email_verified: userData.email_verified,
      picture: userData.picture,
      provider: "google",
    };

    // Generate access token (short-lived)
    const accessToken = jwt.sign(user, process.env.JWT_SECRET!, {
      algorithm: "HS256",
      expiresIn: "10s",
    });

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET!, {
      algorithm: "HS256",
      expiresIn: "7d", // 7 days
    });

    // Use the extracted platform for redirect
    if (platform === "web") {
      return Response.redirect(
        `${process.env.EXPO_PUBLIC_BASE_URL}/?jwtToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } else {
      // For mobile platforms
      return Response.redirect(
        `${process.env.EXPO_PUBLIC_SCHEME}://?jwtToken=${accessToken}&refreshToken=${refreshToken}`
      );
    }
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
