import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import Svg, { Rect, Line, G, Text as SvgText, Circle } from 'react-native-svg';
import TeacherWebHeader from '../ui/TeacherWebHeader';
import ThoughtsCard from '../../app/(tabs)/StudentDashBoard/ThoughtsCard';
import TeacherPostComposer from '../ui/TeacherPostComposer';
import TeacherWebSidebar from '../ui/TeacherWebSidebar';
import { getAuthData } from '../../utils/authStorage';
import { BASE_URL } from '../../config';
import axios from 'axios';
import TeacherThoughtsCard from 'components/ui/TeacherThoughtsCard';

// Global Design Tokens
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  chartDark: '#0F172A',
  chartIndigo: '#1E293B',
  posBlue: '#3B82F6',
  negPink: '#FF4B91',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  white: '#FFFFFF',
  successGreen: '#10B981',
  warningOrange: '#F59E0B',
};

// OCR Backend Configuration
const OCR_CONFIG = {
  BASE_URL: 'https://your-ocr-backend.amazonaws.com/api', // Replace with actual EC2 endpoint
  ENDPOINTS: {
    SPOTLIGHT_DATA: '/spotlight/data',
    PERFORMANCE_METRICS: '/ocr/performance',
    REGION_ANALYSIS: '/ocr/regions',
    UPDATE_SETTINGS: '/ocr/settings'
  }
};

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi (NCT)', 'Jammu and Kashmir', 
  'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Chart data will be fetched from API
const CHART_DATA = [];

