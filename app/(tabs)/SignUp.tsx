import { Mulish_400Regular, Mulish_600SemiBold, Mulish_700Bold, useFonts } from "@expo-google-fonts/mulish";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking } from "react-native";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import Toast from "react-native-toast-message";
import { BASE_URL } from "../../config";

const { width, height } = Dimensions.get("window");

export default function SignUpScreen() {
    const [errorName, setErrorName] = useState("");
    const [errorPhone, setErrorPhone] = useState("");
    const [errorEmail, setErrorEmail] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    let [fontsLoaded] = useFonts({
        Mulish_Regular: Mulish_400Regular,
        Mulish_SemiBold: Mulish_600SemiBold,
        Mulish_Bold: Mulish_700Bold,
    });

    const handleSignUp = async () => {
        let isValid = true;
        setErrorName(""); setErrorPhone(""); setErrorEmail("");

        if (!name.trim()) { setErrorName("Full Name is required."); isValid = false; }
        if (!phone.trim()) { setErrorPhone("Phone Number is required."); isValid = false; }
        if (!email.trim()) { setErrorEmail("Email is required."); isValid = false; }
        if (!isValid) return;

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: name, phonenumber: phone, email }), 
            });
    
            const data = await response.json();
            setLoading(false);
    
            if (response.ok) {
                Alert.alert("Success", "OTP Sent! Check your email.");
                router.push({
                    pathname: "/VerifyOTP",
                    params: { otpId: data.otpId, email, name, phone },
                });
            } else {
                if (data.alreadyRegistered) {
                    Toast.show({ type:"error", text1:data.message })
                } else {
                    Alert.alert("Error", data.message || "Signup failed!");
                }
            }
        } catch (error) {
            setLoading(false);
            Alert.alert("Error", error.message || "Something went wrong.");
        }
    };

    if (!fontsLoaded) return <Text>Loading...</Text>;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.contentContainer}>
                    <Image source={require("../../assets/image/Signup.png")} style={styles.image} resizeMode="contain" />

                    <Text style={styles.title}>Sign up</Text>
                    <Text style={styles.subtitle}>
                        {`By signing up, you agree to our${' '}${'\n'}`}
                        <Text 
                            style={styles.link}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/terms-and-conditions")}
                        >Terms & Conditions</Text> and{" "}
                        <Text 
                            style={styles.link}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/privacy-policy")}
                        >Privacy Policy</Text>.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, errorName ? styles.inputError : null]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={(text) => { setName(text); if (text.trim()) setErrorName(""); }}
                        />
                        {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, errorPhone ? styles.inputError : null]}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => { setPhone(text); if (text.trim()) setErrorPhone(""); }}
                        />
                        {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, errorEmail ? styles.inputError : null]}
                            placeholder="Enter your email"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => { setEmail(text); if (text.trim()) setErrorEmail(""); }}
                        />
                        {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account!</Text>
                        <TouchableOpacity onPress={() => router.push("/Login")}>
                            <Text style={styles.loginLink}> Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    contentContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: wp("6.4%"), paddingVertical: hp("2%") },
    image: { width: "200%", height: hp("30%"), marginBottom: -hp("1.5%") },
    title: { fontSize: wp("6.5%"), color: "#03070E", marginBottom: hp("1%"), fontFamily: "Mulish_Bold" },
    subtitle: { fontSize: wp("3.7%"), color: "#82878F", textAlign: "center", marginBottom: hp("3%"), fontFamily: "Mulish_Regular", lineHeight: hp("2.8%") },
    link: { color: "#107eff", fontFamily: "Mulish_SemiBold" },
    inputGroup: { width: "100%", marginBottom: hp("1.5%") },
    label: { textAlign: "left", color: "#6a6a6a", fontSize: wp("3.5%"), fontFamily: "Mulish_Regular" },
    input: { width: "100%", height: hp("6.5%"), backgroundColor: "#ffffff", borderRadius: wp("3%"), paddingHorizontal: wp("4%"), color: "#03070E", marginTop: hp("0.5%"), fontSize: wp("4%"), fontFamily: "Mulish_Regular", borderColor: "#4e504e0", borderWidth: wp("0.35") },
    inputError: { borderColor: "red", borderWidth: 1 },
    errorText: { color: "red", fontSize: wp("3.2%"), marginTop: 4, fontFamily: "Mulish_Regular" },
    button: { width: "100%", height: hp("6%"), backgroundColor: "#5f5fff", borderRadius: wp("2.5%"), justifyContent: "center", alignItems: "center", marginTop: hp("2%") },
    buttonText: { color: "#fff", fontSize: wp("4.2%"), fontFamily: "Mulish_Bold" },
    loginContainer: { flexDirection: "row", alignItems: "center", marginTop: hp("2.5%") },
    loginText: { color: "#82878F", fontSize: wp("3.8%"), fontFamily: "Mulish_Regular" },
    loginLink: { color: "#107eff", fontSize: wp("3.8%"), fontFamily: "Mulish_SemiBold", marginLeft: wp("1%") },
});