import {
  BASE_URL,
  APP_SCHEME,
  APPLE_AUTH_URL,
  APPLE_CLIENT_ID,
  APPLE_REDIRECT_URI,
} from "@/utils/constants";

export async function GET(request: Request) {
  if (!APPLE_CLIENT_ID) {
    return Response.json(
      { error: "Missing APPLE_CLIENT_ID environment variable" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);

  const redirectUri = url.searchParams.get("redirect_uri");

  let platform;

  if (redirectUri === APP_SCHEME) {
    platform = "mobile";
  } else if (redirectUri === BASE_URL) {
    platform = "web";
  } else {
    return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  // use state to drive redirect back to platform
  let state = platform + "|" + url.searchParams.get("state");

  // additional enforcement
  if (!state) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }
  const scope = url.searchParams.get("scope") || "name email";
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    redirect_uri: APPLE_REDIRECT_URI,
    response_type: "code",
    scope: scope,
    state: state,
    response_mode: "form_post",
  });

  return Response.redirect(APPLE_AUTH_URL + "?" + params.toString());
}
