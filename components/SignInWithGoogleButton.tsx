import { Pressable, View, Image } from "react-native";
import { ThemedText } from "./ThemedText";

export default function SignInWithGoogleButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          paddingVertical: 12,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Image
          source={require("../assets/images/google-icon.png")}
          style={{
            width: 20,
            height: 20,
            marginRight: 12,
          }}
        />
        <ThemedText type="defaultSemiBold" darkColor="#000">
          Continue with Google
        </ThemedText>
      </View>
    </Pressable>
  );
}
