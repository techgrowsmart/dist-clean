import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, TextInput, ActivityIndicator, Alert, Animated, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import authService from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');
const windowWidth = width;

export default function EmailInputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = typeof Platform !== 'undefined' && Platform.OS === 'web';
  
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

  const handleContinue = async () => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // For signup, validate name is provided
    if (!isLogin && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      // Try to send OTP for login/signup (with phone number for signup)
      const fullPhoneNumber = phoneNumber ? `${phoneCountry}${phoneNumber}` : '+0000000000';
      const response = await authService.sendOTP(trimmedEmail, '', !isLogin, fullName, fullPhoneNumber);
      
      // Check if it's a test user that bypasses OTP
      if (response.isTestUser && response.token) {
        // Store auth data and navigate directly to dashboard
        await authService.storeAuthData({
          role: response.role || role,
          email: trimmedEmail,
          token: response.token,
          name: (response as any).name || trimmedEmail.split('@')[0],
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
        pathname: '/auth/OTPScreen' as any,
        params: { 
          email: trimmedEmail, 
          isLogin: isLogin ? 'true' : 'false', 
          role: role,
          otpId: response.otpId || '',
          isSignup: isLogin ? 'false' : 'true',
          name: fullName,
          phone: phoneNumber ? `${phoneCountry}${phoneNumber}` : '+0000000000' // Default phone if not provided
        } 
      });
    } catch (error: any) {
      console.error('OTP sending error:', error);
      
      // Check if user is already registered
      if (error.message?.includes('already registered')) {
        Alert.alert(
          'Already Registered',
          'This email is already registered. Would you like to login instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Login', 
              onPress: () => router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'login' } })
            }
          ]
        );
      } else {
        // Show other error messages from the backend
        Alert.alert('Error', error.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Go back to InitialScreen (onboarding) instead of login to avoid redirect loop
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/InitialScreen' as any);
    }
  };

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        <StatusBar barStyle="light-content" />
        {/* Left Column - Background Image Only */}
        {windowWidth >= 900 && (
          <View style={webStyles.leftColumn}>
            <ImageBackground
              source={require('../../assets/images/login-background.jpeg')}
              style={webStyles.backgroundImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Right Column - Content */}
        <View style={webStyles.rightColumn}>
          <View style={webStyles.content}>
            {/* Back Button */}
            <View style={webStyles.backButtonContainer}>
              <TouchableOpacity style={webStyles.backButton} onPress={handleBack}>
                <Text style={webStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Email / Signup Input Section */}
            <View style={webStyles.emailSection}>
              <Text style={webStyles.emailTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={webStyles.emailSubtitle}>
                {isLogin 
                  ? 'Enter your email to continue to your account'
                  : 'Enter your details to get started with GoGrowSmart'
                }
              </Text>

              {/* Name (signup only) */}
              {!isLogin && (
                <View style={webStyles.inputContainer}>
                  <TextInput
                    style={webStyles.emailInput}
                    placeholder="Full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Phone (signup only) */}
              {!isLogin && (
                <View style={webStyles.phoneRow}>
                  <TouchableOpacity style={webStyles.countryPicker} onPress={() => setCountryDropdownOpen(!countryDropdownOpen)}>
                    <Text style={webStyles.countryPickerText}>{phoneCountry}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={webStyles.phoneInput}
                    placeholder="Phone number (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View style={webStyles.inputContainer}>
                <TextInput
                  style={webStyles.emailInput}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity 
                style={[webStyles.continueButton, (!email.trim() || loading) && webStyles.disabledButton]} 
                onPress={handleContinue}
                disabled={!email.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={webStyles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>

              {/* Country dropdown list */}
              {countryDropdownOpen && (
                <View style={webStyles.countryList}>
                  {countries.map((c) => (
                    <TouchableOpacity key={c.code} style={webStyles.countryItem} onPress={() => { setPhoneCountry(c.dial_code); setCountryDropdownOpen(false); }}>
                      <Text style={webStyles.countryItemText}>{c.name} {c.dial_code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Terms and Conditions */}
            <View style={webStyles.termsSection}>
              <Text style={webStyles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={webStyles.termsLink}>Terms of Service</Text>{' '}
                and{' '}
                <Text style={webStyles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile fallback
  return (
    <View style={styles.mobileContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mobileContent}>
        {/* Mobile Header */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity style={styles.mobileBackButton} onPress={handleBack}>
            <Text style={styles.mobileBackButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.mobileEmailTitle}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>

        {/* Description */}
        <Text style={styles.mobileEmailSubtitle}>
          {isLogin 
            ? 'Enter your email to continue to your account'
            : 'Enter your details to get started with GoGrowSmart'
          }
        </Text>

        {/* Name (signup only) */}
        {!isLogin && (
          <TextInput
            style={styles.mobileEmailInput}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        )}

        {/* Phone (signup only) */}
        {!isLogin && (
          <View style={styles.mobilePhoneRow}>
            <TouchableOpacity style={styles.mobileCountryPicker} onPress={() => setCountryDropdownOpen(!countryDropdownOpen)}>
              <Text style={styles.mobileCountryPickerText}>{phoneCountry}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.mobileEmailInput}
              placeholder="Phone number (optional)"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        {/* Email Input */}
        <TextInput
          style={styles.mobileEmailInput}
          placeholder="Enter your email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Continue Button */}
        <TouchableOpacity 
          style={[styles.mobileContinueButton, (!email.trim() || loading) && styles.mobileDisabledButton]} 
          onPress={handleContinue}
          disabled={!email.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.mobileContinueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Country dropdown list (mobile) */}
        {countryDropdownOpen && (
          <View style={styles.mobileCountryList}>
            {countries.map((c) => (
              <TouchableOpacity key={c.code} style={styles.mobileCountryItem} onPress={() => { setPhoneCountry(c.dial_code); setCountryDropdownOpen(false); }}>
                <Text style={styles.mobileCountryItemText}>{c.name} {c.dial_code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Terms */}
        <Text style={styles.mobileTermsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

// Web-specific styles
const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: '50%',
    minWidth: 300,
    backgroundColor: '#3131b0',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 49, 176, 0.3)',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: '100%',
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  emailSection: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  emailTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emailSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  inputContainerFocused: {
    borderColor: '#7C4DDB',
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 4px rgba(124, 77, 219, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  phoneRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
  },
  phoneInputContainerFocused: {
    borderColor: '#7C4DDB',
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 4px rgba(124, 77, 219, 0.1)',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 54,
    minWidth: 90,
  },
  countryPickerFocused: {
    borderColor: '#7C4DDB',
    backgroundColor: '#FFFFFF',
  },
  countryPickerText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 4,
  },
  dropdownIcon: {
    marginLeft: 2,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  countryList: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    zIndex: 1000,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryItemText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  countryItemDialCode: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 'auto',
  },
  continueButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 4px 8px rgba(124, 77, 219, 0.3)',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  termsSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#7C4DDB',
    fontWeight: '600',
  },
});

// Mobile styles
const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 4px 8px rgba(124, 77, 219, 0.3)',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  termsSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mobileHeader: {
    position: 'absolute',
    top: 40,
    left: 24,
    width: '100%',
  },
  mobileBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mobileBackButtonText: {
    fontSize: 16,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  mobileEmailTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileEmailSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  mobilePhoneRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mobileCountryPicker: {
    width: 86,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  mobileCountryPickerText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  mobileCountryList: {
    width: '100%',
    maxHeight: 240,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  mobileCountryItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  mobileCountryItemText: {
    color: '#1A1A1A',
  },
  mobileInputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  mobileEmailInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    width: '100%',
  },
  mobileContinueButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 4px 8px rgba(124, 77, 219, 0.3)',
  },
  mobileDisabledButton: {
    backgroundColor: '#D1D5DB',
  },
  mobileContinueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  mobileTermsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#7C4DDB',
    textDecorationLine: 'underline',
  },
  mobileLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  mobileRoleContainer: {
    width: '100%',
    marginBottom: 24,
  },
  mobileRoleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileRoleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  mobileRoleOptionSelected: {
    borderColor: '#7C4DDB',
    backgroundColor: '#F3F0FF',
  },
  mobileRoleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  mobileRoleOptionTextSelected: {
    color: '#7C4DDB',
  },
});
