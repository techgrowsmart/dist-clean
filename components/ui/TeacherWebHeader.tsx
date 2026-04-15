import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getAuthData } from '../../utils/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config';

interface TeacherWebHeaderProps {
  teacherName?: string;
  profileImage?: string | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
}

const TeacherWebHeader: React.FC<TeacherWebHeaderProps> = ({
  teacherName: initialTeacherName,
  profileImage: initialProfileImage,
  searchQuery: initialSearchQuery = '',
  onSearchChange,
  showSearch = true,
}) => {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState(initialTeacherName || 'Teacher');
  const [profileImage, setProfileImage] = useState<string | null>(initialProfileImage || null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageAnim] = useState(new Animated.Value(0));

  // Fetch profile data only if not provided as prop
  useEffect(() => {
    if (initialTeacherName && initialProfileImage) {
      // Use props directly if provided
      return;
    }

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
          setTeacherName(data.name || "Teacher");
          setProfileImage(data.profileimage || null);
          await AsyncStorage.multiSet([
            ["teacherName", data.name || ""],
            ["profileImage", data.profileimage || ""]
          ]);
        }
      } catch (error) {
        // Use cached data as fallback
        const cachedName = await AsyncStorage.getItem("teacherName") || "Teacher";
        const cachedImage = await AsyncStorage.getItem("profileImage") || null;
        setTeacherName(cachedName);
        setProfileImage(cachedImage);
      }
    };

    fetchProfile();
  }, [initialTeacherName, initialProfileImage]);

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
    // Reduce polling from 30 seconds to 2 minutes to improve performance
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Handle search change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (onSearchChange) {
      onSearchChange(text);
    }
  };

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [menuAnim] = useState(new Animated.Value(0));

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

  const handleProfileAction = (action: string) => {
    closeProfileMenu();
    switch (action) {
      case 'profile':
        router.push('/(tabs)/TeacherDashBoard/TeacherProfile' as any);
        break;
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Growsmart</Text>
      
      {showSearch && (
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={14} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Type in search" 
            placeholderTextColor="#aaa" 
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>
      )}
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          onPress={() => router.push("/(tabs)/TeacherDashBoard/Notification" as any)} 
          style={{ marginRight: 18, position: 'relative' }}
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
          <View style={styles.headerAvatar}>
            {profileImage ? (
              <Image
                source={{
                  uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`
                }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
            ) : (
              <Ionicons name="person-circle" size={32} color="#3B5BFE" />
            )}
          </View>
          <Text style={styles.headerUserName}>{teacherName}</Text>
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
                  source={{
                    uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`
                  }}
                  style={styles.imagePreviewImage}
                  resizeMode="cover"
                  onError={() => setProfileImage(null)}
                />
              ) : (
                <View style={styles.imagePreviewPlaceholder}>
                  <Ionicons name="person-circle" size={150} color="#3B5BFE" />
                </View>
              )}
              <View style={styles.imagePreviewInfo}>
                <Text style={styles.imagePreviewName}>{teacherName}</Text>
                <Text style={styles.imagePreviewRole}>Teacher Profile</Text>
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
                  <Image
                    source={{
                      uri: profileImage.startsWith('http') ? profileImage : `${BASE_URL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`
                    }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    onError={() => setProfileImage(null)}
                  />
                ) : (
                  <Ionicons name="person-circle" size={50} color="#3B5BFE" />
                )}
              </View>
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName}>{teacherName || 'Teacher'}</Text>
                <Text style={styles.menuUserRole}>Teacher</Text>
              </View>
              <Ionicons name="expand-outline" size={18} color="#6B7280" style={{ marginLeft: 'auto' }} />
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10,
    flexShrink: 0,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
    marginRight: 16,
    minWidth: 100,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 400,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 20,
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    fontFamily: 'Poppins_600SemiBold',
    maxWidth: 120,
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
    ...Platform.select({
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 20,
      },
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
    }),
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
    fontFamily: 'Poppins_600SemiBold',
  },
  menuUserRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_400Regular',
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutText: {
    color: '#EF4444',
  },
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
    fontFamily: 'Poppins_700Bold',
  },
  imagePreviewRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
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

export default TeacherWebHeader;
