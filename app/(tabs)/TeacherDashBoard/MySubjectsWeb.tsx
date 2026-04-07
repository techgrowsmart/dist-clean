import React, { useState, useEffect } from 'react';
import { 
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
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
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import axios from 'axios';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import ThoughtsCard from '../StudentDashBoard/ThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import { api } from '../../../services/apiService';

// Global Design Tokens
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  primaryGradient: ['#2563EB', '#1D4ED8'],
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',
  purpleBadge: '#F3E8FF',
  purpleText: '#9333EA',
  bannerTint: '#EEF2FF',
};

export default function MySubjectsWeb() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // States
  const [sidebarActiveItem, setSidebarActiveItem] = useState('My Subjects');
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // Enhanced responsive breakpoints
  const isSmallMobile = screenWidth < 480;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  
  // Dynamic helper functions
  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.9;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.8;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [thoughtsExpanded, setThoughtsExpanded] = useState(false);

  // Teacher Posts Data for Thoughts (using Post interface from ThoughtsCard)
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Subject data from Profile2.tsx
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add loading state like TeacherDashboard
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Fetch teacher subjects from Profile2.tsx
  const fetchTeacherSubjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const auth = await getAuthData();
      if (!auth?.token) {
        setError('Authentication required');
        return;
      }
      
      // Fetch teacher profile to get their subjects
      const response = await api.post(
        "/api/userProfile",
        { email: auth.email }
      );
      
      if (response.data && response.data.data && response.data.data.subjects) {
        const subjects = response.data.data.subjects;
        setTeacherSubjects(Array.isArray(subjects) ? subjects : []);
        console.log('Teacher subjects loaded:', subjects.length);
      } else {
        // If no subjects in profile, check if they have tuitions
        const tuitionsResponse = await api.post(
          "/api/teacherProfile",
          { email: auth.email }
        );
        
        if (tuitionsResponse.data && tuitionsResponse.data.tuitions) {
          const tuitions = tuitionsResponse.data.tuitions;
          const subjectNames = tuitions
            .filter((t: any) => t.subject && t.subject.trim())
            .map((t: any) => ({
              id: Math.random().toString(),
              title: t.subject,
              class: t.class || 'Not specified',
              status: 'ACTIVE',
              image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop',
              icon: 'calculator'
            }));
          setTeacherSubjects(subjectNames);
          console.log('Subjects extracted from tuitions:', subjectNames.length);
        } else {
          setTeacherSubjects([]);
          console.log('No subjects found in profile or tuitions');
        }
      }
    } catch (err: any) {
      console.error('Error fetching teacher subjects:', err);
      setError('Failed to load subjects');
      setTeacherSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load teacher subjects on component mount
  useEffect(() => {
    fetchTeacherSubjects();
  }, []);

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Navigate based on item
    switch (item) {
      case "Dashboard":
        router.push("/(tabs)/TeacherDashBoard/TutorDashboardWeb");
        break;
      case "My Students":
        router.push("/(tabs)/TeacherDashBoard/StudentsEnrolled");
        break;
      case "My Subjects":
        // Already on My Subjects
        break;
      case "Create Subject":
        router.push("/(tabs)/TeacherDashBoard/CreateSubject");
        break;
      case "Spotlights":
        router.push("/(tabs)/TeacherDashBoard/JoinedDateWeb");
        break;
      case "Share":
        router.push("/(tabs)/TeacherDashBoard/Share");
        break;
      case "Profile":
        router.push("/(tabs)/TeacherDashBoard/Profile2");
        break;
      case "Billing":
        router.push("/(tabs)/TeacherDashBoard/Settings");
        break;
      case "Settings":
        router.push("/(tabs)/TeacherDashBoard/Settings");
        break;
      case "Contact Us":
        router.push("/(tabs)/Contact");
        break;
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const width = window.width;
      // Auto-collapse sidebar on small screens
      if (width < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    });
    
    // Initial sidebar state based on screen size
    const initialWidth = Dimensions.get('window').width;
    if (initialWidth < 1024) {
      setSidebarCollapsed(true);
    }
    
    return () => subscription.remove();
  }, []);

  // Load teacher data and posts like TeacherDashboard
  useEffect(() => {
    const loadTeacherDataAndPosts = async () => {
      try {
        setIsDashboardLoading(true);
        
        // Get auth data
        const authData = await getAuthData();
        console.log('Auth data loaded:', authData ? 'Success' : 'Failed');
        
        if (authData?.token) {
          setAuthToken(authData.token);
          setTeacherName(authData.name || 'Teacher');
          setUserEmail(authData.email || '');
          setProfileImage(authData.profileImage || null);
          
          console.log('Teacher data set, ready for real posts');
          // Posts will be fetched via fetchPosts function
          setPostsLoading(false);
        } else {
          console.error('No auth data found');
          // No auth data, posts will remain empty
          setPostsLoading(false);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        // Error loading data, posts will remain empty
        setPostsLoading(false);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    loadTeacherDataAndPosts();
  }, []);

  // Fetch posts function (updated for real data only)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      console.log('Fetching posts with token:', token ? 'Token exists' : 'No token');
      
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });
      
      console.log('Posts API response:', res.data);
      
      if (res.data.success && res.data.data) {
        // Fetch comments for each post and process post data
        const postsWithComments = await Promise.all(
          res.data.data.map(async (post: any) => {
            try {
              const commentsResponse = await axios.get(`${BASE_URL}/api/posts/${post.id}/comments`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const comments = commentsResponse.data.success ? commentsResponse.data.data : [];
              
              return {
                ...post,
                postImage: post.postImage && !post.postImage.startsWith('http')
                  ? `${BASE_URL}${post.postImage.startsWith('/') ? '' : '/'}${post.postImage}`
                  : post.postImage,
                createdAt: post.createdAt,
                isLiked: post.isLiked || false,
                comments: comments.map((comment: any) => ({
                  ...comment,
                  createdAt: comment.createdAt,
                  isLiked: false
                }))
              };
            } catch (error) {
              console.error('Error fetching comments for post:', post.id, error);
              return {
                ...post,
                postImage: post.postImage && !post.postImage.startsWith('http')
                  ? `${BASE_URL}${post.postImage.startsWith('/') ? '' : '/'}${post.postImage}`
                  : post.postImage,
                createdAt: post.createdAt,
                isLiked: post.isLiked || false,
                comments: []
              };
            }
          })
        );
        
        // Fetch user profiles for all post authors
        await fetchUserProfilesForPosts(postsWithComments, token);
        
        console.log('Setting posts from API:', postsWithComments.length, 'posts');
        setPosts(postsWithComments);
      } else {
        console.log('API response unsuccessful or no posts, setting empty array');
        setPosts([]);
      }
      setPostsLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Don't load mock posts - only show real data
      console.log('Setting empty posts array - no mock data');
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Handle post creation (same as ConnectWeb)
  const handleCreatePost = async (content: string) => {
    if (!authToken || !userEmail) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/posts/create`, {
        content,
        authorEmail: userEmail,
        authorName: teacherName,
        postType: 'teacher'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Refresh posts to include the new one
        if (authToken) {
          await fetchPosts(authToken);
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create post. Please try again.');
    }
  };

  // Load teacher data and fetch posts
  useEffect(() => {
    const loadTeacherDataAndPosts = async () => {
      try {
        // Get auth data
        const authData = await getAuthData();
        console.log('Auth data loaded:', authData ? 'Success' : 'Failed');
        
        if (authData?.token) {
          setAuthToken(authData.token);
          setTeacherName(authData.name || 'Teacher');
          setUserEmail(authData.email || '');
          setProfileImage(authData.profileImage || null);
          
          // Fetch posts with the auth token
          await fetchPosts(authData.token);
        } else {
          console.error('No auth data found');
          // Use bypass token for demo
          await fetchPosts("bypass_token_teacher1");
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        // Use bypass token for demo
        await fetchPosts("bypass_token_teacher1");
      }
    };

    loadTeacherDataAndPosts();
  }, []);

  // Fetch user profile using the same API as other teacher pages
  const fetchUserProfile = async (token: string, email: string) => {
    try {
      console.log('🔍 Fetching user profile from AstraDB for:', email);
      
      // Check cache first
      if (userProfileCache.has(email)) {
        console.log('✅ Using cached profile for:', email);
        return userProfileCache.get(email)!;
      }
      
      // Try AstraDB test table first for real user data
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { 
        email: email,
        source: 'astraDB'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Try different possible field names for profile picture
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        
        // Try different possible field names for user name
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.fullName || response.data.displayName;
        
        console.log('✅ User profile from AstraDB:', { name: userName, profilePic: profilePic });
        
        if (profilePic || userName) {
          // Ensure we have a proper URL format for profile image
          let finalProfilePic = profilePic;
          if (finalProfilePic && !finalProfilePic.startsWith('http') && !finalProfilePic.startsWith('/')) {
            finalProfilePic = `/${finalProfilePic}`;
          }
          
          const profileData = { name: userName || 'Unknown User', profilePic: finalProfilePic || '' };
          
          // Cache the result
          setUserProfileCache(prev => new Map(prev.set(email, profileData)));
          
          return profileData;
        } else {
          console.log('⚠️ No profile image or name found in response');
        }
      }
    } catch (error) {
      console.log('❌ Profile fetch error:', error);
      // Don't show alert for profile image fetch error as it's not critical
    }
    
    return { name: 'Unknown User', profilePic: '' };
  };

  // Enhanced function to fetch and cache multiple user profiles
  const fetchUserProfilesForPosts = async (posts: any[], token: string) => {
    const uniqueEmails = [...new Set(posts.map(post => post.author.email))];
    
    const profilePromises = uniqueEmails.map(async (email) => {
      if (!userProfileCache.has(email)) {
        return await fetchUserProfile(token, email);
      }
      return null;
    });
    
    await Promise.all(profilePromises);
  };

  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: teacherName || 'Unknown Teacher',
        pic: profileImage || null,
        role: 'teacher'
      };
    }
    
    // Use cached profile data like TeacherDashboard
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    let name = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
    
    // Handle email fallback for name
    if (!name || name === 'null' || name.includes('@')) {
      name = post.author?.email?.split('@')[0] || teacherName || 'Unknown Teacher';
      // Clean up the name (remove dots, capitalize)
      name = name.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Handle profile image path
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) {
      pic = `/${pic}`;
    }
    if (pic === '' || pic === 'null') {
      pic = profileImage || null;
    }
    
    return { name, pic, role: post.author?.role || 'teacher' };
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (profilePic) {
      // Handle different image path formats
      if (profilePic.startsWith('http')) {
        return { uri: profilePic };
      }
      // For local paths, construct proper URL
      const imageUrl = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
      return { uri: `${BASE_URL}${imageUrl}` };
    }
    return null;
  };

  const initials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Entry Animation Styles
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(300, withSpring(0));
  }, []);

  const animatedPageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Debug log for posts state
  useEffect(() => {
    console.log('Posts state updated:', posts.length, 'posts, loading:', postsLoading);
  }, [posts, postsLoading]);

  if (!fontsLoaded || isDashboardLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={{ marginTop: 10, fontSize: 16, color: COLORS.textBody }}>Loading...</Text>
      </View>
    );
  }

  return (
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        <View style={styles.webContent}>
          {/* Mobile Sidebar Overlay */}
          {(isMobile || isTablet) && showSidebar && (
            <View style={styles.sidebarOverlay}>
              <TouchableOpacity 
                style={styles.sidebarOverlayTouchable}
                activeOpacity={1}
                onPress={() => setShowSidebar(false)}
              />
              <View style={[styles.mobileSidebarContainer, { transform: [{ translateX: showSidebar ? 0 : -280 }] }]}>
                <TeacherWebSidebar 
                  activeItem={sidebarActiveItem}
                  onItemPress={handleSidebarSelect}
                  userEmail={userEmail}
                  teacherName={teacherName}
                  profileImage={profileImage}
                  subjectCount={teacherSubjects.length}
                  studentCount={12}
                  revenue="₹18.7K"
                  isSpotlight={true}
                />
              </View>
            </View>
          )}
          
          {/* Desktop Sidebar */}
          {!(isMobile || isTablet) && (
            <TeacherWebSidebar 
              activeItem={sidebarActiveItem}
              onItemPress={handleSidebarSelect}
              userEmail={userEmail}
              teacherName={teacherName}
              profileImage={profileImage}
              subjectCount={teacherSubjects.length}
              studentCount={12}
              revenue="₹18.7K"
              isSpotlight={true}
            />
          )}
          
          <View style={[
            styles.webMainContent, 
            sidebarCollapsed && !isMobile && !isTablet && styles.webMainContentExpanded,
            (isMobile || isTablet) && styles.webMainContentMobile
          ]}>
            <ScrollView 
              style={styles.mainScrollView}
              contentContainerStyle={styles.mainScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[styles.contentContainer, animatedPageStyle]}>
                {/* Page Header */}
                <View style={styles.pageHeaderRow}>
                   <View>
                      <Text style={styles.pageTitle} selectable={false}>My Subjects</Text>
                      <Text style={styles.pageSubtitle} selectable={false}>Manage your subjects and create new subjects</Text>
                   </View>
                   <TouchableOpacity 
                      style={styles.createBtn}
                      onPress={() => router.push("/(tabs)/TeacherDashBoard/CreateSubject")}
                   >
                      <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.createBtnText} selectable={false}>Create New Subject</Text>
                   </TouchableOpacity>
                </View>

                {/* Grid of Subject Cards */}
                <View style={styles.gridContainer}>
                   {isLoading ? (
                     <View style={styles.loadingContainer}>
                       <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                       <Text style={{ marginTop: 10, fontSize: 16, color: COLORS.textBody }}>Loading subjects...</Text>
                     </View>
                   ) : error ? (
                     <View style={styles.errorContainer}>
                       <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
                       <Text style={styles.errorText}>{error}</Text>
                       <TouchableOpacity 
                         style={styles.retryButton}
                         onPress={fetchTeacherSubjects}
                       >
                         <Text style={styles.retryButtonText}>Retry</Text>
                       </TouchableOpacity>
                     </View>
                   ) : teacherSubjects.length === 0 ? (
                     <View style={styles.emptyState}>
                       <MaterialCommunityIcons name="book-open" size={64} color={COLORS.textMuted} />
                       <Text style={styles.emptyStateText}>No subjects available</Text>
                       <Text style={styles.emptyStateSubtext}>
                         Please add subjects in your profile to manage them here.
                       </Text>
                     </View>
                   ) : (
                     teacherSubjects.map((subject, index) => (
                       <SubjectCard 
                         key={subject.id} 
                         subject={subject} 
                         index={index} 
                         isMobile={isMobile} 
                       />
                     ))
                   )}
                </View>
              </Animated.View>
            </ScrollView>

            {/* RIGHT: Thoughts Panel - Responsive */}
            {Platform.OS === 'web' && !(isMobile || isTablet) && (
              <View style={styles.rightPanel}>
                <View style={styles.rightPanelHeader}>
                  <Text style={styles.rightPanelTitle} selectable={false}>Thoughts</Text>
                  <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="filter" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                
                {/* Post Composer */}
                <View style={styles.composerWrapper}>
                  <TeacherPostComposer
                    onCreatePost={handleCreatePost}
                    placeholder="Share your thoughts..."
                  />
                </View>
                
                {/* Posts Feed */}
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={styles.thoughtsList}
                  style={styles.thoughtsScrollView}
                >
                  {postsLoading && posts.length === 0 && (
                    <View style={styles.thoughtsLoadingContainer}>
                      <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                      <Text style={styles.thoughtsLoadingText} selectable={false}>Loading thoughts...</Text>
                    </View>
                  )}
                  
                  {!postsLoading && posts.length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons name="chatbubble-outline" size={48} color={COLORS.textMuted} />
                      <Text style={styles.emptyStateTitle} selectable={false}>No thoughts yet</Text>
                      <Text style={styles.emptyStateText} selectable={false}>Be the first to share your thoughts!</Text>
                    </View>
                  )}
                  
                  {posts.map((post: any) => {
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
                          Alert.alert("Report", "Report this post?");
                        }}
                        getProfileImageSource={getProfileImageSource}
                        initials={initials}
                        resolvePostAuthor={resolvePostAuthor}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* MOBILE: Collapsible Thoughts Section */}
            {(isMobile || isTablet) && (
              <View style={styles.mobileThoughtsSection}>
                <View style={styles.mobileThoughtsHeader}>
                  <Text style={styles.mobileThoughtsTitle} selectable={false}>Thoughts</Text>
                  <TouchableOpacity 
                    style={styles.mobileThoughtsToggle}
                    onPress={() => setThoughtsExpanded(!thoughtsExpanded)}
                  >
                    <Ionicons 
                      name={thoughtsExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={COLORS.primaryBlue} 
                    />
                  </TouchableOpacity>
                </View>

                {thoughtsExpanded && (
                  <View style={styles.mobileThoughtsContent}>
                    {/* Post Composer */}
                    <View style={styles.mobileComposerWrapper}>
                      <TeacherPostComposer
                        onCreatePost={handleCreatePost}
                        placeholder="Share your thoughts..."
                      />
                    </View>
                    
                    {/* Posts Feed - Limited to 3 posts */}
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.mobileThoughtsList}
                      style={styles.mobileThoughtsScroll}
                    >
                      {postsLoading && posts.length === 0 && (
                        <View style={styles.thoughtsLoadingContainer}>
                          <ActivityIndicator color={COLORS.primaryBlue} size="small" />
                          <Text style={styles.mobileLoadingText} selectable={false}>Loading...</Text>
                        </View>
                      )}
                      
                      {!postsLoading && posts.length === 0 && (
                        <View style={styles.mobileEmptyState}>
                          <Ionicons name="chatbubble-outline" size={32} color={COLORS.textMuted} />
                          <Text style={styles.mobileEmptyText} selectable={false}>No thoughts yet</Text>
                        </View>
                      )}
                      
                      {/* Show only first 3 posts or all if expanded */}
                      {posts.slice(0, thoughtsExpanded ? posts.length : 3).map((post: any, index: number) => {
                        return (
                          <View key={post.id} style={styles.mobilePostWrapper}>
                            <ThoughtsCard
                              post={post}
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
                              initials={initials}
                              resolvePostAuthor={resolvePostAuthor}
                            />
                            
                            {/* Add separator between posts */}
                            {index < Math.min(posts.slice(0, thoughtsExpanded ? posts.length : 3).length - 1, posts.length - 1) && (
                              <View style={styles.mobilePostSeparator} />
                            )}
                          </View>
                        );
                      })}
                      
                      {/* Show "See More" indicator if there are more posts */}
                      {!thoughtsExpanded && posts.length > 3 && (
                        <TouchableOpacity 
                          style={styles.seeMoreButton}
                          onPress={() => setThoughtsExpanded(true)}
                        >
                          <Text style={styles.seeMoreText} selectable={false}>See more thoughts...</Text>
                          <Ionicons name="chevron-down" size={16} color={COLORS.primaryBlue} />
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    ) : (
      <View style={styles.container}>
        <View style={styles.contentLayout}>
          {/* Mobile Layout */}
          <View style={styles.mainWrapper}>
            <ScrollView
              style={styles.mainScroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[styles.dualColumns, animatedPageStyle]}>
                <View style={[styles.mainFeed, { width: '100%', marginRight: 0 }]}>
                  <View style={styles.pageHeaderRow}>
                     <View>
                        <Text style={styles.pageTitle}>My Subjects</Text>
                        <Text style={styles.pageSubtitle}>Manage your subjects and create new subjects</Text>
                     </View>
                     <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => router.push("/(tabs)/TeacherDashBoard/CreateSubject")}
                     >
                        <Ionicons name="add" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.createBtnText}>Create New Subject</Text>
                     </TouchableOpacity>
                  </View>

                  <View style={styles.gridContainer}>
                     {isLoading ? (
                       <View style={styles.loadingContainer}>
                         <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                         <Text style={{ marginTop: 10, fontSize: 16, color: COLORS.textBody }}>Loading subjects...</Text>
                       </View>
                     ) : error ? (
                       <View style={styles.errorContainer}>
                         <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
                         <Text style={styles.errorText}>{error}</Text>
                         <TouchableOpacity 
                           style={styles.retryButton}
                           onPress={fetchTeacherSubjects}
                         >
                           <Text style={styles.retryButtonText}>Retry</Text>
                         </TouchableOpacity>
                       </View>
                     ) : teacherSubjects.length === 0 ? (
                       <View style={styles.emptyState}>
                         <MaterialCommunityIcons name="book-open" size={64} color={COLORS.textMuted} />
                         <Text style={styles.emptyStateText}>No subjects available</Text>
                         <Text style={styles.emptyStateSubtext}>
                           Please add subjects in your profile to manage them here.
                         </Text>
                       </View>
                     ) : (
                       teacherSubjects.map((subject, index) => (
                         <SubjectCard 
                           key={subject.id} 
                           subject={subject} 
                           index={index} 
                           isMobile={true} 
                         />
                       ))
                     )}
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      </View>
    )
  );
}

// --- Subject Card Component ---
const SubjectCard = ({ subject, index, isMobile }: { subject: any; index: number; isMobile: boolean }) => {
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const imgScale = useSharedValue(1);

  const hoverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }] as any,
    shadowOpacity: lift.value === 0 ? 0.06 : 0.15,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imgScale.value }] as any,
  }));

  return (
    <Animated.View 
      style={[
        styles.subjectCard,
        {
          transform: [
            {
              translateY: withDelay(100 * index, withSpring(0, { tension: 100, friction: 10 }))
            },
            { scale: withDelay(100 * index, withSpring(1, { tension: 100, friction: 10 }))
            }
          ]
        }
      ]}
    >
      <View style={styles.subjectCardContent}>
        <View style={styles.subjectHeader}>
          <View style={styles.subjectIconContainer}>
            <Image source={{ uri: subject.image }} style={styles.subjectImage} />
            <MaterialCommunityIcons name={subject.icon} size={isMobile ? 20 : 24} color={COLORS.primaryBlue} />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectTitle}>{subject.title}</Text>
            <Text style={styles.subjectClass}>{subject.class}</Text>
            <View style={styles.subjectStatus}>
              <View style={[styles.statusDot, { backgroundColor: subject.status === 'ACTIVE' ? COLORS.primaryBlue : '#E5E7EB' }]} />
              <Text style={[styles.statusText, { color: subject.status === 'ACTIVE' ? COLORS.primaryBlue : COLORS.textMuted }]}>
                {subject.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Web Layout
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
    backgroundColor: COLORS.background,
    flexDirection: 'row',
  },
  webMainContentExpanded: {
    marginLeft: 80, // When sidebar is collapsed
  },
  webMainContentMobile: {
    marginLeft: 0, // No sidebar on mobile
  },
  // Sidebar Overlay for Mobile
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebarOverlayTouchable: {
    flex: 1,
  },
  mobileSidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: COLORS.white,
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
    elevation: 5,
    zIndex: 1001,
  },
  // Main Content Container
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 32,
  },
  contentContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  // Common styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: wp('3%'),
  },
  dualColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainFeed: {
    flex: 1,
    marginRight: 30,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  pageTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: COLORS.textHeader,
    marginBottom: 5,
  },
  pageSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: COLORS.textBody,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  createBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.white,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
  // Subject Card Styles
  subjectCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 20,
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
    elevation: 5,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardInfo: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.textHeader,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: COLORS.white,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.textHeader,
    marginBottom: 20,
  },
  // Right Panel Styles (same as ConnectWeb)
  rightPanel: {
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
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rightPanelTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
    fontWeight: '600',
  },
  filterBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  composerWrapper: {
    marginBottom: 20,
  },
  thoughtsScrollView: {
    flex: 1,
  },
  thoughtsList: {
    paddingBottom: 40,
    gap: 0,
  },
  postWrapper: {
    marginBottom: 0,
  },
  postSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textHeader,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  thoughtsLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  thoughtsLoadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    marginTop: 12,
    textAlign: 'center',
  },
  thoughtsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  // Mobile Thoughts Styles
  mobileThoughtsSection: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  mobileThoughtsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileThoughtsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
  },
  mobileThoughtsToggle: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  mobileThoughtsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mobileComposerWrapper: {
    marginBottom: 16,
  },
  mobileThoughtsScroll: {
    maxHeight: 300,
  },
  mobileThoughtsList: {
    paddingBottom: 0,
  },
  mobileLoadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    marginTop: 8,
    textAlign: 'center',
  },
  mobileEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mobileEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textBody,
    marginTop: 8,
    textAlign: 'center',
  },
  mobilePostWrapper: {
    marginBottom: 12,
  },
  mobilePostSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    marginTop: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.primaryBlue,
    marginRight: 8,
  },
});
