// TeacherThoughtsCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TeacherPostComposer from './TeacherPostComposer';
import UnifiedThoughtsCard, { UnifiedThoughtsBackground, UnifiedPost } from './UnifiedThoughtsCard';

// Colors constant (mirroring from TeacherDashboard)
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

interface TeacherThoughtsCardProps {
  // Data props
  posts: UnifiedPost[];
  postsLoading: boolean;
  userProfileCache: Map<string, { name: string; profilePic: string }>;
  currentUserEmail?: string;
  
  // Helper functions
  getProfileImageSource: (profilePic?: string) => { uri: string } | null;
  initials: (name: string) => string;
  resolvePostAuthor: (post: UnifiedPost) => { name: string; pic: string | null; role: string };
  
  // Actions
  handleCreatePost: (content: string, imageUri?: string | null) => Promise<void>;
  handleDeletePost?: (postId: string) => Promise<void>;
  handleLike?: (postId: string) => Promise<void>;
  setPosts: React.Dispatch<React.SetStateAction<UnifiedPost[]>>;
  onComment: (post: UnifiedPost) => void;
  onProfileClick?: (author: { email: string; name: string; profilePic: string | null }) => void;
  
  // UI control props
  isMobile?: boolean;
  showThoughtsPanel?: boolean;
  isThoughtsCollapsed?: boolean;
  setIsThoughtsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;

  // Tooltip state from parent (to render at root level and avoid clipping)
  showTooltip?: boolean;
  setShowTooltip?: React.Dispatch<React.SetStateAction<boolean>>;
}

