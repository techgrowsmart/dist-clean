import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Animated, Dimensions, ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../../services/authService';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const email = params.email as string || '';
  const name = params.name as string || '';
  const phone = params.phone as string || '';
  const [studentScale] = useState(new Animated.Value(1));
  const [teacherScale] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(false);

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

  const handleStudentRole = async () => {
    animateButton(studentScale, async () => {
      setLoading(true);
      try {
        await authService.updateRole(email, 'student');
      } catch (error: any) {
        console.error('Update role error:', error);
        // Continue to profile even if role update fails
      } finally {
        setLoading(false);
        // Navigate to student profile page with name and phone
        router.push({ 
          pathname: '/(tabs)/StudentDashBoard/Profile' as any, 
          params: { 
            email: email,
            name: name,
            phone: phone
          } 
        });
      }
    });
  };

  const handleTeacherRole = async () => {
    animateButton(teacherScale, async () => {
      setLoading(true);
      try {
        await authService.updateRole(email, 'teacher');
        // Navigate to teacher registration step 2 with name and phone
        router.push({ 
          pathname: '/auth/TeacherRegistration2' as any, 
          params: { 
            email: email,
            name: name,
            phone: phone
          } 
        });
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to set role. Please try again.');
      } finally {
        setLoading(false);
      }
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
                Welcome!{'\n'}Choose Your Role
              </Text>
              <Text style={webStyles.roleSubtitle}>
                How would you like to use GoGrowSmart?
              </Text>

              {/* Role Options */}
              <View style={webStyles.roleOptions}>
                <Animated.View style={[{ transform: [{ scale: studentScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleStudentRole}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>🎓</Text>
                    </View>
                    <View style={webStyles.roleContent}>
                      <Text style={webStyles.roleButtonTitle}>Student</Text>
                      <Text style={webStyles.roleButtonDesc}>Learn and grow with expert teachers</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[{ transform: [{ scale: teacherScale }] }]}>
                  <TouchableOpacity 
                    style={webStyles.roleButton} 
                    onPress={handleTeacherRole}
                    activeOpacity={0.8}
                  >
                    <View style={webStyles.roleIcon}>
                      <Text style={webStyles.roleIconText}>👨‍🏫</Text>
                    </View>
                    <View style={webStyles.roleContent}>
                      <Text style={webStyles.roleButtonTitle}>Teacher</Text>
                      <Text style={webStyles.roleButtonDesc}>Share your knowledge and inspire students</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
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
          Welcome!{'\n'}Choose Your Role
        </Text>

        {/* Mobile Description */}
        <Text style={styles.mobileRoleSubtitle}>
          How would you like to use GoGrowSmart?
        </Text>

        {/* Mobile Role Options */}
        <View style={styles.mobileRoleOptions}>
          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleStudentRole}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>🎓</Text>
            </View>
            <View style={styles.mobileRoleContent}>
              <Text style={styles.mobileRoleButtonTitle}>Student</Text>
              <Text style={styles.mobileRoleButtonDesc}>Learn and grow with expert teachers</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mobileRoleButton} onPress={handleTeacherRole}>
            <View style={styles.mobileRoleIcon}>
              <Text style={styles.mobileRoleIconText}>👨‍🏫</Text>
            </View>
            <View style={styles.mobileRoleContent}>
              <Text style={styles.mobileRoleButtonTitle}>Teacher</Text>
              <Text style={styles.mobileRoleButtonDesc}>Share your knowledge and inspire students</Text>
            </View>
          </TouchableOpacity>
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
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.4)',
    elevation: 16,
  },
  leftLogoText: {
    fontSize: 40,
    fontWeight: '900',
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
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)',
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
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  mobileBackButton: {
    alignSelf: 'flex-start',
  },
  mobileBackButtonText: {
    fontSize: 16,
    color: '#7C4DDB',
    fontWeight: '600',
  },
  mobileRoleTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 60,
  },
  mobileRoleSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  mobileRoleOptions: {
    width: '100%',
    gap: 16,
  },
  mobileRoleButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 4,
  },
  mobileRoleIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mobileRoleIconText: {
    fontSize: 24,
  },
  mobileRoleContent: {
    flex: 1,
  },
  mobileRoleButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  mobileRoleButtonDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
