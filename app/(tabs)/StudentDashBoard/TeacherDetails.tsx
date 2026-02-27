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
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
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

const { width, height } = Dimensions.get("window");
const similarTutions = [
  {
    id: 1,
    name: "AEKI",
    image: require("../../../assets/image/Suggestions1.jpeg"),
    rating: 4.5,
    experience:
      "More than 8yr Experience as Science tutor. Learn how to becoming the best science geek...",
  },
  {
    id: 2,
    name: "AEKI",
    image: require("../../../assets/image/Suggestions2.jpeg"),
    rating: 4.5,
    experience:
      "More than 8yr Experience as Science tutor. Learn how to becoming the best science geek...",
  },
  {
    id: 3,
    name: "AEKI",
    image: require("../../../assets/image/Suggestions3.jpeg"),
    rating: 4.5,
    experience:
      "More than 8yr Experience as Science tutor. Learn how to becoming the best science geek...",
  },
];

export default function TeacherDetails() {
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
    subject,
    board,
    teachingClass,
    language,
    charge,
    description,
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

  useEffect(() => {
    checkSubscription();
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

    // Call the protected booking endpoint
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
      // If backend verification passes, proceed to booking page
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
    // console.error('Error in handleBookNow:', error);
    
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
      // Redirect to subscription page if no active subscription
      router.push({
        pathname: "/(tabs)/StudentDashBoard/Subscription",
        params: {
          redirectTo: 'TeacherDetails',
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
        // Teacher was already favorited, just show a subtle message
        console.log('Teacher already in favorites');
        // Keep the liked state since it's actually favorited
        setIsLiked(true);
      } else {
        // Successfully added to favorites - emit event to update bottom navigation
        favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
      }
    } else {
      await removeFavoriteTeacher(teacher.email);
      // Successfully removed from favorites - emit event to update bottom navigation
      favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
    }
  } catch (error: any) {
    console.error('Error liking teacher:', error);
    setIsLiked(!isLiked); // Revert on error
    // Only show alert for actual errors, not for "already favorited" case
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
        console.log("📩 Encoded Email:", encodedEmail);

        const auth = await getAuthData();
        if (!auth || !auth.token) {
          console.error("No authentication token found");
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await axios.get(
          `${BASE_URL}/review?email=${encodedEmail}`,
          {
            headers,
          }
        );

        console.log("✅ Reviews:", res.data);
        setReviews(res.data.reviews || []);
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
        if (!auth || !auth.token) {
          console.error("No authentication token found");
          return;
        }

        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await axios.post(
          `${BASE_URL}/api/teacher`,
          { email },
          { headers }
        );

        console.log("res", res.data);

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

        console.log("teacher", teacher);
      } catch (error) {
        console.error(
          "Failed to fetch teacher:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();

    fetchTeacher();
  }, [email]);

  // Add this useEffect to check if teacher is favorited
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

  console.log("teacher name", teacher);
  if (!teacher) {
    return (
      <Text style={{ marginTop: 100, textAlign: "center" }}>
        Teacher not found
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}

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
    
    {/* ✅ ADD UNIVERSITY DISPLAY HERE */}
    {teacher.university && (
      <View style={styles.universityDisplay}>
        <Text style={styles.universityText}>{teacher.university}</Text>
      </View>
    )}
  </View>
</View>

        <View style={styles.content}>
          {/* Details Section */}
          <View style={styles.detailsSection}>
          {teacher.tuitions?.length > 0 && (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      justifyContent: "flex-start",
    }}
  >
    {/* ✅ ADD LIKE BUTTON HERE - LEFT SIDE */}
    <TouchableOpacity onPress={handleLikePress}>
      <AntDesign name={isLiked ? "like1" : "like2"} size={24} color={isLiked ? "#4255ff" : "black"} />
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.bookNowButton}
      onPress={handleBookNow}
      disabled={isLoading}
    >
      <Text style={styles.bookNowText}>
        {isLoading ? 'Processing...' : 'Book Class Now'}
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/Share")}>
      <Ionicons
        name="share-social"
        size={wp("8.66%")}
        color="#4255ff"
        style={{ marginLeft: 5 }}
      />
    </TouchableOpacity>
  </View>
)}
          </View>

          {/* Introduction Section */}
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Introduction</Text>
            <View style={styles.IntroContent}>
              <View style={styles.introContent}>
                <Text style={styles.introText}>
                  {teacher.introduction ||
                    `Hello! I'm ${teacher.name}, a passionate ${subject} teacher with deep expertise in the ${board} curriculum. I teach ${teachingClass} students in ${language}, helping them achieve academic excellence through engaging lessons.`}
                </Text>
              </View>
              {/* Educational Qualifications */}
              <View style={styles.educationDetails}>
                <Text style={styles.educationDetailsTitle}>
                  Educational Qualifications
                </Text>
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
          {/* Tuitions */}
<View style={styles.tuitionsContainer}>
  <Text style={styles.tuitionsTitle}>Subjects for Tuition</Text>

  {teacher.tuitions?.map((t, index) => (
    <View key={index} style={styles.subjects}>
      <View style={styles.classContainer}>
        <Menubook size={wp("10.66%")} />
        <View style={styles.classContent}>
          <Text style={styles.classSubValue}>
            {teacher.category === "Skill teacher"
              ? `Skill: ${t.skill}`
              : `${t.subject} - ${t.class || t.className}`}
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

      {/* Updated Date Container - Display days as individual boxes */}
      <View style={styles.dateContainer}>
        <View style={styles.chargeContainer}>
          <Text style={styles.charge}>₹ {t.charge}</Text>
        </View>
        
        {/* Days Display - Show each day in separate boxes */}
        <View style={styles.daysDisplayContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.daysScrollView}
            contentContainerStyle={styles.daysScrollContent}
          >
            {t.day ? (
              t.day.split(', ').map((day, dayIndex) => (
                <View key={dayIndex} style={styles.dayBox}>
                  <Text style={styles.dayText}>
                    {day.trim()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDaysText}>No days selected</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  ))}
</View>

          {/* Teaching Mode */}
          <View
            style={{
              marginTop: hp("2.69%"),
              width: "100%",
              paddingHorizontal: wp("5.33%"),
              paddingTop: hp("1.345%"),
              paddingBottom: hp("1.5%"),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 15,
            }}
          >
            <Text
              style={{
                fontWeight: "500",
                opacity: 0.75,
                fontSize: wp(isTablet ? "3.1%" : "4.27%"),
                lineHeight: hp("3.64%"),
                marginRight: 10,
              }}
            >
              I will teach
            </Text>
            <View style={styles.teachingModeContainer}>
              <View 
                style={[
                  styles.teachingModeBox, 
                  teacher.teachingmode?.includes('Online') ? styles.teachingModeSelected : styles.teachingModeNotSelected
                ]}
              >
                <Text style={styles.teachingModeText}>Online</Text>
              </View>
              <View 
                style={[
                  styles.teachingModeBox, 
                  teacher.teachingmode?.includes('Face to Face') ? styles.teachingModeSelected : styles.teachingModeNotSelected
                ]}
              >
                <Text style={styles.teachingModeText}>Face to Face</Text>
              </View>
            </View>
          </View>

          {/* Work Experience */}
          <View
            style={{
              marginTop: hp("1.5%"),
              width: "100%",
              paddingHorizontal: wp("5.33%"),
              paddingTop: hp("1.345%"),
              paddingBottom: hp("4.037%"),
            }}
          >
            <Text
              style={{
                fontWeight: "500",
                marginBottom: hp("1.480%"),
                opacity: 0.75,
                fontSize: wp(isTablet ? "3.1%" : "4.27%"),
                lineHeight: hp("3.64%"),
              }}
            >
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

          {/* Summary with Rating Bars */}
          {reviews.length > 0 && (
            <View style={styles.ratingCard}>
              <View style={styles.ratingTitle}>
                <Text style={styles.ratingCardText}>
                  ⭐ {averageRating.toFixed(1)}
                </Text>
                <Text style={styles.totalReviews}>
                  Total Reviews: {reviews.length}
                </Text>
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
                      <View
                        style={[styles.barFill, { width: `${percentage}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          ) : (
            reviews.map((review, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Image
                    source={
                      review.student_profile_pic
                        ? { uri: review.student_profile_pic }
                        : require("../../../assets/images/Profile.png")
                    }
                    style={styles.reviewProfilePic}
                  />
                  <View>
                    <Text style={styles.reviewName}>{review.student_name}</Text>
                    <View style={{ flexDirection: "row" }}>
                      {[...Array(5)].map((_, i) => (
                        <Text
                          key={i}
                          style={{
                            color: i < review.rating ? "#ffc979" : "#ccc",
                            fontSize: 16,
                          }}
                        >
                          ★
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.review_text}</Text>
              </View>
            ))
          )}
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: wp(isTablet ? "3.1%" : "4.27%"),
                lineHeight: hp("2.826%"),
                marginBottom: hp("2.15%"),
                color: "#fff",
              }}
            >
              Similar Tutions
            </Text>
            {similarTutions.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                  alignItems: "center",
                }}
              >
                <Image
                  source={item.image}
                  style={{
                    width: wp("30.933%"),
                    height: hp("21.130%"),
                    borderRadius: wp("2.13%"),
                    marginRight: wp("4.27%"),
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: wp(isTablet ? "3.21%" : "4.27%"),
                      color: "#fff",
                      fontFamily: "RedHatDisplay_400Regular",
                      lineHeight: hp("2.15%"),
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: wp(isTablet ? "3.21%" : "4.27%"),
                      color: "#fff",
                      marginVertical: hp("0.504%"),
                    }}
                  >
                    ⭐ {item.rating}/5
                  </Text>
                  <Text
                    style={{
                      fontSize: wp(isTablet ? "3.21%" : "4.27%"),
                      color: "#fff",
                      lineHeight: hp("3.23%"),
                    }}
                  >
                    {item.experience}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation userType="student" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  // headerSection: { backgroundColor: "#5f5fff", height: hp(isTablet ? "50%" : "62.71%"), borderBottomLeftRadius: wp(isTablet ? "6.25%%" : "13.33%"), borderBottomRightRadius: wp(isTablet ? "6.25%%" : "13.33%"), paddingLeft: wp("12.8%"), paddingRight: wp("12.8%"), paddingTop: 50, justifyContent: "center", position: "relative" },
  backButton: { position: "absolute", top: hp(isTablet ? "4.79%" : "6.729%"), left: wp("5.33%"), zIndex: 10, padding: wp(isTablet ? "1.5%" : "2.13%"), backgroundColor: "#f5f6f8", borderRadius: "50%", height: wp(isTablet ? "9%" : "12.8%"), width: wp(isTablet ? "9%" : "12.8%"), flex: 1, alignItems: "center", justifyContent: "center" },
  // profileContent: { alignItems: "center", justifyContent: "center", height: wp("78.933%"), width: wp("78.933%") },
  // image: { width: wp(isTablet ? "45%" : "75%"), height: wp(isTablet ? "45%" : "75%"), borderRadius: wp("26666.666666667%"), marginBottom: 10, borderWidth: 3, borderColor: "#fff" },
  
  image: { 
    width: wp(isTablet ? "52%" : "82%"), // ✅ Further increased size
    height: wp(isTablet ? "52%" : "82%"), // ✅ Further increased size
    borderRadius: wp("26666.666666667%"), 
    marginBottom: hp('3%'), // ✅ Increased margin to push image higher
    borderWidth: 3, 
    borderColor: "#fff",
    position: 'relative',
    top: hp('-1%'), // ✅ Optional: Move image up slightly
  },
  // name: { fontSize: wp(isTablet ? "4%" : "5.86%"), fontWeight: "bold", color: "#fff" },
  // ratingContainer: { backgroundColor: "#ffffff", position: "absolute", right: wp(isTablet ? "18%" : "5.33%"), bottom: hp(isTablet ? "9%" : "12.7%"), borderRadius: wp("26.666%"), alignItems: "center", justifyContent: "center", paddingHorizontal: wp("2.13%"), paddingVertical: hp("0.5%") },
  // rating: { fontSize: wp(isTablet ? "2.5%" : "4%"), fontWeight: "600", color: "#4255ff" },
  scrollContent: { paddingBottom: hp("10.767%") },
  content: { paddingHorizontal: 20 },
  detailsSection: { padding: hp("5.114%"), alignItems: "center", justifyContent: "center" },
  IntroContent: { borderWidth: wp("0.266%"), borderColor: "#edeeee", paddingHorizontal: wp("2.13%"), paddingVertical: wp("2.2%"), borderRadius: wp("3.2%"), height: hp("64.119%") },
  icon: { alignItems: "center", justifyContent: "center", height: wp(isTablet ? "8.1%" : "9.86%"), width: wp(isTablet ? "8.1%" : "9.86%"), backgroundColor: "#f3e8ff", borderRadius: "50%" },
  college: { color: "#0f172a", fontSize: wp("3.733%"), lineHeight: hp("2.69%"), opacity: 0.95, fontFamily: "OpenSans_400Regular", marginLeft: wp("2.13%") },
  collegeName: { color: "#475569", marginTop: wp("0.95%"), marginLeft: wp("2.13%"), fontSize: wp("3.2%"), lineHeight: hp("2.69"), opacity: 0.95, fontFamily: "OpenSans_400Regular" },
  category: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  categoryValue: { alignItems: "center", justifyContent: "center", width: wp("48%"), height: hp("4.845%"), borderWidth: wp("0.266%"), borderColor: "#71d561" },
  categoryContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  catValues: { color: "#030303", fontSize: wp(isTablet ? "2.3%" : "3.73%"), lineHeight: hp("2.69%"), fontWeight: "600", fontFamily: "Inter_400Regular" },
  classSubValue: { fontSize: wp(isTablet ? "2.5%" : "3.2%"), alignItems: "flex-start", lineHeight: hp("6.729%") },
  year: { color: "#0f172a", fontSize: wp("3.2%"), lineHeight: hp("2.69%"), opacity: 0.95 },
  bookNowButton: { backgroundColor: "#4255ff", width: wp("34.133%"), height: hp("6.46%"), borderRadius: wp("3.2%"), alignItems: "center", justifyContent: "center", margin: "auto" },
  bookNowText: { color: "#ffffff", fontSize: wp("3.2%"), fontWeight: "700", marginRight: 6, lineHeight: hp("2.69%") },
  shareIcon: {  },
  intro: { paddingHorizontal: wp("5.33%"), paddingTop: hp("1.345%"), paddingBottom: hp("4.037%") },
  introTitle: { fontSize: wp("3.2%"), fontWeight: "500", color: "#162e54", lineHeight: hp("2.557%"), marginBottom: hp("1.2%") },
  introContent: { backgroundColor: "#ffffff", height: hp("19.5154%"), padding: 16, borderRadius: wp("3.2%"), borderWidth: wp("0.266%"), borderColor: "#edeeee", boxShadow: "border-box" },
  introText: { fontSize: wp(isTablet ? "2.6%" : "3.733%"), color: "#686868", lineHeight: wp(isTablet ? "4.2%" : "5.5%"), overflowY: "scroll" },
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
  time: { backgroundColor: "#fff", fontSize: wp(isTablet ? "3.2%" : "4%"), fontWeight: "600", lineHeight: hp("3.23%"), alignItems: "center", justifyContent: "center" },
  // dateContainer: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 15 },
  dateContainer: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "center", 
  gap: 10, 
  marginTop: 15,
  width: '100%',
},
  chargeContainer: { height: hp("4.44%"), width: wp("33.866%"), borderWidth: wp("0.22%"), paddingHorizontal: wp("2.13%"), borderColor: "#c0c0c0", borderRadius: wp("0.66%"), alignItems: "center", justifyContent: "center" },
  charge: { fontSize: wp(isTablet ? "3.2%" : "4%"), fontWeight: "600", lineHeight: hp("3.23%") },
  subjects: {  },
  modeOptions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: hp("4.037%") },
  label: { fontSize: wp("3.466%"), fontWeight: "600", marginBottom: 10 },
  modeButton: { alignItems: "center", justifyContent: "center", height: hp("4.44%"), borderWidth: wp("0.22%"), borderColor: "#26cb63", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 3 },
  firstModeButton: { width: wp("22.933%") },
  secondModeButton: { width: wp("28.266%") },
  modeText: { fontSize: wp(isTablet ? "3.2%" : "3%"), fontWeight: "600" },
  firstModeText: { color: "#000" },
  secondModeText: { color: "#000" },
  feildsContainer: { borderWidth: wp("0.222%"), borderColor: "#edeeee", borderRadius: 10, padding: wp("4.27%") },
  experience: { fontSize: wp(isTablet ? "3.1%" : "4.27%"), lineHeight: hp("2.557%"), color: "#686868", fontWeight: "400", overflowY: "scroll", fontFamily: "OpenSans_400Regular" },
  reviewSection: { backgroundColor: "#5f5fff", marginTop: hp("2.69%"), borderTopLeftRadius: wp("5.866%"), borderTopRightRadius: wp("5.86%"), padding: wp("5.33%"), width: "100%" },
  reviewTitle: { color: "#fff", fontSize: wp("4.27%"), fontWeight: "bold", marginBottom: hp("1.61%"), fontFamily: "KronaOne_400Regular", lineHeight: hp("2.826%") },
  ratingCard: { padding: 10, borderRadius: 10, marginBottom: 20 },
  ratingCardText: { fontWeight: "bold", fontSize: 16, color: "#ffc979", marginBottom: 10, fontFamily: "KronaOne_400Regular" },
  ratingTitle: { flexDirection: "row", gap: 30, alignItems: "center" },
  totalReviews: { fontSize: 14, color: "#fff", fontWeight: "500", marginBottom: 10 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  starLabel: { width: 40, fontSize: 14, color: "#fff", fontFamily: "RedHatDisplay_300Light" },
  barBackground: { flex: 1, height: 10, backgroundColor: "#fff", borderRadius: 5, marginHorizontal: 8 },
  barFill: { height: 10, backgroundColor: "#ffc979", borderRadius: 5 },
  reviewItem: { width: "100%", borderRadius: 10, padding: 12, marginBottom: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reviewProfilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  reviewName: { fontWeight: "bold", color: "#ffffff" },
  reviewText: { color: "#ffffff", fontSize: 14, lineHeight: 20 },
  noReviews: { color: "#eee", fontSize: wp(isTablet ? "3.21%" : "4.27%"), fontStyle: "italic", marginTop: 10, textAlign: "center" },
  teachingModeContainer: {
    flexDirection: 'row',
    gap: wp('3.5%'),
    marginTop: hp('0.5%'),
  },
  teachingModeBox: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('0.25%'),
    borderWidth: wp('0.4%'),
  },
  teachingModeSelected: {
    backgroundColor: 'white',
    borderColor: '#22c55e',
  },
  teachingModeNotSelected: {
    backgroundColor: 'white',
    borderColor: '#ef4444',
    opacity: 0.7,
  },
  teachingModeText: {
    fontSize: wp('3.8%'),
    fontWeight: '500',
    color: '#1f2937',
  },

name: { 
  fontSize: wp(isTablet ? "4%" : "5.86%"), 
  fontWeight: "bold", 
  color: "#fff",
  marginRight: wp("3%"), // Space between name and rating
},
ratingContainer: { 
  backgroundColor: "#ffffff", 
  borderRadius: wp("26.666%"), 
  alignItems: "center", 
  justifyContent: "center", 
  paddingHorizontal: wp("1%"), 
  paddingVertical: hp("0.3%"),
},
rating: { 
  fontSize: wp("3.8%"), 
  fontWeight: "400", 
  color: "#4255ff",
  flexDirection: "row",
  alignItems: "center",
},
ratingSpace: {
  marginRight: wp("1%"), // Adds space after the star icon
},
  daysDisplayContainer: {
  flex: 1,
  minHeight: hp('5.6%'),
},
daysScrollView: {
  maxHeight: hp('6%'),
},
daysScrollContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: wp('2%'),
},
dayBox: {
  minHeight: hp('5.6%'),
  borderWidth: wp('0.22%'),
  paddingHorizontal: wp('2.13%'),
  borderColor: '#d1d5db',
  borderRadius: 4,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  minWidth: wp('25%'),
},
dayText: {
  fontSize: wp('3.5%'),
  fontWeight: '400',
  lineHeight: hp('3.23%'),
  textAlign: 'center',
  color: '#000',
},
noDaysText: {
  fontSize: wp('3.2%'),
  color: '#686868',
  fontStyle: 'italic',
},
nameRatingContainer: {
  alignItems: "center",
  justifyContent: "center",
},
  universityText: {
    color: "#fff",
    fontSize: wp('3.5%'),
    textAlign: "center",
    fontWeight: "500",
  },
   headerSection: { 
    backgroundColor: "#5f5fff", 
    height: hp("60.71%"), 
    borderBottomLeftRadius: wp(isTablet ? "6.25%" : "13.33%"), 
    borderBottomRightRadius: wp(isTablet ? "6.25%" : "13.33%"), 
    paddingLeft: wp("12.8%"), 
    paddingRight: wp("12.8%"), 
    paddingTop: 50, 
    justifyContent: "flex-end", // Align content to bottom
    position: "relative",
    paddingBottom: hp('0.1%'), // ✅ Reduced to 1px equivalent gap
  },
  
  profileContent: { 
    alignItems: "center", 
    justifyContent: "flex-end", // Align content to bottom
    height: wp("78.933%"), 
    width: wp("78.933%"),
    marginBottom: hp('0.1%'), // ✅ Reduced to 1px equivalent gap
  },

  nameRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp("1%"),
    flexWrap: "wrap",
    marginBottom: hp('0.5%'), // ✅ Add small bottom margin
  },

  universityDisplay: {
    marginTop: hp('0.5%'), // ✅ Reduced top margin
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.3%'), // ✅ Reduced padding
    borderRadius: wp('2%'),
  },
});
