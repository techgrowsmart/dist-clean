import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const email = params.email as string || '';
  const isLogin = params.isLogin === 'true';
  const isSignup = params.isSignup === 'true';
  const role = params.role as string || 'student';
  const otpId = params.otpId as string || '';
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [timer, setTimer] = useState(60);
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
      let response;
      
      if (isSignup) {
        // For signup, we need user name - let's use a default or get it from somewhere
        const userName = email.split('@')[0]; // Use email prefix as default name
        response = await authService.verifySignupOTP(email, otpValue, userName, '');
      } else {
        // For login verification
        response = await authService.verifyOTP(email, otpValue, otpId);
      }
      
      if (response.success) {
        // For signup verification, redirect to role selection
        if (isSignup) {
          router.push({ 
            pathname: '/auth/RoleSelectionScreen' as any,
            params: { email: email }
          });
        } else {
          // For login verification, navigate to appropriate dashboard
          if (response.user?.role === 'teacher') {
            router.replace('/(tabs)/TeacherDashBoard' as any);
          } else {
            router.replace('/(tabs)/StudentDashBoard' as any);
          }
        }
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP. Please try again.');
        // Reset OTP inputs
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
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
      const response = await authService.sendOTP(email, '', isSignup, '');
      
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

            {/* OTP Section */}
            <View style={webStyles.otpSection}>
              <Text style={webStyles.otpTitle}>
                Verify Your Email
              </Text>
              <Text style={webStyles.otpSubtitle}>
                We've sent a 4-digit verification code to{'\n'}
                <Text style={webStyles.emailText}>{email}</Text>
              </Text>

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
          We've sent a 6-digit verification code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

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
    fontSize: 42,
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
    marginBottom: 32,
  },
  emailText: {
    color: '#7C4DDB',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 12,
  },
  otpInputContainer: {
    width: 50,
    height: 50,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 20,
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
    marginBottom: 32,
    paddingHorizontal: 20,
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
});
