import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

export default function SignupOptionsScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [studentScale] = useState(new Animated.Value(1));
  const [teacherScale] = useState(new Animated.Value(1));

  const animateButton = (scaleAnim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const handleStudentSignup = () => {
    animateButton(studentScale, () => {
      router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'signup', role: 'student' } });
    });
  };

  const handleTeacherSignup = () => {
    animateButton(teacherScale, () => {
      router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'signup', role: 'teacher' } });
    });
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
            <View style={webStyles.overlayContent}>
              <View style={webStyles.leftLogo}>
                <Text style={webStyles.leftLogoText}>GS</Text>
              </View>
              <Text style={webStyles.brandTitle}>GoGrowSmart</Text>
              <Text style={webStyles.brandSubtitle}>Join Our Learning Community</Text>
            </View>
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

            {/* Role Selection Section */}
            <View style={webStyles.roleSection}>
              <Text style={webStyles.roleTitle}>
                Choose Your Role
              </Text>
              <Text style={webStyles.roleSubtitle}>
                Select how you want to join GoGrowSmart
              </Text>

              {/* Role Options */}
              <View style={webStyles.roleOptions}>
                <Animated.View style={[{ transform: [{ scale: studentScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleStudentSignup}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>🎓</Text>
                    </View>
                    <Text style={webStyles.roleButtonTitle}>Student</Text>
                    <Text style={webStyles.roleButtonDesc}>Learn and grow with expert teachers</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[{ transform: [{ scale: teacherScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleTeacherSignup}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>👨‍🏫</Text>
                    </View>
                    <Text style={webStyles.roleButtonTitle}>Teacher</Text>
                    <Text style={webStyles.roleButtonDesc}>Share your knowledge and inspire students</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
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

        {/* Mobile Title */}
        <Text style={styles.mobileRoleTitle}>
          Choose Your Role
        </Text>

        {/* Mobile Description */}
        <Text style={styles.mobileRoleSubtitle}>
          Select how you want to join GoGrowSmart
        </Text>

        {/* Mobile Role Options */}
        <View style={styles.mobileRoleOptions}>
          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleStudentSignup}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>🎓</Text>
            </View>
            <Text style={styles.mobileRoleButtonTitle}>Student</Text>
            <Text style={styles.mobileRoleButtonDesc}>Learn and grow with expert teachers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleTeacherSignup}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>👨‍🏫</Text>
            </View>
            <Text style={styles.mobileRoleButtonTitle}>Teacher</Text>
            <Text style={styles.mobileRoleButtonDesc}>Share your knowledge and inspire students</Text>
          </TouchableOpacity>
        </View>

        {/* Mobile Terms */}
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
    minWidth: 400,
    backgroundColor: '#3131b0',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 49, 176, 0.4)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  leftLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
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
    elevation: 16,
  },
  leftLogoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#3131b0',
  },
  brandTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
    paddingVertical: 40,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: '100%',
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  roleSection: {
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
  },
  roleTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 56,
  },
  roleSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  roleOptions: {
    width: '100%',
    gap: 20,
  },
  roleButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  roleIcon: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  roleIconText: {
    fontSize: 28,
  },
  roleContent: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  roleButtonDesc: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  helpSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpLink: {
    color: '#7C4DDB',
    textDecorationLine: 'underline',
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
  mobileRoleTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileRoleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  mobileRoleOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  mobileRoleButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mobileRoleIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mobileRoleIconText: {
    fontSize: 20,
  },
  mobileRoleButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  mobileRoleButtonDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
