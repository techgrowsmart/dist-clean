import React, { useState, useEffect } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import { BASE_URL } from '../../config';

interface TeacherPost {
  id: string;
  author: { email: string; name: string; role: string; profile_pic: string };
  content: string;
  likes: number;
  comments?: any[];
  createdAt: string;
  tags?: string[];
  postImage?: string;
  postImages?: string[];
  isLiked?: boolean;
}

interface TeacherThoughtsCardProps {
  post?: TeacherPost;
  onLike?: (postId: string) => void;
  onComment?: (post: TeacherPost) => void;
  onReport?: (post: TeacherPost) => void;
  getProfileImageSource?: (profilePic?: string) => { uri: string } | null;
  initials?: (name: string) => string;
  resolvePostAuthor?: (post: TeacherPost) => { name: string; pic: string | null; role: string };
  ws?: any;
  userProfileCache?: Map<string, { name: string; profilePic: string }>;
}

interface TeacherThoughtsBackgroundProps {
  children: React.ReactNode;
}

export const TeacherThoughtsBackground: React.FC<TeacherThoughtsBackgroundProps> = ({ children }) => (
  <View style={bg.root}>
    <View style={bg.patternLayer} pointerEvents="none">
      {Array.from({ length: 120 }).map((_, i) => <Text key={i} style={bg.tile}>💭</Text>)}
    </View>
    {children}
  </View>
);

const bg = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  patternLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', flexWrap: 'wrap', opacity: 0, zIndex: 0 },
  tile: { fontSize: 22, width: 40, height: 40, textAlign: 'center', color: '#3a5bbf' },
});

