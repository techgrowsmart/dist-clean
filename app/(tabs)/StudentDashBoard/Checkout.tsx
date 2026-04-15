import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BASE_URL } from "../../../config";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../../components/BackButton";
import { getAuthData } from "../../../utils/authStorage";
import { safeBack } from "../../../utils/navigation";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { OpenSans_400Regular, useFonts } from '@expo-google-fonts/open-sans';
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import ThoughtsCard from "./ThoughtsCard";

const { height } = Dimensions.get("window");

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

export default function Checkout() {
  const { teacherEmail, selected, total, profilepic, description, bookingId } = useLocalSearchParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);

  const handleBackPress = () => {
    safeBack(router, '/(tabs)/StudentDashBoard/TeacherDetails');
  };

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
  }, []);
  const [selectedTuitions, setSelectedTuitions] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(Number(total));
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  let [fontsLoaded] = useFonts({ OpenSans_400Regular });

  const isTuitions = selectedTuitions.length === 0;

  // Helper functions for web UI
  const fetchStudentProfile = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) return;
      
      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      const res = await fetch(`${BASE_URL}/api/userProfile`, { 
        method: "POST", 
        headers, 
        body: JSON.stringify({ email: auth.email }) 
      });
      const data = await res.json();
      setStudentName(data.name || "");
      setProfileImage(data.profileimage || null);
    } catch (error) {
      console.error('Error fetching student profile:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, { 
        method: "GET",
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' } 
      });
      const data = await res.json();
      if (data && typeof data.count === 'number') setUnreadCount(data.count);
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

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const auth = await getAuthData();
        const headers = { Authorization: `Bearer ${auth?.token}`, "Content-Type": "application/json" };
        const res = await fetch(`${BASE_URL}/api/teacher`, { method: "POST", headers, body: JSON.stringify({ email: teacherEmail }) });
        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error("Failed to fetch teacher", err);
      }
    };

    fetchTeacher();
    // Handle selected parameter properly
    if (Array.isArray(selected)) {
      setSelectedTuitions(selected);
    } else if (typeof selected === 'string') {
      try {
        setSelectedTuitions(JSON.parse(selected));
      } catch (e) {
        console.error('Failed to parse selected tuitions:', e);
        setSelectedTuitions([]);
      }
    }
  }, [selected]);

  useEffect(() => {
    const updatedTotal = selectedTuitions.reduce((acc, item) => {
      const chargeStr = item.charge?.toString().replace(/[₹,]/g, '').trim() || '0';
      const amount = parseInt(chargeStr);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);
    setSubtotal(updatedTotal);
  }, [selectedTuitions]);

  const removeTuition = (index) => {
    setSelectedTuitions((prev) => prev.filter((_, i) => i !== index));
  };

  // Mobile UI (current implementation)
  const MobileUI = () => (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <BackButton size={20} color="#000" onPress={handleBackPress} />
        <Text style={styles.heading}>Confirm class</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false}>
        {isTuitions && <Text style={styles.warningText}>Please select at least one class to proceed.</Text>}
        {selectedTuitions.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.leftSection}>
              <Image source={teacher?.profilepic ? { uri: teacher.profilepic } : require("../../../assets/images/Profile.png")} style={styles.image} />
              <Text style={styles.name}>{teacher?.name || "Teacher"}</Text>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.professionRow}>
                <View style={styles.subjectContainer}>
                  {item.subject && <Text style={styles.subjectText}>{item.subject}</Text>}
                  {item.class && <Text style={styles.classText}>{item.class}</Text>}
                  {item.skill && <Text style={styles.subjectText}>{item.skill}</Text>}
                </View>
                <Text style={styles.rateText}>₹{item.charge?.toString().replace(/[₹,]/g, '').trim()}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Text style={styles.reviewText}>Review -</Text>
                <Text style={styles.rating}> ★★★★☆</Text>
              </View>
              <View style={styles.actionsRow}>
                <Text style={styles.description} numberOfLines={3}>{teacher?.introduction || "Teacher description"}</Text>
                <TouchableOpacity onPress={() => removeTuition(index)}><Ionicons name="trash-outline" size={wp("6.4%")} color="#858585" /></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>Subtotal:</Text>
          <Text style={styles.subtotalAmount}>₹{subtotal}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => {
          const numericAmount = subtotal;
          if (!numericAmount) { alert("Invalid charge amount"); return; }
          router.push({
            pathname: "/ProceedToPayment",
            params: {
              amount: numericAmount * 100,
              teacherEmail,
              teacherName: teacher?.name || "Teacher",
              selectedTuitions: JSON.stringify(selectedTuitions),
              teacherProfilePic: teacher?.profilepic || "",
              subject: selectedTuitions.map((t) => t.subject).join(", "),
              className: selectedTuitions.map((t) => t.class).join(", "),
              studentName: studentName || "Student",
              studentProfilePic: profileImage || "",
              bookingId: bookingId,
            },
          });
        }}>
          <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
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
                <TouchableOpacity style={webStyles.backButton} onPress={handleBackPress}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={webStyles.pageTitle}>Checkout</Text>
              </View>

              <View style={webStyles.boxContainer}>
                <View style={webStyles.checkoutHeader}>
                  <Text style={webStyles.checkoutTitle}>Confirm Your Booking</Text>
                  <Text style={webStyles.checkoutSubtitle}>Review your selected classes and proceed to payment</Text>
                </View>

                {isTuitions && <Text style={webStyles.warningText}>Please select at least one class to proceed.</Text>}
                
                {selectedTuitions.map((item, index) => (
                  <View key={index} style={webStyles.checkoutCard}>
                    <View style={webStyles.checkoutCardHeader}>
                      <View style={webStyles.teacherInfo}>
                        <Image 
                          source={teacher?.profilepic ? { uri: teacher.profilepic } : require("../../../assets/images/Profile.png")} 
                          style={webStyles.teacherAvatar} 
                        />
                        <View style={webStyles.teacherDetails}>
                          <Text style={webStyles.teacherName}>{teacher?.name || "Teacher"}</Text>
                          <Text style={webStyles.teacherRole}>Professional Educator</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => removeTuition(index)}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={webStyles.checkoutCardBody}>
                      <View style={webStyles.classInfo}>
                        <View style={webStyles.subjectContainer}>
                          {item.subject && <Text style={webStyles.subjectText}>{item.subject}</Text>}
                          {item.class && <Text style={webStyles.classText}>{item.class}</Text>}
                          {item.skill && <Text style={webStyles.subjectText}>{item.skill}</Text>}
                        </View>
                        <Text style={webStyles.rateText}>₹{item.charge?.toString().replace(/[₹,]/g, '').trim()}</Text>
                      </View>
                      
                      <View style={webStyles.scheduleInfo}>
                        <View style={webStyles.scheduleItem}>
                          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={webStyles.scheduleText}>{item.day || 'Flexible'}</Text>
                        </View>
                        <View style={webStyles.scheduleItem}>
                          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                          <Text style={webStyles.scheduleText}>{item.timeFrom} - {item.timeTo}</Text>
                        </View>
                      </View>

                      <View style={webStyles.ratingContainer}>
                        <Text style={webStyles.reviewText}>Rating:</Text>
                        <Text style={webStyles.rating}> ★★★★☆</Text>
                      </View>

                      <Text style={webStyles.description} numberOfLines={2}>
                        {teacher?.introduction || "Experienced teacher dedicated to helping students achieve their academic goals."}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={webStyles.checkoutFooter}>
                <View style={webStyles.subtotalContainer}>
                  <Text style={webStyles.subtotalLabel}>Subtotal:</Text>
                  <Text style={webStyles.subtotalAmount}>₹{subtotal}</Text>
                </View>
                <TouchableOpacity
                  style={webStyles.payButton}
                  onPress={() => {
                    const numericAmount = subtotal;
                    if (!numericAmount) { alert("Invalid charge amount"); return; }
                    router.push({
                      pathname: "/ProceedToPayment",
                      params: {
                        amount: numericAmount * 100,
                        teacherEmail,
                        teacherName: teacher?.name || "Teacher",
                        selectedTuitions: JSON.stringify(selectedTuitions),
                        teacherProfilePic: teacher?.profilepic || "",
                        subject: selectedTuitions.map((t) => t.subject).join(", "),
                        className: selectedTuitions.map((t) => t.class).join(", "),
                        studentName: studentName || "Student",
                        studentProfilePic: profileImage || "",
                        bookingId: bookingId,
                      },
                    });
                  }}
                >
                  <Text style={webStyles.payButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
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
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  topContainer: { flexDirection: "row", alignItems: "center", marginTop: hp('2.69%'), marginBottom: hp('2.69%'), gap: wp('5.33%') },
  heading: { fontSize: wp('5.86%'), fontWeight: "bold", flex: 1 },
  scrollContent: { paddingBottom: 200 },
  card: { height: hp('18.9%'), flexDirection: "row", padding: wp('2.13%'), alignItems: "flex-start", gap: hp('2.69%'), marginBottom: hp('2.69%') },
  leftSection: { alignItems: "center", justifyContent: "center", width: wp('28.8%'), height: hp('17.9%'), borderRadius: 16, borderWidth: wp('0.22%'), borderColor: "#faf5e6" },
  image: { width: wp('24.53%'), height: hp('12.38%'), borderRadius: wp('2.667%') },
  name: { fontSize: wp('3.2%'), fontWeight: "600", textAlign: "center", color: "#0d0c12" },
  rightSection: { flex: 1, marginTop: wp('5.33%') },
  professionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  subjectContainer: { flexDirection: "row", alignItems: "center", gap: wp('2%') },
  subjectText: { fontSize: wp('3.733%'), fontWeight: "700", color: "#0d0c12", lineHeight: hp('3.23%'), fontFamily: "OpenSans_400Regular" },
  classText: { fontSize: wp('3.733%'), fontWeight: "700", color: "#0d0c12", lineHeight: hp('3.23%'), fontFamily: "OpenSans_400Regular" },
  rateText: { fontSize: wp('4.2%'), fontWeight: "500", color: "#000000" },
  ratingContainer: { flexDirection: "row", alignItems: "center" },
  reviewText: { fontSize: wp('3.2%') },
  rating: { fontSize: wp('3.2%'), color: "#f1c40f" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: wp('2.3%') },
  description: { fontSize: wp('2.667%'), lineHeight: hp('2.01%'), color: "#555", marginBottom: 8 },
  bottomSection: { position: "absolute", bottom: wp('10.66%'), left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: wp('4.27%'), paddingBottom: hp('3.23%'), paddingTop: hp('1.61%') },
  subtotalContainer: { paddingVertical: hp('1.08%'), flexDirection: "row", justifyContent: "space-between", marginBottom: hp('1.345%'), paddingHorizontal: hp('1.61%') },
  subtotalLabel: { fontSize: wp('4.8%') },
  subtotalAmount: { fontSize: wp('4.8%') },
  button: { backgroundColor: "#4255ff", padding: wp('3.733%'), borderRadius: wp('2.667%'), alignItems: "center" },
  buttonText: { color: "#fff", fontSize: wp('4.27%'), fontWeight: "600" },
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
    elevation: 4,
  },
  pageTitle: {
    fontSize: 24, fontWeight: '700', color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },

  // --- CHECKOUT CONTENT ---
  boxContainer: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 24, marginBottom: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  checkoutHeader: { marginBottom: 24 },
  checkoutTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold', marginBottom: 4,
  },
  checkoutSubtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },

  // --- CHECKOUT CARDS ---
  checkoutCard: {
    backgroundColor: COLORS.background, borderRadius: 12,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  checkoutCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  teacherInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.border },
  teacherDetails: { flex: 1 },
  teacherName: {
    fontSize: 16, fontWeight: '600', color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  teacherRole: {
    fontSize: 12, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  checkoutCardBody: { gap: 12 },
  classInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectText: {
    fontSize: 16, fontWeight: '600', color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  classText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  rateText: {
    fontSize: 16, fontWeight: '600', color: COLORS.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  scheduleInfo: {
    flexDirection: 'row', gap: 16,
  },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  scheduleText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  ratingContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  reviewText: {
    fontSize: 14, color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  rating: {
    fontSize: 14, color: '#f1c40f',
    fontFamily: 'Poppins_400Regular',
  },
  description: {
    fontSize: 14, color: COLORS.textSecondary, lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },

  // --- FOOTER ---
  checkoutFooter: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  subtotalContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  subtotalLabel: {
    fontSize: 16, fontWeight: '600', color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtotalAmount: {
    fontSize: 18, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'Poppins_700Bold',
  },
  payButton: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 16, fontWeight: '600', color: COLORS.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  warningText: {
    textAlign: 'center', fontSize: 14, color: '#ef4444',
    fontWeight: '500', marginBottom: 16,
    fontFamily: 'Poppins_500Medium',
  },
});