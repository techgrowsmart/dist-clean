import React, { useState, useEffect, useCallback } from 'react';
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
import ResponsiveSidebar from '../../../components/ui/ResponsiveSidebar';
import StudentThoughtsCard from '../../../components/ui/StudentThoughtsCard';
import { getAuthData } from '../../../utils/authStorage';
import { BASE_URL } from '../../../config';
import { Linking } from 'react-native';
import BackButton from '../../../components/BackButton';

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
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);
  
  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setIsMobile(window.width < 768);
    });
    return () => subscription?.remove();
  }, []);

  // Student data
  const [studentName, setStudentName] = useState('');
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

  // Student Posts Data for Thoughts
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());

  const handleBackPress = useCallback(() => { router.push('/(tabs)/StudentDashBoard/Student'); }, [router]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [handleBackPress]);

  // Fetch student data
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.token) {
          setAuthToken(auth.token);
          setStudentName(auth.name || '');
          setUserEmail(auth.email || '');
          setProfileImage(auth.profileImage || null);
        }
      } catch (error) {
        console.error('Error loading student data:', error);
      }
    };
    loadStudentData();
  }, []);


  const handleCreatePost = async (content: string) => {
    // Handle post creation
    console.log('New post:', content);
  };

  // Handle sidebar navigation
  const handleSelect = (itemName: string) => {
    setActiveItem(itemName);
    // Navigate based on item
    switch (itemName) {
      case "Dashboard":
        router.push("/(tabs)/StudentDashBoard/StudentDashboardWeb" as any);
        break;
      case "My Courses":
        router.push("/(tabs)/StudentDashBoard/MyCourses" as any);
        break;
      case "Find Tutors":
        router.push("/(tabs)/StudentDashBoard/FindTutors" as any);
        break;
      case "Progress":
        router.push("/(tabs)/StudentDashBoard/Progress" as any);
        break;
      case "Schedule":
        router.push("/(tabs)/StudentDashBoard/Schedule" as any);
        break;
      case "Messages":
        router.push("/(tabs)/StudentDashBoard/Messages" as any);
        break;
      case "Profile":
        router.push("/(tabs)/StudentDashBoard/Profile" as any);
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

  // Contact form submission
  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setIsSubmitting(true);
    try {
      // Find category label
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      
      // Construct email body with form data
      const emailBody = `
Category: ${categoryLabel}
User Email: ${userEmail || 'Not provided'}
User Name: ${studentName || 'Not provided'}

Message:
${message.trim()}
      `.trim();

      // Create mailto URL with subject and body
      const subject = encodeURIComponent(`Contact Us - ${categoryLabel}`);
      const body = encodeURIComponent(emailBody);
      const mailtoUrl = `mailto:support@gogrowsmart.com?subject=${subject}&body=${body}`;

      // Open email client
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        // Clear form after successful email open
        setMessage('');
        setSelectedCategory('general');
      } else {
        Alert.alert('Error', 'Unable to open email client. Please email support@gogrowsmart.com directly.');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Failed to open email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'general', label: 'General', icon: 'chatbubble-outline' as const, color: '#3B5BFE' },
    { id: 'technical', label: 'Technical', icon: 'settings-outline' as const, color: '#10B981' },
    { id: 'billing', label: 'Billing', icon: 'card-outline' as const, color: '#F59E0B' },
    { id: 'course', label: 'Course', icon: 'book-outline' as const, color: '#8B5CF6' },
    { id: 'feedback', label: 'Feedback', icon: 'star-outline' as const, color: '#EF4444' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const, color: '#6B7280' },
  ];

  const contactInfo = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      description: 'support@gogrowsmart.com',
      action: 'mailto:support@gogrowsmart.com'
    },
    {
      icon: 'time-outline',
      title: 'Working Hours',
      description: 'Mon - Fri: 9:00 AM - 6:00 PM',
      action: null
    },
  ];

  // Helper functions for Thoughts
  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic || ['', 'null', 'undefined'].includes(profilePic)) return null;
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
      const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      return { uri: `${BASE_URL}/${clean}` };
    }
    return null;
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';

  const resolvePostAuthor = (post: any) => {
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    let name = post.author?.name || cached.name || '';
    let pic: string | null = post.author?.profile_pic || cached.profilePic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author?.email?.split('@')[0] || 'User';
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;
    return { name, pic, role: post.author?.role || 'User' };
  };

  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'Just now';
    if (typeof dateString === 'string' && dateString.includes('ago')) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Just now';
    const diff = Date.now() - date.getTime();
    if (diff < 0) return 'Just now';
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min. ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLiked = !post.isLiked;
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: newLiked ? p.likes + 1 : Math.max(0, p.likes - 1), isLiked: newLiked } : p));
  };

  const renderWebRightSidebar = () => (
    <StudentThoughtsCard
      posts={posts}
      postsLoading={postsLoading}
      userProfileCache={userProfileCache}
      currentUserEmail={userEmail || undefined}
      getProfileImageSource={getProfileImageSource}
      initials={initials}
      resolvePostAuthor={resolvePostAuthor}
      handleLike={handleLike}
      setPosts={setPosts}
      onComment={(post: any) => {
        console.log('Open comments for post:', post.id);
      }}
      isMobile={isMobile}
      showThoughtsPanel={true}
      authToken={authToken}
      BASE_URL={BASE_URL}
      formatTimeAgo={formatTimeAgo}
      router={router}
    />
  );

  const renderWebMainContent = () => (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome banner */}
            <View style={styles.welcomeBannerScreen}>
              <View style={styles.bannerHeader}>
                <BackButton onPress={handleBackPress} color="white" />
                <Text style={styles.welcomeTextScreen}>
                  CONTACT US
                </Text>
              </View>
              <Text style={styles.welcomeSubtextScreen}>
                We're here to help! Reach out with any questions or feedback.
              </Text>
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
            <View style={styles.contactFormCard}>
              <Text style={styles.contactFormTitle}>Send us a Message</Text>
              
              {/* Category Selection */}
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={selectedCategory === category.id ? COLORS.white : category.color} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={styles.messageInput}
                multiline
                placeholder="Tell us more about your question or feedback..."
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                editable={true}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Message</Text>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading Contact...</Text>
      </View>
    );
  }

  // Web return with responsive sidebar and Thoughts
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ResponsiveSidebar
          activeItem={activeItem}
          onItemPress={(itemName: string) => {
            setActiveItem(itemName);
            if (itemName === 'My Tuitions') router.push('/(tabs)/StudentDashBoard/MyTuitions' as any);
            else if (itemName === 'Profile') router.push('/(tabs)/StudentDashBoard/Profile' as any);
            else if (itemName === 'Subscription') router.push('/(tabs)/StudentDashBoard/Subscription' as any);
            else if (itemName === 'Faq') router.push('/(tabs)/StudentDashBoard/Faq' as any);
            else if (itemName === 'Contact Us' || itemName === 'Contact') router.push('/(tabs)/Contact' as any);
            else console.log('Sidebar item pressed:', itemName);
          }}
          userEmail={userEmail || ""}
          studentName={studentName || ""}
          profileImage={profileImage || null}
        >
          <View style={{ flex: 1 }}>
            {renderWebMainContent()}
          </View>
        </ResponsiveSidebar>
      </View>
    );
  }

  // Mobile return
  return (
    <View style={styles.container}>
      {/* Welcome banner */}
      <View style={styles.welcomeBannerScreen}>
        <View style={styles.bannerHeader}>
          <BackButton onPress={handleBackPress} color="white" />
          <Text style={styles.welcomeTextScreen}>
            CONTACT US
          </Text>
        </View>
        <Text style={styles.welcomeSubtextScreen}>
          We're here to help! Reach out with any questions or feedback.
        </Text>
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
      <View style={styles.contactFormCard}>
        <Text style={styles.contactFormTitle}>Send us a Message</Text>
        
        {/* Category Selection */}
        <Text style={styles.formLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.id && styles.categoryItemSelected
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={20} 
                color={selectedCategory === category.id ? COLORS.white : category.color} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message */}
        <Text style={styles.formLabel}>Message</Text>
        <TextInput
          style={styles.messageInput}
          multiline
          placeholder="Tell us more about your question or feedback..."
          placeholderTextColor={COLORS.textMuted}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
          editable={true}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Send Message</Text>
          )}
        </TouchableOpacity>
      </View>

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
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentLayout: { flex: 1, flexDirection: 'row' },
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
  welcomeBannerScreen: {
    backgroundColor: COLORS.primaryBlue,
    margin: 16,
    padding: 24,
    borderRadius: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  welcomeTextScreen: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
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
    height: 120,
    marginBottom: 20,
    backgroundColor: COLORS.white,
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
