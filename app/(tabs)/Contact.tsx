import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  View,
  StyleSheet,
  TextInput,
  Linking,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Keyboard,
} from "react-native";
import { Ionicons, FontAwesome, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import BackButton from "../../components/BackButton";
import TeacherWebHeader from '../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../components/ui/TeacherWebSidebar';
import { getAuthData } from '../../utils/authStorage';
import Clipboard from '@react-native-clipboard/clipboard';
import * as Haptics from 'expo-haptics';

const Contact = () => {
  // Enhanced state management with AI features
  const [message, setMessage] = useState("");
  const navigation = useNavigation();
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Contact');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Advanced animation refs
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // AI-powered features
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAnalyzingMessage, setIsAnalyzingMessage] = useState(false);
  const [messageSentiment, setMessageSentiment] = useState<'neutral' | 'positive' | 'negative'>('neutral');
  const [quickReplies, setQuickReplies] = useState([
    'I need help with my account',
    'Report a technical issue',
    'Request a feature',
    'Billing inquiry',
    'Partnership opportunity',
    'Other'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);

  // Enhanced responsive breakpoints
  const isTinyMobile = screenWidth < 320;
  const isSmallMobile = screenWidth < 375;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isLargeDesktop = screenWidth >= 1440;
  
  // Advanced dynamic sizing
  const getIconSize = () => {
    if (isTinyMobile) return 16;
    if (isSmallMobile) return 18;
    if (isMobile) return 20;
    if (isTablet) return 22;
    if (isDesktop) return 24;
    return 26;
  };
  
  const getHeaderIconSize = () => {
    if (isTinyMobile) return 24;
    if (isSmallMobile) return 28;
    if (isMobile) return 32;
    if (isTablet) return 36;
    if (isDesktop) return 40;
    return 44;
  };
  
  const getFontSize = (type: 'title' | 'subtitle' | 'body' | 'caption' | 'small') => {
    const baseSizes = {
      title: isTinyMobile ? wp('7%') : isSmallMobile ? wp('7.5%') : isMobile ? wp('8%') : isTablet ? wp('6%') : wp('5%'),
      subtitle: isTinyMobile ? wp('4%') : isSmallMobile ? wp('4.2%') : isMobile ? wp('4.5%') : isTablet ? wp('3.5%') : wp('3%'),
      body: isTinyMobile ? wp('3.5%') : isSmallMobile ? wp('3.7%') : isMobile ? wp('4%') : isTablet ? wp('3%') : wp('2.5%'),
      caption: isTinyMobile ? wp('2.5%') : isSmallMobile ? wp('2.8%') : isMobile ? wp('3%') : isTablet ? wp('2.5%') : wp('2%'),
    };
    return baseSizes[type];
  };

  // Advanced AI-powered message analysis
  const analyzeMessage = useCallback(async (text: string) => {
    if (text.length < 10) return;
    
    setIsAnalyzingMessage(true);
    setTypingIndicator(true);
    
    // Simulate AI analysis with realistic timing
    setTimeout(() => {
      // Simple sentiment analysis based on keywords
      const positiveWords = ['great', 'good', 'excellent', 'love', 'amazing', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'problem', 'issue'];
      
      const lowerText = text.toLowerCase();
      const hasPositive = positiveWords.some(word => lowerText.includes(word));
      const hasNegative = negativeWords.some(word => lowerText.includes(word));
      
      if (hasPositive) {
        setMessageSentiment('positive');
        setAiSuggestions(['Your message sounds positive! We\'ll respond enthusiastically.', 'Thanks for the kind words!', 'We appreciate your positive feedback!']);
      } else if (hasNegative) {
        setMessageSentiment('negative');
        setAiSuggestions(['We understand your concern and will prioritize your message.', 'We\'re sorry to hear about your issue and will help resolve it quickly.', 'Your feedback is important and we\'ll address this promptly.']);
      } else {
        setMessageSentiment('neutral');
        setAiSuggestions(['We\'ll review your message and respond within 24 hours.', 'Thank you for reaching out - we\'ll get back to you soon.', 'Your message has been received and we\'ll respond accordingly.']);
      }
      
      setIsAnalyzingMessage(false);
      setTypingIndicator(false);
      setShowAISuggestions(true);
    }, 1500);
  }, []);

  // Haptic feedback helper
  const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        // Silently fail if haptics not supported
      }
    }
  }, []);

  // Quick reply handler
  const handleQuickReply = useCallback(async (reply: string) => {
    await triggerHaptic('light');
    setMessage(reply);
    setSelectedCategory(reply);
    setShowAISuggestions(false);
    
    // Animate the input
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [triggerHaptic]);

  // Load teacher data for web header and sidebar
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const loadTeacherData = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.name) {
            setTeacherName(authData.name);
          }
          if (authData?.profileImage) {
            setProfileImage(authData.profileImage);
          }
          if (authData?.email) {
            setUserEmail(authData.email);
          }
        } catch (error) {
          console.error('Error loading teacher data:', error);
        }
      };
      loadTeacherData();
    }
  }, []);

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'joinedDate':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact':
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  // Handle screen dimensions and keyboard
  useEffect(() => {
    const onChange = ({ window }: any) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    };
    const subscription = Dimensions.addEventListener?.('change', onChange);
    return () => subscription?.remove?.();
  }, []);

  // Keyboard visibility for mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const keyboardDidShowListener = Keyboard?.addListener?.('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardDidHideListener = Keyboard?.addListener?.('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });
      return () => {
        keyboardDidShowListener?.remove?.();
        keyboardDidHideListener?.remove?.();
      };
    }
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Copy email to clipboard with haptic feedback
  const copyEmailToClipboard = async () => {
    try {
      await Clipboard.setString('contact@gogrowsmart.com');
      setCopiedEmail(true);
      
      // Haptic feedback on supported platforms
      if (Platform.OS === 'ios') {
        // @ts-ignore - HapticFeedback is available on iOS
        const { HapticFeedback } = require('expo-haptics');
        HapticFeedback.notificationAsync(HapticFeedback.NotificationFeedbackType.Success);
      }
      
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (error) {
      console.error('Failed to copy email:', error);
      Alert.alert('Error', 'Failed to copy email address');
    }
  };

  const handleSubmit = async () => {
    if (message.trim() === "") {
      Alert.alert("Error", "Please enter your message before submitting");
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert("Error", "Please enter at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    
    const email = "contact@gogrowsmart.com";
    const subject = "User Problem Report";
    const body = `Message from: ${userEmail || 'Anonymous'}\n\n${message}`;
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (canOpen) {
        await Linking.openURL(mailto);
        Alert.alert("Success", "Email client opened successfully");
        setMessage("");
      } else {
        Alert.alert("Error", "Email client not available. Please contact us directly at contact@gogrowsmart.com");
      }
    } catch (err) {
      console.error('Error opening email client:', err);
      Alert.alert("Error", "Could not open email client. Please contact us directly at contact@gogrowsmart.com");
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    scrollContainer: { 
      flexGrow: 1, 
      backgroundColor: "#f3f4f6",
      paddingHorizontal: isSmallMobile ? wp('4%') : wp('5%'), 
      paddingVertical: isSmallMobile ? hp('3%') : hp('4%'), 
      paddingTop: hp('12%') 
    },
    container: { 
      flex: 1, 
      backgroundColor: "#f3f4f6" 
    },
    // Web-specific styles
    webLayout: {
      flex: 1,
      flexDirection: 'column',
    },
    webContent: {
      flex: 1,
      flexDirection: 'row',
    },
    webMainContent: {
      flex: 1,
      backgroundColor: '#f3f4f6',
    },
    header: { 
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isSmallMobile ? hp('3%') : hp('4%'),
    },
    headerTitle: { 
      fontSize: isSmallMobile ? wp('8%') : wp('7%'), 
      color: "#030303", 
      fontFamily: 'Poppins_700Bold',
      lineHeight: isSmallMobile ? hp('5%') : hp('4%'),
    },
    headerSubtitle: { 
      fontSize: isSmallMobile ? wp('3.8%') : wp('3.5%'), 
      color: "#6b7280", 
      fontFamily: 'Poppins_400Regular',
      marginTop: hp('0.5%'),
    },
    // Enhanced Card Styles
    card: { 
      backgroundColor: "#ffffff", 
      borderRadius: isSmallMobile ? 12 : 16, 
      padding: isSmallMobile ? wp('4%') : wp('5%'), 
      marginBottom: isSmallMobile ? hp('2.5%') : hp('3%'), 
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.08, 
      shadowRadius: 12, 
      elevation: 6,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    // Input Header
    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isSmallMobile ? hp('2%') : hp('2.5%'),
      gap: isSmallMobile ? wp('2%') : wp('3%'),
    },
    inputTitle: {
      fontSize: isSmallMobile ? wp('4.5%') : wp('4%'),
      color: "#1f2937",
      fontFamily: 'Poppins_600SemiBold',
      fontWeight: '600',
    },
    // Input Container
    inputContainer: {
      position: 'relative',
    },
    input: { 
      borderColor: "#e5e7eb", 
      borderWidth: 1.5, 
      borderRadius: isSmallMobile ? 10 : 12, 
      paddingHorizontal: isSmallMobile ? wp('3.5%') : wp('4%'), 
      paddingVertical: isSmallMobile ? hp('2%') : hp('2.5%'), 
      textAlignVertical: "top", 
      backgroundColor: "#f9fafb", 
      fontSize: isSmallMobile ? wp('3.5%') : wp('3.8%'), 
      color: "#1f2937", 
      marginBottom: hp('2%'), 
      fontFamily: 'Poppins_400Regular',
      minHeight: isSmallMobile ? hp('15%') : hp('18%'),
    },
    // Character Count
    characterCount: {
      position: 'absolute',
      bottom: isSmallMobile ? hp('1%') : hp('1.5%'),
      right: isSmallMobile ? wp('3%') : wp('4%'),
    },
    characterCountText: {
      fontSize: isSmallMobile ? wp('2.5%') : wp('2.8%'),
      color: "#9ca3af",
      fontFamily: 'Poppins_400Regular',
    },
    // Enhanced Button
    sendButton: { 
      backgroundColor: "#4f46e5", 
      paddingVertical: isSmallMobile ? hp('1.8%') : hp('2%'), 
      borderRadius: isSmallMobile ? 10 : 12, 
      alignItems: "center", 
      justifyContent: "center",
      flexDirection: 'row',
      gap: wp('2%'),
      marginTop: hp('1%'),
      shadowColor: "#4f46e5",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    sendButtonDisabled: {
      backgroundColor: "#d1d5db",
      shadowOpacity: 0,
      elevation: 0,
    },
    sendButtonText: { 
      color: "#ffffff", 
      fontSize: isSmallMobile ? wp('3.8%') : wp('4.2%'), 
      fontFamily: 'Poppins_600SemiBold',
      fontWeight: '600',
    },
    contactInfo: { 
      backgroundColor: "#ffffff", 
      borderRadius: isSmallMobile ? 12 : 16, 
      padding: isSmallMobile ? wp('4%') : wp('5%'), 
      marginBottom: isSmallMobile ? hp('2.5%') : hp('3%'), 
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 8, 
      elevation: 4,
    },
    contactItem: { 
      flexDirection: "row", 
      alignItems: "center",
      paddingVertical: isSmallMobile ? hp('1.2%') : hp('1.5%'),
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    contactTextContainer: {
      flex: 1,
      marginLeft: isSmallMobile ? wp('2.5%') : wp('3%'),
    },
    contactLabel: { 
      fontSize: isSmallMobile ? wp('2.8%') : wp('3%'), 
      color: "#6b7280", 
      fontFamily: 'Poppins_400Regular',
      marginBottom: 2,
    },
    contactText: { 
      flex: 1, 
      fontSize: isSmallMobile ? wp('3.3%') : wp('3.5%'), 
      color: "#4f46e5", 
      fontFamily: 'Poppins_600SemiBold',
    },
    copyButton: { 
      padding: isSmallMobile ? wp('2%') : wp('2.5%'),
      borderRadius: isSmallMobile ? 6 : 8,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: isSmallMobile ? 32 : 40,
      height: isSmallMobile ? 32 : 40,
    },
    iconCircle: { 
      width: isSmallMobile ? 36 : 40, 
      height: isSmallMobile ? 36 : 40, 
      borderRadius: isSmallMobile ? 18 : 20, 
      backgroundColor: "#e0e7ff", 
      justifyContent: "center", 
      alignItems: "center", 
    },
    socialSection: { 
      alignItems: "center",
      backgroundColor: "#ffffff",
      borderRadius: isSmallMobile ? 12 : 16,
      padding: isSmallMobile ? wp('4%') : wp('5%'),
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 8, 
      elevation: 4,
    },
    socialTitle: { 
      fontSize: isSmallMobile ? wp('5%') : wp('5.5%'), 
      color: "#030303", 
      marginBottom: isSmallMobile ? hp('1.5%') : hp('2%'), 
      fontFamily: 'Poppins_700Bold' 
    },
    socialIcons: { 
      flexDirection: "row", 
      justifyContent: "center", 
      alignItems: "center", 
      gap: isSmallMobile ? wp('3%') : wp('4%') 
    },
    socialButton: { 
      width: isSmallMobile ? 48 : 56, 
      height: isSmallMobile ? 48 : 56, 
      borderRadius: isSmallMobile ? 24 : 28, 
      backgroundColor: "#ffffff", 
      justifyContent: "center", 
      alignItems: "center", 
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 4, 
      elevation: 3,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.04)',
    },
    headerTextContainer: {
      flex: 1,
      alignItems: 'flex-start'
    },
    crossIcon: {
      marginLeft: isSmallMobile ? 8 : 10,
    },
  });

  return (
    // Web Layout - Only show on web
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        {/* Web Header */}
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        {/* Main Content with Sidebar */}
        <View style={styles.webContent}>
          {/* Sidebar */}
          <TeacherWebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail || ''}
          />
          
          {/* Main Content Area */}
          <View style={styles.webMainContent}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.container}>
                {/* Mobile Header - Only show on non-web platforms */}
                {Platform.OS !== 'web' && (
                  <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                      <Text style={styles.headerTitle}>Get in Touch !</Text>
                      <Text style={styles.headerSubtitle}>We'd love to hear from you .</Text>
                    </View>
                    <BackButton size={hp('3.8%')} color="black" onPress={() => navigation.goBack()} style={styles.crossIcon} />
                  </View>
                )}

                {/* Enhanced Input Card with Animation */}
                <Animated.View 
                  style={[
                    styles.card, 
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <View style={styles.inputHeader}>
                    <Ionicons name="chatbubble-ellipses-outline" size={getHeaderIconSize()} color="#4f46e5" />
                    <Text style={styles.inputTitle}>Send us a Message</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, { minHeight: isSmallMobile ? hp('15%') : hp('18%') }]}
                      placeholder="Tell us how we can help you..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      value={message}
                      onChangeText={setMessage}
                      numberOfLines={isSmallMobile ? 4 : 6}
                      textAlignVertical="top"
                      maxLength={1000}
                    />
                    <View style={styles.characterCount}>
                      <Text style={styles.characterCountText}>
                        {message.length}/1000
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={handleSubmit} 
                    style={[
                      styles.sendButton, 
                      isSubmitting && styles.sendButtonDisabled,
                      message.trim().length < 10 && styles.sendButtonDisabled
                    ]}
                    disabled={isSubmitting || message.trim().length < 10}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={getIconSize()} color="#ffffff" />
                        <Text style={styles.sendButtonText}>Send Message</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Contact Info - Enhanced */}
                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="mail" size={20} color="#4f46e5" />
                    </View>
                    <View style={styles.contactTextContainer}>
                      <Text style={styles.contactLabel}>Email</Text>
                      <Text style={styles.contactText}>contact@gogrowsmart.com</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={copyEmailToClipboard}
                    >
                      {copiedEmail ? (
                        <Ionicons name="checkmark" size={getIconSize()} color="#10b981" />
                      ) : (
                        <Ionicons name="copy" size={getIconSize()} color="#4f46e5" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.contactItem}>
                    <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="time" size={20} color="#f59e0b" />
                    </View>
                    <View style={styles.contactTextContainer}>
                      <Text style={styles.contactLabel}>Response Time</Text>
                      <Text style={styles.contactText}>24-48 hours</Text>
                    </View>
                  </View>
                </View>

                {/* Social Media Section */}
                <View style={styles.socialSection}>
                  <Text style={styles.socialTitle}>Follow Us on</Text>
                  <View style={styles.socialIcons}>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="facebook-f" size={24} color="#4255ff" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="instagram" size={24} color="#E4405F" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}><FontAwesome name="linkedin" size={24} color="#0077B5" /></TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <FontAwesome6 name="x-twitter" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    ) : (
      // Mobile Layout
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Get in Touch!</Text>
              <Text style={styles.headerSubtitle}>We'd love to hear from you</Text>
            </View>
            <BackButton size={getHeaderIconSize()} color="black" onPress={() => navigation.goBack()} style={styles.crossIcon} />
          </View>

          {/* Enhanced Input Card with Animation */}
          <Animated.View 
            style={[
              styles.card, 
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.inputHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={getHeaderIconSize()} color="#4f46e5" />
              <Text style={styles.inputTitle}>Send us a Message</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { minHeight: isSmallMobile ? hp('15%') : hp('18%') }]}
                placeholder="Tell us how we can help you..."
                placeholderTextColor="#9ca3af"
                multiline
                value={message}
                onChangeText={setMessage}
                numberOfLines={isSmallMobile ? 4 : 6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {message.length}/1000
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={[
                styles.sendButton, 
                isSubmitting && styles.sendButtonDisabled,
                message.trim().length < 10 && styles.sendButtonDisabled
              ]}
              disabled={isSubmitting || message.trim().length < 10}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={getIconSize()} color="#ffffff" />
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Contact Info - Enhanced */}
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail" size={20} color="#4f46e5" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactText}>contact@gogrowsmart.com</Text>
              </View>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={copyEmailToClipboard}
              >
                {copiedEmail ? (
                  <Ionicons name="checkmark" size={getIconSize()} color="#10b981" />
                ) : (
                  <Ionicons name="copy" size={getIconSize()} color="#4f46e5" />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.contactItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time" size={20} color="#f59e0b" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactLabel}>Response Time</Text>
                <Text style={styles.contactText}>24-48 hours</Text>
              </View>
            </View>
          </View>

          {/* Social Media Section */}
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Follow Us on</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="facebook-f" size={24} color="#4255ff" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="instagram" size={24} color="#E4405F" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}><FontAwesome name="linkedin" size={24} color="#0077B5" /></TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome6 name="x-twitter" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  );
};

export default Contact;