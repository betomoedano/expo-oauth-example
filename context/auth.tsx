import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { AuthUser } from "@/utils/middleware";
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from "expo-auth-session";
import { jwtDecode } from "jwt-decode";
import { tokenCache } from "@/utils/cache";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = React.createContext({
  user: null as AuthUser | null,
  signIn: () => {},
  signOut: () => {},
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const isWeb = Platform.OS === "web";

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  // Check if user is authenticated
  React.useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        if (isWeb) {
          // For web: Check if we have a session cookie by making a request to a session endpoint
          const sessionResponse = await fetch(
            `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/session`,
            {
              method: "GET",
              credentials: "include", // Important: This includes cookies in the request
            }
          );

          if (sessionResponse.ok) {
            const userData = await sessionResponse.json();
            setUser(userData as AuthUser);
          } else {
            console.log("No active web session found");
          }
        } else {
          // For native: Use the stored token from cache
          const token = await tokenCache?.getToken("jwtToken");
          if (token) {
            setToken(token);
            // decode jwt token
            const decoded = jwtDecode(token);
            setUser(decoded as AuthUser);
          } else {
            console.log("User is not authenticated");
          }
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [isWeb]);

  async function handleResponse() {
    if (response?.type === "success") {
      try {
        setIsLoading(true);
        const { code } = response.params;

        // exchange code for jwt token
        const formData = new FormData();
        formData.append("code", code);

        // Add platform information for the backend to handle appropriately
        if (isWeb) {
          formData.append("platform", "web");
        }

        const tokenResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/token`,
          {
            method: "POST",
            body: formData,
            credentials: isWeb ? "include" : "same-origin", // Include cookies for web
          }
        );

        if (isWeb) {
          // For web: The token is set in a cookie by the server
          // We just need to get the user data from the response
          const userData = await tokenResponse.json();
          if (userData.success) {
            // Fetch the session to get user data
            const sessionResponse = await fetch(
              `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/session`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setUser(sessionData as AuthUser);
            }
          }
        } else {
          // For native: Handle token as before
          const jwtToken = await tokenResponse.json();
          setToken(jwtToken);

          // save token to cache
          await tokenCache?.saveToken("jwtToken", jwtToken);

          // decode jwt token
          const decoded = jwtDecode(jwtToken);
          setUser(decoded as AuthUser);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === "cancel") {
      alert("Sign in cancelled");
    } else if (response?.type === "error") {
      setError(response?.error as AuthError);
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    if (isWeb) {
      // For web: Include credentials to send cookies
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    } else {
      // For native: Use token in Authorization header
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }
  };

  const signIn = async () => {
    console.log("signIn");
    try {
      if (!request) {
        console.log("No request");
        return;
      }

      await promptAsync();
    } catch (e) {
      console.log(e);
    }
  };

  const signOut = async () => {
    if (isWeb) {
      // For web: Call logout endpoint to clear the cookie
      try {
        await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error during web logout:", error);
      }
    } else {
      // For native: Clear the token from cache
      await tokenCache?.deleteToken("jwtToken");
    }

    // Clear state
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
