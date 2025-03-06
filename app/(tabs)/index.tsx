import {
  Image,
  StyleSheet,
  Button,
  Platform,
  Linking,
  SafeAreaView,
  ScrollView,
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            {user ? `Welcome, ${user.name}!` : "Welcome!"}
          </ThemedText>
          <HelloWave />
        </ThemedView>

        {user ? (
          <ThemedView style={styles.userInfo}>
            {user.picture && (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            )}
            <ThemedText>Email: {user.email}</ThemedText>
            <Button
              title="Sign out"
              onPress={() => {
                setAccessToken(null);
                setRefreshToken(null);
                setUser(null);
              }}
            />
          </ThemedView>
        ) : (
          <Button title="Sign in" onPress={handleSignIn} />
        )}

        <Button title="Get public data" onPress={handleGetPublicData} />
        <ThemedText>Public data: {JSON.stringify(publicData)}</ThemedText>
        <Button title="Get protected data" onPress={handleGetProtectedData} />
        <ThemedText>
          Protected data: {JSON.stringify(protectedData, null, 2)}
        </ThemedText>
        <Button title="Refresh token" onPress={handleRefreshToken} />
        <ThemedText>Access token: {accessToken}</ThemedText>
        <ThemedText>Refresh token: {refreshToken}</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  userInfo: {
    padding: 16,
    gap: 8,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
});
