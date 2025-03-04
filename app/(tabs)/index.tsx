import { Image, StyleSheet, Button } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
// import { signIn, useSession, signOut } from "next-auth/react";

const SERVER_URL = "http://localhost:8081"; // Your backend
const AUTH_URL = `${SERVER_URL}/api/auth/login`;

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  // const { data: session } = useSession();

  const handleSignIn = async () => {
    try {
      const result: WebBrowser.WebBrowserAuthSessionResult =
        await WebBrowser.openAuthSessionAsync(AUTH_URL);
      if (result.type === "success" && result.url) {
        // Parse return url to extract token
        const params = new URLSearchParams(new URL(result.url).search);
        const jwtToken = params.get("jwtToken");

        if (jwtToken) {
          // TODO: Save token to async storage
          console.log(jwtToken);
        } else {
          console.log("No token found");
        }
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
