import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuthData, storeAuthData } from '../utils/authStorage';
import { autoRefreshToken } from '../utils/tokenRefresh';
import { BASE_URL } from '../config';
import axios from 'axios';

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

interface GrowThoughtsFeedProps {
  backgroundColor?: string;
  backgroundImage?: any;
  headerTitle?: string;
  headerSubtitle?: string;
  placeholder?: string;
  showHeader?: boolean;
  showInputSection?: boolean;
  maxHeight?: number;
  onPostCreated?: (post: Post) => void;
  customStyles?: {
    container?: any;
    header?: any;
    inputCard?: any;
    postCard?: any;
  };
}

const GrowThoughtsFeed: React.FC<GrowThoughtsFeedProps> = ({
  backgroundColor = '#F5F5F5',
  backgroundImage,
  headerTitle = 'GrowThoughts',
  headerSubtitle = 'Explore updates & discussions',
  placeholder = "What's on your mind...",
  showHeader = true,
  showInputSection = true,
  maxHeight,
  onPostCreated,
  customStyles = {}
}) => {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Modals state
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postLikes, setPostLikes] = useState<Like[]>([]);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportItemId, setReportItemId] = useState<string>('');
  const [reportReason, setReportReason] = useState('');
  
  // Cache for user profiles to avoid repeated API calls
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());

  const initializeUserData = async () => {
    try {
      console.log('🚀 Initializing user data...');
      const authData = await getAuthData();
      console.log('🔐 Auth data retrieved:', authData);
      
      if (!authData) {
        console.log('❌ No auth data found, user not logged in');
        Alert.alert('Authentication Required', 'Please login to access this feature');
        return;
      }
      
      if (!authData.token) {
        console.log('❌ No token found in auth data');
        Alert.alert('Authentication Error', 'No authentication token found');
        return;
      }
      
      // Auto-refresh token if role is missing
      const wasRefreshed = await autoRefreshToken();
      if (wasRefreshed) {
        console.log('🔄 Token was refreshed, getting updated auth data...');
        const updatedAuthData = await getAuthData();
        console.log('📋 Updated auth data:', updatedAuthData);
        
        if (updatedAuthData) {
          setAuthToken(updatedAuthData.token);
          setCurrentUser({
            email: updatedAuthData.email,
            name: updatedAuthData.name || 'User',
            role: updatedAuthData.role,
            profileImage: updatedAuthData.profileImage
          });
          
          // Fetch user profile image from backend
          if (updatedAuthData.email && updatedAuthData.token) {
            console.log('🔍 Fetching profile image from backend...');
            await fetchUserProfile(updatedAuthData.token, updatedAuthData.email);
          }
          
          fetchPosts(updatedAuthData.token);
        }
      } else if (authData) {
        setAuthToken(authData.token);
        setCurrentUser({
          email: authData.email,
          name: authData.name || 'User',
          role: authData.role,
          profileImage: authData.profileImage
        });
        
        // Fetch user profile image from backend
        if (authData.email && authData.token) {
          console.log('🔍 Fetching profile image from backend...');
          await fetchUserProfile(authData.token, authData.email);
        }
        
        fetchPosts(authData.token);
      }
    } catch (error) {
      console.error('❌ Error initializing user data:', error);
      Alert.alert('Error', 'Failed to initialize user data');
    }
  };

  // Fetch user data and posts on component mount
  useEffect(() => {
    initializeUserData();
  }, []);

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
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.fullName || response.data.displayName;
        
        console.log('✅ User profile from AstraDB:', { name: userName, profilePic: profilePic });
        
        if (profilePic || userName) {
          let finalProfilePic = profilePic;
          if (finalProfilePic && !finalProfilePic.startsWith('http') && !finalProfilePic.startsWith('/')) {
            finalProfilePic = `/${finalProfilePic}`;
          }
          
          const profileData = { name: userName || 'Unknown User', profilePic: finalProfilePic || '' };
          
          // Cache the result
          setUserProfileCache(prev => new Map(prev.set(email, profileData)));
          
          return profileData;
        }
      }
    } catch (error) {
      console.log('❌ Profile fetch error:', error);
    }
    
    return { name: 'Unknown User', profilePic: '' };
  };
  
  // Enhanced function to fetch and cache multiple user profiles
  const fetchUserProfilesForPosts = async (posts: Post[], token: string) => {
    const uniqueEmails = [...new Set(posts.map(post => post.author.email))];
    
    const profilePromises = uniqueEmails.map(async (email) => {
      if (!userProfileCache.has(email)) {
        return await fetchUserProfile(token, email);
      }
      return null;
    });
    
    await Promise.all(profilePromises);
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) { 
      return null;
    }
    
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) {
        return { uri: profilePic };
      }
      
      if (profilePic.startsWith('/')) {
        return { uri: `${BASE_URL}${profilePic}` };
      }
      
      if (profilePic.includes('uploads/') || profilePic.includes('images/')) {
        return { uri: `${BASE_URL}/${profilePic}` };
      }
      
      return { uri: `${BASE_URL}/${profilePic}` };
    }
    
    return null;
  };

  const fetchPosts = async (token: string) => {
    try {
      console.log('🔄 Fetching posts with token:', token ? 'Token exists' : 'No token');
      
      setRefreshing(true);
      const response = await axios.get(`${BASE_URL}/api/posts/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 Posts response:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Fetch comments for each post
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
                createdAt: formatTimeAgo(post.createdAt),
                isLiked: post.isLiked || false,
                comments: comments.map((comment: any) => ({
                  ...comment,
                  createdAt: formatTimeAgo(comment.createdAt),
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
                createdAt: formatTimeAgo(post.createdAt),
                isLiked: post.isLiked || false,
                comments: []
              };
            }
          })
        );
        
        // Fetch user profiles for all post authors
        await fetchUserProfilesForPosts(postsWithComments, token);
        
        setPosts(postsWithComments);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
      
      if (error.response?.status !== 404 && error.response?.status !== 403) {
        Alert.alert('Error', `Failed to fetch posts: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select an image');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        setSelectedImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    if (!authToken || !currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('content', newPostContent);
      
      formData.append('authorName', currentUser.name || 'User');
      formData.append('authorEmail', currentUser.email);
      formData.append('authorRole', currentUser.role || 'User');
      if (currentUser.profileImage) {
        formData.append('authorProfileImage', currentUser.profileImage);
      }
      
      formData.append('userName', currentUser.name || 'User');
      formData.append('userEmail', currentUser.email);
      formData.append('userRole', currentUser.role || 'User');
      formData.append('userProfileImage', currentUser.profileImage || '');
      
      if (selectedImage) {
        const uri = selectedImage;
        const fileType = uri.split('.').pop();
        formData.append('postImage', {
          uri: uri,
          type: `image/${fileType}`,
          name: `post-image.${fileType}`
        } as any);
      }

      const response = await axios.post(`${BASE_URL}/api/posts/create`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Post created successfully!');
        setNewPostContent('');
        setSelectedImage(null);
        fetchPosts(authToken);
        
        if (onPostCreated && response.data.data) {
          onPostCreated(response.data.data);
        }
        
        Alert.alert('Success', 'Post created successfully');
      } else {
        const errorMessage = response.data?.message || 'Failed to create post';
        Alert.alert('Error', errorMessage);
      }
      
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create post';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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

      // Optimistically update UI immediately
      const newIsLiked = !post.isLiked;
      const newLikesCount = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, likes: newLikesCount, isLiked: newIsLiked }
          : p
      ));

      // Make API call
      const endpoint = `${BASE_URL}/api/posts/${postId}/like`;
      
      if (newIsLiked) {
        const response = await axios.post(endpoint, {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to like post');
        }
        console.log('✅ Post liked successfully');
      } else {
        const response = await axios.delete(endpoint, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to unlike post');
        }
        console.log('✅ Post unliked successfully');
      }
      
    } catch (error: any) {
      console.error('Error liking post:', error);
      
      // Revert the optimistic update on error
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
    } catch (err) {
      console.error("Error in formatTimeAgo:", err);
      return 'Just now';
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <ActivityIndicator size="large" color="#5B5FE8" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#6B7280', fontFamily: 'Quicksand-Medium' }}>
          Loading...
        </Text>
      </View>
    );
  }

  const Container = backgroundImage ? ImageBackground : View;
  const containerProps = backgroundImage ? {
    source: backgroundImage,
    style: [styles.background, { backgroundColor }]
  } : {
    style: [styles.container, { backgroundColor, maxHeight }, customStyles.container]
  };

  return (
    <Container {...containerProps}>
      <View style={styles.swipeContainer}>
        <View style={[styles.innerContainer, customStyles.container]}>

          {/* Header */}
          {showHeader && (
            <View style={[styles.header, customStyles.header]}>
              <View>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
              </View>
            </View>
          )}

          {/* Input Area */}
          {showInputSection && (
            <View style={[styles.inputCard, customStyles.inputCard]}>
              <View style={styles.inputUserInfo}>
                {currentUser?.profileImage ? (
                  <Image
                    source={{ 
                      uri: currentUser.profileImage.startsWith('http') 
                        ? currentUser.profileImage 
                        : `${BASE_URL}/${currentUser.profileImage.startsWith('/') ? currentUser.profileImage.substring(1) : currentUser.profileImage}`
                    }}
                    style={styles.inputAvatar}
                  />
                ) : (
                  <View style={[styles.inputAvatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#6B7280' }}>
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: loading ? '#f0f0f0' : '#ffffff' }
                ]}
                placeholder={placeholder}
                placeholderTextColor="#CCCCCC"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                maxLength={500}
                editable={!loading}
                selectTextOnFocus
              />
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <MaterialCommunityIcons name="image" size={24} color="#6366F1" />
              </TouchableOpacity>
              {newPostContent.trim() && (
                <TouchableOpacity 
                  style={[styles.postButton, loading && styles.postButtonDisabled]} 
                  onPress={createPost}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.postButtonText}>Post</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Selected Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton} 
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Posts Feed */}
          <ScrollView
            style={styles.feed}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContent}
            bounces
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => authToken && fetchPosts(authToken)}
                colors={['#5B5FE8']}
              />
            }
          >
            {posts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="post-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>Be the first to post your thoughts!</Text>
              </View>
            ) : (
              posts.map((post) => {
                const userProfile = userProfileCache.get(post.author.email) || { name: 'Unknown User', profilePic: '' };
                
                let displayName = userProfile.name || post.author.name;
                let displayProfilePic: string | null = userProfile.profilePic || post.author.profile_pic;
                let displayRole = post.author.role;
                
                if (!displayName || displayName === 'null' || displayName === 'undefined' || displayName.trim() === '' || displayName.includes('@')) {
                  displayName = post.author.email?.split('@')[0] || 'Unknown User';
                }
                
                if (displayProfilePic && displayProfilePic !== '' && displayProfilePic !== 'null' && displayProfilePic !== 'undefined') {
                  if (!displayProfilePic.startsWith('http') && !displayProfilePic.startsWith('/')) {
                    displayProfilePic = `/${displayProfilePic}`;
                  }
                } else {
                  displayProfilePic = null;
                }
                
                if (!displayRole || displayRole.trim() === '' || displayRole === 'null' || displayRole === 'undefined') {
                  displayRole = 'User';
                }

                return (
                  <View key={post.id} style={[styles.postCard, customStyles.postCard]}>
                    <View style={styles.postHeader}>
                      {displayProfilePic ? (
                        <Image 
                          source={{ 
                            uri: displayProfilePic.startsWith('http') 
                              ? displayProfilePic 
                              : displayProfilePic.startsWith('/') 
                                ? `${BASE_URL}${displayProfilePic}`
                                : `${BASE_URL}/${displayProfilePic}`
                          }} 
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6B7280' }}>
                            {displayName?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.postInfo}>
                        <Text style={styles.authorName}>{displayName}</Text>
                        <View style={styles.roleContainer}>
                          <Text style={styles.roleText}>{displayRole}</Text>
                        </View>
                      </View>
                      <TouchableOpacity>
                        <MaterialCommunityIcons name="dots-horizontal" size={24} color="#999" />
                      </TouchableOpacity>
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
                          size={20} 
                          color={post.isLiked ? "#EF4444" : "#666666"} 
                        />
                        <Text style={styles.actionText}>{post.likes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedPost(post);
                          setShowCommentsModal(true);
                          setCommentText('');
                        }}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#666666" />
                        <Text style={styles.actionText}>{(post.comments?.length || 0)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          setReportType('post');
                          setReportItemId(post.id);
                          setReportReason('');
                          setShowReportModal(true);
                        }}
                      >
                        <Ionicons name="flag-outline" size={20} color="#666666" />
                        <Text style={styles.actionText}>Report</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Comments Modal - Simplified version */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            width: width * 0.9,
            maxHeight: height * 0.8,
            padding: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: width * 0.05,
                fontFamily: 'Quicksand-Bold',
                color: '#1F2937',
              }}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={{
              textAlign: 'center',
              fontSize: width * 0.04,
              fontFamily: 'Quicksand-Medium',
              color: '#9CA3AF',
              paddingVertical: 20,
            }}>Comments feature coming soon!</Text>
          </View>
        </View>
      </Modal>

      {/* Report Modal - Simplified version */}
      <Modal
        visible={showReportModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            width: width * 0.85,
            borderRadius: 20,
            padding: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: width * 0.05,
                fontFamily: 'Quicksand-Bold',
                color: '#1F2937',
              }}>Report {reportType === 'post' ? 'Post' : 'Comment'}</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={{
              textAlign: 'center',
              fontSize: width * 0.04,
              fontFamily: 'Quicksand-Medium',
              color: '#9CA3AF',
              paddingVertical: 20,
            }}>Report feature coming soon!</Text>
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
  },
  swipeContainer: {
    flex: 1,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    paddingTop: height * 0.015, // Further reduced from 0.03
    paddingHorizontal: width * 0.02, // Reduced from 0.04
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: height * 0.015, // Reduced from 0.03
  },
  headerTitle: {
    fontSize: width * 0.045, // Further reduced from 0.06
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: width * 0.025, // Further reduced from 0.035
    fontFamily: 'Quicksand-Regular',
    color: '#E0E7FF',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10, // Further reduced from 16
    padding: width * 0.02, // Further reduced from 0.03
    marginBottom: height * 0.01, // Further reduced from 0.015
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.08, // Reduced shadow
    shadowRadius: 2, // Reduced shadow
    elevation: 2, // Reduced elevation
  },
  inputUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8, // Reduced from 12
  },
  inputAvatar: {
    width: 24, // Further reduced from 32
    height: 24, // Further reduced from 32
    borderRadius: 12, // Further reduced from 16
    marginRight: 6, // Reduced from 10
  },
  input: {
    flex: 1,
    fontSize: width * 0.03, // Further reduced from 0.035
    fontFamily: 'Quicksand-Regular',
    color: '#333',
  },
  imageButton: {
    padding: 4, // Reduced from 8
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10, // Further reduced from 16
    padding: width * 0.02, // Further reduced from 0.03
    marginBottom: height * 0.01, // Further reduced from 0.015
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.08, // Reduced shadow
    shadowRadius: 2, // Reduced shadow
    elevation: 2, // Reduced elevation
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  avatar: {
    width: 28, // Further reduced from 36
    height: 28, // Further reduced from 36
    borderRadius: 14, // Further reduced from 18
    marginRight: 6, // Reduced from 10
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: width * 0.032, // Further reduced from 0.04
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 1, // Reduced from 2
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: width * 0.025, // Further reduced from 0.03
    fontFamily: 'Quicksand-Medium',
    color: '#6B7280',
  },
  timeText: {
    fontSize: width * 0.025, // Further reduced from 0.03
    fontFamily: 'Quicksand-Regular',
    color: '#9CA3AF',
  },
  postContent: {
    fontSize: width * 0.03, // Further reduced from 0.035
    fontFamily: 'Quicksand-Regular',
    color: '#1F2937',
    lineHeight: width * 0.04, // Further reduced from 0.05
    marginBottom: 6, // Reduced from 10
  },
  postImage: {
    width: '100%',
    height: height * 0.12, // Further reduced from 0.2
    borderRadius: 8, // Further reduced from 12
    marginBottom: 6, // Reduced from 10
    resizeMode: 'cover',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: height * 0.01,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    borderRadius: 12,
    marginRight: width * 0.02,
    marginBottom: height * 0.005,
  },
  tagText: {
    fontSize: width * 0.03,
    color: '#6B7280',
    fontFamily: 'Quicksand-Regular',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: width * 0.08,
  },
  actionText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  postButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Bold',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: height * 0.02,
  },
  imagePreview: {
    width: '100%',
    height: height * 0.1, // Further reduced from 0.15
    borderRadius: 8, // Further reduced from 12
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.1,
  },
  emptyStateText: {
    fontSize: width * 0.045,
    color: '#9CA3AF',
    fontFamily: 'Quicksand-Medium',
    marginTop: height * 0.02,
  },
  emptyStateSubtext: {
    fontSize: width * 0.035,
    color: '#D1D5DB',
    fontFamily: 'Quicksand-Regular',
    marginTop: height * 0.01,
  },
});

export default GrowThoughtsFeed;
