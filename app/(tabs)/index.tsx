import {
  Image,
  StyleSheet,
  Platform,
  Linking,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthUser } from "@/utils/middleware";
import {
  AuthRequestConfig,
  DiscoveryDocument,
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  TokenResponse,
} from "expo-auth-session";

const AUTH_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`;

WebBrowser.maybeCompleteAuthSession();

const config: AuthRequestConfig = {
  clientId: "google",
  scopes: ["openid", "profile", "email"],
  redirectUri: makeRedirectUri(),
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/token`,
};

export default function HomeScreen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<string | null>(null);
  const [protectedData, setProtectedData] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [tokenResponse, setTokenResponse] = useState<string | null>(null);

  const [request, response, promptAsync] = useAuthRequest(config, discovery);

  useEffect(() => {
    handleResponse();
  }, [response]);

  async function handleResponse() {
    if (response?.type === "success") {
      const { code } = response.params;
      setCode(code);

      // exchange code for tokens
      const formData = new FormData();
      formData.append("code", code);
      const tokenResponse = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/token`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await tokenResponse.json();
      // use token to get user info
      setTokenResponse(data);
      const decoded = jwtDecode(data);
      setUser(decoded as AuthUser);
      console.log("TOKEN RESPONSE", decoded);
    }
  }

  const handleSetTokens = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    const decoded = jwtDecode(accessToken);
    setUser(decoded as AuthUser);
  };

  const handleGetPublicData = async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/public/data`
    );
    const data = await response.json();
    setPublicData(data);
  };

  const handleGetProtectedData = async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/protected/data`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    setProtectedData(data);
  };

  const handleRefreshToken = async () => {
    if (!refreshToken) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/refresh-token?refreshToken=${refreshToken}`
      );
      const data = await response.json();

      if (data.token) {
        handleSetTokens(data.token, refreshToken);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleSignOut = async () => {
    try {
      if (refreshToken) {
        // Call sign-out endpoint to invalidate refresh token
        await fetch(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/signout?refreshToken=${refreshToken}`,
          { method: "POST" }
        );
      }
    } catch (e) {
      console.log("Sign out error:", e);
    } finally {
      // Clear all auth-related state
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setProtectedData(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.welcomeText}>
            {user ? `Welcome back, ${user.name}! 👋` : "Welcome! 👋"}
          </ThemedText>
        </ThemedView>

        {user ? (
          <ThemedView style={styles.userCard}>
            {user.picture && (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            )}
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <ThemedText style={styles.buttonText}>Sign out</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <ThemedText style={styles.buttonText}>
              Sign in with Google
            </ThemedText>
          </TouchableOpacity>
        )}
        <ThemedView style={styles.dataDisplay}>
          <ThemedText style={styles.dataLabel}>Full user data:</ThemedText>
          <ThemedText style={styles.dataContent}>
            {JSON.stringify(user, null, 2)}
          </ThemedText>
        </ThemedView>

        <View style={styles.dataSection}>
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleGetPublicData}
          >
            <ThemedText style={styles.buttonText}>Get public data</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.dataDisplay}>
            <ThemedText style={styles.dataLabel}>Public data:</ThemedText>
            <ThemedText style={styles.dataContent}>
              {JSON.stringify(publicData)}
            </ThemedText>
          </ThemedView>

          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleGetProtectedData}
          >
            <ThemedText style={styles.buttonText}>
              Get protected data
            </ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.dataDisplay}>
            <ThemedText style={styles.dataLabel}>Protected data:</ThemedText>
            <ThemedText style={styles.dataContent}>
              {JSON.stringify(protectedData, null, 2)}
            </ThemedText>
          </ThemedView>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshToken}
          >
            <ThemedText style={styles.buttonText}>Refresh token</ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.tokenSection}>
            <ThemedText style={styles.tokenLabel}>Access token:</ThemedText>
            <ThemedText style={styles.tokenText} numberOfLines={1}>
              {accessToken}
            </ThemedText>
            <ThemedText style={styles.tokenLabel}>Refresh token:</ThemedText>
            <ThemedText style={styles.tokenText} numberOfLines={1}>
              {refreshToken}
            </ThemedText>
          </ThemedView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  userCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: "#4285F4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: "#DC3545",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  dataButton: {
    backgroundColor: "#34A853",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#FBBC05",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dataSection: {
    gap: 16,
  },
  dataDisplay: {
    maxWidth: "100%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dataContent: {
    fontSize: 14,
  },
  tokenSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    marginBottom: 12,
    opacity: 0.7,
  },
});