const TeacherThoughtsCard: React.FC<TeacherThoughtsCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onReport, 
  getProfileImageSource, 
  initials, 
  resolvePostAuthor,
  ws,
  userProfileCache
}) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [isHovered, setIsHovered] = useState(false);

  // Track screen dimensions for responsiveness
  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Responsive breakpoints
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  // Dynamic sizing based on screen width
  const cardWidth = isMobile ? '95%' : isTablet ? '90%' : '100%';
  const maxWidth = isDesktop ? 400 : isTablet ? 350 : 300;
  const avatarSize = isMobile ? 44 : isTablet ? 48 : 52;
  const fontSize = {
    small: isMobile ? 13 : 14,
    medium: isMobile ? 14 : 15,
    large: isMobile ? 16 : 18,
  };
  const spacing = {
    small: isMobile ? 6 : 8,
    medium: isMobile ? 10 : 12,
    large: isMobile ? 14 : 16,
  };
  const defaultGetProfileImageSource = (profilePic?: string) => {
  if (!profilePic || profilePic === '' || profilePic === 'null' || profilePic === 'undefined' || profilePic.trim() === '') return null;
  if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
  // Handle profile image path
  if (!profilePic.startsWith('/')) {
    profilePic = `/${profilePic}`;
  }
  const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
  return { uri: `${BASE_URL}/${clean}` };
};
  
  const defaultInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const defaultResolvePostAuthor = (post?: TeacherPost) => {
  if (!post) return { name: 'Unknown Teacher', pic: null, role: 'teacher' };

  // Use cached profile data like student's version
  const cached = userProfileCache?.get(post.author?.email) || { name: '', profilePic: '' };
  let name = cached.name || post.author?.name || '';
  let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
  const role = post.author?.role || 'teacher';

  // Handle email fallback for name
  if (!name || name === 'null' || name.includes('@')) {
    name = post.author?.email?.split('@')[0] || 'Unknown Teacher';
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
    pic = null;
  }

  return { name, pic, role };
};

  const defaultOnLike = (postId: string) => console.log('Like teacher post:', postId);
  const defaultOnComment = (post?: TeacherPost) => console.log('Comment on teacher post:', post);
  const defaultOnReport = (post?: TeacherPost) => console.log('Report teacher post:', post);

  // Use resolved post for author data - posts come directly from API, no nested structure
  const { name, pic, role } = resolvePostAuthor && post 
    ? resolvePostAuthor(post) 
    : defaultResolvePostAuthor(post);
  
  // Get the actual content and other fields directly from post
  const content = post?.content || '';
  const images: string[] = post?.postImages?.length 
    ? post.postImages 
    : post?.postImage 
      ? [post.postImage] 
      : [];
  const commentCount = post?.comments?.length ?? 0;
  const likes = post?.likes ?? 0;
  const isLiked = post?.isLiked ?? false;
  const createdAt = post?.createdAt || 'Just now';
  const postId = post?.id || '';

  // If no post provided, show loading state instead of mock data
  if (!post) {
    return (
      <View style={[s.card, s.loadingCard]}>
        <View style={s.loadingContent}>
          <View style={[s.avatar, s.loadingAvatar]} />
          <View style={s.loadingTextContainer}>
            <View style={[s.loadingText, s.loadingTitle]} />
            <View style={[s.loadingText, s.loadingSubtitle]} />
          </View>
        </View>
        <View style={[s.loadingText, s.loadingContent]} />
        <View style={[s.loadingText, s.loadingContent, s.loadingContentShort]} />
      </View>
    );
  }

  const imgSrc = getProfileImageSource ? getProfileImageSource(pic || undefined) : defaultGetProfileImageSource(pic || undefined);

  const renderImages = () => {
    if (!images.length) return null;
    if (images.length <= 2) {
      return (
        <View style={s.imgGrid}>
          {images.map((uri, i) => <Image key={i} source={{ uri }} style={[s.imgGridItem, images.length === 1 && s.imgFull]} resizeMode="cover" />)}
        </View>
      );
    }
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imgStrip} contentContainerStyle={s.imgStripContent}>
        {images.map((uri, i) => <Image key={i} source={{ uri }} style={s.imgStripItem} resizeMode="cover" />)}
      </ScrollView>
    );
  };

  return (
    <View style={[s.card, { width: cardWidth, maxWidth: maxWidth, alignSelf: 'center' }]}>
      <View style={s.header}>
        {imgSrc
          ? <Image source={imgSrc} style={[s.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
          : <View style={[s.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}><Text style={[s.avatarTxt, { fontSize: avatarSize / 3 }]}>{initials ? initials(name) : defaultInitials(name)}</Text></View>}
        <View style={s.headerText}>
          <Text style={[s.authorName, { fontSize: fontSize.medium }]} numberOfLines={1}>{name}<Text style={[s.authorRole, { fontSize: fontSize.small }]}> | {role}</Text></Text>
          <Text style={[s.timeText, { fontSize: fontSize.small - 1, marginTop: spacing.small / 2 }]}>{createdAt}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => onReport ? onReport(post) : defaultOnReport(post)} 
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={Platform.OS === 'web' ? {
            transform: [{ scale: isHovered ? 1.1 : 1 }],
          } : {}}
          {...(Platform.OS === 'web' && {
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
          })}
        >
          <Text style={[s.dots, { fontSize: isMobile ? 16 : 18 }]}>•••</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.body, { fontSize: fontSize.medium, lineHeight: fontSize.medium * 1.5, marginBottom: spacing.medium }]}>{content}</Text>
      {renderImages()}

      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.actionBtn, { paddingVertical: spacing.small, paddingHorizontal: spacing.medium }]} 
          onPress={() => onLike ? onLike(postId) : defaultOnLike(postId)}
        >
          <FontAwesome name={isLiked ? 'thumbs-up' : 'thumbs-o-up'} size={isMobile ? 12 : 14} color="#4A7BF7" />
          <Text style={[s.actionTxt, isLiked && s.actionTxtActive, { fontSize: fontSize.small, marginLeft: spacing.small / 2 }]}> Like</Text>
          {likes > 0 && <View style={[s.countPill, { marginLeft: spacing.small }]}><Text style={[s.countTxt, { fontSize: fontSize.small - 1 }]}>{likes}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.actionBtn, { paddingVertical: spacing.small, paddingHorizontal: spacing.medium }]} 
          onPress={() => onComment ? onComment(post) : defaultOnComment(post)}
        >
          <FontAwesome name="comment-o" size={isMobile ? 12 : 14} color="#4A7BF7" />
          <Text style={[s.actionTxt, s.thoughtsText, { fontSize: fontSize.small, marginLeft: spacing.small / 2 }]}> Thoughts</Text>
          {commentCount > 0 && <View style={[s.countPill, { marginLeft: spacing.small }]}><Text style={[s.countTxt, { fontSize: fontSize.small - 1 }]}>{commentCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.actionBtn, { paddingVertical: spacing.small, paddingHorizontal: spacing.medium }]}
        >
          <FontAwesome name="share" size={isMobile ? 12 : 14} color="#555" />
          <Text style={[s.actionTxt, { fontSize: fontSize.small, marginLeft: spacing.small / 2 }]}> Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginHorizontal: 8, 
    marginVertical: 8, 
    paddingTop: 20, 
    paddingHorizontal: 20, 
    paddingBottom: 0, 
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12, 
    elevation: 6,
    // Enhanced responsive shadow
    shadowColor: Platform.OS === 'ios' ? '#000000' : '#000000',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 4 } : { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
    shadowRadius: Platform.OS === 'ios' ? 12 : 16,
    elevation: Platform.OS === 'android' ? 12 : 6,
    // Enhanced border and background
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    // Transform for hover effect
    transform: [{ scale: 1 }],
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { 
    marginRight: 14,
    // Enhanced avatar shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    // Responsive avatar will be set dynamically
  },
  avatarFallback: { 
    backgroundColor: '#4A7BF7', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 14,
    // Enhanced avatar shadow
    shadowColor: '#4A7BF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    // Responsive size will be set dynamically
  },
  avatarTxt: { 
    color: '#fff', 
    fontWeight: '700', 
    fontFamily: 'Poppins_700Bold',
    // Enhanced text shadow
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    // Responsive font size will be set dynamically
  },
  headerText: { flex: 1 },
  authorName: { 
    fontWeight: '700', 
    color: '#1a1a1a', 
    fontFamily: 'Poppins_600SemiBold',
    // Enhanced text styling
    letterSpacing: -0.2,
    // Responsive font size will be set dynamically
  },
  authorRole: { 
    fontWeight: '500', 
    color: '#6B7280', 
    fontFamily: 'Poppins_500Medium',
    // Enhanced role styling
    letterSpacing: 0.1,
    // Responsive font size will be set dynamically
  },
  timeText: { 
    color: '#aaa', 
    fontFamily: 'RedHatDisplay_400Regular',
    // Responsive font size will be set dynamically
  },
  dots: { 
    color: '#bbb', 
    paddingLeft: 8, 
    letterSpacing: 2,
    // Responsive font size will be set dynamically
  },
  body: { 
    color: '#222', 
    fontFamily: 'RedHatDisplay_400Regular',
    // Responsive font size and line height will be set dynamically
  },
  imgGrid: { 
    flexDirection: 'row', 
    gap: 6, 
    marginBottom: 14, 
    borderRadius: 10, 
    overflow: 'hidden',
    // Responsive image grid
    gap: Platform.OS === 'web' ? 8 : 6,
  },
  imgGridItem: { 
    flex: 1, 
    height: 200, 
    borderRadius: 10,
    // Responsive height
    height: Platform.OS === 'web' ? 180 : 200,
  },
  imgFull: { 
    height: 240,
    // Responsive height
    height: Platform.OS === 'web' ? 220 : 240,
  },
  imgStrip: { marginBottom: 14 },
  imgStripContent: { gap: 6, paddingRight: 4 },
  imgStripItem: { 
    width: 100, 
    height: 120, 
    borderRadius: 10,
    // Responsive size
    width: Platform.OS === 'web' ? 90 : 100,
    height: Platform.OS === 'web' ? 110 : 120,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 4 },
  tag: { backgroundColor: '#eef2ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt: { fontSize: 11, color: '#4A7BF7', fontFamily: 'RedHatDisplay_400Regular' },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0, 0, 0, 0.06)', 
    paddingVertical: 16, 
    paddingHorizontal: 4,
    gap: 2,
    // Enhanced responsive footer
    paddingVertical: Platform.OS === 'web' ? 18 : 16,
    gap: Platform.OS === 'web' ? 4 : 2,
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    // Enhanced button styling
    backgroundColor: 'rgba(74, 123, 247, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(74, 123, 247, 0.1)',
    // Responsive button padding will be set dynamically
  },
  actionTxt: { 
    color: '#4B5563', 
    fontFamily: 'Poppins_500Medium',
    // Enhanced text styling
    letterSpacing: -0.1,
    // Responsive font size will be set dynamically
  },
  actionTxtActive: { 
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  thoughtsText: { 
    color: '#4A7BF7', 
    fontWeight: '600', 
    fontFamily: 'Poppins_600SemiBold',
    // Enhanced thoughts text
    letterSpacing: -0.1,
  },
  countPill: { 
    backgroundColor: 'rgba(74, 123, 247, 0.1)', 
    borderRadius: 12, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    minWidth: 24, 
    alignItems: 'center',
    // Enhanced pill styling
    borderWidth: 1,
    borderColor: 'rgba(74, 123, 247, 0.2)',
    // Responsive pill
    paddingHorizontal: Platform.OS === 'web' ? 10 : 8,
    minWidth: Platform.OS === 'web' ? 28 : 24,
  },
  countTxt: { 
    color: '#4A7BF7', 
    fontWeight: '600', 
    fontFamily: 'Poppins_600SemiBold',
    // Enhanced count text
    letterSpacing: -0.1,
    // Responsive font size will be set dynamically
  },
  // Loading state styles
  loadingCard: {
    opacity: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingAvatar: {
    backgroundColor: '#e5e7eb',
    marginRight: 14,
  },
  loadingTextContainer: {
    flex: 1,
  },
  loadingText: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    height: 12,
    marginBottom: 8,
  },
  loadingTitle: {
    width: '60%',
    height: 16,
  },
  loadingSubtitle: {
    width: '40%',
    height: 12,
  },
  loadingContent: {
    width: '100%',
    height: 12,
    marginBottom: 8,
  },
  loadingContentShort: {
    width: '70%',
  },
});

export default TeacherThoughtsCard;
