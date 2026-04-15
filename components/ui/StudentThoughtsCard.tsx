import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ThoughtsCard, { ThoughtsFeed, ThoughtsBackground } from '../../app/(tabs)/StudentDashBoard/ThoughtsCard';
import { BASE_URL } from '../../config';

// Colors constant (mirroring from Student dashboard)
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  textPrimary: '#1a1a1a',
  white: '#FFFFFF',
  bannerTint: '#EEF2FF',
};

interface StudentThoughtsCardProps {
  // Data props
  posts: any[];
  postsLoading: boolean;
  userProfileCache: Map<string, { name: string; profilePic: string }>;
  currentUserEmail?: string;
  
  // Helper functions
  getProfileImageSource: (profilePic?: string) => { uri: string } | null;
  initials: (name: string) => string;
  resolvePostAuthor: (post: any) => { name: string; pic: string | null; role: string };
  
  // Actions
  handleLike?: (postId: string) => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<any[]>>;
  onComment: (post: any) => void;
  onProfileClick?: (author: { email: string; name: string; profilePic: string | null }) => void;
  
  // UI control props
  isMobile?: boolean;
  showThoughtsPanel?: boolean;
  
  // Additional props for ThoughtsFeed
  authToken: string | null;
  BASE_URL: string;
  formatTimeAgo?: (dateString?: string) => string;
  router?: any;
}

