import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform, StatusBar, Animated, Linking } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const windowWidth = width;

export default function InitialScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [signupScale] = useState(new Animated.Value(1));
  const [loginScale] = useState(new Animated.Value(1));
  const [backTarget, setBackTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isWeb) {
      try {
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('returnTo') || params.get('from');
        if (returnTo) {
          setBackTarget(returnTo);
          return;
        }
        if (document.referrer) {
          setBackTarget(document.referrer);
          return;
        }
      } catch (e) {
        // ignore
      }
    } else {
      // for native apps we can accept a deep link param via router params if provided
      try {
        // @ts-ignore - expo router small differences
        const routeParams = (router as any).query || {};
        if (routeParams?.returnTo) setBackTarget(routeParams.returnTo as string);
      } catch (e) {}
    }
  }, [isWeb, router]);

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
          {/* Back button - smart navigation */}
          <View style={webStyles.backWrapper}>
            <TouchableOpacity
              onPress={() => {
                if (backTarget) {
                  // If it's an absolute URL, navigate using window.location
                  if (backTarget.startsWith('http')) {
                    window.location.href = backTarget;
                    return;
                  }
                  // internal path
                  router.replace(backTarget as any);
                  return;
                }
                // fallback to router.back()
                try {
                  router.back();
                } catch (e) {
                  router.replace('/');
                }
              }}
              style={webStyles.backButton}
            >
              <Text style={webStyles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity
            style={styles.mobileBack}
            onPress={() => {
              if (backTarget) {
                // deep link or external url
                if (backTarget.startsWith('http')) {
                  Linking.openURL(backTarget).catch(() => router.replace('/'));
                  return;
                }
                router.replace(backTarget as any);
                return;
              }
              router.back();
            }}
          >
            <Text style={styles.mobileBackText}>{'←'}</Text>
          </TouchableOpacity>
          <View style={styles.mobileLogo}>
            <Text style={styles.mobileLogoText}>GS</Text>
          </View>
          <Text style={styles.mobileBrandTitle}>GoGrowSmart</Text>
          <Text style={styles.mobileBrandSubtitle}>Learn • Grow • Succeed</Text>
        </View>

        {/* Welcome Title */}
        <Text style={styles.mobileWelcomeTitle}>
          Welcome to{'\n'}GoGrowSmart
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
  backWrapper: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 50,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
    paddingVertical: 36,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 40,
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
    marginBottom: 40,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#7C4DDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
    paddingVertical: 18,
    paddingHorizontal: 36,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  mobileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mobileBack: {
    position: 'absolute',
    left: 16,
    top: 12,
    padding: 8,
    zIndex: 30,
  },
  mobileBackText: {
    fontSize: 20,
    color: '#7C4DDB',
    fontWeight: '700',
  },
  mobileLogo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C4DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  mobileDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#7C4DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 360,
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
