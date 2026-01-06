import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ActivityPost {
  id: string;
  time: string;
  category: string;
  title: string;
  description: string;
  likes: number;
  comments: number;
  image: any;
  likeType: 'heart' | 'like';
}

const RightScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
  });

  const [activeTab, setActiveTab] = useState<'posts' | 'activity'>('posts');

  const [posts] = useState<ActivityPost[]>([
    {
      id: '1',
      time: '2 hours ago',
      category: 'Math',
      title: 'Need help with Calculus II',
      description: 'Hi everyone, I am struggling with integration techniques and need ...',
      likes: 5,
      comments: 2,
      image: require('../../../assets/image/book.svg'),
      likeType: 'like',
    },
    {
      id: '2',
      time: '1 day ago',
      category: 'English',
      title: 'Offering Conversation ...',
      description: "Certified ESL teacher available for weekend sessions. Let's ...",
      likes: 12,
      comments: 4,
      image: require('../../../assets/image/chatBg1.svg'),
      likeType: 'heart',
    },
  ]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ImageBackground

            source={require('../../../assets/images/TeacherLeftBackground.png')}
      
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Activity</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Feed */}
        <ScrollView
          style={styles.feed}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
        >
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postMeta}>
                  <Text style={styles.timeText}>{post.time}</Text>
                  <View style={styles.dot} />
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{post.category}</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="dots-horizontal" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              <View style={styles.postBody}>
                <View style={styles.postTextContainer}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postDescription}>{post.description}</Text>

                  <View style={styles.postActions}>
                    <View style={styles.actionItem}>
                      {post.likeType === 'heart' ? (
                        <Ionicons name="heart" size={20} color="#EF4444" />
                      ) : (
                        <Ionicons name="heart-outline" size={20} color="#6B7280" />
                      )}
                      <Text style={styles.actionCount}>{post.likes}</Text>
                    </View>

                    <View style={styles.actionItem}>
                      <MaterialCommunityIcons name="message-outline" size={20} color="#6B7280" />
                      <Text style={styles.actionCount}>{post.comments}</Text>
                    </View>
                  </View>
                </View>

                <Image source={post.image} style={styles.postImage} />
              </View>
            </View>
          ))}
        </ScrollView>
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
  container: {
    flex: 1,
    paddingTop: height * 0.06,
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  headerTitle: {
    fontSize: width * 0.07,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginHorizontal: width * 0.04,
    padding: 4,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: width * 0.04,
    fontFamily: 'Quicksand-SemiBold',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#2563EB',
  },
  feed: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: width * 0.045,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#2563EB',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: width * 0.035,
    fontFamily: 'Quicksand-Medium',
    color: '#6B7280',
  },
  postBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  postTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: width * 0.045,
    fontFamily: 'Quicksand-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: width * 0.038,
    fontFamily: 'Quicksand-Regular',
    color: '#2563EB',
    lineHeight: width * 0.055,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    fontSize: width * 0.038,
    fontFamily: 'Quicksand-SemiBold',
    color: '#6B7280',
    marginLeft: 6,
  },
  postImage: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 12,
    resizeMode: 'cover',
  },
});

export default RightScreen;