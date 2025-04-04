import { useEffect } from "react";
import { APPLE_CLIENT_ID, APPLE_REDIRECT_URI } from "@/utils/constants";
import { useAuth } from "@/context/auth";

interface AppleAuthSuccessEvent extends Event {
  detail: {
    authorization: {
      code: string;
      id_token: string;
    };
  };
}

export const useAppleAuthInit = () => {
  const { signInWithAppleWeb } = useAuth();

  useEffect(() => {
    const handleSuccess = async (event: Event) => {
      const appleEvent = event as AppleAuthSuccessEvent;
      const { authorization } = appleEvent.detail;
      console.log("Apple Sign In Success:", {
        code: authorization.code,
        idToken: authorization.id_token,
      });

      try {
        console.log(
          "signInWithAppleWeb",
          authorization.code,
          authorization.id_token
        );
        await signInWithAppleWeb(authorization.code, authorization.id_token);
        console.log("signInWithAppleWeb success");
      } catch (error) {
        console.error("Error handling Apple sign in:", error);
      }
    };

    const handleError = (event: any) => {
      const error = event.detail.error;
      console.error("Apple Sign In Error:", error);
    };

    const initAppleAuth = () => {
      if (window.AppleID && window.AppleID.auth) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: "name email",
          redirectURI: APPLE_REDIRECT_URI,
          usePopup: true,
        });

        // Add event listeners for popup auth flow
        document.addEventListener("AppleIDSignInOnSuccess", handleSuccess);
        document.addEventListener("AppleIDSignInOnFailure", handleError);
      }
    };

    // Check if the script is already loaded
    if (
      !document.querySelector(
        'script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src =
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      script.async = true;
      script.onload = initAppleAuth;
      document.body.appendChild(script);
    } else {
      initAppleAuth();
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener("AppleIDSignInOnSuccess", handleSuccess);
      document.removeEventListener("AppleIDSignInOnFailure", handleError);
    };
  }, [signInWithAppleWeb]);
};
