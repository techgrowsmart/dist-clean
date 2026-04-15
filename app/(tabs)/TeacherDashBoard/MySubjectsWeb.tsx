import React, { useEffect, useState, useCallback } from "react";
import { 
  Platform,
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  Dimensions
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useRouter } from "expo-router";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TeacherWebHeader from "../../../components/ui/TeacherWebHeader";
import TeacherWebSidebar from "../../../components/ui/TeacherWebSidebar";

interface Tuition {
  class?: string;
  subject?: string;
  board?: string;
  skill?: string;
  timeFrom: string;
  timeTo: string;
  charge: string;
  day: string;
  classId?: string;
  skillId?: string;
}

interface TeacherData {
  name: string;
  email: string;
  profilepic: string;
  tuitions: Tuition[] | string;
}

// Colors from ProfileWeb
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  activeNavBg: '#EEF2FF',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  white: '#FFFFFF',
  green: '#10B981',
  softGreen: '#D1FAE5',
  softPink: '#FCE7F3',
  softYellow: '#FEF3C7',
  softPurple: '#F3E8FF',
  softBlue: '#DBEAFE',
};

const CACHE_KEY = "subjects_list_cache";

export default function SubjectsList() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar state
  const [sidebarActiveItem, setSidebarActiveItem] = useState('My Tuitions');
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const isMobile = windowWidth < 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1200;

  const handleBackPress = useCallback(() => {
    router.push("/(tabs)/TeacherDashBoard/Teacher");
    return true;
  }, [router]);

  // Handle sidebar navigation
  const handleSidebarSelect = useCallback((item: string) => {
    setSidebarActiveItem(item);
    const navigationMap: { [key: string]: string } = {
      "Home": "/(tabs)/TeacherDashBoard/TutorDashboardWeb",
      "My Students": "/(tabs)/TeacherDashBoard/StudentsEnrolled",
      "My Subjects": "/(tabs)/TeacherDashBoard/MySubjectsWeb",
      "Create Subject": "/(tabs)/TeacherDashBoard/CreateSubject",
      "Spotlights": "/(tabs)/TeacherDashBoard/JoinedDateWeb",
      "Share": "/(tabs)/TeacherDashBoard/StudentsListWeb",
      "Profile": "/(tabs)/TeacherDashBoard/ProfileWeb",
      "Billing": "/(tabs)/TeacherDashBoard/Settings",
      "Settings": "/(tabs)/TeacherDashBoard/Settings",
      "Contact Us": "/(tabs)/Contact",
    };
    if (navigationMap[item]) {
      router.push(navigationMap[item] as any);
    }
  }, [router]);

  // Handle window resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Load cached data first for instant display
  const loadCachedData = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { subjects: cachedSubjects, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000 && cachedSubjects.length > 0) {
          console.log('📚 Using cached subjects data:', cachedSubjects.length);
          setSubjects(cachedSubjects);
          setLoading(false);
          return true;
        }
      }
    } catch (err) {
      console.error('Cache loading error:', err);
    }
    return false;
  }, []);

  // Cache the fetched data
  const cacheData = useCallback(async (data: Tuition[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        subjects: data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Cache saving error:', err);
    }
  }, []);

  const fetchSubjects = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      const auth = await getAuthData();
      if (!auth || !auth.email) {
        setError("Authentication required. Please login again.");
        router.replace("/");
        return;
      }

      const { email, token, name, profileImage } = auth;
      
      // Set user info for header/sidebar
      setTeacherName(name || '');
      setUserEmail(email);
      setProfileImage(profileImage || null);
      
      // Try to load from cache first
      if (useCache && await loadCachedData()) {
        return;
      }
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      console.log('🚀 Fetching subjects data...');
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${BASE_URL}/api/teacherProfile`, { 
        method: "POST", 
        headers, 
        body: JSON.stringify({ email }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: any = await res.json();
      console.log("📚 API Response received in", Date.now() - startTime, "ms");

      let allTuitions: Tuition[] = [];

      // Process the teacherProfile API response structure
      if (data?.tuitions && Array.isArray(data.tuitions)) {
        allTuitions = data.tuitions;
        console.log("📚 Found tuitions in teacherProfile response:", allTuitions.length);
      } else {
        console.log("⚠️ No tuitions found in teacherProfile response");
      }

      console.log("📚 All Tuitions Found:", allTuitions);
      
      // Use a better unique identifier that includes all relevant fields
      const uniqueTuitions = Array.from(
        new Map(
          allTuitions.map(item => [
            `${item.classId || item.skillId}-${item.subject || item.skill}-${item.timeFrom}-${item.timeTo}-${item.day}`,
            item
          ])
        ).values()
      );
      
      console.log("✅ Unique Tuitions:", uniqueTuitions.length);
      setSubjects(uniqueTuitions);
      
      // Cache the results
      await cacheData(uniqueTuitions);
      
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError(error instanceof Error ? error.message : "Failed to load subjects");
      
      // Try to show stale cache if available
      await loadCachedData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadCachedData, cacheData]);

  // Refresh function for pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSubjects(false); // Skip cache on refresh
  }, [fetchSubjects]);

  useEffect(() => {
    fetchSubjects();

    // Add back handler
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    // Cleanup the event listener
    return () => backHandler.remove();
  }, [fetchSubjects]);

  // ESC key handler for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleBackPress();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [handleBackPress]);

  // Helper function to format 24-hour time to 12-hour AM/PM format
  const formatTimeDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatTime = (timeFrom: string, timeTo: string) => {
    if (!timeFrom && !timeTo) return 'No time set';
    return `${formatTimeDisplay(timeFrom)} - ${formatTimeDisplay(timeTo)}`;
  };

  // Web layout
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webLayout}>
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        <View style={styles.webContent}>
          <TeacherWebSidebar 
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail}
            teacherName={teacherName}
            profileImage={profileImage}
            subjectCount={subjects.length}
            studentCount={0}
            revenue="₹0"
            isSpotlight={false}
          />
          
          <View style={styles.webMainContent}>
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.mainScroll}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primaryBlue]}
                  tintColor={COLORS.primaryBlue}
                />
              }
            >
              {/* Page Header */}
              <View style={styles.pageHeader}>
                <TouchableOpacity 
                  style={styles.backBtnCircle} 
                  onPress={() => router.push("/(tabs)/TeacherDashBoard/Teacher")}
                >
                  <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>My Tuitions</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => fetchSubjects(false)}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Loading State */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                  <Text style={styles.loadingText}>Loading subjects...</Text>
                </View>
              )}

              {/* Empty State */}
              {!loading && subjects.length === 0 && !error && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <FontAwesome5 name="book" size={40} color={COLORS.primaryBlue} />
                  </View>
                  <Text style={styles.emptyText}>No subjects found</Text>
                  <Text style={styles.emptySubText}>Your subjects will appear here once you add them in your profile</Text>
                  <TouchableOpacity 
                    style={styles.createSubjectBtn}
                    onPress={() => router.push("/(tabs)/TeacherDashBoard/ProfileWeb")}
                  >
                    <Text style={styles.createSubjectText}>Go to Profile to Add Subjects</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Subjects Grid */}
              {!loading && subjects.length > 0 && (
                <View style={styles.subjectsContainer}>
                  {subjects.map((item, index) => (
                    <View key={`${item.classId || item.skillId}-${index}`} style={styles.subjectCard}>
                      {/* Card Header with Icon */}
                      <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                          <FontAwesome5 
                            name={item.skill ? "tools" : "book"} 
                            size={20} 
                            color={COLORS.primaryBlue} 
                          />
                        </View>
                        <View style={styles.cardTitleSection}>
                          <Text style={styles.subjectName} numberOfLines={1}>
                            {item.subject || item.skill || 'Untitled'}
                          </Text>
                          {item.class && (
                            <Text style={styles.classBoard}>{item.class}</Text>
                          )}
                        </View>
                      </View>

                      {/* Card Details */}
                      <View style={styles.cardDetails}>
                        {item.board && (
                          <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="school-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.detailText}>{item.board}</Text>
                          </View>
                        )}
                        
                        <View style={styles.detailRow}>
                          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                          <Text style={styles.detailText}>{formatTime(item.timeFrom, item.timeTo)}</Text>
                        </View>

                        {item.day && (
                          <View style={styles.daysContainer}>
                            {item.day.split(',').map((day, i) => (
                              <View key={i} style={styles.dayPill}>
                                <Text style={styles.dayText}>{day.trim().slice(0, 3)}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {item.charge && (
                          <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>{item.charge}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  // Mobile fallback (should not be used for web)
  return (
    <View style={styles.mobileContainer}>
      <Text style={styles.mobileMessage}>This page is only available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Web Layout
  webLayout: { flex: 1, flexDirection: 'column' },
  webContent: { flex: 1, flexDirection: 'row' },
  webMainContent: { flex: 1, backgroundColor: COLORS.background, marginLeft: 0 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  // Mobile fallback
  mobileContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  mobileMessage: { fontSize: 16, color: COLORS.textBody },
  
  // Page Header
  pageHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24,
    paddingHorizontal: 8
  },
  backBtnCircle: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4 
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.textHeader, 
    marginLeft: 16, 
    flex: 1 
  },
  placeholder: { width: 46 },
  
  // Loading & Error States
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 80,
    minHeight: 400
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textBody,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  
  // Empty State
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 100,
    minHeight: 400
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyText: { 
    fontSize: 22, 
    fontWeight: '600', 
    color: COLORS.textHeader,
    marginBottom: 8
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: 24,
    lineHeight: 22
  },
  createSubjectBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createSubjectText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600'
  },
  
  // Subjects Container - responsive grid layout for 3 columns
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  
  // Subject Card - exact 1/3 width for 3 cards per row
  subjectCard: { 
    width: 'calc(33.333% - 11px)',
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16
  },
  
  iconCircle: { 
    width: 56, 
    height: 56, 
    borderRadius: 14, 
    backgroundColor: COLORS.activeNavBg, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  
  cardTitleSection: {
    flex: 1,
  },
  
  subjectName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.textHeader,
    marginBottom: 6,
  },
  classBoard: { 
    fontSize: 14, 
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  
  cardDetails: {
    gap: 10
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  
  detailText: {
    fontSize: 14,
    color: COLORS.textBody,
  },
  
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12
  },
  
  dayPill: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  
  dayText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  
  priceBadge: {
    backgroundColor: COLORS.softYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12
  },
  
  priceText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '700'
  }
});