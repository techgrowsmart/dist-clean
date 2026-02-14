import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { getAuthData, storeAuthData } from '../../../utils/authStorage';
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import { BASE_URL } from '../../../config';
import axios from 'axios';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const { width, height } = Dimensions.get('window');

interface Like {
  user_email: string;
  user_name: string;
  user_profile_pic: string;
  liked_at: string;
}

interface Comment {
  id: string;
  author: {
    email: string;
    name: string;
    role: string;
    profile_pic: string;
  };
  content: string;
  likes: number;
  createdAt: string;
  isLiked?: boolean;
}

interface Post {
  id: string;
  author: {
    email: string;
    name: string;
    role: string;
    profile_pic: string;
  };
  content: string;
  likes: number;
  likes_details?: Like[];
  comments?: Comment[];
  createdAt: string;
  tags?: string[];
  postImage?: string;
  isLiked?: boolean;
}

interface CurrentUser {
  email: string;
  name: string;
  role: string;
  profileImage?: string;
}

const RightScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    initializeUserData();
  }, []);

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/sudentProfile`, { email }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.fullName || response.data.displayName;
        
        if (profilePic || userName) {
          let finalProfilePic = profilePic;
          if (profilePic && !profilePic.startsWith('http') && !profilePic.startsWith('/')) {
            finalProfilePic = `/${profilePic}`;
          }
          
          setCurrentUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              profileImage: finalProfilePic,
              name: userName || prev.name
            };
          });
          
          const authData = await getAuthData();
          if (authData) {
            await storeAuthData({ 
              ...authData, 
              profileImage: finalProfilePic,
              name: userName || authData.name 
            });
          }
        }
      }
    } catch (error) {
      console.log('❌ Profile fetch error:', error);
    }
  };

  const initializeUserData = async () => {
    try {
      const authData = await getAuthData();
      console.log('🔐 Student auth data retrieved:', authData);
      
      const wasRefreshed = await autoRefreshToken();
      if (wasRefreshed) {
        console.log('🔄 Token was refreshed, getting updated auth data...');
        const updatedAuthData = await getAuthData();
        console.log('📋 Updated auth data:', updatedAuthData);
        
        if (updatedAuthData) {
          setAuthToken(updatedAuthData.token);
          setCurrentUser({
            email: updatedAuthData.email,
            name: updatedAuthData.name || 'Student',
            role: updatedAuthData.role || 'student',
            profileImage: updatedAuthData.profileImage
          });
          
          if (updatedAuthData.email && updatedAuthData.token) {
            await fetchUserProfile(updatedAuthData.token, updatedAuthData.email);
          }
          
          fetchPosts(updatedAuthData.token);
        }
      } else if (authData) {
        setAuthToken(authData.token);
        setCurrentUser({
          email: authData.email,
          name: authData.name || 'Student',
          role: authData.role || 'student',
          profileImage: authData.profileImage
        });
        
        if (authData.email && authData.token) {
          await fetchUserProfile(authData.token, authData.email);
        }
        
        fetchPosts(authData.token);
      }
    } catch (error) {
      console.error('❌ Error initializing student user data:', error);
      Alert.alert('Error', 'Failed to initialize user data');
    }
  };

  const fetchPosts = async (token: string) => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${BASE_URL}/api/posts/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const formattedPosts = response.data.data.map((post: any) => ({
          ...post,
          createdAt: formatTimeAgo(post.createdAt),
          isLiked: post.isLiked || false
        }));
        setPosts(formattedPosts);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', 'Failed to fetch posts');
      }
      setPosts([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!authToken || !currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const newIsLiked = !post.isLiked;
      const newLikesCount = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: newLikesCount, isLiked: newIsLiked }
          : p
      ));

      const endpoint = `${BASE_URL}/api/posts/${postId}/like`;
      
      if (newIsLiked) {
        await axios.post(endpoint, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Post liked successfully');
      } else {
        await axios.delete(endpoint, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Post unliked successfully');
      }
      
    } catch (error: any) {
      console.error('Error liking post:', error);
      
      const post = posts.find(p => p.id === postId);
      if (post) {
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes: post.likes, isLiked: post.isLiked }
            : p
        ));
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to toggle like';
      Alert.alert('Error', errorMessage);
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    try {
      if (!createdAt) return 'Just now';
      
      if (typeof createdAt === 'string' && createdAt.includes('ago')) {
        return createdAt;
      }
      
      if (!createdAt || createdAt === 'null' || createdAt === 'undefined') {
        return 'Just now';
      }
      
      const date = new Date(createdAt);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date detected:', createdAt);
        return 'Just now';
      }
      
      const diffInMs = now.getTime() - date.getTime();
      
      if (diffInMs < 0) {
        return 'Just now';
      }
      
      const diffInMins = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMins < 1) return 'Just now';
      if (diffInMins < 60) return `${diffInMins}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting date:', error, createdAt);
      return 'Just now';
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B5FE8" /></View>;
  }

  return (
    <ImageBackground 
      source={require("../../../assets/images/TeacherLeftBackground.png")} 
      style={styles.background} 
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Thoughts</Text>
            <Text style={styles.headerSubtitle}>Explore updates & discussions</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.feed} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.feedContent}
        >
          {refreshing && posts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B5FE8" />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="post-outline" size={wp('12%')} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No thoughts yet</Text>
              <Text style={styles.emptyStateSubtext}>Teachers will share updates here!</Text>
            </View>
          ) : (
            posts.map((post) => {
              let displayName = post.author.name;
              let displayProfilePic = post.author.profile_pic;
              let displayRole = post.author.role;

              if (post.author.name && post.author.name.includes('@')) {
                displayName = post.author.name.split('@')[0];
              }

              return (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    {displayProfilePic && displayProfilePic !== '' ? (
                      <Image 
                        source={{ 
                          uri: displayProfilePic.startsWith('http') 
                            ? displayProfilePic 
                            : `${BASE_URL}/${displayProfilePic.startsWith('/') ? displayProfilePic.substring(1) : displayProfilePic}`
                        }} 
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {displayName?.charAt(0).toUpperCase() || 'A'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.postInfo}>
                      <Text style={styles.authorName}>{displayName}</Text>
                      <View style={styles.roleContainer}>
                        <Text style={styles.roleText}>{displayRole}</Text>
                        <Text style={styles.timeText}> • {post.createdAt}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{post.content}</Text>

                  {post.postImage && (
                    <Image 
                      source={{ uri: post.postImage }} 
                      style={styles.postImage} 
                      resizeMode="cover"
                    />
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {post.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleLike(post.id)}
                    >
                      <Ionicons 
                        name={post.isLiked ? "heart" : "heart-outline"} 
                        size={wp('4.5%')} 
                        color={post.isLiked ? "#EF4444" : "#666666"} 
                      />
                      <Text style={[styles.actionText, post.isLiked && styles.likedText]}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialCommunityIcons name="message-outline" size={wp('4.5%')} color="#666666" />
                      <Text style={styles.actionText}>
                        {post.comments?.length || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="share-outline" size={wp('4.5%')} color="#666666" />
                      <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, backgroundColor: 'transparent', paddingTop: hp('6%'), paddingHorizontal: wp('4%') },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp('2%') },
  headerTitle: { fontSize: wp('8%'), fontFamily: 'Quicksand_700Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: wp('4%'), fontFamily: 'Quicksand_400Regular', color: '#E0E7FF' },
  feed: { flex: 1 },
  feedContent: { paddingBottom: hp('10%') },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp('8%') },
  emptyStateText: { fontSize: wp('4.5%'), fontFamily: 'Quicksand_500Medium', color: '#9CA3AF', marginTop: 16 },
  emptyStateSubtext: { fontSize: wp('3.5%'), fontFamily: 'Quicksand_400Regular', color: '#D1D5DB', marginTop: 8 },
  postCard: { backgroundColor: '#FFFFFF', borderRadius: wp('5%'), padding: wp('4%'), marginBottom: hp('2%'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%'), marginRight: wp('3%') },
  avatarPlaceholder: { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: wp('4%'), fontFamily: 'Quicksand_700Bold', color: '#6B7280' },
  postInfo: { flex: 1 },
  authorName: { fontSize: wp('4.2%'), fontFamily: 'Quicksand_700Bold', color: '#1F2937', marginBottom: 2 },
  roleContainer: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontSize: wp('3.4%'), fontFamily: 'Quicksand_500Medium', color: '#6B7280' },
  timeText: { fontSize: wp('3.4%'), fontFamily: 'Quicksand_400Regular', color: '#9CA3AF' },
  postContent: { fontSize: wp('3.8%'), fontFamily: 'Quicksand_400Regular', color: '#1F2937', lineHeight: wp('5.5%'), marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: wp('3%'), paddingVertical: hp('0.6%'), borderRadius: wp('4%'), marginRight: wp('2%'), marginBottom: 4 },
  tagText: { fontSize: wp('3%'), fontFamily: 'Quicksand_500Medium', color: '#6366F1' },
  postImage: { width: '100%', height: hp('25%'), borderRadius: wp('4%'), marginBottom: 12 },
  postActions: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: wp('6%') },
  actionText: { fontSize: wp('3.4%'), fontFamily: 'Quicksand_500Medium', color: '#6B7280', marginLeft: 6 },
  likedText: { color: '#EF4444' },
});

export default RightScreen;