import * as jose from "jose";
import { COOKIE_NAME, JWT_SECRET } from "@/utils/constants";

export async function GET(request: Request) {
  try {
    // Get the cookie from the request
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse cookies and their attributes
    const cookies: Record<string, Record<string, string>> = {};

    cookieHeader.split(";").forEach((cookie) => {
      const trimmedCookie = cookie.trim();

      // Check if this is a cookie-value pair or an attribute
      if (trimmedCookie.includes("=")) {
        const [key, value] = trimmedCookie.split("=");
        const cookieName = key.trim();

        // Initialize the cookie entry if it doesn't exist
        if (!cookies[cookieName]) {
          cookies[cookieName] = { value: value };
        } else {
          cookies[cookieName].value = value;
        }
      } else if (trimmedCookie.toLowerCase() === "httponly") {
        // Handle HttpOnly attribute
        const lastCookieName = Object.keys(cookies).pop();
        if (lastCookieName) {
          cookies[lastCookieName].httpOnly = "true";
        }
      } else if (trimmedCookie.toLowerCase().startsWith("expires=")) {
        // Handle Expires attribute
        const lastCookieName = Object.keys(cookies).pop();
        if (lastCookieName) {
          cookies[lastCookieName].expires = trimmedCookie.substring(8);
        }
      } else if (trimmedCookie.toLowerCase().startsWith("max-age=")) {
        // Handle Max-Age attribute
        const lastCookieName = Object.keys(cookies).pop();
        if (lastCookieName) {
          cookies[lastCookieName].maxAge = trimmedCookie.substring(8);
        }
      }
    });

    // Get the auth token from cookies
    if (!cookies[COOKIE_NAME] || !cookies[COOKIE_NAME].value) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = cookies[COOKIE_NAME].value;

    try {
      // Verify the token
      const verified = await jose.jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );

      // Calculate cookie expiration time
      let cookieExpiration: number | null = null;

      // If we have Max-Age, use it to calculate expiration
      if (cookies[COOKIE_NAME].maxAge) {
        const maxAge = parseInt(cookies[COOKIE_NAME].maxAge, 10);
        // Calculate when the cookie will expire based on Max-Age
        // We don't know exactly when it was set, but we can estimate
        // using the token's iat (issued at) claim if available
        const issuedAt =
          (verified.payload.iat as number) || Math.floor(Date.now() / 1000);
        cookieExpiration = issuedAt + maxAge;
      }

      // Return the user data from the token payload along with expiration info
      return Response.json({
        ...verified.payload,
        cookieExpiration,
      });
    } catch (error) {
      // Token is invalid or expired
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Session error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
