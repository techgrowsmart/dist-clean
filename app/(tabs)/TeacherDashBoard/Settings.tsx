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
} from "react-native";
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from 'expo-router';
import { 
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import { UXButton, UXCard, UXInput, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';
import axios from 'axios';
import * as Haptics from 'expo-haptics';

const Settings = () => {
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
  const panGestureRef = useRef();
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
  
  // Dynamic sizing functions
  const getIconSize = () => {
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
    if (isTinyMobile) return 20;
    if (isSmallMobile) return 22;
    if (isMobile) return 24;
    if (isTablet) return 26;
    if (isDesktop) return 28;
    if (isLargeDesktop) return 32;
    if (isUltraWide) return 36;
    return 30;
  };
  
  const getFontSize = (type: 'title' | 'subtitle' | 'body' | 'caption' | 'small') => {
    const baseSizes = {
      title: isTinyMobile ? wp('6%') : isSmallMobile ? wp('6.5%') : isMobile ? wp('7%') : isTablet ? wp('5%') : isDesktop ? wp('4%') : isLargeDesktop ? wp('3.5%') : wp('3%'),
      subtitle: isTinyMobile ? wp('3.5%') : isSmallMobile ? wp('3.8%') : isMobile ? wp('4%') : isTablet ? wp('3%') : isDesktop ? wp('2.5%') : isLargeDesktop ? wp('2.2%') : wp('2%'),
      body: isTinyMobile ? wp('3%') : isSmallMobile ? wp('3.2%') : isMobile ? wp('3.5%') : isTablet ? wp('2.8%') : isDesktop ? wp('2.3%') : isLargeDesktop ? wp('2%') : wp('1.8%'),
      caption: isTinyMobile ? wp('2.2%') : isSmallMobile ? wp('2.5%') : isMobile ? wp('2.8%') : isTablet ? wp('2.2%') : isDesktop ? wp('2%') : isLargeDesktop ? wp('1.8%') : wp('1.5%'),
      small: isTinyMobile ? wp('2%') : isSmallMobile ? wp('2.2%') : isMobile ? wp('2.5%') : isTablet ? wp('2%') : isDesktop ? wp('1.8%') : isLargeDesktop ? wp('1.5%') : wp('1.2%'),
    };
    return baseSizes[type];
  };

  const getSpacing = (multiplier: number = 1) => {
    const base = isUltraWide ? 24 : isLargeDesktop ? 20 : isDesktop ? 16 : isTablet ? 14 : isMobile ? 12 : isSmallMobile ? 10 : 8;
    return base * multiplier;
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
  ), [searchQuery]);

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
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  let [fontsLoaded] = useFonts({ 
    Poppins_400Regular,
    Poppins_600SemiBold 
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

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

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clone the response before reading it
      const responseClone = response.clone();
      let data;
      
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }
      
      const emptyDetails = {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        pan: "",
        accountHolderName: ""
      };

      if (data?.success) {
        setBankDetails(data.data || emptyDetails);
        setFormData(data.data || emptyDetails);
      } else {
        setBankDetails(emptyDetails);
        setFormData(emptyDetails);
      }
    } catch (error) {
      console.error('Error:', error);
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
          pincode: "000000" // You might want to get this from user
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
  const ShimmerView = ({ width, height, style }) => (
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
            { translateY: Animated.multiply(slideAnim, new Animated.Value(20 * (index + 1))) },
            { scale: Animated.multiply(cardScaleAnim, new Animated.Value(1)) }
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
      <UXCard padding="lg" shadow="large" rounded="xl">
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
    // Web Layout - Enhanced with Amazing Features
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
            userEmail={userEmail}
            subjectCount={0}
            studentCount={0}
            revenue="₹2.1K"
            isSpotlight={false}
          />
          
          {/* Main Content Area */}
          <ScrollView 
            style={styles.webMainContent}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              ({ nativeEvent }) => {
                const offsetY = nativeEvent.contentOffset.y;
                const opacity = Math.max(0.7, 1 - offsetY / 300);
                Animated.timing(headerOpacity, { 
                  toValue: opacity, 
                  duration: 100, 
                  useNativeDriver: true 
                }).start();
              }
            )}
          >
            {/* Page Header */}
            <Animated.View style={[
              styles.pageHeader,
              { opacity: headerOpacity }
            ]}>
              <Text style={styles.pageTitle}>Settings</Text>
              <Text style={styles.pageSubtitle}>Manage your account preferences and customize your experience</Text>
            </Animated.View>

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
                    icon={<Ionicons name="hash-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                  
                  <UXInput
                    label="IFSC Code"
                    value={formData.ifscCode}
                    onChangeText={(text) => handleInputChange('ifscCode', text)}
                    disabled={!isEditing}
                    autoCapitalize="characters"
                    icon={<Ionicons name="code-outline" size={getIconSize()} color={UX_COLORS.textSecondary} />}
                  />
                  
                  <UXInput
                    label="PAN Number"
                    value={formData.pan}
                    onChangeText={(text) => handleInputChange('pan', text)}
                    disabled={!isEditing}
                    autoCapitalize="characters"
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
          </ScrollView>
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
                icon={<Ionicons name="hash-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
              
              <UXInput
                label="IFSC Code"
                value={formData.ifscCode}
                onChangeText={(text) => handleInputChange('ifscCode', text)}
                disabled={!isEditing}
                autoCapitalize="characters"
                icon={<Ionicons name="code-outline" size={20} color={UX_COLORS.textSecondary} />}
              />
              
              <UXInput
                label="PAN Number"
                value={formData.pan}
                onChangeText={(text) => handleInputChange('pan', text)}
                disabled={!isEditing}
                autoCapitalize="characters"
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
                value={isChecked}
                onValueChange={setIsChecked}
                trackColor={{ false: UX_COLORS.border, true: UX_COLORS.primaryLight }}
                thumbColor={isChecked ? UX_COLORS.primary : UX_COLORS.textLight}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: UX_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Web Layout Styles
  webLayout: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: UX_COLORS.background,
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
    padding: UX_CONSTANTS.spacing.xl,
  },
  
  // Page Header
  pageHeader: {
    marginBottom: UX_CONSTANTS.spacing.xxl,
  },
  pageTitle: {
    fontSize: UX_CONSTANTS.fontSize.xxl,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: UX_CONSTANTS.spacing.sm,
  },
  pageSubtitle: {
    fontSize: UX_CONSTANTS.fontSize.md,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    lineHeight: hp('2.5%'),
  },
  
  // Section Cards
  sectionCard: {
    marginBottom: UX_CONSTANTS.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UX_CONSTANTS.spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UX_CONSTANTS.spacing.sm,
  },
  sectionTitle: {
    fontSize: UX_CONSTANTS.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
  },
  editButton: {
    padding: UX_CONSTANTS.spacing.sm,
    borderRadius: UX_CONSTANTS.borderRadius.medium,
    backgroundColor: UX_COLORS.background,
  },
  
  // Form Layout
  formGrid: {
    gap: UX_CONSTANTS.spacing.md,
  },
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: UX_CONSTANTS.spacing.md,
    paddingTop: UX_CONSTANTS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: UX_COLORS.border,
  },
  countryLabel: {
    fontSize: UX_CONSTANTS.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
  },
  
  // Notification Settings
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: UX_CONSTANTS.spacing.md,
  },
  notificationContent: {
    flex: 1,
    marginRight: UX_CONSTANTS.spacing.md,
  },
  notificationTitle: {
    fontSize: UX_CONSTANTS.fontSize.md,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: UX_CONSTANTS.spacing.xs,
  },
  notificationDescription: {
    fontSize: UX_CONSTANTS.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    lineHeight: hp('2%'),
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: UX_CONSTANTS.spacing.md,
    marginTop: UX_CONSTANTS.spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  
  // Mobile-specific styles
  scrollContainer: { 
    flexGrow: 1, 
    padding: getSpacing(1.5),
    backgroundColor: UX_COLORS.background,
  },
  
  // Enhanced Profile Card Styles
  profileCard: {
    marginBottom: getSpacing(1.5),
    backgroundColor: UX_COLORS.cardBg,
    borderRadius: UX_CONSTANTS.borderRadius.xl,
    shadowColor: UX_COLORS.textSecondary,
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
    marginBottom: getSpacing(1),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: getFontSize('title'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: getSpacing(0.25),
  },
  profileEmail: {
    fontSize: getFontSize('body'),
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },
  profileActions: {
    flexDirection: 'row',
    gap: getSpacing(0.5),
  },
  profileActionButton: {
    width: getSpacing(3),
    height: getSpacing(3),
    borderRadius: getSpacing(1.5),
    backgroundColor: UX_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UX_COLORS.primary,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: getSpacing(1),
    borderTopWidth: 1,
    borderTopColor: UX_COLORS.border,
    marginTop: getSpacing(1),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: getFontSize('title'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.primary,
    marginBottom: getSpacing(0.25),
  },
  statLabel: {
    fontSize: getFontSize('small'),
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },

  // Enhanced Notification Styles
  notificationGrid: {
    gap: getSpacing(1),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(0.5),
    marginBottom: getSpacing(0.5),
  },
  notificationTitle: {
    fontSize: getFontSize('body'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    flex: 1,
  },
  notificationMeta: {
    backgroundColor: UX_COLORS.primaryLight,
    paddingHorizontal: getSpacing(0.5),
    paddingVertical: getSpacing(0.25),
    borderRadius: getSpacing(0.5),
  },
  notificationStatus: {
    fontSize: getFontSize('small'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.primary,
  },

  // Quick Actions Styles
  quickActionsContainer: {
    marginBottom: getSpacing(1.5),
  },
  quickActionsTitle: {
    fontSize: getFontSize('subtitle'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: getSpacing(1),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(1),
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(0.5),
    padding: getSpacing(1),
    borderRadius: getSpacing(1),
    backgroundColor: UX_COLORS.cardBg,
    borderWidth: 1,
    borderColor: UX_COLORS.border,
    minWidth: getSpacing(8),
  },
  quickActionText: {
    fontSize: getFontSize('small'),
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },

  // Settings Categories Styles
  settingsCategoriesContainer: {
    gap: getSpacing(2),
  },
  categoriesTitle: {
    fontSize: getFontSize('title'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: getSpacing(1),
  },
  categorySection: {
    gap: getSpacing(1),
  },
  categoryTitle: {
    fontSize: getFontSize('subtitle'),
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.textSecondary,
    marginBottom: getSpacing(1),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(1),
  },

  // Enhanced Settings Item Styles
  settingsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getSpacing(0.5),
  },
  settingsItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(0.5),
  },
  settingsItemCategory: {
    fontSize: getFontSize('small'),
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
    backgroundColor: UX_COLORS.border,
    paddingHorizontal: getSpacing(0.5),
    paddingVertical: getSpacing(0.25),
    borderRadius: getSpacing(0.25),
    textTransform: 'uppercase',
  },
  priorityIndicator: {
    width: getSpacing(0.5),
    height: getSpacing(0.5),
    borderRadius: getSpacing(0.25),
  },

  // Refresh Button Styles
  refreshButton: {
    padding: getSpacing(0.5),
    borderRadius: getSpacing(1),
  },
  
  // Premium Settings Item Styles
  premiumSettingsItem: {
    backgroundColor: UX_COLORS.cardBg,
    borderRadius: UX_CONSTANTS.borderRadius.lg,
    marginBottom: UX_CONSTANTS.spacing.md,
    shadowColor: UX_COLORS.textSecondary,
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
    padding: UX_CONSTANTS.spacing.lg,
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
    marginRight: UX_CONSTANTS.spacing.md,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: UX_CONSTANTS.fontSize.lg,
    fontFamily: 'Poppins_600SemiBold',
    color: UX_COLORS.text,
    marginBottom: 4,
  },
  settingsItemDescription: {
    fontSize: UX_CONSTANTS.fontSize.sm,
    fontFamily: 'Poppins_400Regular',
    color: UX_COLORS.textSecondary,
  },
  settingsItemArrow: {
    marginLeft: UX_CONSTANTS.spacing.sm,
  },
});

export default Settings;