import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import TeacherWebHeader from './TeacherWebHeader';
import TeacherWebSidebar from './TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from './TeacherThoughtsCard';
import TeacherPostComposer from './TeacherPostComposer';

const { width, height } = Dimensions.get('window');

interface TeacherWebLayoutProps {
  children: React.ReactNode;
  teacherName?: string;
  profileImage?: string | null;
  userEmail?: string | null;
  activeSidebarItem?: string;
  onSidebarItemPress?: (item: string) => void;
  onCreatePost?: (content: string) => Promise<void>;
  showComposer?: boolean;
}

const TeacherWebLayout: React.FC<TeacherWebLayoutProps> = ({
  children,
  teacherName,
  profileImage,
  userEmail,
  activeSidebarItem = 'Dashboard',
  onSidebarItemPress,
  onCreatePost
  , showComposer
}) => {
  // Only show on web platform
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TeacherWebHeader
        teacherName={teacherName}
        profileImage={profileImage}
      />

      <View style={styles.mainContent}>
        {/* Sidebar */}
        <TeacherWebSidebar
          activeItem={activeSidebarItem}
          onItemPress={onSidebarItemPress}
          userEmail={userEmail || ''}
          teacherName={teacherName || 'Teacher'}
          profileImage={profileImage}
        />

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          <TeacherThoughtsBackground>
            {showComposer && onCreatePost && (
              <TeacherPostComposer
                onCreatePost={onCreatePost}
                placeholder="Post your Grow Thoughts..."
              />
            )}
            {children}
          </TeacherThoughtsBackground>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    minHeight: height,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 56, // Header height
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    minWidth: 0, // Prevent flex child from overflowing
  },
});

export default TeacherWebLayout;
