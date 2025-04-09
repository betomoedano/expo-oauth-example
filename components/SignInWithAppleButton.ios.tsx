import * as AppleAuthentication from "expo-apple-authentication";
import { View, StyleSheet, useColorScheme } from "react-native";
import { useAuth } from "@/context/auth";

export function SignInWithAppleButton() {
  const { signInWithApple } = useAuth();
  const theme = useColorScheme();

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        theme === "dark"
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={5}
      style={styles.button}
      onPress={signInWithApple}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 44,
  },
});
