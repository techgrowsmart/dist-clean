import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, Animated } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function InitialScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [signupScale] = useState(new Animated.Value(1));
  const [loginScale] = useState(new Animated.Value(1));

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

  const handleSignup = () => {
    animateButton(signupScale, () => {
      router.push({ pathname: '/auth/EmailInputScreen' as any, params: { type: 'signup' } });
    });
  };

  const handleLogin = () => {
    animateButton(loginScale, () => {
      router.push('/auth/LoginOptionsScreen');
    });
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
          </ImageBackground>
        </View>

        {/* Right Column - Content */}
        <View style={webStyles.rightColumn}>
          <View style={webStyles.content}>
            {/* Welcome Section */}
            <View style={webStyles.welcomeSection}>
              <Text style={webStyles.welcomeTitle}>
                Welcome to{'\n'}GrowSmart
              </Text>
              <Text style={webStyles.welcomeSubtitle}>
                The future of learning is here. Join thousands of students and teachers on the most innovative education platform.
              </Text>
            </View>

            {/* Buttons Section */}
            <View style={webStyles.buttonsSection}>
              <Animated.View style={[{ transform: [{ scale: signupScale }] }]}>
                <TouchableOpacity 
                  style={webStyles.signupButton} 
                  onPress={handleSignup}
                  activeOpacity={0.8}
                >
                  <Text style={webStyles.signupButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={[{ transform: [{ scale: loginScale }] }]}>
                <TouchableOpacity 
                  style={webStyles.loginButton} 
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={webStyles.loginButtonText}>Log In</Text>
                </TouchableOpacity>
              </Animated.View>
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
          <View style={styles.mobileLogo}>
            <Text style={styles.mobileLogoText}>GS</Text>
          </View>
        </View>

        {/* Welcome Title */}
        <Text style={styles.mobileWelcomeTitle}>
          Welcome to{'\n'}GrowSmart
        </Text>

        {/* Description */}
        <Text style={styles.mobileDescription}>
          The future of learning is here. Join thousands of students and teachers.
        </Text>

        {/* Buttons */}
        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
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
    minWidth: 400,
    backgroundColor: '#3131b0',
    position: 'relative',
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
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 56,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  buttonsSection: {
    width: '100%',
    marginBottom: 60,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 20,
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
    elevation: 12,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#7C4DDB',
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#7C4DDB',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsSection: {
    alignItems: 'center',
    width: '100%',
  },
  termsText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  termsLink: {
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
    padding: 24,
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mobileLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  mobileLogoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mobileBrandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  mobileBrandSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  mobileWelcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
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
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#7C4DDB',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
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
