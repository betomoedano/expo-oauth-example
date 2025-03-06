import {
  Image,
  StyleSheet,
  Button,
  Platform,
  Linking,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";
import { jwtDecode } from "jwt-decode";

const AUTH_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`;

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<string | null>(null);
  const [protectedData, setProtectedData] = useState<string | null>(null);
  const [user, setUser] = useState<{
    email: string;
    name: string;
    picture?: string;
  } | null>(null);

  const handleSetTokens = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    const decoded = jwtDecode(accessToken);
    setUser(decoded as { email: string; name: string; picture?: string });
  };

  const handleSignIn = async () => {
    try {
      const platformParam = Platform.OS === "web" ? "web" : "native";
      const authUrlWithPlatform = `${AUTH_URL}?platform=${platformParam}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrlWithPlatform);

      if (Platform.OS === "android") {
        const url = await new Promise<string>((resolve) => {
          const subscription = Linking.addEventListener("url", (event) => {
            subscription.remove();
            resolve(event.url);
          });
        });

        const params = new URLSearchParams(new URL(url).search);
        const jwtToken = params.get("jwtToken");
        const refreshToken = params.get("refreshToken");

        if (jwtToken && refreshToken) {
          handleSetTokens(jwtToken, refreshToken);
        }
      } else if (result.type === "success" && result.url) {
        const params = new URLSearchParams(new URL(result.url).search);
        const jwtToken = params.get("jwtToken");
        const refreshToken = params.get("refreshToken");

        if (jwtToken && refreshToken) {
          handleSetTokens(jwtToken, refreshToken);
        }
      }
    } catch (e) {
      console.log(e);
    }
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
              onPress={() => {
                setAccessToken(null);
                setRefreshToken(null);
                setUser(null);
              }}
            >
              <ThemedText style={styles.buttonText}>Sign out</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <ThemedText style={styles.buttonText}>
              Sign in with Google
            </ThemedText>
          </TouchableOpacity>
        )}

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