export default function SpotlightScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // State management
  const [activeItem, setActiveItem] = useState('Spotlights');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // Responsive breakpoints
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isSmallMobile = screenWidth < 480;
  
  // Dynamic font sizes
  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.9;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  // Dynamic spacing
  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.8;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  // Dynamic dimensions
  const getDimension = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.85;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toggleType, setToggleType] = useState('Subject');

  // OCR Data States
  const [spotlightData, setSpotlightData] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [regionAnalysis, setRegionAnalysis] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [ocrSettings, setOcrSettings] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuthToken(authData.token);
          setUserEmail(authData.email || '');
          setTeacherName(authData.name || 'Teacher');
          setProfileImage(authData.profileImage || null);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    };

    loadAuthData();
  }, []);

  // Fetch OCR data from AWS EC2 backend
  const fetchSpotlightData = async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      
      // Fetch spotlight data from OCR backend
      const spotlightResponse = await axios.get(`${OCR_CONFIG.BASE_URL}${OCR_CONFIG.ENDPOINTS.SPOTLIGHT_DATA}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch performance metrics
      const performanceResponse = await axios.get(`${OCR_CONFIG.BASE_URL}${OCR_CONFIG.ENDPOINTS.PERFORMANCE_METRICS}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch region analysis
      const regionResponse = await axios.get(`${OCR_CONFIG.BASE_URL}${OCR_CONFIG.ENDPOINTS.REGION_ANALYSIS}?timeRange=${selectedTimeRange}&region=${selectedRegion}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch OCR settings
      const settingsResponse = await axios.get(`${OCR_CONFIG.BASE_URL}${OCR_CONFIG.ENDPOINTS.UPDATE_SETTINGS}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Update state with real data
      if (spotlightResponse.data?.success) {
        setSpotlightData(spotlightResponse.data);
      }
      
      if (performanceResponse.data?.success) {
        setPerformanceMetrics(performanceResponse.data);
      }
      
      if (regionResponse.data?.success) {
        setRegionAnalysis(regionResponse.data);
      }
      
      if (settingsResponse.data?.success) {
        setOcrSettings(settingsResponse.data);
      }

    } catch (error) {
      console.error('Error fetching OCR data:', error);
      
      // Don't load mock data - only show real data
      setSpotlightData({
        totalDocuments: 0,
        processedToday: 0,
        accuracy: 0,
        averageProcessingTime: 0
      });
      setPerformanceMetrics({
        recognitionRate: 0,
        errorRate: 0,
        totalProcessed: 0,
        uptime: 0
      });
      setRegionAnalysis({
        topRegions: [],
        processingTime: 0
      });
      setOcrSettings({ autoProcessing: false, quality: 'medium' });
      
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.data.success) {
        const uniqueEmails = [...new Set(res.data.data.map((p: any) => p.author?.email as string).filter((email: string) => Boolean(email)))];
        await Promise.all(uniqueEmails.map((email: string) => fetchUserProfile(token, email)));
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Don't load mock posts - only show real data
      setPosts([]);

    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreatePost = async (content: string) => {
    if (!authToken || !content.trim()) return;
    
    try {
      const res = await axios.post(`${BASE_URL}/api/posts/create`, 
        { content },
        { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
      );
      
      if (res.data.success) {
        // Refresh posts after creating a new one
        await fetchPosts(authToken);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchPosts(authToken);
    }
  }, [authToken]);

  // Load data on component mount
  useEffect(() => {
    fetchSpotlightData();
  }, [authToken, selectedTimeRange, selectedRegion]);

  // Load posts when auth is available
  useEffect(() => {
    if (authToken) {
      fetchPosts(authToken);
    }
  }, [authToken]);

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value);
  };

  // Handle region change
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
  };

  // Teacher Posts Data for Thoughts (using UnifiedPost)
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());

  // Profile image cache
  const getProfileImageSource = (profilePic?: string) => {
    if (profilePic) {
      return { uri: profilePic };
    }
    return { uri: 'https://ui-avatars.com/api/?name=' + teacherName.split(' ').map(word => word[0]).join('') + '&background=random' };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const resolvePostAuthor = (post: any) => {
    const email = post.author?.email;
    if (!email) return { name: 'Unknown User', pic: null, role: 'Unknown' };
    
    const cached = userProfileCache.get(email);
    return { 
      name: cached?.name || email.split('@')[0], 
      pic: cached?.profilePic || null, 
      role: post.author?.role || 'Teacher' 
    };
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.displayName;
        const profileData = { name: userName || 'Unknown User', profilePic: profilePic || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profileData)));
        return profileData;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
  };


  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TeacherWebHeader 
        teacherName={teacherName}
        profileImage={profileImage}
        showSearch={true}
      />
      
      <View style={styles.contentLayout}>
        {/* Sidebar */}
        <TeacherWebSidebar 
          activeItem={activeItem}
          onItemPress={setActiveItem}
          userEmail={userEmail}
          teacherName={teacherName}
          profileImage={profileImage}
        />

        <View style={styles.mainWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.webDualColumns}>
              {/* Left: Main Spotlight Content */}
              <View style={styles.webMainContent}>
                <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.pageContent}>
                    {/* Enhanced Page Header */}
                    <View style={styles.enhancedPageHeader}>
                      <View style={styles.headerContent}>
                        <Text style={styles.pageTitle}>Boost Your Visibility</Text>
                        <Text style={styles.pageSubtitle}>Get discovered by more students with Spotlight features</Text>
                        <View style={styles.headerStats}>
                          <View style={styles.statBadge}>
                            <Ionicons name="trending-up" size={16} color={COLORS.successGreen} />
                            <Text style={styles.statBadgeText}>+24.5% this month</Text>
                          </View>
                          <View style={styles.statBadge}>
                            <Ionicons name="eye" size={16} color={COLORS.primaryBlue} />
                            <Text style={styles.statBadgeText}>1.2K views</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.headerIllustration}>
                        <View style={styles.illustrationCircle}>
                          <Ionicons name="star" size={32} color="#FFD700" />
                        </View>
                      </View>
                    </View>

                    {/* Enhanced Filters & Toggles */}
                    <View style={styles.enhancedControls}>
                       <View style={styles.filterGroup}>
                          <View style={styles.enhancedFilterItem}>
                             <View style={styles.filterIconRow}>
                                <Ionicons name="location-sharp" size={16} color={COLORS.primaryBlue} />
                                <Text style={styles.filterLabel}>LOCATION CONTEXT</Text>
                             </View>
                             <TextInput style={styles.filterInput} placeholder="Enter target region ..." placeholderTextColor={COLORS.textMuted} />
                          </View>

                          <View style={[styles.enhancedFilterItem, { flex: 1, marginLeft: 20, zIndex: 5000 }]}>
                             <View style={styles.filterIconRow}>
                                <MaterialCommunityIcons name="chart-bar" size={16} color={COLORS.primaryBlue} />
                                <Text style={styles.filterLabel}>State</Text>
                             </View>
                             <Dropdown initialValue="West Bengal" items={STATES} />
                          </View>
                       </View>

                       <View style={styles.enhancedToggleContainer}>
                          <TouchableOpacity 
                            style={[styles.toggleBtn, toggleType === 'Subject' && styles.toggleBtnActive]}
                            onPress={() => setToggleType('Subject')}
                          >
                            <Text style={[styles.toggleBtnText, toggleType === 'Subject' && styles.toggleBtnTextActive]}>Subject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.toggleBtn, toggleType === 'Chapter' && styles.toggleBtnActive]}
                            onPress={() => setToggleType('Chapter')}
                          >
                            <Text style={[styles.toggleBtnText, toggleType === 'Chapter' && styles.toggleBtnTextActive]}>Chapter</Text>
                          </TouchableOpacity>
                       </View>
                    </View>

                    {/* Enhanced Chart Section */}
                    <View style={styles.enhancedChartContainer}>
                       <View style={styles.chartHeader}>
                          <View style={styles.chartTitleRow}>
                            <Text style={styles.chartTitle}>Performance Analytics</Text>
                            <View style={styles.durationBadge}>
                               <Text style={styles.durationBadgeText}>Last 30 days</Text>
                            </View>
                          </View>
                          <Text style={styles.chartSubtitle}>Track your visibility and engagement metrics</Text>
                       </View>
                       
                       <View style={styles.chartArea}>
                          <CandleChart data={CHART_DATA} />
                       </View>
                    </View>

                    {/* Enhanced Stats Cards */}
                    <View style={styles.enhancedStatsContainer}>
                       <View style={styles.enhancedStatCard}>
                          <View style={styles.statIconWrapper}>
                             <Ionicons name="trending-up" size={24} color={COLORS.posBlue} />
                          </View>
                          <View style={styles.statContent}>
                             <Text style={styles.statValue}>+24.5%</Text>
                             <Text style={styles.statLabel}>Growth Rate</Text>
                             <Text style={styles.statChange}>+5.2% from last month</Text>
                          </View>
                       </View>
                       
                       <View style={styles.enhancedStatCard}>
                          <View style={styles.statIconWrapper}>
                             <Ionicons name="eye" size={24} color={COLORS.primaryBlue} />
                          </View>
                          <View style={styles.statContent}>
                             <Text style={styles.statValue}>1,247</Text>
                             <Text style={styles.statLabel}>Total Views</Text>
                             <Text style={styles.statChange}>+189 this week</Text>
                          </View>
                       </View>
                       
                       <View style={styles.enhancedStatCard}>
                          <View style={styles.statIconWrapper}>
                             <Ionicons name="people" size={24} color={COLORS.chartIndigo} />
                          </View>
                          <View style={styles.statContent}>
                             <Text style={styles.statValue}>89</Text>
                             <Text style={styles.statLabel}>New Students</Text>
                             <Text style={styles.statChange}>+12 this week</Text>
                          </View>
                       </View>
                    </View>

                    {/* Enhanced Recent Activity */}
                    <View style={styles.enhancedActivitySection}>
                       <View style={styles.activityHeader}>
                          <Text style={styles.sectionTitle}>Recent Activity</Text>
                          <TouchableOpacity style={styles.viewAllBtn}>
                            <Text style={styles.viewAllBtnText}>View All</Text>
                            <Ionicons name="chevron-forward" size={14} color={COLORS.primaryBlue} />
                          </TouchableOpacity>
                       </View>
                       <View style={styles.activityList}>
                          <View style={styles.enhancedActivityItem}>
                             <View style={styles.activityIcon}>
                                <MaterialCommunityIcons name="book-open-variant" size={20} color={COLORS.primaryBlue} />
                             </View>
                             <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>Mathematics Chapter Added</Text>
                                <Text style={styles.activityTime}>2 hours ago</Text>
                             </View>
                             <View style={styles.activityBadge}>
                                <Text style={styles.activityBadgeText}>+12 views</Text>
                             </View>
                          </View>
                          
                          <View style={styles.enhancedActivityItem}>
                             <View style={styles.activityIcon}>
                                <Ionicons name="person" size={20} color={COLORS.posBlue} />
                             </View>
                             <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>New Student Enrollment</Text>
                                <Text style={styles.activityTime}>5 hours ago</Text>
                             </View>
                             <View style={styles.activityBadge}>
                                <Text style={styles.activityBadgeText}>+1 student</Text>
                             </View>
                          </View>
                       </View>
                    </View>
                  </View>
                </ScrollView>
              </View>

              {/* Right: Thoughts Panel */}
              <View style={styles.webRightPanel}>
                <View style={styles.webRightPanelHeader}>
                  <Text style={styles.webRightPanelTitle}>Thoughts</Text>
                  <TouchableOpacity style={styles.webFilterBtn}>
                    <Ionicons name="filter" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                
                {/* Post Composer */}
                <View style={styles.webComposerWrapper}>
                  <TeacherPostComposer
                    onCreatePost={handleCreatePost}
                    placeholder="Share your thoughts..."
                  />
                </View>
                
                {/* Posts Feed */}
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.webThoughtsList}
                  style={styles.webThoughtsScrollView}
                >
                  {postsLoading && posts.length === 0 && (
                    <View style={styles.webThoughtsLoadingContainer}>
                      <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                      <Text style={styles.webThoughtsLoadingText}>Loading thoughts...</Text>
                    </View>
                  )}
                  
                  {!postsLoading && posts.length === 0 && (
                    <View style={styles.webEmptyState}>
                      <Ionicons name="chatbubble-outline" size={48} color={COLORS.textMuted} />
                      <Text style={styles.webEmptyStateTitle}>No thoughts yet</Text>
                      <Text style={styles.webEmptyStateText}>Be the first to share your thoughts!</Text>
                    </View>
                  )}
                  
                  {posts.map((post: UnifiedPost, index: number) => (
                    <View key={post.id} style={styles.webPostWrapper}>
                      <TeacherThoughtsCard
                        post={post}
                        userProfileCache={userProfileCache}
                        isTeacherContext={true}
                        onLike={(postId: string) => {
                          setPosts(posts.map(p => 
                            p.id === postId 
                              ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
                              : p
                          ));
                        }}
                        onComment={(post) => {
                          // Handle comment
                        }}
                        onReport={(post) => {
                          Alert.alert("Report", "Report this post?");
                        }}
                        getProfileImageSource={getProfileImageSource}
                        initials={getInitials}
                        resolvePostAuthor={resolvePostAuthor}
                      />
                      
                      {/* Add separator between posts */}
                      {index < posts.length - 1 && (
                        <View style={styles.webPostSeparator} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            /* Mobile Layout - Original */
            <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pageContent}>
                <Text style={styles.pageTitle}>Boost your visibility with Spotlight</Text>

                {/* Filters & Toggles */}
                <View style={styles.topControls}>
                 <View style={styles.filterGroup}>
                    <View style={styles.filterItem}>
                       <View style={styles.filterIconRow}>
                          <Ionicons name="location-sharp" size={16} color={COLORS.primaryBlue} />
                          <Text style={styles.filterLabel}>LOCATION CONTEXT</Text>
                       </View>
                       <TextInput style={styles.filterInput} placeholder="Enter target region ..." placeholderTextColor={COLORS.textMuted} />
                    </View>

                    <View style={[styles.filterItem, { flex: 1, marginLeft: 20, zIndex: 5000 }]}>
                       <View style={styles.filterIconRow}>
                          <MaterialCommunityIcons name="chart-bar" size={16} color={COLORS.primaryBlue} />
                          <Text style={styles.filterLabel}>State</Text>
                       </View>
                       <Dropdown initialValue="West Bengal" items={STATES} />
                    </View>
                 </View>

                 <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, toggleType === 'Subject' && styles.toggleBtnActive]}
                      onPress={() => setToggleType('Subject')}
                    >
                       <Text style={[styles.toggleText, toggleType === 'Subject' && styles.toggleTextActive]}>Subject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, toggleType === 'Skill' && styles.toggleBtnActive]}
                      onPress={() => setToggleType('Skill')}
                    >
                       <Text style={[styles.toggleText, toggleType === 'Skill' && styles.toggleTextActive]}>Skill</Text>
                    </TouchableOpacity>
                 </View>
                </View>

                {/* Main Section: Chart + Pricing */}
                <View style={[styles.mainSection, (isMobile || isTablet) && { flexDirection: 'column' }]}>
                  <View style={[styles.chartContainer, (isMobile || isTablet) && { width: '100%', marginBottom: 30 }]}>
                      <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Spotlight Tarrifs</Text>
                        <TouchableOpacity style={styles.timeDropdown}>
                            <Text style={styles.timeDropdownText}>Daily</Text>
                            <Ionicons name="chevron-down" size={14} color="white" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.chartArea}>
                        <CandleChart data={CHART_DATA} />
                      </View>
                  </View>

                  <View style={[styles.pricingCard, (isMobile || isTablet) && { width: '100%' }]}>
                      <View style={styles.pricingHeader}>
                        <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>RECOMMENDED</Text>
                        </View>
                        <Text style={[
                          styles.pageTitle,
                          isMobile && styles.pageTitleMobile,
                          isSmallMobile && styles.pageTitleSmallMobile
                        ]}>Spotlights</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceSymbol}>₹</Text>
                            <Text style={styles.priceValue}>149</Text>
                            <Text style={styles.priceUnit}>/month</Text>
                        </View>
                      </View>
                      
                      <View style={styles.featuresList}>
                        <FeatureItem label="Full Regional" />
                        <FeatureItem label="Predictive Pricing" />
                        <FeatureItem label="Unlimited Density" />
                        <FeatureItem label="24/7 Priority Support" />
                      </View>

                      <TouchableOpacity style={styles.upgradeBtn}>
                        <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                      </TouchableOpacity>
                  </View>
                </View>

                {/* Pricing Section */}
                <View style={[
                      styles.mainSection,
                      isMobile && styles.mainSectionMobile,
                      isTablet && styles.mainSectionTablet
                    ]}>
                  <View style={[
                    styles.chartContainer,
                    isMobile && styles.chartContainerMobile,
                    isTablet && styles.chartContainerTablet
                  ]}>
                      <Text style={styles.adSectionTitle}>Advertising</Text>
                  <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1540200049848-d9813ea0e120?q=80&w=2070' }} 
                      style={styles.adBannerImg}
                  />
                  <View style={styles.adContent}>
                      <Text style={styles.adTitle}>Summer sale is on!</Text>
                      <Text style={styles.adSubtitle}>Buy your loved pieces with reduced prices upto 70% off!</Text>
                  </View>
                </View>
                

                
                {/* Teacher Thoughts Section - Real Implementation */}
                <View style={styles.thoughtsSection}>
                  <Text style={styles.sectionTitle}>Teacher Thoughts</Text>
                  
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                    <TeacherPostComposer
                      onCreatePost={handleCreatePost}
                      placeholder="Post your thoughts..."
                    />
                    {postsLoading && posts.length === 0 && (
                      <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                    )}
                    {!postsLoading && posts.length === 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                        <Text style={{ fontSize: 16, color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                          No thoughts yet. Be the first to share!
                        </Text>
                      </View>
                    )}
                    {posts.map((post: any) => {
                      const resolvePostAuthor = (post: any) => {
                        const userProfile = userProfileCache.get(post.author.email) || { name: 'Unknown User', profilePic: '' };
                        let name = userProfile.name || post.author.name;
                        let pic: string | null = userProfile.profilePic || post.author.profile_pic;
                        let role = post.author.role;
                        
                        if (!name || name === 'null' || name === 'undefined' || name.trim() === '' || name.includes('@')) {
                          name = post.author.email?.split('@')[0] || 'Unknown User';
                        }
                        
                        if (pic && pic !== '' && pic !== 'null' && pic !== 'undefined') {
                          if (!pic.startsWith('http') && !pic.startsWith('/')) {
                            pic = `/${pic}`;
                          }
                        } else {
                          pic = null;
                        }
                        
                        if (!role || role.trim() === '' || role === 'null' || role === 'undefined') {
                          role = 'User';
                        }
                        
                        return { name, pic, role };
                      };

                      const initials = (name: string) => {
                        return name ? name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) : 'U';
                      };

                      return (
                        <ThoughtsCard
                          key={post.id}
                          post={post}
                          onLike={(postId: string) => {
                            setPosts(posts.map(p => 
                              p.id === postId 
                                ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
                                : p
                            ));
                          }}
                          onComment={(post) => {
                            // Handle comment logic
                          }}
                          onReport={(post) => {
                            // Handle report logic
                          }}
                          getProfileImageSource={getProfileImageSource}
                          initials={initials}
                          resolvePostAuthor={resolvePostAuthor}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
                </View>
                </View>
                
            </ScrollView>
            
                  )}
    
            </View>
            </View>
            </View>
  )
}
        

