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

const { width, height } = Dimensions.get("window");

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "space-between", paddingHorizontal: wp("5%"), paddingTop: hp("8%"), paddingBottom: hp("8%") },
  image: { width: width, height: hp("60%"), resizeMode: "contain", marginTop: hp("5%") },
  message: { fontSize: wp("4.5%"), fontWeight: "600", color: "#333", textAlign: "center", fontFamily: "Poppins", marginBottom: hp("8%") },
  button: { backgroundColor: "#5f5fff", paddingVertical: hp("2%"), paddingHorizontal: wp("8%"), borderRadius: wp("3%"), width: "100%", alignItems: "center", marginBottom: hp("4%") },
  buttonText: { color: "#fff", fontSize: wp("4.2%"), fontWeight: "600", fontFamily: "Poppins" },
});