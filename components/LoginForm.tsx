import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useAuth } from "@/context/auth";
import SignInWithGoogleButton from "./SignInWithGoogleButton";
import { Image, useColorScheme, View } from "react-native";
import { SignInWithAppleButton } from "./SignInWithAppleButton";

export default function LoginForm() {
  const { signIn, isLoading } = useAuth();
  const theme = useColorScheme();

  return (
    <ThemedView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View
        style={{
          width: "90%",
          maxWidth: 400,
          gap: 20,
          padding: 20,
          borderRadius: 12,
          boxShadow:
            theme === "dark"
              ? "0 0 10px 0 rgba(180, 180, 255, 0.15)"
              : "0 0 10px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Image
          source={
            theme === "dark"
              ? require("@/assets/images/icon-white.png")
              : require("@/assets/images/icon-dark.png")
          }
          style={{
            width: 100,
            height: 80,
            resizeMode: "contain",
            alignSelf: "center",
          }}
        />
        <ThemedText type="subtitle" style={{ textAlign: "center" }}>
          Sign in to QuickPush
        </ThemedText>
        <ThemedText
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "gray",
          }}
        >
          Welcome back! Please sign in to continue.
        </ThemedText>
        <View style={{ gap: 10 }}>
          <SignInWithGoogleButton onPress={signIn} disabled={isLoading} />
          <SignInWithAppleButton />
        </View>
      </View>
    </ThemedView>
  );
}
