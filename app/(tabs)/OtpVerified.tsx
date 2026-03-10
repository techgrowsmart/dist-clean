import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { getAuthData } from "../../utils/authStorage";
import { Platform } from 'react-native';

const { width, height } = Dimensions.get("window");

// Responsive breakpoints
const isWeb = Platform.OS === 'web';
const isLargeScreen = isWeb && width >= 768;
const isMobile = !isLargeScreen;

export default function OtpVerified() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Get user role from stored auth data
    const getUserRole = async () => {
      const authData = await getAuthData();
      if (authData) {
        setUserRole(authData.role);
      }
    };
    getUserRole();
  }, []);

  const handleGoToHome = () => {
    // Navigate to appropriate dashboard based on user role
    if (userRole === "teacher") {
      router.replace("/(tabs)/TeacherDashBoard/Teacher");
    } else {
      router.replace("/(tabs)/StudentDashBoard/Student");
    }
  };

  return (
    <View style={styles.container}>
      {isLargeScreen ? (
        // Web/Desktop Layout
        <View style={styles.webContainer}>
          <View style={styles.webHeader}>
            <View style={styles.placeholder} />
            <Text style={styles.webTitle}>Account Registered</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.webContent}>
            <Image
              source={require("../../assets/image/otpverified.png")}
              style={styles.webImage}
            />

            <Text style={styles.webMessage}>
              Your account has been registered successfully!
            </Text>

            <TouchableOpacity style={styles.webButton} onPress={handleGoToHome}>
              <Text style={styles.webButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Mobile Layout (existing)
        <>
          <Image
            source={require("../../assets/image/otpverified.png")}
            style={styles.image}
          />

          <Text style={styles.message}>
            Your account has been registered
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGoToHome}>
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "space-between", paddingHorizontal: wp("5%"), paddingTop: hp("8%"), paddingBottom: hp("8%") },
  webContainer: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "space-between", paddingHorizontal: wp("5%"), paddingTop: hp("8%"), paddingBottom: hp("8%") },
  webHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp("5%") },
  webTitle: { fontSize: wp("4.5%"), fontWeight: "600", color: "#333", textAlign: "center", fontFamily: "Poppins" },
  placeholder: { width: wp("10%") },
  webContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  webImage: { width: width, height: hp("60%"), resizeMode: "contain", marginTop: hp("5%") },
  webMessage: { fontSize: wp("4.5%"), fontWeight: "600", color: "#333", textAlign: "center", fontFamily: "Poppins", marginBottom: hp("8%") },
  webButton: { backgroundColor: "#5f5fff", paddingVertical: hp("2%"), paddingHorizontal: wp("8%"), borderRadius: wp("3%"), width: "100%", alignItems: "center", marginBottom: hp("4%") },
  webButtonText: { color: "#fff", fontSize: wp("4.2%"), fontWeight: "600", fontFamily: "Poppins" },
  image: { width: width, height: hp("60%"), resizeMode: "contain", marginTop: hp("5%") },
  message: { fontSize: wp("4.5%"), fontWeight: "600", color: "#333", textAlign: "center", fontFamily: "Poppins", marginBottom: hp("8%") },
  button: { backgroundColor: "#5f5fff", paddingVertical: hp("2%"), paddingHorizontal: wp("8%"), borderRadius: wp("3%"), width: "100%", alignItems: "center", marginBottom: hp("4%") },
  buttonText: { color: "#fff", fontSize: wp("4.2%"), fontWeight: "600", fontFamily: "Poppins" },
});