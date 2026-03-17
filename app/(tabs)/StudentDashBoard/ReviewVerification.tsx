import {
  RedHatDisplay_400Regular,
  RedHatDisplay_500Medium,
  useFonts,
} from "@expo-google-fonts/red-hat-display";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const { width } = Dimensions.get("window");

const ChatCheckIcon = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
    <Rect x="4" y="6" width="44" height="36" rx="6" fill="white" />
    <Path d="M14 42L4 52V42" fill="white" />
    <Circle
      cx="46"
      cy="40"
      r="12"
      fill="white"
      stroke="#8DC63F"
      strokeWidth="2"
    />
    <Path
      d="M40 40l4 4 7-7"
      stroke="#8DC63F"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ReviewVerification = () => {
  const [fontsLoaded] = useFonts({
    RedHatDisplay_500Medium,
    RedHatDisplay_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <Modal transparent animationType="fade" visible={true}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrapper}>
            <ChatCheckIcon />
          </View>

          {/* Message */}
          <Text style={styles.messageText}>
            Thank you for your review!{"\n"}
            Your review is being currently verified.{"\n"}
            It will appear on a company profile{"\n"}
            within a few minutes.
          </Text>

          {/* Back Home Button */}
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.replace("/(tabs)/StudentDashBoard/Student")}
            activeOpacity={0.85}
          >
            <Text style={styles.backHomeText}>Back home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReviewVerification;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#8DC63F",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
    padding: 4,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  messageText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 28,
    fontFamily: "RedHatDisplay_400Regular",
  },
  backHomeBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backHomeText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "RedHatDisplay_500Medium",
  },
});
