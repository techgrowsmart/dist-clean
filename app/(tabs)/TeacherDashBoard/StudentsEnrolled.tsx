import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, FlatList, RefreshControl, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import { UXButton, UXCard, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


// Global Design Tokens
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
};

const StudentsEnrolled = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [auth, setAuth] = useState<any>(null);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("My Students");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isWeb, setIsWeb] = useState(Platform.OS === 'web');
  
  // Responsive state
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
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
  
  // Thoughts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  
  // Thoughts panel – collapsed by default on mobile / native
  const [isThoughtsCollapsed, setIsThoughtsCollapsed] = useState(
    Platform.OS !== 'web' || screenWidth < 768
  );
  
  // ── Thoughts panel – shown on web desktop only ─────────────────────────────
  const showThoughtsPanel = Platform.OS === 'web' && !isMobile;

  // Fetch user profile using the same API as RightScreen
  const fetchUserProfile = async (token: string, email: string) => {
    try {
      console.log('🔍 Fetching user profile from AstraDB for:', email);
      
      // Check cache first
      if (userProfileCache.has(email)) {
        console.log('✅ Using cached profile for:', email);
        return userProfileCache.get(email)!;
      }
      
      // Try AstraDB test table first for real user data (same as RightScreen)
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
        // Try different possible field names for profile picture (same as RightScreen)
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        
        // Try different possible field names for user name (same as RightScreen)
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
  
  // Enhanced function to fetch and cache multiple user profiles (same as RightScreen)
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

  // Profile image helper (same as RightScreen)
  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) { 
      return null; // Will show initials instead
    }
    
    // Handle different profile image formats
    if (typeof profilePic === 'string') {
      // If it's already a full URL (http/https/file)
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) {
        return { uri: profilePic };
      }
      
      // If it's a relative path starting with /
      if (profilePic.startsWith('/')) {
        return { uri: `${BASE_URL}${profilePic}` };
      }
      
      // If it's a relative path without leading /
      if (profilePic.includes('uploads/') || profilePic.includes('images/')) {
        return { uri: `${BASE_URL}/${profilePic}` };
      }
      
      // Default case - treat as relative path
      return { uri: `${BASE_URL}/${profilePic}` };
    }
    
    return null;
  };

  // Helper functions for thoughts display
  const initials = (name: string) => {
    return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: teacherName || 'Unknown Teacher',
        pic: profileImage,
        role: 'teacher'
      };
    }
    
    const email = post.author?.email;
    if (!email) return { name: 'Unknown User', pic: null, role: 'Unknown' };
    
    const userProfile = userProfileCache.get(email) || { name: 'Unknown User', profilePic: '' };
    const name = userProfile.name || post.author?.name || 'Unknown User';
    const pic: string | null = userProfile.profilePic || post.author?.profile_pic || null;
    const role = post.author?.role || 'teacher';
    
    return { name, pic, role };
  };

  // Fetch posts for Thoughts section (same structure as RightScreen)
  const fetchPosts = async (token: string) => {
    try {
      console.log('🔄 Fetching posts with token:', token ? 'Token exists' : 'No token');
      console.log('🌐 BASE_URL:', BASE_URL);
      
      setPostsLoading(true);
      const response = await axios.get(`${BASE_URL}/api/posts/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 Posts response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Fetch comments for each post (same as RightScreen)
        const postsWithComments = await Promise.all(
          response.data.data.map(async (post: any) => {
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
                createdAt: post.createdAt, // Keep original format for TeacherThoughtsCard
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
        
        // Fetch user profiles for all post authors (same as RightScreen)
        await fetchUserProfilesForPosts(postsWithComments, token);
        
        setPosts(postsWithComments);
      } else {
        setPosts([]);
      }
      setPostsLoading(false);
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setPosts([]);
      setPostsLoading(false);
    }
  };
  
  // Handle post creation
  const handleCreatePost = async (content: string) => {
    if (!authToken || !auth?.email) return;
    
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/create`, {
        content,
        authorEmail: auth.email,
        authorName: teacherName,
        postType: 'teacher'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        await fetchPosts(authToken);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };
  
  // Fetch enrolled students
  const fetchStudents = async () => {
    try {
      const authData = await getAuthData();
      if (authData?.token) {
        setAuthToken(authData.token);
        setAuth(authData);
        setTeacherName(authData.name || '');
        setProfileImage(authData.profileImage || null);
        
        // Try multiple endpoints for student data
        let studentData = [];
        
        try {
          // First try the enrolled students endpoint
          const response = await axios.get(`${BASE_URL}/api/teacher/enrolled-students`, {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });
          
          if (response.data.success && response.data.data) {
            studentData = response.data.data;
          }
        } catch (error) {
          console.log('Enrolled students endpoint failed, trying contacts endpoint...');
          
          try {
            // Fallback to contacts endpoint (which was used in dashboard)
            const contactsResponse = await axios.post(
              `${BASE_URL}/api/contacts`,
              { userEmail: authData.email, type: authData.role },
              { headers: { 'Authorization': `Bearer ${authData.token}`, 'Content-Type': 'application/json' } }
            );
            
            if (contactsResponse.data.success && contactsResponse.data.contacts) {
              studentData = contactsResponse.data.contacts.map((contact: any) => ({
                id: contact.id,
                name: contact.studentName || contact.name,
                email: contact.studentEmail || contact.email,
                profile_pic: contact.studentProfilePic || contact.profilePic || contact.profile_pic,
                enrolled_date: contact.enrolled_date || contact.createdAt || new Date().toISOString(),
                status: contact.status || 'active'
              }));
            }
          } catch (contactsError) {
            console.log('Contacts endpoint also failed, using mock data');
            // Use mock data for demonstration
            studentData = [];
          }
        }
        
        setStudents(studentData);
        
        // Also fetch posts if authenticated
        if (authData?.token) {
          await fetchPosts(authData.token);
        }
      }
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh function
  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  useEffect(() => {
    fetchStudents();
    
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    
    return () => subscription.remove();
  }, []);

  const handleMenuPress = (item: string) => {
    setActiveMenu(activeMenu === item ? null : item);
  };

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    setActiveMenu(null);
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
        router.push('/(tabs)/Contact');
        break;
      case 'My Students':
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: "home" },
    { id: "Students Enrolled", label: "Students Enrolled", icon: "people" },
    { id: "Subjects", label: "Subjects", icon: "book" },
    { id: "Joined Date", label: "Joined Date", icon: "calendar" },
  ];

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
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
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={auth?.email || ''}
        />

        {/* ── Main wrapper: center + right panel in a ROW ── */}
        <View style={styles.mainWrapper}>

          {/* ── Content Columns ── */}
          <View style={styles.contentColumns}>

            {/* ── CENTER: scrollable content ── */}
            <View style={styles.centerContent}>
              <ScrollView 
                style={styles.mainScroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
              {/* Page Header */}
              <View style={[
                styles.pageHeader,
                isMobile && styles.pageHeaderMobile,
                isSmallMobile && styles.pageHeaderSmallMobile
              ]}>
                <View style={styles.pageHeaderContent}>
                  <Text style={[
                    styles.pageTitle,
                    isMobile && styles.pageTitleMobile,
                    isSmallMobile && styles.pageTitleSmallMobile
                  ]} selectable={false}>Enrolled Students</Text>
                  <Text style={[
                    styles.pageSubtitle,
                    isMobile && styles.pageSubtitleMobile
                  ]} selectable={false}>
                    Manage and view your enrolled students
                  </Text>
                </View>
                {students.length > 0 && (
                  <View style={[
                    styles.statsBadge,
                    isMobile && styles.statsBadgeMobile
                  ]}>
                    <Text style={[
                      styles.statsBadgeText,
                      isMobile && styles.statsBadgeTextMobile
                    ]}>{students.length} Students</Text>
                  </View>
                )}
              </View>

              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                  <Text style={styles.loadingText} selectable={false}>Loading students...</Text>
                </View>
              ) : students.length > 0 ? (
                /* Students List */
                <View style={styles.studentsContainer}>
                  {students.map((student, index) => (
                    <StudentCard key={student.id || index} student={student} isMobile={isMobile} />
                  ))}
                </View>
              ) : (
                /* Empty State */
                <View style={[
                  styles.emptyContainer,
                  isMobile && styles.emptyContainerMobile
                ]}>
                  <View style={[
                    styles.emptyIconContainer,
                    isMobile && styles.emptyIconContainerMobile
                  ]}>
                    <View style={[
                      styles.emptyIconBackground,
                      isMobile && styles.emptyIconBackgroundMobile
                    ]}>
                      <Ionicons 
                        name="people-outline" 
                        size={isMobile ? 48 : 64} 
                        color={COLORS.textSecondary} 
                      />
                      <View style={[
                        styles.emptyIconOverlay,
                        isMobile && styles.emptyIconOverlayMobile
                      ]}>
                        <Ionicons 
                          name="link-outline" 
                          size={isMobile ? 16 : 20} 
                          color={COLORS.primaryBlue} 
                        />
                      </View>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.emptyTitle,
                    isMobile && styles.emptyTitleMobile
                  ]} selectable={false}>No students found</Text>
                  <Text style={[
                    styles.emptyDescription,
                    isMobile && styles.emptyDescriptionMobile
                  ]} selectable={false}>
                    You haven't enrolled any students yet. Start by sharing your course or subject link.
                  </Text>
                  
                    <Ionicons 
                      name="share-outline" 
                      size={isMobile ? 18 : 20} 
                      color={COLORS.white} 
                      style={{ marginRight: 8 }} 
                    />
                </View>
              )}
                </ScrollView>
              </View>

            </View>


          </View>
        </View>
      </View>
  );
};

