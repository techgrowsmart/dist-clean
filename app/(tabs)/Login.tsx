import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { BASE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeAuthData } from '../../utils/authStorage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  // Responsive design: split layout for larger screens, centered for mobile
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = isWeb && width >= 600; // Lower breakpoint for better responsiveness
  const isMobile = !isLargeScreen; // Mobile phones

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

      const data = await response.json();

      if (!response.ok) {
        if (data.isRegistered === false) {
          Toast.show({ type: "error", text1: data.message });
          setTimeout(() => router.push("/SignUp"), 1500);
          return;
        }
        Toast.show({ type: "error", text1: data.message });
        return;
      }

      // Handle test users - direct login without OTP
      if (data.isTestUser) {
        console.log(" Test user login detected - bypassing OTP");
        await storeAuthData({
          role: data.role,
          email: email,
          token: data.token,
          name: data.name
        });
        
        Toast.show({
          type: "success",
          text1: "Login Successful (Test User)"
        });
        
        setTimeout(() => {
          if (data.role === "teacher") {
            router.replace("/(tabs)/TeacherDashBoard/Teacher");
          } else {
            router.replace("/(tabs)/StudentDashBoard/Student");
          }
        }, 1000);
        return;
      }

      if (data.status !== "active") {
        Toast.show({ type: "info", text1: data.message });
        setTimeout(() => {
          router.push({
            pathname: `/(tabs)/LoginOtp`,
            params: {
              email: email,
              otpId: data.otpId,
              role: data.role,
            },
          });
        }, 2000);
      } else {
        // User is active, store auth data and redirect
        await storeAuthData({
          role: data.role,
          email: email,
          token: data.token,
          name: data.name
        });
        
        Toast.show({
          type: "success",
          text1: "Login Successful"
        });
        
        setTimeout(() => {
          if (data.role === "teacher") {
            router.replace("/(tabs)/TeacherDashBoard/Teacher");
          } else {
            router.replace("/(tabs)/StudentDashBoard/Student");
          }
        }, 1000);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text2: "Please try again later.",
      });
    }
  };

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
              Welcome to the app {'\n'}& let's get started
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              This app is the best app, thank you for downloading it.{'\n'}You won't regret using it.
            </Text>

            {/* Email Input */}
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

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.signupButton} onPress={() => router.push("/SignUp")}>
              <Text style={styles.signupButtonText}>Sign up</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={sendOtp}>
              <Text style={styles.loginButtonText}>Log in</Text>
            </TouchableOpacity>

            {/* Terms and Conditions */}
            <Text style={styles.termsText}>
              By signing up, I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions{'\n'}and Privacy Policy.</Text>
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
            Welcome to the app {'\n'}& let's get started
          </Text>

          {/* Description */}
          <Text style={styles.mobileDescription}>
            This app is the best app, thank you for downloading it.{'\n'}You won't regret using it.
          </Text>

          {/* Email Input */}
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

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signupButton} onPress={() => router.push("/SignUp")}>
            <Text style={styles.signupButtonText}>Sign up</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={sendOtp}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          {/* Terms and Conditions */}
          <Text style={styles.mobileTermsText}>
            By signing up, I agree to the{' '}
            <Text style={styles.termsLink}>Terms and Conditions{'\n'}and Privacy Policy.</Text>
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
  loginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 50,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#7C4DDB',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  termsLink: {
    color: '#555555',
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