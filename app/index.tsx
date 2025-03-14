import { ActivityIndicator } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/auth";
import LoginForm from "@/components/LoginForm";
import ProfileCard from "@/components/ProfileCard";
import ProtectedRequestCard from "@/components/ProtectedRequestCard";
export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <ProfileCard />
      <ProtectedRequestCard />
    </ThemedView>
  );
}
