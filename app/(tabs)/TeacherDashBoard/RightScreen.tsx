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
  ActivityIndicator
} from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

interface Post {
  id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  createdAt: string;
  tags?: string[];
  postImage?: string;
  isLiked?: boolean;
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

  // Mock user data - replace with actual user context
  const currentUser = {
    email: 'teacher@example.com',
    name: 'Teacher',
    role: 'teacher'
  };

  // API base URL - replace with your actual backend URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setRefreshing(true);
      // Mock implementation for now - replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/posts/all`, {
      //   headers: {
      //     'Authorization': `Bearer ${await getToken()}`
      //   }
      // });
      // const data = await response.json();
      // if (data.success) {
      //   setPosts(data.data);
      // }
      
      // Temporary mock data
      setPosts([
        {
          id: '1',
          author: 'Sarah Wilson',
          role: 'History Tutor',
          content: 'Just tried the "flipped classroom" method for 9th grade History. The engagement was unreal! 🎉',
          likes: 14,
          createdAt: '2h ago',
          isLiked: false
        },
        {
          id: '2',
          author: 'David Chen',
          role: 'SCIENCE',
          content: 'Does anyone have extra graph paper? My supply ran out mid-lab. SOS!',
          likes: 2,
          createdAt: '5 mins ago',
          tags: ['Supplies'],
          isLiked: false
        }
      ]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts');
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

    try {
      setLoading(true);
      
      // Mock implementation for now - replace with actual API call
      // const formData = new FormData();
      // formData.append('content', newPostContent);
      // if (selectedImage) {
      //   formData.append('postImage', {
      //     uri: selectedImage,
      //     type: 'image/jpeg',
      //     name: 'post-image.jpg'
      //   } as any);
      // }

      // const response = await fetch(`${API_BASE_URL}/posts/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${await getToken()}`,
      //     'Content-Type': 'multipart/form-data'
      //   },
      //   body: formData
      // });

      // const data = await response.json();
      // if (data.success) {
      //   setNewPostContent('');
      //   setSelectedImage(null);
      //   fetchPosts();
      //   Alert.alert('Success', 'Post created successfully');
      // } else {
      //   Alert.alert('Error', data.message || 'Failed to create post');
      // }

      // Temporary mock implementation
      const newPost: Post = {
        id: Date.now().toString(),
        author: currentUser.name,
        role: 'Teacher',
        content: newPostContent,
        likes: 0,
        createdAt: 'Just now',
        isLiked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setSelectedImage(null);
      Alert.alert('Success', 'Post created successfully');
      
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Mock implementation - replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${await getToken()}`
      //   }
      // });
      
      // if (response.ok) {
      //   setPosts(posts.map(post => 
      //     post.id === postId 
      //       ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
      //       : post
      //   ));
      // }

      // Temporary mock implementation
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    // Simple time formatting - enhance as needed
    return createdAt;
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground
      source={require("../../../assets/images/teacherleftbackground.png")}
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
            <View style={styles.notificationContainer}>
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>2</Text>
              </View>
            </View>
          </View>

          {/* Input Area */}
          <View style={styles.inputCard}>
            <Image
              source={require('../../../assets/image/Person3.jpeg')}
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.input}
              placeholder="Share your thoughts ..."
              placeholderTextColor="#CCCCCC"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
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
          >
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image 
                    source={require('../../../assets/image/Person1.jpeg')} 
                    style={styles.avatar} 
                  />
                  <View style={styles.postInfo}>
                    <Text style={styles.authorName}>{post.author}</Text>
                    <View style={styles.roleContainer}>
                      <Text style={styles.roleText}>{post.role}</Text>
                      <Text style={styles.timeText}> • {formatTimeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <MaterialCommunityIcons name="dots-horizontal" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.tags && post.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {post.tags.map((tag, index) => (
                      <Text key={index} style={styles.hashtag}>#{tag}</Text>
                    ))}
                  </View>
                )}

                {post.postImage && (
                  <Image source={{ uri: post.postImage }} style={styles.postImage} />
                )}

                <View style={styles.postActions}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleLike(post.id)}
                  >
                    <Ionicons 
                      name={post.isLiked ? "heart" : "heart-outline"} 
                      size={20} 
                      color={post.isLiked ? "#EF4444" : "#999"} 
                    />
                    <Text style={styles.actionText}>{post.likes}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <MaterialCommunityIcons name="message-outline" size={20} color="#999" />
                    <Text style={styles.actionText}>Reply</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color="#999" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    marginBottom: 12,
  },
});

export default RightScreen;