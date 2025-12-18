import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import Bars from "../../../assets/svgIcons/Bars";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import SidebarMenu from "./TeacherSidebar";
import { Animated, Easing } from 'react-native';
const screenWidth = Dimensions.get("window").width;
const { width, height } = Dimensions.get("window");

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import StudentsList from "./StudentList";
import SubjectsList from "./SubjectsList";
import { MaterialCommunityIcons } from "@expo/vector-icons";
interface Contact {
  name: string;
  profilePic: string;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
}

const InfiniteReviewScroll = () => {
  const reviewData = [
    {
      id: 1,
      title: "My Reviews",
      rating: "⭐ ⭐ ⭐ ⭐",
      content: "A positive teacher review typically highlights a teacher's positive qualities, effective teaching methods, and their impact on student learning"
    },
    {
      id: 2, 
      title: "My Reviews",
      rating: "⭐ ⭐ ⭐ ⭐ ⭐",
      content: "Excellent teaching methodology and great communication skills. Students showed remarkable improvement under this teacher's guidance."
    },
    {
      id: 3,
      title: "My Reviews", 
      rating: "⭐ ⭐ ⭐ ⭐",
      content: "Very patient and understanding teacher who creates a positive learning environment for all students."
    }
  ];

  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(0);
  const scrollInterval = React.useRef<number | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const SCROLL_SPEED = 1.8; // You can change this value
  
  const SCROLL_INTERVAL = 36; // ~60fps for smooth animation

  // Calculate total content width for seamless looping
  const cardWidth = wp("80.8%");
  const cardMargin = wp("2.13%");
  const totalCardWidth = cardWidth + cardMargin;
  const totalContentWidth = totalCardWidth * reviewData.length * 4; // 4 sets of data

  // Auto-scroll animation with seamless looping
  const startAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    
    scrollInterval.current = setInterval(() => {
      if (!isPaused && scrollViewRef.current) {
        scrollX.current += SCROLL_SPEED;
        
        // Reset scroll position when reaching the end for seamless loop
        if (scrollX.current >= totalContentWidth) {
          scrollX.current = 0;
        }
        
        scrollViewRef.current.scrollTo({ x: scrollX.current, animated: false });
      }
    }, SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  useEffect(() => {
    startAutoScroll();

    return () => {
      stopAutoScroll();
    };
  }, [isPaused]);

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  return (
    <View style={styles.marqueeContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.marqueeContent}
        scrollEventThrottle={16}
        bounces={false}
        scrollEnabled={false}
      >
        {/* Multiple duplicate sets for truly infinite looping */}
        {[...reviewData, ...reviewData, ...reviewData, ...reviewData].map((review, index) => (
          <TouchableOpacity
            key={`review-${review.id}-${index}`}
            style={styles.reviewCard}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            activeOpacity={1}
          >
            <Text style={styles.reviewText}>{review.title}</Text>
            <Text style={styles.rating}>{review.rating}</Text>
            <ScrollView style={styles.reviewContentScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.reviewContent}>
                {review.content}
              </Text>
            </ScrollView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function TeacherDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // const { userEmail } = params;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [teacherName, setTeacherName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [subjectCount, setSubjectCount] = useState(0);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [showSubjectsList, setShowSubjectsList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStatus, setUserStatus] = useState('dormant'); // Will be updated from API
  const [isSpotlight, setIsSpotlight] = useState(false); // Track if teacher is in spotlight
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  console.log("user", userEmail);
  const fetchProfile = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) {
        router.replace("/");
        return;
      }
      
      const { email, token } = auth;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      
      const profileResponse = await axios.post(
        `${BASE_URL}/api/userProfile`,
        { email },
        { 
          headers,
          timeout: 10000 // 10 second timeout
        }
      );
      
      const profileData = profileResponse.data;
      
      if (profileData?.name) {
        console.log('Profile Data:', JSON.stringify(profileData, null, 2));
        console.log('isSpotlight from API:', profileData.isSpotlight);
        
        const updates = [
          setTeacherName(profileData.name),
          setUserStatus(profileData.status || 'dormant'),
          setIsSpotlight(Boolean(profileData.isSpotlight)),
          setUserEmail(profileData.email),
          setCreatedAt(profileData.created_at),
          AsyncStorage.setItem("teacherName", profileData.name)
        ];
        
        console.log('isSpotlight after setting:', Boolean(profileData.isSpotlight));
        
        if (profileData.profileimage) {
          updates.push(
            setProfileImage(profileData.profileimage),
            AsyncStorage.setItem("profileImage", profileData.profileimage)
          );
        }
        
        await Promise.all(updates);
      }
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      // Don't show error to user, just log it
    }
  };
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };
    
    loadProfile();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!userEmail) return;
  
      try {
        const auth = await getAuthData();
        const token = auth?.token;
        const type = auth?.role;
  
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
  
        console.log('type', userEmail, type);
        const res = await axios.post(
          `${BASE_URL}/api/contacts`,
          { userEmail, type },
          { headers }
        );
        
        console.log("r", res.data);
      
        if (res.data.success) {
          const data = res.data.contacts.map((contact: any) => ({
            name: contact.teacherName || contact.studentName,
            profilePic: contact.teacherProfilePic || contact.studentProfilePic || contact.profilePic || "",
            email: contact.teacherEmail || contact.studentEmail,
            lastMessage: contact.lastMessage,
            lastMessageTime: contact.lastMessageTime,
          }));
  
          setContacts(data);
        } else {
          Alert.alert("Failed", "Could not fetch contacts");
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        Alert.alert("Error", "Failed to fetch contacts");
      }
    };
  
    fetchContacts();
  }, [userEmail, userType]);

