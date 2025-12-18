import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { BASE_URL } from "../../config";
import { storeAuthData } from "../../utils/authStorage";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
  useFonts,
} from "@expo-google-fonts/work-sans";
import { Feather } from "@expo/vector-icons";

export default function LoginOtp() {
  const router = useRouter();
  const { email, otpId } = useLocalSearchParams<{ email: string; otpId: string }>();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(120);
  const [resendVisible, setResendVisible] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const isOtpComplete = otp.every(digit => digit !== "") && otp.join("").length === 4;

  let [fontsLoaded] = useFonts({
    WorkSans_Regular: WorkSans_400Regular,
    WorkSans_Medium: WorkSans_500Medium,
    WorkSans_SemiBold: WorkSans_600SemiBold,
    WorkSans_Bold: WorkSans_700Bold,
  });

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setResendVisible(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace properly
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === "" && index > 0) {
        // If current field is empty, move to previous field
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index] !== "") {
        // If current field has value, clear it
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 4 || otp.includes("")) {
      Alert.alert("Error", "Enter a valid 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode, otpId }),
      });

      const data = await response.json();

      if (response.ok) {
        await storeAuthData({
          role: data.role || "student",
          email: email as string,
          token: data.token,
        });

        if (data.role === "teacher") {
          router.replace("/(tabs)/TeacherDashBoard/Teacher");
        } else {
          router.replace("/(tabs)/StudentDashBoard/Student");
        }
      } else {
        Alert.alert("Error", data.message || "Invalid OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "OTP Resent!");
        setTimer(120);
        setResendVisible(false);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        if (data.otpId) {
          router.setParams({ otpId: data.otpId });
        }
      } else {
        Alert.alert("Error", data.message || "Resend failed!");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Try again later.");
    }
  };

  if (!fontsLoaded) return <ActivityIndicator size="large" color="#5f5fff" />;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? hp('5%') : hp('2%')}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={wp("8%")} color="#727070" />
          </TouchableOpacity>

          <Image source={require("../../assets/image/otp.png")} style={styles.image} />

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>
            {`4 digit code sent to your mobile. Please check and confirm the code to \n continue.`}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : styles.otpInputEmpty]}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  caretHidden={true}
                />
                {!digit && <Text style={styles.dashPlaceholder}>-</Text>}
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, (!isOtpComplete || loading) && styles.buttonDisabled]} 
            onPress={verifyOtp} 
            disabled={!isOtpComplete || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
          </TouchableOpacity>

          {resendVisible ? (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendText}>Didn't get OTP? <Text style={styles.resendLink}>Resend</Text></Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Didn't get OTP? Resend in <Text style={styles.timerHighlight}>{String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}</Text>
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  innerContainer: { flex: 1, alignItems: "center", paddingHorizontal: wp("1.3%"), paddingTop: hp("15%"), paddingBottom: hp("5%") },
  backButton: { position: "absolute", top: hp("10%"), left: wp("10%"), zIndex: 10 },
  image: { width: "120%", height: hp("25%"), resizeMode: "contain", marginBottom: hp("2%") },
  title: { fontSize: wp("6.4%"), fontFamily: "WorkSans_Bold", marginBottom: hp("1.5%"), lineHeight: hp("4%"), color: "#0c0c0c", textAlign: "center" },
  subtitle: { fontSize: wp("2.6%"), fontFamily: "WorkSans_Regular", textAlign: "center", color: "#656565", marginBottom: hp("3%"), lineHeight: hp("2.5%") },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", width: "80%", marginBottom: hp("3%") },
  otpInputWrapper: { position: "relative", width: wp("12.5%"), height: wp("14.5%") },
  otpInput: { width: "100%", height: "100%", fontSize: wp("9%"), fontFamily: "WorkSans_SemiBold", textAlign: "center", backgroundColor: "transparent", zIndex: 2 },
  otpInputEmpty: { color: "transparent" },
  otpInputFilled: { color: "#000" },
  dashPlaceholder: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, fontSize: wp("12%"), fontFamily: "WorkSans_Regular", textAlign: "center", color: "#504d4dff", lineHeight: wp("12.5%") },
  button: { backgroundColor: "#5f5fff", paddingVertical: hp("2%"), borderRadius: wp("3%"), marginTop: hp("1%"), width: "95%", alignItems: "center" },
  buttonDisabled: { backgroundColor: "#d0d0d0" },
  buttonText: { color: "#fff", fontSize: wp("4.2%"), fontFamily: "WorkSans_SemiBold" },
  timerText: { fontSize: wp("3.5%"), fontFamily: "WorkSans_Regular", color: "#666666", marginTop: hp("2%"), textAlign: "center" },
  timerHighlight: { color: "#2288ff", fontFamily: "WorkSans_Regular" },
  resendText: { fontSize: wp("3.5%"), fontFamily: "WorkSans_Regular", color: "#666666", marginTop: hp("2%") },
  resendLink: { color: "#5f5fff", fontFamily: "WorkSans_SemiBold" },
});