import { AntDesign, FontAwesome } from '@expo/vector-icons';
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import BookOpenReaderIcon from "../../../assets/svgIcons/BookOpenReader";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Roboto_500Medium, Roboto_400Regular } from "@expo-google-fonts/roboto";
import { OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Montserrat_400Regular } from "@expo-google-fonts/montserrat";
import { isTablet } from "../../../utils/devices";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, PanResponder, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
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
import LeftScreen from './LeftScreen';
import RightScreen from './RightScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

try {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    if (!RazorpayCheckout) {
      console.log("Razorpay module not available");
    }
  }
} catch (error) {
  console.log("Razorpay module not available:", error);
}

interface StudentState {
  name: string;
  profileImage: string | null;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  profilePic?: string | null;
  qualifications?: string[];
  subjects?: string[];
  isPopular?: boolean;
  rating?: number;
  experience?: number;
  price?: number;
  about?: string;
  tutions?: any[];
  language?: string;
  qualification?: string;
}

const SWIPE_THRESHOLD = 0.2;
const VELOCITY_THRESHOLD = 0.5;
const SCREEN_COUNT = 3;

export default function Home() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { width } = Dimensions.get('window');
  const [currentScreenIndex, setCurrentScreenIndex] = useState(1);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartX = useRef(0);
  const isSwipeLocked = useRef(false);

