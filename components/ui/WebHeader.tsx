import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Platform, Modal, Animated } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthData } from '../../utils/authStorage';
import { BASE_URL } from '../../config';

const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
};

type WebHeaderProps = {
  studentName?: string;
  profileImage?: string | null;
  onNotificationPress?: () => void;
  unreadCount?: number;
  showSidebarToggle?: boolean;
  isSidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
};

const WebHeader = ({ 
  studentName: initialStudentName,
  profileImage: initialProfileImage,
  onNotificationPress, 
  unreadCount: initialUnreadCount = 0,
  showSidebarToggle = false,
  isSidebarCollapsed = false,
  onSidebarToggle
}: WebHeaderProps) => {
  const router = useRouter();
  const [studentName, setStudentName] = useState(initialStudentName || 'Student');
  const [profileImage, setProfileImage] = useState<string | null>(initialProfileImage || null);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [menuAnim] = useState(new Animated.Value(0));
  const [imageAnim] = useState(new Animated.Value(0));

  const openProfileMenu = () => {
    setShowProfileMenu(true);
    Animated.timing(menuAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeProfileMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setShowProfileMenu(false));
  };

  const openImagePreview = () => {
    closeProfileMenu();
    setTimeout(() => {
      setShowImagePreview(true);
      Animated.spring(imageAnim, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        friction: 8,
        tension: 40,
      }).start();
    }, 200);
  };

  const closeImagePreview = () => {
    Animated.timing(imageAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => setShowImagePreview(false));
  };

  // Fetch profile data if not provided
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.email) return;

        const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
        const res = await fetch(`${BASE_URL}/api/userProfile`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: auth.email }),
        });

        if (res.ok) {
          const data = await res.json();
          setStudentName(data.name || "Student");
          setProfileImage(data.profileimage || null);
          await AsyncStorage.multiSet([
            ["studentName", data.name || ""],
            ["profileImage", data.profileimage || ""]
          ]);
        }
      } catch (error) {
        // Use cached data as fallback
        const cachedName = await AsyncStorage.getItem("studentName") || "Student";
        const cachedImage = await AsyncStorage.getItem("profileImage") || null;
        setStudentName(cachedName);
        setProfileImage(cachedImage);
      }
    };

    fetchProfile();
  }, []);

  // Handle search change
  const handleSearchChange = (text: string) => {
    // Search functionality can be added here if needed
  };

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;

      const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleProfileAction = (action: string) => {
    closeProfileMenu();
    switch (action) {
      case 'profile':
        router.push('/(tabs)/StudentDashBoard/Profile' as any);
        break;
    }
  };
  return (
    <View style={styles.globalHeader}>
      {/* Sidebar toggle button */}
      {showSidebarToggle && onSidebarToggle && (
        <TouchableOpacity 
          style={styles.sidebarToggle} 
          onPress={onSidebarToggle}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isSidebarCollapsed ? "chevron-forward" : "chevron-back"} 
            size={20} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
      )}
      <View style={styles.logoWrapper}>
        <Text style={styles.logoText}>Growsmart</Text>
      </View>
      <View style={styles.headerSearchWrapper}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={14} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Type in search"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>
      <View style={styles.profileHeaderSection}>
        <TouchableOpacity 
          style={styles.bellIcon} 
          onPress={onNotificationPress}
        >
          <FontAwesome name="bell-o" size={20} color="#444" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileButton} onPress={openProfileMenu} activeOpacity={0.8}>
          <Text style={styles.headerUserName} numberOfLines={1}>{studentName}</Text>
          <View style={styles.headerAvatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <Ionicons name="person-circle" size={32} color={COLORS.primary} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Preview Modal - Instagram Style */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="none"
        onRequestClose={closeImagePreview}
      >
        <TouchableOpacity 
          style={styles.imagePreviewOverlay} 
          onPress={closeImagePreview}
          activeOpacity={1}
        >
          <Animated.View 
            style={[
              styles.imagePreviewContainer,
              {
                opacity: imageAnim,
                transform: [{
                  scale: imageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }
            ]}
          >
            <View style={styles.imagePreviewWrapper}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.imagePreviewImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePreviewPlaceholder}>
                  <Ionicons name="person-circle" size={150} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.imagePreviewInfo}>
                <Text style={styles.imagePreviewName}>{studentName}</Text>
                <Text style={styles.imagePreviewRole}>Student Profile</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closePreviewBtn} onPress={closeImagePreview}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Dropdown Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="none"
        onRequestClose={closeProfileMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeProfileMenu} activeOpacity={1}>
          <Animated.View 
            style={[
              styles.profileMenu,
              {
                opacity: menuAnim,
                transform: [{
                  translateY: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity style={styles.menuHeader} onPress={openImagePreview} activeOpacity={0.8}>
              <View style={styles.menuAvatar}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                ) : (
                  <Ionicons name="person-circle" size={50} color={COLORS.primary} />
                )}
              </View>
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName}>{studentName}</Text>
                <Text style={styles.menuUserRole}>Student</Text>
              </View>
              <Ionicons name="expand-outline" size={18} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => handleProfileAction('profile')}>
              <Ionicons name="person-outline" size={20} color="#4B5563" />
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>
            
            {/* <TouchableOpacity style={styles.menuItem} onPress={() => handleProfileAction('settings')}>
              <Ionicons name="settings-outline" size={20} color="#4B5563" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
             */}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  globalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  sidebarToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoWrapper: { minWidth: 110 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#4A7BF7', marginRight: 20 },
  headerSearchWrapper: { flex: 1, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 480,
    width: '100%',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#333' },
  profileHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  bellIcon: { marginRight: 18, position: 'relative' },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 10,
    maxWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  profileMenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 20,
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  menuUserInfo: {
    marginLeft: 12,
  },
  menuUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuUserRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  // Instagram-style Image Preview Styles
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewWrapper: {
    alignItems: 'center',
  },
  imagePreviewImage: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 4,
    borderColor: '#fff',
  },
  imagePreviewPlaceholder: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  imagePreviewInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  imagePreviewName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  imagePreviewRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebHeader;