import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === 'web' && width >= 768;
  const router = useRouter();

  return (
    <View style={styles.container}>
      {isLargeScreen && (
        <View style={styles.leftContainer}>
          <Image source={require('../../assets/image/Login-screen.png')} style={styles.backgroundImage} resizeMode="cover" />
        </View>
      )}

      <View style={[styles.rightContainer, !isLargeScreen && styles.rightContainerMobile]}>
        <View style={styles.formContainer}>
          <Text style={[styles.welcomeText, !isLargeScreen && styles.welcomeTextMobile]}>Welcome to the app {'\n'}& let's get started</Text>

          <Text style={styles.descriptionText}>This app is the best app, thank you for downloading it.{'\n'}You won't regret using it.</Text>

          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/SignUp')}>
            <Text style={styles.signupButtonText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/Login')}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By signing up, I agree to the{' '}
            <Text style={styles.termsLink}>Terms and Conditions{'\n'}and Privacy Policy.</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff' },
  leftContainer: { flex: 1 },
  backgroundImage: { width: '100%', height: '100%' },
  rightContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 60 },
  rightContainerMobile: { paddingHorizontal: 24 },
  formContainer: { width: '100%', maxWidth: 440, alignItems: 'center' },
  welcomeText: { fontSize: 36, fontWeight: '800', color: '#000000', marginBottom: 20, textAlign: 'center', lineHeight: 44 },
  welcomeTextMobile: { fontSize: 28, lineHeight: 36 },
  descriptionText: { fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  signupButton: { backgroundColor: '#7C4DDB', paddingVertical: 18, borderRadius: 50, marginBottom: 12, width: '100%', alignItems: 'center' },
  signupButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  loginButton: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#7C4DDB', paddingVertical: 18, borderRadius: 50, marginBottom: 24, width: '100%', alignItems: 'center' },
  loginButtonText: { color: '#7C4DDB', fontSize: 15, fontWeight: '600' },
  termsText: { fontSize: 13, color: '#555555', textAlign: 'center', lineHeight: 20 },
  termsLink: { color: '#555555' },
});
