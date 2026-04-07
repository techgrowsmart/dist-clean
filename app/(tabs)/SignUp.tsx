import { Mulish_400Regular, Mulish_600SemiBold, Mulish_700Bold, useFonts } from "@expo-google-fonts/mulish";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking } from "react-native";
import {
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
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

    // Responsive design: split layout for larger screens, centered for mobile
    const isWeb = Platform.OS === 'web';
    const isLargeScreen = isWeb && width >= 600; // Lower breakpoint for better responsiveness
    const isMobile = !isLargeScreen; // Mobile phones

    let [fontsLoaded] = useFonts({
        Mulish_Regular: Mulish_400Regular,
        Mulish_SemiBold: Mulish_600SemiBold,
        Mulish_Bold: Mulish_700Bold,
    });

    const handleSignUp = async () => {
        let isValid = true;
        setErrorName(""); setErrorPhone(""); setErrorEmail("");

        if (!name.trim()) { setErrorName("Full Name is required."); isValid = false; }
        if (!email.trim()) { setErrorEmail("Email is required."); isValid = false; }
        if (!isValid) return;

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: name, phonenumber: phone || '', email, role: 'student' }), 
            });
    
            const data = await response.json();
            setLoading(false);
    
            if (response.ok) {
                Alert.alert("Success", "OTP Sent! Check your email.");
                router.push({
                    pathname: "/auth/SignupOTPScreen",
                    params: { otpId: data.otpId, email, name, phone, role: 'student' },
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

    if (isLargeScreen) {
        return (
            <View style={styles.container}>
                {/* Left Column - Background Image */}
                <View style={styles.leftColumn}>
                    <ImageBackground
                        source={require('../../assets/images/login-background.jpeg')}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Right Column - Content */}
                <View style={styles.rightColumn}>
                    <View style={styles.content}>
                        {/* Welcome Title */}
                        <Text style={styles.welcomeTitle}>
                            Create your account {'\n'}& get started
                        </Text>

                        {/* Description */}
                        <Text style={styles.description}>
                            Join the best learning platform.{'\n'}Sign up and start your journey today.
                        </Text>

                        {/* Full Name Input */}
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={[styles.input, errorName ? styles.inputError : null]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={(text) => { setName(text); if (text.trim()) setErrorName(""); }}
                        />
                        {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}

                        {/* Phone Number Input */}
                        <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                        <TextInput
                            style={[styles.input, errorPhone ? styles.inputError : null]}
                            placeholder="Enter your phone number"
                            placeholderTextColor="#94a3b8"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={(text) => { setPhone(text); if (text.trim()) setErrorPhone(""); }}
                        />
                        {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}

                        {/* Email Input */}
                        <Text style={styles.inputLabel}>Email Address</Text>
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

                        {/* Sign Up Button */}
                        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Sign up</Text>}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => router.push("/Login")}>
                                <Text style={styles.loginLink}> Log in</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Terms and Conditions */}
                        <Text style={styles.termsText}>
                            By signing up, I agree to the{' '}
                            <Text 
                                style={styles.termsLink}
                                onPress={() => Linking.openURL("https://gogrowsmart.com/terms-and-conditions")}
                            >Terms & Conditions</Text> and{' '}
                            <Text 
                                style={styles.termsLink}
                                onPress={() => Linking.openURL("https://gogrowsmart.com/privacy-policy")}
                            >Privacy Policy</Text>.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // Mobile fallback
    return (
        <KeyboardAvoidingView style={styles.mobileContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.mobileContent}>
                    {/* Welcome Title */}
                    <Text style={styles.mobileWelcomeTitle}>
                        Create your account {'\n'}& get started
                    </Text>

                    {/* Description */}
                    <Text style={styles.mobileDescription}>
                        Join the best learning platform.{'\n'}Sign up and start your journey today.
                    </Text>

                    {/* Full Name Input */}
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={[styles.input, errorName ? styles.inputError : null]}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94a3b8"
                        value={name}
                        onChangeText={(text) => { setName(text); if (text.trim()) setErrorName(""); }}
                    />
                    {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}

                    {/* Phone Number Input */}
                    <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                    <TextInput
                        style={[styles.input, errorPhone ? styles.inputError : null]}
                        placeholder="Enter your phone number"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={(text) => { setPhone(text); if (text.trim()) setErrorPhone(""); }}
                    />
                    {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}

                    {/* Email Input */}
                    <Text style={styles.inputLabel}>Email Address</Text>
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

                    {/* Sign Up Button */}
                    <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Sign up</Text>}
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push("/Login")}>
                            <Text style={styles.loginLink}> Log in</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Terms and Conditions */}
                    <Text style={styles.mobileTermsText}>
                        By signing up, I agree to the{' '}
                        <Text 
                            style={styles.termsLink}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/terms-and-conditions")}
                        >Terms & Conditions</Text> and{' '}
                        <Text 
                            style={styles.termsLink}
                            onPress={() => Linking.openURL("https://gogrowsmart.com/privacy-policy")}
                        >Privacy Policy</Text>.
                    </Text>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: width * 0.5,
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 44,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 50,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: '#666666',
    fontSize: 16,
  },
  loginLink: {
    color: '#7C4DDB',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  termsText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  termsLink: {
    color: '#7C4DDB',
    textDecorationLine: 'underline',
  },
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mobileContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  mobileWelcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  mobileDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  mobileTermsText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Input styles
  inputLabel: {
    alignSelf: 'flex-start',
    color: '#606060',
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 5,
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#03070E',
    marginBottom: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#5d674e',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    alignSelf: 'flex-start',
    color: 'red',
    fontSize: 14,
    marginBottom: 16,
  },
});