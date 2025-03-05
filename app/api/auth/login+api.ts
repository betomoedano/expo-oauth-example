const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`; // Redirect back to your API
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  console.log("Login API called");
  console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
  console.log("GOOGLE_REDIRECT_URI:", GOOGLE_REDIRECT_URI);

  // const state = generateUUID(); // Use a secure state to prevent CSRF

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
    // state,
    prompt: "select_account",
  });

  // Add platform to state parameter
  if (platform) {
    params.append("state", platform);
  }

  const redirectUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  console.log("Redirecting to:", redirectUrl);

  return Response.redirect(redirectUrl, 302);
  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     Location: redirectUrl,
  //   },
  // });
}

// function generateUUID() {
//   const arr = new Uint8Array(16);
//   crypto.getRandomValues(arr);
//   arr[6] = (arr[6] & 0x0f) | 0x40; // Version 4
//   arr[8] = (arr[8] & 0x3f) | 0x80; // Variant 10
//   return [...arr]
//     .map((b, i) =>
//       [4, 6, 8, 10].includes(i)
//         ? `-${b.toString(16).padStart(2, "0")}`
//         : b.toString(16).padStart(2, "0")
//     )
//     .join("");
// }
