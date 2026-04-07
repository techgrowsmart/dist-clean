import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import axios from "axios";
import Checkbox from "expo-checkbox";
import { BASE_URL } from "../../../config";
import DangerousIcon from "../../../assets/svgIcons/Dangerous";
import BulbIcon from "../../../assets/svgIcons/BulbIcon";
import { getAuthData } from "../../../utils/authStorage";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import Entypo from "@expo/vector-icons/Entypo";
import { Ionicons } from "@expo/vector-icons";
import CustomCheckbox from "../../../components/CustomCheckbox";
import { safeBack } from "../../../utils/navigation";
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import ThoughtsCard, { ThoughtsBackground } from './ThoughtsCard';

const { width, height } = Dimensions.get("window");

// Colors for web UI
const COLORS = {
  primary: '#3B5BFE',
  darkBlue: '#1E40AF',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  headerTxt: '#000000',
};

export default function BookClass() {
  const router = useRouter();
  const { teacherEmail, selectedSubject, selectedClass, teacherProfilePic, description } = useLocalSearchParams();
  const [tuitions, setTuitions] = useState<any[]>([]);
  const [selectedTuitions, setSelectedTuitions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchTuitions = async () => {
      try {
        const auth = await getAuthData();
        const headers = { Authorization: `Bearer ${auth?.token}`, "Content-Type": "application/json" };
        
        const res = await axios.post(`${BASE_URL}/api/teacher`, { email: teacherEmail }, { headers });
        const data = res.data?.tuitions || [];
        setTuitions(data);
        setSelectedTuitions([]);
      } catch (err) {
        console.error("Error fetching teacher tuitions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTuitions();
  }, [teacherEmail]);

  const toggleSelection = (key: string) => {
    setSelectedTuitions((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const toggleDaysExpansion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleProceedToPayment = () => {
    const selectedDetails = tuitions.filter((t) => {
      const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
      return selectedTuitions.includes(key);
    });
  
    const totalCharge = selectedDetails.reduce((acc, t) => {
      const chargeStr = typeof t.charge === "string" ? t.charge : "";
      const numericCharge = parseInt(chargeStr);
      return acc + (isNaN(numericCharge) ? 0 : numericCharge);
    }, 0);
  
    router.push({
      pathname: "/(tabs)/StudentDashBoard/Checkout",
      params: { teacherEmail, selected: JSON.stringify(selectedDetails), total: totalCharge, profilepic: teacherProfilePic, description },
    });
  };

  const isCheckoutEmpty = selectedTuitions.length === 0;

  // Helper functions for web UI
  const fetchStudentProfile = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) return;
      
      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      const res = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers });
      setStudentName(res.data.name || "");
      setProfileImage(res.data.profileimage || null);
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const res = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' } });
      if (res.data && typeof res.data.count === 'number') setUnreadCount(res.data.count);
    } catch {}
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic || ['', 'null', 'undefined'].includes(profilePic)) return null;
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
      const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      return { uri: `${BASE_URL}/${clean}` };
    }
    return null;
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    fetchStudentProfile();
    fetchUnreadCount();
  }, []);

  if (loading) return <Text style={styles.title}>Loading tuitions...</Text>;

  // Mobile UI (current implementation)
  const MobileUI = () => (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.titleContent}>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>Confirm Your Class :</Text>
          <TouchableOpacity onPress={() => safeBack(router)}>
            <Ionicons name="close" size={wp("10%")} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.lableContainer}>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Study now, pay later</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Best Teachers from anywhere</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Get the best classes</Text></View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tuitions.map((t, index) => {
          const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
          const daysArray = t.day ? t.day.split(",").map((day: string) => day.trim()) : [];
          const firstDay = daysArray[0] || "";
          const hasMultipleDays = daysArray.length > 1;
          const isExpanded = expandedIndex === index;
          
          return (
            <View key={index} style={styles.tuitionItem}>
              <View style={styles.checkboxContainer}>
                {/* Left Section - Day & Time (33% width) */}
                <View style={styles.leftSection}>
                  <View style={styles.dayTimeContainer}>
                    <View style={styles.dayRow}>
                      {hasMultipleDays && (
                        <TouchableOpacity onPress={() => toggleDaysExpansion(index)} style={styles.chevronButton}>
                          <Entypo 
                            name={isExpanded ? "chevron-down" : "chevron-right"} 
                            size={wp("4%")} 
                            color="#000" 
                          />
                        </TouchableOpacity>
                      )}
                      <Text 
                        style={styles.day} 
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {firstDay}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timing} numberOfLines={1} adjustsFontSizeToFit>{t.timeFrom}</Text>
                      <Text style={styles.timing} numberOfLines={1} adjustsFontSizeToFit>{t.timeTo}</Text>
                    </View>
                  </View>
                </View>

                {/* Vertical Divider */}
                <View style={styles.separator} />

                {/* Right Section - Subject & Checkbox (67% width) */}
                <View style={styles.rightSection}>
                  <View style={styles.subjectContainer}>
                    {t.skill ? (
                      <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.skill}</Text>
                    ) : (
                      <>
                        <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.subject}</Text>
                        <Text style={styles.className} numberOfLines={1} adjustsFontSizeToFit>{t.class}</Text>
                      </>
                    )}
                  </View>
                    <CustomCheckbox 
                      value={selectedTuitions.includes(key)} 
                      onValueChange={() => toggleSelection(key)} 
                      size={wp("5.66%") * 1.5}
                    />
                </View>
              </View>

              {/* Dropdown for additional days */}
              {isExpanded && hasMultipleDays && (
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownContent}>
                    {daysArray.map((day, dayIndex) => (
                      <View key={dayIndex} style={styles.dayItem}>
                        <View style={styles.dayDot} />
                        <Text style={styles.dayText} numberOfLines={1} adjustsFontSizeToFit>{day}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      
      {isCheckoutEmpty && <Text style={styles.warningText}>Please select at least one class to proceed.</Text>}

      <TouchableOpacity style={[styles.button, isCheckoutEmpty && { opacity: 0.5 }]} onPress={handleProceedToPayment} disabled={isCheckoutEmpty}>
        <Text style={styles.buttonText}>Confirm Class</Text>
      </TouchableOpacity>

      <BottomNavigation userType="student" />
    </View>
  );

  // Web UI
  const WebUI = () => (
    <SafeAreaView style={webStyles.safeArea}>
      <View style={webStyles.rootLayout}>
        <WebNavbar 
          studentName={studentName}
          profileImage={profileImage}
        />
        <View style={webStyles.mainColumnsLayout}>
          <WebSidebar 
            activeItem="Home"
            onItemPress={(item) => {
              if (item === 'Home') router.push('/(tabs)/StudentDashBoard/Student');
              else if (item === 'My Tuitions') router.push('/(tabs)/StudentDashBoard/MyTuitions');
              else if (item === 'Connect') router.push('/(tabs)/StudentDashBoard/ConnectWeb');
              else if (item === 'Profile') router.push('/(tabs)/StudentDashBoard/Profile');
              else if (item === 'Billing') router.push({ pathname: '/(tabs)/Billing', params: { userEmail: '', studentName, profileImage } });
              else if (item === 'Faq') router.push('/(tabs)/StudentDashBoard/Faq');
              else if (item === 'Share') router.push({ pathname: '/(tabs)/StudentDashBoard/Share', params: { userEmail: '', studentName, profileImage } });
              else if (item === 'Subscription') router.push({ pathname: '/(tabs)/StudentDashBoard/Subscription', params: { userEmail: '' } });
              else if (item === 'Contact Us') router.push('/(tabs)/Contact');
            }}
            userEmail=""
            studentName={studentName || 'Student'}
            profileImage={profileImage}
          />
          <View style={webStyles.centerContentContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={webStyles.centerContentScroll}>
              <View style={webStyles.pageNavHeader}>
                <TouchableOpacity style={webStyles.backButton} onPress={() => safeBack(router)}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={webStyles.pageTitle}>Book Class</Text>
              </View>

              <View style={webStyles.boxContainer}>
                <View style={webStyles.bookingHeader}>
                  <Text style={webStyles.bookingTitle}>Confirm Your Class</Text>
                  <Text style={webStyles.bookingSubtitle}>Select your preferred tuition slots</Text>
                </View>

                {tuitions.map((t, index) => {
                  const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
                  const daysArray = t.day ? t.day.split(",").map((day: string) => day.trim()) : [];
                  const firstDay = daysArray[0] || "";
                  const hasMultipleDays = daysArray.length > 1;
                  const isExpanded = expandedIndex === index;
                  
                  return (
                    <View key={index} style={webStyles.tuitionCard}>
                      <View style={webStyles.tuitionCardHeader}>
                        <View style={webStyles.tuitionSubject}>
                          {t.skill ? (
                            <Text style={webStyles.tuitionSubjectText}>{t.skill}</Text>
                          ) : (
                            <>
                              <Text style={webStyles.tuitionSubjectText}>{t.subject}</Text>
                              <Text style={webStyles.tuitionClassText}>{t.class}</Text>
                            </>
                          )}
                        </View>
                        <CustomCheckbox 
                          value={selectedTuitions.includes(key)} 
                          onValueChange={() => toggleSelection(key)} 
                          size={20}
                        />
                      </View>
                      
                      <View style={webStyles.tuitionSchedule}>
                        <View style={webStyles.scheduleItem}>
                          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={webStyles.scheduleText}>{firstDay}</Text>
                          {hasMultipleDays && (
                            <TouchableOpacity onPress={() => toggleDaysExpansion(index)}>
                              <Ionicons 
                                name={isExpanded ? "caret-down" : "caret-forward"} 
                                size={16} 
                                color={COLORS.primary} 
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={webStyles.scheduleItem}>
                          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={webStyles.scheduleText}>{t.timeFrom} - {t.timeTo}</Text>
                        </View>
                        <View style={webStyles.scheduleItem}>
                          <Ionicons name="pricetag-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={webStyles.scheduleText}>₹{t.charge}</Text>
                        </View>
                      </View>

                      {isExpanded && hasMultipleDays && (
                        <View style={webStyles.expandedDays}>
                          {daysArray.map((day, dayIndex) => (
                            <View key={dayIndex} style={webStyles.dayChip}>
                              <Text style={webStyles.dayChipText}>{day}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* ThoughtsCard Section */}
                <View style={{ marginTop: 24, marginBottom: 32 }}>
                  <ThoughtsCard
                    post={{
                      id: 'booking-post',
                      author: {
                        email: teacherEmail as string || '',
                        name: 'Teacher',
                        role: 'Teacher',
                        profile_pic: teacherProfilePic as string || ''
                      },
                      content: description as string || 'Ready to start your learning journey! Book your class and take the first step towards academic excellence.',
                      likes: 0,
                      comments: [],
                      createdAt: 'Just now',
                      isLiked: false
                    }}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                  />
                </View>
              </View>

              {isCheckoutEmpty && <Text style={webStyles.warningText}>Please select at least one class to proceed.</Text>}

              <TouchableOpacity 
                style={[webStyles.confirmButton, isCheckoutEmpty && { opacity: 0.5 }]} 
                onPress={handleProceedToPayment} 
                disabled={isCheckoutEmpty}
              >
                <Text style={webStyles.confirmButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  // Render platform-specific UI
  return Platform.OS === 'web' ? <WebUI /> : <MobileUI />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topContainer: { height: hp("33.243%"), backgroundColor: "#5f5fff", borderBottomLeftRadius: wp("8.53%"), borderBottomRightRadius: wp("8.53%"), paddingHorizontal: wp("5.33%"), paddingTop: hp("4.31%"), paddingBottom: hp("3.23%") },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: hp("25%") },
  titleContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: wp("8.266%"), fontWeight: "700", lineHeight: hp("6.325%"), color: "#fff", width: width * 0.7, flexShrink: 1 },
  label: { flexDirection: "row", alignItems: "center", gap: wp("2.933%"), flexShrink: 1 },
  text: { fontSize: wp("4%"), lineHeight: hp("2.96%"), color: "#fff", fontWeight: "700", marginTop: hp("1.08%"), flexShrink: 1 },
  lableContainer: { padding: 10, borderRadius: 12, flexDirection: "column", alignItems: "flex-start", gap: 6 },
  tuitionItem: { alignItems: "center", justifyContent: "center", marginTop: hp("1.95%") },
  checkboxContainer: { width: wp("82.4%"), height: hp("11.843%"), flexDirection: "row", alignItems: "center", borderWidth: wp("0.22%"), borderColor: "#71d561", padding: wp("4.27%"), borderRadius: wp("5.86%") },
  leftSection: { width: "33%", paddingRight: wp("2%"), flexShrink: 1 },
  dayTimeContainer: { flex: 1, justifyContent: "center", flexShrink: 1 },
  dayRow: { flexDirection: "row", alignItems: "center", marginBottom: hp("0.8%"), flexShrink: 1 },
  chevronButton: { marginRight: wp("1%") },
  day: { fontWeight: "600", fontSize: wp("2.93%"), lineHeight: hp("1.884%"), color: "#000000", flexShrink: 1, flex: 1 },
  timeContainer: { marginLeft: wp("4%"), flexShrink: 1 },
  timing: { fontSize: wp("3.2%"), color: "#000000", lineHeight: hp("2.2%"), flexShrink: 1 },
  separator: { width: wp("0.44%"), backgroundColor: "#ccc", height: "130%", marginHorizontal: wp("2%") },
  rightSection: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingLeft: wp("2%"), flexShrink: 1 },
  subjectContainer: { flex: 1, flexShrink: 1 },
  subject: { fontWeight: "600", fontSize: wp("3.733%"), marginBottom: hp("0.5%"), flexShrink: 1 },
  className: { fontSize: wp("3.2%"), color: "#555", lineHeight: hp("2.15%"), flexShrink: 1 },
  checkbox: { transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }], height: wp("5.66%"), width: wp("5.66%") },
  dropdownContainer: { width: wp("82.4%"), marginTop: hp("0.5%"), backgroundColor: "#f8f9fa", borderRadius: wp("2%"), borderWidth: wp("0.22%"), borderColor: "#71d561", padding: wp("3%") },
  dropdownContent: { flexDirection: "column", gap: hp("1%") },
  dayItem: { flexDirection: "row", alignItems: "center", gap: wp("2%") },
  dayDot: { width: wp("1.5%"), height: wp("1.5%"), borderRadius: wp("0.75%"), backgroundColor: "#71d561" },
  dayText: { fontSize: wp("3%"), color: "#000", fontWeight: "500", flexShrink: 1 },
  button: { position: "absolute", bottom: hp("18%"), left: wp("6.933%"), right: wp("6.933%"), height: hp("7.533%"), backgroundColor: "#5f5fff", borderRadius: 22, alignItems: "center", justifyContent: "center", elevation: 5 },
  buttonText: { color: "#fff", fontSize: wp("4.27%"), fontWeight: "600" },
  warningText: { color: "#000", textAlign: "center", marginBottom: hp("1.5%"), fontSize: wp("3.5%"), fontWeight: "600" },
});

// Web Styles
const webStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  rootLayout: { flex: 1, flexDirection: "column", backgroundColor: COLORS.cardBackground },
  
  // --- HEADER ---
  globalHeader: {
    flexDirection: 'row', alignItems: 'center', height: '8%', minHeight: 70,
    backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
  },
  logoWrapper: { width: '18%', minWidth: 200 },
  logoText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primary },
  headerSearchWrapper: { flex: 1, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, width: '100%', maxWidth: 400,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: COLORS.textPrimary, fontFamily: 'Poppins_400Regular',
  },
  profileHeaderSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '18%', minWidth: 200, justifyContent: 'flex-end',
  },
  bellIcon: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444',
    borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerUserName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border },

  // --- SIDEBAR ---
  mainColumnsLayout: { flex: 1, flexDirection: 'row' },
  sidebarContainer: {
    width: '18%', minWidth: 200, backgroundColor: COLORS.cardBackground,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  sidebarScroll: { flexGrow: 1, paddingVertical: 20 },
  menuList: { gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 14, fontWeight: '500', color: COLORS.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  sidebarBottom: { marginTop: 'auto', paddingTop: 20, gap: 4 },

  // --- CENTER CONTENT ---
  centerContentContainer: { flex: 1, backgroundColor: COLORS.background },
  centerContentScroll: { flexGrow: 1, padding: 24 },
  pageNavHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 24, fontWeight: '700', color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },

  // --- BOOKING CONTENT ---
  boxContainer: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  bookingHeader: { marginBottom: 24 },
  bookingTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold', marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },

  // --- TUITION CARDS ---
  tuitionCard: {
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tuitionCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  tuitionSubject: { flex: 1 },
  tuitionSubjectText: {
    fontSize: 16, fontWeight: '600', color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  tuitionClassText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular', marginTop: 2,
  },
  tuitionSchedule: { gap: 8 },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  scheduleText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  expandedDays: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  dayChip: {
    backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  dayChipText: {
    fontSize: 12, color: COLORS.white, fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },

  // --- BUTTONS ---
  confirmButton: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
  },
  confirmButtonText: {
    fontSize: 16, fontWeight: '600', color: COLORS.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  warningText: {
    textAlign: 'center', fontSize: 14, color: '#ef4444',
    fontWeight: '500', marginBottom: 16,
    fontFamily: 'Poppins_500Medium',
  },
});