const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => false,

    onMoveShouldSetPanResponder: (_, { dx, dy }) => {
      // Prevent new gestures while animating
      if (isSwipeLocked.current) return false;
      
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      // Only set responder if horizontal swipe is significant and more horizontal than vertical
      return absDx > 15 && absDx > absDy * 1.5;
    },

    onPanResponderGrant: () => {
      if (isSwipeLocked.current) return;
      setIsSwiping(true);
      swipeAnim.stopAnimation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    onPanResponderMove: (_, { dx }) => {
      if (isSwipeLocked.current) return;

      // Calculate the target position based on current screen index and drag
      let newPosition = -width * currentScreenIndex + dx;

      // Apply boundaries with resistance
      const min = -width * (SCREEN_COUNT - 1);
      const max = 0;
      
      // Add resistance when trying to go beyond boundaries
      if (currentScreenIndex === 0 && dx > 0) {
        newPosition = dx * 0.2; // Strong resistance at first screen (LeftScreen)
      } else if (currentScreenIndex === SCREEN_COUNT - 1 && dx < 0) {
        newPosition = -width * (SCREEN_COUNT - 1) + dx * 0.2; // Strong resistance at last screen (RightScreen)
      }

      swipeAnim.setValue(Math.max(min, Math.min(max, newPosition)));
    },

    onPanResponderRelease: (_, { dx, vx }) => {
      if (isSwipeLocked.current) return;

      setIsSwiping(false);

      let newIndex = currentScreenIndex;
      
      // Calculate swipe threshold based on screen width
      const swipeThreshold = width * 0.3; // 30% of screen width (increased for intentional swipes)
      const velocityThreshold = 0.3;
      
      // Determine swipe direction
      const isSwipingLeft = dx < -swipeThreshold || (dx < 0 && Math.abs(vx) > velocityThreshold);
      const isSwipingRight = dx > swipeThreshold || (dx > 0 && Math.abs(vx) > velocityThreshold);
      
      // Screen indices: 0 = LeftScreen, 1 = Student (middle), 2 = RightScreen
      if (isSwipingLeft && currentScreenIndex < SCREEN_COUNT - 1) {
        // Swipe left -> move to next screen (higher index)
        newIndex = currentScreenIndex + 1;
      } else if (isSwipingRight && currentScreenIndex > 0) {
        // Swipe right -> move to previous screen (lower index)
        newIndex = currentScreenIndex - 1;
      }

      // Ensure index is within bounds
      newIndex = Math.max(0, Math.min(SCREEN_COUNT - 1, newIndex));

      // Lock during snap animation
      isSwipeLocked.current = true;

      // Animate to the new position
      Animated.spring(swipeAnim, {
        toValue: -width * newIndex,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
        overshootClamping: true,
      }).start(() => {
        isSwipeLocked.current = false;
        setCurrentScreenIndex(newIndex);
      });

      if (newIndex !== currentScreenIndex) {
        Haptics.selectionAsync();
      }
    },

    onPanResponderTerminate: () => {
      setIsSwiping(false);
      if (!isSwipeLocked.current) {
        // If gesture is terminated, snap back to current screen
        Animated.spring(swipeAnim, {
          toValue: -width * currentScreenIndex,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
          overshootClamping: true,
        }).start();
      }
    },
  })
).current;

  useEffect(() => {
    swipeAnim.setValue(-width);
    setCurrentScreenIndex(1);
  }, []);

  const { height } = Dimensions.get('window');
  
  const [fontsLoaded] = useFonts({
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
  const [student, setStudent] = useState<StudentState>({ name: "", profileImage: null });
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [filteredPopularTeachers, setFilteredPopularTeachers] = useState<Teacher[]>([]);
  const [filteredSpotlightTeachers, setFilteredSpotlightTeachers] = useState<Teacher[]>([]);
  const [allSpotlightTeachers, setAllSpotlightTeachers] = useState<Teacher[]>([]);
  const [allPopularTeachers, setAllPopularTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [allSpotlightSubjectTeachers, setAllSpotlightSubjectTeachers] = useState<Teacher[]>([]);
  const [allSpotlightSkillTeachers, setAllSpotlightSkillTeachers] = useState<Teacher[]>([]);
  const [allPopularSubjectTeachers, setAllPopularSubjectTeachers] = useState<Teacher[]>([]);
  const [allPopularSkillTeachers, setAllPopularSkillTeachers] = useState<Teacher[]>([]);
  const [activeSubText, setActiveSubText] = useState<string | null>("Dashboard");
  const [showAllPopular, setShowAllPopular] = useState(false);
  const { userType, userEmail } = useLocalSearchParams<{ userType: string; userEmail: string }>();
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
      const randomIndex = Math.floor(Math.random() * aiTexts.length);
      setSelectedAiTextIndex(randomIndex);
    }
  }, [isSearching, searchQuery]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        console.log("❌ [fetchUnreadCount] No auth token available");
        return;
      }

      console.log("🔔 [fetchUnreadCount] Fetching unread count...");
      const response = await axios.get(
        `${BASE_URL}/api/notifications/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("📊 [fetchUnreadCount] Response:", response.data);
      if (response.data && typeof response.data.count === 'number') {
        setUnreadCount(response.data.count);
        console.log("✅ [fetchUnreadCount] Unread count set to:", response.data.count);
      } else {
        console.log("⚠️ [fetchUnreadCount] Invalid response format:", response.data);
      }
    } catch (error: any) {
      console.error("❌ [fetchUnreadCount] Error fetching unread count:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
    }
  }, []);

  useEffect(() => {
    console.log("🔔 [useEffect] Checking storedUserEmail:", storedUserEmail);
    if (storedUserEmail) {
      console.log("🔔 [useEffect] Starting fetchUnreadCount and interval");
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => {
        console.log("🔔 [useEffect] Cleaning up interval");
        clearInterval(interval);
      };
    } else {
      console.log("🔔 [useEffect] No storedUserEmail, skipping fetch");
    }
  }, [storedUserEmail, fetchUnreadCount]);

  const fetchProfileAndBalance = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const { email } = auth;
      
      if (email === "student1@example.com") {
        console.log('🔓 [fetchProfileAndBalance] Using student1 bypass - accessing REAL data');
      }

      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };

      const profileResponse = await axios.post(
        `${BASE_URL}/api/userProfile`,
        { email },
        { headers }
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
   
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('🔒 [fetchProfileAndBalance] Authentication failed - using fallback');
      } else {
        console.log('🌐 [fetchProfileAndBalance] Network error - using fallback');
      }
      
      console.log("🔄 Using fallback student data");
      const cachedName = await AsyncStorage.getItem("studentName");
      const cachedImage = await AsyncStorage.getItem("profileImage");
      
      if (cachedName) {
        setStudent({
          name: cachedName,
          profileImage: cachedImage || null,
        });
        setStudentName(cachedName);
        setProfileImage(cachedImage || null);
      } else {
        setStudent({
          name: "Student",
          profileImage: null,
        });
        setStudentName("Student");
        setProfileImage(null);
      }
    }
  };

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
    return () => blinkAnimation.stop();
  }, []);

  useEffect(() => {
    fetchProfileAndBalance();
  }, []);

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("user_role");
        const storedEmail = await AsyncStorage.getItem("userEmail");
        console.log("🔔 [loadUserEmail] Retrieved from AsyncStorage:", { storedRole, storedEmail });
        
        if (storedEmail) {
          setStoredUserEmail(storedEmail);
          if (storedRole) {
            setUserRole(storedRole);
          }
          console.log("✅ [loadUserEmail] User data loaded successfully");
        } else {
          console.log("⚠️ [loadUserEmail] No user email found in AsyncStorage");
          const auth = await getAuthData();
          if (auth?.email) {
            console.log("🔄 [loadUserEmail] Using auth data fallback:", auth.email);
            setStoredUserEmail(auth.email);
            if (auth.role) {
              setUserRole(auth.role);
            }
          }
        }
      } catch (error) {
        console.error("❌ [loadUserEmail] Error loading user email:", error);
      }
    };
    loadUserEmail();
  }, []);

  const fetchTeachers = useCallback(
    async (isLoadMore = false) => {
      if (loadingMore || !hasMoreData) return;

      try {
        setLoadingMore(true);

        const body: any = {
          count: 10,
          page,
        };
        
        if (searchQuery.trim() !== "") {
          body.search = searchQuery.trim();
        }
        
        if (selectedClass) body.className = selectedClass;
        if (selectedSubject) body.subject = selectedSubject;
        if (selectedBoard?.boardName) body.board = selectedBoard.boardName;

        const auth = await getAuthData();
        if (!auth || !auth.token) {
          Alert.alert("Session Expired", "Please log in again.");
          return;
        }

        if (auth.email === "student1@example.com") {
          console.log('🔓 [fetchTeachers] Using student1 bypass - but accessing REAL data');
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
            console.warn(" Failed to parse tuitions for", teacher.email, err);
          }

          try {
            qualifications = teacher?.qualifications
              ? JSON.parse(teacher.qualifications)
              : [];
          } catch (err) {
            console.warn(
              " Failed to parse qualifications for",
              teacher.email,
              err
            );
          }

          return {
            _id: teacher._id || teacher.email,
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

        const cleanedSubjectSpotlight = (spotlightObj["Subject teacher"] || []).map(cleanTeacher);
        const cleanedSkillSpotlight = (spotlightObj["Skill teacher"] || []).map(cleanTeacher);
        const cleanedSubjectPopular = (popularObj["Subject teacher"] || []).map(cleanTeacher);
        const cleanedSkillPopular = (popularObj["Skill teacher"] || []).map(cleanTeacher);

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

        const seenEmails = new Set();
        const uniqueSubjectSpotlight: Teacher[] = [];
        const uniqueSkillSpotlight: Teacher[] = [];
        const uniqueSubjectPopular: Teacher[] = [];
        const uniqueSkillPopular: Teacher[] = [];

        for (const teacher of filteredSubjectSpotlight) {
          if (!seenEmails.has(teacher.email)) {
            seenEmails.add(teacher.email);
            uniqueSubjectSpotlight.push(teacher);
          }
        }

        for (const teacher of filteredSkillSpotlight) {
          if (!seenEmails.has(teacher.email)) {
            seenEmails.add(teacher.email);
            uniqueSkillSpotlight.push(teacher);
          }
        }

        for (const teacher of filteredSubjectPopular) {
          if (!seenEmails.has(teacher.email)) {
            seenEmails.add(teacher.email);
            uniqueSubjectPopular.push(teacher);
          }
        }

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
      } catch (error: any) {
        if (error.response?.status === 403) {
          console.log('🔒 [fetchTeachers] Authentication failed - using fallback');
        } else {
          console.log('🌐 [fetchTeachers] Network error - using fallback');
        }
        
        console.log("🔄 Using fallback teacher data");
        const mockTeachers: Teacher[] = [
          {
            _id: "1",
            name: "Dr. Sarah Johnson",
            email: "sarah.j@example.com",
            profilePic: null,
            isPopular: true,
            tutions: [{ subject: "Mathematics", grade: "10" }],
            qualifications: ["PhD in Mathematics"],
            language: "English"
          },
          {
            _id: "2", 
            name: "Prof. Michael Chen",
            email: "michael.c@example.com",
            profilePic: null,
            isPopular: true,
            tutions: [{ subject: "Physics", grade: "12" }],
            qualifications: ["MSc in Physics"],
            language: "English"
          }
        ];
        
        setAllSpotlightSubjectTeachers(mockTeachers.slice(0, 1));
        setAllSpotlightSkillTeachers(mockTeachers.slice(0, 1));
        setAllPopularSubjectTeachers(mockTeachers);
        setAllPopularSkillTeachers(mockTeachers.slice(0, 1));
        setHasMoreData(false);
      } finally {
        setLoadingMore(false);
      }
    },
    [page, selectedClass, selectedSubject, searchQuery, loadingMore, hasMoreData, selectedBoard]
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
          _id: teacher._id || teacher.email,
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

  if (!fontsLoaded) return <Text style={{fontFamily: 'Poppins_400Regular', fontSize: 16, textAlign: 'center', marginTop: 50}}>Loading...</Text>;

  const renderContent = () => {
    switch (currentSection) {
      case "spotlight":
        return <SpotLight onBack={() => setCurrentSection("home")} />;
      case "boards":
        return (
          <AllBoardsPage
            onBack={() => setCurrentSection("home")}
            onBoardSelect={(boardName: string, boardId: string) => {
              setSelectedBoard({ boardName, boardId } as any);
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
                subjectsPerClass: prev?.subjectsPerClass || [],
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

    const cardWidth = wp("28%");
    const cardMargin = wp("1.6%");
    const totalCardWidth = cardWidth + cardMargin;
    const totalContentWidth = totalCardWidth * teachers.length * 3;

    const scrollX = useRef(reverseDirection ? totalContentWidth : 0);

    const startAutoScroll = () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
      
      scrollInterval.current = setInterval(() => {
        if (!isPaused && scrollViewRef.current && teachers.length > 0) {
          if (reverseDirection) {
            scrollX.current -= SCROLL_SPEED;
            if (scrollX.current <= 0) {
              scrollX.current = totalContentWidth;
            }
          } else {
            scrollX.current += SCROLL_SPEED;
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
                source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")}
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
          {[...teachers, ...teachers, ...teachers].map((teacher, index) => (
            <TouchableOpacity
              key={`teacher-${teacher.email}-${index}`}
              style={styles.teacherCard}
              onPressIn={handleTouchStart}
              onPressOut={handleTouchEnd}
              activeOpacity={0.8}
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
              <Image
                source={teacher.profilePic ? { uri: teacher.profilePic } : require("../../../assets/images/Profile.png")}
                style={styles.teacherImage}
                resizeMode="cover"
              />
              <Text style={styles.teacherName} numberOfLines={1}>{teacher.name}</Text>
              {!isSkill && (
                <Text style={styles.teacherSub} numberOfLines={1}>
                  {teacher.tutions?.[0]?.subject || "Subject"}
                </Text>
              )}
              {isSkill && (
                <Text style={styles.teacherSub} numberOfLines={1}>Skill</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderHome = () => {
    const displaySpotlightSubjectTeachers = isSearching 
      ? allSpotlightSubjectTeachers 
      : allSpotlightSubjectTeachers.slice(0, 50);

    const displaySpotlightSkillTeachers = isSearching 
      ? allSpotlightSkillTeachers 
      : allSpotlightSkillTeachers.slice(0, 4);

    const ContainerComponent = isSearching ? View : ScrollView;
    const containerProps = isSearching ? {} : {
      contentContainerStyle: { paddingBottom: hp("13.45%") },
      showsVerticalScrollIndicator: false
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ContainerComponent 
          style={{ flex: 1 }}
          {...containerProps}
        >
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

          {!isSearching && (
            <>
              <View style={styles.mytutorsContainer}>
                <TouchableOpacity onPress={() => setCurrentSection("boards")}>
                  <View style={styles.mytutorsContainerTitle}>
                    <BookOpenReaderIcon
                      width={wp("13.33%")}
                      height={wp("13.33%")}
                      color="#ffffff"
                    />
                    <Text style={styles.titleText}>My Tutors</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {(!isSearching || displaySpotlightSubjectTeachers.length > 0) && (
            <View style={styles.spotlight}>
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
                  {!isSearching ? (
                    <>
                      <MarqueeTeacherList 
                        teachers={displaySpotlightSubjectTeachers} 
                        isSkill={false}
                      />
                    </>
                  ) : (
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
                            source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")}
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

          {!isSearching && (
            <>
              <Image 
                source={require("../../../assets/images/growsmart.png")} 
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
              />

              <View style={styles.mytutorsContainer}>
                <TouchableOpacity onPress={() => setCurrentSection("skill")}>
                  <View style={styles.mytutorsContainerTitle}>
                    <BookOpenReaderIcon width={50} height={50} color="#ffffff" />
                    <Text style={styles.titleText}>Skill Classes</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(!isSearching || displaySpotlightSkillTeachers.length > 0) && (
            <View style={styles.spotlight}>
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
                  {!isSearching ? (
                    <>
                      <MarqueeTeacherList 
                        teachers={displaySpotlightSkillTeachers} 
                        isSkill={true}
                        reverseDirection={true}
                      />
                    </>
                  ) : (
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
                            source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")}
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        <Animated.View
          style={[
            styles.swipeContent,
            {
              transform: [{ translateX: swipeAnim }],
              width: width * SCREEN_COUNT,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.screen, { width }]}>
            <LeftScreen />
          </View>
          
          <View style={[styles.screen, { width }]}>
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>GROWSMART</Text>
              </View>

              <View style={styles.topRow}>
                {/* Left: Profile */}
                <View style={styles.leftSection}>
                  <TouchableOpacity
                    onPress={() => setIsSidebarVisible(true)}
                    style={styles.profileContainer}
                  >
                    <Image
                      style={styles.profileImage}
                      source={
                        profileImage
                          ? { uri: profileImage }
                          : require("../../../assets/image/Person1.jpeg")
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Center: Search Bar with full width */}
                <View style={styles.centerSection}>
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
                          setShowAiText(false);
                          setPage(1);
                          setHasMoreData(true);
                          fetchTeachers(false);
                        }
                      }}
                    />
                    
                    {searchQuery.length > 0 && (
                      <TouchableOpacity 
                        onPress={() => {
                          if (searchQuery.trim() !== "") {
                            setShowAiText(true);
                            setIsSearching(true);
                            setPage(1);
                            setHasMoreData(true);
                            fetchTeachers(false);
                            
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

                {/* Right: Notification */}
                <View style={styles.rightSection}>
                  <TouchableOpacity 
                    style={styles.notificationButton}
                    onPress={() => {
                      console.log('Notification button pressed');
                    }}
                  >
                    <NotificationBellIcon width={wp("6%")} height={wp("6%")} color="#fff" />
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.contentContainer}>
              {renderContent()}
            </View>
          </View>
          
          <View style={[styles.screen, { width }]}>
            <RightScreen />
          </View>
        </Animated.View>
        
        {/* Swipe Indicators */}
        <View style={styles.swipeIndicators}>
          <View style={styles.indicatorContainer}>
            <TouchableOpacity 
              style={[styles.indicatorDot, currentScreenIndex === 0 && styles.activeIndicatorDot]}
              onPress={() => {
                if (!isSwipeLocked.current && currentScreenIndex !== 0) {
                  isSwipeLocked.current = true;
                  Animated.spring(swipeAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                    overshootClamping: true,
                    restSpeedThreshold: 0.1,
                    restDisplacementThreshold: 0.1,
                  }).start(() => {
                    isSwipeLocked.current = false;
                    setCurrentScreenIndex(0);
                  });
                }
              }}
            >
              <Text style={[styles.indicatorText, currentScreenIndex === 0 && styles.activeIndicatorText]}>Teachers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.indicatorDot, currentScreenIndex === 1 && styles.activeIndicatorDot]}
              onPress={() => {
                if (!isSwipeLocked.current && currentScreenIndex !== 1) {
                  isSwipeLocked.current = true;
                  Animated.spring(swipeAnim, {
                    toValue: -width,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                    overshootClamping: true,
                    restSpeedThreshold: 0.1,
                    restDisplacementThreshold: 0.1,
                  }).start(() => {
                    isSwipeLocked.current = false;
                    setCurrentScreenIndex(1);
                  });
                }
              }}
            >
              <Text style={[styles.indicatorText, currentScreenIndex === 1 && styles.activeIndicatorText]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.indicatorDot, currentScreenIndex === 2 && styles.activeIndicatorDot]}
              onPress={() => {
                if (!isSwipeLocked.current && currentScreenIndex !== 2) {
                  isSwipeLocked.current = true;
                  Animated.spring(swipeAnim, {
                    toValue: -width * 2,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                    overshootClamping: true,
                    restSpeedThreshold: 0.1,
                    restDisplacementThreshold: 0.1,
                  }).start(() => {
                    isSwipeLocked.current = false;
                    setCurrentScreenIndex(2);
                  });
                }
              }}
            >
              <Text style={[styles.indicatorText, currentScreenIndex === 2 && styles.activeIndicatorText]}>Thoughts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeItem={activeMenu}
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
      <BottomNavigation userType="student" />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  screen: { flex: 1 },
  swipeContainer: { flex: 1, overflow: "hidden", backgroundColor: "#fff" },
  swipeContent: { flex: 1, flexDirection: "row", height: "100%" },
  fullScreenContainer: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  
  // Top Header Styles (matching Messages screen)
  topHeader: { 
    backgroundColor: "#5f5fff", 
    paddingTop: STATUS_BAR_HEIGHT + (SCREEN_HEIGHT * 0.015), 
    paddingBottom: SCREEN_HEIGHT * 0.015, 
    paddingHorizontal: SCREEN_WIDTH * 0.065 
  },
  topHeaderContent: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    minHeight: SCREEN_HEIGHT * 0.05,
    width: '100%',
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  leftSection: {
    width: wp('12%'),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('2%'),
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SCREEN_HEIGHT * 0.005,
  },
  rightSection: {
    width: wp('12%'),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  growsmartText: {
    color: '#e5e7eb',
    fontSize: wp('3.78%'),
    fontFamily: 'Poppins_400Regular',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: wp('0.15%'),
  },
  
  // Search Bar integrated in header
  searchBarInHeader: {
    marginTop: SCREEN_HEIGHT * 0.005,
  },
  
  // Search Bar Container (deprecated, keeping for compatibility)
  searchBarContainer: {
    paddingHorizontal: wp("4.8%"),
    paddingVertical: hp("1%"),
    backgroundColor: "#fff",
  },
  
  headerContainer: { backgroundColor: "#5f5fff", paddingHorizontal: wp("4.8%"), paddingTop: hp("5%"), paddingBottom: hp("2%"), borderBottomLeftRadius: wp("4.53%"), borderBottomRightRadius: wp("4.53%") },
  screenContainer: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" },
  carouselContainer: { height: wp("55%"), marginBottom: hp("2%") },
  carouselWrapper: { flex: 1, justifyContent: "center" },
  teachersRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flex: 1, paddingHorizontal: wp("1%") },
  swipeIndicator: { position: "absolute", bottom: hp("10%"), alignSelf: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: wp("4%"), paddingVertical: hp("1%"), borderRadius: wp("2%") },
  swipeHintText: { fontSize: wp("3%"), color: "#666", marginBottom: hp("1%"), fontFamily: "Poppins_400Regular" },
  dotContainer: { flexDirection: "row", gap: wp("2%") },
  dot: { width: wp("2%"), height: wp("2%"), borderRadius: wp("1%"), backgroundColor: "#ddd" },
  activeDot: { backgroundColor: "#5f5fff", width: wp("4%") },
  navButtonContainer: { position: "absolute", flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: wp("5%"), top: "50%", marginTop: -30, zIndex: 10 },
  navButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(95,95,255,0.8)", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  navButtonText: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  imageContainer: { position: "relative", marginBottom: hp("1%") },
  dotsContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: hp("2%"), gap: wp("1.5%") },
  dotWrapper: { padding: wp("1%") },
  inactiveDot: { backgroundColor: "#E5E7EB" },
  popularBadge: { position: "absolute", top: -wp("1%"), right: -wp("1%"), backgroundColor: "#FF6B6B", paddingHorizontal: wp("2%"), paddingVertical: wp("0.5%"), borderRadius: wp("2%") },
  popularText: { color: "#fff", fontSize: wp("2.5%"), fontFamily: "Poppins_700Bold" },
  searchTeacherImage: { width: wp("15%"), height: wp("15%"), borderRadius: wp("2%"), marginRight: wp("3%") },
  searchTeacherInfo: { flex: 1 },
  searchResultsList: { flexDirection: "column", gap: 15 },
  searchTeacherCard: { width: "100%", flexDirection: "row", alignItems: "center", marginRight: 0, marginBottom: hp("1%"), padding: wp("3%"), backgroundColor: "#f8f9fa", borderRadius: wp("2%") },
  noResultsContainer: { padding: wp("5%"), alignItems: "center" },
  noResultsText: { fontSize: wp("4%"), fontFamily: "Poppins_400Regular", color: "#6c757d", textAlign: "center" },
  logoContainer: { alignItems: "center", marginBottom: hp("1.5%") },
  logoText: { color: '#e5e7eb', fontSize: wp('3.7%%'), fontFamily: 'Poppins_400Regular' },
  profileContainer: { justifyContent: "center", alignItems: "center", marginRight: wp("2%"), borderWidth: 1, borderColor: "white", borderRadius: 100 },
  searchRow: { flex: 1, marginHorizontal: wp("2%") },
  searchInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", paddingHorizontal: wp("3%"), borderRadius: wp("4.27%"), height: wp("10%") },
  searchIcon: { width: wp("6%"), height: wp("6%"), marginRight: wp("2%"), tintColor: "#000" },
  searchInput: { flex: 1, fontFamily: "Montserrat_400Regular", fontSize: wp("3.73%"), color: "#7d7d7d", overflow: "hidden", height: "100%", borderWidth: 0, outlineWidth: 0, width: "100%", paddingVertical: -wp("1%"), textAlignVertical: "center", paddingHorizontal: wp("1%") },
  questionButton: { padding: wp("1%"), marginLeft: wp("1%") },
  notificationButton: { padding: wp("1.5%"), borderRadius: wp("2%"), backgroundColor: "rgba(255,255,255,0.1)", position: "relative" },
  notificationBadge: { position: "absolute", top: -3, right: -3, backgroundColor: "#FF3B30", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 4, zIndex: 1000, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  notificationText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textAlign: "center", includeFontPadding: false },
  spotlightT: { flexDirection: "row", alignItems: "center", gap: wp("0.8%"), flexShrink: 1 },
  tutors: { color: "#454358", fontSize: wp("5.33%"), fontWeight: 500, fontFamily: "Poppins_400Regular", lineHeight: hp("4%") },
  spot: { color: "#03070e", fontSize: wp("5.33%"), fontWeight: 600, fontFamily: "Poppins_600SemiBold", lineHeight: hp("4%"), flexShrink: 1, flexWrap: "nowrap" },
  trend: { color: "#ff0000", lineHeight: hp("2.42%"), fontSize: wp("3.73%"), fontFamily: "OpenSans_500Medium" },
  teacherCard: { marginRight: wp("0.8%"), marginLeft: wp("0.8%"), alignItems: "center", width: wp("28%"), padding: 0, borderRadius: 0, backgroundColor: "transparent", shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  teacherImage: { width: wp("28%"), height: wp("28%"), borderRadius: wp("2%"), marginBottom: hp("0.5%"), borderWidth: 0, borderColor: "transparent", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  teacherName: { fontSize: wp("3.2%"), color: "#1a1a1a", textAlign: "center", fontFamily: "Poppins_600SemiBold", fontWeight: "600", marginBottom: hp("0.2%"), maxWidth: "100%", letterSpacing: 0.1, lineHeight: wp("3.8%") },
  teacherSub: { color: "#888", fontSize: wp("2.6%"), fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 0, opacity: 0.8 },
  mytutorsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", margin: "auto", backgroundColor: "#dbe2ff", height: hp("7.5%"), paddingHorizontal: wp("4.5%"), paddingVertical: hp("0.2%"), marginHorizontal: wp("4%"), borderRadius: wp("4.533%"), marginTop: hp("1.8%"), borderWidth: wp("1%"), borderColor: "#5f5fff" },
  mytutorsContainerTitle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: wp("50%"), margin: 0, padding: 0 },
  titleText: { color: "#454358", fontSize: wp("4.5%"), fontFamily: "Roboto_500Medium", flex: 1, marginLeft: wp("10%"), paddingVertical: -wp("4%") },
  seeAllText: { color: "#4255FF", fontSize: wp("3.5%"), fontWeight: "500", fontFamily: "Roboto_500Medium" },
  spotlight: { marginTop: hp("1.2%"), marginHorizontal: wp("4%"), marginBottom: hp("0.5%") },
  spotlightHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp("0.5%") },
  thanksCard: { height: hp("18%"), backgroundColor: "#663259", marginTop: hp("1.5%"), marginBottom: hp("1.2%"), borderRadius: 0, paddingVertical: hp("3.5%"), paddingHorizontal: wp("4%"), marginHorizontal: 0, width: "100%", justifyContent: "center", alignItems: "center" },
  growsmartImage: { width: "100%", height: "100%", resizeMode: "contain" },
  marqueeTeacherContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp('2%') },
  marqueeTeacherContent: { flexDirection: 'row', alignItems: 'center' },
  searchResultsContainer: { paddingHorizontal: wp('4%'), paddingVertical: hp('2%') },
  searchResultsText: { fontSize: wp('4%'), fontFamily: 'Poppins_600SemiBold', color: '#333', marginBottom: hp('2%') },
  thanksTitle: { fontSize: wp('4.5%'), fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: hp('1%') },
  thanksDescription: { fontSize: wp('3.5%'), fontFamily: 'Poppins_400Regular', color: '#fff', lineHeight: hp('2.5%') },
  offerBanner: { width: '100%', height: hp('15%'), backgroundColor: '#f8f9fa', borderRadius: wp('2%'), marginBottom: hp('2%'), overflow: 'hidden' },
  offerImage: { width: '100%', height: '150%', resizeMode: 'cover' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileImage: { width: wp('10%'), height: wp('10%'), borderRadius: wp('4%') },
  
  // Swipe Indicators
  swipeIndicators: { 
    position: 'absolute', 
    bottom: hp('2%'), 
    left: 0, 
    right: 0, 
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
  },
  indicatorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
    borderRadius: wp('5%'), 
    paddingHorizontal: wp('3%'), 
    paddingVertical: hp('1%'),
  },
  indicatorDot: { 
    paddingHorizontal: wp('3%'), 
    paddingVertical: hp('0.8%'), 
    borderRadius: wp('3%'), 
    marginHorizontal: wp('1%'),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicatorDot: { 
    backgroundColor: '#5f5fff',
  },
  indicatorText: { 
    fontSize: wp('3%'), 
    fontFamily: 'Poppins_500Medium', 
    color: '#ffffff',
    textAlign: 'center',
  },
  activeIndicatorText: { 
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
});