// Mobile version - thin vertical line that expands
const MobileThoughtsPanel: React.FC<StudentThoughtsCardProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const {
    posts,
    postsLoading,
    userProfileCache,
    currentUserEmail,
    getProfileImageSource,
    initials,
    resolvePostAuthor,
    handleLike,
    setPosts,
    onComment,
    onProfileClick,
    authToken,
    BASE_URL,
    formatTimeAgo,
    router,
  } = props;

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
          createdAt: formatTimeAgo ? formatTimeAgo(c.createdAt) : c.createdAt, 
          isLiked: false 
        })));
      }
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: any) => {
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
        const newC = { ...data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]);
        setCommentText('');
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment');
    }
  };

  const handleLikeLocal = (postId: string) => {
    if (handleLike) {
      handleLike(postId);
    } else {
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  };

  return (
    <View style={mobileStyles.container}>
      {/* Thin vertical line when collapsed */}
      {!isExpanded && (
        <TouchableOpacity
          style={mobileStyles.line}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.7}
        >
          <View style={mobileStyles.lineInner} />
          <Ionicons name="chatbubble" size={14} color="#3B5BFE" style={{ marginTop: 8 }} />
        </TouchableOpacity>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <View style={mobileStyles.expanded}>
          <View style={mobileStyles.header}>
            <View style={mobileStyles.headerLeft}>
              <Text style={mobileStyles.title} selectable={false}>Thoughts</Text>
            </View>

            <View style={panelStyles.headerRightSection}>
              <TouchableOpacity
                style={mobileStyles.close}
                onPress={() => setIsExpanded(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ThoughtsBackground>
            <ScrollView style={mobileStyles.scroll} showsVerticalScrollIndicator={false}>
              {postsLoading && posts.length === 0 && (
                <View style={panelStyles.loadingContainer}>
                  <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                  <Text style={panelStyles.loadingText} selectable={false}>
                    Loading thoughts...
                  </Text>
                </View>
              )}
              {!postsLoading && posts.length === 0 && (
                <View style={panelStyles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={40} color={COLORS.textSecondary} />
                  <Text style={panelStyles.emptyStateTitle} selectable={false}>No thoughts yet</Text>
                  <Text style={panelStyles.emptyStateText} selectable={false}>
                    Check back later for updates!
                  </Text>
                </View>
              )}
              {posts.map((post) => (
                <View key={post.id} style={panelStyles.postWrapper}>
                  <ThoughtsCard
                    post={post}
                    onLike={handleLikeLocal}
                    onComment={openCommentsModal}
                    onReport={() => {}}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                    authToken={authToken}
                    BASE_URL={BASE_URL}
                    router={router}
                  />
                </View>
              ))}
            </ScrollView>
          </ThoughtsBackground>

          {/* Comments Modal */}
          <Modal
            visible={showCommentsModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowCommentsModal(false)}
          >
            <View style={modalStyles.modalOverlay}>
              <View style={modalStyles.modalBox}>
                <View style={modalStyles.modalHeader}>
                  <Text style={modalStyles.modalTitle}>Comments</Text>
                  <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Comment Input */}
                <View style={modalStyles.commentInputRow}>
                  <TextInput
                    style={modalStyles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#999"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={200}
                  />
                  <TouchableOpacity
                    style={[modalStyles.postBtn, !commentText.trim() && { backgroundColor: '#ccc' }]}
                    onPress={addComment}
                    disabled={!commentText.trim()}
                  >
                    <Text style={modalStyles.postBtnText}>Post</Text>
                  </TouchableOpacity>
                </View>

                {/* Comments List */}
                <ScrollView style={{ maxHeight: 300 }}>
                  {postComments.length === 0 ? (
                    <Text style={modalStyles.noCommentsText}>No comments yet</Text>
                  ) : (
                    postComments.map((c) => {
                      const ca = resolvePostAuthor({ author: c.author });
                      const cSrc = getProfileImageSource(ca.pic || undefined);
                      return (
                        <View key={c.id} style={modalStyles.commentItem}>
                          {cSrc ? (
                            <Image source={cSrc} style={modalStyles.commentAvatar} />
                          ) : (
                            <View style={[modalStyles.commentAvatar, modalStyles.avatarPlaceholder]}>
                              <Text style={modalStyles.avatarText}>{initials(ca.name)}</Text>
                            </View>
                          )}
                          <View style={modalStyles.commentContent}>
                            <Text style={modalStyles.commentAuthor}>{ca.name}</Text>
                            <Text style={modalStyles.commentText}>{c.content}</Text>
                            <Text style={modalStyles.commentTime}>{c.createdAt}</Text>
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
      )}
    </View>
  );
};

// Desktop version - full panel
const DesktopThoughtsPanel: React.FC<StudentThoughtsCardProps> = (props) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const {
    posts,
    postsLoading,
    userProfileCache,
    currentUserEmail,
    getProfileImageSource,
    initials,
    resolvePostAuthor,
    handleLike,
    setPosts,
    onComment,
    onProfileClick,
    authToken,
    BASE_URL,
    formatTimeAgo,
    router,
  } = props;

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
          createdAt: formatTimeAgo ? formatTimeAgo(c.createdAt) : c.createdAt, 
          isLiked: false 
        })));
      }
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: any) => {
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
        const newC = { ...data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]);
        setCommentText('');
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment');
    }
  };

  const handleLikeLocal = (postId: string) => {
    if (handleLike) {
      handleLike(postId);
    } else {
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  };

  return (
    <View style={desktopStyles.panel}>
      <View style={desktopStyles.header}>
        <View style={desktopStyles.titleContainer}>
          <View style={desktopStyles.titleWithIcon}>
            <Text style={desktopStyles.title} selectable={false}>Thoughts</Text>
          </View>
        </View>
      </View>

      <ThoughtsBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={panelStyles.list}
          style={panelStyles.scrollView}
        >
          {postsLoading && posts.length === 0 && (
            <View style={panelStyles.loadingContainer}>
              <ActivityIndicator color={COLORS.primaryBlue} size="large" />
              <Text style={panelStyles.loadingText} selectable={false}>
                Loading thoughts...
              </Text>
            </View>
          )}

          {!postsLoading && posts.length === 0 && (
            <View style={panelStyles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={COLORS.textSecondary} />
              <Text style={panelStyles.emptyStateTitle} selectable={false}>No thoughts yet</Text>
              <Text style={panelStyles.emptyStateText} selectable={false}>
                Check back later for updates!
              </Text>
            </View>
          )}

          {posts.map((post) => (
            <View key={post.id} style={panelStyles.postWrapper}>
              <ThoughtsCard
                post={post}
                onLike={handleLikeLocal}
                onComment={openCommentsModal}
                onReport={() => {}}
                getProfileImageSource={getProfileImageSource}
                initials={initials}
                resolvePostAuthor={resolvePostAuthor}
                authToken={authToken}
                BASE_URL={BASE_URL}
                router={router}
              />
            </View>
          ))}
        </ScrollView>
      </ThoughtsBackground>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalBox}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Comment Input */}
            <View style={modalStyles.commentInputRow}>
              <TextInput
                style={modalStyles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[modalStyles.postBtn, !commentText.trim() && { backgroundColor: '#ccc' }]}
                onPress={addComment}
                disabled={!commentText.trim()}
              >
                <Text style={modalStyles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={{ maxHeight: 300 }}>
              {postComments.length === 0 ? (
                <Text style={modalStyles.noCommentsText}>No comments yet</Text>
              ) : (
                postComments.map((c) => {
                  const ca = resolvePostAuthor({ author: c.author });
                  const cSrc = getProfileImageSource(ca.pic || undefined);
                  return (
                    <View key={c.id} style={modalStyles.commentItem}>
                      {cSrc ? (
                        <Image source={cSrc} style={modalStyles.commentAvatar} />
                      ) : (
                        <View style={[modalStyles.commentAvatar, modalStyles.avatarPlaceholder]}>
                          <Text style={modalStyles.avatarText}>{initials(ca.name)}</Text>
                        </View>
                      )}
                      <View style={modalStyles.commentContent}>
                        <Text style={modalStyles.commentAuthor}>{ca.name}</Text>
                        <Text style={modalStyles.commentText}>{c.content}</Text>
                        <Text style={modalStyles.commentTime}>{c.createdAt}</Text>
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

// Main component - chooses between mobile and desktop
const StudentThoughtsCard: React.FC<StudentThoughtsCardProps> = (props) => {
  const { isMobile, showThoughtsPanel } = props;

  // Mobile: show the mobile panel (vertical line that expands) on all platforms
  if (isMobile) {
    return <MobileThoughtsPanel {...props} />;
  }

  // Desktop: show the full panel only if showThoughtsPanel is true
  if (showThoughtsPanel) {
    return <DesktopThoughtsPanel {...props} />;
  }

  return null;
};

// Shared styles for both mobile and desktop
const panelStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  list: {
    paddingBottom: 24,
    gap: 8,
  },
  postWrapper: {
    marginBottom: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textDark,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'visible',
    zIndex: 9999,
  },
});

// Mobile-specific styles
const mobileStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  line: {
    width: 52,
    height: '100%',
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    alignItems: 'center',
    paddingTop: 24,
  },
  lineInner: {
    width: 4,
    height: 60,
    backgroundColor: '#3B5BFE',
    borderRadius: 2,
  },
  expanded: {
    width: 320,
    height: '100%',
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    flexDirection: 'column',
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'visible',
    zIndex: 9999,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },
  close: {
    padding: 6,
    borderRadius: 8,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

// Desktop-specific styles
const desktopStyles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 280,
    maxWidth: 400,
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 20,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'visible',
    zIndex: 9999,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },
});

// Modal styles
const modalStyles = StyleSheet.create({
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
    fontFamily: 'Poppins_600SemiBold'
  },
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
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_500Medium'
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#aaa',
    paddingVertical: 30,
    fontFamily: 'Poppins_400Regular'
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
    fontFamily: 'Poppins_600SemiBold'
  },
  commentContent: {
    flex: 1,
    marginLeft: 10
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    fontFamily: 'Poppins_600SemiBold'
  },
  commentText: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
    fontFamily: 'Poppins_400Regular'
  },
  commentTime: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 3,
    fontFamily: 'Poppins_400Regular'
  },
});

export { ThoughtsBackground as StudentThoughtsBackground };
export default StudentThoughtsCard;
