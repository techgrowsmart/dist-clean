import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

// Global Design Tokens
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
};

const JoinedDate = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Joined Date");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Fetch teacher joined date info
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.token) {
          setAuthToken(auth.token);
          setTeacherName(auth.name || '');
          setTeacherEmail(auth.email || '');
          setProfileImage(auth.profileImage || null);
          
          const response = await axios.get(`${BASE_URL}/api/teacher/profile`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          
          if (response.data.success) {
            setTeacherInfo(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching teacher info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherInfo();
  }, []);

  const handleMenuPress = (item: string) => {
    setActiveMenu(activeMenu === item ? null : item);
  };

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    setActiveMenu(null);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'Students Enrolled':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'Subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'Joined Date':
        // Already on this page
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact':
        router.push('/(tabs)/Contact');
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: "home" },
    { id: "Students Enrolled", label: "Students Enrolled", icon: "people" },
    { id: "Subjects", label: "Subjects", icon: "book" },
    { id: "Joined Date", label: "Joined Date", icon: "calendar" },
  ];

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TeacherWebHeader 
        teacherName={teacherName}
        profileImage={profileImage}
      />
      
      <View style={styles.contentLayout}>
        <TeacherWebSidebar
          teacherName={teacherName}
          profileImage={profileImage}
          activeItem={sidebarActiveItem}
          userEmail={teacherEmail}
          onItemPress={handleSelect}
        />
        
        <View style={styles.mainWrapper}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Joined Date</Text>
            <Text style={styles.pageSubtitle}>Your teaching journey timeline</Text>
          </View>
          
          <ScrollView style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.loadingText}>Loading information...</Text>
              </View>
            ) : teacherInfo ? (
              <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Joined Platform</Text>
                    <Text style={styles.timelineDate}>{new Date(teacherInfo.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>First Student Enrolled</Text>
                    <Text style={styles.timelineDate}>{teacherInfo.first_student_date ? new Date(teacherInfo.first_student_date).toLocaleDateString() : 'Not yet'}</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Total Teaching Experience</Text>
                    <Text style={styles.timelineDate}>{teacherInfo.experience_years ? `${teacherInfo.experience_years} years` : 'Not specified'}</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Verified Status</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>
                        {teacherInfo.is_verified ? '✓ Verified Teacher' : 'Pending Verification'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No information available</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginLeft: 280,
  },
  pageHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  timelineContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primaryBlue,
    marginTop: 6,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 3,
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.white,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default JoinedDate;
