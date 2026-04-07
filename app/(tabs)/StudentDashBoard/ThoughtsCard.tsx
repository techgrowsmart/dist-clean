import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Post {
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

interface ThoughtsCardProps {
  post?: Post;
  onLike?: (postId: string) => void;
  onComment?: (post: Post) => void;
  onReport?: (post: Post) => void;
  getProfileImageSource?: (profilePic?: string) => { uri: string } | null;
  initials?: (name: string) => string;
  resolvePostAuthor?: (post: Post) => { name: string; pic: string | null; role: string };
  ws?: any;
}

export const ThoughtsBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={bg.root}>
    <View style={bg.patternLayer} style={{pointerEvents:"none"}}>
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

const ThoughtsCard: React.FC<ThoughtsCardProps> = ({ post, onLike, onComment, onReport, getProfileImageSource, initials, resolvePostAuthor }) => {
  // Default functions if not provided
  const defaultGetProfileImageSource = (profilePic?: string) => {
    if (profilePic) return { uri: profilePic };
    return null;
  };
  
  const defaultInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const defaultResolvePostAuthor = (post?: Post) => {
    if (!post || !post.author) {
      return {
        name: 'Unknown',
        pic: null,
        role: 'student'
      };
    }
    return {
      name: post.author?.name || 'Unknown',
      pic: post.author?.profile_pic || null,
      role: post.author?.role || 'student'
    };
  };

  const defaultOnLike = (postId: string) => console.log('Like post:', postId);
  const defaultOnComment = (post?: Post) => console.log('Comment on post:', post);
  const defaultOnReport = (post?: Post) => console.log('Report post:', post);

  // Use provided functions or defaults
  const { name, pic, role } = resolvePostAuthor && post ? resolvePostAuthor(post) : defaultResolvePostAuthor(post);
  const imgSrc = getProfileImageSource ? getProfileImageSource(pic || undefined) : defaultGetProfileImageSource(pic || undefined);
  const images: string[] = post?.postImages?.length ? post.postImages : post?.postImage ? [post.postImage] : [];
  const commentCount = post?.comments?.length ?? 0;

  // If no post provided, show a placeholder
  if (!post) {
    return (
      <View style={s.card}>
        <Text style={s.body}>No post data available</Text>
      </View>
    );
  }

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
    <View style={s.card}>
      <View style={s.header}>
        {imgSrc
          ? <Image source={imgSrc} style={s.avatar} />
          : <View style={[s.avatar, s.avatarFallback]}><Text style={s.avatarTxt}>{initials ? initials(name) : defaultInitials(name)}</Text></View>}
        <View style={s.headerText}>
          <Text style={s.authorName} numberOfLines={1}>{name}<Text style={s.authorRole}> | {role}</Text></Text>
          <Text style={s.timeText}>{post.createdAt}</Text>
        </View>
        <TouchableOpacity onPress={() => onReport ? onReport(post) : defaultOnReport(post)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.dots}>•••</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.body}>{post.content}</Text>
      {renderImages()}

      {post.tags && post.tags.length > 0 && (
        <View style={s.tagsRow}>
          {post.tags.map((tag, i) => <View key={i} style={s.tag}><Text style={s.tagTxt}>#{tag}</Text></View>)}
        </View>
      )}

      <View style={s.footer}>
        <TouchableOpacity style={s.actionBtn} onPress={() => onLike ? onLike(post.id) : defaultOnLike(post.id)}>
          <FontAwesome name={post.isLiked ? 'thumbs-up' : 'thumbs-o-up'} size={14} color="#4A7BF7" />
          <Text style={[s.actionTxt, post.isLiked && s.actionTxtActive]}> Like</Text>
          {post.likes > 0 && <View style={s.countPill}><Text style={s.countTxt}>{post.likes}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => onComment ? onComment(post) : defaultOnComment(post)}>
          <FontAwesome name="comment-o" size={14} color="#4A7BF7" />
          <Text style={[s.actionTxt, s.thoughtsText]}> Thoughts</Text>
          {commentCount > 0 && <View style={s.countPill}><Text style={s.countTxt}>{commentCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <FontAwesome name="share" size={14} color="#555" />
          <Text style={s.actionTxt}> Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 8, marginVertical: 8, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.07)', elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  avatarFallback: { backgroundColor: '#4A7BF7', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 16, fontFamily: 'RedHatDisplay_700Bold' },
  headerText: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', fontFamily: 'RedHatDisplay_700Bold' },
  authorRole: { fontSize: 13, fontWeight: '400', color: '#888', fontFamily: 'RedHatDisplay_400Regular' },
  timeText: { fontSize: 12, color: '#aaa', marginTop: 2, fontFamily: 'RedHatDisplay_400Regular' },
  dots: { color: '#bbb', fontSize: 18, paddingLeft: 8, letterSpacing: 2 },
  body: { fontSize: 15, color: '#222', lineHeight: 22, marginBottom: 14, fontFamily: 'RedHatDisplay_400Regular' },
  imgGrid: { flexDirection: 'row', gap: 6, marginBottom: 14, borderRadius: 10, overflow: 'hidden' },
  imgGridItem: { flex: 1, height: 200, borderRadius: 10 },
  imgFull: { height: 240 },
  imgStrip: { marginBottom: 14 },
  imgStripContent: { gap: 6, paddingRight: 4 },
  imgStripItem: { width: 100, height: 120, borderRadius: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 4 },
  tag: { backgroundColor: '#eef2ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt: { fontSize: 11, color: '#4A7BF7', fontFamily: 'RedHatDisplay_400Regular' },
  footer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingVertical: 12, gap: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  actionTxt: { fontSize: 13, color: '#444', fontFamily: 'RedHatDisplay_500Medium' },
  actionTxtActive: { color: '#4A7BF7' },
  thoughtsText: { color: '#4A7BF7', fontWeight: '600', fontFamily: 'RedHatDisplay_600SemiBold' },
  countPill: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  countTxt: { fontSize: 12, color: '#555', fontWeight: '600', fontFamily: 'RedHatDisplay_500Medium' },
});

export default ThoughtsCard;