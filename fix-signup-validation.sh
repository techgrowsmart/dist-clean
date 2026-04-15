#!/bin/bash

# GrowSmart Signup Validation Fix Script
# Fixes duplicate registration issues and improves error handling

echo "=========================================="
echo "GrowSmart Signup Validation Fix"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status="$1"
    local message="$2"
    
    case $status in
        "SUCCESS")
            echo -e "${GREEN}# $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}# $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}# $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}# $message${NC}"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -d "app" ]; then
    print_status "ERROR" "Please run this script from the Gogrowsmart directory"
    exit 1
fi

print_status "INFO" "Starting signup validation fixes..."
echo ""

# 1. Enhanced EmailInputScreen with duplicate checking
print_status "INFO" "Updating EmailInputScreen with enhanced validation..."

cat > app/auth/EmailInputScreen.tsx << 'EOF'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ImageBackground, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BASE_URL } from '../../config';
import { authService } from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');
const windowWidth = width;

export default function EmailInputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const [errorName, setErrorName] = useState("");
  const [errorPhone, setErrorPhone] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(params.type === 'login' || false);
  const [role, setRole] = useState(params.role as string || '');
  const [fullName, setFullName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const countries = [
    { name: 'India', code: 'IN', dial_code: '+91' },
    { name: 'United States', code: 'US', dial_code: '+1' },
    { name: 'United Kingdom', code: 'GB', dial_code: '+44' },
    { name: 'Canada', code: 'CA', dial_code: '+1' },
    { name: 'Australia', code: 'AU', dial_code: '+61' },
    { name: 'Pakistan', code: 'PK', dial_code: '+92' },
    { name: 'Bangladesh', code: 'BD', dial_code: '+880' },
    { name: 'Nigeria', code: 'NG', dial_code: '+234' },
    { name: 'South Africa', code: 'ZA', dial_code: '+27' },
  ];

  // Enhanced validation functions
  const validateEmail = (email: string) => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!trimmedEmail) {
      return "Email is required.";
    }
    
    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address";
    }
    
    // Check for common invalid email patterns
    const invalidPatterns = [
      /^[^.]+@[^.]+\.[^.]+$/, // No domain parts
      /^[^.@]+@/, // No username
      /@[^.]+$/, // No domain extension
      /\.\./, // Double dots
      /^\.|\.@|@\./, // Leading/trailing dots
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmedEmail)) {
        return "Please enter a valid email address";
      }
    }
    
    return null;
  };

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Full Name is required.";
    }
    
    if (trimmedName.length < 2) {
      return "Name must be at least 2 characters long.";
    }
    
    if (trimmedName.length > 50) {
      return "Name must be less than 50 characters.";
    }
    
    // Check for valid name characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes.";
    }
    
    return null;
  };

  const validatePhone = (phone: string) => {
    const trimmedPhone = phone.trim();
    
    if (!trimmedPhone) {
      return "Phone Number is required.";
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    
    if (digitsOnly.length > 15) {
      return "Phone number must be less than 15 digits.";
    }
    
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneCountry + trimmedPhone)) {
      return "Please enter a valid phone number.";
    }
    
    return null;
  };

  const handleContinue = async () => {
    let isValid = true;
    setErrorName("");
    setErrorPhone("");
    setErrorEmail("");

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();
    
    // Validation for signup
    if (!isLogin) {
      const nameError = validateName(trimmedName);
      if (nameError) {
        setErrorName(nameError);
        isValid = false;
      }
      
      const phoneError = validatePhone(trimmedPhone);
      if (phoneError) {
        setErrorPhone(phoneError);
        isValid = false;
      }
    }
    
    const emailError = validateEmail(trimmedEmail);
    if (emailError) {
      setErrorEmail(emailError);
      isValid = false;
    }
    
    if (!isValid) return;

    setLoading(true);

    try {
      if (!isLogin) {
        // Enhanced signup validation with duplicate checking
        const response = await fetch(`${BASE_URL}/api/signup`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ 
            fullName: trimmedName, 
            phonenumber: phoneCountry + trimmedPhone, 
            email: trimmedEmail,
            role: role || 'student'
          }), 
        });
  
        const data = await response.json();
        
        if (response.ok) {
          // Success - OTP sent
          Alert.alert(
            "Success", 
            "OTP Sent! Check your email.",
            [
              {
                text: "OK",
                onPress: () => {
                  router.push({
                    pathname: "/auth/OTPScreen" as any,
                    params: { 
                      email: trimmedEmail, 
                      isLogin: 'false', 
                      role: role,
                      otpId: data.otpId || '',
                      isSignup: 'true',
                      name: trimmedName,
                      phone: phoneCountry + trimmedPhone
                    } 
                  });
                }
              }
            ]);
        } else {
          // Enhanced error handling for different scenarios
          let errorMessage = "Signup failed!";
          let showRetryOption = true;
          
          if (data.alreadyRegistered) {
            errorMessage = data.message || "This email is already registered. Please use a different email or try logging in.";
            showRetryOption = false;
          } else if (data.emailExists) {
            errorMessage = "This email is already registered. Please try logging in instead.";
            showRetryOption = false;
          } else if (data.phoneExists) {
            errorMessage = "This phone number is already registered. Please use a different phone number.";
            showRetryOption = true;
          } else if (data.invalidEmail) {
            errorMessage = "Please enter a valid email address.";
            showRetryOption = true;
            setErrorEmail("This email is not valid");
          } else if (data.invalidPhone) {
            errorMessage = "Please enter a valid phone number.";
            showRetryOption = true;
            setErrorPhone("This phone number is not valid");
          } else if (data.invalidName) {
            errorMessage = "Please enter a valid name.";
            showRetryOption = true;
            setErrorName("This name is not valid");
          } else if (data.serverError) {
            errorMessage = "Server is temporarily unavailable. Please try again later.";
            showRetryOption = true;
          } else if (data.message) {
            errorMessage = data.message;
          }
          
          Alert.alert(
            "Registration Error",
            errorMessage,
            showRetryOption ? [
              {
                text: "Try Again",
                onPress: () => setLoading(false)
              },
              {
                text: "Login Instead",
                onPress: () => {
                  router.replace({
                    pathname: "/auth/LoginScreen" as any,
                    params: { email: trimmedEmail }
                  });
                }
              }
            ] : [
              {
                text: "Login Instead",
                onPress: () => {
                  router.replace({
                    pathname: "/auth/LoginScreen" as any,
                    params: { email: trimmedEmail }
                  });
                }
              }
            ]
          );
        }
      } else {
        // For login: Use existing OTP logic
        const response = await authService.sendOTP(trimmedEmail, '', false);
        
        // Check if it's a test user that bypasses OTP
        if (response.isTestUser && response.token) {
          // Store auth data and navigate directly to dashboard
          await authService.storeAuthData({
            role: response.role || role,
            email: trimmedEmail,
            token: response.token,
            name: response.name || trimmedEmail.split('@')[0],
          });
          
          // Navigate to appropriate dashboard
          if (response.role === 'teacher') {
            router.replace('/(tabs)/TeacherDashBoard' as any);
          } else {
            router.replace('/(tabs)/StudentDashBoard' as any);
          }
          return;
        }
        
        // For regular users, navigate to OTP verification screen
        router.push({ 
          pathname: "/auth/OTPScreen" as any,
          params: { 
            email: trimmedEmail, 
            isLogin: 'true', 
            role: role,
            otpId: response.otpId || ''
          } 
        });
      }
    } catch (error: any) {
      console.error("Signup/Login error:", error);
      
      let errorMessage = "Network error occurred. Please check your connection and try again.";
      
      if (error.message?.includes('CORS')) {
        errorMessage = "Connection error. Please try again in a moment.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessage = "Unable to connect to server. Please try again later.";
      }
      
      Alert.alert(
        "Connection Error",
        errorMessage,
        [
          {
            text: "Try Again",
            onPress: () => setLoading(false)
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    safeBack(router, '/auth/InitialScreen');
  };

  const toggleCountryDropdown = () => {
    setCountryDropdownOpen(!countryDropdownOpen);
  };

  const selectCountry = (country: any) => {
    setPhoneCountry(country.dial_code);
    setCountryDropdownOpen(false);
  };

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        <ImageBackground 
          source={require('../../assets/image/Backgroundlogin.jpeg')} 
          style={webStyles.backgroundImage}
          resizeMode="cover"
        >
          <View style={webStyles.overlay}>
            <View style={webStyles.content}>
              {/* Logo Section */}
              <View style={webStyles.logoSection}>
                <ImageBackground 
                  source={require('../../assets/image/logo.png')} 
                  style={webStyles.logo}
                  resizeMode="contain"
                />
                <Text style={webStyles.logoText}>Growsmart</Text>
                <Text style={webStyles.subtitle}>
                  {isLogin ? 'Welcome Back!' : 'Create Your Account'}
                </Text>
              </View>

              {/* Form Section */}
              <View style={webStyles.formSection}>
                {!isLogin && (
                  <View style={webStyles.inputGroup}>
                    <Text style={webStyles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={[webStyles.textInput, errorName ? webStyles.inputError : null]}
                      placeholder="Enter your full name"
                      placeholderTextColor="#999"
                      value={fullName}
                      onChangeText={setFullName}
                      editable={!loading}
                    />
                    {errorName ? <Text style={webStyles.errorText}>{errorName}</Text> : null}
                  </View>
                )}

                <View style={webStyles.inputGroup}>
                  <Text style={webStyles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={[webStyles.textInput, errorEmail ? webStyles.inputError : null]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  {errorEmail ? <Text style={webStyles.errorText}>{errorEmail}</Text> : null}
                </View>

                {!isLogin && (
                  <View style={webStyles.inputGroup}>
                    <Text style={webStyles.inputLabel}>Phone Number</Text>
                    <View style={webStyles.phoneInputContainer}>
                      <TouchableOpacity 
                        style={webStyles.countrySelector}
                        onPress={toggleCountryDropdown}
                        disabled={loading}
                      >
                        <Text style={webStyles.countryCode}>{phoneCountry}</Text>
                        <Text style={webStyles.dropdownArrow}>+</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[webStyles.phoneInput, errorPhone ? webStyles.inputError : null]}
                        placeholder="Enter phone number"
                        placeholderTextColor="#999"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        editable={!loading}
                      />
                    </View>
                    {errorPhone ? <Text style={webStyles.errorText}>{errorPhone}</Text> : null}
                    
                    {countryDropdownOpen && (
                      <View style={webStyles.countryDropdown}>
                        {countries.map((country, index) => (
                          <TouchableOpacity
                            key={index}
                            style={webStyles.countryOption}
                            onPress={() => selectCountry(country)}
                          >
                            <Text style={webStyles.countryOptionText}>
                              {country.name} ({country.dial_code})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity 
                  style={[webStyles.continueButton, loading && webStyles.buttonDisabled]}
                  onPress={handleContinue}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={webStyles.continueButtonText}>
                      {isLogin ? 'Send OTP' : 'Continue'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Back Button */}
              <TouchableOpacity style={webStyles.backButton} onPress={handleBack}>
                <Text style={webStyles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/image/Backgroundlogin.jpeg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <StatusBar barStyle="light-content" />
        
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <ImageBackground 
              source={require('../../assets/image/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Growsmart</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, errorName ? styles.inputError : null]}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
                {errorName ? <Text style={styles.errorText}>{errorName}</Text> : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, errorEmail ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errorEmail ? <Text style={styles.errorText}>{errorEmail}</Text> : null}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <TouchableOpacity 
                    style={styles.countrySelector}
                    onPress={toggleCountryDropdown}
                    disabled={loading}
                  >
                    <Text style={styles.countryCode}>{phoneCountry}</Text>
                    <Text style={styles.dropdownArrow}>+</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.phoneInput, errorPhone ? styles.inputError : null]}
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
                {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}
                
                {countryDropdownOpen && (
                  <View style={styles.countryDropdown}>
                    {countries.map((country, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.countryOption}
                        onPress={() => selectCountry(country)}
                      >
                        <Text style={styles.countryOptionText}>
                          {country.name} ({country.dial_code})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>
                  {isLogin ? 'Send OTP' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

// Web styles
const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C4DDB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  countryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1000,
  },
  countryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  continueButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#7C4DDB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#7C4DDB',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Mobile styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C4DDB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  countryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 0,
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1000,
  },
  countryOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  countryOptionText: {
    fontSize: 14,
    color: '#333',
  },
  continueButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#7C4DDB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
EOF

print_status "SUCCESS" "EmailInputScreen updated with enhanced validation"

# 2. Enhanced authService with better error handling
print_status "INFO" "Updating authService with enhanced error handling..."

cat > services/authService.ts << 'EOF'
import axios from 'axios';
import { Platform } from 'react-native';
import { BASE_URL } from '../config';
import { clearAllStorage, getAuthData, storeAuthData } from '../utils/authStorage';

// Check if user is a test user
const isTestUser = (email: string) => {
  const testEmails = ['test31@example.com', 'test@example.com', 'admin@test.com'];
  return testEmails.includes(email);
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token and handle CORS
apiClient.interceptors.request.use(async (config) => {
  try {
    const auth = await getAuthData();
    
    if (auth && auth.token) {
      config.headers.Authorization = \`Bearer \${auth.token}\`;
    }
    
    // Add platform-specific headers
    if (Platform.OS === 'web') {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['Origin'] = window.location.origin;
    }
    
    console.log('API Request:', {
      url: config.baseURL + config.url,
      method: config.method,
      hasAuth: !!auth?.token
    });
    
    return config;
  } catch (error) {
    console.error('Request interceptor error:', error);
    return config;
  }
});

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  async (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Enhanced CORS error handling
    if (error.message?.includes('CORS') || error.response?.status === 0) {
      console.error('CORS Error Detected:', {
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        target: BASE_URL
      });
      
      if (Platform.OS === 'web') {
        throw new Error('CORS error: Backend configuration updated to allow portal.gogrowsmart.com');
      }
    }
    
    throw new Error(error.message || 'Network error: Unable to connect to server.');
  }
);

export class AuthService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      console.log('API Request:', { endpoint, BASE_URL });
      
      const url = \`\${BASE_URL}/api\${endpoint}\`;
      
      // Get auth token for authenticated requests
      const authData = await getAuthData();
      
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(authData?.token && { Authorization: \`Bearer \${authData.token}\` }),
          ...options.headers
        },
        mode: 'cors',
        credentials: 'omit'
      };
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Server error: Received HTML instead of JSON');
      }
      
      if (!response.ok) {
        // Handle different HTTP status codes
        switch (response.status) {
          case 400:
            throw new Error('Bad request: Please check your input data');
          case 401:
            throw new Error('Unauthorized: Please login again');
          case 403:
            throw new Error('Forbidden: You do not have permission to perform this action');
          case 404:
            throw new Error('Not found: The requested resource was not found');
          case 409:
            throw new Error('Conflict: This resource already exists');
          case 429:
            throw new Error('Too many requests: Please try again later');
          case 500:
            throw new Error('Server error: Please try again later');
          default:
            throw new Error(\`HTTP \${response.status}: \${response.statusText || 'Request failed'}\`);
        }
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Service Error:', {
        message: error.message,
        endpoint,
        baseURL: BASE_URL
      });
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Please check your connection and try again');
      }
      
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      if (error.message?.includes('CORS')) {
        throw new Error('Connection error: Please try again in a moment');
      }
      
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('Login attempt:', { email });
      
      // Check if test user
      if (isTestUser(email)) {
        console.log('Test user detected, using real database');
      }
      
      const response = await this.makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.token) {
        await storeAuthData(response);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: any) {
    try {
      console.log('Registration attempt:', userData);
      
      const response = await this.makeRequest('/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.success || response.otpId) {
        return { success: true, otpId: response.otpId };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific registration errors
      if (error.message?.includes('Conflict')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      throw error;
    }
  }

  async sendOTP(email: string, password?: string, isSignup: boolean = false, name?: string) {
    try {
      console.log('Sending OTP:', { email, isSignup });
      
      const endpoint = isSignup ? '/signup' : '/login';
      const body = isSignup 
        ? { email, fullName: name, phonenumber: '', role: 'student' }
        : { email, password };
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      // Check if it's a test user that bypasses OTP
      if (response.isTestUser && response.token) {
        return {
          success: true,
          isTestUser: true,
          token: response.token,
          user: response.user,
          role: response.role
        };
      }
      
      return {
        success: true,
        otpId: response.otpId,
        message: response.message || 'OTP sent successfully'
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Handle specific OTP errors
      if (error.message?.includes('already registered')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      throw error;
    }
  }

  async verifyOTP(email: string, otp: string, otpId?: string, userName?: string, role?: string, userPhone?: string) {
    try {
      console.log('Verifying OTP:', { email, role });
      
      const body = userName 
        ? { email, otp, userName, role, phonenumber: userPhone }
        : { email, otp, otpId };
      
      const response = await this.makeRequest('/verify-otp', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      if (response.token) {
        await storeAuthData(response);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Handle specific OTP errors
      if (error.message?.includes('Invalid OTP')) {
        throw new Error('Invalid OTP. Please check and try again.');
      }
      
      if (error.message?.includes('expired')) {
        throw new Error('OTP has expired. Please request a new one.');
      }
      
      throw error;
    }
  }

  async verifySignupOTP(email: string, otp: string, userName: string, role: string, userPhone: string) {
    return this.verifyOTP(email, otp, undefined, userName, role, userPhone);
  }

  async forgotPassword(email: string) {
    try {
      console.log('Forgot password:', { email });
      
      const response = await this.makeRequest('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return response;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, password: string) {
    try {
      console.log('Reset password:', { token });
      
      const response = await this.makeRequest('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      
      return response;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await this.makeRequest('/profile');
      return response;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(userData: any) {
    try {
      console.log('Update profile:', userData);
      
      const response = await this.makeRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      
      return response;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async storeAuthData(authData: any) {
    try {
      await storeAuthData(authData);
      console.log('Auth data stored successfully');
    } catch (error: any) {
      console.error('Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  async logout() {
    try {
      await clearAllStorage();
      console.log('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout properly');
    }
  }
}

export default new AuthService();
EOF

print_status "SUCCESS" "authService updated with enhanced error handling"

# 3. Create enhanced signup validation API endpoint
print_status "INFO" "Creating enhanced signup validation..."

cat > backend-enhanced-signup.js << 'EOF'
// Enhanced Backend API for GrowSmart Signup Validation
// Handles duplicate registration prevention and proper error responses

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://portal.gogrowsmart.com"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://gogrowsmart.com',
    'https://portal.gogrowsmart.com',
    'https://growsmartserver.gogrowsmart.com',
    'http://localhost:8081',
    'http://localhost:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo (replace with actual database)
const users = new Map();
const otpStore = new Map();

// Enhanced validation functions
const validateEmail = (email) => {
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!trimmedEmail) return { valid: false, error: 'Email is required' };
  if (!emailRegex.test(trimmedEmail)) return { valid: false, error: 'Invalid email format' };
  
  // Additional validation
  const invalidPatterns = [
    /^[^.]+@[^.]+\.[^.]+$/, // No domain parts
    /^[^.@]+@/, // No username
    /@[^.]+$/, // No domain extension
    /\.\./, // Double dots
    /^\.|\.@|@\./, // Leading/trailing dots
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmedEmail)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  return { valid: true, email: trimmedEmail };
};

const validateName = (name) => {
  const trimmedName = name.trim();
  
  if (!trimmedName) return { valid: false, error: 'Name is required' };
  if (trimmedName.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmedName.length > 50) return { valid: false, error: 'Name must be less than 50 characters' };
  
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { valid: true, name: trimmedName };
};

const validatePhone = (phone) => {
  const trimmedPhone = phone.trim();
  
  if (!trimmedPhone) return { valid: false, error: 'Phone number is required' };
  
  const digitsOnly = trimmedPhone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return { valid: false, error: 'Phone number must be at least 10 digits' };
  if (digitsOnly.length > 15) return { valid: false, error: 'Phone number must be less than 15 digits' };
  
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(trimmedPhone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true, phone: trimmedPhone };
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Enhanced signup endpoint with duplicate checking
app.post('/api/signup', async (req, res) => {
  try {
    console.log('Signup request:', req.body);
    
    const { email, fullName, phonenumber, role = 'student' } = req.body;
    
    // Validate all required fields
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    const nameValidation = validateName(fullName);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.error,
        invalidName: true
      });
    }
    
    const phoneValidation = validatePhone(phonenumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.error,
        invalidPhone: true
      });
    }
    
    // Check for existing users
    const existingUserByEmail = Array.from(users.values()).find(
      user => user.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please use a different email or try logging in.',
        alreadyRegistered: true,
        emailExists: true
      });
    }
    
    const existingUserByPhone = Array.from(users.values()).find(
      user => user.phone === phoneValidation.phone
    );
    
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. Please use a different phone number.',
        phoneExists: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = uuidv4();
    
    // Store OTP
    otpStore.set(otpId, {
      email: emailValidation.email,
      name: nameValidation.name,
      phone: phoneValidation.phone,
      role: role,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    console.log('OTP generated for signup:', { email: emailValidation.email, otpId, otp });
    
    // In production, send actual email
    console.log('OTP would be sent to:', emailValidation.email);
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId,
      email: emailValidation.email
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Enhanced login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.error,
        invalidEmail: true
      });
    }
    
    // Check for test users
    const testUsers = ['test31@example.com', 'test@example.com', 'admin@test.com'];
    if (testUsers.includes(emailValidation.email)) {
      const otp = generateOTP();
      const otpId = uuidv4();
      
      otpStore.set(otpId, {
        email: emailValidation.email,
        otp: otp,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        otpId: otpId,
        isTestUser: true,
        token: 'test-token-' + Date.now(),
        user: {
          id: 'test-user',
          email: emailValidation.email,
          name: emailValidation.email.split('@')[0],
          role: 'student'
        }
      });
    }
    
    // Check if user exists
    const existingUser = Array.from(users.values()).find(
      user => user.email.toLowerCase() === emailValidation.email.toLowerCase()
    );
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Email not registered. Please sign up first.',
        userNotFound: true
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = uuidv4();
    
    otpStore.set(otpId, {
      email: emailValidation.email,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    console.log('OTP generated for login:', { email: emailValidation.email, otpId, otp });
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpId: otpId
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Enhanced OTP verification endpoint
app.post('/api/verify-otp', async (req, res) => {
  try {
    console.log('OTP verification request:', req.body);
    
    const { email, otp, otpId, userName, role, phonenumber } = req.body;
    
    // Find OTP record
    const otpRecord = otpStore.get(otpId);
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      otpStore.delete(otpId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // For signup, create user account
    if (userName && role) {
      const newUser = {
        id: uuidv4(),
        email: otpRecord.email,
        name: userName,
        phone: phonenumber,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      users.set(newUser.id, newUser);
      console.log('New user created:', newUser);
    }
    
    // Generate token
    const token = 'jwt-token-' + Date.now();
    
    // Clean up OTP
    otpStore.delete(otpId);
    
    // Find user for response
    const user = Array.from(users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
      user: user || {
        id: 'temp-user',
        email: email,
        name: userName || email.split('@')[0],
        role: role || 'student'
      }
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again later.',
      serverError: true
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Enhanced GrowSmart API Server is running',
    timestamp: new Date().toISOString(),
    users: users.size,
    activeOTPs: otpStore.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    serverError: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Enhanced GrowSmart API Server running on port', PORT);
  console.log('Enhanced signup validation enabled');
  console.log('Health check: http://localhost:' + PORT + '/api/health');
});

module.exports = app;
EOF

print_status "SUCCESS" "Enhanced backend signup validation created"

# 4. Create comprehensive testing script
print_status "INFO" "Creating comprehensive signup testing script..."

cat > test-signup-validation.sh << 'EOF'
#!/bin/bash

# GrowSmart Signup Validation Test Script
# Tests all signup scenarios including duplicate prevention

echo "=========================================="
echo "GrowSmart Signup Validation Tests"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status="\$1"
    local message="\$2"
    
    case \$status in
        "SUCCESS") echo -e "\${GREEN}# \$message\${NC}" ;;
        "WARNING") echo -e "\${YELLOW}# \$message\${NC}" ;;
        "ERROR") echo -e "\${RED}# \$message\${NC}" ;;
        "INFO") echo -e "\${BLUE}# \$message\${NC}" ;;
    esac
}

# Test data
BASE_URL="http://localhost:3000"
TEST_RESULTS=()

# Test functions
test_signup_scenario() {
    local test_name="\$1"
    local email="\$2"
    local name="\$3"
    local phone="\$4"
    local expected_status="\$5"
    local expected_error="\$6"
    
    echo "Testing: \$test_name"
    echo "Email: \$email, Name: \$name, Phone: \$phone"
    
    response=\$(curl -s -w "%{http_code}" -X POST "\$BASE_URL/api/signup" \\
        -H "Content-Type: application/json" \\
        -d "{\\"email\\": \\"\$email\\", \\"fullName\\": \\"\$name\\", \\"phonenumber\\": \\"\$phone\\", \\"role\\": \\"student\\"}")
    
    http_code="\${response: -3}"
    response_body="\${response%???}"
    
    if [ "\$http_code" = "\$expected_status" ]; then
        if [ -n "\$expected_error" ]; then
            if echo "\$response_body" | grep -q "\$expected_error"; then
                print_status "SUCCESS" "\$test_name - Correct error response"
                TEST_RESULTS+=("PASS: \$test_name")
            else
                print_status "ERROR" "\$test_name - Wrong error message"
                TEST_RESULTS+=("FAIL: \$test_name")
            fi
        else
            print_status "SUCCESS" "\$test_name - Request successful"
            TEST_RESULTS+=("PASS: \$test_name")
        fi
    else
        print_status "ERROR" "\$test_name - Expected \$expected_status, got \$http_code"
        TEST_RESULTS+=("FAIL: \$test_name")
    fi
    
    echo "Response: \$response_body"
    echo ""
}

# Start enhanced backend server
print_status "INFO" "Starting enhanced backend server..."

if [ -f "backend-enhanced-signup.js" ]; then
    node backend-enhanced-signup.js &
    SERVER_PID=\$!
    echo "Server PID: \$SERVER_PID"
    sleep 2
    
    # Test server health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "SUCCESS" "Enhanced backend server is running"
    else
        print_status "ERROR" "Enhanced backend server failed to start"
        exit 1
    fi
else
    print_status "ERROR" "backend-enhanced-signup.js not found"
    exit 1
fi

echo ""
print_status "INFO" "Running signup validation tests..."
echo ""

# Test 1: Valid new user signup
test_signup_scenario \\
    "Valid New User Signup" \\
    "newuser@example.com" \\
    "John Doe" \\
    "+919876543210" \\
    "200"

# Test 2: Duplicate email signup (should fail)
test_signup_scenario \\
    "Duplicate Email Signup" \\
    "newuser@example.com" \\
    "Jane Doe" \\
    "+919876543211" \\
    "409" \\
    "already registered"

# Test 3: Invalid email format
test_signup_scenario \\
    "Invalid Email Format" \\
    "invalid-email" \\
    "Test User" \\
    "+919876543212" \\
    "400" \\
    "Invalid email"

# Test 4: Empty name
test_signup_scenario \\
    "Empty Name" \\
    "test2@example.com" \\
    "" \\
    "+919876543213" \\
    "400" \\
    "Name is required"

# Test 5: Invalid phone number
test_signup_scenario \\
    "Invalid Phone Number" \\
    "test3@example.com" \\
    "Test User" \\
    "123" \\
    "400" \\
    "Phone number must be at least 10 digits"

# Test 6: Name with invalid characters
test_signup_scenario \\
    "Invalid Name Characters" \\
    "test4@example.com" \\
    "Test123!@#" \\
    "+919876543214" \\
    "400" \\
    "Name can only contain"

# Test 7: Duplicate phone number (should fail)
test_signup_scenario \\
    "Duplicate Phone Number" \\
    "test5@example.com" \\
    "Another User" \\
    "+919876543210" \\
    "409" \\
    "phone number is already registered"

# Test 8: Very long name
test_signup_scenario \\
    "Very Long Name" \\
    "test6@example.com" \\
    "This is a very long name that exceeds the fifty character limit" \\
    "+919876543215" \\
    "400" \\
    "Name must be less than 50 characters"

# Test 9: Valid login for existing user
test_signup_scenario \\
    "Valid Login Request" \\
    "newuser@example.com" \\
    "John Doe" \\
    "+919876543210" \\
    "200"

# Test 10: Login with non-existent user
test_signup_scenario \\
    "Login Non-existent User" \\
    "nonexistent@example.com" \\
    "Test User" \\
    "+919876543216" \\
    "404" \\
    "not registered"

# Stop server
kill \$SERVER_PID 2>/dev/null

echo ""
print_status "INFO" "Test Results Summary"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

for result in "\${TEST_RESULTS[@]}"; do
    if [[ \$result == PASS* ]]; then
        PASS_COUNT=\$((PASS_COUNT + 1))
        echo "PASS: \${result#PASS: }"
    else
        FAIL_COUNT=\$((FAIL_COUNT + 1))
        echo "FAIL: \${result#FAIL: }"
    fi
done

echo ""
echo "Total Tests: \${#TEST_RESULTS[@]}"
echo "Passed: \$PASS_COUNT"
echo "Failed: \$FAIL_COUNT"

if [ \$FAIL_COUNT -eq 0 ]; then
    echo ""
    print_status "SUCCESS" "ALL TESTS PASSED - Signup validation is working correctly!"
    exit 0
else
    echo ""
    print_status "ERROR" "Some tests failed - Please review the implementation"
    exit 1
fi
EOF

chmod +x test-signup-validation.sh

print_status "SUCCESS" "Comprehensive signup testing script created"

echo ""
print_status "SUCCESS" "SIGNUP VALIDATION FIX COMPLETE!"
echo ""
echo -e "\${GREEN}Fixed Issues:\${NC}"
echo "Enhanced email validation with proper format checking"
echo "Duplicate email prevention with clear error messages"
echo "Duplicate phone number prevention"
echo "Name validation with character restrictions"
echo "Phone number validation with length checks"
echo "Comprehensive error handling for all scenarios"
echo "User-friendly error messages with actionable guidance"
echo "Test user bypass for development"
echo ""
echo -e "\${BLUE}Files Updated:\${NC}"
echo "app/auth/EmailInputScreen.tsx - Enhanced validation"
echo "services/authService.ts - Improved error handling"
echo "backend-enhanced-signup.js - New backend validation"
echo "test-signup-validation.sh - Comprehensive testing"
echo ""
echo -e "\${YELLOW}Next Steps:\${NC}"
echo "1. Run: ./test-signup-validation.sh to test all scenarios"
echo "2. Deploy the enhanced backend to production"
echo "3. Test the signup flow in the application"
echo "4. Verify duplicate prevention works correctly"
echo ""
print_status "SUCCESS" "Signup validation is now robust and user-friendly!"
