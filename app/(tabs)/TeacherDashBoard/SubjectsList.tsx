import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  BackHandler // Add this import
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
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

export default function SubjectsList() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
    
    // Add back handler
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    // Cleanup the event listener
    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    router.push("/(tabs)/TeacherDashBoard/Teacher");
    return true; // This prevents the app from closing
  };

  const fetchSubjects = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) {
        router.replace("/");
        return;
      }

      const { email, token } = auth;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const res = await fetch(`${BASE_URL}/api/teacherInfo`, { method: "POST", headers, body: JSON.stringify({ teacherEmail: email }) });
      const data = await res.json();

      console.log("📚 API Response:", data);

      let allTuitions: Tuition[] = [];

      // Process all teacher entries that match the email
      const processTeachers = (teachers: any) => {
        if (Array.isArray(teachers)) {
          teachers.forEach((teacher: TeacherData) => {
            if (teacher.email === email) {
              let tuitions = teacher.tuitions;
              if (typeof tuitions === "string") {
                try { 
                  tuitions = JSON.parse(tuitions); 
                } catch (err) { 
                  console.error("Parse error:", err); 
                  tuitions = []; 
                }
              }
              if (Array.isArray(tuitions)) {
                allTuitions.push(...tuitions);
              }
            }
          });
        }
      };

      // Process spotlightTeachers
      if (data.spotlightTeachers) {
        Object.values(data.spotlightTeachers).forEach(processTeachers);
      }

      // Process popularTeachers  
      if (data.popularTeachers) {
        Object.values(data.popularTeachers).forEach(processTeachers);
      }

      // Also check if there are direct teacher entries in the response
      if (data.teachers && Array.isArray(data.teachers)) {
        processTeachers(data.teachers);
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
      
      console.log("✅ Unique Tuitions:", uniqueTuitions);
      setSubjects(uniqueTuitions);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeFrom: string, timeTo: string) => `${timeFrom} - ${timeTo}`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006a89" />
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subjects found</Text>
          </View>
        ) : (
          subjects.map((item, index) => (
            <View key={index} style={styles.subjectCard}>
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f7f8" },
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
    fontSize: wp("4%"), 
    color: "#999", 
    fontWeight: "500",
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