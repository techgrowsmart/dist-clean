import { AntDesign } from '@expo/vector-icons';
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import BookOpenReaderIcon from "../../../assets/svgIcons/BookOpenReader";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import AllBoardsPage from "./AllBoardsPage";
import ClassSelection from "./ClassSelection";
import Sidebar from "./Sidebar";
import SkillTeachers from "./SkillTeacchers";
import SpotLight from "./SpotLight";
import SpotLightSkillteachers from "./SpotLightSkillteachers";
import SubjectSelection from "./SubjectSelection";
import TeachersList from "./TeachersList";
import MyTeacher from "./MyTeacher";
import AllSkills from "./AllSkills";

import { Roboto_500Medium } from "@expo-google-fonts/roboto";
import {
  OpenSans_500Medium,
  OpenSans_300Light,
  OpenSans_400Regular,
} from "@expo-google-fonts/open-sans";

import {
  Montserrat_400Regular,
} from "@expo-google-fonts/montserrat";



import { isTablet } from "../../../utils/devices";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

try {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    if (!RazorpayCheckout) {
      console.log("Razorpay module not available");
    }
  }
} catch (error) {
  console.log("Razorpay module not available:", error);
}

interface CheckoutOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: number;
  order_id: string;
  name: string;
  prefill: {
    email: string;
    name: string;
  };
  theme: {
    color: string;
  };
}

const { width, height } = Dimensions.get("window");

interface Teacher {
  profilePic: string;
  name: string;
  email: string;
  isPopular: boolean;
  tutions: any[];
  qualifications: any[];
  qualification: string;
  language: string;
}

interface StudentState {
  name: string;
  profileImage: string | null;
}

export default function Home() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_500Medium,
    OpenSans_500Medium,
    OpenSans_300Light,
    OpenSans_400Regular,
    Montserrat_400Regular,
  });
  const [blinkAnim] = useState(new Animated.Value(1));
  const [student, setStudent] = useState<StudentState>({
    name: "",
    profileImage: null,
  });
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [filteredPopularTeachers, setFilteredPopularTeachers] = useState<
    Teacher[]
  >([]);
  const [filteredSpotlightTeachers, setFilteredSpotlightTeachers] = useState<
    Teacher[]
  >([]);
  const [allSpotlightTeachers, setAllSpotlightTeachers] = useState<Teacher[]>(
    []
  );
  const [allPopularTeachers, setAllPopularTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [allSpotlightSubjectTeachers, setAllSpotlightSubjectTeachers] =
    useState<Teacher[]>([]);
  const [allSpotlightSkillTeachers, setAllSpotlightSkillTeachers] = useState<
    Teacher[]
  >([]);

  const [allPopularSubjectTeachers, setAllPopularSubjectTeachers] = useState<
    Teacher[]
  >([]);
  const [allPopularSkillTeachers, setAllPopularSkillTeachers] = useState<
    Teacher[]
  >([]);

  const [activeSubText, setActiveSubText] = useState<string | null>(
    "Dashboard"
  );
  const [showAllPopular, setShowAllPopular] = useState(false);
  const { userType, userEmail } = useLocalSearchParams<{
    userType: string;
    userEmail: string;
  }>();
  const [storedUserEmail, setStoredUserEmail] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [spotLightTeachers, setSpotLightTeachers] = useState<Teacher[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [currentSection, setCurrentSection] = useState("home");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showAiText, setShowAiText] = useState(false);
  const [selectedAiTextIndex, setSelectedAiTextIndex] = useState(0);
  const aiTexts = [
    "According to our Intelligence, you have these teachers...",
    "Diving in the database for you...",
    "These are the research regarding your query",
    "Happy surfing.."
  ];

  useEffect(() => {
  if (isSearching && searchQuery.trim() !== "") {
    // Randomly select an AI text
    const randomIndex = Math.floor(Math.random() * aiTexts.length);
    setSelectedAiTextIndex(randomIndex);
  }
}, [isSearching, searchQuery]);

  // Fetch unread count on component mount and set up polling
  useEffect(() => {
    if (studentName) {
      // Fetch immediately
      fetchUnreadCount();
      
      // Set up polling every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      // Clean up interval on component unmount
      return () => clearInterval(interval);
    }
  }, [studentName, fetchUnreadCount]);

  const [selectedBoard, setSelectedBoard] = useState<{
    boardId: string;
    boardName: string;
    classId: string;
    className: string;
    subjectsPerClass: any[];
    selectedClass: string;
    selectedSubject: string;
  } | null>(null);

  useEffect(() => {
  // Create blinking animation
  const blinkAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  );

  blinkAnimation.start();

  // Cleanup animation on component unmount
  return () => {
    blinkAnimation.stop();
  };
}, []);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('🔍 [fetchUnreadCount] Fetching unread count...');
      const auth = await getAuthData();
      if (!auth?.token) {
        console.log('🔑 [fetchUnreadCount] No auth token found');
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/notifications/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📊 [fetchUnreadCount] Response:', response.data);
      
      if (response.data && typeof response.data.count === 'number') {
        console.log(`✅ [fetchUnreadCount] Setting unread count to: ${response.data.count}`);
        setUnreadCount(response.data.count);
      } else {
        console.log('⚠️ [fetchUnreadCount] Invalid response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (studentName) {
      fetchUnreadCount();
      
      // Set up polling every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [studentName, fetchUnreadCount]);

  const fetchProfileAndBalance = async () => {

    try {

      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);

      const auth = await getAuthData();
      if (!auth || !auth.email) {
        Alert.alert("Session Expired", "Please log in again.");
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
        }
      );

      const profileData = profileResponse.data;
  
      setStudent({
        name: profileData.name || "",
        profileImage: profileData.profileimage || null,
      });

      setStudentName(profileData.name || "");
      setProfileImage(profileData.profileimage || null);

      await AsyncStorage.multiSet([
        ["studentName", profileData.name || ""],
        ["profileImage", profileData.profileimage || ""],
      ]);

 
    } catch (error) {
      console.error("❌ Error fetching student profile or balance:", error);
      // Alert.alert("Error", "Failed to load profile and balance.");
    }
  };

useEffect(() => {
  const debounceTimer = setTimeout(() => {
    if (searchQuery.trim() !== "") {
      setIsSearching(true);
      setPage(1);
      setHasMoreData(true);
      fetchTeachers(false);
    } else {
      // When search query becomes empty, exit search mode immediately
      setIsSearching(false);
      setShowAiText(false);
      setPage(1);
      setHasMoreData(true);
      
      // Reset teachers to show all teachers instead of empty search results
      fetchTeachers(false);
    }
  }, 300); // Reduced debounce time for faster search
  
  return () => clearTimeout(debounceTimer);
}, [searchQuery]);

  useEffect(() => {
    if (showAllPopular) {
      fetchTeachers(page > 1);
    }
  }, [page]);

  useEffect(() => {
    fetchProfileAndBalance();
  }, []);

  useEffect(() => {
    
    const loadUserEmail = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("user_role");
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (storedEmail) {
          setStoredUserEmail(storedEmail);
          
          if (storedRole) {
            setUserRole(storedRole);
          }
        } else {
          console.log("No user email found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error loading user email:", error);
      }
    };
    loadUserEmail();
  }, []);

  useEffect(() => {
    if (showAllPopular) {
      fetchTeachers(page > 1);
    }
  }, [page]);


