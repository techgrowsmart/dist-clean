import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, FlatList, RefreshControl, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import { UXButton, UXCard, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import WebHeader from '../../../components/ui/TeacherWebHeader';
import WebSidebar from '../../../components/ui/TeacherWebSidebar';


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

const StudentsEnrolled = () => {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [auth, setAuth] = useState<any>(null);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("My Students");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isWeb, setIsWeb] = useState(Platform.OS === 'web');
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);

  // Fetch enrolled students
  const fetchStudents = async () => {
    try {
      const authData = await getAuthData();
      if (authData?.token) {
        setAuthToken(authData.token);
        setAuth(authData);
        setTeacherName(authData.name || '');
        setProfileImage(authData.profileImage || null);
        
        // Try multiple endpoints for student data
        let studentData = [];
        
        try {
          // First try the enrolled students endpoint
          const response = await axios.get(`${BASE_URL}/api/teacher/enrolled-students`, {
            headers: { 'Authorization': `Bearer ${authData.token}` }
          });
          
          if (response.data.success && response.data.data) {
            studentData = response.data.data;
          }
        } catch (error) {
          console.log('Enrolled students endpoint failed, trying contacts endpoint...');
          
          try {
            // Fallback to contacts endpoint (which was used in dashboard)
            const contactsResponse = await axios.post(
              `${BASE_URL}/api/contacts`,
              { userEmail: authData.email, type: authData.role },
              { headers: { 'Authorization': `Bearer ${authData.token}`, 'Content-Type': 'application/json' } }
            );
            
            if (contactsResponse.data.success && contactsResponse.data.contacts) {
              studentData = contactsResponse.data.contacts.map((contact: any) => ({
                id: contact.id,
                name: contact.studentName || contact.name,
                email: contact.studentEmail || contact.email,
                profile_pic: contact.studentProfilePic || contact.profilePic || contact.profile_pic,
                enrolled_date: contact.enrolled_date || contact.createdAt || new Date().toISOString(),
                status: contact.status || 'active'
              }));
            }
          } catch (contactsError) {
            console.log('Contacts endpoint also failed, using mock data');
            // Use mock data for demonstration
            studentData = [];
          }
        }
        
        setStudents(studentData);
      }
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh function
  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  useEffect(() => {
    fetchStudents();
    
    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsMobile(window.width < 768);
    });
    
    return () => subscription.remove();
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
      case 'subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'joinedDate':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
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
      case 'My Students':
        // Already on this page
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
      {isWeb && (
        <WebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
        />
      )}
      
      <View style={styles.contentLayout}>
        {isWeb && (
          <WebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSelect}
            userEmail={auth?.email || ''}
          />
        )}
        
        <View style={[styles.mainWrapper, isWeb && styles.webMainWrapper]}>
          <TeacherThoughtsBackground>
            <ScrollView 
              style={styles.contentContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              {/* Page Header */}
              <View style={styles.pageHeader}>
                <View>
                  <Text style={styles.pageTitle} selectable={false}>Enrolled Students</Text>
                  <Text style={styles.pageSubtitle} selectable={false}>
                    Manage and view your enrolled students
                  </Text>
                </View>
                {students.length > 0 && (
                  <View style={styles.statsBadge}>
                    <Text style={styles.statsBadgeText}>{students.length} Students</Text>
                  </View>
                )}
              </View>

              {loading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                  <Text style={styles.loadingText} selectable={false}>Loading students...</Text>
                </View>
              ) : students.length > 0 ? (
                /* Students List */
                <View style={styles.studentsContainer}>
                  {students.map((student, index) => (
                    <StudentCard key={student.id || index} student={student} isMobile={isMobile} />
                  ))}
                </View>
              ) : (
                /* Empty State */
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <View style={styles.emptyIconBackground}>
                      <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
                      <View style={styles.emptyIconOverlay}>
                        <Ionicons name="link-outline" size={20} color={COLORS.primaryBlue} />
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.emptyTitle} selectable={false}>No students found</Text>
                  <Text style={styles.emptyDescription} selectable={false}>
                    You haven't enrolled any students yet. Start by sharing your course or subject link.
                  </Text>
                  
                  <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.shareButtonText} selectable={false}>Share Subject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </TeacherThoughtsBackground>
        </View>
      </View>
    </View>
  );
};

// --- Student Card Component ---
const StudentCard = ({ student, isMobile }: { student: any; isMobile: boolean }) => {
  return (
    <View style={[styles.studentCard, isMobile && styles.studentCardMobile]}>
      <View style={styles.studentInfo}>
        <View style={styles.avatarContainer}>
          {student.profile_pic ? (
            <Image 
              source={{ 
                uri: student.profile_pic.startsWith('http') 
                  ? student.profile_pic 
                  : `${BASE_URL}/${student.profile_pic}` 
              }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.studentDetails}>
          <Text style={styles.studentName} selectable={false}>{student.name}</Text>
          <Text style={styles.studentEmail} selectable={false}>{student.email}</Text>
          <View style={styles.studentMeta}>
            <Text style={styles.enrolledDate} selectable={false}>
              Enrolled: {new Date(student.enrolled_date || student.createdAt).toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, student.status === 'active' && styles.statusActive]}>
              <Text style={[styles.statusText, student.status === 'active' && styles.statusActiveText]} selectable={false}>
                {student.status || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText} selectable={false}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primaryBlue} />
        </TouchableOpacity>
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
  },
  webMainWrapper: {
    marginLeft: 280,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
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
  statsBadge: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  studentsContainer: {
    padding: 24,
    gap: 16,
  },
  // Student Card Styles
  studentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  studentCardMobile: {
    padding: 16,
    marginHorizontal: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enrolledDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textSecondary,
  },
  statusActiveText: {
    color: '#065F46',
  },
  studentActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.white,
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 32,
  },
  emptyIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyIconOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 400,
  },
  shareButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },
  // Legacy styles (keeping for compatibility)
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default StudentsEnrolled;
