import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Poppins_400Regular,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Lato_400Regular, Lato_700Bold } from "@expo-google-fonts/lato";
import { OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../config";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get("window");

export default function RoleSelectionScreen() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [phonenumber, setPhonenumber] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  let [fontsLoaded] = useFonts({
    Poppins_Regular: Poppins_400Regular,
    Poppins_Bold: Poppins_700Bold,
    Lato_Regular: Lato_400Regular,
    Lato_Bold: Lato_700Bold,
    OpenSans_Regular: OpenSans_400Regular,
  });

  useEffect(() => {
    const loadEmail = async () => {
      if (email) { setUserEmail(email); await AsyncStorage.setItem("email", email); } 
      else { const storedEmail = await AsyncStorage.getItem("email"); if (storedEmail) { setUserEmail(storedEmail); } }
    };
    const loadname = async () => {
      if (name) { setName(name); await AsyncStorage.setItem("name", name); } 
      else { const storedName = await AsyncStorage.getItem("name"); if (storedName) { setName(storedName); } }
    };
    const loadPhoneNumber = async () => {
      if (phonenumber) { setPhonenumber(phonenumber); await AsyncStorage.setItem("phonenumber", phonenumber); } 
      else { const storedPhonenumber = await AsyncStorage.getItem("phonenumber"); if (storedPhonenumber) { setPhonenumber(storedPhonenumber); } }
    };
    const loadUserId = async () => {
      if (userId) { setUserId(userId); await AsyncStorage.setItem("userId", userId); } 
      else { const storedUserId = await AsyncStorage.getItem("userId"); if (storedUserId) { setUserId(storedUserId); } }
    };
    loadEmail(); loadname(); loadPhoneNumber(); loadUserId();
  }, [email, name, phonenumber, userId]);

  const handleRoleSelection = async (role: "student" | "teacher") => {
    if (!userEmail) { Alert.alert("Error", "Email not found. Please log in again."); return; }
    setLoading(true); setSelectedRole(role);
    try {
      const response = await fetch(`${BASE_URL}/api/update-role`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: userEmail, role }),
      });
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { Alert.alert("Error", "Invalid server response"); setLoading(false); return; }
      setLoading(false);
      if (response.ok) {
        await AsyncStorage.setItem("userRole", role);
        router.push({
          pathname: role === "teacher" ? "/(tabs)/TeacherDashBoard/RegistrationSecond" : "/(tabs)/StudentDashBoard/Profile",
          params: { userType: role, userEmail, name, phonenumber, userId },
        });
      } else { Alert.alert("Error", data.message || "Failed to update role"); }
    } catch (error) { setLoading(false); Alert.alert("Error", "Network error. Please try again."); }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4255FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image style={styles.image} source={require("../../assets/image/WelcomeTutor.png")} />
      <View style={styles.selectionContainer}>
        <Text style={styles.title}>"Future Starts Here"</Text>
        <Text style={styles.subtitle}>How would you like to join us?</Text>
        <View style={styles.roleBoxWrapper}>
          <TouchableOpacity
            style={[styles.roleBox, hovered === "student" && styles.activeBox, loading && styles.disabledBox]}
            onPress={() => handleRoleSelection("student")}
            onPressIn={() => setHovered("student")}
            onPressOut={() => setHovered(null)}
            disabled={loading}
          >
            {loading && selectedRole === "student" ? <ActivityIndicator color="#fff" /> : <Text style={[styles.roleText, hovered === "student" && styles.activeText]}>STUDENT</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBox, hovered === "teacher" && styles.activeBox, loading && styles.disabledBox]}
            onPress={() => handleRoleSelection("teacher")}
            onPressIn={() => setHovered("teacher")}
            onPressOut={() => setHovered(null)}
            disabled={loading}
          >
            {loading && selectedRole === "teacher" ? <ActivityIndicator color="#fff" /> : <Text style={[styles.roleText, hovered === "teacher" && styles.activeText]}>TUTOR</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.madeWith}>
          <Text style={styles.madeWithTxt}>made with ♥ in 🇮🇳</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", backgroundColor: "#fff" },
  image: { height: hp('60%'), width: '100%', top: hp("12%") },
  selectionContainer: { position: "absolute", bottom: 0, width: width, height: hp('45.49%'), backgroundColor: "#ebebe6", borderTopLeftRadius: wp('7.866%'), borderTopRightRadius: wp('7.866%'), padding: 20, alignItems: "center" },
  roleBoxWrapper: { flexDirection: "row", justifyContent: "space-between", gap: 20, marginTop: hp('3.66%') },
  roleBox: { flex: 1, width: wp('44%'), height: hp('13.72%'), backgroundColor: "#fff", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activeBox: { borderWidth: wp('0.88%'), borderColor: "#5f5fff", backgroundColor: "#5f5fff" },
  roleText: { fontSize: wp('4.26%'), fontFamily: "Poppins_Bold", color: "#000", marginTop: 5 },
  activeText: { color: "#fff" },
  disabledBox: { opacity: 0.6 },
  title: { fontSize: wp('4%'), fontFamily: "Lato_Bold", color: "#FFF", marginTop: hp('1.749%'), backgroundColor: "#5f5fff", paddingHorizontal: 20, paddingVertical: 10, borderWidth: wp('0.22%'), borderColor: "#db0f0f", borderRadius: wp("2%") },
  subtitle: { fontSize: wp('3.86%'), fontFamily: "Lato_Bold", color: "#1b163f", marginTop: hp('1.61%'), lineHeight: hp('2.82%') },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { fontSize: wp('4%'), color: "#4255FF", fontFamily: "Poppins_Regular", marginTop: 10 },
  madeWith: { marginTop: hp('4.306%') },
  madeWithTxt: { color: "#5f5fff", fontSize: wp('4.266%'), lineHeight: hp('2.691%'), fontFamily: "OpenSans_Regular" },
});