// Mobile version - thin vertical line that expands
const MobileThoughtsPanel: React.FC<TeacherThoughtsCardProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    posts,
    postsLoading,
    userProfileCache,
    currentUserEmail,
    getProfileImageSource,
    initials,
    resolvePostAuthor,
    handleCreatePost,
    handleDeletePost,
    handleLike,
    setPosts,
    onComment,
    onProfileClick,
    showTooltip,
    setShowTooltip,
  } = props;

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
              <Text style={mobileStyles.title} selectable={false}>GrowThoughts</Text>
            </View>

            {/* Info icon with tooltip */}
            <View style={panelStyles.headerRightSection}>
              <TouchableOpacity
                style={panelStyles.infoIconContainer}
                onPress={() => {
                  if (setShowTooltip) {
                    setShowTooltip(!showTooltip);
                    if (!showTooltip) {
                      setTimeout(() => setShowTooltip(false), 4000);
                    }
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                style={mobileStyles.close}
                onPress={() => setIsExpanded(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={mobileStyles.composer}>
            <TeacherPostComposer
              onCreatePost={handleCreatePost}
              placeholder="Share your thoughts..."
            />
          </View>

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
                  Be the first to share your thoughts!
                </Text>
              </View>
            )}
            {posts.map((post) => (
              <View key={post.id} style={panelStyles.postWrapper}>
                <UnifiedThoughtsCard
                  post={post}
                  userProfileCache={userProfileCache}
                  currentUserEmail={currentUserEmail}
                  getProfileImageSource={getProfileImageSource}
                  initials={initials}
                  resolvePostAuthor={resolvePostAuthor}
                  isTeacherContext={true}
                  onLike={handleLike || ((id: string) => setPosts((ps: any[]) => ps.map(p =>
                    p.id === id
                      ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                      : p
                  )))}
                  onComment={onComment}
                  onDelete={handleDeletePost}
                  onReport={() => {}}
                  onProfileClick={onProfileClick}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Desktop version - full panel with collapse functionality
const DesktopThoughtsPanel: React.FC<TeacherThoughtsCardProps> = (props) => {
  const {
    posts,
    postsLoading,
    userProfileCache,
    currentUserEmail,
    getProfileImageSource,
    initials,
    resolvePostAuthor,
    handleCreatePost,
    handleDeletePost,
    handleLike,
    setPosts,
    onComment,
    onProfileClick,
    isThoughtsCollapsed = false,
    setIsThoughtsCollapsed = () => {},
    showTooltip,
    setShowTooltip,
  } = props;

  return (
    <View style={[
      desktopStyles.panel,
      isThoughtsCollapsed && desktopStyles.panelCollapsed,
    ]}>
      <View style={desktopStyles.header}>
        <View style={desktopStyles.titleContainer}>
          {!isThoughtsCollapsed && (
            <View style={desktopStyles.titleWithIcon}>
              <Text style={desktopStyles.title} selectable={false}>GrowThoughts</Text>
            </View>
          )}
        </View>
        
        {!isThoughtsCollapsed && (
          <View style={desktopStyles.headerRight}>
            {/* Info icon with tooltip */}
            <TouchableOpacity
              style={panelStyles.infoIconContainer}
              onPress={() => {
                if (setShowTooltip) {
                  setShowTooltip(!showTooltip);
                  if (!showTooltip) {
                    setTimeout(() => setShowTooltip(false), 4000);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={desktopStyles.collapseBtn}
              onPress={() => setIsThoughtsCollapsed((p: boolean) => !p)}
            >
              <Ionicons
                name={isThoughtsCollapsed ? 'chevron-forward' : 'chevron-back'}
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
        
        {isThoughtsCollapsed && (
          <TouchableOpacity
            style={desktopStyles.collapseBtn}
            onPress={() => setIsThoughtsCollapsed((p: boolean) => !p)}
          >
            <Ionicons
              name={isThoughtsCollapsed ? 'chevron-forward' : 'chevron-back'}
              size={16}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {!isThoughtsCollapsed && (
        <>
          <View style={desktopStyles.composerWrapper}>
            <TeacherPostComposer
              onCreatePost={handleCreatePost}
              placeholder="Share your thoughts..."
            />
          </View>

          <UnifiedThoughtsBackground>
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
                    Be the first to share your thoughts!
                  </Text>
                </View>
              )}

              {posts.map((post) => (
                <View key={post.id} style={panelStyles.postWrapper}>
                  <UnifiedThoughtsCard
                    post={post}
                    userProfileCache={userProfileCache}
                    currentUserEmail={currentUserEmail}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                    isTeacherContext={true}
                    onLike={handleLike || ((id: string) =>
                      setPosts((ps) =>
                        ps.map((p) =>
                          p.id === id
                            ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                            : p
                        )
                      )
                    )}
                    onComment={onComment}
                    onDelete={handleDeletePost}
                    onReport={() => {}}
                    onProfileClick={onProfileClick}
                  />
                </View>
              ))}
            </ScrollView>
          </UnifiedThoughtsBackground>
        </>
      )}
    </View>
  );
};

// Main component - chooses between mobile and desktop
const TeacherThoughtsCard: React.FC<TeacherThoughtsCardProps> = (props) => {
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
    paddingHorizontal: 16,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // ✅ FIX: allow tooltip to overflow without being clipped
    overflow: 'visible',
    zIndex: 9999,
  },
  infoIconContainer: {
    position: 'relative',
    padding: 4,
    // ✅ FIX: lift above cards and allow child tooltip to overflow
    zIndex: 9999,
    overflow: 'visible',
  },
  tooltip: {
    position: 'absolute',
    bottom: 32,
    right: -50,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 100,
    zIndex: 99999,
  },
  tooltipPanelLevel: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: Platform.OS === 'web' ? 60 : 50,
    right: Platform.OS === 'web' ? 20 : 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 100,
    zIndex: 99999,
  },
  tooltipDesktop: {
    position: 'absolute',
    bottom: 32,
    right: -50,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 100,
    zIndex: 99999,
  },
  tooltipText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 56,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  tooltipArrowDesktop: {
    position: 'absolute',
    bottom: -6,
    right: 56,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
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
    // ✅ FIX: don't clip tooltip that overflows the header bar
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
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

// Desktop-specific styles - responsive with dynamic width
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
  panelCollapsed: {
    width: 52,
    minWidth: 52,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    // ✅ FIX: don't clip tooltip that overflows the header bar
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // ✅ FIX: allow tooltip to overflow this row container
    overflow: 'visible',
    zIndex: 9999,
  },
  collapseBtn: {
    padding: 6,
    borderRadius: 8,
  },
  composerWrapper: {
    marginBottom: 16,
  },
});

export { UnifiedThoughtsBackground as TeacherThoughtsBackground };
export default TeacherThoughtsCard;