import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  SafeAreaView,
  TextInput,
} from "react-native";
import { AntDesign, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../../../config";
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import Building from "../../../assets/svgIcons/Building";
import BackButton from "../../../components/BackButton";
import { getAuthData } from "../../../utils/authStorage";
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from "../../../utils/favoritesEvents";
import { KronaOne_400Regular, useFonts } from "@expo-google-fonts/krona-one";
import { RedHatDisplay_300Light } from "@expo-google-fonts/red-hat-display";
import Menubook from "../../../assets/svgIcons/MenuBook";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { isTablet } from "../../../utils/devices";
import { OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { RedHatDisplay_400Regular } from "@expo-google-fonts/red-hat-display";
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import ThoughtsCard, { ThoughtsBackground } from './ThoughtsCard';
import WebSidebar from "../../../components/ui/WebSidebar";

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
  tagGreenBg: '#D9F99D',
  tagBlueBg: '#E0E7FF',
  tagRedBg: '#FECACA',
  timelineYellow: '#FEF3C7',
  timelineGreen: '#DCFCE7',
  timelinePurple: '#E9D5FF',
  timelinePink: '#FBCFE8',
  headerTxt: '#000000',
  starYellow: '#FBBF24',
  ratingGreen: '#22C55E',
  ctaGreenBg: '#D9F99D',
  ctaTxt: '#1F2937',
};

// Mock menu items for sidebar
const MENU_ITEMS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: '1', label: 'Home', icon: 'home-outline' },
  { id: '2', label: 'Profile', icon: 'person-outline' },
  { id: '3', label: 'Favorites', icon: 'heart-outline' },
  { id: '4', label: 'My Tuitions', icon: 'school-outline' },
  { id: '5', label: 'Connect', icon: 'chatbubbles-outline' },
  { id: '6', label: 'Share', icon: 'share-social-outline' },
  { id: '7', label: 'Subscription', icon: 'pricetag-outline' },
  { id: '8', label: 'Billing', icon: 'document-text-outline' },
  { id: '9', label: 'Faq', icon: 'help-circle-outline' },
  { id: '10', label: 'Terms & Conditions', icon: 'document-outline' },
  { id: '11', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
  { id: '12', label: 'Contact Us', icon: 'mail-outline' },
  { id: '13', label: 'Raise a Complaint', icon: 'alert-circle-outline' },
];

const BADGES = [
  "Trusted Teacher",
  "Certified Expert", 
  "100% Satisfaction",
  "20+ Years Experience"
];