// --- Student Card Component ---
const StudentCard = ({ student, isMobile }: { student: any; isMobile: boolean }) => {
  return (
    <View style={[styles.studentCard, isMobile && styles.studentCardMobile]}>
      <View style={styles.studentInfo}>
        <View style={styles.avatarContainer}>
          {student.profile_pic ? (
            <Image 
              source={{ 
                uri: student.profile_pic.startsWith('http') 
                  ? student.profile_pic 
                  : `${BASE_URL}/${student.profile_pic}` 
              }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.studentDetails}>
          <Text style={styles.studentName} selectable={false}>{student.name}</Text>
          <Text style={styles.studentEmail} selectable={false}>{student.email}</Text>
          <View style={styles.studentMeta}>
            <Text style={styles.enrolledDate} selectable={false}>
              Enrolled: {new Date(student.enrolled_date || student.createdAt).toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, student.status === 'active' && styles.statusActive]}>
              <Text style={[styles.statusText, student.status === 'active' && styles.statusActiveText]} selectable={false}>
                {student.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText} selectable={false}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primaryBlue} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  webContentLayout: {
    flexDirection: 'row',
  },
  mobileContentLayout: {
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
  },
  webMainContent: {
    flex: 1,
    marginRight: 24,
  },
  mobileMainContent: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webMainWrapper: {
    marginLeft: 280,
  },
  // Responsive Page Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  pageHeaderMobile: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  pageHeaderSmallMobile: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pageHeaderContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  pageTitleMobile: {
    fontSize: 24,
    marginBottom: 2,
  },
  pageTitleSmallMobile: {
    fontSize: 20,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  pageSubtitleMobile: {
    fontSize: 14,
  },
  statsBadge: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsBadgeMobile: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statsBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  statsBadgeTextMobile: {
    fontSize: 11,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  studentsContainer: {
    padding: 24,
    gap: 16,
  },
  // Student Card Styles
  studentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
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
  studentCardMobile: {
    padding: 16,
    marginHorizontal: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enrolledDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textSecondary,
  },
  statusActiveText: {
    color: '#065F46',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.white,
  },
  // Responsive Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyContainerMobile: {
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 32,
  },
  emptyIconContainerMobile: {
    marginBottom: 24,
  },
  emptyIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyIconBackgroundMobile: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  emptyIconOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
  },
  emptyIconOverlayMobile: {
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyTitleMobile: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 400,
  },
  emptyDescriptionMobile: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 300,
  },
  shareButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonMobile: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  shareButtonTextMobile: {
    fontSize: 14,
  },
  // Thoughts Section Styles
  thoughtsSection: {
    width: 380,
    minWidth: 320,
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thoughtsSectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  thoughtsScrollView: {
    flex: 1,
    maxHeight: '100%',
  },
  thoughtsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  thoughtsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  thoughtsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  thoughtsEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  thoughtsEmptyText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  // Legacy styles (keeping for compatibility)
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Dashboard layout styles (matching TutorDashboardWeb)
  contentColumns: {
    flex: 1,
    flexDirection: 'row',
  },
  centerContent: {
    flex: 1,
    minWidth: 0,
  },
  mainScroll: {
    flex: 1,
  },
  rightPanel: {
    width: 380,
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  rightPanelCollapsed: {
    width: 52,
    paddingHorizontal: 8,
  },
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rightPanelTitleContainer: {
    flex: 1,
  },
  rightPanelTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },
  collapseBtn: {
    padding: 6,
    borderRadius: 8,
  },

  // ── Mobile thoughts panel (inline, below main content) ───────────────────
  mobileThoughtsPanel: {
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ── Thoughts feed ─────────────────────────────────────────────────────────
  composerWrapper: {
    marginBottom: 16,
  },
  postWrapper: {
    marginBottom: 4,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textDark,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default StudentsEnrolled;
