import {
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/context/auth";
import SignInWithGoogleButton from "@/components/SignInWithGoogleButton";
import LoginForm from "@/components/LoginForm";
export default function HomeScreen() {
  const { user, signIn, signOut, isLoading } = useAuth();

  if (!user && !isLoading) {
    return <LoginForm />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {user ? (
          <ThemedView style={styles.userCard}>
            {user.picture && (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            )}
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
              <ThemedText style={styles.buttonText}>Sign out</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <SignInWithGoogleButton onPress={signIn} disabled={isLoading} />
        )}
        <ThemedView style={styles.dataDisplay}>
          <ThemedText style={styles.dataLabel}>Full user data:</ThemedText>
          <ThemedText style={styles.dataContent}>
            {JSON.stringify(user, null, 2)}
          </ThemedText>
        </ThemedView>
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
});
