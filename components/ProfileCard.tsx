import { ThemedText } from "./ThemedText";
import { useAuth } from "@/context/auth";
import { Button, Image, useColorScheme, View } from "react-native";
import { useEffect, useState } from "react";

export default function ProfileCard() {
  const { signOut, user } = useAuth();
  const theme = useColorScheme();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (user?.exp) {
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
        }
      }, 1000);

      // Cleanup on unmount
      return () => clearInterval(timer);
    }
  }, [user?.exp]);

  return (
    <View
      style={{
        width: "90%",
        maxWidth: 400,
        alignSelf: "center",
        gap: 20,
        padding: 20,
        borderRadius: 12,
        boxShadow:
          theme === "dark"
            ? "0 0 10px 0 rgba(180, 180, 255, 0.15)"
            : "0 0 10px 0 rgba(0, 0, 0, 0.1)",
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
          Token expires in:
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
          {timeRemaining !== null ? timeRemaining : "..."}
        </ThemedText>
      </View>

      <Button title="Sign Out" onPress={signOut} color={"red"} />
    </View>
  );
}
