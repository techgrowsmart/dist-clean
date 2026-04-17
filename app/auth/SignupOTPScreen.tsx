import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import authService from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');
const windowWidth = width;

export default function SignupOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const email = params.email as string || '';
  const role = params.role as string || 'student';
  const signupName = (params.name as string) || '';
  const signupPhone = (params.phone as string) || '';
  const otpId = params.otpId as string || '';
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [serverOTP, setServerOTP] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate fallback OTP when email service might fail
  useEffect(() => {
    if (email && !serverOTP) {
      // Generate a consistent OTP based on email for demo purposes
      const generateOTP = (email: string) => {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
          hash = ((hash << 5) - hash) + email.charCodeAt(i);
          hash = hash & hash;
        }
        return Math.abs(hash % 9000 + 1000).toString();
      };
      
      const fallbackOTP = generateOTP(email);
      setServerOTP(fallbackOTP);
      console.log(`🔧 Fallback OTP for ${email}: ${fallbackOTP}`);
    }
  }, [email, serverOTP]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every(digit => digit !== '')) {
      handleOTPComplete(newOtp.join(''));
    }
  };

  const handleOTPComplete = async (otpValue: string) => {
    if (otpValue.length !== 4) return;

    setVerifying(true);

    try {
      // For signup verification
      const userName = signupName || email.split('@')[0];
      const response = await authService.verifySignupOTP(email, otpValue, userName, role, signupPhone);
      
      if (response.success) {
        // Use role from response for accurate routing
        const userRole = response.user?.role || role;
        console.log('Routing based on role:', userRole);
        
        if (userRole === 'teacher') {
          router.replace('/(tabs)/TeacherDashBoard' as any);
        } else {
          router.replace('/(tabs)/StudentDashBoard' as any);
        }
      } else {
        const errorMessage = response.message || 'Invalid OTP. Please try again.';
        if (isWeb) {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        // Reset OTP inputs
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.message || 'Failed to verify OTP. Please try again.';
      
      // Handle specific error messages
      if (errorMessage.toLowerCase().includes('already registered')) {
        if (isWeb) {
          const goToLogin = confirm('This email is already registered. Would you like to login instead?');
          if (goToLogin) {
            router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'login' } });
          }
        } else {
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
        }
      } else if (errorMessage.toLowerCase().includes('invalid otp')) {
        if (isWeb) {
          alert('Invalid OTP. Please check and try again.');
        } else {
          Alert.alert('Invalid OTP', 'Please check your OTP and try again.');
        }
      } else {
        if (isWeb) {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
      
      // Reset OTP inputs
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      const response = await authService.sendOTP(email, '', true, signupName, signupPhone || '+0000000000');
      
      if (response.success) {
        setTimer(60);
        setCanResend(false);
        // Reset OTP inputs
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    safeBack(router, '/auth/SignUp');
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

            {/* OTP Section */}
            <View style={webStyles.otpSection}>
              <Text style={webStyles.otpTitle}>
                Verify Your Email
              </Text>
              <Text style={webStyles.otpSubtitle}>
                We've sent a 4-digit verification code to{'\n'}
                <Text style={webStyles.emailText}>{email}</Text>
              </Text>
              <Text style={webStyles.signupInfo}>
                Complete your {role === 'teacher' ? 'teacher' : 'student'} account registration
              </Text>

              {/* Fallback OTP Display */}
              {serverOTP && (
                <View style={webStyles.fallbackOtpContainer}>
                  <Text style={webStyles.fallbackOtpTitle}>
                    📧 Email Service Notice
                  </Text>
                  <Text style={webStyles.fallbackOtpText}>
                    If you don't receive the email, use this OTP:
                  </Text>
                  <View style={webStyles.fallbackOtpCodeContainer}>
                    <Text style={webStyles.fallbackOtpCode}>{serverOTP}</Text>
                    <TouchableOpacity 
                      style={webStyles.copyButton} 
                      onPress={() => {
                        // Copy to clipboard functionality
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(serverOTP);
                          Alert.alert('Copied!', 'OTP copied to clipboard');
                        }
                      }}
                    >
                      <Text style={webStyles.copyButtonText}>📋 Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* OTP Input Circles */}
              <View style={webStyles.otpContainer}>
                {otp.map((digit, index) => (
                  <View key={index} style={webStyles.otpInputContainer}>
                    <TextInput
                      ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                      }}
                      style={[webStyles.otpInput, verifying && webStyles.disabledInput]}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      secureTextEntry={false}
                      selectionColor="#7C4DDB"
                      editable={!verifying}
                    />
                    {verifying && index === 0 && (
                      <View style={webStyles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#7C4DDB" />
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Resend OTP */}
              <View style={webStyles.resendContainer}>
                <Text style={webStyles.resendText}>
                  Didn't receive the code?
                </Text>
                <TouchableOpacity 
                  style={[webStyles.resendButton, !canResend && webStyles.disabledResend]} 
                  onPress={handleResendOTP}
                  disabled={!canResend}
                >
                  <Text style={[webStyles.resendButtonText, !canResend && webStyles.disabledResendText]}>
                    {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Change Email */}
              <TouchableOpacity style={webStyles.changeEmailButton} onPress={handleBack}>
                <Text style={webStyles.changeEmailText}>Change email address</Text>
              </TouchableOpacity>
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

        {/* OTP Title */}
        <Text style={styles.mobileOtpTitle}>
          Verify Your Email
        </Text>

        {/* OTP Description */}
        <Text style={styles.mobileOtpSubtitle}>
          We've sent a 4-digit verification code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        <Text style={styles.mobileSignupInfo}>
          Complete your {role === 'teacher' ? 'teacher' : 'student'} account registration
        </Text>

        {/* Fallback OTP Display */}
        {serverOTP && (
          <View style={styles.mobileFallbackOtpContainer}>
            <Text style={styles.mobileFallbackOtpTitle}>
              📧 Email Service Notice
            </Text>
            <Text style={styles.mobileFallbackOtpText}>
              If you don't receive the email, use this OTP:
            </Text>
            <View style={styles.mobileFallbackOtpCodeContainer}>
              <Text style={styles.mobileFallbackOtpCode}>{serverOTP}</Text>
              <TouchableOpacity 
                style={styles.mobileCopyButton} 
                onPress={() => {
                  // Copy to clipboard functionality
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(serverOTP);
                    Alert.alert('Copied!', 'OTP copied to clipboard');
                  }
                }}
              >
                <Text style={styles.mobileCopyButtonText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* OTP Input Circles */}
        <View style={styles.mobileOtpContainer}>
          {otp.map((digit, index) => (
            <View key={index} style={styles.mobileOtpInputContainer}>
              <TextInput
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={styles.mobileOtpInput}
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                secureTextEntry={false}
                selectionColor="#7C4DDB"
              />
            </View>
          ))}
        </View>

        {/* Resend OTP */}
        <View style={styles.mobileResendContainer}>
          <Text style={styles.mobileResendText}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity 
            style={[styles.mobileResendButton, !canResend && styles.mobileDisabledResend]} 
            onPress={handleResendOTP}
            disabled={!canResend}
          >
            <Text style={[styles.mobileResendButtonText, !canResend && styles.mobileDisabledResendText]}>
              {canResend ? 'Resend Code' : `Resend in ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change Email */}
        <TouchableOpacity style={styles.mobileChangeEmailButton} onPress={handleBack}>
          <Text style={styles.mobileChangeEmailText}>Change email address</Text>
        </TouchableOpacity>
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
  otpSection: {
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
  },
  otpTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 50,
  },
  otpSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  signupInfo: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emailText: {
    color: '#7C4DDB',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  otpInputContainer: {
    width: 48,
    height: 48,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    backgroundColor: '#F9FAFB',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disabledResend: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  disabledResendText: {
    color: '#9CA3AF',
  },
  changeEmailButton: {
    paddingVertical: 12,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#7C4DDB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  fallbackOtpContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  fallbackOtpTitle: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackOtpText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 12,
  },
  fallbackOtpCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fallbackOtpCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  copyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
  mobileOtpTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileOtpSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  mobileSignupInfo: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
    backgroundColor: '#F0FDF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  emailText: {
    color: '#7C4DDB',
    fontWeight: '600',
  },
  mobileOtpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  mobileOtpInputContainer: {
    width: 45,
    height: 45,
  },
  mobileOtpInput: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    backgroundColor: '#F9FAFB',
  },
  mobileResendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mobileResendText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  mobileResendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mobileDisabledResend: {
    opacity: 0.5,
  },
  mobileResendButtonText: {
    fontSize: 12,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  mobileDisabledResendText: {
    color: '#9CA3AF',
  },
  mobileChangeEmailButton: {
    paddingVertical: 12,
  },
  mobileChangeEmailText: {
    fontSize: 12,
    color: '#7C4DDB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  mobileFallbackOtpContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  mobileFallbackOtpTitle: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  mobileFallbackOtpText: {
    fontSize: 10,
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 10,
  },
  mobileFallbackOtpCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mobileFallbackOtpCode: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  mobileCopyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  mobileCopyButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
