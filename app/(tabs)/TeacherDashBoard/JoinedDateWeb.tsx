import React from 'react';
import { Platform,  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, Alert, ActivityIndicator } from 'react-native';
import {   useRouter } from 'expo-router';
import {   Ionicons } from '@expo/vector-icons';
import WebHeader from '../../../components/ui/WebHeader';
import WebSidebar from '../../../components/ui/WebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import {   getAuthData } from '../../../utils/authStorage';
import {   BASE_URL } from '../../../config';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// Global Design Tokens (same as TutorDashboardWeb)
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e5e7eb',
  white: '#ffffff',
  bannerTint: '#EBF4FF',
};

interface JoinedDateWebProps {
  createdAt?: string | null;
  userStatus?: string;
  teacherName?: string;
  profileImage?: string | null;
  userEmail?: string | null;
  onBack?: () => void;
}

const JoinedDateWeb: React.FC<JoinedDateWebProps> = ({
  createdAt,
  userStatus = 'dormant',
  teacherName,
  profileImage,
  userEmail,
  onBack
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = React.useState(width < 768);
  const [sidebarActiveItem, setSidebarActiveItem] = React.useState("Spotlights");
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  // Teacher Posts Data for Thoughts
  const [posts, setPosts] = React.useState<any[]>([]);
  const [postsLoading, setPostsLoading] = React.useState(false);
  const [userProfileCache, setUserProfileCache] = React.useState<Map<string, { name: string; profilePic: string }>>(new Map());

  // Load auth token for post creation and fetch posts
  React.useEffect(() => {
    const loadAuthTokenAndPosts = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuthToken(authData.token);
          await fetchPosts(authData.token);
        }
      } catch (error) {
        console.error('Error loading auth token:', error);
      }
    };

    loadAuthTokenAndPosts();
  }, []);

  // Helper functions for teacher posts (same as TutorDashboardWeb)
  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: teacherName || 'Unknown Teacher',
        pic: profileImage || null,
        role: 'teacher'
      };
    }
    
    // Use cached profile data like student's version
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

  // Fetch posts function (same as TutorDashboardWeb)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.data.success) {
        // Get unique emails from all posts and fetch their profiles
        const uniqueEmails = [...new Set(res.data.data.map((p: any) => p.author?.email as string).filter((email: string) => Boolean(email)))];
        await Promise.all(uniqueEmails.map((email: string) => fetchUserProfile(token, email)));
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Handle post creation
  const handleCreatePost = async (content: string) => {
    if (!authToken || !userEmail) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/posts/create`,
        {
          content: content.trim(),
          tags: ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

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

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    const navigationMap: { [key: string]: string } = {
      'Dashboard': '/(tabs)/TeacherDashBoard/TutorDashboardWeb',
      'subjects': '/(tabs)/TeacherDashBoard/SubjectsListWeb',
      'students': '/(tabs)/TeacherDashBoard/StudentsEnrolled',
      'joinedDate': '/(tabs)/TeacherDashBoard/JoinedDateWeb',
      'Create Subject': '/(tabs)/TeacherDashBoard/CreateSubject',
      'Settings': '/(tabs)/TeacherDashBoard/Settings',
      'Contact': '/(tabs)/Contact',
    };
    
    if (navigationMap[item]) {
      router.push(navigationMap[item] as any);
    } else {
      console.log('Navigate to:', item);
    }
  };

  // Format date helper
  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate days since joining
  const calculateDaysSinceJoin = (joinDate: string | null) => {
    if (!joinDate) return 0;
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceJoin = calculateDaysSinceJoin(createdAt);
  const formattedJoinDate = formatDate(createdAt);

  return (
    <View style={styles.container}>
      <View style={styles.contentLayout}>
        {/* Header */}
        <WebHeader 
          studentName={teacherName}
          profileImage={profileImage}
          onNotificationPress={() => console.log('Notification pressed')}
        />
        
        {/* Sidebar */}
        {!isMobile && (
          <TeacherWebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSelect}
            userEmail={userEmail}
            subjectCount={0}
            studentCount={0}
            revenue="₹5.2K"
            isSpotlight={true}
          />
        )}
        
        {/* Main Content Area */}
        <View style={styles.mainWrapper}>
          <TeacherWebHeader 
            teacherName={teacherName}
            profileImage={profileImage}
          />
          
          <ScrollView 
            style={styles.mainScroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TeacherThoughtsBackground>
              <TeacherPostComposer
                onCreatePost={handleCreatePost}
                placeholder="Post your Grow Thoughts..."
              />
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.pageTitle}>Teacher Profile</Text>
                <Text style={styles.subtitle}>Professional Information & Journey</Text>
              </View>

              {/* Profile Overview Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    {profileImage ? (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {teacherName?.charAt(0)?.toUpperCase() || 'T'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {teacherName?.charAt(0)?.toUpperCase() || 'T'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.teacherName}>{teacherName || 'Teacher Name'}</Text>
                    <Text style={styles.teacherEmail}>{userEmail || 'teacher@example.com'}</Text>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: userStatus === 'active' ? '#10b981' : '#f59e0b' }]} />
                      <Text style={styles.statusText}>
                        {userStatus === 'active' ? 'Verified Senior Partner' : 'Partner'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Journey Timeline */}
              <View style={styles.journeyCard}>
                <Text style={styles.cardTitle}>Teaching Journey</Text>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="flag" size={20} color={COLORS.primaryBlue} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Joined GrowSmart</Text>
                    <Text style={styles.timelineDate}>{formattedJoinDate}</Text>
                    <Text style={styles.timelineDescription}>
                      Started journey as a dedicated educator on platform
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="time" size={20} color={COLORS.primaryBlue} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Experience Gained</Text>
                    <Text style={styles.timelineDate}>{daysSinceJoin} days of teaching</Text>
                    <Text style={styles.timelineDescription}>
                      Committed to excellence in education for {daysSinceJoin} days
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="ribbon" size={20} color={COLORS.primaryBlue} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Professional Status</Text>
                    <Text style={styles.timelineDate}>Current Status</Text>
                    <Text style={styles.timelineDescription}>
                      {userStatus === 'active' 
                        ? 'Verified and trusted educator with proven track record'
                        : 'Building reputation and growing student base'
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Overview */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="calendar" size={24} color={COLORS.primaryBlue} />
                  <Text style={styles.statValue}>{formattedJoinDate}</Text>
                  <Text style={styles.statLabel}>Join Date</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="time-outline" size={24} color={COLORS.primaryBlue} />
                  <Text style={styles.statValue}>{daysSinceJoin}</Text>
                  <Text style={styles.statLabel}>Days Active</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="shield-checkmark" size={24} color={userStatus === 'active' ? '#10b981' : '#f59e0b'} />
                  <Text style={styles.statValue}>{userStatus === 'active' ? 'Verified' : 'Partner'}</Text>
                  <Text style={styles.statLabel}>Status</Text>
                </View>
              </View>

              {/* Achievement Section */}
              <View style={styles.achievementCard}>
                <Text style={styles.cardTitle}>Achievements</Text>
                <View style={styles.achievementItem}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                  <Text style={styles.achievementText}>Platform Member</Text>
                </View>
                <View style={styles.achievementItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.achievementText}>Profile Complete</Text>
                </View>
                {userStatus === 'active' && (
                  <View style={styles.achievementItem}>
                    <Ionicons name="trophy" size={20} color="#8b5cf6" />
                    <Text style={styles.achievementText}>Verified Educator</Text>
                  </View>
                )}
              </View>

              {/* Teacher Thoughts Section */}
              <View style={styles.thoughtsSection}>
                <Text style={styles.sectionTitle}>Teacher Thoughts</Text>
                
                {/* Posts Feed */}
                {postsLoading && posts.length === 0 && (
                  <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                )}
                {!postsLoading && posts.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular' }}>
                      No thoughts yet. Be the first to share!
                    </Text>
                  </View>
                )}
                {posts.map((post: any) => (
                  <TeacherThoughtsCard
                    key={post.id}
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
                      // Handle comment logic
                    }}
                    onReport={(post) => {
                      // Handle report logic
                    }}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                  />
                ))}
              </View>

            {/* Post Input Area */}
            <View style={styles.postInputArea}>
              <View style={styles.inputBox}>
                <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.thoughtsInput}
                  placeholder="Post your Grow Thoughts..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline={false}
                  maxLength={500}
                />
              </View>
              <TouchableOpacity style={styles.postBtn}>
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </TeacherThoughtsBackground>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    minHeight: height,
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    minWidth: 0,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  header: {
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  profileInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  teacherEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  journeyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  timelineDate: {
    fontSize: 14,
    color: COLORS.primaryBlue,
    marginBottom: 4,
    fontFamily: 'Poppins_500Medium',
  },
  timelineDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Poppins_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
    fontFamily: 'Poppins_500Medium',
  },
  // Post Input Styles
  postInputArea: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thoughtsInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  postBtn: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Teacher Thoughts Section
  thoughtsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});

export default JoinedDateWeb;
