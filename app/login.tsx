import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  // Only show split layout on web
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <View style={styles.container}>
        {/* Left Column - Background Image */}
        <View style={styles.leftColumn}>
          <ImageBackground
            source={require('../assets/images/login-background.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        {/* Right Column - Content */}
        <View style={styles.rightColumn}>
          <View style={styles.content}>
            {/* Welcome Title */}
            <Text style={styles.welcomeTitle}>
              Welcome to the app {'\n'}& let's get started
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              This app is the best app, thank you for downloading it.{'\n'}You won't regret using it.
            </Text>

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.signupButton}>
              <Text style={styles.signupButtonText}>Sign up</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Log in</Text>
            </TouchableOpacity>

            {/* Terms and Conditions */}
            <Text style={styles.termsText}>
              By signing up, I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions{'\n'}and Privacy Policy.</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Mobile fallback
  return (
    <View style={styles.mobileContainer}>
      <View style={styles.mobileContent}>
        {/* Welcome Title */}
        <Text style={styles.mobileWelcomeTitle}>
          Welcome to the app {'\n'}& let's get started
        </Text>

        {/* Description */}
        <Text style={styles.mobileDescription}>
          This app is the best app, thank you for downloading it.{'\n'}You won't regret using it.
        </Text>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupButtonText}>Sign up</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>

        {/* Terms and Conditions */}
        <Text style={styles.mobileTermsText}>
          By signing up, I agree to the{' '}
          <Text style={styles.termsLink}>Terms and Conditions{'\n'}and Privacy Policy.</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: width * 0.5,
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 44,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  signupButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 50,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 50,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#7C4DDB',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  termsLink: {
    color: '#555555',
  },
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mobileContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  mobileWelcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  mobileDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  mobileTermsText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
