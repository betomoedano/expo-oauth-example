import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
// import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`;
// const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code is missing" },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) {
      throw new Error("Failed to get ID token");
    }

    // Verify ID token
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: tokenData.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const user = {
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
    };

    // Here you can generate your own JWT
    const jwtToken = generateJWT(user); // Implement JWT logic

    // Check if the request is from web or native
    const userAgent = req.headers.get("user-agent") || "";
    const isWeb =
      userAgent.includes("Mozilla/") && !userAgent.includes("Mobile");

    if (isWeb) {
      // For web, redirect to the web app URL
      const webRedirectUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/?jwtToken=${jwtToken}`;
      return NextResponse.redirect(webRedirectUrl);
    } else {
      // For native apps, use the deep link scheme
      const appRedirectUrl = "com.beto.expoauthjsexample://";
      const redirectUrl = `${appRedirectUrl}?jwtToken=${jwtToken}`;
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

function generateJWT(user: any) {
  // Implement JWT logic
  // return jwt.sign(user, process.env.JWT_SECRET!);
  return JSON.stringify(user);
}
