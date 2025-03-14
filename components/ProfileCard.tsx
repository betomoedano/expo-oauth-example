import { ThemedText } from "./ThemedText";
import { useAuth } from "@/context/auth";
import { Button, Image, Platform, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

export default function ProfileCard() {
  const { signOut, user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    // For native platforms, use the token expiration from the JWT
    if (!isWeb && user?.exp) {
      // Calculate seconds remaining until expiration
      const calculateTimeRemaining = () => {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const expTime = user.exp || 0;
        const totalSeconds = Math.max(0, expTime - now);

        // Convert to hours, minutes, seconds format
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, "0")} hrs ${minutes
          .toString()
          .padStart(2, "0")} min ${seconds.toString().padStart(2, "0")} sec`;
      };

      // Set initial time
      setTimeRemaining(calculateTimeRemaining());

      // Update every second
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const expTime = user.exp || 0;
        const totalSeconds = Math.max(0, expTime - now);

        setTimeRemaining(calculateTimeRemaining());

        // Clear interval when time reaches 0
        if (totalSeconds <= 0) {
          clearInterval(timer);
          // Optionally trigger sign out when token expires
          // signOut();
        }
      }, 1000);

      // Cleanup on unmount
      return () => clearInterval(timer);
    }

    // For web platforms, use the cookie expiration time from the session API
    if (isWeb && user) {
      const calculateWebTimeRemaining = () => {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        // Use cookieExpiration from the session API if available, otherwise fall back to exp
        const expTime = (user as any).cookieExpiration || user.exp || 0;
        const totalSeconds = Math.max(0, expTime - now);

        // Convert to hours, minutes, seconds format
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, "0")} hrs ${minutes
          .toString()
          .padStart(2, "0")} min ${seconds.toString().padStart(2, "0")} sec`;
      };

      // Set initial time
      setTimeRemaining(calculateWebTimeRemaining());

      // Update every second
      const webTimer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const expTime = (user as any).cookieExpiration || user.exp || 0;
        const totalSeconds = Math.max(0, expTime - now);

        setTimeRemaining(calculateWebTimeRemaining());

        // Clear interval when time reaches 0
        if (totalSeconds <= 0) {
          clearInterval(webTimer);
          // Optionally trigger sign out when cookie expires
          // signOut();
        }
      }, 1000);

      // Cleanup on unmount
      return () => clearInterval(webTimer);
    }
  }, [user, isWeb]);

  return (
    <View
      style={{
        width: "90%",
        maxWidth: 400,
        gap: 20,
        padding: 20,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "gray",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Image
          source={{ uri: user?.picture }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
          }}
        />

        <View>
          <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
            {user?.name}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "gray" }}>
            {user?.email}
          </ThemedText>
        </View>
      </View>

      <View>
        <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
          {isWeb ? "Cookie" : "Token"} expires in:
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
          {timeRemaining !== null ? timeRemaining : "..."}
        </ThemedText>
      </View>

      <Button title="Sign Out" onPress={signOut} color={"red"} />
    </View>
  );
}
