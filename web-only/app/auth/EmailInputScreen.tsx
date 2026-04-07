import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

export default function EmailInputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(params.type === 'login' || false);
  const [role, setRole] = useState(params.role as string || '');

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Check if it's a test user
      if (email === 'student1@example.com' || email === 'teacher56@example.com' || email === 'teacher31@example.com') {
        const response = await authService.testUserLogin(email);
        
        if (response.success) {
          // Navigate to appropriate dashboard
          if (response.user?.role === 'teacher') {
            router.replace('/(tabs)/TeacherDashBoard' as any);
          } else {
            router.replace('/(tabs)/StudentDashBoard' as any);
          }
        } else {
          Alert.alert('Error', response.message || 'Login failed');
        }
      } else {
        // For regular users, try login first, then signup if needed
        try {
          const response = await authService.sendOTP(email, '', !isLogin, '');
          
          if (response.success) {
            // Navigate to OTP verification screen
            router.push({ 
              pathname: '/auth/OTPScreen' as any,
              params: { 
                email: email, 
                isLogin: isLogin.toString(), 
                role: role,
                otpId: response.otpId || ''
              } 
            });
          } else {
            Alert.alert('Error', response.message || 'Failed to send OTP');
          }
        } catch (loginError: any) {
          // If login fails because user not registered, try signup
          if (loginError.message && loginError.message.includes('not registered')) {
            try {
              const signupResponse = await authService.signup(email, 'New User', role);
              
              if (signupResponse.otpId) {
                // Navigate to OTP verification screen for signup
                router.push({ 
                  pathname: '/auth/OTPScreen' as any,
                  params: { 
                    email: email, 
                    isLogin: 'false', 
                    role: role,
                    otpId: signupResponse.otpId || '',
                    isSignup: 'true'
                  } 
                });
              } else {
                Alert.alert('Error', 'Failed to initiate signup');
              }
            } catch (signupError: any) {
              Alert.alert('Error', signupError.message || 'Failed to signup');
            }
          } else {
            Alert.alert('Error', loginError.message || 'Failed to send OTP');
          }
        }
      }
    } catch (error: any) {
      console.error('Email input error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
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
        <View style={webStyles.leftColumn}>
          <ImageBackground
            source={require('../../assets/images/login-background.jpeg')}
            style={webStyles.backgroundImage}
            resizeMode="cover"
          >
            <View style={webStyles.imageOverlay} />
          </ImageBackground>
        </View>

        {/* Right Column - Content */}
        <View style={webStyles.rightColumn}>
          <View style={webStyles.content}>
            {/* Back Button */}
            <View style={webStyles.backButtonContainer}>
              <TouchableOpacity style={webStyles.backButton} onPress={handleBack}>
                <Text style={webStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Email Input Section */}
            <View style={webStyles.emailSection}>
              <Text style={webStyles.emailTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={webStyles.emailSubtitle}>
                {isLogin 
                  ? 'Enter your email to continue to your account'
                  : 'Enter your email to get started with GoGrowSmart'
                }
              </Text>

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

        {/* Email Title */}
        <Text style={styles.mobileEmailTitle}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>

        {/* Email Description */}
        <Text style={styles.mobileEmailSubtitle}>
          {isLogin 
            ? 'Enter your email to continue to your account'
            : 'Enter your email to get started with GoGrowSmart'
          }
        </Text>

        {/* Email Input */}
        <View style={styles.mobileInputContainer}>
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
        </View>

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
    marginBottom: 32,
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
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowColor: 'transparent',
    elevation: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 32,
    paddingHorizontal: 20,
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
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 8,
    marginBottom: 24,
  },
  mobileDisabledButton: {
    backgroundColor: '#D1D5DB',
    shadowColor: 'transparent',
    elevation: 0,
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
});
