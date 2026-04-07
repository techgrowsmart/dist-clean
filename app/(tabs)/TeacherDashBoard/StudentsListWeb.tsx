import React from 'react';
import { Platform,  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import {  Ionicons } from '@expo/vector-icons';
import {  router } from 'expo-router';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import {  getAuthData } from '../../../utils/authStorage';
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

interface StudentsListWebProps {
  students: any[];
  onBack: () => void;
  teacherName?: string;
  profileImage?: string | null;
  userEmail?: string | null;
}

const StudentsListWeb: React.FC<StudentsListWebProps> = ({
  students,
  onBack,
  teacherName,
  profileImage,
  userEmail
}) => {
  const [isMobile, setIsMobile] = React.useState(width < 768);
  const [activeItem, setActiveItem] = React.useState('students');
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  // Teacher Posts Data for Thoughts
  const [posts, setPosts] = React.useState<any[]>([]);
  const [postsLoading, setPostsLoading] = React.useState(false);
  const [userProfileCache, setUserProfileCache] = React.useState<Map<string, { name: string; profilePic: string }>>(new Map());

  // Handle undefined students safely
  const safeStudents = students || [];

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setActiveItem(item);
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
      default:
        console.log('Navigate to:', item);
    }
  };

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

  const handleBack = () => {
    onBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentLayout}>
        {/* Sidebar */}
        {!isMobile && (
          <TeacherWebSidebar 
            activeItem={activeItem} 
            onItemPress={handleSidebarSelect} 
            userEmail={userEmail || ''} 
            teacherName={teacherName}
            profileImage={profileImage}
            subjectCount={0}
            studentCount={safeStudents.length}
            revenue="₹8.9K"
            isSpotlight={false}
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
                placeholder="Share your thoughts..."
              />
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={24} color={COLORS.primaryBlue} />
                  <Text style={styles.backButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Students Enrolled</Text>
                <Text style={styles.subtitle}>Total Students: {safeStudents.length}</Text>
              </View>

              {/* Students List */}
              <View style={styles.studentsContainer}>
                {safeStudents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyStateText}>No students enrolled yet</Text>
                    <Text style={styles.emptyStateSubtext}>Your enrolled students will appear here</Text>
                  </View>
                ) : (
                  students.map((student, index) => (
                    <View key={index} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </Text>
                        </View>
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>{student.name || 'Unknown Student'}</Text>
                          <Text style={styles.studentEmail}>{student.email || 'No email'}</Text>
                          <Text style={styles.studentStatus}>
                            Status: <Text style={styles.statusActive}>Active</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.studentActions}>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="mail-outline" size={20} color={COLORS.primaryBlue} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons name="call-outline" size={20} color={COLORS.primaryBlue} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
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
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primaryBlue,
    marginLeft: 8,
    fontFamily: 'Poppins_500Medium',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  studentsContainer: {
    marginTop: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  studentEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  studentStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  statusActive: {
    color: '#10b981',
    fontFamily: 'Poppins_500Medium',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
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

export default StudentsListWeb;
