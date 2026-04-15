import { FontAwesome, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Animated,
} from 'react-native';
import { BASE_URL } from '../../config';
import { getImageSource } from '../../utils/imageHelper';

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

interface UnifiedThoughtsCardProps {
  post?: UnifiedPost;
  onLike?: (postId: string) => void;
  onComment?: (post: UnifiedPost) => void;
  onReport?: (post: UnifiedPost, reasons: string[], additionalComment?: string) => void;
  onDelete?: (postId: string) => void;
  onProfileClick?: (author: { email: string; name: string; profilePic: string | null }) => void;
  getProfileImageSource?: (profilePic?: string) => { uri: string } | null;
  initials?: (name: string) => string;
  resolvePostAuthor?: (post: UnifiedPost) => { name: string; pic: string | null; role: string };
  ws?: any;
  userProfileCache?: Map<string, { name: string; profilePic: string }>;
  isTeacherContext?: boolean; // To differentiate between teacher and student contexts
  currentUserEmail?: string; // To check if post belongs to current user
}

interface UnifiedThoughtsBackgroundProps {
  children: React.ReactNode;
}

export const UnifiedThoughtsBackground: React.FC<UnifiedThoughtsBackgroundProps> = ({ children }) => (
  <View style={bg.root}>
    {Platform.OS !== 'web' && (
      <View style={[bg.patternLayer, { pointerEvents: 'none' }]}>
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
  onDelete,
  onProfileClick,
  getProfileImageSource,
  initials,
  resolvePostAuthor,
  ws,
  userProfileCache,
  isTeacherContext = false,
  currentUserEmail,
}) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [additionalComment, setAdditionalComment] = useState('');
  const [showReasonsDropdown, setShowReasonsDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [menuAnim] = useState(new Animated.Value(0));
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Auto-hide report success modal after 4.5 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        closeSuccessModal();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

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

  const formatDateTime = (dateString: string): string => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return 'Just now';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) return 'Just now';
      
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      // Show relative time for recent posts
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      // Show date for older posts
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Show full date for posts older than a week
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return 'Just now';
    }
  };

  const defaultResolvePostAuthor = (p?: UnifiedPost) => {
    if (!p) return { name: isTeacherContext ? 'Unknown Teacher' : 'Unknown User', pic: null, role: isTeacherContext ? 'teacher' : 'student' };

    const cached = userProfileCache?.get(p.author?.email) ?? { name: '', profilePic: '' };
    
    // Priority: cached name > post author name > email fallback
    let name: string = cached.name || p.author?.name || '';
    let pic: string | null = cached.profilePic || p.author?.profile_pic || null;
    const role = p.author?.role || (isTeacherContext ? 'teacher' : 'student');

    // Handle email fallback for name when name is empty/invalid
    if (!name || name === 'null' || name === 'undefined' || name.trim() === '' || name.includes('@')) {
      name = p.author?.email?.split('@')[0] || (isTeacherContext ? 'Unknown Teacher' : 'Unknown User');
      name = name
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }

    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (!pic || pic === '' || pic === 'null' || pic === 'undefined') pic = null;

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
  const createdAt    = formatDateTime(post?.createdAt ?? '');
  const postId       = post?.id ?? '';
  const postAuthorEmail = post?.author?.email ?? '';

  // Check if post is owned by current user
  const isOwnPost = currentUserEmail && postAuthorEmail && currentUserEmail.toLowerCase() === postAuthorEmail.toLowerCase();

  // Check if post is within 24 hours for deletion eligibility
  const canDelete = (() => {
    if (!post?.createdAt || !isOwnPost) return false;
    const postDate = new Date(post.createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  })();

  // Debug logging
  console.log('📝 UnifiedThoughtsCard Debug:');
  console.log('  - postId:', postId);
  console.log('  - currentUserEmail:', currentUserEmail);
  console.log('  - postAuthorEmail:', postAuthorEmail);
  console.log('  - isOwnPost:', isOwnPost);
  console.log('  - canDelete:', canDelete);
  console.log('  - onDelete prop exists:', !!onDelete);

  const openDeleteMenu = () => {
    console.log('📋 openDeleteMenu called');
    setShowDeleteMenu(true);
    Animated.timing(menuAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeDeleteMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setShowDeleteMenu(false));
  };

  const handleDelete = () => {
    console.log('🗑️ handleDelete called in UnifiedThoughtsCard');
    console.log('  - canDelete:', canDelete);
    console.log('  - onDelete exists:', !!onDelete);
    closeDeleteMenu();
    if (onDelete && canDelete) {
      console.log('✅ Showing delete confirmation modal');
      setShowDeleteConfirmModal(true);
    } else {
      console.log('❌ Delete blocked - canDelete:', canDelete, 'onDelete exists:', !!onDelete);
    }
  };

  const confirmDelete = () => {
    console.log('✅ User confirmed delete');
    setShowDeleteConfirmModal(false);
    if (onDelete) {
      console.log('✅ Calling onDelete with postId:', postId);
      onDelete(postId);
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
      Alert.alert('Please select a reason', 'You must select at least one reason for reporting this post.');
      return;
    }

    if (onReport && post) {
      await onReport(post, selectedReasons, additionalComment);
      setShowReportModal(false);
      setShowSuccessModal(true);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedReasons([]);
    setAdditionalComment('');
  };

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

  // ── Image grid (simplified flex-based like student's ThoughtsCard) ───────────────────────────────────────
  const renderImages = () => {
    if (!images.length) return null;

    const getImageSource = (uri: string) => {
      if (uri.startsWith('http') || uri.startsWith('file://')) return { uri };
      const clean = uri.startsWith('/') ? uri.substring(1) : uri;
      return { uri: `${BASE_URL}/${clean}` };
    };

    // 1-2 images: Use flex-based grid that stays within container bounds
    if (images.length <= 2) {
      return (
        <View style={s.imgGrid}>
          {images.map((uri, i) => (
            <Image 
              key={i} 
              source={getImageSource(uri)} 
              style={[s.imgGridItem, images.length === 1 && s.imgFull]} 
              resizeMode="cover" 
            />
          ))}
        </View>
      );
    }

    // 3-4 images: Horizontal scrollable strip
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.imgStrip} contentContainerStyle={s.imgStripContent}>
        {images.map((uri, i) => (
          <Image key={i} source={getImageSource(uri)} style={s.imgStripItem} resizeMode="cover" />
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
        <TouchableOpacity
          onPress={() => onProfileClick && onProfileClick({ email: postAuthorEmail, name, profilePic: pic })}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
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
        </TouchableOpacity>


        <HoverTouchable
          onPress={() => openDeleteMenu()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 'auto' }}
        >
          <Ionicons name="ellipsis-vertical" size={isMobile ? 18 : 20} color="#666" />
        </HoverTouchable>
      </View>

      {/* Delete Menu Modal */}
      <Modal
        visible={showDeleteMenu}
        transparent={true}
        animationType="none"
        onRequestClose={closeDeleteMenu}
      >
        <TouchableOpacity style={s.menuOverlay} onPress={closeDeleteMenu} activeOpacity={1}>
          <Animated.View 
            style={[
              s.deleteMenu,
              {
                opacity: menuAnim,
                transform: [{
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }]
              }
            ]}
          >
            {isOwnPost ? (
              <TouchableOpacity 
                style={[s.deleteMenuItem, !canDelete && s.deleteMenuItemDisabled]} 
                onPress={handleDelete}
                disabled={!canDelete}
              >
                <Ionicons name="trash-outline" size={18} color={canDelete ? "#EF4444" : "#9CA3AF"} />
                <View style={s.deleteMenuTextContainer}>
                  <Text style={[s.deleteMenuText, !canDelete && s.deleteMenuTextDisabled]}>
                    Delete Post
                  </Text>
                  {!canDelete && (
                    <Text style={s.deleteMenuSubtext}>Only deletable within 24 hours</Text>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={s.deleteMenuItem}>
                <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                <View style={s.deleteMenuTextContainer}>
                  <Text style={[s.deleteMenuText, s.deleteMenuTextDisabled]}>
                    Delete Post
                  </Text>
                  <Text style={s.deleteMenuSubtext}>You aren't allowed to delete someone else's post</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={s.confirmModalOverlay}>
          <View style={s.confirmModalContainer}>
            <View style={s.confirmModalHeader}>
              <Text style={s.confirmModalTitle}>Delete Post</Text>
              <TouchableOpacity onPress={() => setShowDeleteConfirmModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={s.confirmModalBody}>
              <Text style={s.confirmModalText}>
                Are you sure you want to delete this post? This action cannot be undone.
              </Text>
            </View>
            <View style={s.confirmModalFooter}>
              <TouchableOpacity
                style={s.confirmModalCancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={s.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmModalDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={s.confirmModalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={s.confirmModalOverlay}>
          <View style={s.reportModalContainer}>
            <View style={s.confirmModalHeader}>
              <Text style={s.confirmModalTitle}>Report Post</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.reportModalBody}>
              <Text style={s.reportModalText}>
                Please select the reason(s) for reporting this post:
              </Text>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    s.reportReasonItem,
                    selectedReasons.includes(reason) && s.reportReasonItemSelected,
                  ]}
                  onPress={() => toggleReason(reason)}
                >
                  <View style={s.reportReasonCheckbox}>
                    {selectedReasons.includes(reason) && (
                      <Ionicons name="checkmark" size={16} color="#3B5BFE" />
                    )}
                  </View>
                  <Text style={[
                    s.reportReasonText,
                    selectedReasons.includes(reason) && s.reportReasonTextSelected,
                  ]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={s.reportModalLabel}>Additional comments (optional):</Text>
              <TextInput
                style={s.reportModalInput}
                placeholder="Add any additional details..."
                placeholderTextColor="#9CA3AF"
                value={additionalComment}
                onChangeText={setAdditionalComment}
                multiline
                maxLength={500}
              />
            </ScrollView>
            <View style={s.confirmModalFooter}>
              <TouchableOpacity
                style={s.confirmModalCancelButton}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={s.confirmModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmModalDeleteButton}
                onPress={submitReport}
              >
                <Text style={s.confirmModalDeleteText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={s.confirmModalOverlay}>
          <View style={s.successModalContainer}>
            <View style={s.successModalContent}>
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
              <Text style={s.successModalTitle}>Report Submitted</Text>
              <Text style={s.successModalText}>
                Thank you for your report. We will review this content and take appropriate action.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Body */}
      {content ? (
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
      ) : null}

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

        {/* Report */}
        <TouchableOpacity
          style={s.actionBtn}
          onPress={handleReportPress}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={isMobile ? 16 : 18} color="#6B7280" />
          <Text style={[s.actionTxt, { fontSize: fs.sm, marginLeft: sp.xs }]}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 6,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 8,
    width: '100%',
    // Shadow: cross-platform
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        // @ts-ignore web-only
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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
    marginBottom: 8,
  },
  avatar: {
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: '#3B5BFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      web: {
        // @ts-ignore web-only
        boxShadow: '0 2px 8px rgba(59,91,254,0.2)',
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
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.3,
  },
  authorRole: {
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  timeText: {
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  dots: {
    color: '#bbb',
    paddingLeft: 6,
    letterSpacing: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  deleteMenu: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  deleteMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  deleteMenuItemDisabled: {
    opacity: 0.5,
  },
  deleteMenuTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  deleteMenuText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  deleteMenuTextDisabled: {
    color: '#9CA3AF',
  },
  deleteMenuSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins_600SemiBold',
  },
  confirmModalBody: {
    marginBottom: 20,
  },
  confirmModalText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  confirmModalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  confirmModalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    fontFamily: 'Poppins_500Medium',
  },
  confirmModalDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmModalDeleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  reportModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
  },
  reportModalBody: {
    marginBottom: 20,
    maxHeight: 400,
  },
  reportModalText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 16,
  },
  reportReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportReasonItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B5BFE',
  },
  reportReasonCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  reportReasonText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  reportReasonTextSelected: {
    color: '#1E40AF',
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  reportModalLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  reportModalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxWidth: 320,
    padding: 32,
    alignItems: 'center',
  },
  successModalContent: {
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  successModalText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successModalButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  successModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },

  // Body
  body: {
    color: '#1F2937',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    fontSize: 14,
  },

  // Images
  imgGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imgGridItem: {
    flex: 1,
    height: 200,
    borderRadius: 10,
  },
  imgFull: {
    height: 240,
  },
  imgStrip: { marginBottom: 14 },
  imgStripContent: { gap: 6, paddingRight: 4 },
  imgStripItem: { width: 100, height: 120, borderRadius: 10 },

  // Simplified responsive image container styles
  xImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  xImageSingle: {
    borderRadius: 12,
    width: '100%',
    height: Platform.OS === 'web' ? 'clamp(200px, 40vw, 400px)' : 300,
    maxHeight: 400,
  },
  xImageRow: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  xImageDual: {
    borderRadius: 12,
    flex: 1,
  },
  xImageLeftLarge: {
    borderRadius: 12,
    flex: 1.5,
  },
  xImageRightSmall: {
    borderRadius: 12,
    flex: 1,
  },
  xImageGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: '100%',
  },
  xImageGridItem: {
    borderRadius: 12,
    width: '48%',
    aspectRatio: 1,
  },
  xImageCol: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  xImageOverlayContainer: {
    position: 'relative',
  },
  xImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  xImageOverlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },

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
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 3,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  actionTxt: {
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: -0.1,
    fontSize: 13,
  },
  actionTxtActive: {
    color: '#3B5BFE',
    fontFamily: 'Poppins_600SemiBold',
  },
  thoughtsText: {
    color: '#3B5BFE',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
  },
  countPill: {
    backgroundColor: 'rgba(59,91,254,0.08)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  countTxt: {
    color: '#3B5BFE',
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
    fontSize: 11,
  },
});

export default UnifiedThoughtsCard;
