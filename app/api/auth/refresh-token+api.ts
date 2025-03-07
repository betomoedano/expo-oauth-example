import jwt from "jsonwebtoken";
import { AuthUser } from "@/utils/middleware";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refreshToken = searchParams.get("refreshToken");

  if (!refreshToken) {
    return Response.json({ error: "Missing refresh token" }, { status: 400 });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as AuthUser;

    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        email_verified: decoded.email_verified,
        provider: decoded.provider,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "10s" }
    );

    return Response.json({ token: accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return Response.json({ error: "Refresh token expired" }, { status: 401 });
    }
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
