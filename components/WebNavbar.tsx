import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { StyleSheet } from 'react-native';

interface WebNavbarProps {
  studentName?: string;
  profileImage?: string | null;
  unreadCount?: number;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const WebNavbar: React.FC<WebNavbarProps> = ({
  studentName = 'Student',
  profileImage = null,
  unreadCount = 0,
  searchQuery = '',
  setSearchQuery = () => {}
}) => {
  const router = useRouter();

  const styles = StyleSheet.create({
    // Header
    header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff', zIndex: 10 },
    logo: { fontSize: 18, fontWeight: 'bold', color: '#4A7BF7', fontFamily: 'Poppins_700Bold', marginRight: 20, minWidth: 110 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 7, maxWidth: 480 },
    searchInput: { flex: 1, fontSize: 13, color: '#333', fontFamily: 'Poppins_400Regular' },
    headerRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' as any },
    headerUsername: { fontSize: 13, color: '#333', fontFamily: 'Poppins_400Regular', marginRight: 8 },
    headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  });

  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Growsmart</Text>
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={14} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Type in search" 
          placeholderTextColor="#aaa" 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
        />
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          onPress={() => router.push("/(tabs)/StudentDashBoard/StudentNotification")} 
          style={{ marginRight: 18, position: 'relative' }}
        >
          <FontAwesome name="bell-o" size={20} color="#444" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{studentName}</Text>
        <View style={styles.headerAvatar}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} /> 
          ) : (
            <FontAwesome name="user" size={18} color="#fff" />
          )}
        </View>
      </View>
    </View>
  );
};

export default WebNavbar;
