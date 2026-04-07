import React, { useState, useEffect } from 'react';
import {
  Platform,
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
import { getAuthData, storeAuthData } from '../../../utils/authStorage';
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import { BASE_URL } from '../../../config';
import axios from 'axios';
import ThoughtsCard from '../StudentDashBoard/ThoughtsCard';

const { width, height } = Dimensions.get('window');

const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic || profilePic === '' || profilePic === 'null' || profilePic === 'undefined') { 
      return null; // Will show initials instead
    }
    
    // Handle different profile image formats
    if (typeof profilePic === 'string') {
      // If it's already a full URL (http/https/file)
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) {
        return { uri: profilePic };
      }
      
      // Remove leading slash if present to avoid double slashes
      const cleanProfilePic = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      
      // Construct full URL with BASE_URL
      const fullUrl = `${BASE_URL}/${cleanProfilePic}`;
      console.log('🖼️ Profile image URL:', fullUrl);
      return { uri: fullUrl };
    }
    
    return null;
  };

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
      console.log('🔐 Auth data retrieved:', authData); // Debug log
      
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
            name: updatedAuthData.name || 'Teacher', // Don't extract from email here, let the fallback system handle it
            role: updatedAuthData.role,
            profileImage: updatedAuthData.profileImage
          });
          console.log('👤 User role after refresh:', updatedAuthData.role); // Debug role
          console.log('👤 User name from auth:', updatedAuthData.name); // Debug name
          console.log('🖼️ Profile image from auth:', updatedAuthData.profileImage);
          
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
          name: authData.name || 'Teacher', // Don't extract from email here, let the fallback system handle it
          role: authData.role,
          profileImage: authData.profileImage
        });
        console.log('👤 User role:', authData.role); // Debug role
        console.log('👤 User name from auth:', authData.name); // Debug name
        console.log('🖼️ Profile image from auth:', authData.profileImage);
        
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

  const fetchPosts = async (token: string) => {
    try {
      console.log('🔄 Fetching posts with token:', token ? 'Token exists' : 'No token');
      console.log('🌐 BASE_URL:', BASE_URL);
      
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
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Only show error alert if it's not just empty posts or auth error
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    console.log('Creating post with user role:', currentUser.role); // Debug log

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('content', newPostContent);
      
      // Explicitly send user information to ensure correct author data
      formData.append('authorName', currentUser.name || 'Teacher');
      formData.append('authorEmail', currentUser.email);
      formData.append('authorRole', currentUser.role || 'Teacher');
      if (currentUser.profileImage) {
        formData.append('authorProfileImage', currentUser.profileImage);
      }
      
      // Add additional user data fields to ensure backend has correct info
      formData.append('userName', currentUser.name || 'Teacher');
      formData.append('userEmail', currentUser.email);
      formData.append('userRole', currentUser.role || 'Teacher');
      formData.append('userProfileImage', currentUser.profileImage || '');
      
      console.log('📤 Sending complete user data:', {
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        authorRole: currentUser.role,
        authorProfileImage: currentUser.profileImage
      });
      
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

      console.log('📨 Create post response:', response.data); // Debug response
      
      if (response.data.success) {
        console.log('✅ Post created successfully!');
        console.log('📝 Post data:', response.data.data);
        if (response.data.data?.author) {
          console.log('👤 Author in response:', response.data.data.author);
        }
        setNewPostContent('');
        setSelectedImage(null);
        fetchPosts(authToken);
        Alert.alert('Success', 'Post created successfully');
      } else {
        console.log('❌ Post creation failed:', response.data);
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
        // Like the post
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
        // Unlike the post
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

  const fetchPostLikes = async (postId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/${postId}/likes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        setPostLikes(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      setPostLikes([]);
    }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        const formattedComments = response.data.data.map((comment: any) => ({
          ...comment,
          createdAt: formatTimeAgo(comment.createdAt),
          isLiked: false
        }));
        setPostComments(formattedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setPostComments([]);
    }
  };

  const openLikesModal = async (post: Post) => {
    setSelectedPost(post);
    setShowLikesModal(true);
    await fetchPostLikes(post.id);
  };

  const openCommentsModal = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) {
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/posts/${selectedPost.id}/comments`, 
        { content: commentText.trim() },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const newComment: Comment = {
          ...response.data.data,
          createdAt: 'Just now',
          isLiked: false
        };
        setPostComments([newComment, ...postComments]);
        setCommentText('');
        
        // Update post comments count
        setPosts(posts.map(p => 
          p.id === selectedPost.id 
            ? { ...p, comments: [newComment, ...(p.comments || [])] }
            : p
        ));
        
        // Refetch comments to get the latest from server
        await fetchPostComments(selectedPost.id);
        
        console.log('✅ Comment added successfully');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add comment');
    }
  };

  // Report functions
  const openReportModal = (type: 'post' | 'comment', itemId: string) => {
    setReportType(type);
    setReportItemId(itemId);
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!authToken || !reportReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting');
      return;
    }

    try {
      const endpoint = reportType === 'post' 
        ? `${BASE_URL}/api/posts/${reportItemId}/report`
        : `${BASE_URL}/api/comments/${reportItemId}/report`;

      const response = await axios.post(endpoint, {
        reason: reportReason.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        Alert.alert('Success', 'Report submitted successfully');
        setShowReportModal(false);
        setReportReason('');
        console.log(`✅ ${reportType} reported successfully`);
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    try {
      if (!createdAt) return 'Just now';
      
      // Handle relative time formats like "2d ago", "3h ago", etc.
      if (typeof createdAt === 'string' && createdAt.includes('ago')) {
        return createdAt; // Return as-is if already formatted
      }
      
      // Handle null, undefined, or empty string
      if (!createdAt || createdAt === 'null' || createdAt === 'undefined') {
        return 'Just now';
      }
      
      const date = new Date(createdAt);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date detected:', createdAt);
        return 'Just now';
      }
      
      const diffInMs = now.getTime() - date.getTime();
      
      // Handle future dates
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
      
      // For older dates, show formatted date
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
        <ActivityIndicator size="large" color="#5B5FE8" />
        <Text style={{ marginTop: 10, fontSize: 16, color: '#6B7280', fontFamily: 'Quicksand-Medium' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/TeacherLeftBackground.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.swipeContainer}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>GrowThoughts</Text>
              <Text style={styles.headerSubtitle}>Explore updates& discussions</Text>
            </View>
          </View>

          
          {/* Input Area */}
          <View style={styles.inputCard}>
            <View style={styles.inputUserInfo}>
              {currentUser?.profileImage ? (
                <Image
                  source={{ 
                    uri: currentUser.profileImage.startsWith('http') 
                      ? currentUser.profileImage 
                      : `${BASE_URL}/${currentUser.profileImage.startsWith('/') ? currentUser.profileImage.substring(1) : currentUser.profileImage}`
                  }}
                  style={styles.inputAvatar}
                  onError={(e) => {
                    console.log('❌ Error loading user profile image:', e.nativeEvent.error);
                    const profileImage = currentUser.profileImage;
                    if (profileImage) {
                      const attemptedUrl = profileImage.startsWith('http') 
                        ? profileImage 
                        : `${BASE_URL}/${profileImage.startsWith('/') ? profileImage.substring(1) : profileImage}`;
                      console.log('🔗 Attempted URL:', attemptedUrl);
                    }
                    console.log('👤 Current user:', currentUser);
                  }}
                  onLoad={() => {
                    console.log('✅ Profile image loaded successfully!');
                  }}
                />
              ) : (
                <View style={[styles.inputAvatar, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#6B7280' }}>
                    {currentUser?.name?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: loading ? '#f0f0f0' : '#ffffff' }
              ]}
              placeholder="What's on your mind..."
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
                    onLike={handleLike}
                    onComment={openCommentsModal}
                    onReport={(post) => openReportModal('post', post.id)}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                  />
                );
              })
            )}
          </ScrollView>
        </View>
      </View>

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLikesModal(false)}
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
            maxHeight: height * 0.7,
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
              }}>Likes</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: height * 0.4 }}>
              {postLikes.length === 0 ? (
                <Text style={{
                  textAlign: 'center',
                  fontSize: width * 0.04,
                  fontFamily: 'Quicksand-Medium',
                  color: '#9CA3AF',
                  paddingVertical: 20,
                }}>No likes yet</Text>
              ) : (
                postLikes.map((like, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                  }}>
                    {like.user_profile_pic && like.user_profile_pic !== '' ? (
                      <Image
                        source={{ 
                          uri: like.user_profile_pic.startsWith('http') 
                            ? like.user_profile_pic 
                            : `${BASE_URL}/${like.user_profile_pic.startsWith('/') ? like.user_profile_pic.substring(1) : like.user_profile_pic}`
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          marginRight: 12,
                        }}
                        onError={(e) => {
                          console.log('Error loading likes modal profile image:', e.nativeEvent.error);
                          console.log('Like user name:', like.user_name);
                          const attemptedUrl = like.user_profile_pic.startsWith('http') 
                            ? like.user_profile_pic 
                            : `${BASE_URL}/${like.user_profile_pic.startsWith('/') ? like.user_profile_pic.substring(1) : like.user_profile_pic}`;
                          console.log('Attempted URL:', attemptedUrl);
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 12,
                        backgroundColor: '#E5E7EB',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#6B7280' }}>
                          {like.user_name?.charAt(0).toUpperCase() || 'L'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: width * 0.04,
                        fontFamily: 'Quicksand-Medium',
                        color: '#1F2937',
                        marginBottom: 2,
                      }}>{like.user_name}</Text>
                      <Text style={{
                        fontSize: width * 0.03,
                        fontFamily: 'Quicksand-Regular',
                        color: '#9CA3AF',
                      }}>{formatTimeAgo(like.liked_at)}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
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
            
            {/* Comment Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderTopWidth: 1,
              borderTopColor: '#F0F0F0',
            }}>
              {currentUser?.profileImage && currentUser.profileImage !== '' ? (
                <Image
                  source={{
                    uri: currentUser.profileImage.startsWith('http') 
                      ? currentUser.profileImage 
                      : `${BASE_URL}/${currentUser.profileImage.startsWith('/') ? currentUser.profileImage.substring(1) : currentUser.profileImage}`
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    marginRight: 10,
                  }}
                  onError={(e) => {
                    console.log('Error loading comment input profile image:', e.nativeEvent.error);
                    const attemptedUrl = currentUser?.profileImage?.startsWith('http') 
                      ? currentUser.profileImage 
                      : currentUser?.profileImage 
                        ? `${BASE_URL}/${currentUser.profileImage.startsWith('/') ? currentUser.profileImage.substring(1) : currentUser.profileImage}`
                        : 'No profile image URL';
                    console.log('Attempted URL:', attemptedUrl);
                  }}
                />
              ) : (
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  marginRight: 10,
                  backgroundColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6B7280' }}>
                    {currentUser?.name?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
              )}
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 20,
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  fontSize: width * 0.04,
                  fontFamily: 'Quicksand-Regular',
                  color: '#1F2937',
                }}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity 
                style={{
                  backgroundColor: '#6366F1',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  marginLeft: 10,
                }}
                onPress={addComment}
                disabled={!commentText.trim()}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: width * 0.04,
                  fontFamily: 'Quicksand-Medium',
                }}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={{ maxHeight: height * 0.3 }}>
              {postComments.length === 0 ? (
                <Text style={{
                  textAlign: 'center',
                  fontSize: width * 0.04,
                  fontFamily: 'Quicksand-Medium',
                  color: '#9CA3AF',
                  paddingVertical: 20,
                }}>No comments yet</Text>
              ) : (
                postComments.map((comment) => {
                  // Get user profile from cache for comment author
                  const userProfile = userProfileCache.get(comment.author.email) || { name: 'Unknown User', profilePic: '' };
                  
                  // Use the profile data from AstraDB, fallback to comment data if needed
                  let displayName = userProfile.name || comment.author.name;
                  let displayProfilePic: string | null = userProfile.profilePic || comment.author.profile_pic;
                  
                  console.log('💬 Enhanced comment author data:', {
                    commentAuthorEmail: comment.author.email,
                    userProfileFromCache: userProfile,
                    commentAuthorData: { name: comment.author.name, profile_pic: comment.author.profile_pic },
                    finalDisplayName: displayName,
                    finalProfilePic: displayProfilePic
                  });
                  
                  // Only use email fallback as last resort
                  if (!displayName || displayName === 'null' || displayName === 'undefined' || displayName.trim() === '' || displayName.includes('@')) {
                    displayName = comment.author.email?.split('@')[0] || 'Unknown User';
                  }
                  
                  // Ensure profile picture URL is properly formatted
                  if (displayProfilePic && displayProfilePic !== '' && displayProfilePic !== 'null' && displayProfilePic !== 'undefined') {
                    if (!displayProfilePic.startsWith('http') && !displayProfilePic.startsWith('/')) {
                      displayProfilePic = `/${displayProfilePic}`;
                    }
                  } else {
                    displayProfilePic = null;
                  }

                  return (
                  <View key={comment.id} style={{
                    flexDirection: 'row',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0',
                  }}>
                    {displayProfilePic ? (
                      <Image
                        source={{ 
                          uri: displayProfilePic.startsWith('http') 
                            ? displayProfilePic 
                            : displayProfilePic.startsWith('/') 
                              ? `${BASE_URL}${displayProfilePic}`
                              : `${BASE_URL}/${displayProfilePic}`
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          marginRight: 10,
                        }}
                        onError={(e) => {
                          console.log('❌ Error loading comment author profile image:', e.nativeEvent.error);
                          console.log('💬 Comment author name:', displayName);
                          const attemptedUrl = displayProfilePic?.startsWith('http') 
                            ? displayProfilePic 
                            : displayProfilePic?.startsWith('/') 
                              ? `${BASE_URL}${displayProfilePic}`
                              : `${BASE_URL}/${displayProfilePic}`;
                          console.log('🔗 Attempted URL:', attemptedUrl);
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        marginRight: 10,
                        backgroundColor: '#E5E7EB',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#6B7280' }}>
                          {displayName?.charAt(0).toUpperCase() || 'A'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{
                        fontSize: width * 0.04,
                        fontFamily: 'Quicksand-Bold',
                        color: '#1F2937',
                        marginBottom: 4,
                      }}>{displayName}</Text>
                      <Text style={{
                        fontSize: width * 0.04,
                        fontFamily: 'Quicksand-Regular',
                        color: '#374151',
                        lineHeight: width * 0.05,
                        marginBottom: 4,
                      }}>{comment.content}</Text>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <Text style={{
                          fontSize: width * 0.03,
                          fontFamily: 'Quicksand-Regular',
                          color: '#9CA3AF',
                        }}>{formatTimeAgo(comment.createdAt)}</Text>
                        {comment.author.email !== currentUser?.email && (
                          <TouchableOpacity
                            onPress={() => openReportModal('comment', comment.id)}
                            style={{ padding: 4 }}
                          >
                            <Ionicons name="flag-outline" size={16} color="#999" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
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
              fontSize: width * 0.04,
              fontFamily: 'Quicksand-Medium',
              color: '#374151',
              marginBottom: 15,
            }}>Please provide a reason for reporting:</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 10,
                paddingHorizontal: 15,
                paddingVertical: 12,
                minHeight: 80,
                fontSize: width * 0.04,
                fontFamily: 'Quicksand-Regular',
                color: '#1F2937',
                textAlignVertical: 'top',
              }}
              placeholder="Enter reason..."
              placeholderTextColor="#999"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              maxLength={200}
            />
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
            }}>
              <TouchableOpacity 
                style={{
                  paddingHorizontal: width * 0.06,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                }}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={{
                  fontSize: width * 0.035,
                  fontFamily: 'Quicksand-Medium',
                  color: '#6B7280',
                }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[{
                  paddingHorizontal: width * 0.06,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: '#EF4444',
                }, !reportReason.trim() && { backgroundColor: '#D1D5DB' }]}
                onPress={submitReport}
                disabled={!reportReason.trim()}
              >
                <Text style={{
                  fontSize: width * 0.035,
                  fontFamily: 'Quicksand-Medium',
                  color: '#FFFFFF',
                }}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  swipeContainer: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingTop: height * 0.06,
    paddingHorizontal: width * 0.04,
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: height * 0.01,
  },
  swipeHint: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Regular',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  swipeArrow: {
    transform: [{ rotate: '180deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: height * 0.03,
  },
  headerTitle: {
    fontSize: width * 0.08,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: width * 0.04,
    fontFamily: 'Quicksand-Regular',
    color: '#E0E7FF',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width * 0.04,
    marginBottom: height * 0.02,
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
  inputUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  inputAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: width * 0.04,
    fontFamily: 'Quicksand-Regular',
    color: '#333',
  },
  imageButton: {
    padding: 8,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width * 0.04,
    marginBottom: height * 0.02,
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: width * 0.045,
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#6B7280',
  },
  timeText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Regular',
    color: '#9CA3AF',
  },
  postContent: {
    fontSize: width * 0.04,
    fontFamily: 'Quicksand-Regular',
    color: '#1F2937',
    lineHeight: width * 0.06,
    marginBottom: 12,
  },
  hashtag: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#6366F1',
  },
  postImage: {
    width: '100%',
    height: height * 0.25,
    borderRadius: 16,
    marginBottom: 12,
    resizeMode: 'cover',
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
  overlayHint: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  hintText: {
    fontSize: 12,
    fontFamily: 'Quicksand-SemiBold',
    color: '#5f5fff',
    marginRight: 6,
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
    height: height * 0.2,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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
  // Inline comments styles
  inlineCommentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentsTitle: {
    fontSize: width * 0.04,
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  inlineComment: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inlineCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  inlineCommentAvatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineCommentContent: {
    flex: 1,
  },
  inlineCommentAuthor: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  inlineCommentText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Regular',
    color: '#374151',
    lineHeight: width * 0.045,
    marginBottom: 2,
  },
  inlineCommentTime: {
    fontSize: width * 0.03,
    fontFamily: 'Quicksand-Regular',
    color: '#9CA3AF',
  },
  viewAllCommentsButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  viewAllCommentsText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#6366F1',
    textAlign: 'center',
  },
});

export default RightScreen;