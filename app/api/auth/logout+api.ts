import {
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "@/utils/constants";

export async function POST(request: Request) {
  try {
    // Create a response
    const response = Response.json({ success: true });

    // Clear the access token cookie
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=; Max-Age=0; Path=${COOKIE_OPTIONS.path}; ${
        COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""
      } ${COOKIE_OPTIONS.secure ? "Secure;" : ""} SameSite=${
        COOKIE_OPTIONS.sameSite
      }`
    );

    // Clear the refresh token cookie
    response.headers.append(
      "Set-Cookie",
      `${REFRESH_COOKIE_NAME}=; Max-Age=0; Path=${
        REFRESH_COOKIE_OPTIONS.path
      }; ${REFRESH_COOKIE_OPTIONS.httpOnly ? "HttpOnly;" : ""} ${
        REFRESH_COOKIE_OPTIONS.secure ? "Secure;" : ""
      } SameSite=${REFRESH_COOKIE_OPTIONS.sameSite}`
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