const fetchSubjectCount = useCallback(async () => {
  try {
    const auth = await getAuthData();
    const token = auth?.token;
    const email = auth?.email;
    
    if (!email || !token) {
      console.log("❌ No email or token found");
      return;
    }
    
    console.log("🔍 fetchSubjectCount called with email:", email);
    
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${BASE_URL}/api/teacherInfo`, { 
      method: "POST", 
      headers, 
      body: JSON.stringify({ teacherEmail: email }) 
    });
  
    if (!res.ok) {
      console.log("❌ HTTP error! status:", res.status);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📊 API Response Data:", JSON.stringify(data, null, 2));

    let allTuitions: any[] = [];

    const processTeachers = (teachers: any) => {
      console.log("🔍 Processing teachers:", teachers);
      if (Array.isArray(teachers)) {
        teachers.forEach((teacher: any) => {
          console.log("🔍 Checking teacher:", teacher.email, "vs", email);
          if (teacher.email === email) {
            console.log("✅ Found matching teacher");
            let tuitions = teacher.tuitions;
            console.log("📚 Tuitions before parse:", tuitions);
            if (typeof tuitions === "string") {
              try { 
                tuitions = JSON.parse(tuitions); 
                console.log("📚 Tuitions after parse:", tuitions);
              } catch (err) { 
                console.error("Parse error:", err); 
                tuitions = []; 
              }
            }
            if (Array.isArray(tuitions)) {
              console.log("📚 Adding tuitions:", tuitions);
              allTuitions.push(...tuitions);
            }
          }
        });
      }
    };

    if (data.spotlightTeachers) {
      console.log("🔍 Processing spotlightTeachers");
      Object.values(data.spotlightTeachers).forEach(processTeachers);
    }

    if (data.popularTeachers) {
      console.log("🔍 Processing popularTeachers");
      Object.values(data.popularTeachers).forEach(processTeachers);
    }

    if (data.teachers && Array.isArray(data.teachers)) {
      console.log("🔍 Processing direct teachers array");
      processTeachers(data.teachers);
    }

    console.log("📚 All Tuitions Found:", allTuitions);
    
    const uniqueTuitions = Array.from(
      new Map(
        allTuitions.map(item => [
          `${item.classId || item.skillId}-${item.subject || item.skill}-${item.timeFrom}-${item.timeTo}-${item.day}`,
          item
        ])
      ).values()
    );
    
    console.log("✅ Unique Tuitions Count:", uniqueTuitions.length);
    console.log("✅ Unique Tuitions:", uniqueTuitions);
    if (data.spotlightTeachers) {
  const isInSpotlight = Object.values(data.spotlightTeachers).some(
    (teachers: any) => 
      Array.isArray(teachers) && 
      teachers.some((t: any) => t.email === email)
  );
  console.log("🔦 Spotlight check result:", isInSpotlight);
  setIsSpotlight(isInSpotlight);
}
    setSubjectCount(uniqueTuitions.length);
    
  } catch (error) {
    console.error("❌ Failed to fetch subject count:", error);
    setSubjectCount(0);
  }
}, []);

  useEffect(() => {
    fetchSubjectCount();
    
    // Set up polling for subject count every 2 minutes
    const subjectInterval = setInterval(fetchSubjectCount, 120000);
    
    // Clean up interval on component unmount
    return () => clearInterval(subjectInterval);
  }, [userEmail, fetchSubjectCount]);

useFocusEffect(
  useCallback(() => {
    fetchSubjectCount();
  }, [fetchSubjectCount])
);

useEffect(() => {
  if (userEmail) {
    fetchSubjectCount();
  }
}, [userEmail]);

// Fetch unread notification count with optimized polling
const fetchUnreadCount = useCallback(async () => {
  if (!userEmail) return;
  
  try {
    const auth = await getAuthData();
    if (!auth?.token) return;

    const response = await axios.get(
      `${BASE_URL}/api/notifications/unread-count`,
      {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // Add timeout to prevent hanging
      }
    );

    if (response.data && typeof response.data.count === 'number') {
      setUnreadCount(response.data.count);
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Don't update state on error to prevent UI flickering
  }})
React.useEffect(() => {
  if (isSpotlight) {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start();

    // Floating/jumping animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start();
  } else {
    pulseAnim.setValue(1);
    floatAnim.setValue(0);
  }
}, [isSpotlight]);

// Fetch unread notification count on component mount and set up polling
useEffect(() => {
  if (userEmail) {
    // Fetch immediately
    fetchUnreadCount();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }
}, [userEmail, fetchUnreadCount]);


  let [fontsLoaded] = useFonts({
    Poppins_Regular: Poppins_400Regular,
    Poppins_Bold: Poppins_700Bold,
    Poppins_SemiBold: Poppins_600SemiBold,
    OpenSans_400Regular,
  });
  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!fontsLoaded) return <Text>Loading...</Text>;

return (
  <>
    {showSubjectsList ? (
      <SubjectsList />
    ) : showStudentsList ? (
      <StudentsList 
        students={contacts}
        onBack={() => setShowStudentsList(false)}
      />
    ) : (
      <View style={styles.container}>
        <SidebarMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          activeItem={activeMenuItem}
          onItemPress={(itemName: string) => {
            setActiveMenuItem(itemName);
            if (itemName === "Settings") {
              router.push({
                pathname: "/(tabs)/TeacherDashBoard/Settings",
                params: { userEmail },
              });
            }
            if (itemName === "Billing") {
              router.push({
                pathname: "/(tabs)/Billing",
                params: {
                  userType: "teacher",
                  userEmail,
                  teacherName,
                  profileImage,
                },
              });
            }
            if (itemName === "Spotlight")
              router.push("/(tabs)/TeacherDashBoard/SpotlightTarrif");
            if (itemName === "Share") {
              router.push({
                pathname: "/(tabs)/TeacherDashBoard/Share",
                params: { userEmail, teacherName, profileImage },
              });
            }

            if (itemName === "Add on Class") {
              router.push({
                pathname: "/(tabs)/TeacherDashBoard/AddonClass",
                params: { userEmail },
              });
            }

            if (itemName === "Create Subject") {
              router.push({ pathname: "/(tabs)/TeacherDashBoard/Subjects" });
            }

            if (itemName === "Contact") {
              router.push({ pathname: "/(tabs)/Contact" });
            }
          }}
          userEmail={userEmail as string}
          teacherName={teacherName}
          profileImage={profileImage}
        />
<View style={styles.headerContainer}>
  <View style={styles.headerRow}>
    {/* Left: Menu icon and spotlight badge */}
    <View style={styles.leftSection}>
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Bars size={wp("5.23%")} />
      </TouchableOpacity>
      
      {isSpotlight && (
        <Animated.View 
          style={[
            styles.spotlightHeaderBadge,
            { 
              transform: [
                { scale: pulseAnim },
                { translateY: floatAnim }
              ]
            }
          ]}
        >
          <View style={styles.spotlightContent}>
            <MaterialCommunityIcons name="lightbulb-on" size={wp("5%")} color="#5D4037" />
          </View>
          <Animated.View 
            style={[
              styles.glowEffect,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: [0.4, 0.7]
                })
              }
            ]}
          />
        </Animated.View>
      )}
    </View>
    
    {/* Center: GROWSMART text */}
    <View style={styles.centerSection}>
      <Text style={styles.logoText}>GROWSMART</Text>
    </View>
    
    {/* Right: Notification bell */}
    <View style={styles.rightSection}>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/TeacherDashBoard/Notification")}
        style={styles.notificationButton}
      >
        <View style={{ position: "relative" }}>
          <NotificationBellIcon size={wp("5.33%")} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  </View>
</View>

        <ScrollView
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeRow}>
              <Text style={styles.welcome} numberOfLines={1} ellipsizeMode="tail">
  WELCOME, {teacherName} 👋
</Text>
            </View>
            <Text style={[
              styles.statusText,
              userStatus === 'active' ? styles.statusActive : styles.statusInactive
            ]}>
              {userStatus}
            </Text>
          </View>

          <View style={styles.statsCards}>
            <TouchableOpacity onPress={() => setShowStudentsList(true)}>
              <View style={styles.card}>
                <Text style={styles.cardTop}>
                  {contacts?.length > 0 ? contacts.length : 0}
                </Text>
                <Text style={styles.cardBottom}>My enrolled Students</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSubjectsList(true)}>
              <View style={styles.cardMiddle}>
                <Text style={styles.cardTop}>
                  {subjectCount > 0 ? subjectCount : 0}
                </Text>
                <Text style={styles.cardBottom}>Subjects</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.endcard}
              onPress={() => router.push({
                pathname: "/(tabs)/TeacherDashBoard/CongratsTeacher",
                params: { teacherName, createdAt, userEmail }
              })}
            >
              <Text style={styles.cardTop}>{formatDate(createdAt)}</Text>
              <Text style={styles.cardBottom}>Joined Date</Text>
            </TouchableOpacity>
          </View>

<InfiniteReviewScroll />
          <View style={styles.chartContainer}>
            <View style={styles.enrollmentRow}>
              <Text style={styles.enrollmentLabel}>Student Enrolled</Text>
              <View style={styles.dropDownWrapper}>
                <Picker
                  selectedValue={selectedCity}
                  onValueChange={(val) => setSelectedCity(val)}
                  style={styles.picker}
                  dropdownIconColor="#333"
                >
                  <Picker.Item label="Select State/UT" value="" style={styles.pickerLable} />
                  <Picker.Item label="Andhra Pradesh" value="Andhra Pradesh" style={styles.pickerLable} />
                  <Picker.Item label="Arunachal Pradesh" value="Arunachal Pradesh" style={styles.pickerLable} />
                  <Picker.Item label="Assam" value="Assam" style={styles.pickerLable} />
                  <Picker.Item label="Bihar" value="Bihar" style={styles.pickerLable} />
                  <Picker.Item label="Chhattisgarh" value="Chhattisgarh" style={styles.pickerLable} />
                  <Picker.Item label="Goa" value="Goa" style={styles.pickerLable} />
                  <Picker.Item label="Gujarat" value="Gujarat" style={styles.pickerLable} />
                  <Picker.Item label="Haryana" value="Haryana" style={styles.pickerLable} />
                  <Picker.Item label="Himachal Pradesh" value="Himachal Pradesh" style={styles.pickerLable} />
                  <Picker.Item label="Jharkhand" value="Jharkhand" style={styles.pickerLable} />
                  <Picker.Item label="Karnataka" value="Karnataka" style={styles.pickerLable} />
                  <Picker.Item label="Kerala" value="Kerala" style={styles.pickerLable} />
                  <Picker.Item label="Madhya Pradesh" value="Madhya Pradesh" style={styles.pickerLable} />
                  <Picker.Item label="Maharashtra" value="Maharashtra" style={styles.pickerLable} />
                  <Picker.Item label="Manipur" value="Manipur" style={styles.pickerLable} />
                  <Picker.Item label="Meghalaya" value="Meghalaya" style={styles.pickerLable} />
                  <Picker.Item label="Mizoram" value="Mizoram" style={styles.pickerLable} />
                  <Picker.Item label="Nagaland" value="Nagaland" style={styles.pickerLable} />
                  <Picker.Item label="Odisha" value="Odisha" style={styles.pickerLable} />
                  <Picker.Item label="Punjab" value="Punjab" style={styles.pickerLable} />
                  <Picker.Item label="Rajasthan" value="Rajasthan" style={styles.pickerLable} />
                  <Picker.Item label="Sikkim" value="Sikkim" style={styles.pickerLable} />
                  <Picker.Item label="Tamil Nadu" value="Tamil Nadu" style={styles.pickerLable} />
                  <Picker.Item label="Telangana" value="Telangana" style={styles.pickerLable} />
                  <Picker.Item label="Tripura" value="Tripura" style={styles.pickerLable} />
                  <Picker.Item label="Uttar Pradesh" value="Uttar Pradesh" style={styles.pickerLable} />
                  <Picker.Item label="Uttarakhand" value="Uttarakhand" style={styles.pickerLable} />
                  <Picker.Item label="West Bengal" value="West Bengal" style={styles.pickerLable} />
                  <Picker.Item label="Andaman and Nicobar Islands" value="Andaman and Nicobar Islands" style={styles.pickerLable} />
                  <Picker.Item label="Chandigarh" value="Chandigarh" style={styles.pickerLable} />
                  <Picker.Item label="Dadra and Nagar Haveli and Daman and Diu" value="Dadra and Nagar Haveli and Daman and Diu" style={styles.pickerLable} />
                  <Picker.Item label="Delhi" value="Delhi" style={styles.pickerLable} />
                  <Picker.Item label="Jammu and Kashmir" value="Jammu and Kashmir" style={styles.pickerLable} />
                  <Picker.Item label="Ladakh" value="Ladakh" style={styles.pickerLable} />
                  <Picker.Item label="Lakshadweep" value="Lakshadweep" style={styles.pickerLable} />
                  <Picker.Item label="Puducherry" value="Puducherry" style={styles.pickerLable} />
                </Picker>
              </View>
            </View>

            <View style={styles.chartContent}>
              <LineChart
                data={{
                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                  datasets: [{ data: [20, 45, 28, 80, 99, 43] }],
                }}
                width={wp("93%")}
                height={hp("32.570%")}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(95, 95, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: wp("4.27%") },
                  propsForDots: { r: "5", strokeWidth: "2", stroke: "#5f5fff" },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        </ScrollView>

        <BottomNavigation userType="teacher" />
      </View>
    )}
  </>
);
}
const styles = StyleSheet.create({
  marqueeContainer: {
  height: hp("15.7%"),
  marginBottom: hp("2%"),
  overflow: 'hidden',
},
marqueeContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingRight: wp('10%'),
},
reviewCard: { 
  backgroundColor: "#5f5fff", 
  height: hp("15.7%"), 
  width: wp("80.8%"), 
  borderRadius: wp("2.66%"), 
  paddingHorizontal: wp("3.4%"), 
  paddingVertical: hp("1.5%"), 
  marginLeft: wp("2.13%"), 
  justifyContent: "space-between" 
},
reviewText: { color: "#fff", fontSize: wp("4.8%"), lineHeight: hp("3.23%"), fontWeight: "500" },
rating: { color: "#fff", marginTop: hp("0.7%") },
reviewContent: { color: "#fff", fontSize: wp("3.2%"), lineHeight: hp("2.2%"), fontWeight: "500" },
reviewContentScroll: { flex: 1, maxHeight: hp("8%") },
  container: { backgroundColor: "#FFF", flex: 1 },

welcomeContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: hp('1.5%'),
  paddingHorizontal: wp('3.2%'),
  width: '100%',
  position: 'relative', // Add this
},
welcomeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  flex: 1, // Add this to allow it to take available space
},
welcome: {
  fontSize: wp('3.733%'),
  lineHeight: hp('2.422%'),
  textTransform: 'uppercase',
  color: '#393939',
  fontFamily: 'OpenSans_400Regular',
  flex: 1,
  paddingRight: wp('25%'), // Add this - creates space for status text
},
statusText: {
  fontSize: wp('3.2%'),
  fontFamily: 'OpenSans_400Regular',
  textTransform: 'uppercase',
  fontWeight: '600',
  marginLeft: wp('2%'),
  position: 'absolute', // Add this
  right: wp('3.2%'), // Add this - position it at the right edge of container
  top: '50%', // Add this - vertical center
  transform: [{ translateY: -hp('1.5%') }], // Add this - adjust for exact centering
},
  statusActive: {
    color: '#28a745', // Slightly darker green for better visibility
  },
  statusInactive: {
    color: '#dc3545', // Slightly darker red for better visibility
  },
  statsCards: { flexDirection: "row", justifyContent: "space-between", marginBottom: hp("2.71%"), gap: wp("3.733%") },
  card: { backgroundColor: "#f5763f", borderRadius: wp("4.27%"), width: wp("31.2%"), height: hp("11.3%"), padding: 10, justifyContent: "center", alignItems: "center", gap: hp("0.95%") },
  cardMiddle: { backgroundColor: "#f5763f", borderRadius: wp("4.27%"), width: wp("21.6%"), height: hp("11.3%"), padding: 10, flexDirection: "column", justifyContent: "space-around", alignItems: "center" },
  endcard: { backgroundColor: "#f5763f", borderRadius: wp("4.27%"), width: wp("33.86%"), height: hp("11.3%"), padding: 10, flexDirection: "column", justifyContent: "space-around", alignItems: "center" },
  cardTop: { color: "#fff", fontSize: wp("4.27%"), fontWeight: "700", lineHeight: hp("2.826%") },
  cardBottom: { color: "#fff", fontSize: wp("3.2%"), lineHeight: hp("2.15%"), fontWeight: "600", textAlign: "center" },
  // reviewCardContainer: { flexDirection: "row", paddingBottom: 10, paddingHorizontal: 10 },
  // reviewCard: { backgroundColor: "#5f5fff", height: hp("15.7%"), width: wp("80.8%"), borderRadius: wp("2.66%"), paddingHorizontal: wp("3.4%"), paddingVertical: hp("1.5%"), marginLeft: wp("2.13%"), justifyContent: "space-between" },
  // reviewText: { color: "#fff", fontSize: wp("4.8%"), lineHeight: hp("3.23%"), fontWeight: "500" },
  enrollmentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: height * (19 / 743), marginBottom: 8 },
  enrollmentLabel: { fontSize: wp("5.33%"), fontWeight: "500", color: "#07040e", fontFamily: "OpenSans_400Regular", lineHeight: hp("4.03%") },
  chartContainer: { flexDirection: "column", alignItems: "center", justifyContent: "center", top: -hp("3%") },
  dropDownWrapper: { borderWidth: wp("0.22%"), borderColor: "#ccc", borderRadius: wp("2.13%"), width: wp("40%"), backgroundColor: "transparent" },
  picker: { height: hp("6.38%"), width: "100%", color: "#333", fontSize: wp("3.733%") },
  pickerLable: { fontSize: wp("3.733%"), color: "fff" },
  chart: { width: "100%", height: hp("32.570%"), borderRadius: wp("4.27%"), marginVertical: 8, alignSelf: "center" },
  chartContent: { height: hp("32.570%") },
  chartCont: { paddingBottom: 150 },
  reviewCardContainer: { 
  flexDirection: 'row', 
  paddingBottom: 10, 
  paddingHorizontal: 10,
  paddingRight: wp('20%'), // Add extra padding for smooth looping
  },
//   leftHeaderSection: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   flex: 1,
// },

spotlightHeaderBadge: {
  backgroundColor: '#FFF8E1',
  borderRadius: wp('2%'),
  paddingHorizontal: wp('3%'),
  paddingVertical: hp('0.8%'),
  marginLeft: wp('2.5%'),
  borderWidth: 1.5,
  borderColor: '#FFD54F',
  shadowColor: '#FFD54F',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
  overflow: 'hidden',
  position: 'relative',
  minHeight: hp('3.5%'),
},

spotlightContent: {
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 2,
},

starIcon: {
  fontSize: wp('3.5%'),
  marginRight: wp('1.5%'),
  color: '#FFA000',
},

spotlightHeaderText: {
  color: '#5D4037',
  fontSize: wp('3.2%'),
  fontWeight: '700',
  fontFamily: 'Poppins_700Bold',
  letterSpacing: 0.3,
},

glowEffect: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#FFECB3',
  borderRadius: wp('2%'),
  zIndex: 1,
},

shineEffect: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  transform: [{ skewX: '-20deg' }],
  width: wp('10%'),
},

gradientOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: wp('2%'),
},
  headerContainerContent: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    height: hp("6%"), // Fixed height for header content
    marginBottom: hp("1%"), // Space from bottom
  },
  
 headerContainer: { 
  backgroundColor: "#5f5fff", 
  paddingHorizontal: wp("4.8%"), 
  paddingTop: hp("5%"), // Keep same as Student.tsx
  paddingBottom: hp("2%"), // Keep same as Student.tsx
  borderBottomLeftRadius: wp("4.53%"), 
  borderBottomRightRadius: wp("4.53%") 
},
headerRow: { 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "space-between", 
  width: "100%",
  height: wp("10%"),
},

leftSection: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
},

centerSection: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

rightSection: {
  flex: 1,
  alignItems: 'flex-end',
  justifyContent: 'center',
},

menuButton: {
  padding: wp("1%"),
},

notificationButton: {
  padding: wp("1%"),
},

logoText: {
  color: '#e5e7eb',
  fontSize: wp('3.98%'),
  fontFamily: 'Poppins_400Regular',
  fontWeight: '500',
  textAlign: 'center',
  letterSpacing: wp('0.2%'),
  lineHeight: wp('5%'),
},
leftHeaderSection: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flex: 1,
},

logoTextContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  zIndex: 1,
},

// logoText: {
//   color: '#e5e7eb',
//   fontSize: wp('4%'), // Slightly smaller than Student.tsx to fit in row
//   fontFamily: 'Poppins_600SemiBold',
//   fontWeight: '500',
//   textAlign: 'center',
//   letterSpacing: wp('0.2%'),
//   lineHeight: wp('5%'),
// },
  
  logoContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: hp("1.5%"), // Reduced from 2%
  },

  // headerRow: { 
  //   flexDirection: "row", 
  //   alignItems: "center", 
  //   justifyContent: "space-between", 
  //   width: "100%",
  //   marginTop: hp("0.5%"), // Reduced from 1%
  // },
  
  // // Left section for menu icon and spotlight badge
  // leftHeaderSection: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   flex: 1,
  // },
  
  // Notification badge - keep your existing style
  notificationBadge: { 
    position: "absolute", 
    top: hp("-0.8%"), 
    right: wp("-1.5%"), 
    backgroundColor: "red", 
    borderRadius: 50, 
    minWidth: wp("4.5%"), 
    height: wp("4.5%"), 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 2,
    zIndex: 1,
  },
  
  notificationText: { 
    color: "#ffffff", 
    fontSize: wp("2.5%"), 
    fontWeight: "700",
    textAlign: 'center',
    lineHeight: wp("4.5%")
  },
  
  // Main content - adjust marginTop to match Student.tsx
  mainContent: { 
    paddingHorizontal: wp("3.2%"), 
    marginTop: hp("1.08%"), 
    paddingBottom: 150 
  },

});