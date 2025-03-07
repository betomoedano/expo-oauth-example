import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`; // Redirect back to your API
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Generate a secure random state
function generateState(platform?: string | null): string {
  // Generate 32 random bytes and convert to hex
  const randomState = crypto.randomBytes(32).toString("hex");

  // If platform is provided, append it to the state
  return platform ? `${randomState}.${platform}` : randomState;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  // Generate secure state parameter
  const state = generateState(platform);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    console.error("Missing environment variables");
    return Response.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile email",
    state, // Include the secure state parameter
    prompt: "select_account",
  });

  const redirectUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  console.log("Redirecting to:", redirectUrl);

  return Response.redirect(redirectUrl, 302);
}
