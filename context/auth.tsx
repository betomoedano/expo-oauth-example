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
import { tokenCache } from "@/utils/cache";
import { Platform } from "react-native";
import { BASE_URL } from "@/utils/constants";
import * as jose from "jose";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = React.createContext({
  user: null as AuthUser | null,
  signIn: () => {},
  signOut: () => {},
  fetchWithAuth: (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

// Our OAuth flow uses a server-side approach for enhanced security:
// 1. Client initiates OAuth flow with Google through our server
// 2. Google redirects to our server's /api/auth/authorize endpoint
// 3. Our server handles the OAuth flow with Google using server-side credentials
// 4. Client receives an authorization code from our server
// 5. Client exchanges the code for tokens through our server
// 6. Server uses its credentials to get tokens from Google and returns them to the client
const discovery: DiscoveryDocument = {
  // URL where users are redirected to log in and grant authorization.
  // Our server handles the OAuth flow with Google and returns the authorization code
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  // URL where our server exchanges the authorization code for tokens
  // Our server uses its own credentials (client ID and secret) to securely exchange
  // the code with Google and return tokens to the client
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const isWeb = Platform.OS === "web";
  const refreshInProgressRef = React.useRef(false);

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
          const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
            method: "GET",
            credentials: "include", // Important: This includes cookies in the request
          });

          if (sessionResponse.ok) {
            const userData = await sessionResponse.json();
            setUser(userData as AuthUser);
          } else {
            console.log("No active web session found");

            // Try to refresh the token using the refresh cookie
            try {
              await refreshAccessToken();
            } catch (e) {
              console.log("Failed to refresh token on startup");
            }
          }
        } else {
          // For native: Try to use the stored access token first
          const storedAccessToken = await tokenCache?.getToken("accessToken");
          const storedRefreshToken = await tokenCache?.getToken("refreshToken");

          console.log(
            "Restoring session - Access token:",
            storedAccessToken ? "exists" : "missing"
          );
          console.log(
            "Restoring session - Refresh token:",
            storedRefreshToken ? "exists" : "missing"
          );

          if (storedAccessToken) {
            try {
              // Check if the access token is still valid
              const decoded = jose.decodeJwt(storedAccessToken);
              const exp = (decoded as any).exp;
              const now = Math.floor(Date.now() / 1000);

              if (exp && exp > now) {
                // Access token is still valid
                console.log("Access token is still valid, using it");
                setAccessToken(storedAccessToken);
                setUser(decoded as AuthUser);
              } else if (storedRefreshToken) {
                // Access token expired, but we have a refresh token
                console.log("Access token expired, using refresh token");
                setRefreshToken(storedRefreshToken);
                await refreshAccessToken(storedRefreshToken);
              }
            } catch (e) {
              console.error("Error decoding stored token:", e);

              // Try to refresh using the refresh token
              if (storedRefreshToken) {
                console.log("Error with access token, trying refresh token");
                setRefreshToken(storedRefreshToken);
                await refreshAccessToken(storedRefreshToken);
              }
            }
          } else if (storedRefreshToken) {
            // No access token, but we have a refresh token
            console.log("No access token, using refresh token");
            setRefreshToken(storedRefreshToken);
            await refreshAccessToken(storedRefreshToken);
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

  // Function to refresh the access token
  const refreshAccessToken = async (tokenToUse?: string) => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshInProgressRef.current) {
      console.log("Token refresh already in progress, skipping");
      return null;
    }

    refreshInProgressRef.current = true;

    try {
      console.log("Refreshing access token...");

      // Use the provided token or fall back to the state
      const currentRefreshToken = tokenToUse || refreshToken;

      console.log(
        "Current refresh token:",
        currentRefreshToken ? "exists" : "missing"
      );

      if (isWeb) {
        // For web: Use JSON for the request
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ platform: "web" }),
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json();
          console.error("Token refresh failed:", errorData);

          // If refresh fails due to expired token, sign out
          if (refreshResponse.status === 401) {
            signOut();
          }
          return null;
        }

        // Fetch the session to get updated user data
        const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`, {
          method: "GET",
          credentials: "include",
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setUser(sessionData as AuthUser);
        }

        return null; // Web doesn't use access token directly
      } else {
        // For native: Use the refresh token
        if (!currentRefreshToken) {
          console.error("No refresh token available");
          signOut();
          return null;
        }

        console.log("Using refresh token to get new tokens");
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform: "native",
            refreshToken: currentRefreshToken,
          }),
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json();
          console.error("Token refresh failed:", errorData);

          // If refresh fails due to expired token, sign out
          if (refreshResponse.status === 401) {
            signOut();
          }
          return null;
        }

        // For native: Update both tokens
        const tokens = await refreshResponse.json();
        const newAccessToken = tokens.accessToken;
        const newRefreshToken = tokens.refreshToken;

        console.log(
          "Received new access token:",
          newAccessToken ? "exists" : "missing"
        );
        console.log(
          "Received new refresh token:",
          newRefreshToken ? "exists" : "missing"
        );

        if (newAccessToken) setAccessToken(newAccessToken);
        if (newRefreshToken) setRefreshToken(newRefreshToken);

        // Save both tokens to cache
        if (newAccessToken)
          await tokenCache?.saveToken("accessToken", newAccessToken);
        if (newRefreshToken)
          await tokenCache?.saveToken("refreshToken", newRefreshToken);

        // Update user data from the new access token
        if (newAccessToken) {
          const decoded = jose.decodeJwt(newAccessToken);
          console.log("Decoded user data:", decoded);
          // Check if we have all required user fields
          const hasRequiredFields =
            decoded &&
            (decoded as any).name &&
            (decoded as any).email &&
            (decoded as any).picture;

          if (!hasRequiredFields) {
            console.warn(
              "Refreshed token is missing some user fields:",
              decoded
            );
          }

          setUser(decoded as AuthUser);
        }

        return newAccessToken; // Return the new access token
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      // If there's an error refreshing, we should sign out
      signOut();
      return null;
    } finally {
      refreshInProgressRef.current = false;
    }
  };

  async function handleResponse() {
    // This function is called when Google redirects back to our app
    // The response contains the authorization code that we'll exchange for tokens
    if (response?.type === "success") {
      try {
        setIsLoading(true);
        // Extract the authorization code from the response
        // This code is what we'll exchange for access and refresh tokens
        const { code } = response.params;

        // Create form data to send to our token endpoint
        // We include both the code and platform information
        // The platform info helps our server handle web vs native differently
        const formData = new FormData();
        formData.append("code", code);

        // Add platform information for the backend to handle appropriately
        if (isWeb) {
          formData.append("platform", "web");
        }

        console.log("request", request);

        // Get the code verifier from the request object
        // This is the same verifier that was used to generate the code challenge
        if (request?.codeVerifier) {
          formData.append("code_verifier", request.codeVerifier);
        } else {
          console.warn("No code verifier found in request object");
        }

        // Send the authorization code to our token endpoint
        // The server will exchange this code with Google for access and refresh tokens
        // For web: credentials are included to handle cookies
        // For native: we'll receive the tokens directly in the response
        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: "POST",
          body: formData,
          credentials: isWeb ? "include" : "same-origin", // Include cookies for web
        });

        if (isWeb) {
          // For web: The server sets the tokens in HTTP-only cookies
          // We just need to get the user data from the response
          const userData = await tokenResponse.json();
          if (userData.success) {
            // Fetch the session to get user data
            // This ensures we have the most up-to-date user information
            const sessionResponse = await fetch(
              `${BASE_URL}/api/auth/session`,
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
          // For native: The server returns both tokens in the response
          // We need to store these tokens securely and decode the user data
          const tokens = await tokenResponse.json();
          const newAccessToken = tokens.accessToken;
          const newRefreshToken = tokens.refreshToken;

          console.log(
            "Received initial access token:",
            newAccessToken ? "exists" : "missing"
          );
          console.log(
            "Received initial refresh token:",
            newRefreshToken ? "exists" : "missing"
          );

          // Store tokens in state
          if (newAccessToken) setAccessToken(newAccessToken);
          if (newRefreshToken) setRefreshToken(newRefreshToken);

          // Save tokens to secure storage for persistence
          if (newAccessToken)
            await tokenCache?.saveToken("accessToken", newAccessToken);
          if (newRefreshToken)
            await tokenCache?.saveToken("refreshToken", newRefreshToken);

          // Decode the JWT access token to get user information
          if (newAccessToken) {
            const decoded = jose.decodeJwt(newAccessToken);
            setUser(decoded as AuthUser);
          }
        }
      } catch (e) {
        console.error("Error handling auth response:", e);
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
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });

      // If the response indicates an authentication error, try to refresh the token
      if (response.status === 401) {
        console.log("API request failed with 401, attempting to refresh token");

        // Try to refresh the token
        await refreshAccessToken();

        // If we still have a user after refresh, retry the request
        if (user) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        }
      }

      return response;
    } else {
      // For native: Use token in Authorization header
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If the response indicates an authentication error, try to refresh the token
      if (response.status === 401) {
        console.log("API request failed with 401, attempting to refresh token");

        // Try to refresh the token and get the new token directly
        const newToken = await refreshAccessToken();

        // If we got a new token, retry the request with it
        if (newToken) {
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        }
      }

      return response;
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
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error during web logout:", error);
      }
    } else {
      // For native: Clear both tokens from cache
      await tokenCache?.deleteToken("accessToken");
      await tokenCache?.deleteToken("refreshToken");
    }

    // Clear state
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isLoading,
        error,
        fetchWithAuth,
      }}
    >
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
