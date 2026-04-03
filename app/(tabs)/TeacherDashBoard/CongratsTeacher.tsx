import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  Platform
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { 
  Feather, 
  Ionicons, 
  MaterialCommunityIcons,
  FontAwesome5 
} from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get("window");

export default function CongratsTeacher() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [teacherName, setTeacherName] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [daysSinceJoining, setDaysSinceJoining] = useState(0);
  const [screenWidth, setScreenWidth] = useState(width);
  const [screenHeight, setScreenHeight] = useState(height);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  useEffect(() => {
    const onChange = ({ window }: any) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    };
    const subscription = Dimensions.addEventListener?.('change', onChange);
    return () => subscription?.remove?.();
  }, []);

  useEffect(() => {
    // Get data from route params
    if (params.teacherName) {
      setTeacherName(params.teacherName as string);
    }
    if (params.createdAt) {
      console.log('🔍 CongratsTeacher - createdAt param:', params.createdAt);
      const joinDate = new Date(params.createdAt as string);
      console.log('📅 CongratsTeacher - parsed joinDate:', joinDate);
      setDateOfJoining(formatDate(joinDate));
      const days = calculateDaysSince(joinDate);
      console.log('📊 CongratsTeacher - calculated days:', days);
      setDaysSinceJoining(days);
    }

    // Start entrance animations
    startAnimations();
  }, [params]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const calculateDaysSince = (startDate: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleBackPress = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSharePress = async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Add share functionality here
  };

  // Responsive sizing functions
  const getResponsiveSize = (baseSize: number) => {
    const scaleFactor = Math.min(screenWidth / 375, screenHeight / 812);
    return baseSize * scaleFactor;
  };

  const getBreakpoints = () => ({
    isSmallMobile: screenWidth < 360,
    isMobile: screenWidth < 768,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024,
    isLargeDesktop: screenWidth >= 1440,
  });

  const { isSmallMobile, isMobile, isTablet, isDesktop, isLargeDesktop } = getBreakpoints();

  const styles = createStyles(screenWidth, screenHeight);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <Animated.View
          style={[
            styles.floatingCircle,
            {
              transform: [
                {
                  translateX: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
                {
                  translateY: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle2,
            {
              transform: [
                {
                  translateX: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
                {
                  translateY: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Header with Back Arrow and Share Button */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={getResponsiveSize(24)} color="#2C3E50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSharePress} style={styles.shareButton}>
          <Feather name="share-2" size={getResponsiveSize(20)} color="#2C3E50" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Congratulations Section */}
        <Animated.View
          style={[
            styles.congratsSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          <View style={styles.badgeContainer}>
            <Animated.View
              style={[
                styles.badge,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="trophy" size={getResponsiveSize(32)} color="#FFD700" />
            </Animated.View>
          </View>
          
          <Text style={styles.congratsText}>Congratulations,</Text>
          <Text style={styles.nameText}>{teacherName}!</Text>
          <Text style={styles.subtitleText}>
            Celebrating your dedication and passion for education
          </Text>
          
          {/* Achievement Badges */}
          <View style={styles.achievementBadges}>
            <View style={styles.achievementBadge}>
              <MaterialCommunityIcons name="star" size={getResponsiveSize(16)} color="#FF6B6B" />
              <Text style={styles.achievementText}>Excellence</Text>
            </View>
            <View style={styles.achievementBadge}>
              <MaterialCommunityIcons name="medal" size={getResponsiveSize(16)} color="#4ECDC4" />
              <Text style={styles.achievementText}>Dedication</Text>
            </View>
            <View style={styles.achievementBadge}>
              <FontAwesome5 name="graduation-cap" size={getResponsiveSize(16)} color="#45B7D1" />
              <Text style={styles.achievementText}>Expertise</Text>
            </View>
          </View>
        </Animated.View>

        {/* Enhanced Image Section */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.imageWrapper}>
            <Image
              source={require("../../../assets/image/congratsTeacher.png")}
              style={styles.mainImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
            <View style={styles.imageFrame} />
          </View>
        </Animated.View>

        {/* Enhanced Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }],
            }
          ]}
        >
          {/* Joining Date Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={getResponsiveSize(24)} color="#667EEA" />
              </View>
              <Text style={styles.statLabel}>Date of Joining</Text>
            </View>
            <Text style={styles.statValue}>{dateOfJoining}</Text>
            <View style={styles.statProgress}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Days Counter Card */}
          <View style={[styles.statCard, styles.highlightedCard]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, styles.highlightedIcon]}>
                <Ionicons name="time" size={getResponsiveSize(24)} color="#FFFFFF" />
              </View>
              <Text style={styles.statLabel}>Days of Excellence</Text>
            </View>
            <Text style={[styles.statValue, styles.highlightedValue]}>{daysSinceJoining}</Text>
            <View style={styles.milestoneBadges}>
              <View style={styles.milestoneBadge}>
                <Text style={styles.milestoneText}>
                  {daysSinceJoining >= 365 ? '🏆 Year+' : 
                   daysSinceJoining >= 100 ? '⭐ 100+ Days' : 
                   daysSinceJoining >= 30 ? '🌟 Month+' : '🚀 Rising Star'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 2) }],
            }
          ]}
        >
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View Dashboard</Text>
            <Feather name="arrow-right" size={getResponsiveSize(18)} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Share Achievement</Text>
            <Feather name="share" size={getResponsiveSize(16)} color="#667EEA" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation userType="teacher" />
    </View>
  );
}

const createStyles = (screenWidth: number, screenHeight: number) => {
  const getResponsiveSize = (baseSize: number) => {
    const scaleFactor = Math.min(screenWidth / 375, screenHeight / 812);
    return baseSize * scaleFactor;
  };

  const getBreakpoints = () => ({
    isSmallMobile: screenWidth < 360,
    isMobile: screenWidth < 768,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024,
    isLargeDesktop: screenWidth >= 1440,
  });

  const { isSmallMobile, isMobile, isTablet, isDesktop, isLargeDesktop } = getBreakpoints();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
      position: 'relative',
    },
    
    // Background Elements
    backgroundElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },
    floatingCircle: {
      position: 'absolute',
      top: getResponsiveSize(100),
      right: getResponsiveSize(-50),
      width: getResponsiveSize(200),
      height: getResponsiveSize(200),
      borderRadius: getResponsiveSize(100),
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
    },
    floatingCircle2: {
      position: 'absolute',
      bottom: getResponsiveSize(150),
      left: getResponsiveSize(-50),
      width: getResponsiveSize(150),
      height: getResponsiveSize(150),
      borderRadius: getResponsiveSize(75),
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: getResponsiveSize(50),
      paddingHorizontal: getResponsiveSize(24),
      paddingBottom: getResponsiveSize(16),
      zIndex: 10,
    },
    backButton: {
      width: getResponsiveSize(48),
      height: getResponsiveSize(48),
      borderRadius: getResponsiveSize(24),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    shareButton: {
      width: getResponsiveSize(48),
      height: getResponsiveSize(48),
      borderRadius: getResponsiveSize(24),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // ScrollView
    scrollView: {
      flex: 1,
      zIndex: 1,
    },
    scrollContent: {
      paddingHorizontal: getResponsiveSize(24),
      paddingBottom: getResponsiveSize(100),
    },

    // Congratulations Section
    congratsSection: {
      alignItems: 'center',
      marginTop: getResponsiveSize(20),
      marginBottom: getResponsiveSize(32),
    },
    badgeContainer: {
      marginBottom: getResponsiveSize(24),
    },
    badge: {
      width: getResponsiveSize(80),
      height: getResponsiveSize(80),
      borderRadius: getResponsiveSize(40),
      backgroundColor: '#667EEA',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    congratsText: {
      fontSize: getResponsiveSize(28),
      fontFamily: "Poppins_700Bold",
      color: "#1A202C",
      textAlign: "center",
      lineHeight: getResponsiveSize(34),
      marginBottom: getResponsiveSize(8),
    },
    nameText: {
      fontSize: getResponsiveSize(32),
      fontFamily: "Poppins_700Bold",
      color: "#667EEA",
      textAlign: "center",
      lineHeight: getResponsiveSize(38),
      marginBottom: getResponsiveSize(16),
    },
    subtitleText: {
      fontSize: getResponsiveSize(16),
      fontFamily: "Poppins_400Regular",
      color: "#718096",
      textAlign: "center",
      lineHeight: getResponsiveSize(24),
      paddingHorizontal: getResponsiveSize(20),
      marginBottom: getResponsiveSize(24),
    },
    
    // Achievement Badges
    achievementBadges: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: getResponsiveSize(12),
    },
    achievementBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: getResponsiveSize(12),
      paddingVertical: getResponsiveSize(8),
      borderRadius: getResponsiveSize(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    achievementText: {
      fontSize: getResponsiveSize(12),
      fontFamily: "Poppins_500Medium",
      color: "#4A5568",
      marginLeft: getResponsiveSize(6),
    },

    // Image Section
    imageContainer: {
      marginBottom: getResponsiveSize(32),
    },
    imageWrapper: {
      position: 'relative',
      width: '100%',
      height: getResponsiveSize(250),
      borderRadius: getResponsiveSize(20),
      overflow: 'hidden',
    },
    mainImage: {
      width: '100%',
      height: '100%',
      borderRadius: getResponsiveSize(20),
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderRadius: getResponsiveSize(20),
    },
    imageFrame: {
      position: 'absolute',
      top: getResponsiveSize(4),
      left: getResponsiveSize(4),
      right: getResponsiveSize(4),
      bottom: getResponsiveSize(4),
      borderWidth: getResponsiveSize(2),
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: getResponsiveSize(16),
    },

    // Stats Container
    statsContainer: {
      marginBottom: getResponsiveSize(32),
      gap: getResponsiveSize(16),
    },
    statCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveSize(16),
      padding: getResponsiveSize(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    highlightedCard: {
      backgroundColor: '#667EEA',
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: getResponsiveSize(12),
    },
    statIconContainer: {
      width: getResponsiveSize(48),
      height: getResponsiveSize(48),
      borderRadius: getResponsiveSize(24),
      backgroundColor: '#EDF2F7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: getResponsiveSize(12),
    },
    highlightedIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statLabel: {
      fontSize: getResponsiveSize(14),
      fontFamily: "Poppins_500Medium",
      color: "#4A5568",
      flex: 1,
    },
    statValue: {
      fontSize: getResponsiveSize(24),
      fontFamily: "Poppins_700Bold",
      color: "#1A202C",
      marginBottom: getResponsiveSize(12),
    },
    highlightedValue: {
      color: '#FFFFFF',
      fontSize: getResponsiveSize(36),
    },
    statProgress: {
      marginTop: getResponsiveSize(8),
    },
    progressBar: {
      height: getResponsiveSize(6),
      backgroundColor: '#E2E8F0',
      borderRadius: getResponsiveSize(3),
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#667EEA',
      borderRadius: getResponsiveSize(3),
    },
    milestoneBadges: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    milestoneBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: getResponsiveSize(12),
      paddingVertical: getResponsiveSize(6),
      borderRadius: getResponsiveSize(12),
    },
    milestoneText: {
      fontSize: getResponsiveSize(12),
      fontFamily: "Poppins_500Medium",
      color: '#FFFFFF',
    },

    // Action Container
    actionContainer: {
      gap: getResponsiveSize(16),
      marginBottom: getResponsiveSize(32),
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#667EEA',
      paddingVertical: getResponsiveSize(18),
      paddingHorizontal: getResponsiveSize(24),
      borderRadius: getResponsiveSize(12),
      shadowColor: '#667EEA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryButtonText: {
      fontSize: getResponsiveSize(16),
      fontFamily: "Poppins_600SemiBold",
      color: '#FFFFFF',
      marginRight: getResponsiveSize(8),
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      paddingVertical: getResponsiveSize(16),
      paddingHorizontal: getResponsiveSize(24),
      borderRadius: getResponsiveSize(12),
      borderWidth: getResponsiveSize(2),
      borderColor: '#667EEA',
    },
    secondaryButtonText: {
      fontSize: getResponsiveSize(16),
      fontFamily: "Poppins_500Medium",
      color: '#667EEA',
      marginRight: getResponsiveSize(8),
    },
  });
};