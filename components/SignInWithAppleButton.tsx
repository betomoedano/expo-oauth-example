import { Button } from "react-native";
import { useAuth } from "@/context/auth";

export function SignInWithAppleButton() {
  const { signInWithAppleWebBrowser } = useAuth();

  return (
    <Button title=" Sign in with Apple" onPress={signInWithAppleWebBrowser} />
  );
}
