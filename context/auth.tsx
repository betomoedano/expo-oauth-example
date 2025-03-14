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

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  // Check if user is authenticated
  React.useEffect(() => {
    const getToken = async () => {
      const token = await tokenCache?.getToken("jwtToken");
      if (token) {
        setToken(token);

        // decode jwt token
        const decoded = jwtDecode(token);
        setUser(decoded as AuthUser);
      } else {
        console.log("User is not authenticated");
      }
    };
    getToken();
  }, []);

  async function handleResponse() {
    if (response?.type === "success") {
      try {
        setIsLoading(true);
        const { code } = response.params;

        // exchange code for jwt token
        const formData = new FormData();
        formData.append("code", code);

        const tokenResponse = await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/token`,
          {
            method: "POST",
            body: formData,
          }
        );
        const jwtToken = await tokenResponse.json();
        setToken(jwtToken);

        // save token to cache
        await tokenCache?.saveToken("jwtToken", jwtToken);

        // decode jwt token
        const decoded = jwtDecode(jwtToken);
        setUser(decoded as AuthUser);
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
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
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

  const signOut = () => {
    // TODO: Delete form local storage
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
