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
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../../config';
import axios from 'axios';
import { getAuthData } from '../../../utils/authStorage';

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

const SUBJECT_DATA = [
  {
    id: 1,
    title: 'Mathematics',
    class: 'Class 8 | CBSE',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop',
    icon: 'calculator',
  },
  {
    id: 2,
    title: 'Science',
    class: 'Class 8 | CBSE',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080&auto=format&fit=crop',
    icon: 'flask',
  },
  {
    id: 3,
    title: 'Social Studies',
    class: 'Class 8 | CBSE',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1548345680-f5475ee511d7?q=80&w=2070&auto=format&fit=crop',
    icon: 'globe-americas',
  },
  {
    id: 4,
    title: 'Physics',
    class: 'Class 9 | IGCSE',
    status: 'ACTIVE',
    image: 'https://images.unsplash.com/photo-1632571401005-458b9d244392?q=80&w=2070&auto=format&fit=crop',
    icon: 'lightbulb',
  },
];

export default function MySubjectsWeb() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [sidebarActiveItem, setSidebarActiveItem] = useState('My Subjects');
  const [teacherName, setTeacherName] = useState('John Doe');
  const [profileImage, setProfileImage] = useState(null);
  const [userEmail, setUserEmail] = useState('teacher@example.com');
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);
  const [isTablet, setIsTablet] = useState(Dimensions.get('window').width >= 768 && Dimensions.get('window').width < 1024);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [thoughtsExpanded, setThoughtsExpanded] = useState(false);

  // Teacher Posts Data for Thoughts (same as ConnectWeb)
  const [posts, setPosts] = useState<any[]>([
    {
      id: '1',
      author: {
        email: 'teacher@example.com',
        name: 'John Teacher',
        profile_pic: null,
        role: 'teacher'
      },
      content: 'Welcome to My Subjects! This is your space to share thoughts and updates with your students.',
      likes: 12,
      isLiked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      postImages: []
    },
    {
      id: '2',
      author: {
        email: 'teacher@example.com',
        name: 'John Teacher',
        profile_pic: null,
        role: 'teacher'
      },
      content: 'Remember to check your subject materials and prepare for upcoming classes.',
      likes: 8,
      isLiked: false,
      comments: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      postImages: []
    },
    {
      id: '3',
      author: {
        email: 'teacher@example.com',
        name: 'John Teacher',
        profile_pic: null,
        role: 'teacher'
      },
      content: 'Great work on recent assignments! Keep up the excellent progress.',
      likes: 15,
      isLiked: false,
      comments: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      postImages: []
    }
  ]); // Initialize with mock data immediately
  const [postsLoading, setPostsLoading] = useState(false); // Start with false since we have initial data
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Add loading state like TeacherDashboard
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

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
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
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
          
          console.log('Teacher data set, keeping existing mock posts');
          // Keep the existing mock posts, no need to fetch
          setPostsLoading(false);
        } else {
          console.error('No auth data found');
          // Keep existing mock posts
          setPostsLoading(false);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        // Keep existing mock posts
        setPostsLoading(false);
      } finally {
        setIsDashboardLoading(false);
      }
    };

    loadTeacherDataAndPosts();
  }, []);

  // Fetch posts function (same as ConnectWeb)
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
      
      if (res.data.success && res.data.posts) {
        console.log('Setting posts from API:', res.data.posts.length, 'posts');
        setPosts(res.data.posts);
      } else {
        console.log('API response unsuccessful or no posts, using mock data');
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Always load mock posts as fallback
      console.log('Loading mock posts as fallback');
      const mockPosts = [
        {
          id: '1',
          author: {
            email: 'teacher@example.com',
            name: 'John Teacher',
            profile_pic: null,
            role: 'teacher'
          },
          content: 'Welcome to My Subjects! This is your space to share thoughts and updates with your students.',
          likes: 12,
          isLiked: false,
          comments: [],
          createdAt: new Date().toISOString(),
          postImages: []
        },
        {
          id: '2',
          author: {
            email: 'teacher@example.com',
            name: 'John Teacher',
            profile_pic: null,
            role: 'teacher'
          },
          content: 'Remember to check your subject materials and prepare for upcoming classes.',
          likes: 8,
          isLiked: false,
          comments: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          postImages: []
        },
        {
          id: '3',
          author: {
            email: 'teacher@example.com',
            name: 'John Teacher',
            profile_pic: null,
            role: 'teacher'
          },
          content: 'Great work on recent assignments! Keep up the excellent progress.',
          likes: 15,
          isLiked: false,
          comments: [],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          postImages: []
        }
      ];
      console.log('Setting mock posts:', mockPosts.length, 'posts');
      setPosts(mockPosts);
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
        // For now, use mock auth token - in real app, get from storage
        const token = 'mock-auth-token';
        setAuthToken(token);
        
        // Try to fetch real posts first
        try {
          await fetchPosts(token);
        } catch (fetchError) {
          // If API fails, load mock posts for demonstration
          console.log('API failed, loading mock posts');
          const mockPosts = [
            {
              id: '1',
              content: 'Excited to teach Mathematics today! Students are making great progress with algebra.',
              authorName: teacherName,
              authorEmail: userEmail,
              likes: 12,
              comments: 3,
              createdAt: new Date().toISOString(),
              isLiked: false,
              postType: 'teacher'
            },
            {
              id: '2',
              content: 'Science class experiment was a success! Students loved the hands-on learning approach.',
              authorName: teacherName,
              authorEmail: userEmail,
              likes: 8,
              comments: 1,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              isLiked: false,
              postType: 'teacher'
            },
            {
              id: '3',
              content: 'Preparing new materials for Social Studies. Interactive maps really help students engage!',
              authorName: teacherName,
              authorEmail: userEmail,
              likes: 15,
              comments: 5,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              isLiked: true,
              postType: 'teacher'
            }
          ];
          setPosts(mockPosts);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
      }
    };

    loadTeacherDataAndPosts();
  }, []);
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
                  subjectCount={SUBJECT_DATA.length}
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
              subjectCount={SUBJECT_DATA.length}
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
                   {SUBJECT_DATA.map((subject, index) => (
                      <SubjectCard key={subject.id} subject={subject} index={index} isMobile={isMobile} />
                   ))}
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
                  
                  {posts.map((post: any, index: number) => (
                    <View key={post.id} style={styles.postWrapper}>
                      <TeacherThoughtsCard
                        post={post}
                        userProfileCache={userProfileCache}
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
                      {index < posts.length - 1 && (
                        <View style={styles.postSeparator} />
                      )}
                    </View>
                  ))}
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
                      {posts.slice(0, thoughtsExpanded ? posts.length : 3).map((post: any, index: number) => (
                        <View key={post.id} style={styles.mobilePostWrapper}>
                          <TeacherThoughtsCard
                            post={post}
                            userProfileCache={userProfileCache}
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
                      ))}
                      
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
                     {SUBJECT_DATA.map((subject, index) => (
                        <SubjectCard key={subject.id} subject={subject} index={index} isMobile={true} />
                     ))}
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
const SubjectCard = ({ subject, isMobile }: any) => {
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const imgScale = useSharedValue(1);

  const hoverStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
    shadowOpacity: lift.value === 0 ? 0.06 : 0.15,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imgScale.value }],
  }));

  return (
    <Animated.View 
      style={[styles.subjectCard, isMobile ? { width: '100%' } : { width: '48%' }, hoverStyle]}
      // Simulation for hover (Web only)
      onPointerEnter={() => {
        lift.value = withTiming(-6);
        scale.value = withTiming(1.01);
        imgScale.value = withTiming(1.05);
      }}
      onPointerLeave={() => {
        lift.value = withTiming(0);
        scale.value = withTiming(1);
        imgScale.value = withTiming(1);
      }}
    >
      <View style={styles.cardImageContainer}>
         <Animated.Image source={{ uri: subject.image }} style={[styles.cardImage, imageStyle]} />
      </View>
      
      <View style={styles.cardInfo}>
         <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{subject.title}</Text>
            <View style={styles.activeBadge}>
               <Text style={styles.activeBadgeText}>{subject.status}</Text>
            </View>
         </View>
         <View style={styles.cardMetaRow}>
            <View style={styles.metaIconBox}>
                <FontAwesome5 name={subject.icon} size={14} color={COLORS.textBody} />
            </View>
            <Text style={styles.cardMetaText}>{subject.class}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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
