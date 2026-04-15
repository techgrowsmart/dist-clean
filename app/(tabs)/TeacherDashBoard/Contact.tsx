import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Keyboard,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import Svg, { Rect, Line, G, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { getAuthData } from '../../../utils/authStorage';
import { BASE_URL } from '../../../config';

// Global Design Tokens
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  primaryGradient: ['#2563EB', '#1D4ED8'],
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#9CA3AF',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  successGreen: '#10B981',
  warningOrange: '#F59E0B',
  gradientBlueStart: '#3B82F6',
  gradientBlueEnd: '#1D4ED8',
};

export default function Contact() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // State management
  const [activeItem, setActiveItem] = useState('Contact Us');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // Responsive breakpoints
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  
  // Dynamic font sizes
  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  // Dynamic spacing
  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
      // Auto-collapse sidebar and thoughts on mobile, expand on desktop
      if (window.width < 768) {
        setSidebarCollapsed(true);
        setIsThoughtsCollapsed(true);
      } else {
        setSidebarCollapsed(false);
        setIsThoughtsCollapsed(false);
      }
    });
    return () => subscription?.remove();
  }, []);

  // Teacher data
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isThoughtsCollapsed, setIsThoughtsCollapsed] = useState(false);

  // Contact form data
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);



  // Handle back button press
  const handleBackPress = () => {
    router.push("/(tabs)/TeacherDashBoard/Teacher");
  };

  // ESC key handler for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleBackPress();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  // Handle sidebar navigation
  const handleSelect = (itemName: string) => {
    setActiveItem(itemName);
    // Navigate based on item
    switch (itemName) {
      case "Dashboard":
        router.push("/(tabs)/TeacherDashBoard/TutorDashboardWeb" as any);
        break;
      case "My Students":
        router.push("/(tabs)/TeacherDashBoard/StudentsEnrolled" as any);
        break;
      case "My Subjects":
        router.push("/(tabs)/TeacherDashBoard/MySubjectsWeb" as any);
        break;
      case "Create Subject":
        router.push("/(tabs)/TeacherDashBoard/CreateSubject" as any);
        break;
      case "Spotlights":
        router.push("/(tabs)/TeacherDashBoard/Spotlights" as any);
        break;
      case "Connect":
        router.push("/(tabs)/TeacherDashBoard/ConnectWeb" as any);
        break;
      case "Share":
        router.push("/(tabs)/TeacherDashBoard/Share" as any);
        break;
      case "Profile":
        router.push("/(tabs)/TeacherDashBoard/ProfileWeb" as any);
        break;
      case "Billing":
        router.push("/(tabs)/TeacherDashBoard/Billing" as any);
        break;
      case "Contact Us":
        // Already on Contact page
        break;
      case "Terms & Conditions":
        // External link
        break;
      case "Privacy Policy":
        // External link
        break;
    }
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Contact form submission - opens email client
  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    try {
      const subject = `Contact Form: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`;
      const body = `Category: ${selectedCategory}\n\nMessage:\n${message.trim()}\n\n---\nFrom: ${userEmail || 'Teacher'}`;
      const mailtoUrl = `mailto:contact@gogrowsmart.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setShowSuccessModal(true);
        setMessage('');
        setSelectedCategory('general');
      } else {
        Alert.alert('Error', 'Unable to open email client. Please ensure you have an email app installed.');
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert('Error', 'Failed to open email client. Please try again.');
    }
  };

  const categories = [
    { id: 'general', label: 'General', icon: 'chatbubble-outline' as const, color: '#3B5BFE' },
    { id: 'technical', label: 'Technical', icon: 'settings-outline' as const, color: '#10B981' },
    { id: 'billing', label: 'Billing', icon: 'card-outline' as const, color: '#F59E0B' },
    { id: 'partnership', label: 'Partnership', icon: 'people-outline' as const, color: '#8B5CF6' },
    { id: 'feedback', label: 'Feedback', icon: 'star-outline' as const, color: '#EF4444' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const, color: '#6B7280' },
  ];

  const contactInfo = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      description: 'contact@gogrowsmart.com',
      action: 'mailto:contact@gogrowsmart.com'
    },
    {
      icon: 'time-outline',
      title: 'Working Hours',
      description: 'Mon - Fri: 9:00 AM - 6:00 PM',
      action: null
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading Contact...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top header ── */}
      <TeacherWebHeader teacherName={teacherName} profileImage={profileImage} />

      {/* ── Body: sidebar + content area ── */}
      <View style={styles.contentLayout}>
        <TeacherWebSidebar
          teacherName={teacherName}
          profileImage={profileImage}
          activeItem={activeItem}
          onItemPress={handleSelect}
          userEmail={userEmail}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        />

        {/* ── Main wrapper: center + right panel in a ROW ── */}
        <View style={styles.mainWrapper}>
          <View style={styles.contentColumns}>

            {/* ── CENTER: scrollable contact content ── */}
            <View style={styles.centerContent}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
                  <ScrollView 
                    style={styles.mainScroll} 
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Welcome banner */}
                    <View style={styles.pageHeader}>
                      <TouchableOpacity style={styles.backBtnCircle} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                      </TouchableOpacity>
                      <View style={styles.welcomeBannerScreen}>
                        <Text style={styles.welcomeTextScreen}>
                          CONTACT US
                        </Text>
                        <Text style={styles.welcomeSubtextScreen}>
                          tdr Reach out with any questions or feedback.
                        </Text>
                      </View>
                    </View>

                    {/* Contact Information */}
                    <View style={styles.contactInfoCard}>
                      <Text style={styles.contactInfoTitle}>Get in Touch</Text>
                      <View style={styles.contactInfoGrid}>
                        {contactInfo.map((info, index) => (
                          <TouchableOpacity 
                            key={index}
                            style={styles.contactInfoItem}
                            onPress={() => info.action && Linking.openURL(info.action)}
                            disabled={!info.action}
                          >
                            <View style={[styles.contactIcon, { backgroundColor: info.action ? COLORS.primaryBlue + '20' : COLORS.border }]}>
                              <Ionicons 
                                name={info.icon as any} 
                                size={24} 
                                color={info.action ? COLORS.primaryBlue : COLORS.textMuted} 
                              />
                            </View>
                            <Text style={styles.contactInfoItemTitle}>{info.title}</Text>
                            <Text style={styles.contactInfoItemDesc}>{info.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Contact Form */}
                    <View style={[styles.contactFormCard, isMobile && { margin: 12, padding: 16 }]}>
                      <Text style={[styles.contactFormTitle, isMobile && { fontSize: 16, marginBottom: 16 }]}>Send us a Message</Text>
                      
                      {/* Category Selection */}
                      <Text style={styles.formLabel}>Category</Text>
                      <View style={[styles.categoryGrid, isMobile && { flexDirection: 'column', gap: 8 }]}>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.categoryItem,
                              isMobile && { width: '100%', padding: 12 },
                              selectedCategory === category.id && styles.categoryItemSelected
                            ]}
                            onPress={() => setSelectedCategory(category.id)}
                          >
                            <Ionicons 
                              name={category.icon} 
                              size={isMobile ? 18 : 20} 
                              color={selectedCategory === category.id ? COLORS.white : category.color} 
                            />
                            <Text style={[
                              styles.categoryText,
                              selectedCategory === category.id && styles.categoryTextSelected,
                              isMobile && { fontSize: 14 }
                            ]}>
                              {category.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Message */}
                      <Text style={styles.formLabel}>Message</Text>
                      <TextInput
                        style={[styles.messageInput, isMobile && { minHeight: 100, padding: 10, fontSize: 14 }]}
                        multiline
                        numberOfLines={isMobile ? 4 : 6}
                        placeholder="Tell us more about your question or feedback..."
                        placeholderTextColor={COLORS.textMuted}
                        value={message}
                        onChangeText={setMessage}
                        textAlignVertical="top"
                      />

                      {/* Submit Button */}
                      <TouchableOpacity
                        style={[styles.submitButton, isMobile && { padding: 14 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                          <Text style={[styles.submitButtonText, isMobile && { fontSize: 15 }]}>Send Message</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                  </ScrollView>
                </Pressable>
              </KeyboardAvoidingView>
            </View>





          </View>{/* end contentColumns */}
        </View>{/* end mainWrapper */}
      </View>{/* end contentLayout */}

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.successGreen} />
            </View>
            <Text style={styles.modalTitle}>Message Sent!</Text>
            <Text style={styles.modalMessage}>
              We've received your message and will get back to you within 24 hours.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>  /* end container */
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentLayout: { flex: 1, flexDirection: 'row', gap: 8 },
  mainWrapper: { flex: 1, flexDirection: 'row' },
  contentColumns: { flex: 1, flexDirection: 'row' },
  centerContent: { flex: 1, backgroundColor: COLORS.background },
  mainScroll: { flex: 1 },
  rightPanel: { 
    width: 350, 
    backgroundColor: '#fff', 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border 
  },
  rightPanelCollapsed: { width: 60 },
  rightPanelHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  rightPanelTitleContainer: { flex: 1 },
  rightPanelTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.textHeader, 
    fontFamily: 'Poppins_600SemiBold' 
  },
  collapseBtn: { padding: 4 },
  composerWrapper: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  thoughtsList: { padding: 16 },
  thoughtsScrollView: { flex: 1 },
  thoughtsLoadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  thoughtsLoadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: COLORS.textBody,
    fontFamily: 'Poppins_400Regular'
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateTitle: { 
    marginTop: 12, 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold'
  },
  emptyStateText: { 
    marginTop: 4, 
    fontSize: 14, 
    color: COLORS.textBody,
    fontFamily: 'Poppins_400Regular'
  },
  postWrapper: { marginBottom: 16 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: COLORS.textBody,
    fontFamily: 'Poppins_400Regular'
  },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 8 },
  backBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 16,
    marginLeft: 16,
  },
  welcomeBannerScreen: {
    backgroundColor: COLORS.primaryBlue,
    margin: 16,
    padding: 24,
    borderRadius: 12,
  },
  welcomeTextScreen: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  welcomeSubtextScreen: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins_400Regular',
  },
  contactInfoCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  contactInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactInfoItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactInfoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeader,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  contactInfoItemDesc: {
    fontSize: 12,
    color: COLORS.textBody,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  contactFormCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginBottom: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textHeader,
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryItem: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textBody,
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  categoryTextSelected: {
    color: COLORS.white,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textHeader,
    fontFamily: 'Poppins_400Regular',
    minHeight: 120,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primaryBlue,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
  },
  modalButton: {
    backgroundColor: COLORS.primaryBlue,
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: 'Poppins_600SemiBold',
  },
});
