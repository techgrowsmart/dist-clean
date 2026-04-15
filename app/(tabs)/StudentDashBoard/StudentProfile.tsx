import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';

const { width, height } = Dimensions.get('window');
const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function StudentProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Get params from URL
  const email = params.email as string || '';
  const name = params.name as string || 'Student';
  const profilePic = params.profilePic as string || DEFAULT_PROFILE_IMAGE;
  const className = params.className as string || '';
  const subject = params.subject as string || '';
  const enrolledDate = params.enrolledDate as string || '';

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/StudentDashBoard/Student' as any);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3131b0" />
      </View>
    );
  }

  // Format enrolled date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header with Cross Button */}
        <View style={webStyles.header}>
          <TouchableOpacity style={webStyles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={webStyles.headerTitle}>Student Profile</Text>
          <View style={webStyles.headerSpacer} />
        </View>

        <ScrollView style={webStyles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={webStyles.profileCard}>
            <View style={webStyles.profileImageContainer}>
              <Image 
                source={{ uri: profilePic || DEFAULT_PROFILE_IMAGE }} 
                style={webStyles.profileImage}
                resizeMode="cover"
              />
            </View>
            
            <Text style={webStyles.studentName}>{name}</Text>
            <Text style={webStyles.studentEmail}>{email}</Text>
          </View>

          {/* Info Section */}
          <View style={webStyles.infoSection}>
            <Text style={webStyles.sectionTitle}>Student Information</Text>
            
            <View style={webStyles.infoRow}>
              <View style={webStyles.infoIcon}>
                <Ionicons name="school-outline" size={20} color="#3131b0" />
              </View>
              <View style={webStyles.infoContent}>
                <Text style={webStyles.infoLabel}>Class</Text>
                <Text style={webStyles.infoValue}>{className || 'Not specified'}</Text>
              </View>
            </View>

            {subject && (
              <View style={webStyles.infoRow}>
                <View style={webStyles.infoIcon}>
                  <Ionicons name="book-outline" size={20} color="#3131b0" />
                </View>
                <View style={webStyles.infoContent}>
                  <Text style={webStyles.infoLabel}>Subject</Text>
                  <Text style={webStyles.infoValue}>{subject}</Text>
                </View>
              </View>
            )}

            {enrolledDate && (
              <View style={webStyles.infoRow}>
                <View style={webStyles.infoIcon}>
                  <Ionicons name="calendar-outline" size={20} color="#3131b0" />
                </View>
                <View style={webStyles.infoContent}>
                  <Text style={webStyles.infoLabel}>Enrolled Date</Text>
                  <Text style={webStyles.infoValue}>{formatDate(enrolledDate)}</Text>
                </View>
              </View>
            )}

            <View style={webStyles.infoRow}>
              <View style={webStyles.infoIcon}>
                <Ionicons name="mail-outline" size={20} color="#3131b0" />
              </View>
              <View style={webStyles.infoContent}>
                <Text style={webStyles.infoLabel}>Email</Text>
                <Text style={webStyles.infoValue}>{email}</Text>
              </View>
            </View>
          </View>

          {/* View Only Notice */}
          <View style={webStyles.viewOnlyNotice}>
            <Ionicons name="eye-outline" size={16} color="#6B7280" />
            <Text style={webStyles.viewOnlyText}>View Only Mode</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Cross Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: profilePic || DEFAULT_PROFILE_IMAGE }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          
          <Text style={styles.studentName}>{name}</Text>
          <Text style={styles.studentEmail}>{email}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="school-outline" size={20} color="#3131b0" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Class</Text>
              <Text style={styles.infoValue}>{className || 'Not specified'}</Text>
            </View>
          </View>

          {subject && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="book-outline" size={20} color="#3131b0" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Subject</Text>
                <Text style={styles.infoValue}>{subject}</Text>
              </View>
            </View>
          )}

          {enrolledDate && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color="#3131b0" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Enrolled Date</Text>
                <Text style={styles.infoValue}>{formatDate(enrolledDate)}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#3131b0" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
        </View>

        {/* View Only Notice */}
        <View style={styles.viewOnlyNotice}>
          <Ionicons name="eye-outline" size={16} color="#6B7280" />
          <Text style={styles.viewOnlyText}>View Only Mode</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Web Styles
const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#3131b0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#3131b0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f0f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  viewOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  viewOnlyText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
});

// Mobile Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#3131b0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#3131b0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    fontFamily: 'Poppins_700Bold',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f0f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'Poppins_400Regular',
  },
  infoValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  viewOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  viewOnlyText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
});