// --- Chart Component (High-Precision Scale) ---
const CandleChart = ({ data }: any) => {
  // Chart Constants - Perfect Scaling
  const CHART_CONSTANTS = {
    HEIGHT: 320,
    PADDING: 60,
    GRID_LINES: [0, 25, 50, 75, 100],
    BAR_WIDTH: 12,
    MIN_BAR_HEIGHT: 6,
    COLORS: {
      POSITIVE: '#3B82F6',
      NEGATIVE: '#FF4B91',
      GRID: 'rgba(255,255,255,0.06)',
      WICK: 'rgba(255,255,255,0.04)',
      LABEL: '#94A3B8'
    },
    FONTS: {
      LABEL: 'Poppins_400Regular',
      LABEL_SIZE: 11
    }
  };

  // Responsive chart dimensions
  const getChartDimensions = () => {
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth > 800 ? 780 : screenWidth * 0.8;
    const colWidth = chartWidth / data.length;
    return { chartWidth, chartHeight: CHART_CONSTANTS.HEIGHT, colWidth };
  };

  const { chartWidth, chartHeight } = getChartDimensions();
  const scale = chartHeight / 100;

  return (
    <View style={styles.svgContainer}>
      <Svg height={chartHeight + CHART_CONSTANTS.PADDING} width={chartWidth}>
        {/* Perfect Grid Lines */}
        {CHART_CONSTANTS.GRID_LINES.map((val) => (
          <Line
            key={`h-${val}`}
            x1="0"
            y1={chartHeight - val * scale}
            x2={chartWidth}
            y2={chartHeight - val * scale}
            stroke={CHART_CONSTANTS.COLORS.GRID}
            strokeWidth="1"
          />
        ))}

        {/* Perfect Candlesticks */}
        {data.map((item: any, index: number) => {
          const x = index * (chartWidth / data.length) + (chartWidth / data.length) / 2;
          const highY = chartHeight - (item.high || 0) * scale;
          const lowY = chartHeight - (item.low || 0) * scale;
          const openY = chartHeight - (item.open || 0) * scale;
          const closeY = chartHeight - (item.close || 0) * scale;
          
          const barTop = Math.min(openY, closeY);
          const barBottom = Math.max(openY, closeY);
          const barHeight = Math.max(barBottom - barTop, CHART_CONSTANTS.MIN_BAR_HEIGHT);
          const color = item.pos ? CHART_CONSTANTS.COLORS.POSITIVE : CHART_CONSTANTS.COLORS.NEGATIVE;
          
          return (
            <G key={index}>
               {/* Perfect Wick */}
               <Line 
                 x1={x} 
                 y1={highY} 
                 x2={x} 
                 y2={lowY} 
                 stroke={CHART_CONSTANTS.COLORS.WICK} 
                 strokeWidth="1.5"
               />
               
               {/* Perfect Body */}
               <Rect 
                 x={x - CHART_CONSTANTS.BAR_WIDTH / 2} 
                 y={barTop} 
                 width={CHART_CONSTANTS.BAR_WIDTH} 
                 height={barHeight} 
                 fill={color} 
                 rx={6}
               />
               
               {/* Perfect Label */}
               <SvgText
                 x={x}
                 y={chartHeight + 25}
                 fill={CHART_CONSTANTS.COLORS.LABEL}
                 fontSize={CHART_CONSTANTS.FONTS.LABEL_SIZE}
                 textAnchor="middle"
                 fontFamily={CHART_CONSTANTS.FONTS.LABEL}
               >
                 {item.day}
               </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// --- Functional & Perfectly Aligned Dropdown ---
const Dropdown = ({ initialValue, items }: any) => {
   const [open, setOpen] = useState(false);
   const [selected, setSelected] = useState(initialValue);

   return (
      <View style={{ position: 'relative', width: '100%', zIndex: 10000 }}>
         <TouchableOpacity 
           style={[styles.dropdownTrigger, open && { borderColor: COLORS.primaryBlue, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
           onPress={() => setOpen(!open)}
         >
            <Text style={styles.dropdownValue}>{selected}</Text>
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textBody} />
         </TouchableOpacity>

         {open && (
            <View style={styles.dropdownMenu}>
               <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }} showsVerticalScrollIndicator={true}>
                  {items.map((state: string) => (
                     <TouchableOpacity 
                        key={state} 
                        style={styles.dropdownOption}
                        onPress={() => { setSelected(state); setOpen(false); }}
                     >
                        <Text style={[styles.optionText, selected === state && { color: COLORS.primaryBlue, fontFamily: 'Poppins_600SemiBold' }]}>{state}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
         )}
      </View>
   );
};

const FeatureItem = ({ label }: any) => (
   <View style={styles.featureItem}>
      <View style={styles.checkCircle}>
         <Ionicons name="checkmark" size={18} color={COLORS.primaryBlue} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
   </View>
);

// --- Sidebar & Header ---
const Sidebar = ({ activeItem, isMobile, isTablet }: any) => {
   const items = [
     { label: 'Dashboard', icon: 'view-dashboard-outline' },
     { label: 'Profile', icon: 'account-outline' },
     { label: 'Spotlights', icon: 'auto-fix' },
     { label: 'Connect', icon: 'chat-outline' },
     { label: 'Share', icon: 'share-variant-outline' },
     { label: 'Create Subject', icon: 'plus-box-outline' },
     { label: 'Billing', icon: 'cash-register' },
     { label: 'Faq', icon: 'help-circle-outline' },
     { label: 'Terms & Conditions', icon: 'file-document-outline' },
     { label: 'Privacy Policy', icon: 'shield-check-outline' },
     { label: 'Contact Us', icon: 'phone-outline' },
     { label: 'Raise a Complaint', icon: 'alert-circle-outline' },
   ];

   return (
     <View style={[styles.sidebar, isMobile && styles.mobileSidebar, isTablet && { width: 80, alignItems: 'center' }]}>
       <Text style={[styles.brandTitle, isTablet && { fontSize: 16 }]}>Growsmart</Text>
       <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
         <Text style={styles.navHeader}>Main Menu</Text>
         <View style={styles.sidebarDivider} />
         <Text style={styles.navHeader}>Favorites</Text>
         
         <View style={styles.sidebarAdvertising}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070' }} style={styles.adImg} />
            <Text style={styles.sidebarAdTitle}>Summer sale is on!</Text>
            <Text style={styles.sidebarAdSubtitle}>Buy your loved pieces with reduced prices upto 70% off!</Text>
         </View>
       </ScrollView>
     </View>
   );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentLayout: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 260, backgroundColor: COLORS.white, paddingVertical: 35, paddingHorizontal: 20, borderRightWidth: 1, borderRightColor: COLORS.border },
  mobileSidebar: { width: 260, position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 100 },
  brandTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primaryBlue, marginBottom: 40, paddingHorizontal: 12 },
  navHeader: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', paddingHorizontal: 15 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, marginBottom: 6, position: 'relative' },
  sidebarItemActive: { backgroundColor: '#EEF2FF' },
  activeIndicator: { position: 'absolute', left: 0, width: 4, height: 24, backgroundColor: COLORS.primaryBlue, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  sidebarDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 15, marginHorizontal: 10 },
  sidebarLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: COLORS.textBody, marginLeft: 15 },
  sidebarLabelActive: { color: COLORS.primaryBlue, fontFamily: 'Poppins_600SemiBold' },
  sidebarAdvertising: { backgroundColor: '#F5F7FF', borderRadius: 16, padding: 15, marginTop: 30, marginBottom: 20, borderWidth: 1, borderColor: '#E0E7FF' },
  adImg: { width: '100%', height: 100, borderRadius: 10, marginBottom: 10 },
  sidebarAdTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: COLORS.textHeader },
  sidebarAdSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: COLORS.textBody, marginTop: 4 },

  mainWrapper: { flex: 1, flexDirection: 'column' },
  header: { height: 75, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 25, paddingHorizontal: 18, width: wp('30%') },
  headerSearch: { flex: 1, height: 44, fontFamily: 'Poppins_400Regular', fontSize: 13, marginLeft: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  notifDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#EF4444', position: 'absolute', top: 10, right: 12, borderWidth: 1.5, borderColor: COLORS.white },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textHeader, marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },

  mainScroll: { flex: 1 },
  scrollContent: { padding: wp('3%') },
  pageContent: { flex: 1 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 44, color: COLORS.textHeader, marginBottom: 40, letterSpacing: -1 },
  pageTitleMobile: { fontSize: 32, marginBottom: 25 },
  pageTitleSmallMobile: { fontSize: 28, marginBottom: 20 },

  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 35 },
  filterGroup: { flex: 1, flexDirection: 'row', marginRight: wp('5%') },
  filterItem: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 4 },
  filterIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  filterLabel: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: COLORS.textHeader, marginLeft: 12, textTransform: 'uppercase' },
  filterInput: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textBody, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10 },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, width: '100%', borderWidth: 1, borderColor: '#F3F4F6' },
  dropdownValue: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textHeader },

  toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 10, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  toggleBtn: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: COLORS.primaryBlue },
  toggleText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.white },

  mainSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  mainSectionMobile: { flexDirection: 'column' },
  mainSectionTablet: { flexDirection: 'column' },
  chartContainer: { width: '58%', backgroundColor: COLORS.chartDark, borderRadius: 16, padding: 25, overflow: 'hidden' },
  chartContainerMobile: { width: '100%', marginBottom: 20 },
  chartContainerTablet: { width: '60%', marginBottom: 20 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  chartTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.white },
  timeDropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  timeDropdownText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.white },
  chartArea: { height: 380, justifyContent: 'center', alignItems: 'center', marginTop: -10 },
  svgContainer: { marginTop: 0 },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.primaryBlue,
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 15,
    zIndex: 10000,
    overflow: 'hidden'
  },
  dropdownOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#64748B',
  },

  pricingCard: { width: '22%', backgroundColor: '#2563EB', borderRadius: 16, padding: 30, shadowColor: COLORS.primaryBlue, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 15 },
  pricingCardMobile: { width: '100%', marginBottom: 20 },
  pricingCardTablet: { width: '35%', marginBottom: 20 },
  pricingSection: { marginBottom: 40 },
  pricingHeader: { marginBottom: 35 },
  recommendedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 15 },
  recommendedText: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: COLORS.white },
  planTitle: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: COLORS.white, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  priceSymbol: { fontFamily: 'Poppins_600SemiBold', fontSize: 24, color: COLORS.white, marginBottom: 6, marginRight: 4 },
  priceValue: { fontFamily: 'Poppins_700Bold', fontSize: 42, color: COLORS.white },
  priceUnit: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },

  featuresList: { marginBottom: 45 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  featureLabel: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: COLORS.white },
  upgradeBtn: { backgroundColor: COLORS.white, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center' },
  upgradeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.primaryBlue },

  bottomAd: { backgroundColor: COLORS.white, borderRadius: 16, padding: wp('3%'), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 30 },
  adSectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: COLORS.textHeader, marginBottom: 20 },
  adBannerImg: { width: '100%', height: hp('15%'), borderRadius: 12, marginBottom: 20 },
  adContent: { paddingHorizontal: 10 },
  adTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.textHeader },
  adSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textBody, marginTop: 4 },
  thoughtsSection: { backgroundColor: COLORS.white, borderRadius: 16, padding: wp('3%'), shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 30 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.textHeader, marginBottom: 20 },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, flexDirection: 'row' },
  
  // Web Layout Styles for Spotlight
  webDualColumns: {
    flexDirection: 'row',
    flex: 1,
  },
  webMainContent: {
    flex: 1,
    marginRight: 30,
  },
  webRightPanel: {
    width: Platform.OS === 'web' ? '30%' : '30%',
    minWidth: 350,
    maxWidth: 450,
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingTop: 24,
    paddingHorizontal: 16,
    flexDirection: 'column',
  },
  webRightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  webRightPanelTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
    fontWeight: '600',
  },
  webFilterBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  webComposerWrapper: {
    marginBottom: 20,
  },
  webThoughtsScrollView: {
    flex: 1,
  },
  webThoughtsList: {
    paddingBottom: 40,
    gap: 0,
  },
  webPostWrapper: {
    marginBottom: 0,
  },
  webPostSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  webEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  webEmptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textHeader,
    marginTop: 16,
    marginBottom: 8,
  },
  webEmptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  webThoughtsLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  webThoughtsLoadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Additional styles needed for the spotlight content
  toggleBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textBody,
  },
  toggleBtnTextActive: {
    color: COLORS.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  durationBadge: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 3,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.textHeader,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activitySection: {
    marginBottom: 30,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 3,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textHeader,
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activityBadge: {
    backgroundColor: COLORS.posBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: COLORS.white,
  },

  // Enhanced UI Styles
  enhancedPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 20,
    padding: 30,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 30px rgba(37, 99, 235, 0.3)',
      },
      default: {
        shadowColor: COLORS.primaryBlue,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },
  headerContent: {
    flex: 1,
  },
  pageSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 6,
  },
  headerIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  enhancedControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 35,
  },
  enhancedFilterItem: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryBlue,
  },
  enhancedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },

  enhancedChartContainer: {
    backgroundColor: COLORS.chartDark,
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 15px 35px rgba(15, 23, 42, 0.3)',
      },
      default: {
        shadowColor: COLORS.chartDark,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 35,
        elevation: 15,
      },
    }),
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  enhancedStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  enhancedStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 6,
      },
    }),
    borderTopWidth: 3,
    borderTopColor: COLORS.primaryBlue,
  },
  statChange: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.successGreen,
    marginTop: 4,
  },

  enhancedActivitySection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 25,
        elevation: 6,
      },
    }),
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.primaryBlue,
    marginRight: 4,
  },
  enhancedActivityItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryBlue,
  },
});