import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground, 
  Dimensions, 
  Platform, 
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';

// use window width when needed via Dimensions.get('window') below

const onboardingData = [
  {
    id: 1,
    title: "Welcome to the app & let's get started",
    description: "This app is the best app, thank you for downloading it. You won't regret using it.",
    image: require('../assets/image/welcome-1.png'),
  },
  {
    id: 2,
    title: "Learn from the best tutors",
    description: "Connect with experienced tutors who will guide you through your learning journey.",
    image: require('../assets/image/welcome-2.png'),
  },
  {
    id: 3,
    title: "Track your progress",
    description: "Monitor your learning progress and achieve your goals with our advanced analytics.",
    image: require('../assets/image/welcome-3.png'),
  },
  {
    id: 4,
    title: "Join our community",
    description: "Be part of a thriving learning community and grow together with fellow learners.",
    image: require('../assets/image/welcome-4.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const windowWidth = Dimensions.get('window').width;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // simple transition animation when index changes
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 220, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [currentIndex, fadeAnim, translateY]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to login/signup on last screen
      router.push('/auth/InitialScreen');
    }
  };

  const handleSkip = () => {
    router.push('/auth/InitialScreen');
  };

  const handleLogin = () => {
    router.push('/auth/InitialScreen');
  };

  const renderProgressIndicators = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressDots}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentIndex ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentScreen = () => {
    const currentItem = onboardingData[currentIndex];
    return (
      <View style={styles.onboardingItem}>
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          {/* Progress Indicators */}
          {renderProgressIndicators()}
          
          {/* Circle with Image */}
          <Animated.View style={styles.circleContainer}>
            <Image source={currentItem.image} style={styles.circleImage} resizeMode="contain" />
          </Animated.View>
          
          {/* Title */}
          <Text style={styles.title}>{currentItem.title}</Text>
          
          {/* Description */}
          <Text style={styles.description}>{currentItem.description}</Text>
          
          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
          
          {/* Login Link */}
          {currentIndex === onboardingData.length - 1 && (
            <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
              <Text style={styles.loginLinkText}>
                You already have an account? Log in
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    );
  };

  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.container}>
        <StatusBar barStyle="light-content" />
        {/* Left Column - Background Image Only */}
        {windowWidth >= 900 && (
          <View style={webStyles.leftColumn}>
            <ImageBackground
              source={require('../assets/images/login-background.jpeg')}
              style={webStyles.backgroundImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Right Column - Onboarding Content */}
        <View style={webStyles.rightColumn}>
          <View style={webStyles.content}>
            {renderCurrentScreen()}
          </View>
        </View>
      </View>
    );
  }

  // Mobile version
  return (
    <View style={styles.mobileContainer}>
      <StatusBar barStyle="dark-content" />
      <ImageBackground
        source={require('../assets/images/login-background.jpeg')}
        style={styles.mobileBackground}
        resizeMode="cover"
      >
        <View style={styles.mobileBackgroundOverlay} />
        {renderCurrentScreen()}
      </ImageBackground>
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
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
});

// Common styles
const styles = StyleSheet.create({
  onboardingItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressDotActive: {
    backgroundColor: '#1A1A1A',
  },
  progressDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  circleContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  circleImage: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#7C4DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loginLink: {
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Mobile-specific styles
  mobileContainer: {
    flex: 1,
  },
  mobileBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mobileBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 49, 176, 0.1)',
  },
});
