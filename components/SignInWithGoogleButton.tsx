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
          height: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 5,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Image
          source={require("../assets/images/google-icon.png")}
          style={{
            width: 18,
            height: 18,
            marginRight: 6,
          }}
        />
        <ThemedText type="defaultSemiBold" darkColor="#000">
          Continue with Google
        </ThemedText>
      </View>
    </Pressable>
  );
}
