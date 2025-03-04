import { handlers } from "@/auth";
import { OAuth2Client } from "google-auth-library";

// Add logging wrappers around the original handlers
const wrappedGET = async (...args: Parameters<typeof handlers.GET>) => {
  console.log("[Auth] Handling GET request", { args });
  const result = await handlers.GET(...args);
  console.log("[Auth] GET request completed", { result });
  return result;
};

export const GET = wrappedGET;

export async function POST(req: Request) {
  try {
    console.log("[Auth] Handling POST request");
    const { idToken } = await req.json();

    const client = new OAuth2Client({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.AUTH_GOOGLE_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      console.log("[Auth] Invalid ID token");
      return new Response("Invalid ID Token", { status: 401 });
    }

    // Add flow name to help with debugging
    console.log(
      "[Auth] Valid token, user:",
      payload,
      "flowName=GeneralOauthFlow"
    );
    return new Response(
      JSON.stringify({
        user: payload,
        flowName: "GeneralOauthFlow",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Auth] Error processing POST request:", error);
    // Include more error details
    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        flowName: "GeneralOauthFlow",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
