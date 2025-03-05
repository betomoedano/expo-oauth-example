import { Image, StyleSheet, Button, Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";

// import { signIn, useSession, signOut } from "next-auth/react";

const AUTH_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`;

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  // const { data: session } = useSession();

  const handleSignIn = async () => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(AUTH_URL);

      if (Platform.OS === "android") {
        // For Android, we need to listen to the URL event
        const url = await new Promise<string>((resolve) => {
          const subscription = Linking.addEventListener("url", (event) => {
            subscription.remove();
            resolve(event.url);
          });
        });

        // Parse the deep link URL
        const params = new URLSearchParams(new URL(url).search);
        const jwtToken = params.get("jwtToken");

        if (jwtToken) {
          setToken(jwtToken);
        }
      } else if (result.type === "success" && result.url) {
        // iOS flow remains the same
        const params = new URLSearchParams(new URL(result.url).search);
        const jwtToken = params.get("jwtToken");

        setToken(jwtToken);
      }
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedText>Token: {token}</ThemedText>
      <Button title="Sign in" onPress={handleSignIn} />
      {/* <ThemedView style={styles.titleContainer}>
        {session ? (
          <ThemedText>Email: {session.user?.email}</ThemedText>
        ) : (
          <Button title="Sign in" onPress={() => signIn("google")} />
        )}
        {session && <Button title="Sign out" onPress={() => signOut()} />}
      </ThemedView> */}
    </ParallaxScrollView>
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
});
