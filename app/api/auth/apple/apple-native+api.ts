import { verifyAndCreateTokens } from "@/utils/apple-auth";

/**
 * To verify the identity token, your app server must:
 * Verify the JWS E256 signature using the server's public key
 * Verify the nonce for the authentication
 * Verify that the iss field contains https://appleid.apple.com
 * Verify that the aud field is the developer's client_id
 * Verify that the time is earlier than the exp value of the token
 */
export async function POST(req: Request) {
  const { identityToken, rawNonce, givenName, familyName, email } =
    await req.json();

  try {
    const { accessToken, refreshToken } = await verifyAndCreateTokens({
      identityToken,
      rawNonce,
      givenName,
      familyName,
      email,
    });

    return Response.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }
}
