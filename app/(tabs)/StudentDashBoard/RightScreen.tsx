import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Post {
  id: string;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  tag?: string;
  avatar: any;
  postImage?: any;
}

const RightScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
  });

  const [posts] = useState<Post[]>([
    {
      id: '1',
      author: 'Sarah Wilson',
      role: 'History Tutor',
      time: '2h ago',
      content: 'Just tried the" flipped classroom" method for 9th grade History. The engagement was unreal! 🎉',
      likes: 14,
      avatar: require('../../../assets/image/Person1.jpeg'),
    },
    {
      id: '2',
      author: 'David Chen',
      role: 'SCIENCE',
      time: '5 mins ago',
      content: 'Does anyone have extra graph paper? My supply ran out mid- lab .     SOS !',
      likes: 2,
      tag: '#Supplies',
      avatar: require('../../../assets/image/Person2.jpeg'),
    },
    {
      id: '3',
      author: 'Sarah Wilson',
      role: 'Just now',
      time: 'Just now',
      content: 'I have a few pads in room 302! Sending student runner now 🏃',
      likes: 0,
      avatar: require('../../../assets/image/Person1.jpeg'),
      postImage: require('../../../assets/image/class.jpeg'),
    },
  ]);

  if (!fontsLoaded) return null;

  return (
    <ImageBackground source={require("../../../assets/images/teacherleftbackground.png")} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ts</Text>
            <Text style={styles.headerSubtitle}>Explore updates& discussions</Text>
          </View>
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>2</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.feed} showsVerticalScrollIndicator={false} contentContainerStyle={styles.feedContent}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={post.avatar} style={styles.avatar} />
                <View style={styles.postInfo}>
                  <Text style={styles.authorName}>{post.author}</Text>
                  <View style={styles.roleContainer}>
                    <Text style={styles.roleText}>{post.role}</Text>
                    <Text style={styles.timeText}> • {post.time}</Text>
                  </View>
                </View>
                <TouchableOpacity><MaterialCommunityIcons name="dots-horizontal" size={24} color="#999" /></TouchableOpacity>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.tag && <Text style={styles.hashtag}>{post.tag}</Text>}
              {post.postImage && <Image source={post.postImage} style={styles.postImage} />}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color="#999" />
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width, height },
  container: { flex: 1, paddingTop: height * 0.06, paddingHorizontal: width * 0.04 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: height * 0.02 },
  headerTitle: { fontSize: width * 0.08, fontFamily: 'Quicksand-Bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: width * 0.04, fontFamily: 'Quicksand-Regular', color: '#E0E7FF' },
  notificationContainer: { position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  notificationText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Quicksand-Bold' },
  feed: { flex: 1 },
  feedContent: { paddingBottom: height * 0.05 },
  postCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: width * 0.04, marginBottom: height * 0.02, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  postInfo: { flex: 1 },
  authorName: { fontSize: width * 0.045, fontFamily: 'Quicksand-Bold', color: '#1F2937', marginBottom: 2 },
  roleContainer: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontSize: width * 0.035, fontFamily: 'Quicksand-Medium', color: '#6B7280' },
  timeText: { fontSize: width * 0.035, fontFamily: 'Quicksand-Regular', color: '#9CA3AF' },
  postContent: { fontSize: width * 0.04, fontFamily: 'Quicksand-Regular', color: '#1F2937', lineHeight: width * 0.06, marginBottom: 12 },
  hashtag: { fontSize: width * 0.035, fontFamily: 'Quicksand-Medium', color: '#6366F1', marginBottom: 12 },
  postImage: { width: '100%', height: height * 0.25, borderRadius: 16, marginBottom: 12, resizeMode: 'cover' },
  postActions: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: width * 0.08 },
  actionText: { fontSize: width * 0.035, fontFamily: 'Quicksand-Medium', color: '#6B7280', marginLeft: 6 },
});

export default RightScreen;