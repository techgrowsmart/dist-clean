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

  const handleContinue = async () => {
    let isValid = true;
    setErrorName(""); setErrorPhone(""); setErrorEmail("");

    const trimmedEmail = email.trim();
    
    // Validation for signup
    if (!isLogin) {
      if (!fullName.trim()) { 
        setErrorName("Full Name is required."); 
        isValid = false; 
      }
      if (!phoneNumber.trim()) { 
        setErrorPhone("Phone Number is required."); 
        isValid = false; 
      }
    }
    
    if (!trimmedEmail) { 
      setErrorEmail("Email is required."); 
      isValid = false; 
    }
    
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      setErrorEmail("Please enter a valid email address");
      isValid = false;
    }
    
    if (!isValid) return;

    setLoading(true);

    try {
      if (!isLogin) {
        // For signup: Use the same API call as SignUp.tsx
        const response = await fetch(`${BASE_URL}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fullName: fullName, 
            phonenumber: phoneCountry + phoneNumber, 
            email: trimmedEmail 
          }), 
        });
  
        const data = await response.json();
        
        if (response.ok) {
          Alert.alert("Success", "OTP Sent! Check your email.");
          router.push({
            pathname: "/auth/OTPScreen" as any,
            params: { 
              email: trimmedEmail, 
              isLogin: 'false', 
              role: role,
              otpId: data.otpId || '',
              isSignup: 'true',
              name: fullName,
              phone: phoneCountry + phoneNumber
            } 
          });
        } else {
          if (data.alreadyRegistered) {
            Alert.alert("Error", data.message || "Signup failed!");
          } else {
            Alert.alert("Error", data.message || "Signup failed!");
          }
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
          pathname: '/auth/OTPScreen' as any,
          params: { 
            email: trimmedEmail, 
            isLogin: 'false', 
            role: role,
            otpId: response.otpId || '',
            isSignup: 'false'
          } 
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      if (!isLogin) {
        Alert.alert("Error", error.message || "Something went wrong.");
      } else {
        // Check if user is not registered and needs to signup
        if (error.message.includes('not registered') || error.message.includes('sign up')) {
          try {
            // For new users, initiate signup flow
            const signupResponse = await authService.signup(trimmedEmail, fullName, role);
            
            if (signupResponse.otpId) {
              // Navigate to OTP verification screen for signup
              router.push({ 
                pathname: '/auth/OTPScreen' as any,
                params: { 
                  email: trimmedEmail, 
                  isLogin: 'false', 
                  role: role,
                  otpId: signupResponse.otpId || '',
                  isSignup: 'true',
                  name: fullName,
                  phone: phoneNumber ? `${phoneCountry}${phoneNumber}` : '+0000000000' // Default phone if not provided
                } 
              });
            } else {
              Alert.alert('Error', 'Failed to initiate signup');
            }
          } catch (signupError: any) {
            console.error('Direct signup error:', signupError);
            Alert.alert('Error', signupError.message || 'Failed to signup');
          }
        } else {
          Alert.alert('Error', error.message || 'Failed to send OTP');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    safeBack(router, '/login');
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
                    style={[webStyles.emailInput, errorName ? webStyles.inputError : null]}
                    placeholder="Full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={(text) => { 
                      setFullName(text); 
                      if (text.trim()) setErrorName(""); 
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {errorName ? <Text style={webStyles.errorText}>{errorName}</Text> : null}
                </View>
              )}

              {/* Phone (signup only) */}
              {!isLogin && (
                <View style={webStyles.phoneRow}>
                  <TouchableOpacity style={webStyles.countryPicker} onPress={() => setCountryDropdownOpen(!countryDropdownOpen)}>
                    <Text style={webStyles.countryPickerText}>{phoneCountry}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[webStyles.phoneInput, errorPhone ? webStyles.inputError : null]}
                    placeholder="Phone number"
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber}
                    onChangeText={(text) => { 
                      setPhoneNumber(text); 
                      if (text.trim()) setErrorPhone(""); 
                    }}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
              {errorPhone ? <Text style={webStyles.errorText}>{errorPhone}</Text> : null}

              <View style={webStyles.inputContainer}>
                <TextInput
                  style={[webStyles.emailInput, errorEmail ? webStyles.inputError : null]}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => { 
                    setEmail(text); 
                    if (text.trim()) setErrorEmail(""); 
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errorEmail ? <Text style={webStyles.errorText}>{errorEmail}</Text> : null}
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
            style={[styles.mobileEmailInput, errorName ? styles.mobileInputError : null]}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={(text) => { 
              setFullName(text); 
              if (text.trim()) setErrorName(""); 
            }}
            autoCapitalize="words"
            autoCorrect={false}
          />
        )}
        {errorName ? <Text style={styles.mobileErrorText}>{errorName}</Text> : null}

        {/* Phone (signup only) */}
        {!isLogin && (
          <View style={styles.mobilePhoneRow}>
            <TouchableOpacity style={styles.mobileCountryPicker} onPress={() => setCountryDropdownOpen(!countryDropdownOpen)}>
              <Text style={styles.mobileCountryPickerText}>{phoneCountry}</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.mobileEmailInput, errorPhone ? styles.mobileInputError : null]}
              placeholder="Phone number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={(text) => { 
                setPhoneNumber(text); 
                if (text.trim()) setErrorPhone(""); 
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
        {errorPhone ? <Text style={styles.mobileErrorText}>{errorPhone}</Text> : null}

        {/* Email Input */}
        <TextInput
          style={[styles.mobileEmailInput, errorEmail ? styles.mobileInputError : null]}
          placeholder="Enter your email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={(text) => { 
            setEmail(text); 
            if (text.trim()) setErrorEmail(""); 
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errorEmail ? <Text style={styles.mobileErrorText}>{errorEmail}</Text> : null}

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
    marginBottom: 48,
    width: '100%',
  },
  emailTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 50,
  },
  emailSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  phoneRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  countryPicker: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  countryPickerText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 2,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  countryList: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  countryItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  countryItemText: {
    color: '#1A1A1A',
  },
  emailInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(124, 77, 219, 0.3)',
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    boxShadow: 'none',
    elevation: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  directSignupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C4DDB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  directSignupButtonText: {
    color: '#7C4DDB',
    fontSize: 16,
    fontWeight: '600',
  },
  termsSection: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#7C4DDB',
    textDecorationLine: 'underline',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#7C4DDB',
    backgroundColor: '#F3F0FF',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  roleOptionTextSelected: {
    color: '#7C4DDB',
  },
});

// Mobile styles
const styles = StyleSheet.create({
  mobileContainer: {
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
  mobileInputError: {
    borderColor: 'red',
    borderWidth: 2,
  },
  mobileErrorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
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
    boxShadow: '0 4px 8px rgba(124, 77, 219, 0.3)',
    elevation: 8,
    marginBottom: 24,
  },
  mobileDisabledButton: {
    backgroundColor: '#D1D5DB',
    boxShadow: 'none',
    elevation: 0,
  },
  mobileContinueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  mobileDirectSignupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C4DDB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginTop: 12,
  },
  mobileDirectSignupButtonText: {
    color: '#7C4DDB',
    fontSize: 16,
    fontWeight: '600',
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
