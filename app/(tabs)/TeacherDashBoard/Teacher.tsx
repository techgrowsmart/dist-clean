import BottomNavigation from "./BottomNavigationTeacher";
import Bars from "../../../assets/svgIcons/Bars";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans';
import { RedHatDisplay_400Regular } from '@expo-google-fonts/red-hat-display';
import { useFonts } from 'expo-font';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";

import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import SidebarMenu from "./TeacherSidebar";
  const screenWidth = Dimensions.get("window").width;
const { width, height } = Dimensions.get("window");
import { Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import LeftScreen from './LeftScreen';
import RightScreen from './RightScreen';
import TutorDashboardWeb from './TutorDashboardWeb';

const SCREEN_COUNT = 3;
const CACHE_KEYS = {
  PROFILE: "teacher_dashboard_profile_cache",
  CONTACTS: "teacher_dashboard_contacts_cache",
  SUBJECT_COUNT: "teacher_dashboard_subject_count_cache",
};

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import StudentsList from "./StudentList";
import SubjectsList from "./SubjectsList";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

interface ApiResponse {
  type: string;
  data?: any;
  error?: any;
}

interface Contact {
  name: string;
  profilePic: string;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
}

interface Review {
  id: string;
  title: string;
  rating: string;
  content: string;
  studentName?: string;
  createdAt?: string;
  isReal?: boolean; // Mark if this is real data vs mock data
}

const InfiniteReviewScroll = ({ reviews }: { reviews: Review[] }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(0);
  const scrollInterval = React.useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  const SCROLL_SPEED = 1.8; // You can change this value
  
  const SCROLL_INTERVAL = 36; // ~60fps for smooth animation

  // Mock reviews data (only used if no real reviews are available)
  const mockReviews = [
    {
      id: 'mock1',
      title: "My Reviews",
      rating: "⭐ ⭐ ⭐ ⭐",
      content: "A positive teacher review typically highlights a teacher's positive qualities, effective teaching methods, and their impact on student learning",
      isReal: false
    },
    {
      id: 'mock2', 
      title: "My Reviews",
      rating: "⭐ ⭐ ⭐ ⭐ ⭐",
      content: "Excellent teaching methodology and great communication skills. Students showed remarkable improvement under this teacher's guidance.",
      isReal: false
    },
    {
      id: 'mock3',
      title: "My Reviews", 
      rating: "⭐ ⭐ ⭐ ⭐",
      content: "Very patient and understanding teacher who creates a positive learning environment for all students.",
      isReal: false
    }
  ];

  // Use the processed reviews directly (they're already combined with mock data in the parent)
  const reviewData = reviews.length > 0 ? reviews : mockReviews;
  console.log('Displaying reviews:', reviewData.length, '(Real:', reviewData.filter(r => r.isReal).length, 'Mock:', reviewData.filter(r => !r.isReal).length, ')');

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
            key={`${review.id}-${index}`}
            style={styles.reviewCard}
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            activeOpacity={1}
          >
            {/* Real review badge */}
            {review.isReal && (
              <View style={styles.realReviewBadge}>
                <Text style={styles.realReviewText}>REAL</Text>
              </View>
            )}
            
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
  // Removed unused params reference
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [teacherName, setTeacherName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Initialize states with cached values if available
  const [isSpotlight, setIsSpotlight] = useState<boolean>(false);
  const [subjectCount, setSubjectCount] = useState<number>(0);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [showSubjectsList, setShowSubjectsList] = useState(false);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStatus, setUserStatus] = useState('dormant'); // Will be updated from API
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
  });

  // States and Union Territories of India
  const statesAndUnionTerritories = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const swipeAnim = React.useRef(new Animated.Value(-width)).current;
  const [currentScreenIndex, setCurrentScreenIndex] = useState(1);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const isSwipeLocked = useRef(false);
  const swipeVelocity = React.useRef(new Animated.Value(0)).current;
  const swipeOpacity = React.useRef(new Animated.Value(1)).current;
  const swipeScale = React.useRef(new Animated.Value(1)).current;
  const swipeRotation = React.useRef(new Animated.Value(0)).current;
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  React.useEffect(() => {
    swipeAnim.setValue(-width);
    setCurrentScreenIndex(1);
  }, [swipeAnim, width]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        // EXTREMELY strict criteria - almost no accidental swipes
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        // Very high threshold and extremely strict horizontal dominance
        const horizontalThreshold = 40; // Increased from 25
        const horizontalDominance = 4.0; // Increased from 2.5 (much more strict)
        
        // Additional check: vertical movement must be minimal
        const maxVerticalMovement = 10; // Max 10px vertical movement allowed
        
        return absDx > horizontalThreshold && 
               absDx > absDy * horizontalDominance && 
               absDy < maxVerticalMovement;
      },

      onPanResponderGrant: () => {
        setIsSwipeActive(true);
        swipeAnim.stopAnimation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderMove: (_, { dx }) => {
        // Calculate the target position based on current screen index and drag
        let newPosition = -width * currentScreenIndex + dx;

        // Define allowed range based on current screen (only adjacent screens)
        let minAllowed, maxAllowed;
        if (currentScreenIndex === 0) {
          // On left screen: can only drag left to reveal center (more negative)
          minAllowed = -width;          // center position
          maxAllowed = 0;               // left screen position
        } else if (currentScreenIndex === SCREEN_COUNT - 1) {
          // On right screen: can only drag right to reveal center (more positive)
          minAllowed = -width * (SCREEN_COUNT - 1); // right screen position
          maxAllowed = -width * (SCREEN_COUNT - 2); // center position
        } else {
          // On center: can drag both directions
          minAllowed = -width * (SCREEN_COUNT - 1); // right screen position
          maxAllowed = 0;                           // left screen position
        }

        // Apply resistance when trying to go beyond allowed adjacent boundaries
        if (newPosition < minAllowed) {
          // Overshoot left (trying to go beyond adjacent right screen)
          newPosition = minAllowed + (newPosition - minAllowed) * 0.2;
        } else if (newPosition > maxAllowed) {
          // Overshoot right (trying to go beyond adjacent left screen)
          newPosition = maxAllowed + (newPosition - maxAllowed) * 0.2;
        }

        swipeAnim.setValue(newPosition);
      },

      onPanResponderRelease: (_, { dx, vx }) => {
        setIsSwipeActive(false);

        let newIndex = currentScreenIndex;
        
        // Calculate swipe threshold - make it extremely high for very deliberate swipes only
        const swipeThreshold = width * 0.5; // Increased from 0.4 (50% of screen width!)
        const velocityThreshold = 0.7; // Increased from 0.5 (require very fast swipe)
        
        // Only change screen if swipe is decisive enough
        const isSwipingLeft = dx < -swipeThreshold || (dx < 0 && Math.abs(vx) > velocityThreshold);
        const isSwipingRight = dx > swipeThreshold || (dx > 0 && Math.abs(vx) > velocityThreshold);
        
        // Handle screen transitions - ONLY allow adjacent screen navigation with extra validation
        if (isSwipingLeft && currentScreenIndex < SCREEN_COUNT - 1) {
          // Swipe left - go to next screen (only one step at a time)
          // Additional check: ensure we're not trying to skip screens
          if (currentScreenIndex === 0 || currentScreenIndex === 1) {
            newIndex = currentScreenIndex + 1;
            console.log(`👆 Swipe Left: Screen ${currentScreenIndex} → ${newIndex}`);
          } else {
            console.log(`🚫 Invalid Skip Attempt: Cannot go from Screen ${currentScreenIndex} further left`);
            newIndex = currentScreenIndex;
          }
        } else if (isSwipingRight && currentScreenIndex > 0) {
          // Swipe right - go to previous screen (only one step at a time)
          // Additional check: ensure we're not trying to skip screens
          if (currentScreenIndex === 1 || currentScreenIndex === 2) {
            newIndex = currentScreenIndex - 1;
            console.log(`👇 Swipe Right: Screen ${currentScreenIndex} → ${newIndex}`);
          } else {
            console.log(`🚫 Invalid Skip Attempt: Cannot go from Screen ${currentScreenIndex} further right`);
            newIndex = currentScreenIndex;
          }
        } else {
          // No valid swipe - stay on current screen
          newIndex = currentScreenIndex;
          console.log(`🚫 Invalid Swipe: Staying on Screen ${currentScreenIndex} (TOO WEAK OR WRONG DIRECTION)`);
        }

        // Ensure index is within bounds
        newIndex = Math.max(0, Math.min(SCREEN_COUNT - 1, newIndex));

        // Lock during snap animation
        isSwipeLocked.current = true;

        // Animate to the new position with extremely slow, rigid animation
        Animated.spring(swipeAnim, {
          toValue: -width * newIndex,
          useNativeDriver: true,
          tension: 20, // Reduced from 40 for extremely slow animation
          friction: 30, // Increased from 20 for maximum damping (very slow)
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
        setIsSwipeActive(false);
        if (!isSwipeLocked.current) {
          // If gesture is terminated, snap back to current screen with extremely slow animation
          Animated.spring(swipeAnim, {
            toValue: -width * currentScreenIndex,
            useNativeDriver: true,
            tension: 20, // Reduced from 40 for extremely slow animation
            friction: 30, // Increased from 20 for maximum damping
            overshootClamping: true,
          }).start();
        }
      },
    })
  ).current;

  const loadCachedProfile = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PROFILE);
      if (cached) {
        const cachedProfile = JSON.parse(cached);
        if (cachedProfile?.name) setTeacherName(cachedProfile.name);
        if (cachedProfile?.email) setUserEmail(cachedProfile.email);
        if (cachedProfile?.profileimage) setProfileImage(cachedProfile.profileimage);
        if (cachedProfile?.status) setUserStatus(cachedProfile.status);
        if (cachedProfile?.created_at) setCreatedAt(cachedProfile.created_at);
        if (typeof cachedProfile.isSpotlight === "boolean") {
          console.log('Setting spotlight from cache:', cachedProfile.isSpotlight);
          setIsSpotlight(cachedProfile.isSpotlight);
        }
      }
    } catch (err) {
      // Silent cached profile loading error
    }
  }, []);

  console.log("user", userEmail);
  console.log("Current spotlight state:", isSpotlight);

  // Initialize userEmail from auth storage on mount
  useEffect(() => {
    const initializeUserEmail = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.email) {
          console.log('📧 Setting userEmail from auth storage:', auth.email);
          setUserEmail(auth.email);
        }
      } catch (error) {
        console.error('❌ Error initializing userEmail:', error);
      }
    };
    
    initializeUserEmail();
  }, []);

  // Initialize cache loading on mount - optimized
  useEffect(() => {
    const initializeCache = async () => {
      try {
        console.log('📦 Loading cached data...');
        const startTime = Date.now();
        
        // Load all cache data in parallel
        const cachePromises = [
          loadCachedProfile(),
          AsyncStorage.getItem(CACHE_KEYS.SUBJECT_COUNT),
          AsyncStorage.getItem(CACHE_KEYS.CONTACTS),
          AsyncStorage.getItem('teacher_reviews_cache')
        ];
        
        const [_, cachedSubjectCount, cachedContacts, cachedReviews] = await Promise.all(cachePromises);
        
        // Process cached data efficiently
        if (cachedSubjectCount) {
          try {
            const { count } = JSON.parse(cachedSubjectCount);
            if (typeof count === 'number') {
              setSubjectCount(count);
              console.log(`📚 Cached subjects: ${count}`);
            }
          } catch (e) {
            // Silent cache error
          }
        }
        
        if (cachedContacts) {
          try {
            const cachedData = JSON.parse(cachedContacts);
            const contacts = cachedData.contacts || cachedData;
            if (Array.isArray(contacts)) {
              setContacts(contacts);
              console.log(`👥 Cached contacts: ${contacts.length}`);
            }
          } catch (e) {
            // Silent cache error
          }
        }
        
        if (cachedReviews) {
          try {
            const cached = JSON.parse(cachedReviews);
            if (cached.reviews && Array.isArray(cached.reviews)) {
              setReviews(cached.reviews);
              console.log(`⭐ Cached reviews: ${cached.reviews.length}`);
            }
          } catch (e) {
            // Silent cache error
          }
        }
        
        const cacheTime = Date.now() - startTime;
        console.log(`✅ Cache loaded in ${cacheTime}ms`);
        setCacheLoaded(true);
      } catch (error) {
        console.error('❌ Cache initialization error:', error);
        setCacheLoaded(true); // Still allow API calls
      }
    };
    
    initializeCache();
  }, [loadCachedProfile]);

  // Spotlight animations
  useEffect(() => {
    console.log('Spotlight state changed:', isSpotlight);
    if (isSpotlight) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isSpotlight]);

  // Debug currentScreenIndex changes
  useEffect(() => {
    console.log('📱 currentScreenIndex changed to:', currentScreenIndex);
  }, [currentScreenIndex]);

  // Debug subjectCount changes
  useEffect(() => {
    console.log('📚 subjectCount changed to:', subjectCount);
  }, [subjectCount]);

  // Handle state selection for chart updates
  const handleStateChange = async (state: string) => {
    try {
      console.log('State selected:', state);
      setSelectedCity(state);
      
      // Here you would typically fetch chart data for the selected state
      // For now, we'll update with mock data based on state
      const mockData = generateMockChartData(state);
      
      // Use requestAnimationFrame to ensure smooth state update
      requestAnimationFrame(() => {
        setChartData(mockData);
      });
    } catch (error) {
      console.error('Error handling state change:', error);
      // Reset to default data on error
      setChartData({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
      });
    }
  };

  // Generate mock chart data based on selected state
  const generateMockChartData = (state: string) => {
    try {
      // Generate different data based on state to simulate real changes
      const seed = state.length + state.charCodeAt(0);
      const data = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100) + 20 + seed % 50);
      
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data }]
      };
    } catch (error) {
      console.error('Error generating chart data:', error);
      // Return default data on error
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
      };
    }
  };

  // Consolidated data loading with optimized performance - FIXED VERSION
  const loadAllData = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      console.log('🚀 Starting optimized data load...');
      const startTime = Date.now();
      
      // Get auth data once
      const auth = await getAuthData();
      const token = auth?.token;
      const email = auth?.email;
      
      console.log('🔐 Auth data:', { 
        hasToken: !!token, 
        email: email, 
        role: auth?.role,
        userEmail: userEmail 
      });
      
      if (!email || !token) {
        console.log('❌ No auth data, skipping API calls');
        return;
      }
      
      // Prepare headers once
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      
      // Create optimized API calls - SINGLE PROFILE CALL for both profile and subjects
      const apiPromises = [
        // Single profile fetch that includes both profile data and subject count
        axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers, timeout: 8000 })
          .then(response => {
            console.log('🔍 Raw teacherProfile API response:', response.data);
            return { type: 'profile', data: response.data };
          })
          .catch(error => {
            console.log('❌ teacherProfile API error:', error.response?.data || error.message);
            return { type: 'profile', error };
          }),
        
        // Contacts fetch
        axios.post(`${BASE_URL}/api/contacts`, { userEmail: email, type: auth?.role }, { headers, timeout: 6000 })
          .then(response => ({ type: 'contacts', data: response.data }))
          .catch(error => ({ type: 'contacts', error })),
        
        // Reviews fetch - improved error handling
        Promise.race([
          axios.post(`${BASE_URL}/api/teacher-reviews`, { teacherEmail: email }, { headers, timeout: 8000 }),
          axios.post(`${BASE_URL}/api/reviews/teacher`, { teacherEmail: email }, { headers, timeout: 8000 }),
          axios.post(`${BASE_URL}/api/reviews`, { teacherEmail: email }, { headers, timeout: 8000 })
        ]).then((response: any) => ({ type: 'reviews', data: response.data }))
          .catch((error: any) => {
            console.log('⚠️ Reviews API failed:', error.message || 'Unknown error');
            // Return mock data on failure to prevent UI issues
            return { type: 'reviews', data: { reviews: [] } };
          })
      ];
      
      // Execute all API calls in parallel
      const results = await Promise.allSettled(apiPromises);
      
      // Process results efficiently with requestAnimationFrame batching
      requestAnimationFrame(() => {
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const { type, data, error } = result.value as ApiResponse;
            
            if (error) {
              console.log(`⚠️ ${type} API failed:`, error.message || error);
              // IMPORTANT: Don't reset states on error, preserve existing values
              return;
            }
            
            switch (type) {
              case 'profile':
                if (data?.name) {
                  console.log('✅ Profile loaded');
                  const updates = [
                    setTeacherName(data.name),
                    setUserStatus(data.status || 'dormant'),
                    setUserEmail(data.email),
                    setCreatedAt(data.created_at),
                  ];
                  
                  if (data.profileimage) {
                    updates.push(setProfileImage(data.profileimage));
                  }
                  
                  // Handle spotlight - preserve existing state if API doesn't provide it
                  if (data.isSpotlight !== undefined) {
                    const spotlightStatus = Boolean(data.isSpotlight);
                    console.log('🔦 Spotlight status from API:', spotlightStatus);
                    setIsSpotlight(spotlightStatus);
                  } else {
                    console.log('🔦 No spotlight data from API, preserving existing state');
                    // Don't change isSpotlight if API doesn't provide it
                  }
                  
                  // Process subject count from the same API response
                  let count = subjectCount; // Preserve current count as default
                  
                  if (data?.tuitions && Array.isArray(data.tuitions)) {
                    const uniqueSubjects = new Set();
                    data.tuitions.forEach((tuition: any) => {
                      if (tuition?.subject) uniqueSubjects.add(tuition.subject);
                      else if (tuition?.skill) uniqueSubjects.add(tuition.skill);
                    });
                    count = uniqueSubjects.size;
                    console.log('📚 Using teacherProfile tuitions array, unique subjects:', count);
                  } else {
                    console.log('⚠️ No tuitions found in teacherProfile response, preserving existing count');
                    // Don't reset to 0, preserve existing count
                  }
                  
                  console.log(`✅ Final subjects count: ${count}`);
                  setSubjectCount(count);
                  
                  Promise.all(updates);
                  
                  // Cache profile and subject count together
                  AsyncStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify({
                    name: data.name,
                    email: data.email,
                    profileimage: data.profileimage,
                    status: data.status || 'dormant',
                    created_at: data.created_at,
                    isSpotlight: Boolean(data.isSpotlight !== undefined ? data.isSpotlight : isSpotlight),
                  })).catch(() => {});
                  
                  // Cache subjects only if we got a valid count
                  if (count !== subjectCount) {
                    AsyncStorage.setItem(CACHE_KEYS.SUBJECT_COUNT, JSON.stringify({
                      count,
                      timestamp: Date.now()
                    })).catch(() => {});
                  }
                }
                break;
                
              case 'contacts':
                if (data?.success && data.contacts) {
                  const contactsData = data.contacts.map((contact: any) => ({
                    name: contact.teacherName || contact.studentName,
                    profilePic: contact.teacherProfilePic || contact.studentProfilePic || contact.profilePic || "",
                    email: contact.teacherEmail || contact.studentEmail,
                    lastMessage: contact.lastMessage,
                    lastMessageTime: contact.lastMessageTime,
                  }));
                  
                  console.log(`👥 Contacts loaded: ${contactsData.length}`);
                  setContacts(contactsData);
                  
                  // Cache contacts
                  AsyncStorage.setItem(CACHE_KEYS.CONTACTS, JSON.stringify({
                    contacts: contactsData,
                    timestamp: Date.now()
                  })).catch(() => {});
                }
                break;
                
              case 'reviews':
                if (data?.success && data.reviews) {
                  console.log(`⭐ Reviews loaded: ${data.reviews.length}`);
                  
                  // Process reviews with better date handling
                  const processedReviews = data.reviews.map((review: any) => ({
                    id: review.id,
                    title: `Review by ${review.studentName || 'Student'}`,
                    rating: '⭐'.repeat(Math.min(Math.max(parseInt(review.rating) || 4, 1), 5)),
                    content: review.content,
                    createdAt: review.created_at,
                    isReal: true // Mark as real data
                  }));
                  
                  // Combine with mock data for seamless looping
                  const mockReviews = [
                    {
                      id: 'mock1',
                      title: "My Reviews",
                      rating: "⭐ ⭐ ⭐ ⭐",
                      content: "A positive teacher review typically highlights a teacher's positive qualities, effective teaching methods, and their impact on student learning",
                      isReal: false
                    },
                    {
                      id: 'mock2', 
                      title: "My Reviews",
                      rating: "⭐ ⭐ ⭐ ⭐ ⭐",
                      content: "Excellent teaching methodology and great communication skills. Students showed remarkable improvement under this teacher's guidance.",
                      isReal: false
                    },
                    {
                      id: 'mock3',
                      title: "My Reviews", 
                      rating: "⭐ ⭐ ⭐ ⭐",
                      content: "Very patient and understanding teacher who creates a positive learning environment for all students.",
                      isReal: false
                    }
                  ];
                  
                  // Create display array with real reviews + mock data for seamless looping
                  let displayReviews = [];
                  if (processedReviews.length > 0) {
                    // Add real reviews first
                    displayReviews = [...processedReviews];
                    
                    // Add mock data to fill up to at least 3 items for smooth scrolling
                    if (displayReviews.length < 3) {
                      const mockNeeded = Math.max(0, 3 - displayReviews.length);
                      displayReviews.push(...mockReviews.slice(0, mockNeeded));
                    }
                    
                    // Add one more real review at the end if available
                    if (processedReviews.length > displayReviews.length) {
                      displayReviews.push(processedReviews[displayReviews.length]);
                    }
                  } else {
                    // No real reviews, use only mock data
                    displayReviews = mockReviews;
                  }
                  
                  console.log('📝 Final display reviews:', displayReviews.length, '(Real:', processedReviews.length, 'Mock:', displayReviews.filter(r => !r.isReal).length, ')');
                  setReviews(displayReviews);
                  
                  // Cache reviews
                  AsyncStorage.setItem('teacher_reviews_cache', JSON.stringify({
                    reviews: displayReviews,
                    timestamp: Date.now()
                  })).catch(() => {});
                }
                break;
            }
          }
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`🎉 All data loaded in ${loadTime}ms`);
      });
      
    } catch (error) {
      console.error('❌ Critical error in data loading:', error);
    } finally {
      // Set all loading states to false
      setSubjectsLoading(false);
      setReviewsLoading(false);
      setContactsLoading(false);
      setProfileLoading(false);
    }
  }, [userEmail, subjectCount, isSpotlight]); // Add subjectCount and isSpotlight to dependencies

  // Single consolidated effect for data loading - TRIGGERED ONLY WHEN userEmail CHANGES
  useEffect(() => {
    if (userEmail && cacheLoaded) {
      console.log('📧 userEmail changed, loading data for:', userEmail);
      loadAllData();
    }
  }, [userEmail, cacheLoaded, loadAllData]);

  // Fetch unread count function - moved before useEffect
  const fetchUnreadCount = useCallback(async () => {
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
          timeout: 5000
        }
      );

      if (response.data && typeof response.data.count === 'number') {
        setUnreadCount(prevCount => {
          // Only update if the count actually changed to prevent unnecessary re-renders
          return response.data.count !== prevCount ? response.data.count : prevCount;
        });
      }
    } catch (error) {
      // Silent unread count fetch error
    }
  }, []);

  // Separate effect for unread count polling
  useEffect(() => {
    if (!userEmail) return;
    
    // Initial fetch
    fetchUnreadCount();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [userEmail, fetchUnreadCount]);

  let [fontsLoaded] = useFonts({
    Poppins_Regular: Poppins_400Regular,
    Poppins_Bold: Poppins_700Bold,
    Poppins_SemiBold: Poppins_600SemiBold,
    OpenSans_400Regular,
    WorkSans_400Regular,
    RedHatDisplay_400Regular,
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

  // For web, use TutorDashboardWeb UI with real data
  if (Platform.OS === 'web') {
    return (
      <TutorDashboardWeb 
        teacherName={teacherName}
        profileImage={profileImage}
        userEmail={userEmail}
        subjectCount={subjectCount}
        contacts={contacts}
        reviews={reviews}
        unreadCount={unreadCount}
        userStatus={userStatus}
        createdAt={createdAt}
        isSpotlight={isSpotlight}
        profileLoading={profileLoading}
        contactsLoading={contactsLoading}
        reviewsLoading={reviewsLoading}
        subjectsLoading={subjectsLoading}
      />
    );
  }

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
        {/* Swipeable Content Area */}
        <View style={styles.swipeContainer}>
      <Animated.View
  style={[
    styles.swipeContent,
    {
      transform: [
        { translateX: swipeAnim },
        { scale: swipeScale },
        { rotate: swipeRotation.interpolate({
          inputRange: [-15, 15],
          outputRange: ['-15deg', '15deg']
        })}
      ],
      width: width * SCREEN_COUNT,
      opacity: swipeOpacity,
    },
  ]}
  {...panResponder.panHandlers}
>
  {/* Left Screen (Index 0) */}
  <View style={[styles.screen, { width }]}>
    <LeftScreen leftFont={'RedHatDisplay_400Regular'} />
  </View>
            
            {/* Home Screen - Teacher Dashboard (Index 1) */}
            <View style={[styles.screen, { width }]}>
              <SidebarMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                activeItem={activeMenuItem}
                userEmail={userEmail || ''}
                teacherName={teacherName}
                profileImage={profileImage}
                onItemPress={(itemName: string) => {
                  setActiveMenuItem(itemName);
                  if (itemName === "Dashboard") {
                    // Dashboard is already current screen, just close sidebar
                    setMenuVisible(false);
                  } else if (itemName === "Settings") {
                    router.push({
                      pathname: "/(tabs)/TeacherDashBoard/Settings",
                      params: { userEmail },
                    });
                  } else if (itemName === "Billing") {
                    router.push({
                      pathname: "/(tabs)/Billing",
                      params: {
                        userType: "teacher",
                        userEmail,
                        teacherName,
                        profileImage,
                      },
                    });
                  } else if (itemName === "Spotlight") {
                    router.push("/(tabs)/TeacherDashBoard/SpotlightTarrif");
                  } else if (itemName === "Share") {
                    router.push({
                      pathname: "/(tabs)/TeacherDashBoard/Share",
                      params: { userEmail, teacherName, profileImage },
                    });
                  } else if (itemName === "Add on Class") {
                    router.push({
                      pathname: "/(tabs)/TeacherDashBoard/AddonClass",
                      params: { userEmail },
                    });
                  } else if (itemName === "Create Subject") {
                    router.push({ pathname: "/(tabs)/TeacherDashBoard/Subjects" });
                  } else if (itemName === "Contact") {
                    router.push("/(tabs)/Messages/Messages");
                  }
                  // Terms & Conditions and Privacy Policy are handled in the component itself
                  // Logout is handled in the component itself
                }}
    
                userEmail={userEmail || ''}
                teacherName={teacherName}
                profileImage={profileImage}
                leftFont={'RedHatDisplay_400Regular'}
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
                    <Text style={styles.cardTop}>{createdAt ? formatDate(createdAt) : 'N/A'}</Text>
                    <Text style={styles.cardBottom}>Joined Date</Text>
                  </TouchableOpacity>
                </View>

                <InfiniteReviewScroll reviews={reviews} />
                <View style={styles.chartContainer}>
                  <View style={styles.enrollmentRow}>
                    <Text style={styles.enrollmentLabel}>Student Enrolled</Text>
                    <View style={styles.dropDownWrapper}>
                      <Picker
                        selectedValue={selectedCity}
                        onValueChange={handleStateChange}
                        style={styles.picker}
                        dropdownIconColor="#333"
                      >
                        <Picker.Item label="Select State/UT" value="" />
                        {statesAndUnionTerritories.map((state) => (
                          <Picker.Item key={state} label={state} value={state} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.chartContent}>
                    <LineChart
                      data={chartData}
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

              <BottomNavigation userEmail={userEmail || ""} />
            </View>
            
            {/* Right Screen (Index 2) - GrowThoughts / Thoughts panel */}
            <View style={[styles.screen, { width }]}> 
              <RightScreen />
            </View>
        {/* ADD THIS VISUAL OVERLAY */}
</Animated.View>
        </View>
        
        {/* Tinder-like Swipe Indicators */}
        <View style={styles.swipeIndicators}>
          <View style={styles.indicatorWithLabel}>
            <TouchableOpacity
              onPress={() => {
                // Only allow navigation to adjacent screen (from center to left)
                if (currentScreenIndex === 1) {
                  console.log(`🔘 Reviews Button: Screen ${currentScreenIndex} → 0`);
                  setCurrentScreenIndex(0);
                  Animated.spring(swipeAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 20, // Reduced from 40 for extremely slow animation
                    friction: 30, // Increased from 20 for maximum damping
                  }).start();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  console.log(`🚫 Reviews Button: Cannot navigate from Screen ${currentScreenIndex}`);
                }
              }}
              style={[
                styles.indicatorDot,
                currentScreenIndex === 0 && styles.activeIndicatorDot
              ]}
            />
            <Text style={[
              styles.indicatorLabel,
              currentScreenIndex === 0 && styles.activeIndicatorLabel
            ]}>Reviews</Text>
          </View>
          
          <View style={styles.indicatorWithLabel}>
            <TouchableOpacity
              onPress={() => {
                // Allow navigation to center from either left or right
                if (currentScreenIndex === 0 || currentScreenIndex === 2) {
                  console.log(`🏠 Home Button: Screen ${currentScreenIndex} → 1`);
                  setCurrentScreenIndex(1);
                  Animated.spring(swipeAnim, {
                    toValue: -width,
                    useNativeDriver: true,
                    tension: 20, // Reduced from 40 for extremely slow animation
                    friction: 30, // Increased from 20 for maximum damping
                  }).start();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  console.log(`🚫 Home Button: Already on Screen ${currentScreenIndex}`);
                }
              }}
              style={[
                styles.indicatorDot,
                currentScreenIndex === 1 && styles.activeIndicatorDot
              ]}
            />
            <Text style={[
              styles.indicatorLabel,
              currentScreenIndex === 1 && styles.activeIndicatorLabel
            ]}>Home</Text>
          </View>
          
          <View style={styles.indicatorWithLabel}>
            <TouchableOpacity
              onPress={() => {
                // Only allow navigation to adjacent screen (from center to right)
                if (currentScreenIndex === 1) {
                  console.log(`💬 Activity Button: Screen ${currentScreenIndex} → 2`);
                  setCurrentScreenIndex(2);
                  Animated.spring(swipeAnim, {
                    toValue: -width * 2,
                    useNativeDriver: true,
                    tension: 20, // Reduced from 40 for extremely slow animation
                    friction: 30, // Increased from 20 for maximum damping
                  }).start();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  console.log(`🚫 Activity Button: Cannot navigate from Screen ${currentScreenIndex}`);
                }
              }}
              style={[
                styles.indicatorDot,
                currentScreenIndex === 2 && styles.activeIndicatorDot
              ]}
            />
            <Text style={[
              styles.indicatorLabel,
              currentScreenIndex === 2 && styles.activeIndicatorLabel
            ]}>Activity</Text>
          </View>
        </View>
        
        {/* Tinder-like Swipe Hint Overlay */}
        {currentScreenIndex === 1 && !isSwipeActive && (
          <Animated.View 
            style={[
              styles.swipeHintOverlay,
              {
                opacity: 0.7,
              }
            ]}
          >
            <View style={styles.swipeHintContent}>
              <View style={styles.swipeHintArrows}>
                <Ionicons name="chevron-back" size={wp("4%")} color="#fff" />
                <Text style={styles.swipeHintText}>Swipe to navigate</Text>
                <Ionicons name="chevron-forward" size={wp("4%")} color="#fff" />
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Swipe Direction Indicator */}
        {isSwipeActive && swipeDirection && (
          <View style={[
            styles.swipeDirectionIndicator,
            swipeDirection === 'left' ? styles.swipeLeftIndicator : styles.swipeRightIndicator
          ]}>
            <Ionicons 
              name={swipeDirection === 'left' ? 'chevron-back' : 'chevron-forward'} 
              size={wp("6%")} 
              color="#fff" 
            />
          </View>
        )}
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
  justifyContent: "space-between", 
  position: 'relative',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
  
  realReviewBadge: {
    position: 'absolute',
    top: wp("2%"),
    right: wp("2%"),
    backgroundColor: '#4CAF50',
    paddingHorizontal: wp("2%"),
    paddingVertical: wp("1%"),
    borderRadius: wp("2%"),
    zIndex: 1,
  },
  
  realReviewText: {
    color: '#fff',
    fontSize: wp("2%"),
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
  
  reviewText: { color: "#fff", fontSize: wp("4.27%"), fontWeight: "700", lineHeight: hp("2.826%"), fontFamily: 'WorkSans_400Regular' },
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
  fontSize: wp('3.3%'),
  lineHeight: hp('2.422%'),
  textTransform: 'uppercase',
  color: '#393939',
  fontFamily: 'WorkSans_400Regular',
  flex: 1,
  paddingRight: wp('25%'), // Add this - creates space for status text
},
statusText: {
  fontSize: wp('3.2%'),
  fontFamily: 'WorkSans_400Regular',
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
  card: { 
    backgroundColor: "#f5763f", 
    borderRadius: wp("4.5%"), 
    width: wp("31.2%"), 
    height: hp("12%"), 
    padding: wp("3%"), 
    justifyContent: "center", 
    alignItems: "center", 
    gap: hp("0.8%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  cardMiddle: { 
    backgroundColor: "#f5763f", 
    borderRadius: wp("4.5%"), 
    width: wp("21.6%"), 
    height: hp("12%"), 
    padding: wp("3%"), 
    flexDirection: "column", 
    justifyContent: "space-around", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  endcard: { 
    backgroundColor: "#f5763f", 
    borderRadius: wp("4.5%"), 
    width: wp("33.86%"), 
    height: hp("12%"), 
    padding: wp("3%"), 
    flexDirection: "column", 
    justifyContent: "space-around", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  cardTop: { 
    color: "#fff", 
    fontSize: wp("4.5%"), 
    fontWeight: "700", 
    lineHeight: hp("3%"),
    fontFamily: "WorkSans_400Regular",
  },
  cardBottom: { 
    color: "#fff", 
    fontSize: wp("3.4%"), 
    lineHeight: hp("2.3%"), 
    fontWeight: "600", 
    textAlign: "center",
    fontFamily: "WorkSans_400Regular",
  },
  // reviewCardContainer: { flexDirection: "row", paddingBottom: 10, paddingHorizontal: 10 },
  // reviewCard: { backgroundColor: "#5f5fff", height: hp("15.7%"), width: wp("80.8%"), borderRadius: wp("2.66%"), paddingHorizontal: wp("3.4%"), paddingVertical: hp("1.5%"), marginLeft: wp("2.13%"), justifyContent: "space-between" },
  // reviewText: { color: "#fff", fontSize: wp("4.8%"), lineHeight: hp("3.23%"), fontWeight: "500" },
  enrollmentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: height * (19 / 743), marginBottom: 8 },
  enrollmentLabel: { fontSize: wp("5.33%"), fontWeight: "500", color: "#07040e", fontFamily: "Poppins_Regular", lineHeight: hp("4.03%") },
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
  paddingTop: hp("4%"), // Keep same as Student.tsx
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
  padding: wp("2%"),
  borderRadius: wp("2.5%"),
  backgroundColor: "transparent", 
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

logoText: {
  color: '#e5e7eb',
  fontSize: wp('3.7%%'),
  fontFamily: 'Poppins_400Regular',
  fontWeight: '500',
  textAlign: 'center',
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
  
  // Notification badge - simple circle only
  notificationBadge: { 
    position: "absolute", 
    top: hp("-0.8%"), 
    right: wp("-1.5%"), 
    backgroundColor: "#FF3B30", 
    borderRadius: wp("3.5%"), 
    minWidth: wp("5%"), 
    height: wp("5%"), 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: wp("1.5%"),
    zIndex: 15,
  },
  
  notificationText: { 
    color: "#ffffff", 
    fontSize: wp("2.8%"), 
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    textAlign: 'center',
    lineHeight: wp("5%"),
    includeFontPadding: false,
  },
  
  // Main content - adjust marginTop to match Student.tsx
  mainContent: { 
    paddingHorizontal: wp("2.5%"), 
    marginTop: hp("1.5%"), 
    paddingBottom: 100 
  },

  swipeContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  
  swipeContent: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  
  screen: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  
  swipeIndicator: {
    position: 'absolute',
    bottom: hp('10%'),  // Adjust based on your bottom nav height
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
  },
  
  swipeHintText: {
    fontSize: wp('3%'),
    color: '#666',
    marginBottom: hp('1%'),
    fontFamily: 'Poppins_400Regular',
  },
  
  dotContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  
  dot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#ddd',
  },
  
  activeDot: {
    backgroundColor: '#5f5fff',
    width: wp('4%'),
  },
swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  },
  swipeHintArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  
  // New professional swipe indicators
  swipeIndicators: {
    position: 'absolute',
    bottom: hp('8%'),
    alignSelf: 'center',
    flexDirection: 'row',
    gap: wp('2%'),
    zIndex: 10,
  },
  
  indicatorDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(95, 95, 255, 0.3)',
  },
  
  activeIndicatorDot: {
    backgroundColor: '#5f5fff',
    width: wp('4%'),
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#5f5fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  
  indicatorWithLabel: {
    alignItems: 'center',
    gap: hp('0.5%'),
  },
  
  indicatorLabel: {
    fontSize: wp('2.5%'),
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    fontWeight: '500',
    marginTop: hp('0.3%'),
  },
  activeIndicatorLabel: {
    fontSize: wp('2.8%'),
    color: '#5f5fff',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: hp('0.3%'),
  },
  swipeDirectionIndicator: {
    position: 'absolute',
    top: '50%',
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    transform: [{ translateY: -hp('2.5%') }],
  },
  swipeLeftIndicator: {
    left: wp('5%'),
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  swipeRightIndicator: {
    right: wp('5%'),
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  
  swipeHintOverlay: {
    position: 'absolute',
    bottom: hp('12%'),
    alignSelf: 'center',
    zIndex: 5,
  },
  
  swipeHintContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
  },
});