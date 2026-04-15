import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../../config';

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
  onReport?: (post: Post, reasons: string[], additionalComment?: string) => void;
  onProfileClick?: (author: { email: string; name: string; profilePic: string | null }) => void;
  getProfileImageSource?: (profilePic?: string) => { uri: string } | null;
  initials?: (name: string) => string;
  resolvePostAuthor?: (post: Post) => { name: string; pic: string | null; role: string };
  ws?: any;
  authToken?: string;
  BASE_URL?: string;
  router?: any;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or misleading',
  'Harassment or bullying',
  'Violence or harmful behavior',
  'False information',
  'Intellectual property violation',
  'Hate speech',
  'Privacy violation',
  'Other',
];

export const ThoughtsBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={bg.root}>
    <View style={[bg.patternLayer, { pointerEvents: 'none' }]}>
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

const ThoughtsCard: React.FC<ThoughtsCardProps> = ({ post, onLike, onComment, onReport, onProfileClick, getProfileImageSource, initials, resolvePostAuthor, authToken, BASE_URL, router }) => {
  const localRouter = useRouter();
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

  // Store report in AsyncStorage for developer dashboard
  const storeReport = async (reportData: any) => {
    try {
      const existingReports = await AsyncStorage.getItem('gogrowsmart_reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push({
        ...reportData,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'pending_review'
      });
      await AsyncStorage.setItem('gogrowsmart_reports', JSON.stringify(reports));
      console.log('Report stored successfully for developer dashboard');
    } catch (error) {
      console.error('Failed to store report:', error);
    }
  };

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [additionalComment, setAdditionalComment] = useState('');
  const [showReasonsDropdown, setShowReasonsDropdown] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Use provided functions or defaults
  const { name, pic, role } = resolvePostAuthor && post ? resolvePostAuthor(post) : defaultResolvePostAuthor(post);
  const imgSrc = getProfileImageSource ? getProfileImageSource(pic || undefined) : defaultGetProfileImageSource(pic || undefined);
  const images: string[] = post?.postImages?.length ? post.postImages : post?.postImage ? [post.postImage] : [];
  const commentCount = post?.comments?.length ?? 0;

  const handleProfileClick = () => {
    const routerToUse = router || localRouter;
    if (post && post.author) {
      routerToUse.push({ 
        pathname: "/(tabs)/StudentDashBoard/TeacherDetails" as any, 
        params: { 
          name: name, 
          email: post.author.email, 
          profilePic: pic || post.author.profile_pic 
        } 
      });
    } else if (onProfileClick) {
      onProfileClick({ email: post.author.email, name, profilePic: pic });
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleReportPress = () => {
    setSelectedReasons([]);
    setAdditionalComment('');
    setShowReasonsDropdown(false);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (selectedReasons.length === 0) {
      Alert.alert('Error', 'Please select at least one reason');
      return;
    }
    if (post) {
      // Prepare report data
      const reportData = {
        postId: post.id,
        postContent: post.content,
        postAuthor: post.author,
        reportedBy: 'current_user', // This will be replaced with actual user ID from auth context
        reasons: selectedReasons,
        additionalComment: additionalComment,
        reportType: 'post'
      };
      
      // Store for developer dashboard
      await storeReport(reportData);
      
      // Call parent's onReport if provided (for backwards compatibility)
      if (onReport) {
        onReport(post, selectedReasons, additionalComment);
      }
    }
    
    // Close report modal and show success modal
    setShowReportModal(false);
    setSelectedReasons([]);
    setAdditionalComment('');
    setShowReasonsDropdown(false);
    
    // Show success modal
    setShowSuccessModal(true);
    
    // Auto-hide success modal after 2.5 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2500);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReasons([]);
    setAdditionalComment('');
    setShowReasonsDropdown(false);
  };

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
    const getImageSource = (uri: string) => {
      if (uri.startsWith('http') || uri.startsWith('file://')) return { uri };
      const clean = uri.startsWith('/') ? uri.substring(1) : uri;
      return { uri: `${BASE_URL}/${clean}` };
    };
    if (images.length <= 2) {
      return (
        <View style={s.imgGrid}>
          {images.map((uri, i) => <Image key={i} source={getImageSource(uri)} style={[s.imgGridItem, images.length === 1 && s.imgFull]} resizeMode="cover" />)}
        </View>
      );
    }
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imgStrip} contentContainerStyle={s.imgStripContent}>
        {images.map((uri, i) => <Image key={i} source={getImageSource(uri)} style={s.imgStripItem} resizeMode="cover" />)}
      </ScrollView>
    );
  };

  return (
    <View style={s.card}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={handleProfileClick}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {imgSrc
            ? <Image source={imgSrc} style={s.avatar} />
            : <View style={[s.avatar, s.avatarFallback]}><Text style={s.avatarTxt}>{initials ? initials(name) : defaultInitials(name)}</Text></View>}
          <View style={s.headerText}>
            <Text style={s.authorName} numberOfLines={1}>{name}<Text style={s.authorRole}> | {role}</Text></Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReportPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
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
        <TouchableOpacity
          style={s.actionBtn}
          onPress={async () => {
            const shareText = `Check out ${name}'s post on GrowSmart:\n\n"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"\n\nView their profile: http://localhost:8081/StudentDashBoard/TeacherDetails?email=${encodeURIComponent(post.author.email)}`;
            const encodedMsg = encodeURIComponent(shareText);
            if (Platform.OS === 'web') {
              const webUrl = `https://wa.me/?text=${encodedMsg}`;
              window.open(webUrl, '_blank');
            } else {
              const url = `whatsapp://send?text=${encodedMsg}`;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share.');
              }
            }
          }}
        >
          <FontAwesome name="share" size={14} color="#555" />
          <Text style={s.actionTxt}> Share</Text>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="fade" transparent onRequestClose={closeReportModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Report Post</Text>
              <TouchableOpacity onPress={closeReportModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSubtitle}>Select reason(s) for reporting:</Text>

            {/* Dropdown Toggle */}
            <TouchableOpacity 
              style={s.dropdownToggle} 
              onPress={() => setShowReasonsDropdown(!showReasonsDropdown)}
            >
              <Text style={selectedReasons.length > 0 ? s.dropdownToggleTextActive : s.dropdownToggleText}>
                {selectedReasons.length > 0 
                  ? `${selectedReasons.length} reason(s) selected` 
                  : 'Tap to select reasons...'}
              </Text>
              <Ionicons 
                name={showReasonsDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showReasonsDropdown && (
              <View style={s.dropdownContainer}>
                <ScrollView style={s.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        s.reasonOption,
                        selectedReasons.includes(reason) && s.reasonOptionSelected
                      ]}
                      onPress={() => toggleReason(reason)}
                    >
                      <View style={s.checkboxContainer}>
                        <View style={[
                          s.checkbox,
                          selectedReasons.includes(reason) && s.checkboxChecked
                        ]}>
                          {selectedReasons.includes(reason) && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                      </View>
                      <Text style={[
                        s.reasonText,
                        selectedReasons.includes(reason) && s.reasonTextSelected
                      ]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Reasons Display */}
            {selectedReasons.length > 0 && !showReasonsDropdown && (
              <View style={s.selectedReasonsContainer}>
                <Text style={s.selectedReasonsLabel}>Selected:</Text>
                <View style={s.selectedReasonsTags}>
                  {selectedReasons.map((reason) => (
                    <View key={reason} style={s.selectedTag}>
                      <Text style={s.selectedTagText}>{reason}</Text>
                      <TouchableOpacity onPress={() => toggleReason(reason)}>
                        <Ionicons name="close-circle" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Comment */}
            <Text style={s.commentLabel}>Additional comments (optional):</Text>
            <TextInput
              style={s.commentInput}
              placeholder="Add any additional details..."
              placeholderTextColor="#999"
              value={additionalComment}
              onChangeText={setAdditionalComment}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />

            {/* Action Buttons */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeReportModal}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.submitBtn, selectedReasons.length === 0 && s.submitBtnDisabled]} 
                onPress={submitReport}
                disabled={selectedReasons.length === 0}
              >
                <Text style={s.submitBtnText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => setShowSuccessModal(false)}>
        <View style={s.successOverlay}>
          <View style={s.successBox}>
            <View style={s.successIconContainer}>
              <Ionicons name="checkmark-circle" size={70} color="#22C55E" />
            </View>
            <Text style={s.successTitle}>Thank You!</Text>
            <Text style={s.successMessage}>Your report has been submitted successfully.</Text>
            <Text style={s.successSubMessage}>Our team will review it shortly.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 8, marginVertical: 8, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.07)', elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#3B5BFE', textAlign: 'center', marginBottom: 16, fontFamily: 'RedHatDisplay_700Bold' },
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
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 450, minWidth: 300, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', fontFamily: 'RedHatDisplay_700Bold' },
  modalSubtitle: { fontSize: 13, color: '#555', marginBottom: 12, fontFamily: 'RedHatDisplay_500Medium' },
  // Dropdown styles
  dropdownToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#f9f9f9' },
  dropdownToggleText: { fontSize: 14, color: '#999', fontFamily: 'RedHatDisplay_400Regular' },
  dropdownToggleTextActive: { fontSize: 14, color: '#4A7BF7', fontFamily: 'RedHatDisplay_500Medium' },
  dropdownContainer: { marginTop: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 10, backgroundColor: '#fff', maxHeight: 220 },
  dropdownScroll: { paddingVertical: 8 },
  // Reason option styles
  reasonOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  reasonOptionSelected: { backgroundColor: '#f0f5ff' },
  checkboxContainer: { marginRight: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4A7BF7', borderColor: '#4A7BF7' },
  reasonText: { fontSize: 14, color: '#333', fontFamily: 'RedHatDisplay_400Regular', flex: 1 },
  reasonTextSelected: { color: '#4A7BF7', fontFamily: 'RedHatDisplay_500Medium' },
  // Selected reasons display
  selectedReasonsContainer: { marginTop: 12, marginBottom: 8 },
  selectedReasonsLabel: { fontSize: 12, color: '#666', marginBottom: 8, fontFamily: 'RedHatDisplay_500Medium' },
  selectedReasonsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4A7BF7', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  selectedTagText: { fontSize: 12, color: '#fff', fontFamily: 'RedHatDisplay_500Medium' },
  // Comment input styles
  commentLabel: { fontSize: 13, color: '#555', marginTop: 16, marginBottom: 8, fontFamily: 'RedHatDisplay_500Medium' },
  commentInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, fontSize: 13, fontFamily: 'RedHatDisplay_400Regular', color: '#1F2937', backgroundColor: '#f9f9f9' },
  // Action button styles
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  cancelBtnText: { color: '#666', fontFamily: 'RedHatDisplay_500Medium', fontSize: 14 },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#EF4444' },
  submitBtnDisabled: { backgroundColor: '#ccc' },
  submitBtnText: { color: '#fff', fontFamily: 'RedHatDisplay_500Medium', fontSize: 14 },
  // Success modal styles
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  successBox: { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '85%', maxWidth: 320, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  successIconContainer: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, fontFamily: 'RedHatDisplay_700Bold', textAlign: 'center' },
  successMessage: { fontSize: 15, color: '#555', marginBottom: 8, fontFamily: 'RedHatDisplay_500Medium', textAlign: 'center', lineHeight: 22 },
  successSubMessage: { fontSize: 13, color: '#888', fontFamily: 'RedHatDisplay_400Regular', textAlign: 'center' },
});

// ============================================================================
// THOUGHTS FEED COMPONENT - Heavy component that handles entire Thoughts section
// ============================================================================

interface Comment {
  id: string;
  author: { email: string; name: string; role: string; profile_pic: string };
  content: string;
  likes: number;
  createdAt: string;
  isLiked?: boolean;
}

interface ThoughtsFeedProps {
  posts: Post[];
  postsLoading: boolean;
  authToken: string | null;
  BASE_URL: string;
  getProfileImageSource: (profilePic?: string) => { uri: string } | null;
  initials: (name: string) => string;
  resolvePostAuthor: (post: Post) => { name: string; pic: string | null; role: string };
  formatTimeAgo?: (dateString?: string) => string;
  router?: any;
}

export const ThoughtsFeed: React.FC<ThoughtsFeedProps> = ({
  posts,
  postsLoading,
  authToken,
  BASE_URL,
  getProfileImageSource,
  initials,
  resolvePostAuthor,
  formatTimeAgo = (dateString?: string) => dateString || 'Just now',
  router
}) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  const fetchPostComments = async (postId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setPostComments(data.data.map((c: any) => ({ 
          ...c, 
          createdAt: formatTimeAgo(c.createdAt), 
          isLiked: false 
        })));
      }
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ content: commentText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        const newC: Comment = { ...data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]);
        setCommentText('');
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment');
    }
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    // This is handled by parent, just pass through
    console.log('Like post:', postId);
  };

  return (
    <View style={feedStyles.container}>
      {/* Header Title */}
      <Text style={feedStyles.title}>Thoughts</Text>

      {/* Posts ScrollView */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {postsLoading && posts.length === 0 && (
          <ActivityIndicator color="#4A7BF7" style={{ marginTop: 30 }} />
        )}
        
        {!postsLoading && posts.length === 0 && (
          <View style={feedStyles.emptyState}>
            <MaterialCommunityIcons name="post-outline" size={40} color="#ccc" />
            <Text style={feedStyles.emptyText}>No thoughts yet</Text>
          </View>
        )}

        {posts.map((post) => (
          <ThoughtsCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={openCommentsModal}
            onReport={(p, reasons, comment) => { 
              console.log('Report submitted for post:', p.id, 'Reasons:', reasons, 'Comment:', comment); 
            }}
            getProfileImageSource={getProfileImageSource}
            initials={initials}
            resolvePostAuthor={resolvePostAuthor}
            router={router}
          />
        ))}
      </ScrollView>

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <View style={feedStyles.modalOverlay}>
          <View style={feedStyles.modalBox}>
            <View style={feedStyles.modalHeader}>
              <Text style={feedStyles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Comment Input */}
            <View style={feedStyles.commentInputRow}>
              <TextInput
                style={feedStyles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[feedStyles.postBtn, !commentText.trim() && { backgroundColor: '#ccc' }]}
                onPress={addComment}
                disabled={!commentText.trim()}
              >
                <Text style={feedStyles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={{ maxHeight: 300 }}>
              {postComments.length === 0 ? (
                <Text style={feedStyles.noCommentsText}>No comments yet</Text>
              ) : (
                postComments.map((c) => {
                  const ca = resolvePostAuthor({ author: c.author } as Post);
                  const cSrc = getProfileImageSource(ca.pic || undefined);
                  return (
                    <View key={c.id} style={feedStyles.commentItem}>
                      {cSrc ? (
                        <Image source={cSrc} style={feedStyles.commentAvatar} />
                      ) : (
                        <View style={[feedStyles.commentAvatar, feedStyles.avatarPlaceholder]}>
                          <Text style={feedStyles.avatarText}>{initials(ca.name)}</Text>
                        </View>
                      )}
                      <View style={feedStyles.commentContent}>
                        <Text style={feedStyles.commentAuthor}>{ca.name}</Text>
                        <Text style={feedStyles.commentText}>{c.content}</Text>
                        <Text style={feedStyles.commentTime}>{c.createdAt}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const feedStyles = StyleSheet.create({
  container: { flex: 1 },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#3B5BFE', 
    textAlign: 'center', 
    marginBottom: 16, 
    fontFamily: 'RedHatDisplay_700Bold' 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyText: { 
    color: '#aaa', 
    marginTop: 12, 
    fontFamily: 'RedHatDisplay_400Regular' 
  },
  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    width: '90%', 
    maxWidth: 500, 
    maxHeight: '80%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1a1a1a', 
    fontFamily: 'RedHatDisplay_700Bold' 
  },
  // Comment input styles
  commentInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0',
    marginBottom: 12
  },
  commentInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    fontSize: 14, 
    fontFamily: 'RedHatDisplay_400Regular',
    maxHeight: 80,
    marginRight: 10
  },
  postBtn: { 
    backgroundColor: '#4A7BF7', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  postBtnText: { 
    color: '#fff', 
    fontSize: 13, 
    fontFamily: 'RedHatDisplay_500Medium' 
  },
  // Comment list styles
  noCommentsText: { 
    textAlign: 'center', 
    color: '#aaa', 
    paddingVertical: 30, 
    fontFamily: 'RedHatDisplay_400Regular' 
  },
  commentItem: { 
    flexDirection: 'row', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  commentAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18 
  },
  avatarPlaceholder: { 
    backgroundColor: '#4A7BF7', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: '700', 
    fontFamily: 'RedHatDisplay_700Bold' 
  },
  commentContent: { 
    flex: 1, 
    marginLeft: 10 
  },
  commentAuthor: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#222', 
    fontFamily: 'RedHatDisplay_700Bold' 
  },
  commentText: { 
    fontSize: 13, 
    color: '#374151', 
    marginTop: 2, 
    fontFamily: 'RedHatDisplay_400Regular' 
  },
  commentTime: { 
    fontSize: 11, 
    color: '#aaa', 
    marginTop: 3, 
    fontFamily: 'RedHatDisplay_400Regular' 
  },
});

export default ThoughtsCard;