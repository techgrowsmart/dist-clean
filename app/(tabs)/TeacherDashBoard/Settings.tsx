import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  KeyboardAvoidingView, 
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Dimensions,
  Animated,
  FlatList,
  Modal,
  StatusBar,
  Image,
  Linking,
  Share,
  RefreshControl,
  DimensionValue,
} from "react-native";
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from 'expo-router';
import { 
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import { UXButton, UXCard, UXInput, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';
import axios from 'axios';
import * as Haptics from 'expo-haptics';

// Helper functions outside component for styles
const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

const getBreakpoints = (screenWidth: number) => ({
  isTinyMobile: screenWidth < 320,
  isSmallMobile: screenWidth < 375,
  isMobile: screenWidth < 768,
  isTablet: screenWidth >= 768 && screenWidth < 1024,
  isDesktop: screenWidth >= 1024,
  isLargeDesktop: screenWidth >= 1440,
  isUltraWide: screenWidth >= 1920,
});

const getSpacing = (screenWidth: number, multiplier: number = 1) => {
  const { isUltraWide, isLargeDesktop, isDesktop, isTablet, isMobile, isSmallMobile } = getBreakpoints(screenWidth);
  const base = isUltraWide ? 24 : isLargeDesktop ? 20 : isDesktop ? 16 : isTablet ? 14 : isMobile ? 12 : isSmallMobile ? 10 : 8;
  return base * multiplier;
};

const getFontSize = (screenWidth: number, type: 'title' | 'subtitle' | 'body' | 'caption' | 'small') => {
  const { isTinyMobile, isSmallMobile, isMobile, isTablet, isDesktop, isLargeDesktop, isUltraWide } = getBreakpoints(screenWidth);
  const baseSizes = {
    title: isTinyMobile ? wp('6%') : isSmallMobile ? wp('6.5%') : isMobile ? wp('7%') : isTablet ? wp('5%') : isDesktop ? wp('4%') : isLargeDesktop ? wp('3.5%') : wp('3%'),
    subtitle: isTinyMobile ? wp('3.5%') : isSmallMobile ? wp('3.8%') : isMobile ? wp('4%') : isTablet ? wp('3%') : isDesktop ? wp('2.5%') : isLargeDesktop ? wp('2.2%') : wp('2%'),
    body: isTinyMobile ? wp('3%') : isSmallMobile ? wp('3.2%') : isMobile ? wp('3.5%') : isTablet ? wp('2.8%') : isDesktop ? wp('2.3%') : isLargeDesktop ? wp('2%') : wp('1.8%'),
    caption: isTinyMobile ? wp('2.2%') : isSmallMobile ? wp('2.5%') : isMobile ? wp('2.8%') : isTablet ? wp('2.2%') : isDesktop ? wp('2%') : isLargeDesktop ? wp('1.8%') : wp('1.5%'),
    small: isTinyMobile ? wp('2%') : isSmallMobile ? wp('2.2%') : isMobile ? wp('2.5%') : isTablet ? wp('2%') : isDesktop ? wp('1.8%') : isLargeDesktop ? wp('1.5%') : wp('1.2%'),
  };
  return baseSizes[type];
};

const Settings = () => {
  // Font loading
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Enhanced state management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Settings');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
    security: true,
  });
  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'english',
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    dataSharing: true,
    analytics: true,
    cookies: true,
  });
  
  // Advanced animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Gesture handling
  const panGestureRef = useRef<any>(null);
  const lastTap = useRef(0);
  const doubleTapDelay = 300;
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    pan: "",
    accountHolderName: ""
  });
  const [formData, setFormData] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    pan: "",
    accountHolderName: ""
  });

  // Enhanced responsive design with more breakpoints
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isTabletMode, setIsTabletMode] = useState(false);
  
  // Advanced breakpoints
  const isTinyMobile = screenWidth < 320;
  const isSmallMobile = screenWidth < 375;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isLargeDesktop = screenWidth >= 1440;
  const isUltraWide = screenWidth >= 1920;
  
  // Styles declaration - moved here to fix block scope issue
  const styles = useMemo(() => createStyles(screenWidth), [screenWidth]);
  
  // Dynamic sizing functions (using helper functions)
  const getIconSize = () => {
    const { isTinyMobile, isSmallMobile, isMobile, isTablet, isDesktop, isLargeDesktop, isUltraWide } = getBreakpoints(screenWidth);
    if (isTinyMobile) return 16;
    if (isSmallMobile) return 18;
    if (isMobile) return 20;
    if (isTablet) return 22;
    if (isDesktop) return 24;
    if (isLargeDesktop) return 28;
    if (isUltraWide) return 32;
    return 26;
  };
  
  const getHeaderIconSize = () => {
    const { isTinyMobile, isSmallMobile, isMobile, isTablet, isDesktop, isLargeDesktop, isUltraWide } = getBreakpoints(screenWidth);
    if (isTinyMobile) return 20;
    if (isSmallMobile) return 22;
    if (isMobile) return 24;
    if (isTablet) return 26;
    if (isDesktop) return 28;
    if (isLargeDesktop) return 32;
    if (isUltraWide) return 36;
    return 30;
  };
  
  const getCurrentFontSize = (type: 'title' | 'subtitle' | 'body' | 'caption' | 'small') => {
    return getFontSize(screenWidth, type);
  };

  const COLORS = {
    primaryBlue: '#3B5BFE',
    white: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#E5E7EB',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    bannerTint: '#F0F4FF',
  };

  // Advanced animation and interaction handlers
  useEffect(() => {
    const onChange = ({ window }: any) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
      setIsTabletMode(window.width >= 768 && window.width < 1024);
    };
    const subscription = Dimensions.addEventListener?.('change', onChange);
    return () => subscription?.remove?.();
  }, []);

  // Staggered entrance animations
  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(rotateAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.timing(cardScaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ];
    
    Animated.stagger(150, animations).start();
    
    // Start shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
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

  // Enhanced interaction handlers
  const handleSectionPress = useCallback(async (section: string) => {
    await triggerHaptic('medium');
    setActiveSection(activeSection === section ? null : section);
    Animated.spring(scaleAnim, { 
      toValue: activeSection === section ? 1.05 : 1, 
      tension: 150, 
      friction: 8, 
      useNativeDriver: true 
    }).start();
    
    // Card bounce animation
    Animated.sequence([
      Animated.timing(cardScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(cardScaleAnim, { toValue: 1.02, duration: 200, useNativeDriver: true }),
      Animated.timing(cardScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [activeSection, triggerHaptic]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < doubleTapDelay) {
      triggerHaptic('heavy');
      setShowQuickActions(!showQuickActions);
    }
    lastTap.current = now;
  }, [showQuickActions, triggerHaptic]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await triggerHaptic('light');
    
    // Refresh animation
    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 360, duration: 1000, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
    
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
      triggerHaptic('success');
    }, 1500);
  }, [triggerHaptic]);

  const handleShare = useCallback(async () => {
    await triggerHaptic('medium');
    try {
      await Share.share({
        message: 'Check out my teaching profile on GoGrowSmart!',
        url: 'https://portal.gogrowsmart.com/teacher/' + userEmail,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  }, [userEmail, triggerHaptic]);

  const handleCopyProfile = useCallback(async () => {
    await triggerHaptic('light');
    const profileUrl = `https://portal.gogrowsmart.com/teacher/${userEmail}`;
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(profileUrl);
    } else {
      // For mobile, you might need to use @react-native-clipboard/clipboard
    }
    Alert.alert('Success', 'Profile link copied to clipboard!');
  }, [userEmail, triggerHaptic]);

  const handleNotificationToggle = useCallback(async (type: keyof typeof notifications) => {
    await triggerHaptic('light');
    setNotifications(prev => ({ ...prev, [type]: !prev[type] }));
  }, [triggerHaptic]);

  const handleAppearanceChange = useCallback(async (key: keyof typeof appearance, value: string) => {
    await triggerHaptic('light');
    setAppearance(prev => ({ ...prev, [key]: value }));
  }, [triggerHaptic]);

  const handlePrivacyChange = useCallback(async (key: keyof typeof privacy, value: string) => {
    await triggerHaptic('light');
    setPrivacy(prev => ({ ...prev, [key]: value }));
  }, [triggerHaptic]);

  const handleSaveWithAnimation = useCallback(async () => {
    setIsSaving(true);
    await triggerHaptic('medium');
    
    // Animate save button
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    
    try {
      await handleUpdate();
      await triggerHaptic('success');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      await triggerHaptic('error');
    } finally {
      setIsSaving(false);
    }
  }, [triggerHaptic]);

  // Fetch bank details function
  const fetchBankDetails = async () => {
    try {
      setIsLoading(true);
      const authData = await getAuthData();
      
      if (!authData?.token) {
        console.error('No authentication data found');
        Alert.alert('Error', 'Please login again');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/bank-details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success) {
        const bankData = data.data || {};
        setBankDetails({
          accountNumber: bankData.accountNumber || "",
          ifscCode: bankData.ifscCode || "",
          bankName: bankData.bankName || "",
          pan: bankData.pan || "",
          accountHolderName: bankData.accountHolderName || ""
        });
        setFormData({
          accountNumber: bankData.accountNumber || "",
          ifscCode: bankData.ifscCode || "",
          bankName: bankData.bankName || "",
          pan: bankData.pan || "",
          accountHolderName: bankData.accountHolderName || ""
        });
      } else {
        const emptyDetails = {
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          pan: "",
          accountHolderName: ""
        };
        setBankDetails(emptyDetails);
        setFormData(emptyDetails);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
      Alert.alert('Error', 'Failed to fetch bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const authData = await getAuthData();
      
      if (!authData || !authData.token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/update-bank-details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: formData.accountNumber,
          ifsc_code: formData.ifscCode,
          bank_name: formData.bankName,
          account_holder_name: formData.accountHolderName,
          pan: formData.pan,
          pincode: "000000"
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBankDetails(formData);
        setIsEditing(false);
        Alert.alert('Success', 'Bank details updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update bank details');
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      Alert.alert('Error', 'Failed to update bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(bankDetails);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load teacher data for web header and sidebar
  useEffect(() => {
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

  // Also fetch profile from API (for real data)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token || !auth?.email) return;
        const res = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers: { Authorization: `Bearer ${auth.token}` } });
        const data = res.data;
        if (data) {
          setTeacherName(data.name || teacherName);
          setProfileImage(data.profileimage || profileImage);
          setUserEmail(data.email || userEmail);
        }
      } catch (err) {
        // ignore — graceful fallback already implemented
      }
    };
    fetchProfile();
  }, []);

  // Fetch bank details on mount
  useEffect(() => {
    fetchBankDetails();
  }, []);

  // Handle sidebar navigation
  const handleSidebarSelect = useCallback((item: string) => {
    setSidebarActiveItem(item);
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
        break;
      default:
        console.log('Navigate to:', item);
    }
  }, []);

  // Enhanced search functionality with amazing features
  const filteredSettings = useMemo(() => [
    { 
      id: 'personal', 
      title: 'Personal Information', 
      icon: 'person-outline', 
      description: 'Manage your basic information',
      category: 'account',
      priority: 'high',
      badge: null
    },
    { 
      id: 'bank', 
      title: 'Bank Details', 
      icon: 'card-outline', 
      description: 'Update payment information',
      category: 'payment',
      priority: 'high',
      badge: bankDetails.accountNumber ? 'verified' : null
    },
    { 
      id: 'notifications', 
      title: 'Notifications', 
      icon: 'notifications-outline', 
      description: 'Control your notification preferences',
      category: 'preferences',
      priority: 'medium',
      badge: notifications.email || notifications.push ? 'active' : null
    },
    { 
      id: 'security', 
      title: 'Security', 
      icon: 'lock-closed-outline', 
      description: 'Password and authentication settings',
      category: 'security',
      priority: 'high',
      badge: null
    },
    { 
      id: 'privacy', 
      title: 'Privacy', 
      icon: 'shield-outline', 
      description: 'Manage your privacy settings',
      category: 'preferences',
      priority: 'medium',
      badge: privacy.profileVisibility === 'public' ? 'public' : null
    },
    { 
      id: 'appearance', 
      title: 'Appearance', 
      icon: 'color-palette-outline', 
      description: 'Customize app appearance',
      category: 'preferences',
      priority: 'low',
      badge: null
    },
    { 
      id: 'advanced', 
      title: 'Advanced Settings', 
      icon: 'settings-outline', 
      description: 'Advanced configuration options',
      category: 'advanced',
      priority: 'low',
      badge: null
    },
    { 
      id: 'help', 
      title: 'Help & Support', 
      icon: 'help-circle-outline', 
      description: 'Get help and contact support',
      category: 'support',
      priority: 'low',
      badge: null
    },
  ].filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery, bankDetails.accountNumber, notifications.email, notifications.push, privacy.profileVisibility]);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <UXLoading size="lg" text="Loading settings..." />
        </Animated.View>
      </View>
    );
  }

  // Amazing Shimmer Component for Loading States
  const ShimmerView = ({ width, height, style }: { width: DimensionValue; height: DimensionValue; style?: any }) => (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [UX_COLORS.border, UX_COLORS.primaryLight]
          }),
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.8]
          })
        }
      ]}
    >
      <View style={{ width, height, borderRadius: 8 }} />
    </Animated.View>
  );

  // Premium Settings Item Component with Enhanced Features
  const SettingsItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View
      style={[
        styles.premiumSettingsItem,
        {
          opacity: slideAnim,
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20 * (index + 1), 0]
            }) },
            { scale: cardScaleAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => handleSectionPress(item.id)}
        activeOpacity={0.8}
        style={styles.settingsItemTouchable}
        onLongPress={() => handleDoubleTap()}
      >
        <View style={styles.settingsItemLeft}>
          <Animated.View
            style={[
              styles.settingsItemIcon,
              {
                transform: [{ rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                }) }]
              }
            ]}
          >
            <Ionicons name={item.icon} size={getHeaderIconSize()} color={UX_COLORS.primary} />
          </Animated.View>
          <View style={styles.settingsItemContent}>
            <View style={styles.settingsItemHeader}>
              <Text style={styles.settingsItemTitle}>{item.title}</Text>
              {item.badge && (
                <UXBadge 
                  text={item.badge} 
                  variant={item.badge === 'verified' ? 'success' : 'primary'} 
                  size="sm" 
                />
              )}
            </View>
            <Text style={styles.settingsItemDescription}>{item.description}</Text>
          </View>
          <View style={styles.settingsItemMeta}>
            <Text style={styles.settingsItemCategory}>{item.category}</Text>
            <View style={[
              styles.priorityIndicator,
              { backgroundColor: item.priority === 'high' ? UX_COLORS.error : item.priority === 'medium' ? UX_COLORS.warning : UX_COLORS.textSecondary }
            ]} />
          </View>
        </View>
        <Animated.View
          style={[
            styles.settingsItemArrow,
            {
              transform: [{ rotate: activeSection === item.id ? '90deg' : '0deg' }]
            }
          ]}
        >
          <Ionicons name="chevron-forward" size={getIconSize()} color={UX_COLORS.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Enhanced Profile Card Component
  const ProfileCard = () => (
    <Animated.View style={[
      styles.profileCard,
      { transform: [{ scale: cardScaleAnim }] }
    ]}>
      <UXCard padding="lg" shadow="large" rounded="lg">
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{teacherName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={UX_COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={handleCopyProfile}
            >
              <Ionicons name="copy-outline" size={20} color={UX_COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,234</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>89%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </UXCard>
    </Animated.View>
  );

  // Enhanced Notification Settings Component
  const NotificationSettingsCard = () => (
    <Animated.View style={[
      styles.sectionCard,
      { opacity: fadeAnim }
    ]}>
      <UXCard padding="lg" shadow="medium" rounded="lg">
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="notifications-outline" size={getHeaderIconSize()} color={UX_COLORS.primary} />
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Animated.View
              style={{
                transform: [{ rotate: rotateAnim.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                }) }]
              }}
            >
              <Ionicons 
                name={refreshing ? "refresh" : "refresh-outline"} 
                size={getIconSize()} 
                color={UX_COLORS.primary} 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.notificationGrid}>
          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Ionicons name="mail-outline" size={20} color={UX_COLORS.primary} />
                <Text style={styles.notificationTitle}>Email Notifications</Text>
              </View>
              <Text style={styles.notificationDescription}>Receive updates about your classes and students</Text>
              <View style={styles.notificationMeta}>
                <Text style={styles.notificationStatus}>{notifications.email ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={() => handleNotificationToggle('email')}
              trackColor={{ false: UX_COLORS.border, true: UX_COLORS.primaryLight }}
              thumbColor={notifications.email ? UX_COLORS.primary : UX_COLORS.textLight}
              ios_backgroundColor={UX_COLORS.border}
            />
          </View>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Ionicons name="phone-portrait" size={20} color={UX_COLORS.primary} />
                <Text style={styles.notificationTitle}>Push Notifications</Text>
              </View>
              <Text style={styles.notificationDescription}>Get instant alerts on your mobile device</Text>
              <View style={styles.notificationMeta}>
                <Text style={styles.notificationStatus}>{notifications.push ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={() => handleNotificationToggle('push')}
              trackColor={{ false: UX_COLORS.border, true: UX_COLORS.primaryLight }}
              thumbColor={notifications.push ? UX_COLORS.primary : UX_COLORS.textLight}
              ios_backgroundColor={UX_COLORS.border}
            />
          </View>
          
          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Ionicons name="chatbubble-outline" size={20} color={UX_COLORS.primary} />
                <Text style={styles.notificationTitle}>SMS Notifications</Text>
              </View>
              <Text style={styles.notificationDescription}>Receive text messages for important updates</Text>
              <View style={styles.notificationMeta}>
                <Text style={styles.notificationStatus}>{notifications.sms ? 'Enabled' : 'Disabled'}</Text>
              </View>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={() => handleNotificationToggle('sms')}
              trackColor={{ false: UX_COLORS.border, true: UX_COLORS.primaryLight }}
              thumbColor={notifications.sms ? UX_COLORS.primary : UX_COLORS.textLight}
              ios_backgroundColor={UX_COLORS.border}
            />
          </View>
        </View>
      </UXCard>
    </Animated.View>
  );

  return (
    Platform.OS === 'web' ? (
      <View style={styles.container}>
        <TeacherWebHeader
          teacherName={teacherName}
          profileImage={profileImage}
        />

        <View style={styles.contentLayout}>
          <TeacherWebSidebar
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail}
            subjectCount={0}
            studentCount={0}
            revenue="₹2.1K"
            isSpotlight={false}
          />
          <View style={styles.mainContent}>
            <Text style={styles.pageTitle}>Settings</Text>
            <Text style={styles.pageSubtitle}>Manage your account preferences and customize your experience</Text>

            {/* Profile Card */}
            <ProfileCard />

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleRefresh}>
                  <Ionicons name="refresh-outline" size={24} color={UX_COLORS.primary} />
                  <Text style={styles.quickActionText}>Refresh Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color={UX_COLORS.primary} />
                  <Text style={styles.quickActionText}>Share Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleCopyProfile}>
                  <Ionicons name="copy-outline" size={24} color={UX_COLORS.primary} />
                  <Text style={styles.quickActionText}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Settings Categories */}
            <View style={styles.settingsCategoriesContainer}>
              <Text style={styles.categoriesTitle}>Settings Categories</Text>
              
              {/* Account Settings */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Account</Text>
                <View style={styles.settingsGrid}>
                  {filteredSettings.filter(item => item.category === 'account').map((item, index) => (
                    <SettingsItem key={item.id} item={item} index={index} />
                  ))}
                </View>
              </View>

              {/* Preferences Settings */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Preferences</Text>
                <View style={styles.settingsGrid}>
                  {filteredSettings.filter(item => item.category === 'preferences').map((item, index) => (
                    <SettingsItem key={item.id} item={item} index={index} />
                  ))}
                </View>
              </View>

              {/* Security Settings */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Security & Privacy</Text>
                <View style={styles.settingsGrid}>
                  {filteredSettings.filter(item => item.category === 'security' || item.category === 'privacy').map((item, index) => (
                    <SettingsItem key={item.id} item={item} index={index} />
                  ))}
                </View>
              </View>

              {/* Support Settings */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Support</Text>
                <View style={styles.settingsGrid}>
                  {filteredSettings.filter(item => item.category === 'support').map((item, index) => (
                    <SettingsItem key={item.id} item={item} index={index} />
                  ))}
                </View>
              </View>
            </View>

            {/* Bank Details Section */}
            <Animated.View style={[
              styles.sectionCard,
              { opacity: fadeAnim }
            ]}>
              <UXCard padding="lg" shadow="medium" rounded="lg">
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="card-outline" size={getHeaderIconSize()} color={UX_COLORS.primary} />
                    <Text style={styles.sectionTitle}>Bank Details</Text>
                    {bankDetails.accountNumber && (
                      <UXBadge text="Verified" variant="success" size="sm" />
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setIsEditing(!isEditing)}
                  >
                    <Ionicons 
                      name={isEditing ? "close" : "create-outline"} 
                      size={getIconSize()} 
                      color={isEditing ? UX_COLORS.error : UX_COLORS.primary} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGrid}>
                  <UXInput
                    label="Bank Name"
                    value={formData.bankName}
                    onChangeText={(text) => handleInputChange('bankName', text)}
                    disabled={!isEditing}
                    icon={<Ionicons name="business-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                  
                  <UXInput
                    label="Account Number"
                    value={formData.accountNumber}
                    onChangeText={(text) => handleInputChange('accountNumber', text)}
                    disabled={!isEditing}
                    keyboardType="numeric"
                    secureTextEntry={true}
                    icon={<Ionicons name="cash-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                  
                  <UXInput
                    label="IFSC Code"
                    value={formData.ifscCode}
                    onChangeText={(text) => handleInputChange('ifscCode', text)}
                    disabled={!isEditing}
                    icon={<Ionicons name="code-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                  
                  <UXInput
                    label="PAN Number"
                    value={formData.pan}
                    onChangeText={(text) => handleInputChange('pan', text)}
                    disabled={!isEditing}
                    secureTextEntry={true}
                    icon={<Ionicons name="document-text-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                </View>
              </UXCard>
            </Animated.View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtons}>
                <UXButton
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  size="lg"
                  style={styles.cancelButton}
                />
                <UXButton
                  title="Save Changes"
                  onPress={handleSaveWithAnimation}
                  loading={isSaving}
                  variant="primary"
                  size="lg"
                  style={styles.saveButton}
                  icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                />
              </View>
            )}
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
          {/* Page Header */}
          <Animated.View style={[
            styles.pageHeader,
            { opacity: fadeAnim }
          ]}>
            <Text style={styles.pageTitle}>Settings</Text>
            <Text style={styles.pageSubtitle}>Manage your account preferences and bank details</Text>
          </Animated.View>

          {/* Personal Information Card */}
          <Animated.View style={[
            styles.sectionCard,
            { opacity: fadeAnim }
          ]}>
            <UXCard padding="lg" shadow="medium" rounded="lg">
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="person-outline" size={getHeaderIconSize()} color={UX_COLORS.primary} />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
              </View>
              
              <View style={styles.formGrid}>
                <UXInput
                  label="First Name"
                  value={formData.accountHolderName.split(' ')[0] || ''}
                  onChangeText={(text) => {
                    const names = formData.accountHolderName.split(' ');
                    names[0] = text;
                    handleInputChange('accountHolderName', names.join(' '));
                  }}
                  disabled={!isEditing}
                  icon={<Ionicons name="person-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                />
                
                <UXInput
                  label="Last Name"
                  value={formData.accountHolderName.split(' ').slice(1).join(' ') || ''}
                  onChangeText={(text) => {
                    const names = formData.accountHolderName.split(' ');
                    names[1] = text;
                    handleInputChange('accountHolderName', names.join(' ').trim());
                  }}
                  disabled={!isEditing}
                  icon={<Ionicons name="person-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                />
              </View>
              
              <View style={styles.countrySelector}>
                <Text style={styles.countryLabel}>Country</Text>
                <UXBadge text="India" variant="primary" />
              </View>
            </UXCard>
          </Animated.View>

          {/* Bank Details Card */}
          <UXCard padding="lg" shadow="medium" rounded="lg" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="card-outline" size={24} color={UX_COLORS.primary} />
                <Text style={styles.sectionTitle}>Bank Details</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Ionicons 
                  name={isEditing ? "close" : "create-outline"} 
                  size={20} 
                  color={isEditing ? UX_COLORS.error : UX_COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGrid}>
              <UXInput
                label="Bank Name"
                value={formData.bankName}
                onChangeText={(text) => handleInputChange('bankName', text)}
                disabled={!isEditing}
                icon={<Ionicons name="business-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
              
              <UXInput
                label="Account Number"
                value={formData.accountNumber}
                onChangeText={(text) => handleInputChange('accountNumber', text)}
                disabled={!isEditing}
                keyboardType="numeric"
                icon={<Ionicons name="cash-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
              
              <UXInput
                label="IFSC Code"
                value={formData.ifscCode}
                onChangeText={(text) => handleInputChange('ifscCode', text)}
                disabled={!isEditing}
                icon={<Ionicons name="code-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
              
              <UXInput
                label="PAN Number"
                value={formData.pan}
                onChangeText={(text) => handleInputChange('pan', text)}
                disabled={!isEditing}
                secureTextEntry={true}
                icon={<Ionicons name="document-text-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
            </View>
          </UXCard>

          {/* Notification Settings Card */}
          <UXCard padding="lg" shadow="medium" rounded="lg" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="notifications-outline" size={24} color={UX_COLORS.primary} />
                <Text style={styles.sectionTitle}>Notification Settings</Text>
              </View>
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>Email Notifications</Text>
                <Text style={styles.notificationDescription}>Receive email updates about your account</Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={() => handleNotificationToggle('email')}
                trackColor={{ false: UX_COLORS.border, true: UX_COLORS.primaryLight }}
                thumbColor={notifications.email ? UX_COLORS.primary : UX_COLORS.textLight}
                ios_backgroundColor={UX_COLORS.border}
              />
            </View>
          </UXCard>

          {/* Action Buttons */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <UXButton
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                size="lg"
                style={styles.cancelButton}
              />
              <UXButton
                title="Save Changes"
                onPress={handleUpdate}
                loading={isLoading}
                variant="primary"
                size="lg"
                style={styles.saveButton}
                icon={<Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    )
  );
};

const createStyles = (screenWidth: number) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: UX_COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    backgroundColor: UX_COLORS.background,
  },
  scrollContent: {
    padding: getSpacing(screenWidth, 1.5),
  },
  pageHeader: {
    marginBottom: getSpacing(screenWidth, 2),
  },
  pageTitle: {
    fontSize: getFontSize(screenWidth, 'title'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: getSpacing(screenWidth, 0.5),
  },
  pageSubtitle: {
    fontSize: getFontSize(screenWidth, 'body'),
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    lineHeight: hp('2.5%'),
  },
  sectionCard: {
    marginBottom: getSpacing(screenWidth, 1.5),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(screenWidth, 1),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(screenWidth, 0.5),
  },
  sectionTitle: {
    fontSize: getFontSize(screenWidth, 'subtitle'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: UX_COLORS.surface,
    borderWidth: 1,
    borderColor: UX_COLORS.border,
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    marginLeft: 8,
  },
  settingsCategoriesContainer: {
    gap: 24,
  },
  categoriesTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 16,
  },
  categorySection: {
    gap: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: UX_COLORS.primary,
  },
  formGrid: {
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: UX_COLORS.border,
    alignItems: 'center',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: UX_COLORS.primary,
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: UX_COLORS.background,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: UX_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UX_COLORS.border,
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    lineHeight: 20,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationStatus: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.primary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  premiumSettingsItem: {
    backgroundColor: UX_COLORS.surface,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: UX_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: UX_COLORS.border,
  },
  settingsItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UX_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  settingsItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsItemCategory: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    backgroundColor: UX_COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileCard: {
    marginBottom: 24,
    backgroundColor: UX_COLORS.surface,
    borderRadius: 16,
    shadowColor: UX_COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: UX_COLORS.border,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  profileActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UX_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UX_COLORS.primary,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: UX_COLORS.border,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },
  countrySelector: {
    marginBottom: 16,
  },
  countryLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 8,
  },
  notificationGrid: {
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingsItemArrow: {
    marginLeft: 12,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
  },
  settingsItemDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },
});

export default Settings;