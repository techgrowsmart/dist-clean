import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  BackHandler,
  RefreshControl
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";

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

const CACHE_KEY = "subjects_list_cache";

export default function SubjectsList() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackPress = useCallback(() => {
    // Use router.back() instead of router.push for proper navigation
    router.back();
    return true;
  }, [router]);

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
      
      // Try to load from cache first
      if (useCache && await loadCachedData()) {
        return;
      }

      const auth = await getAuthData();
      if (!auth || !auth.email) {
        setError("Authentication required. Please login again.");
        router.replace("/");
        return;
      }

      const { email, token } = auth;
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

  const formatTime = (timeFrom: string, timeTo: string) => `${timeFrom} - ${timeTo}`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006a89" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={wp("6%")} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subjects</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchSubjects(false)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#006a89"]}
            tintColor="#006a89"
          />
        }
      >
        {subjects.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={wp("15%")} color="#ccc" />
            <Text style={styles.emptyText}>No subjects found</Text>
            <Text style={styles.emptySubText}>Your subjects will appear here once you add them</Text>
          </View>
        ) : (
          subjects.map((item, index) => (
            <View key={`${item.classId || item.skillId}-${index}`} style={styles.subjectCard}>
              <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                <Image 
                  source={require("../../../assets/images/book.svg")} // Note: "images" instead of "image"
                  style={styles.bookIcon} 
                  resizeMode="contain"
                />
                </View>

                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{item.subject || item.skill}</Text>
                  {item.class && item.board && <Text style={styles.classBoard}>{`${item.class}, ${item.board}`}</Text>}
                </View>
              </View>

              <View style={styles.divider} />

            <View style={styles.rightSection}>
              <Text style={styles.timeLabel}>Timings</Text>
              <Text style={styles.timeValue}>{formatTime(item.timeFrom, item.timeTo)}</Text>
            </View>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNavigation userType="teacher" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#f6f7f8" 
  },
  loadingText: {
    marginTop: hp("2%"),
    fontSize: wp("4%"),
    color: "#666",
    fontFamily: "WorkSans-Medium"
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: wp("5%"), paddingTop: hp("6%"), paddingBottom: hp("2%"), backgroundColor: "#f6f7f8" },
  backButton: { padding: wp("2%") },
  headerTitle: { 
    fontSize: wp("5.5%"), 
    fontWeight: "600", 
    color: "#000000", 
    textAlign: "center",
    fontFamily: "WorkSans-SemiBold" 
  },
  placeholder: { width: wp("10%") },
  scrollView: { flex: 1, paddingHorizontal: wp("5%") },
  scrollContent: { paddingBottom: hp("12%"), paddingTop: hp("2%") },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: hp("20%") },
  emptyText: { 
    fontSize: wp("4.5%"), 
    color: "#999", 
    fontWeight: "500",
    fontFamily: "WorkSans-Medium",
    marginTop: hp("2%")
  },
  emptySubText: {
    fontSize: wp("3.5%"),
    color: "#ccc",
    textAlign: "center",
    fontFamily: "WorkSans-Light",
    marginTop: hp("1%"),
    paddingHorizontal: wp("10%")
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: wp("4%"),
    marginHorizontal: wp("5%"),
    marginTop: hp("2%"),
    borderRadius: wp("3%"),
    alignItems: "center"
  },
  errorText: {
    color: "#c00",
    fontSize: wp("3.5%"),
    textAlign: "center",
    fontFamily: "WorkSans-Medium"
  },
  retryButton: {
    marginTop: hp("1%"),
    backgroundColor: "#006a89",
    paddingHorizontal: wp("6%"),
    paddingVertical: hp("1%"),
    borderRadius: wp("2%")
  },
  retryText: {
    color: "#fff",
    fontSize: wp("3.5%"),
    fontFamily: "WorkSans-Medium"
  },
  subjectCard: { 
    flexDirection: "row", 
    alignItems: "stretch", 
    backgroundColor: "#ffffff", 
    borderRadius: wp("20%"), 
    padding: wp("4%"), 
    marginBottom: hp("2%"),  
    height: hp("11%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  iconContainer: { 
    width: wp("12%"), 
    height: wp("12%"), 
    // backgroundColor: "#B8D4DC", 
    borderRadius: wp("2%"), 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: wp("3%") 
  },
  
  rightSection: { 
    width: wp("35%"), 
    justifyContent: "center", 
    alignItems: "flex-start", 
    paddingLeft: wp("2%"), 
  },
  
  timeLabel: { 
    fontSize: wp("3.2%"), 
    color: "#006a89", 
    marginBottom: hp("0.5%"), 
    fontWeight: "200", 
    textAlign: "left",
    fontFamily: "WorkSans-Light",
    width: "100%", 
  },
  
  timeValue: { 
    fontSize: wp("3.1%"), 
    color: "#006a89", 
    fontWeight: "200", 
    textAlign: "left",
    fontFamily: "WorkSans-Light",
    width: "100%", 
  },
  leftSection: { flex: 1, flexDirection: "row", alignItems: "center" },
  bookIcon: { width: wp("15%"), height: wp("15%") },
  subjectInfo: { flex: 1 },
  subjectName: { 
    fontSize: wp("4.5%"), 
    fontWeight: "500", 
    color: "#000000", 
    marginBottom: hp("0.5%"),
    fontFamily: "WorkSans-Medium" 
  },
  classBoard: { 
    fontSize: wp("3.5%"), 
    color: "#006a89", 
    fontWeight: "300",
    fontFamily: "WorkSans-Light" 
  },
  divider: { width: 2.5, backgroundColor: "#D0D0D0", marginHorizontal: wp("2%") },
});