export default function TeacherProfileScreen() {
  let [fontsLoaded] = useFonts({
    KronaOne_400Regular,
    RedHatDisplay_300Light,
    OpenSans_400Regular,
    Inter_400Regular,
    RedHatDisplay_400Regular,
  });

  const router = useRouter();
  const {
    email,
    name,
    language,
    profilePic,
  } = useLocalSearchParams();
  
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [hasActiveSubscription, setHasActiveSubscription] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkSubscription = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;

      const response = await axios.get(
        `${BASE_URL}/api/subscriptions/check-subscription`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setHasActiveSubscription(response.data.has_active_subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    checkSubscription();
    fetchStudentProfile();
    fetchUnreadCount();
  }, []);

  const handleBookNow = async () => {
    try {
      setIsLoading(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const firstTuition = teacher.tuitions?.[0];
      if (!firstTuition) return;

      const charge = firstTuition.charge || 0;

      const bookingResponse = await axios.post(
        `${BASE_URL}/api/book-class`,
        {
          teacherEmail: teacher.email,
          teacherName: teacher.name,
          teacherProfilePic: teacher.profilepic,
          selectedSubject: firstTuition.subject,
          selectedClass: firstTuition.class,
          charge: charge,
          description: teacher.introduction,
          teacherData: JSON.stringify(teacher)
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      if (bookingResponse.data.success) {
        router.push({
          pathname: "/(tabs)/StudentDashBoard/BookClass",
          params: {
            teacherName: teacher.name,
            teacherProfilePic: teacher.profilepic,
            teacherEmail: teacher.email,
            selectedSubject: firstTuition.subject,
            selectedClass: firstTuition.class,
            charge: charge,
            description: teacher.introduction,
          },
        });
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        router.push({
          pathname: "/(tabs)/StudentDashBoard/Subscription",
          params: {
            redirectTo: 'TeacherProfileScreen',
            teacherData: JSON.stringify(teacher)
          }
        });
      } else {
        Alert.alert(
          'Error', 
          error.response?.data?.message || 'Failed to process your request. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePress = async () => {
    try {
      if (!teacher?.email) return;
      
      const newLikedStatus = !isLiked;
      setIsLiked(newLikedStatus);
      
      if (newLikedStatus) {
        const result = await addFavoriteTeacher(teacher.email);
        if (result.alreadyFavorited) {
          console.log('Teacher already in favorites');
          setIsLiked(true);
        } else {
          favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
        }
      } else {
        await removeFavoriteTeacher(teacher.email);
        favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
      }
    } catch (error: any) {
      console.error('Error liking teacher:', error);
      setIsLiked(!isLiked);
      if (!error.message?.includes('already in favorites')) {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    }
  };

  useEffect(() => {
    if (!email) return;
    
    const fetchReviews = async () => {
      if (!email || Array.isArray(email)) return;

      try {
        const encodedEmail = encodeURIComponent(email);
        const auth = await getAuthData();
        if (!auth || !auth.token) return;
        
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await axios.get(
          `${BASE_URL}/review?email=${encodedEmail}`,
          { headers }
        );

        setReviews(res.data.reviews || []);
        const ratings = res.data.reviews.map((r) => Number(r.rating));
        const total = ratings.length;

        if (total > 0) {
          const sum = ratings.reduce((acc, cur) => acc + cur, 0);
          const avg = sum / total;

          const countByStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach((r) => {
            const star = Math.round(r);
            if (countByStars[star] !== undefined) {
              countByStars[star]++;
            }
          });

          setAverageRating(avg);
          setRatingsCount(countByStars);
        }
      } catch (error) {
        console.error("❌ Failed to fetch reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    const fetchTeacher = async () => {
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token) return;

        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await axios.post(
          `${BASE_URL}/api/teacher`,
          { email },
          { headers }
        );

        setTeacher({
          ...res.data,
          qualifications:
            typeof res.data.qualifications === "string"
              ? JSON.parse(res.data.qualifications)
              : res.data.qualifications || [],
          tuitions:
            typeof res.data.tuitions === "string"
              ? JSON.parse(res.data.tuitions)
              : res.data.tuitions || [],
          teachingmode:
            typeof res.data.teachingmode === "string"
              ? JSON.parse(res.data.teachingmode)
              : res.data.teachingmode || [],
          category:
            typeof res.data.category === "string"
              ? res.data.category || ""
              : res.data.category || "",
        });
      } catch (error) {
        console.error("Failed to fetch teacher:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
    fetchTeacher();
  }, [email]);

  useEffect(() => {
    const checkIfFavorited = async () => {
      if (teacher?.email) {
        try {
          const isFavorited = await checkFavoriteStatus(teacher.email);
          setIsLiked(isFavorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };
    
    checkIfFavorited();
  }, [teacher]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 100 }}
        color="#4255ff"
      />
    );
  }

  if (!teacher) {
    return (
      <Text style={{ marginTop: 100, textAlign: "center" }}>
        Teacher not found
      </Text>
    );
  }

  // Helper functions
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

  // Web UI Components
  const WebHeader = () => (
    <View style={webStyles.globalHeader}>
      <View style={webStyles.logoWrapper}>
        <Text style={webStyles.logoText}>Growsmart</Text>
      </View>
      <View style={webStyles.headerSearchWrapper}>
        <View style={webStyles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Type in search" 
            placeholderTextColor={COLORS.textSecondary}
            style={webStyles.searchInput as any} 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <View style={webStyles.profileHeaderSection}>
        <TouchableOpacity style={webStyles.bellIcon}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {unreadCount > 0 && <View style={webStyles.notifBadge}><Text style={webStyles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </TouchableOpacity>
        <Text style={webStyles.headerUserName}>{studentName || 'Student'}</Text>
        <Image source={profileImage ? { uri: profileImage } : require("../../../assets/images/Profile.png")} style={webStyles.headerAvatar} />
      </View>
    </View>
  );

  const WebSidebar = () => (
    <View style={webStyles.sidebarContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={webStyles.sidebarScroll}>
        <View style={webStyles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={webStyles.menuItem}
            >
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={COLORS.textPrimary} 
              />
              <Text style={webStyles.menuItemText}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={webStyles.sidebarBottom}>
          <TouchableOpacity style={webStyles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.textPrimary} />
            <Text style={webStyles.menuItemText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={webStyles.menuItem}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.textPrimary} />
            <Text style={webStyles.menuItemText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const BadgeMock = ({ text }: { text: string }) => (
    <View style={webStyles.badgeWrapper}>
      <View style={webStyles.badgeCircleOuter}>
        <View style={webStyles.badgeCircleInner}>
          <Ionicons name="ribbon" size={20} color={COLORS.primary} />
        </View>
      </View>
      <Text style={webStyles.badgeText}>{text}</Text>
    </View>
  );

  const SubjectCard = ({ tuition }: { tuition: any }) => (
    <View style={webStyles.subCardContainer}>
      <View style={webStyles.subCardTopRow}>
        <View style={webStyles.subCardIconBg}>
          <Ionicons name="book-outline" size={12} color={COLORS.primary} />
        </View>
        <Text style={webStyles.subCardTitle}>
          {teacher.category === "Skill teacher" ? tuition.skill : `${tuition.subject} - ${tuition.class || tuition.className}`}
        </Text>
      </View>
      <View style={webStyles.subCardMidRow}>
        <View style={webStyles.subCardTimePill}>
          <Text style={webStyles.subCardTimeText}>{tuition.timeFrom}</Text>
        </View>
        <View style={webStyles.subCardTimePill}>
          <Text style={webStyles.subCardTimeText}>{tuition.timeTo}</Text>
        </View>
        <View style={webStyles.subCardPricePill}>
          <Text style={webStyles.subCardPriceText}>₹ {tuition.charge}</Text>
        </View>
      </View>
      <View style={webStyles.subCardDaysRow}>
        {tuition.day ? tuition.day.split(', ').map((day: string, idx: number) => (
          <View key={idx} style={webStyles.subCardDayPill}>
            <Text style={webStyles.subCardDayText}>{day.trim()}</Text>
          </View>
        )) : (
          <View style={webStyles.subCardDayPill}>
            <Text style={webStyles.subCardDayText}>No days</Text>
          </View>
        )}
      </View>
      <View style={webStyles.subCardStudyRow}>
        <Text style={webStyles.studyText}>I will Study</Text>
        <View style={webStyles.studyTagGrid}>
          {teacher.teachingmode?.includes('Online') && (
            <View style={[webStyles.studyTag, {backgroundColor: COLORS.tagGreenBg}]}><Text style={webStyles.studyTagText}>Online</Text></View>
          )}
          {teacher.teachingmode?.includes('Face to Face') && (
            <View style={[webStyles.studyTag, {backgroundColor: COLORS.tagRedBg}]}><Text style={webStyles.studyTagText}>Face to Face</Text></View>
          )}
        </View>
      </View>
      <TouchableOpacity style={webStyles.bookBtn} onPress={handleBookNow}>
        <Text style={webStyles.bookBtnText}>Book Class</Text>
      </TouchableOpacity>
    </View>
  );

  const ProfileHeader = () => (
    <View style={webStyles.profileHeaderBox}>
      <View style={webStyles.profileLeftCol}>
        <Image source={getProfileImageSource(teacher.profilepic) || require("../../../assets/images/Profile.png")} style={webStyles.profAvatarlg} />
        <View style={webStyles.profInfoBlock}>
          <View style={webStyles.profNameRow}>
            <Text style={webStyles.profName}>{teacher.name}</Text>
            <Ionicons name="star" size={14} color={COLORS.starYellow} style={{ marginLeft: 8 }} />
            <Text style={webStyles.profRating}>{averageRating.toFixed(1)}</Text>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.ratingGreen} style={{ marginLeft: 16 }} />
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="newspaper-outline" size={14} color={COLORS.textPrimary} />
            <Text style={webStyles.profDetailText}>{teacher.category || 'Senior Teacher'}</Text>
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="business-outline" size={14} color={COLORS.primary} />
            <Text style={webStyles.profDetailTextBlue}>{teacher.university || 'North Bengal University'}</Text>
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textPrimary} />
            <Text style={webStyles.profDetailText}>West Bengal, India</Text>
          </View>
        </View>
      </View>
      <View style={webStyles.profileRightCol}>
        {BADGES.map((b, i) => <BadgeMock key={i} text={b} />)}
      </View>
    </View>
  );

  const ReviewSection = () => (
    <View style={webStyles.reviewContainer}>
      <View style={webStyles.reviewLeft}>
        <Text style={webStyles.reviewHeaderTitle}>Reviews</Text>
        <View style={webStyles.reviewRow}>
          <Ionicons name="star" size={18} color={COLORS.starYellow} />
          <Text style={webStyles.reviewScoreMain}>{averageRating.toFixed(1)}</Text>
          <Text style={webStyles.reviewTotalTxt}>Total reviews: {reviews.length}</Text>
        </View>
        <View style={webStyles.barBlock}>
          {[5,4,3,2,1].map((n, i) => (
            <View key={n} style={webStyles.barLine}>
              <Ionicons name="star" size={10} color={COLORS.starYellow} />
              <Text style={webStyles.barLineNum}>{n}</Text>
              <View style={webStyles.barEmpty}>
                <View style={[webStyles.barFill, { width: `${ratingsCount[n] ? (ratingsCount[n] / reviews.length) * 100 : 0}%`}]} />
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={webStyles.reviewRight}>
        {reviews.length > 0 && (
          <View style={webStyles.rtCard}>
            <View style={webStyles.rtHeader}>
              <Image source={reviews[0].student_profile_pic ? { uri: reviews[0].student_profile_pic } : require("../../../assets/images/Profile.png")} style={webStyles.rtAvatar} />
              <View>
                <Text style={webStyles.rtName}>{reviews[0].student_name}</Text>
                <Text style={webStyles.rtLoc}>Kolkata, India</Text>
                <View style={webStyles.rtStars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons key={i} name={i < reviews[0].rating ? "star" : "star-outline"} size={10} color={COLORS.starYellow} />
                  ))}
                </View>
              </View>
            </View>
            <Text style={webStyles.rtDesc}>
              {reviews[0].review_text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Android UI (current TeacherDetails style)
  const AndroidUI = () => (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <BackButton 
            size={30} 
            color="#4255ff" 
            style={styles.backButton}
          />
          <View style={styles.profileContent}>
            <Image
              source={
                teacher.profilepic
                  ? { uri: teacher.profilepic }
                  : require("../../../assets/images/Profile.png")
              }
              style={styles.image}
            />
            <View style={styles.nameRatingRow}>
              <Text style={styles.name}>{teacher.name}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>
                  <AntDesign name="star" size={18} color="#fb923c" />
                  <Text style={styles.ratingSpace}> </Text>
                  {averageRating.toFixed(1)} ({reviews.length})
                </Text>
              </View>
            </View>
            {teacher.university && (
              <View style={styles.universityDisplay}>
                <Text style={styles.universityText}>{teacher.university}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.detailsSection}>
            {teacher.tuitions?.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9, justifyContent: "flex-start" }}>
                <TouchableOpacity onPress={handleLikePress}>
                  <AntDesign name={isLiked ? "like1" : "like2"} size={24} color={isLiked ? "#4255ff" : "black"} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow} disabled={isLoading}>
                  <Text style={styles.bookNowText}>{isLoading ? 'Processing...' : 'Book Class Now'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/Share")}>
                  <Ionicons name="share-social" size={wp("8.66%")} color="#4255ff" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.intro}>
            <Text style={styles.introTitle}>Introduction</Text>
            <View style={styles.IntroContent}>
              <View style={styles.introContent}>
                <Text style={styles.introText}>
                  {teacher.introduction || `Hello! I'm ${teacher.name}, a passionate teacher with deep expertise.`}
                </Text>
              </View>
              <View style={styles.educationDetails}>
                <Text style={styles.educationDetailsTitle}>Educational Qualifications</Text>
                <View style={styles.edContent}>
                  {teacher.qualifications?.map((item, index) => (
                    <View key={index} style={styles.educationItem}>
                      <View style={styles.educationtitles}>
                        <View style={styles.icon}>
                          <Building size={wp(isTablet ? "3.1%" : "4.533%")} />
                        </View>
                        <View>
                          <Text style={styles.college}>{item.subject}</Text>
                          <Text style={styles.collegeName}>{item.college}</Text>
                        </View>
                      </View>
                      <Text style={styles.year}>{item.year}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.category}>Category</Text>
            <View style={styles.categoryValue}>
              <Text style={styles.catValues}>{teacher.category}</Text>
            </View>
          </View>

          <View style={styles.tuitionsContainer}>
            <Text style={styles.tuitionsTitle}>Subjects for Tuition</Text>
            {teacher.tuitions?.map((t, index) => (
              <View key={index} style={styles.subjects}>
                <View style={styles.classContainer}>
                  <Menubook size={wp("10.66%")} />
                  <View style={styles.classContent}>
                    <Text style={styles.classSubValue}>
                      {teacher.category === "Skill teacher" ? `Skill: ${t.skill}` : `${t.subject} - ${t.class || t.className}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.timecontainer}>
                  <View style={styles.timeContent}>
                    <Text style={styles.time}>{t.timeFrom}</Text>
                  </View>
                  <View style={styles.timeContent}>
                    <Text style={styles.time}>{t.timeTo}</Text>
                  </View>
                </View>
                <View style={styles.dateContainer}>
                  <View style={styles.chargeContainer}>
                    <Text style={styles.charge}>₹ {t.charge}</Text>
                  </View>
                  <View style={styles.daysDisplayContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView} contentContainerStyle={styles.daysScrollContent}>
                      {t.day ? t.day.split(', ').map((day, dayIndex) => (
                        <View key={dayIndex} style={styles.dayBox}>
                          <Text style={styles.dayText}>{day.trim()}</Text>
                        </View>
                      )) : (
                        <Text style={styles.noDaysText}>No days selected</Text>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: hp("2.69%"), width: "100%", paddingHorizontal: wp("5.33%"), flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Text style={{ fontWeight: "500", opacity: 0.75, fontSize: wp(isTablet ? "3.1%" : "4.27%"), marginRight: 10 }}>
              I will teach
            </Text>
            <View style={styles.teachingModeContainer}>
              <View style={[styles.teachingModeBox, teacher.teachingmode?.includes('Online') ? styles.teachingModeSelected : styles.teachingModeNotSelected]}>
                <Text style={styles.teachingModeText}>Online</Text>
              </View>
              <View style={[styles.teachingModeBox, teacher.teachingmode?.includes('Face to Face') ? styles.teachingModeSelected : styles.teachingModeNotSelected]}>
                <Text style={styles.teachingModeText}>Face to Face</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: hp("1.5%"), width: "100%", paddingHorizontal: wp("5.33%") }}>
            <Text style={{ fontWeight: "500", marginBottom: hp("1.480%"), opacity: 0.75, fontSize: wp(isTablet ? "3.1%" : "4.27%") }}>
              Work Experience
            </Text>
            <View style={styles.feildsContainer}>
              <Text style={styles.introText}>
                {teacher.workexperience || "No work experience provided."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Reviews</Text>
          {reviews.length > 0 && (
            <View style={styles.ratingCard}>
              <View style={styles.ratingTitle}>
                <Text style={styles.ratingCardText}>⭐ {averageRating.toFixed(1)}</Text>
                <Text style={styles.totalReviews}>Total Reviews: {reviews.length}</Text>
              </View>
              {[5, 4, 3, 2, 1].map((star) => {
                const percentage = (ratingsCount[star] / reviews.length) * 100;
                return (
                  <View key={star} style={styles.ratingRow}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Text>⭐</Text>
                      <Text style={styles.starLabel}>{star}Stars</Text>
                    </View>
                    <View style={styles.barBackground}>
                      <View style={[styles.barFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Image source={review.student_profile_pic ? { uri: review.student_profile_pic } : require("../../../assets/images/Profile.png")} style={styles.reviewProfilePic} />
                  <View>
                    <Text style={styles.reviewName}>{review.student_name}</Text>
                    <View style={{ flexDirection: "row" }}>
                      {[...Array(5)].map((_, i) => (
                        <Text key={i} style={{ color: i < review.rating ? "#ffc979" : "#ccc", fontSize: 16 }}>★</Text>
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.review_text}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNavigation userType="student" />
    </View>
  );

  // Web UI (Class8ScienceProfileScreen style)
  const WebUI = () => (
    <SafeAreaView style={webStyles.safeArea}>
      <View style={webStyles.rootLayout}>
        <WebHeader />
        <View style={webStyles.mainColumnsLayout}>
          <WebSidebar />
          <View style={webStyles.centerContentContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={webStyles.centerContentScroll}>
              <View style={webStyles.pageNavHeader}>
                <TouchableOpacity style={webStyles.backButton} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={webStyles.pageTitle}>{teacher.category || 'Teacher'} | {teacher.name}</Text>
              </View>

              <View style={webStyles.boxContainer}>
                <ProfileHeader />

                <View style={webStyles.splitLayoutRow}>
                  <View style={webStyles.splitLeft}>
                    <View style={webStyles.descBoxContainer}>
                      <View style={webStyles.descBadgePill}>
                        <Text style={webStyles.descBadgeText}>Educational Qualification</Text>
                      </View>
                      <View style={webStyles.descParaBox}>
                        <Text style={webStyles.descParaText}>
                          {teacher.introduction || `Hello! I'm ${teacher.name}, a dedicated and passionate educator with expertise in ${teacher.category || 'teaching'}.`}
                        </Text>
                      </View>
                    </View>

                    <View style={webStyles.categorySwitchWrap}>
                      <TouchableOpacity style={webStyles.catBtnInactive}>
                        <Text style={webStyles.catBtnTextInactive}>Category</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={webStyles.catBtnActive}>
                        <Text style={webStyles.catBtnTextActive}>{teacher.category || 'Subject Teacher'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={webStyles.subjectsGrid}>
                      {teacher.tuitions?.map((tuition, index) => (
                        <SubjectCard key={index} tuition={tuition} />
                      ))}
                    </View>

                    {/* ThoughtsCard Section */}
                    <View style={{ marginTop: 24, marginBottom: 32 }}>
                      <ThoughtsCard
                        post={{
                          id: 'teacher-post',
                          author: {
                            email: teacher.email || '',
                            name: teacher.name || 'Unknown',
                            role: teacher.category || 'teacher',
                            profile_pic: teacher.profilepic || ''
                          },
                          content: teacher.introduction || `Hello! I'm ${teacher.name}, a passionate educator ready to help you learn and grow. With my expertise in ${teacher.category || 'teaching'}, I'm committed to providing quality education and support to all my students.`,
                          likes: 0,
                          comments: [],
                          createdAt: 'Just now',
                          isLiked: false
                        }}
                        getProfileImageSource={getProfileImageSource}
                        initials={initials}
                      />
                    </View>

                    <ReviewSection />
                  </View>

                  <View style={webStyles.splitRight}>
                    <View style={webStyles.blueHeaderCard}>
                      <View style={webStyles.blueHeaderPanel}><Text style={webStyles.blueHeaderText}>Educational Qualification</Text></View>
                      <View style={webStyles.blueContentPanel}>
                        {teacher.qualifications?.map((item, idx) => (
                          <View key={idx} style={webStyles.eduRowObj}>
                            <Ionicons name="business" size={16} color={COLORS.tagBlueBg} style={webStyles.eduIcon} />
                            <Text style={webStyles.eduDegreeTxt}>{item.subject}</Text>
                            <Text style={webStyles.eduUniTxt}>{item.college}</Text>
                            <Text style={webStyles.eduYearTxt}>{item.year}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={[webStyles.blueHeaderCard, { marginTop: 24 }]}>
                      <View style={webStyles.blueHeaderPanel}><Text style={webStyles.blueHeaderText}>Experience</Text></View>
                      <View style={[webStyles.blueContentPanel, { padding: 12, gap: 10 }]}>
                        <View style={[webStyles.expTimelineCard, { backgroundColor: COLORS.timelineYellow }]}>
                          <Text style={webStyles.expTimelineText}><Text style={webStyles.expTimelineBold}>Present:</Text> {teacher.workexperience || 'Experienced educator with proven track record'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  // Render platform-specific UI
  return Platform.OS === 'web' ? <WebUI /> : <AndroidUI />;
}

// Android Styles (same as TeacherDetails)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  backButton: { position: "absolute", top: hp("6.729%"), left: wp("5.33%"), zIndex: 10, padding: wp("2.13%"), backgroundColor: "#f5f6f8", borderRadius: "50%", height: wp("12.8%"), width: wp("12.8%"), flex: 1, alignItems: "center", justifyContent: "center" },
  image: { 
    width: wp("82%"), 
    height: wp("82%"), 
    borderRadius: wp("26666.666666667%"), 
    marginBottom: hp('3%'), 
    borderWidth: 3, 
    borderColor: "#fff",
    position: 'relative',
    top: hp('-1%'),
  },
  scrollContent: { paddingBottom: hp("10.767%") },
  content: { paddingHorizontal: 20 },
  detailsSection: { padding: hp("5.114%"), alignItems: "center", justifyContent: "center" },
  IntroContent: { borderWidth: wp("0.266%"), borderColor: "#edeeee", paddingHorizontal: wp("2.13%"), paddingVertical: wp("2.2%"), borderRadius: wp("3.2%"), height: hp("64.119%") },
  icon: { alignItems: "center", justifyContent: "center", height: wp("9.86%"), width: wp("9.86%"), backgroundColor: "#f3e8ff", borderRadius: "50%" },
  college: { color: "#0f172a", fontSize: wp("3.733%"), lineHeight: hp("2.69%"), opacity: 0.95, fontFamily: "OpenSans_400Regular", marginLeft: wp("2.13%") },
  collegeName: { color: "#475569", marginTop: wp("0.95%"), marginLeft: wp("2.13%"), fontSize: wp("3.2%"), lineHeight: hp("2.69"), opacity: 0.95, fontFamily: "OpenSans_400Regular" },
  category: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  categoryValue: { alignItems: "center", justifyContent: "center", width: wp("48%"), height: hp("4.845%"), borderWidth: wp("0.266%"), borderColor: "#71d561" },
  categoryContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  catValues: { color: "#030303", fontSize: wp("3.73%"), lineHeight: hp("2.69%"), fontWeight: "600", fontFamily: "Inter_400Regular" },
  classSubValue: { fontSize: wp("3.2%"), alignItems: "flex-start", lineHeight: hp("6.729%") },
  year: { color: "#0f172a", fontSize: wp("3.2%"), lineHeight: hp("2.69%"), opacity: 0.95 },
  bookNowButton: { backgroundColor: "#4255ff", width: wp("34.133%"), height: hp("6.46%"), borderRadius: wp("3.2%"), alignItems: "center", justifyContent: "center", margin: "auto" },
  bookNowText: { color: "#ffffff", fontSize: wp("3.2%"), fontWeight: "700", marginRight: 6, lineHeight: hp("2.69%") },
  intro: { paddingHorizontal: wp("5.33%"), paddingTop: hp("1.345%"), paddingBottom: hp("4.037%") },
  introTitle: { fontSize: wp("3.2%"), fontWeight: "500", color: "#162e54", lineHeight: hp("2.557%"), marginBottom: hp("1.2%") },
  introContent: { backgroundColor: "#ffffff", height: hp("19.5154%"), padding: 16, borderRadius: wp("3.2%"), borderWidth: wp("0.266%"), borderColor: "#edeeee", boxShadow: "border-box" },
  introText: { fontSize: wp("3.733%"), color: "#686868", lineHeight: wp("5.5%"), overflowY: "scroll" },
  educationDetails: { marginTop: hp("5.114%") },
  educationDetailsTitle: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  tuitionsContainer: { marginTop: hp("2.211%"), flexDirection: "column", alignItems: "center", justifyContent: "space-around" },
  tuitionsTitle: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  edContent: { marginTop: hp("2.1%"), gap: wp("4.01%") },
  educationItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  educationtitles: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  classContainer: { flexDirection: "row", alignItems: "center", gap: wp("2.13%"), marginTop: 20 },
  classContent: { width: wp("61.866%"), height: hp("5.921%"), borderWidth: wp("0.266%"), borderColor: "#d1d5db", alignItems: "flex-start", justifyContent: "center", borderRadius: wp("1.05%"), paddingHorizontal: wp("2.13%") },
  timecontainer: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 15 },
  timeContent: { height: hp("4.44%"), borderWidth: wp("0.22%"), paddingHorizontal: wp("2.13%"), borderColor: "#c0c0c0", borderRadius: wp("0.66%"), width: wp("23.466%"), alignItems: "center", justifyContent: "center" },
  time: { backgroundColor: "#fff", fontSize: wp("4%"), fontWeight: "600", lineHeight: hp("3.23%"), alignItems: "center", justifyContent: "center" },
  dateContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 15, width: '100%' },
  chargeContainer: { height: hp("4.44%"), width: wp("33.866%"), borderWidth: wp("0.22%"), paddingHorizontal: wp("2.13%"), borderColor: "#c0c0c0", borderRadius: wp("0.66%"), alignItems: "center", justifyContent: "center" },
  charge: { fontSize: wp("4%"), fontWeight: "600", lineHeight: hp("3.23%") },
  subjects: {},
  feildsContainer: { borderWidth: wp("0.222%"), borderColor: "#edeeee", borderRadius: 10, padding: wp("4.27%") },
  experience: { fontSize: wp("4.27%"), lineHeight: hp("2.557%"), color: "#686868", fontWeight: "400", overflowY: "scroll", fontFamily: "OpenSans_400Regular" },
  reviewSection: { backgroundColor: "#5f5fff", marginTop: hp("2.69%"), borderTopLeftRadius: wp("5.866%"), borderTopRightRadius: wp("5.86%"), padding: wp("5.33%"), width: "100%" },
  reviewTitle: { fontSize: wp("4.27%"), lineHeight: hp("2.826%"), marginBottom: hp("2.15%"), color: "#fff" },
  ratingCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginBottom: 20 },
  ratingTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  ratingCardText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  totalReviews: { fontSize: 14, color: "#ccc" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  starLabel: { fontSize: 14, color: "#fff", marginLeft: 8 },
  barBackground: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, marginLeft: 8 },
  barFill: { height: 6, backgroundColor: "#FFD700", borderRadius: 3 },
  reviewItem: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewProfilePic: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  reviewName: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  reviewText: { fontSize: 14, color: "#ddd", lineHeight: 20 },
  noReviews: { textAlign: "center", color: "#ccc", fontSize: 16, padding: 20 },
  teachingModeContainer: { flexDirection: "row", gap: 10 },
  teachingModeBox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  teachingModeSelected: { backgroundColor: "#4255ff", borderColor: "#4255ff" },
  teachingModeNotSelected: { backgroundColor: "#f5f5f5", borderColor: "#ddd" },
  teachingModeText: { fontSize: 14, fontWeight: "500" },
  daysScrollView: { maxWidth: '60%' },
  daysScrollContent: { flexDirection: 'row', gap: 6 },
  dayBox: { backgroundColor: '#e0e0e0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dayText: { fontSize: 12, color: '#333' },
  noDaysText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  daysDisplayContainer: { flex: 1, marginLeft: 10 },
  profileContent: { alignItems: "center", justifyContent: "center" },
  nameRatingRow: { alignItems: "center", marginTop: 10 },
  name: { fontSize: wp("5.86%"), fontWeight: "bold", color: "#fff", textAlign: "center" },
  ratingContainer: { backgroundColor: "#ffffff", borderRadius: wp("26.666%"), alignItems: "center", justifyContent: "center", paddingHorizontal: wp("2.13%"), paddingVertical: hp("0.5%"), marginTop: 8 },
  rating: { fontSize: wp("4%"), fontWeight: "600", color: "#4255ff" },
  ratingSpace: { color: "transparent" },
  universityDisplay: { marginTop: 8 },
  universityText: { fontSize: wp("3.73%"), color: "#fff", textAlign: "center", opacity: 0.9 },
  headerSection: { backgroundColor: "#5f5fff", height: hp("62.71%"), borderBottomLeftRadius: wp("13.33%"), borderBottomRightRadius: wp("13.33%"), paddingLeft: wp("12.8%"), paddingRight: wp("12.8%"), paddingTop: 50, justifyContent: "center", position: "relative" },
});

// Web Styles (same as Class8ScienceProfileScreen)
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
    borderRadius: 30, paddingHorizontal: 16, height: 44, width: '100%', maxWidth: 500,
  },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, outlineStyle: 'none' } as any,
  profileHeaderSection: {
    flexDirection: 'row', alignItems: 'center', width: '25%', minWidth: 200, justifyContent: 'flex-end',
  },
  bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },
  notifBadge: { position: 'absolute', top: 6, right: 16, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },

  mainColumnsLayout: { flex: 1, flexDirection: 'row' },

  // --- SIDEBAR ---
  sidebarContainer: {
    width: '18%', minWidth: 200, backgroundColor: COLORS.cardBackground,
    borderRightWidth: 1, borderRightColor: COLORS.border, paddingVertical: 24,
  },
  sidebarScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  menuList: { marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  menuItemText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginLeft: 14 },
  sidebarBottom: { marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 },

  // --- CENTER CONTENT ---
  centerContentContainer: { flex: 1 },
  centerContentScroll: { padding: 32, paddingBottom: 60 },
  
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 24,
    marginBottom: 32,
    shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1,
  },

  // --- PROFILE HEADER ---
  profileHeaderBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 24, marginBottom: 24,
  },
  profileLeftCol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profAvatarlg: { width: 100, height: 100, borderRadius: 50, marginRight: 24 },
  profInfoBlock: { flex: 1, justifyContent: 'center' },
  profNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profName: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },
  profRating: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.starYellow, marginLeft: 4 },
  profDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  profDetailText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textPrimary, marginLeft: 8 },
  profDetailTextBlue: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.primary, marginLeft: 8 },
  
  profileRightCol: { flexDirection: 'row', gap: 16 },
  badgeWrapper: { alignItems: 'center', width: 80 },
  badgeCircleOuter: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.starYellow, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  badgeCircleInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 9, color: COLORS.textPrimary, textAlign: 'center', marginTop: 8 },

  // --- SPLIT LAYOUT ---
  splitLayoutRow: { flexDirection: 'row', alignItems: 'flex-start' },
  splitLeft: { flex: 1.8, paddingRight: 24 },
  splitRight: { flex: 1 },

  // --- DESCRIPTION SECTION ---
  descBoxContainer: { position: 'relative', marginTop: 16, marginBottom: 32 },
  descBadgePill: {
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 8, position: 'absolute', top: -14, left: 16, zIndex: 2,
  },
  descBadgeText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.white },
  descParaBox: { backgroundColor: COLORS.background, borderRadius: 12, padding: 24, paddingTop: 32 },
  descParaText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textPrimary, lineHeight: 22 },

  categorySwitchWrap: { flexDirection: 'row', marginBottom: 24, backgroundColor: COLORS.background, alignSelf: 'flex-start', borderRadius: 20, padding: 4 },
  catBtnInactive: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16 },
  catBtnTextInactive: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: COLORS.textSecondary },
  catBtnActive: { backgroundColor: COLORS.tagGreenBg, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16 },
  catBtnTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textPrimary },

  // --- SUBJECT CARDS ---
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 32 },
  subCardContainer: { width: '48%', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary, padding: 16 },
  subCardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subCardIconBg: { backgroundColor: COLORS.tagRedBg, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  subCardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.textPrimary },
  subCardMidRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  subCardTimePill: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  subCardTimeText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.textPrimary },
  subCardPricePill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 'auto' },
  subCardPriceText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: COLORS.textPrimary },
  subCardDaysRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  subCardDayPill: { backgroundColor: COLORS.tagGreenBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subCardDayText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.textPrimary },
  subCardStudyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  studyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary },
  studyTagGrid: { flexDirection: 'row', gap: 8 },
  studyTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  studyTagText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.textPrimary },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  bookBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.white },

  // --- REVIEW SECTION ---
  reviewContainer: { flexDirection: 'row', backgroundColor: COLORS.darkBlue, borderRadius: 16, overflow: 'hidden' },
  reviewLeft: { width: '40%', padding: 24, justifyContent: 'center' },
  reviewHeaderTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.white, marginBottom: 8 },
  reviewRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  reviewScoreMain: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.starYellow, marginLeft: 4, marginRight: 8 },
  reviewTotalTxt: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF' },
  barBlock: { gap: 6 },
  barLine: { flexDirection: 'row', alignItems: 'center' },
  barLineNum: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.white, marginLeft: 4, width: 12 },
  barEmpty: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginLeft: 8 },
  barFill: { height: 6, backgroundColor: COLORS.starYellow, borderRadius: 3 },
  
  reviewRight: { width: '60%', padding: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' },
  rtCard: { backgroundColor: 'transparent' },
  rtHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rtAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  rtName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.white },
  rtLoc: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF' },
  rtStars: { flexDirection: 'row', marginTop: 2, gap: 2 },
  rtDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#D1D5DB', lineHeight: 18 },

  // --- RIGHT PANELS ---
  blueHeaderCard: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, overflow: 'hidden' },
  blueHeaderPanel: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 16 },
  blueHeaderText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.white },
  blueContentPanel: { backgroundColor: COLORS.white },
  
  eduRowObj: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  eduIcon: { backgroundColor: '#EEF2FF', padding: 6, borderRadius: 6, marginRight: 12 },
  eduDegreeTxt: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.primary },
  eduUniTxt: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.primary },
  eduYearTxt: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.primary },

  expTimelineCard: { padding: 12, borderRadius: 8 },
  expTimelineText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textPrimary, lineHeight: 18 },
  expTimelineBold: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.textPrimary },
});
