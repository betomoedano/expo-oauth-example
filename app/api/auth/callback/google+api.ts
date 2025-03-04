import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.EXPO_PUBLIC_CLIENT_ID);

export async function POST(req: Request) {
  console.log("req", req);
  try {
    const { idToken } = await req.json();

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.EXPO_PUBLIC_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    // Here you would typically:
    // 1. Create or update a user in your database
    // 2. Create a session
    // 3. Return user data and/or session token

    return Response.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 401 });
  }
}
