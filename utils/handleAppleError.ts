/**
 * Handles Apple authentication errors
 * @param error - The error to handle
 * Learn more https://docs.expo.dev/versions/latest/sdk/apple-authentication/#error-codes
 */
export const handleAppleAuthError = (error: unknown) => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    console.error("Unexpected error during Apple authentication:", error);
    return;
  }

  const e = error as { code: string };

  switch (e.code) {
    case "ERR_REQUEST_CANCELED":
      console.log("Sign in canceled by user");
      break;
    case "ERR_INVALID_OPERATION":
      console.error("Invalid authorization operation");
      break;
    case "ERR_INVALID_RESPONSE":
      console.error("Invalid authorization response");
      break;
    case "ERR_INVALID_SCOPE":
      console.error("Invalid authentication scope provided");
      break;
    case "ERR_REQUEST_FAILED":
      console.error("Authorization request failed:", e);
      break;
    case "ERR_REQUEST_NOT_HANDLED":
      console.error("Authorization request not handled");
      break;
    case "ERR_REQUEST_NOT_INTERACTIVE":
      console.error("Authorization request not interactive");
      break;
    case "ERR_REQUEST_UNKNOWN":
      console.error("Unknown authorization error");
      break;
    default:
      console.error("Unexpected error during Apple authentication:", e);
  }
};
