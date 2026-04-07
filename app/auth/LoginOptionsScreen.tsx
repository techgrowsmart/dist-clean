import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');
const windowWidth = width;

export default function LoginOptionsScreen() {
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

  const handleStudentLogin = () => {
    animateButton(studentScale, () => {
      router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'login', role: 'student' } });
    });
  };

  const handleTeacherLogin = () => {
    animateButton(teacherScale, () => {
      router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'login', role: 'teacher' } });
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

            {/* Role Selection Section */}
            <View style={webStyles.roleSection}>
              <Text style={webStyles.roleTitle}>
                Login As
              </Text>
              <Text style={webStyles.roleSubtitle}>
                Select your role to continue to your account
              </Text>

              {/* Role Options */}
              <View style={webStyles.roleOptions}>
                <Animated.View style={[{ transform: [{ scale: studentScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleStudentLogin}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>🎓</Text>
                    </View>
                    <View style={webStyles.roleContent}>
                      <Text style={webStyles.roleButtonTitle}>Student</Text>
                      <Text style={webStyles.roleButtonDesc}>Access your courses and progress</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[{ transform: [{ scale: teacherScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleTeacherLogin}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>👨‍🏫</Text>
                    </View>
                    <View style={webStyles.roleContent}>
                      <Text style={webStyles.roleButtonTitle}>Teacher</Text>
                      <Text style={webStyles.roleButtonDesc}>Manage your classes and students</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Help Section */}
            <View style={webStyles.helpSection}>
              <Text style={webStyles.helpText}>
                Need help?{' '}
                <Text style={webStyles.helpLink}>Contact Support</Text>
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
          Login As
        </Text>

        {/* Mobile Description */}
        <Text style={styles.mobileRoleSubtitle}>
          Select your role to continue to your account
        </Text>

        {/* Mobile Role Options */}
        <View style={styles.mobileRoleOptions}>
          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleStudentLogin}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>🎓</Text>
            </View>
            <View style={styles.mobileRoleContent}>
              <Text style={styles.mobileRoleButtonTitle}>Student</Text>
              <Text style={styles.mobileRoleButtonDesc}>Access your courses and progress</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleTeacherLogin}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>👨‍🏫</Text>
            </View>
            <View style={styles.mobileRoleContent}>
              <Text style={styles.mobileRoleButtonTitle}>Teacher</Text>
              <Text style={styles.mobileRoleButtonDesc}>Manage your classes and students</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mobile Help */}
        <View style={styles.mobileHelpSection}>
          <Text style={styles.mobileHelpText}>
            Need help?{' '}
            <Text style={styles.helpLink}>Contact Support</Text>
          </Text>
        </View>
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
    ...(Platform.OS === 'web' && { textShadow: '2px 2px 6px rgba(0, 0, 0, 0.4)' }),
  },
  brandSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    ...(Platform.OS === 'web' && { textShadow: '1px 1px 3px rgba(0, 0, 0, 0.4)' }),
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '6%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    paddingVertical: 36,
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
    fontSize: 40,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 56,
  },
  roleSubtitle: {
    fontSize: 16,
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
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  roleIconText: {
    fontSize: 28,
  },
  roleContent: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  roleButtonDesc: {
    fontSize: 14,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileRoleSubtitle: {
    fontSize: 15,
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mobileRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mobileRoleIconText: {
    fontSize: 20,
  },
  mobileRoleContent: {
    flex: 1,
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
  mobileHelpSection: {
    alignItems: 'center',
  },
  mobileHelpText: {
    fontSize: 12,
    color: '#6B7280',
  },
  helpLink: {
    color: '#7C4DDB',
    fontWeight: '600',
  },
});
