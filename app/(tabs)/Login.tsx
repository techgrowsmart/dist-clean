import {
    useFonts,
    Mulish_400Regular,
    Mulish_500Medium,
    Mulish_700Bold,
} from "@expo-google-fonts/mulish";
import { OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
    Dimensions,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    View
} from "react-native";
import { 
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { BASE_URL } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storeAuthData } from "../../utils/authStorage";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOtp = async () => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as {
        isRegistered?: boolean;
        message: string;
        status?: string;
        otpId?: string;
        role?: string;
        token?: string;
        name?: string;
        isTestUser?: boolean;
      };

      if (!response.ok) {
        if (data.isRegistered === false) {
          setEmailError("Account not found. Please sign up first.");
          Toast.show({ type: "error", text1: data.message, text2: "Redirecting to Sign Up..." });
          setTimeout(() => router.push("/SignUp"), 2000);
          return;
        }
        if (response.status === 404) {
          setEmailError("Account not found. Please check your email or sign up.");
          return;
        }
        setEmailError(data.message || "Login failed. Please try again.");
        return;
      }

      // Handle test users - direct login without OTP
      if (data.isTestUser) {
        console.log(" Test user login detected - bypassing OTP");
        await storeAuthData({
          role: data.role!,
          email: email,
          token: data.token!,
          name: data.name!
        });
        
        Toast.show({
          type: "success",
          text1: "Login Successful (Test User)"
        });
        
        if (data.role === "teacher") {
          router.replace("/(tabs)/TeacherDashBoard/Teacher");
        } else {
          router.replace("/(tabs)/StudentDashBoard/Student");
        }
        return;
      }

      if (data.status !== "active") {
        Toast.show({ type: "info", text1: data.message });
        router.push({
          pathname: `/(tabs)/LoginOtp`,
          params: {
            email: email,
            otpId: data.otpId,
            role: data.role,
          },
        });
      } else {
        // User is active, store auth data and redirect
        await storeAuthData({
          role: data.role!,
          email: email,
          token: data.token!,
          name: data.name!
        });
        
        Toast.show({
          type: "success",
          text1: "Login Successful"
        });
        
        if (data.role === "teacher") {
          router.replace("/(tabs)/TeacherDashBoard/Teacher");
        } else {
          router.replace("/(tabs)/StudentDashBoard/Student");
        }
      }
    } catch (error) {
      setEmailError("Network error. Please check your connection and try again.");
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text2: "Please try again later.",
      });
    }
  };

  let [fontsLoaded] = useFonts({
    Mulish_Regular: Mulish_400Regular,
    Mulish_Medium: Mulish_500Medium,
    Mulish_Bold: Mulish_700Bold,
    OpenSans_Regular: OpenSans_400Regular,
    OpenSans_SemiBold: OpenSans_600SemiBold,
  });

  if (!fontsLoaded) return <Text>Loading...</Text>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable onPress={Keyboard.dismiss} style={styles.innerContainer}>
          <Image source={require("../../assets/image/Login-screen.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.head}>Log in</Text>
          
          <Text style={styles.inputLabel}>Login with Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="abcd@xyz.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (text.trim()) setEmailError("");
            }}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={sendOtp} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Loading..." : "Login"}</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New around here?</Text>
            <TouchableOpacity onPress={() => router.push("/SignUp")}>
              <Text style={styles.signupLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  innerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: wp("6%") },
  head: {color: '#0f0f0f', fontSize: wp("6.8%"), fontFamily: "Mulish_Bold",top: -hp("2%") },
  logo: { width: wp("200%"), height: hp("35%"), marginBottom: hp("0.1%") },
  inputLabel: { alignSelf: "flex-start", color: "#606060", fontSize: wp("2.8%"), fontFamily: "Mulish_Regular", marginBottom: hp("1%"), paddingLeft: hp("2%") },
  input: { width: "100%", height: hp("7%"), backgroundColor: "#fff", borderRadius: wp("2.5%"), paddingHorizontal: wp("4%"), color: "#03070E", marginBottom: hp("1%"), fontSize: wp("3.8%"), fontFamily: "Mulish_Regular", borderWidth: hp("0.16%"), borderColor: "#5d674e" },
  inputError: { borderColor: "red", borderWidth: 1 },
  errorText: { alignSelf: "flex-start", color: "red", fontSize: wp("3.2%"), marginBottom: hp("1%"), fontFamily: "Mulish_Regular" },  button: { width: "100%", height: hp("6.5%"), backgroundColor: "#5f5fff", borderRadius: wp("2.5%"), justifyContent: "center", alignItems: "center", marginTop: hp("2%") },
  buttonDisabled: { backgroundColor: "#a0a0ff" },
  buttonText: { color: "#fff", fontSize: wp("4%"), fontFamily: "Mulish_Medium" },
  signupContainer: { flexDirection: "row", alignItems: "center", marginTop: hp("10%") },
  signupText: { color: "#0f0f0f", fontSize: wp("3.8%"), fontFamily: "OpenSans_Regular" },
  signupLink: { color: "#4255ff", fontSize: wp("3.8%"), fontFamily: "OpenSans_Regular" },
});