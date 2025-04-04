import { BASE_URL, APP_SCHEME } from "@/utils/constants";

export async function POST(request: Request) {
  // Parse form data from POST body since Apple uses form_post
  const formData = await request.formData();

  const code = formData.get("code")?.toString();
  const idToken = formData.get("id_token")?.toString();
  const combinedPlatformAndState = formData.get("state")?.toString();
  const userDataStr = formData.get("user")?.toString();

  if (!combinedPlatformAndState) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }

  // strip platform to return state as it was set on the client
  const platform = combinedPlatformAndState.split("|")[0];
  const state = combinedPlatformAndState.split("|")[1];

  // Parse user data if available
  let userData = null;
  if (userDataStr) {
    try {
      userData = JSON.parse(userDataStr);
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }

  const outgoingParams = new URLSearchParams({
    code: code || "",
    state,
  });

  return Response.redirect(
    (platform === "web" ? BASE_URL : APP_SCHEME) +
      "?" +
      outgoingParams.toString()
  );
}