const fetchTeachers = useCallback(
  async (isLoadMore = false) => {
    if (loadingMore || !hasMoreData) return;

    try {
      setLoadingMore(true);

      const body: any = {
        count: 10,
        page,
      };
      
      // 🚨 CRITICAL: Always send search query to backend
      if (searchQuery.trim() !== "") {
        body.search = searchQuery.trim();
      }
      
      // 🚨 CRITICAL: Also send filters if they exist
      if (selectedClass) body.className = selectedClass;
      if (selectedSubject) body.subject = selectedSubject;
      if (selectedBoard?.boardName) body.board = selectedBoard.boardName;

      const auth = await getAuthData();
      if (!auth || !auth.token) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(
        `${BASE_URL}/api/teachers`,
        body,
        { headers }
      );

      console.log("📊 TEACHERS API RESPONSE with search:", { 
        searchQuery, 
        responseData: response.data 
      });

      const spotlightObj = response.data.spotlightTeachers || {};
      const popularObj = response.data.popularTeachers || {};

      const cleanTeacher = (teacher: any): Teacher => {
        let tuitions = [];
        let qualifications = [];

        try {
          tuitions = teacher?.tuitions ? JSON.parse(teacher.tuitions) : [];
        } catch (err) {
          console.warn("❌ Failed to parse tuitions for", teacher.email, err);
        }

        try {
          qualifications = teacher?.qualifications
            ? JSON.parse(teacher.qualifications)
            : [];
        } catch (err) {
          console.warn(
            "❌ Failed to parse qualifications for",
            teacher.email,
            err
          );
        }

        return {
          profilePic:
            typeof teacher.profilePic === "string"
              ? teacher.profilePic.replace(/"/g, "").trim()
              : require("../../../assets/images/Profile.png"),
          name: teacher.name || "Unknown",
          email: teacher.email || "Unknown",
          isPopular: !!teacher.isspotlight,
          tutions: tuitions,
          qualifications: qualifications,
          language: teacher.language || "",
          qualification: "",
        };
      };

      // Clean all teachers first
      const cleanedSubjectSpotlight = (spotlightObj["Subject teacher"] || []).map(cleanTeacher);
      const cleanedSkillSpotlight = (spotlightObj["Skill teacher"] || []).map(cleanTeacher);
      const cleanedSubjectPopular = (popularObj["Subject teacher"] || []).map(cleanTeacher);
      const cleanedSkillPopular = (popularObj["Skill teacher"] || []).map(cleanTeacher);

      // Apply additional client-side filtering for safety
      const filterByName = (teachers: Teacher[]) => {
        if (searchQuery.trim() === "") return teachers;
        
        const query = searchQuery.toLowerCase().trim();
        return teachers.filter(teacher => 
          teacher.name.toLowerCase().includes(query)
        );
      };

      const filteredSubjectSpotlight = filterByName(cleanedSubjectSpotlight);
      const filteredSkillSpotlight = filterByName(cleanedSkillSpotlight);
      const filteredSubjectPopular = filterByName(cleanedSubjectPopular);
      const filteredSkillPopular = filterByName(cleanedSkillPopular);

      // Deduplicate by email
      const seenEmails = new Set();
      const uniqueSubjectSpotlight: Teacher[] = [];
      const uniqueSkillSpotlight: Teacher[] = [];
      const uniqueSubjectPopular: Teacher[] = [];
      const uniqueSkillPopular: Teacher[] = [];

      // Process subject spotlight teachers
      for (const teacher of filteredSubjectSpotlight) {
        if (!seenEmails.has(teacher.email)) {
          seenEmails.add(teacher.email);
          uniqueSubjectSpotlight.push(teacher);
        }
      }

      // Process skill spotlight teachers
      for (const teacher of filteredSkillSpotlight) {
        if (!seenEmails.has(teacher.email)) {
          seenEmails.add(teacher.email);
          uniqueSkillSpotlight.push(teacher);
        }
      }

      // Process subject popular teachers
      for (const teacher of filteredSubjectPopular) {
        if (!seenEmails.has(teacher.email)) {
          seenEmails.add(teacher.email);
          uniqueSubjectPopular.push(teacher);
        }
      }

      // Process skill popular teachers
      for (const teacher of filteredSkillPopular) {
        if (!seenEmails.has(teacher.email)) {
          seenEmails.add(teacher.email);
          uniqueSkillPopular.push(teacher);
        }
      }

      const totalFetched = 
        uniqueSubjectSpotlight.length + 
        uniqueSkillSpotlight.length + 
        uniqueSubjectPopular.length + 
        uniqueSkillPopular.length;
        
      if (totalFetched < 10) {
        setHasMoreData(false);
      }

      if (isLoadMore) {
        setAllSpotlightSubjectTeachers((prev) => [
          ...prev,
          ...uniqueSubjectSpotlight,
        ]);
        setAllSpotlightSkillTeachers((prev) => [...prev, ...uniqueSkillSpotlight]);
        setAllPopularSubjectTeachers((prev) => [...prev, ...uniqueSubjectPopular]);
        setAllPopularSkillTeachers((prev) => [...prev, ...uniqueSkillPopular]);
      } else {
        setAllSpotlightSubjectTeachers(uniqueSubjectSpotlight);
        setAllSpotlightSkillTeachers(uniqueSkillSpotlight);
        setAllPopularSubjectTeachers(uniqueSubjectPopular);
        setAllPopularSkillTeachers(uniqueSkillPopular);
      }
    } catch (error) {
      console.error("❌ Error fetching teachers:", error);
      Alert.alert("Error", "Failed to fetch teachers.");
    } finally {
      setLoadingMore(false);
    }
  },
  [page, selectedClass, selectedSubject, searchQuery, loadingMore, hasMoreData]
);


const fetchInitialTeachers = useCallback(async () => {
  try {
    const auth = await getAuthData();
    if (!auth?.token) {
      Alert.alert("Session Expired", "Please log in again.");
      return;
    }

    const headers = {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      `${BASE_URL}/api/teachers`,
      { count: 10, page: 1 },
      { headers }
    );

    console.log("📊 INITIAL TEACHERS API RESPONSE (after clearing search):", response.data);

    const spotlightObj = response.data.spotlightTeachers || {};
    const popularObj = response.data.popularTeachers || {};

    const cleanTeacher = (teacher: any): Teacher => {
      let tuitions = [];
      let qualifications = [];

      try {
        tuitions = teacher?.tuitions ? JSON.parse(teacher.tuitions) : [];
      } catch (err) {
        console.warn("❌ Failed to parse tuitions for", teacher.email, err);
      }

      try {
        qualifications = teacher?.qualifications
          ? JSON.parse(teacher.qualifications)
          : [];
      } catch (err) {
        console.warn(
          "❌ Failed to parse qualifications for",
          teacher.email,
          err
        );
      }

      return {
        profilePic:
          typeof teacher.profilePic === "string"
            ? teacher.profilePic.replace(/"/g, "").trim()
            : require("../../../assets/images/Profile.png"),
        name: teacher.name || "Unknown",
        email: teacher.email || "Unknown",
        isPopular: !!teacher.isspotlight,
        tutions: tuitions,
        qualifications: qualifications,
        language: teacher.language || "",
        qualification: "",
      };
    };

    // Update all teacher lists with initial data (limited for homepage)
    setAllSpotlightSubjectTeachers((spotlightObj["Subject teacher"] || []).map(cleanTeacher).slice(0, 50));
    setAllSpotlightSkillTeachers((spotlightObj["Skill teacher"] || []).map(cleanTeacher).slice(0, 4));
    setAllPopularSubjectTeachers((popularObj["Subject teacher"] || []).map(cleanTeacher));
    setAllPopularSkillTeachers((popularObj["Skill teacher"] || []).map(cleanTeacher));

  } catch (error) {
    console.error("❌ Error fetching initial teachers:", error);
    Alert.alert("Error", "Failed to load teachers.");
  }
}, []);

  useEffect(() => {
    fetchTeachers(true);
  }, []);



  if (!fontsLoaded) return <Text>Loading...</Text>;
  const renderContent = () => {
    switch (currentSection) {
      case "spotlight":
        return <SpotLight onBack={() => setCurrentSection("home")} />;
      case "boards":
        return (
          <AllBoardsPage
            onBack={() => setCurrentSection("home")}
            onBoardSelect={(boardName: string, boardId: string) => {
             
              setSelectedBoard({ boardName, boardId });
              setCurrentSection("classSelection");
            }}
          />
        );
      case "classSelection":
        return (
          <ClassSelection
            boardName={selectedBoard?.boardName || ""}
            boardId={selectedBoard?.boardId || ""}
            onBack={() => setCurrentSection("boards")}
            onClassSelect={(selectedClass: {
              classId: string;
              className: string;
            }) => {
             
              setSelectedBoard((prev) => ({
                ...prev!,
                selectedClass,
                className: selectedClass.className,
                classId: selectedClass.classId,
                subjectsPerClass: selectedBoard?.subjectsPerClass || [],
              }));
              setCurrentSection("subjectSelection");
            }}
          />
        );
      case "subjectSelection":
        return (
          <SubjectSelection
            classId={selectedBoard?.classId || ""}
            boardId={selectedBoard?.boardId || ""}
            className={selectedBoard?.className || ""}
            boardName={selectedBoard?.boardName || ""}
            selectedClass={{
              classId: selectedBoard?.classId || "",
              className: selectedBoard?.className || "",
            }}
            onBack={() => setCurrentSection("classSelection")}
            onSubjectSelect={(selectedSubject) => {
           
              setSelectedBoard((prev) => ({
                ...prev!,
                selectedSubject,
              }));
              setCurrentSection("teachers");
            }}
          />
        );

      case "teachers":
  

        return (
          <TeachersList
            boardName={selectedBoard?.boardName || ""}
            selectedClass={
              selectedBoard?.selectedClass?.className ||
              selectedBoard?.className ||
              ""
            }
            selectedSubject={selectedBoard?.selectedSubject || ""}
            onBack={() => setCurrentSection("subjectSelection")}
          />
        );

      case "myTeachers":
        return <MyTeacher onBack={() => setCurrentSection("home")} />;

      case "skill":
        return (
          <AllSkills
            category="Skill teacher"
            onBack={() => setCurrentSection("home")}
            onSkillSelect={(selectedSkill: string) => {
            
              setSelectedBoard((prev) => ({
                ...prev!,
                selectedSkill,
              }));
              setCurrentSection("skillTeachers");
            }}
          />
        );

      case "skillTeachers":
        return (
          <SkillTeachers
            onBack={() => setCurrentSection("skill")}
            selectedSkill={selectedBoard?.selectedSkill || ""}
            allSpotlightSkillTeachers={allSpotlightSkillTeachers}
            allPopularSkillTeachers={allPopularSkillTeachers}
          />
        );

      case "skillspotlight":
        return (
          <SpotLightSkillteachers onBack={() => setCurrentSection("home")} />
        );
      case "home":
      default:
        return renderHome();
    }
  };
  
const MarqueeTeacherList = ({ teachers, isSkill = false, reverseDirection = false }: { teachers: Teacher[], isSkill?: boolean, reverseDirection?: boolean }) => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const SCROLL_SPEED = 1.8;
  const SCROLL_INTERVAL = 36;

  // Calculate dimensions for seamless looping
  const cardWidth = wp("29.33%");
  const cardMargin = wp("2.66%");
  const totalCardWidth = cardWidth + cardMargin;
  const totalContentWidth = totalCardWidth * teachers.length * 3; // 3 sets of data for smooth looping

  // Initialize scrollX after totalContentWidth is calculated
  const scrollX = useRef(reverseDirection ? totalContentWidth : 0);

  // Auto-scroll animation with seamless looping - UPDATED FOR REVERSE DIRECTION
  const startAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    
    scrollInterval.current = setInterval(() => {
      if (!isPaused && scrollViewRef.current && teachers.length > 0) {
        if (reverseDirection) {
          // Reverse direction: scroll from right to left
          scrollX.current -= SCROLL_SPEED;
          
          // Reset scroll position when reaching the start for seamless loop
          if (scrollX.current <= 0) {
            scrollX.current = totalContentWidth;
          }
        } else {
          // Normal direction: scroll from left to right
          scrollX.current += SCROLL_SPEED;
          
          // Reset scroll position when reaching the end for seamless loop
          if (scrollX.current >= totalContentWidth) {
            scrollX.current = 0;
          }
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
    if (teachers.length > 0) {
      startAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
  }, [isPaused, teachers.length]);

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  // If no teachers or very few, just display normally
  if (teachers.length <= 3) {
    return (
      <View style={styles.teachersRow}>
        {teachers.map((item, index) => (
          <TouchableOpacity
            key={`${item.email}-${index}`}
            style={styles.teacherCard}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                params: {
                  name: item.name,
                  email: item.email,
                  language: item.language,
                  profilePic: item.profilePic,
                  ...(isSkill && { profilepic: item.profilePic }),
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.profilePic }}
              style={styles.teacherImage}
              resizeMode="cover"
            />
            <Text style={styles.teacherName} numberOfLines={1}>{item.name}</Text>
            {!isSkill && (
              <Text style={styles.teacherSub} numberOfLines={1}>
                {item.tutions?.[0]?.subject || "Basic Subject"}
              </Text>
            )}
            {isSkill && (
              <Text style={styles.teacherSub} numberOfLines={1}>Skill Teacher</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.marqueeTeacherContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.marqueeTeacherContent}
        scrollEventThrottle={16}
        bounces={false}
        scrollEnabled={false}
      >
        {/* Multiple duplicate sets for truly infinite looping */}
        {[...teachers, ...teachers, ...teachers].map((teacher, index) => (
          <TouchableOpacity
            key={`teacher-${teacher.email}-${index}`}
            style={styles.teacherCard}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            activeOpacity={1}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                params: {
                  name: teacher.name,
                  email: teacher.email,
                  language: teacher.language,
                  profilePic: teacher.profilePic,
                  ...(isSkill && { profilepic: teacher.profilePic }),
                },
              });
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: teacher.profilePic }}
                style={styles.teacherImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.teacherName} numberOfLines={1}>{teacher.name}</Text>
            {!isSkill && (
              <Text style={styles.teacherSub} numberOfLines={1}>
                {teacher.tutions?.[0]?.subject || "Basic Subject"}
              </Text>
            )}
            {isSkill && (
              <Text style={styles.teacherSub} numberOfLines={1}>Skill Teacher</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const renderHome = () => {
  // Use search results if searching, otherwise use the preview data
  const displaySpotlightSubjectTeachers = isSearching 
    ? allSpotlightSubjectTeachers 
    : allSpotlightSubjectTeachers.slice(0, 50);

  const displaySpotlightSkillTeachers = isSearching 
    ? allSpotlightSkillTeachers 
    : allSpotlightSkillTeachers.slice(0, 4);

  // 🚨 FIX: Use View instead of ScrollView when searching to avoid nesting
  const ContainerComponent = isSearching ? View : ScrollView;
  const containerProps = isSearching ? {} : {
    contentContainerStyle: { paddingBottom: hp("13.45%") },
    showsVerticalScrollIndicator: false
  };

return (
    <ContainerComponent 
      style={{ flex: 1 }}
      {...containerProps}
    >
      {/* Show search results indicator when searching */}
      {isSearching && (
        <View style={styles.searchResultsContainer}>
          <Text style={[
            styles.searchResultsText,
            showAiText && { fontStyle: 'italic' }
          ]}>
            {showAiText 
              ? aiTexts[selectedAiTextIndex] 
              : `Search results for "${searchQuery}"`}
          </Text>
        </View>
      )}

      {/* Only show regular sections when NOT searching */}
      {!isSearching && (
        <>
          <View style={styles.mytutorsContainer}>
            <View style={styles.mytutorsContainerTitle}>
              <BookOpenReaderIcon
                width={wp("13.33%")}
                height={wp("13.33%")}
                color="#ffffff"
              />
              <Text style={styles.titleText}>My Tutors</Text>
            </View>
            <TouchableOpacity onPress={() => setCurrentSection("boards")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Spotlight Section - Only show header when NOT searching */}
      {(!isSearching || displaySpotlightSubjectTeachers.length > 0) && (
        <View style={styles.spotlight}>
          {/* Remove the spotlight header when searching */}
          {!isSearching && (
            <View style={styles.spotlightHeader}>
              <View style={{ flexDirection: "row", gap: wp("4%") }}>
                <View style={styles.spotlightT}>
                  <Text style={styles.tutors}>Tutors</Text>
                  <Text style={styles.spot}>Spotlight</Text>
                  <Animated.Text 
                    style={[
                      styles.trend, 
                      { opacity: blinkAnim }
                    ]}
                  >
                    Trending
                  </Animated.Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setCurrentSection("spotlight")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
          )}

        {displaySpotlightSubjectTeachers.length > 0 ? (
          <>
            {/* 🚨 FIX: Use horizontal FlatList only when not searching */}
            {!isSearching ? (
              <>
<MarqueeTeacherList 
  teachers={displaySpotlightSubjectTeachers} 
  isSkill={false}
/>
              </>
            ) : (
              // 🚨 FIX: Use regular View with map when searching
              <View style={styles.searchResultsList}>
                {displaySpotlightSubjectTeachers.map((item) => (
                  <TouchableOpacity
                    key={item.email}
                    style={styles.searchTeacherCard}
                    onPress={() => {
                      router.push({
                        pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                        params: {
                          name: item.name,
                          email: item.email,
                          language: item.language,
                          profilePic: item.profilePic,
                        },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: item.profilePic }}
                      style={styles.searchTeacherImage}
                      resizeMode="cover"
                    />
                    <View style={styles.searchTeacherInfo}>
                      <Text style={styles.teacherName}>{item.name}</Text>
                      <Text style={styles.teacherSub}>
                        {item.tutions?.[0]?.subject || "Basic Subject"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : isSearching ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No teachers found for "{searchQuery}"
            </Text>
          </View>
        ) : null}
      </View>
      )}

      {/* Only show other sections when not searching */}
      {!isSearching && (
        <>
          <View style={styles.thanksCard}>
            <Text style={styles.thanksTitle}>Thanksgiving is coming!</Text>
            <Text style={styles.thanksDescription}>
              Get up to 50% off for every course on your wishlist. Keep learning
              something every day. Enjoy!
            </Text>
          </View>

          {/* Skill Classes Section */}
          <View style={styles.mytutorsContainer}>
            <View style={styles.mytutorsContainerTitle}>
              <BookOpenReaderIcon width={50} height={50} color="#ffffff" />
              <Text style={styles.titleText}>Skill Classes</Text>
            </View>
            <TouchableOpacity onPress={() => setCurrentSection("skill")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

           {/* Skill Spotlight Section - Only show header when NOT searching */}
      {(!isSearching || displaySpotlightSkillTeachers.length > 0) && (
        <View style={styles.spotlight}>
          {/* Remove the skill spotlight header when searching */}
          {!isSearching && (
            <View style={styles.spotlightHeader}>
              <View style={{ flexDirection: "row", gap: 15 }}>
                <View style={styles.spotlightT}>
                  <Text style={styles.tutors}>Skill</Text>
                  <Text style={styles.spot}>Spotlight</Text>
                  <Animated.Text 
                    style={[
                      styles.trend, 
                      { opacity: blinkAnim }
                    ]}
                  >
                    Trending
                  </Animated.Text>

                </View>
              </View>

              {!isSearching && (
                <TouchableOpacity onPress={() => setCurrentSection("skillspotlight")}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        {displaySpotlightSkillTeachers.length > 0 ? (
          <>
            {/* 🚨 FIX: Use horizontal FlatList only when not searching */}
            {!isSearching ? (
              <>
                <MarqueeTeacherList 
                  teachers={displaySpotlightSkillTeachers} 
                  isSkill={true}
                  reverseDirection={true}
                />
              </>
            ) : (
              // 🚨 FIX: Use regular View with map when searching
              <View style={styles.searchResultsList}>
                {displaySpotlightSkillTeachers.map((item) => (
                  <TouchableOpacity
                    key={item.email}
                    style={styles.searchTeacherCard}
                    onPress={() => {
                      router.push({
                        pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                        params: {
                          name: item.name,
                          email: item.email,
                          profilepic: item.profilePic,
                        },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: item.profilePic }}
                      style={styles.searchTeacherImage}
                      resizeMode="cover"
                    />
                    <View style={styles.searchTeacherInfo}>
                      <Text style={styles.teacherName}>{item.name}</Text>
                      <Text style={styles.teacherSub}>Skill Teacher</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : isSearching ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No skill teachers found for "{searchQuery}"
            </Text>
          </View>
        ) : null}
      </View>
      )}
      
      {/* Only show offer banner when not searching */}
      {!isSearching && (
        <View style={styles.offerBanner}>
          <Image
            source={require("../../../assets/image/offer-banner.png")}
            style={styles.offerImage}
            resizeMode="cover"
          />
        </View>
      )}
    </ContainerComponent>
  );
};

  return (
    <View style={styles.container}>
<View style={styles.headerContainer}>
<View style={styles.logoContainer}>
  <Text style={styles.logoText}>GROWSMART</Text>
</View>

  <View style={styles.topRow}>
          {/* Profile */}
          <TouchableOpacity
            onPress={() => setIsSidebarVisible(true)}
            style={styles.profileContainer}
          >
            <Image
              style={styles.profileImage}
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../../assets/images/Profile.png")
              }
            />
          </TouchableOpacity>

 {/* Search */}
<View style={styles.searchRow}>
  <View style={styles.searchInputContainer}>
    <Image
      style={styles.searchIcon}
      source={require("../../../assets/images/Search.png")}
    />
    <TextInput
      style={styles.searchInput}
      placeholder="Search teachers"
      placeholderTextColor="#82878F"
      value={searchQuery}
      onChangeText={(text) => {
        setSearchQuery(text);
        if (text.trim() === "") {
          setIsSearching(false);
          setShowAiText(false);
          setPage(1);
          setHasMoreData(true);
          fetchTeachers(false);
        }
      }}
      returnKeyType="search"
      onSubmitEditing={() => {
        if (searchQuery.trim() !== "") {
          setIsSearching(true);
          setShowAiText(false); // Don't show AI text on traditional search
          setPage(1);
          setHasMoreData(true);
          fetchTeachers(false);
        }
      }}
    />
    
{/* Show AntDesign icon when typing */}
{searchQuery.length > 0 && (
  <TouchableOpacity 
    onPress={() => {
      if (searchQuery.trim() !== "") {
        setShowAiText(true);
        setIsSearching(true);
        setPage(1);
        setHasMoreData(true);
        fetchTeachers(false);
        
        // Randomly select an AI text
        const randomIndex = Math.floor(Math.random() * aiTexts.length);
        setSelectedAiTextIndex(randomIndex);
      }
    }}
    style={styles.questionButton}
  >
    <AntDesign name="question" size={wp("4.5%")} color="#5f5fff" />
  </TouchableOpacity>
)}
  </View>
</View>

          <TouchableOpacity
            onPress={() =>
              router.push("/(tabs)/StudentDashBoard/StudentNotification")
            }
          >
            <View style={{ position: "relative" }}>
              <NotificationBellIcon size={wp("6.4%")} />
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

      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSubText={activeSubText}
        setActiveSubText={setActiveSubText}
        studentName={studentName}
        profileImage={profileImage}
        userEmail={userEmail || ""}
        onItemPress={(itemName: string) => {
          setActiveMenu(itemName);
          if (itemName === "Billing") {
            router.push({
              pathname: "/(tabs)/Billing",
              params: {
                userEmail: storedUserEmail,
                userType: userRole,
              },
            });
          }
          if (itemName === "My Tuitions") {
            setCurrentSection("myTeachers");
          }
          if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
          if (itemName === "Share") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Share",
              params: { userEmail, studentName, profileImage },
            });
          }
          if (itemName === "Subscription") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Subscription",
              params: { userEmail },
            });
          }
          if (itemName === "Terms") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/TermsAndConditions",
            });
          }
          if (itemName === "Contact Us") {
         
            router.push({ pathname: "/(tabs)/Contact" });
          }
          if (itemName === "Privacy Policy") {
            router.push({ pathname: "/(tabs)/StudentDashBoard/PrivacyPolicy" });
          }
        }}
      />
      {renderContent()}
      <BottomNavigation userType="student" />
    </View>
  );
}


export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  carouselContainer: {
  height: wp("55%"),
  marginBottom: hp("2%"),
},
carouselWrapper: {
  flex: 1,
  justifyContent: 'center',
},
teachersRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flex: 1,
  paddingHorizontal: wp("1%"),
},
imageContainer: {
  position: 'relative',
  marginBottom: hp("1%"),
},
dotsContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: hp("2%"),
  gap: wp("1.5%"),
},
dotWrapper: {
  padding: wp("1%"),
},
dot: {
  width: wp("2%"),
  height: wp("2%"),
  borderRadius: wp("1%"),
},
activeDot: {
  backgroundColor: '#4255FF',
  width: wp("6%"),
},
inactiveDot: {
  backgroundColor: '#E5E7EB',
},
popularBadge: {
  position: 'absolute',
  top: -wp("1%"),
  right: -wp("1%"),
  backgroundColor: '#FF6B6B',
  paddingHorizontal: wp("2%"),
  paddingVertical: wp("0.5%"),
  borderRadius: wp("2%"),
},
popularText: {
  color: '#fff',
  fontSize: wp("2.5%"),
  fontFamily: "Poppins_700Bold",
},
searchTeacherImage: {
  width: wp("15%"),
  height: wp("15%"),
  borderRadius: wp("2%"),
  marginRight: wp("3%"),
},
searchTeacherInfo: {
  flex: 1,
},
//   clearButton: {
//   padding: wp("1%"),
//   marginLeft: wp("1%"),
// },
// clearButtonText: {
//   fontSize: wp("4%"),
//   color: "#666",
// },
//   searchResultsContainer: {
//     padding: wp("4%"),
//     backgroundColor: "#f8f9fa",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e9ecef",
//   },
  // searchResultsText: {
  //   fontSize: wp("4%"),
  //   fontFamily: "Poppins_400Regular",
  //   color: "#495057",
  //   textAlign: "center",
  // },
  searchResultsList: {
    flexDirection: "column",
    gap: 15,
  },
  searchTeacherCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
    marginBottom: hp("1%"),
    padding: wp("3%"),
    backgroundColor: "#f8f9fa",
    borderRadius: wp("2%"),
  },
  noResultsContainer: {
    padding: wp("5%"),
    alignItems: "center",
  },
  noResultsText: {
    fontSize: wp("4%"),
    fontFamily: "Poppins_400Regular",
    color: "#6c757d",
    textAlign: "center", 
  },
  // Update the headerContainer style:
headerContainer: { 
  backgroundColor: "#5f5fff", 
  paddingHorizontal: wp("4.8%"), 
  paddingTop: hp("5%"), // Reduced from hp("5.1%")
  paddingBottom: hp("2%"), // Reduced from hp("2.96%")
  borderBottomLeftRadius: wp("4.53%"), 
  borderBottomRightRadius: wp("4.53%"),
},
// Update the topRow style to have proper margin:
topRow: { 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "space-between", 
  width: "100%", 
  paddingHorizontal: wp("4%"),
},
  // headerContainer: { backgroundColor: "#5f5fff", paddingHorizontal: wp("4.8%"), paddingTop: hp("5.1%"), paddingBottom: hp("2.96%"), borderBottomLeftRadius: wp("4.53%"), borderBottomRightRadius: wp("4.53%") },
  // topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: wp("4%") },
  profileContainer: { justifyContent: "center", alignItems: "center", marginRight: wp("2%"), borderWidth: 1, borderColor: 'white', borderRadius: 100,  },
  profileImage: { width: wp("12%"), height: wp("12%"), borderRadius: wp("6%") },
  searchRow: { flex: 1, marginHorizontal: wp("2%") },
  // searchInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", paddingHorizontal: wp("3%"), borderRadius: wp("4.27%"), height: wp("10%") },
  searchIcon: { width: wp("4%"), height: wp("4%"), marginRight: wp("2%"), tintColor: "#000" },
  // searchInput: { flex: 1, fontFamily: "Montserrat_400Regular", fontSize: wp("3.73%"), color: "#7d7d7d", overflowX: "hidden", height: "100%", borderWidth: 0, outlineWidth: 0, width: "100%", paddingVertical: 0, textAlignVertical: "center" },
  spotlightT: { flexDirection: "row", alignItems: "center", gap: wp("0.8%"), flexShrink: 1 },
 tutors: { 
  color: "#454358", 
  fontSize: wp("5.33%"), 
  fontWeight: 500, 
  fontFamily: "Poppins_400Regular", 
  lineHeight: hp("4%") 
},
spot: { 
  color: "#03070e", 
  fontSize: wp("5.33%"), 
  fontWeight: 600, 
  fontFamily: "Poppins_600SemiBold",
  lineHeight: hp("4%"), 
  flexShrink: 1,
  flexWrap: 'nowrap', 
},
trend: { 
  color: "#ff0000", 
  lineHeight: hp("2.42%"), 
  fontSize: wp("3.73%"), 
  fontFamily: "OpenSans_500Medium" // Changed to OpenSans
},
teacherName: { 
  marginTop: hp("0.672%"), 
  fontSize: wp("4.27%"), 
  color: "#000000", 
  textAlign: "center", 
  fontFamily: "OpenSans_400Regular", // Keep this as is
  lineHeight: hp("3.23%") 
},
teacherSub: { 
  color: "rgba(27,27,27,0.6)", 
  fontSize: wp("3.733%"), 
  fontFamily: "OpenSans_400Regular", // Keep this as is
  lineHeight: hp("2.422%"), 
  textAlign: "center" 
},
  mytutorsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", margin: "auto", backgroundColor: "#dbe2ff", height: hp("10%"), paddingHorizontal: wp("5%"), paddingVertical: hp("1.5%"), marginHorizontal: wp("4%"), borderRadius: wp("4.533%"), marginTop: hp("2.69%"), borderWidth: wp("1.06%"), borderColor: "#5f5fff" },
  mytutorsContainerTitle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: wp("50%"), margin: "auto" },
 titleText: { 
  color: "#454358", 
  fontSize: wp("4.5%"), 
  fontFamily: "Roboto_500Medium", // Changed from Poppins_700Bold
  flex: 1, 
  marginLeft: wp("10%"),
  paddingVertical: -wp("4%") 
},
seeAllText: { 
  color: "#4255FF", 
  fontSize: wp("3.5%"), 
  fontWeight: "500", 
  fontFamily: "Roboto_500Medium" // Changed from Poppins_400Regular
},
  spotlight: { marginTop: hp("2.69%"), marginHorizontal: wp("4%") },
  spotlightHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp("1.345") },
  teacherCard: { marginRight: wp("2.66%"), alignItems: "center", width: wp("29.33%") },
  teacherImage: { width: wp("29.33%"), height: wp("29.33%"), borderRadius: wp("0.8%"), backgroundColor: "rgba(201,59,59,0)" },
 thanksCard: { 
  height: hp("20%"), 
  backgroundColor: "#663259", 
  marginTop: hp("2.69%"), 
  paddingVertical: hp("5%"), // Changed from padding: wp("4%")
  paddingHorizontal: wp("4%"), // Added horizontal padding
  justifyContent: "center" 
},
 thanksTitle: { 
  color: "#fff", 
  fontSize: wp("5%"), 
  fontWeight: "600", 
  marginBottom: hp("2.08%"), 
  fontFamily: "OpenSans_500Medium" // Already correct - keep this
},
thanksDescription: { 
  color: "#FFFFFF80", 
  fontFamily: "OpenSans_300Light", // Already correct - keep this
  fontSize: wp("3.5%"), 
  lineHeight: wp("5.5%") 
},
  offerBanner: { marginTop: hp("2.69%"), alignItems: "center", marginBottom: hp("2.69%") },
  offerImage: { width: wp("98%"), height: wp("50%"),  },
  notificationBadge: { position: "absolute", top: hp("-0.538%"), right: wp("-1.066%"), backgroundColor: "red", borderRadius: wp("2.666%"), minWidth: wp("4.8%"), height: wp("4.8%"), justifyContent: "center", alignItems: "center", paddingHorizontal: wp("1.065%"), zIndex: 1 },
  notificationText: { color: "white", fontSize: wp("3.2%"), fontWeight: "bold" },
marqueeTeacherContainer: {
  height: wp("55%"),
  marginBottom: -hp("2%"),
  overflow: 'hidden',
},
marqueeTeacherContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingRight: wp('10%'),
},

// In the styles object, add this style:
logoContainer: {
  alignItems: 'center',
  width: '100%',
  marginBottom: hp('3%'), // Adjust spacing as needed
},
logoText: {
  color: '#e5e7eb',
  fontSize: wp('4%'), // Using wp for responsive font size
  fontFamily: 'Poppins_400Regular', // Using the loaded font
  fontWeight: '500',
  lineHeight: hp('1.6%'), // Using hp for responsive line height
  textAlign: 'center',
  letterSpacing: wp('0.2%'), // Optional: add some letter spacing for better appearance
  top: hp("2%"),
  bottom: hp("3%")
},
logoImage: {
  width: wp('20%'),
  height: wp('20%'), // Adjust aspect ratio as needed
  marginTop: -hp('5%'),
  marginBottom: -hp("1.5%"),
},
// questionButton: {
//   padding: wp("1%"),
//   marginLeft: wp("1%"),
//   justifyContent: "center",
//   alignItems: "center",
// },

// clearButton: {
//   padding: wp("1%"),
//   marginLeft: wp("1%"),
// },

// clearButtonText: {
//   fontSize: wp("4%"),
//   color: "#666",
// },

searchResultsContainer: {
  padding: wp("4%"),
  backgroundColor: "#f8f9fa",
  borderBottomWidth: 1,
  borderBottomColor: "#e9ecef",
},

searchResultsText: {
  fontSize: wp("4%"),
  fontFamily: "Poppins_400Regular",
  color: "#495057",
  textAlign: "center",
},
rightIconsContainer: {
  flexDirection: "row",
  alignItems: "center",
},

questionButton: {
  paddingHorizontal: wp("2%"),
  paddingVertical: wp("1%"),
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#ffffff", // Add background color
  borderRadius: wp("2%"), // Add border radius
  borderWidth: 1, // Add border
  borderColor: "#5f5fff", // Match the icon color
  marginLeft: wp("1%"), // Add some spacing
},
clearButton: {
  paddingHorizontal: wp("2%"),
  paddingVertical: wp("1%"),
},

clearButtonText: {
  fontSize: wp("4%"),
  color: "#666",
},

searchInputContainer: { 
  flexDirection: "row", 
  alignItems: "center", 
  backgroundColor: "#f1f1f1", 
  paddingHorizontal: wp("2%"), // Reduced padding
  borderRadius: wp("4.27%"), 
  height: wp("10%") 
},

searchInput: { 
  flex: 1, 
  fontFamily: "Montserrat_400Regular", 
  fontSize: wp("3.73%"), 
  color: "#7d7d7d", 
  overflowX: "hidden", 
  height: "100%", 
  borderWidth: 0, 
  outlineWidth: 0, 
  width: "100%", 
  paddingVertical: -wp("1%"), 
  textAlignVertical: "center",
  paddingHorizontal: wp("1%"), // Added padding
},
});