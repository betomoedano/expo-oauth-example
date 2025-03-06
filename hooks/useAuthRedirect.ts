import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useAuthRedirect() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "web") {
      // Check for JWT token in URL when the page loads
      const params = new URLSearchParams(window.location.search);
      const jwtToken = params.get("jwtToken");

      if (jwtToken) {
        // TODO: Save token to storage
        console.log("Web token:", jwtToken);
        setToken(jwtToken);
        // Clean up the URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    }
  }, []);
  return token;
}
