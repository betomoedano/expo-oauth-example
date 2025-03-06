import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const refreshToken = searchParams.get("refreshToken");

  if (!refreshToken) {
    return Response.json({ success: true });
  }

  try {
    // Verify the token is valid before blacklisting
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

    // TODO: In a production app, you would want to:
    // 1. Add the refresh token to a blacklist in your database
    // 2. Set an expiry on the blacklist entry matching the token's expiry

    return Response.json({ success: true });
  } catch (error) {
    // Token is already invalid, that's fine
    return Response.json({ success: true });
  }
}
