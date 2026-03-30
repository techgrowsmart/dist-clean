import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';

// Colors from HomeScreen
const COLORS = {
  primary: '#3B5BFE',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  background: '#F5F7FB',
};

interface ThoughtPost {
  id: string;
  name: string;
  subject: string;
  time: string;
  avatar: string;
  text: string;
  images: string[];
  likes: number;
  comments: number;
  shares: number;
}

interface HomeThoughtsCardProps {
  posts: ThoughtPost[];
  onLike?: (postId: string) => void;
  onComment?: (post: ThoughtPost) => void;
  onShare?: (post: ThoughtPost) => void;
  onMore?: (post: ThoughtPost) => void;
  containerStyle?: any;
}

const HomeThoughtsCard = ({
  posts = [],
  onLike,
  onComment,
  onShare,
  onMore,
  containerStyle,
}: HomeThoughtsCardProps) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.title}>Thoughts</Text>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.thoughtsList}
      >
        {posts.map((post) => (
          <ThoughtPostCard
            key={post.id}
            post={post}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onMore={onMore}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const ThoughtPostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onMore,
}: {
  post: ThoughtPost;
  onLike?: (postId: string) => void;
  onComment?: (post: ThoughtPost) => void;
  onShare?: (post: ThoughtPost) => void;
  onMore?: (post: ThoughtPost) => void;
}) => {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.postName}>
            {post.name} <Text style={styles.postSubject}>| {post.subject}</Text>
          </Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        <TouchableOpacity onPress={() => onMore?.(post)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      {post.images.length > 0 && (
        <View style={styles.postMediaGrid}>
          {post.images.slice(0, 4).map((img, idx) => (
            <Image 
              key={idx} 
              source={{ uri: img }} 
              style={[
                styles.postMediaImage, 
                { width: post.images.length > 2 ? '24%' : '48%' }
              ]} 
            />
          ))}
        </View>
      )}

      <View style={styles.postActionsRow}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onLike?.(post.id)}
        >
          <Ionicons name="thumbs-up-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionTextBlue}>Like</Text>
          <View style={[styles.countBadge, {backgroundColor: '#EEF2FF'}]}>
            <Text style={styles.countTextBlue}>{post.likes}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onComment?.(post)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Thoughts</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{post.comments}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onShare?.(post)}
        >
          <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{post.shares}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  thoughtsList: {
    paddingBottom: 40,
  },
  postCard: {
    marginBottom: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  postSubject: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  postTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  postText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  postMediaImage: {
    height: 140,
    borderRadius: 8,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  actionTextBlue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
  },
  countBadge: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  countText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  countTextBlue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: COLORS.primary,
  },
});

export default HomeThoughtsCard;
