// Cookie name used for authentication
const COOKIE_NAME = "auth_token";

export async function POST(request: Request) {
  try {
    // Create a response
    const response = Response.json({ success: true });

    // Set an expired cookie to clear it
    response.headers.set(
      "Set-Cookie",
      `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
