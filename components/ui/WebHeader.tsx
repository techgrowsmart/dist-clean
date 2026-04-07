import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, Platform } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';

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
  studentName: string;
  profileImage: string | null;
  onNotificationPress?: () => void;
  unreadCount?: number;
};

const WebHeader = ({ studentName, profileImage, onNotificationPress, unreadCount = 0 }: WebHeaderProps) => {
  return (
    <View style={styles.globalHeader}>
      <View style={styles.logoWrapper}>
        <Text style={styles.logoText}>Growsmart</Text>
      </View>
      <View style={styles.headerSearchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Type in search"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.searchInput}
          />
        </View>
      </View>
      <View style={styles.profileHeaderSection}>
        <TouchableOpacity style={styles.bellIcon} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerUserName}>{studentName}</Text>
        <Image source={{ uri: profileImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }} style={styles.headerAvatar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '8%',
    minHeight: 70,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
  },
  logoWrapper: { width: Platform.OS === 'web' ? '18%' : wp(18), minWidth: 200 },
  logoText: { fontSize: 24, color: COLORS.primary, fontWeight: '700' },
  headerSearchWrapper: { flex: 1, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 44,
    width: '100%',
    maxWidth: 500,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, outlineStyle: "solid" },
  profileHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Platform.OS === 'web' ? '25%' : wp(25),
    minWidth: 200,
    justifyContent: 'flex-end',
  },
  bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.background, borderRadius: 20, position: 'relative' },
  notifBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  headerUserName: { fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
});

export default WebHeader;