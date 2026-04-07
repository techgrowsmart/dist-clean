import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL } from '../../config';

// Unified interface that works for both Teacher and Student contexts
export interface UnifiedPost {
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

interface UnifiedThoughtsCardProps {
  post?: UnifiedPost;
  onLike?: (postId: string) => void;
  onComment?: (post: UnifiedPost) => void;
  onReport?: (post: UnifiedPost) => void;
  getProfileImageSource?: (profilePic?: string) => { uri: string } | null;
  initials?: (name: string) => string;
  resolvePostAuthor?: (post: UnifiedPost) => { name: string; pic: string | null; role: string };
  ws?: any;
  userProfileCache?: Map<string, { name: string; profilePic: string }>;
  isTeacherContext?: boolean; // To differentiate between teacher and student contexts
}

interface UnifiedThoughtsBackgroundProps {
  children: React.ReactNode;
}

export const UnifiedThoughtsBackground: React.FC<UnifiedThoughtsBackgroundProps> = ({ children }) => (
  <View style={bg.root}>
    {Platform.OS !== 'web' && (
      <View style={bg.patternLayer} pointerEvents="none">
        {Array.from({ length: 120 }).map((_, i) => (
          <Text key={i} style={bg.tile}>💭</Text>
        ))}
      </View>
    )}
    {children}
  </View>
);

const bg = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0,
    zIndex: 0,
  },
  tile: { fontSize: 22, width: 40, height: 40, textAlign: 'center', color: '#3a5bbf' },
});

