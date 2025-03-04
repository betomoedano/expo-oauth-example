import { Image, StyleSheet, Button } from "react-native";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { useEffect } from "react";
// import { signIn, useSession, signOut } from "next-auth/react";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri();
console.log("redirectUri", redirectUri);

export default function HomeScreen() {
  // const { data: session } = useSession();
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_CLIENT_ID,
    iosClientId:
      "601065264607-1mgo796t8oeehrov70rpbi83b93gp1jm.apps.googleusercontent.com",
    scopes: ["openid", "profile", "email"],
    // redirectUri: "http://localhost:8081/",
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      authenticateWithServer(response.authentication.idToken);
    }
  }, [response]);

  const authenticateWithServer = async (idToken: string) => {
    try {
      const res = await fetch(
        "http://localhost:8081/api/auth/callback/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        }
      );
      const data = await res.json();
      console.log("Auth response:", data);
    } catch (error) {
      console.error("Auth error:", error);
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
      <Button
        title="Sign in with Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />
      <ThemedView style={styles.titleContainer}>
        {/* {session ? (
          <ThemedText>Email: {session.user?.email}</ThemedText>
        ) : (
          <Button title="Sign in" onPress={() => signIn("google")} />
        )}
        {session && <Button title="Sign out" onPress={() => signOut()} />} */}
      </ThemedView>
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
