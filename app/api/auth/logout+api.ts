import { COOKIE_NAME, COOKIE_OPTIONS } from "@/utils/constants";

export async function POST(request: Request) {
  try {
    // Create a response
    const response = Response.json({ success: true });

    // Set an expired cookie to clear it
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=; Max-Age=0; Path=${COOKIE_OPTIONS.path}; ${
        COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""
      } ${COOKIE_OPTIONS.secure ? "Secure;" : ""} SameSite=${
        COOKIE_OPTIONS.sameSite
      }`
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