// ─── Hover wrapper (web-only) ─────────────────────────────────────────────────
const HoverTouchable: React.FC<{
  onPress?: () => void;
  style?: any;
  hitSlop?: any;
  children: React.ReactNode;
}> = ({ onPress, style, hitSlop, children }) => {
  const [hovered, setHovered] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        onPress={onPress}
        hitSlop={hitSlop}
        style={[style, hovered && { transform: [{ scale: 1.1 }] }]}
        // @ts-ignore – web-only events
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop} style={style}>
      {children}
    </TouchableOpacity>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const UnifiedThoughtsCard: React.FC<UnifiedThoughtsCardProps> = ({
  post,
  onLike,
  onComment,
  onReport,
  getProfileImageSource,
  initials,
  resolvePostAuthor,
  ws,
  userProfileCache,
  isTeacherContext = false,
}) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // ── Responsive breakpoints ──────────────────────────────────────────────────
  const isMobile       = screenWidth < 480;
  const isTablet       = screenWidth >= 480 && screenWidth < 768;
  const isSmallDesktop = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop      = screenWidth >= 1024 && screenWidth < 1440;
  // isLargeDesktop: screenWidth >= 1440

  // Font scale
  const fs = {
    xs:  isMobile ? 9  : isTablet ? 10 : isSmallDesktop ? 11 : isDesktop ? 12 : 13,
    sm:  isMobile ? 10 : isTablet ? 11 : isSmallDesktop ? 12 : isDesktop ? 13 : 14,
    md:  isMobile ? 12 : isTablet ? 13 : isSmallDesktop ? 13 : isDesktop ? 14 : 15,
    lg:  isMobile ? 14 : isTablet ? 15 : isSmallDesktop ? 15 : isDesktop ? 16 : 17,
  };

  // Spacing scale
  const sp = {
    xs: isMobile ? 3  : isTablet ? 4  : 6,
    sm: isMobile ? 6  : isTablet ? 8  : 10,
    md: isMobile ? 10 : isTablet ? 12 : 14,
  };

  // Avatar
  const avatarSize = isMobile ? 28 : isTablet ? 32 : isSmallDesktop ? 36 : isDesktop ? 38 : 42;

  // Image heights
  const imgHeight = isMobile ? 60 : isTablet ? 80 : isSmallDesktop ? 100 : 120;
  const stripW    = isMobile ? 50 : isTablet ? 60 : isSmallDesktop ? 70 : 80;
  const stripH    = isMobile ? 70 : isTablet ? 80 : isSmallDesktop ? 90 : 100;

  // ── Default helpers ──────────────────────────────────────────────────────────
  const defaultGetProfileImageSource = (profilePic?: string): { uri: string } | null => {
    if (!profilePic || ['', 'null', 'undefined'].includes(profilePic.trim())) return null;
    if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
    const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    return { uri: `${BASE_URL}/${clean}` };
  };

  const defaultInitials = (name: string): string =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const defaultResolvePostAuthor = (p?: UnifiedPost) => {
    if (!p) return { name: isTeacherContext ? 'Unknown Teacher' : 'Unknown User', pic: null, role: isTeacherContext ? 'teacher' : 'student' };

    const cached = userProfileCache?.get(p.author?.email) ?? { name: '', profilePic: '' };
    let name: string = cached.name || p.author?.name || '';
    let pic: string | null = cached.profilePic || p.author?.profile_pic || null;
    const role = p.author?.role || (isTeacherContext ? 'teacher' : 'student');

    if (!name || name === 'null' || name.includes('@')) {
      name = p.author?.email?.split('@')[0] || isTeacherContext ? 'Unknown Teacher' : 'Unknown User';
      name = name
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;

    return { name, pic, role };
  };

  // ── Resolve author ───────────────────────────────────────────────────────────
  const { name, pic, role } =
    resolvePostAuthor && post
      ? resolvePostAuthor(post)
      : defaultResolvePostAuthor(post);

  const content      = post?.content ?? '';
  const images: string[] = post?.postImages?.length
    ? post.postImages
    : post?.postImage
    ? [post.postImage]
    : [];
  const commentCount = post?.comments?.length ?? 0;
  const likes        = post?.likes ?? 0;
  const isLiked      = post?.isLiked ?? false;
  const createdAt    = post?.createdAt ?? 'Just now';
  const postId       = post?.id ?? '';

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!post) {
    return (
      <View style={[s.card, s.loadingCard]}>
        {/* Row: avatar + text lines */}
        <View style={s.loadingRow}>
          <View style={[s.loadingBox, { width: 36, height: 36, borderRadius: 18, marginRight: 10 }]} />
          <View style={{ flex: 1 }}>
            <View style={[s.loadingBox, { height: 14, width: '55%', marginBottom: 6 }]} />
            <View style={[s.loadingBox, { height: 10, width: '35%' }]} />
          </View>
        </View>
        {/* Body lines */}
        <View style={[s.loadingBox, { height: 11, width: '90%', marginTop: 12, marginBottom: 6 }]} />
        <View style={[s.loadingBox, { height: 11, width: '70%' }]} />
      </View>
    );
  }

  // ── Image grid ───────────────────────────────────────────────────────────────
  const renderImages = () => {
    if (!images.length) return null;

    if (images.length <= 2) {
      return (
        <View style={s.imgGrid}>
          {images.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={[
                s.imgGridItem,
                { height: imgHeight },
                images.length === 1 && s.imgFull,
              ]}
              resizeMode="cover"
            />
          ))}
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.imgStrip}
        contentContainerStyle={s.imgStripContent}
      >
        {images.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={[s.imgStripItem, { width: stripW, height: stripH }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    );
  };

  const imgSrc = getProfileImageSource
    ? getProfileImageSource(pic ?? undefined)
    : defaultGetProfileImageSource(pic ?? undefined);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.card}>
      {/* Header */}
      <View style={[s.header, { marginBottom: sp.xs }]}>
        {imgSrc ? (
          <Image
            source={imgSrc}
            style={[s.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          />
        ) : (
          <View
            style={[
              s.avatarFallback,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            ]}
          >
            <Text style={[s.avatarTxt, { fontSize: Math.floor(avatarSize / 2.8) }]}>
              {initials ? initials(name) : defaultInitials(name)}
            </Text>
          </View>
        )}

        <View style={s.headerText}>
          <Text style={[s.authorName, { fontSize: fs.md }]} numberOfLines={1}>
            {name}
            <Text style={[s.authorRole, { fontSize: fs.xs }]}> | {role}</Text>
          </Text>
          <Text style={[s.timeText, { fontSize: fs.xs - 1, marginTop: sp.xs / 2 }]}>
            {createdAt}
          </Text>
        </View>

        <HoverTouchable
          onPress={() => (onReport ? onReport(post) : undefined)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[s.dots, { fontSize: isMobile ? 14 : 16 }]}>•••</Text>
        </HoverTouchable>
      </View>

      {/* Body */}
      <Text
        style={[
          s.body,
          {
            fontSize: fs.md,
            lineHeight: fs.md * 1.5,
            marginBottom: sp.sm,
          },
        ]}
      >
        {content}
      </Text>

      {renderImages()}

      {/* Tags */}
      {post?.tags && post.tags.length > 0 && (
        <View style={[s.tagsRow, { marginBottom: sp.sm }]}>
          {post.tags.map((tag, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagTxt}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer actions */}
      <View style={[s.footer, { paddingVertical: sp.sm }]}>
        {/* Like */}
        <TouchableOpacity
          style={[s.actionBtn, { paddingVertical: sp.xs, paddingHorizontal: sp.sm }]}
          onPress={() => (onLike ? onLike(postId) : undefined)}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={isLiked ? 'thumbs-up' : 'thumbs-o-up'}
            size={isMobile ? 9 : 11}
            color="#4A7BF7"
          />
          <Text style={[s.actionTxt, isLiked && s.actionTxtActive, { fontSize: fs.sm, marginLeft: sp.xs }]}>
            Like
          </Text>
          {likes > 0 && (
            <View style={[s.countPill, { marginLeft: sp.xs }]}>
              <Text style={[s.countTxt, { fontSize: fs.xs }]}>{likes}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity
          style={[s.actionBtn, { paddingVertical: sp.xs, paddingHorizontal: sp.sm }]}
          onPress={() => (onComment ? onComment(post) : undefined)}
          activeOpacity={0.7}
        >
          <FontAwesome name="comment-o" size={isMobile ? 9 : 11} color="#4A7BF7" />
          <Text style={[s.actionTxt, s.thoughtsText, { fontSize: fs.sm, marginLeft: sp.xs }]}>
            Thoughts
          </Text>
          {commentCount > 0 && (
            <View style={[s.countPill, { marginLeft: sp.xs }]}>
              <Text style={[s.countTxt, { fontSize: fs.xs }]}>{commentCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={[s.actionBtn, { paddingVertical: sp.xs, paddingHorizontal: sp.sm }]}
          activeOpacity={0.7}
        >
          <FontAwesome name="share" size={isMobile ? 9 : 11} color="#555" />
          <Text style={[s.actionTxt, { fontSize: fs.sm, marginLeft: sp.xs }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 4,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 4,
    width: '100%',
    // Shadow: cross-platform
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        // @ts-ignore web-only
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      },
    }),
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  // Loading skeleton
  loadingCard: {
    paddingVertical: 16,
    opacity: 0.55,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 8,
  },
  avatarFallback: {
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: {
        // @ts-ignore web-only
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      },
    }),
  },
  avatarTxt: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  headerText: { flex: 1 },
  authorName: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.2,
  },
  authorRole: {
    fontWeight: '400',
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.1,
  },
  timeText: {
    color: '#9ca3af',
    fontFamily: 'Poppins_400Regular',
  },
  dots: {
    color: '#bbb',
    paddingLeft: 6,
    letterSpacing: 2,
  },

  // Body
  body: {
    color: '#222',
    fontFamily: 'Poppins_400Regular',
  },

  // Images
  imgGrid: {
    flexDirection: 'row',
    marginBottom: 6,
    borderRadius: 6,
    overflow: 'hidden',
    gap: 2,
  },
  imgGridItem: {
    flex: 1,
    borderRadius: 8,
  },
  imgFull: {
    // takes full flex width - parent is flex row with single child
  },
  imgStrip: { marginBottom: 6 },
  imgStripContent: { gap: 3, paddingRight: 2 },
  imgStripItem: { borderRadius: 6 },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#eef2ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagTxt: {
    fontSize: 11,
    color: '#4A7BF7',
    fontFamily: 'Poppins_400Regular',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'rgba(74,123,247,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(74,123,247,0.1)',
  },
  actionTxt: {
    color: '#6b7280',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.1,
  },
  actionTxtActive: {
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  thoughtsText: {
    color: '#4A7BF7',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
  },
  countPill: {
    backgroundColor: 'rgba(74,123,247,0.1)',
    borderRadius: 6,
    paddingVertical: 1,
    paddingHorizontal: 6,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,123,247,0.2)',
  },
  countTxt: {
    color: '#4A7BF7',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
  },
});

export default UnifiedThoughtsCard;
