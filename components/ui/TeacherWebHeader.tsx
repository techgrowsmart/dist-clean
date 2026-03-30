import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
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
  }, []);

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
        
        <Text style={styles.headerUsername}>{teacherName || 'Teacher'}</Text>
        
        <View style={styles.headerAvatar}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={{ width: 36, height: 36, borderRadius: 18 }} 
            />
          ) : (
            <FontAwesome name="user" size={18} color="#fff" />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
    marginRight: 20,
    minWidth: 110,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 480,
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
  },
  headerUsername: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
    marginRight: 8,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
});

export default TeacherWebHeader;
