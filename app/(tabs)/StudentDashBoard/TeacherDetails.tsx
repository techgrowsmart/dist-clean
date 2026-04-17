import React, { useEffect, useState } from "react";
import {
  Platform,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import{
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { isTablet } from "../../../utils/devices";
import { OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { RedHatDisplay_400Regular } from "@expo-google-fonts/red-hat-display";
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import socketService from '../../../services/socketService';
import { getImageSource } from '../../../utils/imageHelper';

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

  // Remove unused menu items constant and inline components - using shared components instead

const BADGES = [
  "Trusted Teacher",
  "Certified Expert", 
  "100% Satisfaction",
  "20+ Years Experience"
];

// Additional teacher achievements
const ACHIEVEMENTS = [
  { icon: "trophy", title: "Top Rated", description: "4.8+ average rating" },
  { icon: "people", title: "500+ Students", description: "Successfully taught" },
  { icon: "time-outline", title: "5+ Years", description: "Teaching experience" },
  { icon: "star", title: "Expert Level", description: "Subject mastery" }
];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [teacherAvailability, setTeacherAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [teacherLanguages, setTeacherLanguages] = useState<string[]>(['English', 'Hindi', 'Bengali']);
  const [similarTeachers, setSimilarTeachers] = useState<any[]>([]);
  const [similarTeachersLoading, setSimilarTeachersLoading] = useState(false);
  const [isSmallWebScreen, setIsSmallWebScreen] = useState(false);
  
  // Booking flow states - per tuition tracking
  const [bookingStates, setBookingStates] = useState<Record<number, {
    isProcessing: boolean;
    requestSent: boolean;
    showTooltip: boolean;
    status?: 'pending' | 'accepted' | 'rejected' | null;
    bookingId?: string | null;
  }>>({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedTuition, setSelectedTuition] = useState<any>(null);
  const [selectedTuitionIndex, setSelectedTuitionIndex] = useState<number | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

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

  const fetchSimilarTeachers = async (category: string) => {
    if (!category) return;
    try {
      setSimilarTeachersLoading(true);
      const auth = await getAuthData();
      if (!auth?.token) return;

      const res = await axios.post(
        `${BASE_URL}/api/teachers`,
        { category, count: 4 },
        { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
      );

      if (res.data && res.data.teachers) {
        // Filter out current teacher and limit to 5
        const filtered = res.data.teachers
          .filter((t: any) => t.email !== email)
          .slice(0, 5);
        setSimilarTeachers(filtered);
      }
    } catch (error) {
      console.error('Error fetching similar teachers:', error);
    } finally {
      setSimilarTeachersLoading(false);
    }
  };

  // AsyncStorage key for booking states
  const getBookingStorageKey = async () => {
    const auth = await getAuthData();
    // Use teacher email from URL params as fallback if teacher object not loaded yet
    const teacherEmail = teacher?.email || email;
    if (!auth?.email || !teacherEmail) return null;
    return `bookingStates_${auth.email}_${teacherEmail}`;
  };

  // Save booking states to AsyncStorage
  const saveBookingStates = async (states: Record<number, any>) => {
    try {
      const key = await getBookingStorageKey();
      console.log('💾 Attempting to save booking states with key:', key);
      if (key) {
        await AsyncStorage.setItem(key, JSON.stringify(states));
        console.log('💾 Booking states saved to AsyncStorage:', states);
      } else {
        console.log('❌ Cannot save - missing key. teacher?.email:', teacher?.email, 'email param:', email);
      }
    } catch (error) {
      console.error('Error saving booking states:', error);
    }
  };

  // Load booking states from AsyncStorage
  const loadBookingStates = async () => {
    try {
      const key = await getBookingStorageKey();
      console.log('📦 Attempting to load booking states with key:', key);
      if (key) {
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('📦 Booking states loaded from AsyncStorage:', parsed);
          setBookingStates(parsed);
          return parsed;
        } else {
          console.log('ℹ️ No saved booking states found for key:', key);
        }
      } else {
        console.log('❌ Cannot load - missing key. teacher?.email:', teacher?.email, 'email param:', email);
      }
    } catch (error) {
      console.error('Error loading booking states:', error);
    }
    return {};
  };

  // Clear booking states from AsyncStorage (when all bookings resolved)
  const clearBookingStates = async () => {
    try {
      const key = await getBookingStorageKey();
      if (key) {
        await AsyncStorage.removeItem(key);
        console.log('🗑️ Booking states cleared from AsyncStorage');
      }
    } catch (error) {
      console.error('Error clearing booking states:', error);
    }
  };

  useEffect(() => {
    checkSubscription();
    fetchStudentProfile();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (teacher?.category) {
      fetchSimilarTeachers(teacher.category);
    }
  }, [teacher?.category]);

  // Detect screen width for responsive web styles
  useEffect(() => {
    if (Platform.OS === 'web') {
      const checkScreenSize = () => {
        const width = Dimensions.get('window').width;
        setIsSmallWebScreen(width < 1024);
      };
      checkScreenSize();
      const subscription = Dimensions.addEventListener('change', checkScreenSize);
      return () => subscription?.remove();
    }
  }, []);

  // Fetch existing bookings after teacher is loaded
  useEffect(() => {
    if (teacher?.email && teacher?.tuitions) {
      console.log('📋 Teacher loaded, fetching existing bookings...', teacher.email);
      // First load from AsyncStorage for immediate UI
      loadBookingStates().then(() => {
        // Then sync with server to get latest status
        fetchExistingBookings();
      });
    }
  }, [teacher?.email, teacher?.tuitions]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let unsubscribeStatusUpdate: (() => void) | null = null;
    let unsubscribeRequestSent: (() => void) | null = null;

    const setupSocket = async () => {
      try {
        await socketService.connect();
        setSocketConnected(true);
        console.log('🔌 Student WebSocket connected');

        // Listen for booking status updates from teacher
        unsubscribeStatusUpdate = socketService.on('booking_status_update', (data) => {
          console.log('📬 Booking status update received:', data);

          // Find the tuition index for this booking - try by bookingId first
          let bookingIndex: number | undefined;

          // First try to find by bookingId
          const foundIndex = Object.keys(bookingStates).find(key => {
            const state = bookingStates[parseInt(key)];
            return state?.bookingId && state.bookingId === data.bookingId;
          });

          if (foundIndex !== undefined) {
            bookingIndex = parseInt(foundIndex);
          } else if (data.subject && teacher?.tuitions) {
            // Fallback: find by subject/class match
            bookingIndex = teacher.tuitions.findIndex((t: any) =>
              (t.subject || t.skill) === data.subject &&
              (t.class || t.className) === data.className
            );
          }

          if (bookingIndex !== undefined && bookingIndex !== -1) {
            console.log(`✅ Updating booking state for index ${bookingIndex} to ${data.status}`);

            setBookingState(bookingIndex, {
              status: data.status,
              isProcessing: false,
              requestSent: true,
              bookingId: data.bookingId
            });

            // Show notification
            if (data.status === 'accepted') {
              Alert.alert(
                '🎉 Request Accepted!',
                `${data.teacherName || teacher?.name || 'The teacher'} accepted your request for ${data.subject}. You can now proceed to payment.`,
                [
                  { text: 'Great!', style: 'default' },
                  {
                    text: 'Proceed to Pay',
                    onPress: () => {
                      const tuition = teacher?.tuitions?.[bookingIndex!];
                      if (tuition) {
                        // Determine class info based on board type
                        const isUniversity = tuition?.board === 'Universities';
                        const className = isUniversity 
                          ? `${tuition?.university} (${tuition?.year})`
                          : (tuition?.class || tuition?.className);
                        router.push({
                          pathname: "/(tabs)/StudentDashBoard/BookClass",
                          params: {
                            teacherEmail: teacher?.email,
                            teacherName: teacher?.name,
                            teacherProfilePic: teacher?.profilepic,
                            selectedSubject: tuition?.subject || tuition?.skill,
                            selectedClass: className,
                            charge: tuition?.charge?.toString().replace(/[₹,]/g, '').trim(),
                            description: teacher?.introduction,
                          },
                        });
                      }
                    }
                  }
                ]
              );
            } else if (data.status === 'rejected') {
              Alert.alert(
                'Request Declined',
                `${data.teacherName || teacher?.name || 'The teacher'} is not available for ${data.subject} at this time`,
                [{ text: 'OK', style: 'default' }]
              );
            }
          } else {
            console.warn('⚠️ Could not find booking index for status update:', data);
          }
        });

        // Listen for request sent confirmation
        unsubscribeRequestSent = socketService.on('booking_request_sent', (data) => {
          console.log('✅ Booking request sent confirmation:', data);
          if (selectedTuitionIndex !== null && data.success) {
            setBookingState(selectedTuitionIndex, {
              bookingId: data.bookingId,
              status: 'pending'
            });
          }
        });

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        setSocketConnected(false);
      }
    };

    setupSocket();

    return () => {
      if (unsubscribeStatusUpdate) unsubscribeStatusUpdate();
      if (unsubscribeRequestSent) unsubscribeRequestSent();
    };
  }, []);

  // Polling mechanism to check booking status periodically (fallback for WebSocket)
  useEffect(() => {
    const pollBookingStatus = async () => {
      try {
        console.log('🔄 Polling: Checking booking status...');
        const auth = await getAuthData();
        if (!auth?.token || !teacher?.email) {
          console.log('🔄 Polling: Skipping - no auth or teacher email');
          return;
        }

        const response = await axios.get(`${BASE_URL}/api/bookings/student-requests`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });

        console.log('🔄 Polling: Got', response.data.requests?.length || 0, 'total requests');

        if (response.data.success && response.data.requests) {
          // Filter requests for this teacher
          const teacherRequests = response.data.requests.filter(
            (req: any) => req.teacherEmail === teacher?.email
          );

          console.log('🔄 Polling: Found', teacherRequests.length, 'requests for this teacher');

          // Update booking states based on fetched requests
          teacherRequests.forEach((req: any) => {
            // Find the tuition index that matches this request
            const tuitions = teacher?.tuitions || [];
            const tuitionIndex = tuitions.findIndex((t: any) =>
              (t.subject || t.skill) === req.subject &&
              (t.class || t.className) === req.className
            );

            if (tuitionIndex !== -1) {
              const currentState = getBookingState(tuitionIndex);
              const newStatus = req.status;

              console.log(`🔄 Polling: Tuition ${tuitionIndex} current=${currentState.status}, new=${newStatus}`);

              // Update if status changed or bookingId not set yet
              if (currentState.status !== newStatus || !currentState.bookingId) {
                console.log(`🔄 Polling: Updating tuition ${tuitionIndex} status from ${currentState.status} to ${newStatus}`);

                setBookingState(tuitionIndex, {
                  status: newStatus,
                  requestSent: newStatus === 'pending' || newStatus === 'accepted' || newStatus === 'subscribed',
                  bookingId: req.id
                });

                // Show alert when status changes to accepted
                if (newStatus === 'accepted' && currentState.status !== 'accepted') {
                  Alert.alert(
                    '🎉 Request Accepted!',
                    `${teacher?.name || 'The teacher'} accepted your request for ${req.subject}. You can now proceed to payment.`,
                    [
                      { text: 'OK', style: 'default' },
                      {
                        text: 'Proceed to Pay',
                        onPress: () => {
                          const tuition = teacher?.tuitions?.[tuitionIndex];
                          if (tuition) {
                            // Determine class info based on board type
                            const isUniversity = tuition?.board === 'Universities';
                            const className = isUniversity 
                              ? `${tuition?.university} (${tuition?.year})`
                              : (tuition?.class || tuition?.className);
                            router.push({
                              pathname: "/(tabs)/StudentDashBoard/BookClass",
                              params: {
                                teacherEmail: teacher?.email,
                                teacherName: teacher?.name,
                                teacherProfilePic: teacher?.profilepic,
                                selectedSubject: tuition?.subject || tuition?.skill,
                                selectedClass: className,
                                charge: tuition?.charge?.toString().replace(/[₹,]/g, '').trim(),
                                description: teacher?.introduction,
                              },
                            });
                          }
                        }
                      }
                    ]
                  );
                }
              } else {
                console.log(`🔄 Polling: No change needed for tuition ${tuitionIndex}`);
              }
            } else {
              console.log('🔄 Polling: No matching tuition found for request:', req.subject, req.className);
            }
          });
        }
      } catch (error) {
        console.error('🔄 Polling: Error checking booking status:', error);
      }
    };

    // Run immediately on mount, then every 10 seconds
    pollBookingStatus();
    const interval = setInterval(pollBookingStatus, 10000);

    return () => clearInterval(interval);
  }, [teacher?.email, teacher?.tuitions]);

  // Helper to get or initialize booking state for a tuition
const getBookingState = (index: number) => ({
  isProcessing: bookingStates[index]?.isProcessing || false,
  requestSent: bookingStates[index]?.requestSent || false,
  showTooltip: bookingStates[index]?.showTooltip || false,
  status: bookingStates[index]?.status || null,
  bookingId: bookingStates[index]?.bookingId || null
});

const setBookingState = (index: number, state: Partial<{ isProcessing: boolean; requestSent: boolean; showTooltip: boolean; status?: 'pending' | 'accepted' | 'rejected' | null; bookingId?: string | null }>) => {
  setBookingStates(prev => {
    const newStates = {
      ...prev,
      [index]: { ...getBookingState(index), ...state }
    };
    // Save to AsyncStorage immediately
    saveBookingStates(newStates);
    return newStates;
  });
};

const toggleTooltip = (index: number) => {
  setBookingState(index, { showTooltip: !getBookingState(index).showTooltip });
};

// Fetch existing bookings from backend to restore state on page reload
const fetchExistingBookings = async () => {
  try {
    console.log('🔍 fetchExistingBookings called');
    const auth = await getAuthData();
    if (!auth?.token) {
      console.log('❌ No auth token');
      return;
    }
    if (!teacher?.email) {
      console.log('❌ No teacher email');
      return;
    }

    console.log('📡 Fetching bookings for teacher:', teacher.email);
    const response = await axios.get(`${BASE_URL}/api/bookings/student-requests`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });

    console.log('📦 API response:', response.data);

    if (response.data.success && response.data.requests) {
      // Filter requests for this teacher
      const teacherRequests = response.data.requests.filter(
        (req: any) => req.teacherEmail === teacher?.email
      );

      console.log('👨‍🏫 Found', teacherRequests.length, 'requests for this teacher');
      console.log('📚 Teacher tuitions:', teacher?.tuitions?.map((t: any) => ({ subject: t.subject || t.skill, class: t.class || t.className })));

      // Update booking states based on existing requests
      teacherRequests.forEach((req: any) => {
        console.log('🔎 Processing request:', { subject: req.subject, className: req.className, status: req.status });

        // Find the tuition index that matches this request
        const tuitions = teacher?.tuitions || [];
        const tuitionIndex = tuitions.findIndex((t: any) => {
          const match = (t.subject || t.skill) === req.subject &&
            (t.class || t.className) === req.className;
          console.log('  📝 Checking tuition:', { subject: t.subject || t.skill, class: t.class || t.className, match });
          return match;
        });

        console.log('✅ Matched tuition index:', tuitionIndex);

        if (tuitionIndex !== -1) {
          console.log('🔄 Updating booking state for tuition', tuitionIndex, 'to status:', req.status);
          setBookingState(tuitionIndex, {
            status: req.status,
            requestSent: req.status === 'pending' || req.status === 'accepted',
            bookingId: req.id
          });
        } else {
          console.log('❌ No matching tuition found for request');
        }
      });
    } else {
      console.log('ℹ️ No requests found or API returned error');
    }
  } catch (error) {
    console.error('❌ Error fetching existing bookings:', error);
  }
};

// Main Book Now handler - checks subscription first, then handles booking flow
const handleBookNow = async (tuition: any, index: number) => {
  try {
    const auth = await getAuthData();
    if (!auth?.token) {
      Alert.alert("Session Expired", "Please log in again.");
      return;
    }

    // Wait for subscription check to complete if still loading
    if (isLoading) {
      Alert.alert("Loading", "Please wait while we check your subscription status...");
      return;
    }

    const state = getBookingState(index);

    // If request is already pending, don't send another one
    if (state.status === 'pending') {
      Alert.alert(
        '⏳ Request Pending',
        'Your request is already pending. You will be notified when the teacher responds.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If teacher has accepted, navigate to BookClass for payment
    if (state.status === 'accepted') {
      // Determine class info based on board type
      const isUniversity = tuition?.board === 'Universities';
      const className = isUniversity 
        ? `${tuition?.university} (${tuition?.year})`
        : (tuition?.class || tuition?.className);
      router.push({
        pathname: "/(tabs)/StudentDashBoard/BookClass",
        params: {
          teacherEmail: teacher?.email,
          teacherName: teacher?.name,
          teacherProfilePic: teacher?.profilepic,
          selectedSubject: tuition?.subject || tuition?.skill,
          selectedClass: className,
          charge: tuition?.charge?.toString().replace(/[₹,]/g, '').trim(),
          description: teacher?.introduction,
        },
      });
      return;
    }

    // If request was rejected, show message and don't allow retry
    if (state.status === 'rejected') {
      Alert.alert(
        'Request Declined',
        'Your request was declined by the teacher. You cannot book this class at this time.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If already subscribed, show message and don't allow changes
    if (state.status === 'subscribed') {
      Alert.alert(
        'Already Subscribed',
        'You are already subscribed to this teacher. Your subscription is permanent.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Store selected tuition for confirmation
    setSelectedTuition({ ...tuition, index });
    setSelectedTuitionIndex(index);

    // First check if subscription is active (priority check)
    if (!hasActiveSubscription) {
      // Redirect to subscription page if no active subscription
      Alert.alert(
        'Subscription Required',
        'You need an active subscription to book classes. Redirecting to subscription page...',
        [
          {
            text: 'Subscribe Now',
            onPress: () => {
              router.push({
                pathname: "/(tabs)/StudentDashBoard/Subscription",
                params: {
                  redirectTo: 'TeacherDetails',
                  teacherEmail: teacher?.email || email,
                  teacherName: teacher?.name || 'Teacher',
                  teacherData: teacher ? JSON.stringify(teacher) : undefined,
                  selectedSubject: tuition?.subject || tuition?.skill,
                  selectedClass: tuition?.class || tuition?.className,
                  charge: tuition?.charge?.toString().replace(/[₹,]/g, '').trim()
                }
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // If subscription is active, show confirmation modal
    // Removed spotlight check to allow booking without spotlight requirement
    setShowConfirmationModal(true);
  } catch (error) {
    console.error('Error in handleBookNow:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};

// Handle confirmation - send request to teacher for specific tuition via WebSocket
const handleConfirmRequest = async () => {
  setShowConfirmationModal(false);

  if (selectedTuition === null || selectedTuitionIndex === null) return;

  const index = selectedTuitionIndex;

  // Check if request already exists for this tuition
  const existingState = getBookingState(index);
  if (existingState.status === 'pending') {
    Alert.alert('Request Already Sent', 'You have already sent a request for this class. Please wait for the teacher to respond.');
    return;
  }
  if (existingState.status === 'accepted') {
    Alert.alert('Request Already Accepted', 'The teacher has already accepted your request. You can proceed to payment.');
    return;
  }
  if (existingState.status === 'subscribed') {
    Alert.alert('Already Subscribed', 'You are already subscribed to this teacher. Your subscription is permanent.');
    return;
  }

  setBookingState(index, { isProcessing: true });

  try {
    const auth = await getAuthData();
    if (!auth?.token) {
      Alert.alert("Session Expired", "Please log in again.");
      setBookingState(index, { isProcessing: false });
      return;
    }

    // Determine class info based on board type
    const isUniversity = selectedTuition?.board === 'Universities';
    const className = isUniversity 
      ? `${selectedTuition?.university} (${selectedTuition?.year})`
      : (selectedTuition?.class || selectedTuition?.className);

    // Send booking request via WebSocket for real-time delivery
    socketService.sendBookingRequest({
      teacherEmail: teacher?.email,
      subject: selectedTuition?.subject || selectedTuition?.skill,
      className: className,
      charge: selectedTuition?.charge,
      board: selectedTuition?.board,
      university: selectedTuition?.university,
      year: selectedTuition?.year,
      studentInfo: {
        name: auth.name,
        email: auth.email,
        profilePic: profileImage
      }
    });

    // Also send via API for persistence
    // Build className dynamically based on board type for backend compatibility
    const isUniversityBooking = selectedTuition?.board === 'Universities';
    const dynamicClassName = isUniversityBooking
      ? `${selectedTuition?.university} (${selectedTuition?.year})`
      : (selectedTuition?.class || selectedTuition?.className || '');

    const response = await axios.post(
      `${BASE_URL}/api/bookings/request`,
      {
        teacherEmail: teacher?.email,
        subject: selectedTuition?.subject || selectedTuition?.skill,
        className: dynamicClassName,
        charge: selectedTuition?.charge
      },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    if (response.data.success) {
      setBookingState(index, {
        isProcessing: false,
        requestSent: true,
        bookingId: response.data.booking?.id,
        status: 'pending'
      });

      const className = selectedTuition?.subject || selectedTuition?.skill || 'the class';
      Alert.alert(
        '✅ Request Sent!',
        `Your request for ${className} has been sent to ${teacher?.name || 'the teacher'}. You will be notified once they respond.`,
        [{ text: 'OK' }]
      );
    } else if (response.data.existingBooking) {
      // Backend returned existing pending request - restore state
      setBookingState(index, {
        isProcessing: false,
        requestSent: true,
        bookingId: response.data.existingBooking.id,
        status: response.data.existingBooking.status
      });

      Alert.alert(
        '⏳ Request Already Pending',
        response.data.message || 'You already have a pending request for this class.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error sending request:', error);
    setBookingState(index, { isProcessing: false });
    Alert.alert('Error', 'Failed to send request. Please try again.');
  }
};

// Navigate to BookClass after request is accepted (for demo purposes)
const navigateToBooking = () => {
  const tuition = selectedTuition || teacher?.tuitions?.[0];
  if (!tuition) return;

  router.push({
    pathname: "/(tabs)/StudentDashBoard/BookClass",
    params: {
      teacherName: teacher.name,
      teacherProfilePic: teacher.profilepic,
      teacherEmail: teacher.email,
      selectedSubject: tuition?.subject || tuition?.skill,
      selectedClass: tuition?.class || tuition?.className,
      charge: tuition?.charge?.toString().replace(/[₹,]/g, '').trim() || 0,
      description: teacher.introduction,
    },
  });
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

  // Helper functions
  const initials = (name: string) =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';

  const BadgeMock = ({ text }: { text: string }) => (
    <View style={[webStyles.badgeWrapper, isSmallWebScreen && webStyles.badgeWrapperSmall]}>
      <View style={[webStyles.badgeCircleOuter, isSmallWebScreen && webStyles.badgeCircleOuterSmall]}>
        <View style={[webStyles.badgeCircleInner, isSmallWebScreen && webStyles.badgeCircleInnerSmall]}>
          <Ionicons name="trophy" size={isSmallWebScreen ? 16 : 20} color={COLORS.starYellow} />
        </View>
      </View>
      <Text style={[webStyles.badgeText, isSmallWebScreen && webStyles.badgeTextSmall]}>{text}</Text>
    </View>
  );

  const AchievementCard = ({ achievement }: { achievement: any }) => (
    <View style={webStyles.achievementCard}>
      <View style={webStyles.achievementIconBg}>
        <Ionicons name={achievement.icon} size={20} color={COLORS.white} />
      </View>
      <View style={webStyles.achievementContent}>
        <Text style={webStyles.achievementTitle}>{achievement.title}</Text>
        <Text style={webStyles.achievementDesc}>{achievement.description}</Text>
      </View>
    </View>
  );

  const AvailabilityStatus = () => (
    <View style={webStyles.availabilityContainer}>
      <View style={[webStyles.availabilityDot, { 
        backgroundColor: teacherAvailability === 'available' ? COLORS.ratingGreen : 
                      teacherAvailability === 'busy' ? COLORS.starYellow : '#9CA3AF' 
      }]} />
      <Text style={webStyles.availabilityText}>
        {teacherAvailability === 'available' ? 'Available for classes' : 
         teacherAvailability === 'busy' ? 'Currently busy' : 'Offline'}
      </Text>
    </View>
  );

  const LanguagesSection = () => (
    <View style={webStyles.languagesContainer}>
      <Text style={webStyles.sectionTitle}>Languages Spoken</Text>
      <View style={webStyles.languageGrid}>
        {teacherLanguages.map((lang, index) => (
          <View key={index} style={webStyles.languagePill}>
            <Ionicons name="language-outline" size={14} color={COLORS.primary} />
            <Text style={webStyles.languageText}>{lang}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const SubjectCard = ({ tuition, index }: { tuition: any; index: number }) => {
    const state = getBookingState(index);
    return (
    <View style={webStyles.subCardContainer}>
      <View style={webStyles.subCardTopRow}>
        <View style={webStyles.subCardIconBg}>
          <Ionicons name="book-outline" size={12} color={COLORS.primary} />
        </View>
        <Text style={webStyles.subCardTitle}>
          {teacher.category === "Skill teacher" 
            ? tuition.skill 
            : tuition.board === "Universities" 
              ? `${tuition.subject} - ${tuition.university} (${tuition.year})`
              : `${tuition.subject} - ${tuition.class || tuition.className || 'N/A'}`
          }
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
          <Text style={webStyles.subCardPriceText}>{tuition.charge}</Text>
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
      <View style={webStyles.bookBtnWrapper}>
        <TouchableOpacity
          style={[
            webStyles.bookBtn,
            (isLoading || state.isProcessing) && webStyles.bookBtnDisabled,
            state.status === 'accepted' && { backgroundColor: '#22C55E' },
            state.status === 'rejected' && { backgroundColor: '#EF4444' },
            state.status === 'pending' && { backgroundColor: '#F59E0B' },
            state.status === 'subscribed' && { backgroundColor: '#10B981' }
          ]}
          onPress={() => handleBookNow(tuition, index)}
          disabled={isLoading || state.isProcessing || state.status === 'pending' || state.status === 'rejected' || state.status === 'subscribed'}
        >
          {state.isProcessing ? (
            <View style={webStyles.processingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={webStyles.bookBtnText}>Sending...</Text>
            </View>
          ) : state.status === 'accepted' ? (
            <View style={webStyles.processingContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={webStyles.bookBtnText}>Accepted! Book Now</Text>
            </View>
          ) : state.status === 'rejected' ? (
            <View style={webStyles.processingContainer}>
              <Ionicons name="close-circle" size={18} color="#ffffff" />
              <Text style={webStyles.bookBtnText}>Declined</Text>
            </View>
          ) : state.status === 'pending' ? (
            <View style={webStyles.processingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={webStyles.bookBtnText}>Pending...</Text>
            </View>
          ) : state.status === 'subscribed' ? (
            <Text style={webStyles.bookBtnText}>✓ Subscribed</Text>
          ) : (
            <Text style={webStyles.bookBtnText}>Book Class</Text>
          )}
        </TouchableOpacity>
        
        {/* Connection Status Indicator */}
        {socketConnected && (
          <View style={[webStyles.liveIndicator, { position: 'absolute', top: -5, right: -5 }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
          </View>
        )}
        
        {/* Info Icon with Tooltip */}
        <TouchableOpacity 
          style={webStyles.infoIconWrapper}
          onPress={() => toggleTooltip(index)}
        >
          <Ionicons name="information-circle" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        
        {/* Tooltip Popup */}
        {state.showTooltip && (
          <View style={webStyles.tooltipWrapper}>
            <View style={webStyles.tooltipArrowWeb} />
            <Text style={webStyles.tooltipTextWeb}>
              {state.status === 'pending' 
                ? "Your request is pending. You'll be notified when the teacher responds."
                : state.status === 'accepted'
                ? "🎉 Teacher accepted! You can now proceed to book and pay."
                : state.status === 'rejected'
                ? "Teacher is not available for this class at the moment."
                : state.status === 'subscribed'
                ? "✓ You are subscribed to this teacher's classes."
                : "Click to send a booking request to this teacher."}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
  };

  const ProfileHeader = () => (
    <View style={[webStyles.profileHeaderBox, isSmallWebScreen && webStyles.profileHeaderBoxSmall]}>
      <View style={[webStyles.profileLeftCol, isSmallWebScreen && webStyles.profileLeftColSmall]}>
        <Image source={getImageSource(teacher.profilepic) || require("../../../assets/images/Profile.png")} style={[webStyles.profAvatarlg, isSmallWebScreen && webStyles.profAvatarlgSmall]} />
        <View style={[webStyles.profInfoBlock, isSmallWebScreen && webStyles.profInfoBlockSmall]}>
          <View style={webStyles.profNameRow}>
            <Text style={[webStyles.profName, isSmallWebScreen && webStyles.profNameSmall]}>{teacher.name}</Text>
            <Ionicons name="star" size={isSmallWebScreen ? 12 : 14} color={COLORS.starYellow} style={{ marginLeft: 8 }} />
            <Text style={[webStyles.profRating, isSmallWebScreen && webStyles.profRatingSmall]}>{averageRating.toFixed(1)}</Text>
            <Ionicons name="checkmark-circle" size={isSmallWebScreen ? 14 : 16} color={COLORS.ratingGreen} style={{ marginLeft: 16 }} />
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="newspaper-outline" size={isSmallWebScreen ? 12 : 14} color={COLORS.textPrimary} />
            <Text style={[webStyles.profDetailText, isSmallWebScreen && webStyles.profDetailTextSmall]}>{teacher.category || 'Senior Teacher'}</Text>
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="business-outline" size={isSmallWebScreen ? 12 : 14} color={COLORS.primary} />
            <Text style={[webStyles.profDetailTextBlue, isSmallWebScreen && webStyles.profDetailTextBlueSmall]}>{teacher.university || 'North Bengal University'}</Text>
          </View>
          <View style={webStyles.profDetailRow}>
            <Ionicons name="location-outline" size={isSmallWebScreen ? 12 : 14} color={COLORS.textPrimary} />
            <Text style={[webStyles.profDetailText, isSmallWebScreen && webStyles.profDetailTextSmall]}>West Bengal, India</Text>
          </View>

          {/* New additions */}
          <AvailabilityStatus />
          <LanguagesSection />
        </View>
      </View>
      <View style={[webStyles.profileRightCol, isSmallWebScreen && webStyles.profileRightColSmall]}>
        {BADGES.map((b, i) => <BadgeMock key={i} text={b} />)}
      </View>
    </View>
  );

  const MockRecommendedTeacher = () => {
    const mockTeachers = [
      { name: 'Priya Sharma', subject: 'Mathematics', points: ['5+ years experience', '98% pass rate'] },
      { name: 'Rahul Verma', subject: 'Physics', points: ['IIT graduate', 'Expert in problem solving'] },
      { name: 'Anita Das', subject: 'Chemistry', points: ['PhD holder', 'Research experience'] },
    ];
    const randomTeacher = mockTeachers[Math.floor(Math.random() * mockTeachers.length)];
    const randomImages = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    ];
    const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];

    return (
      <View style={webStyles.mockRecommendedCard}>
        <View style={webStyles.mockRecommendedHeader}>
          <Text style={webStyles.mockRecommendedTitle}>Recommended Teacher</Text>
        </View>
        <View style={webStyles.mockRecommendedContent}>
          <Image source={{ uri: randomImage }} style={webStyles.mockRecommendedImage} />
          <Text style={webStyles.mockRecommendedName}>{randomTeacher.name}</Text>
          <Text style={webStyles.mockRecommendedSubject}>{randomTeacher.subject}</Text>
          <View style={webStyles.mockRecommendedPoints}>
            {randomTeacher.points.map((point, idx) => (
              <View key={idx} style={webStyles.mockRecommendedPoint}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.ratingGreen} />
                <Text style={webStyles.mockRecommendedPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

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
                <View style={styles.bookButtonWrapper}>
                  {/* Book button for first tuition - each tuition has separate booking */}
                  <TouchableOpacity
                    style={[
                      styles.bookNowButton,
                      (isLoading || getBookingState(0).isProcessing) && styles.bookButtonDisabled,
                      getBookingState(0).status === 'accepted' && { backgroundColor: '#22C55E' },
                      getBookingState(0).status === 'rejected' && { backgroundColor: '#EF4444' },
                      getBookingState(0).status === 'pending' && { backgroundColor: '#F59E0B' }
                    ]}
                    onPress={() => handleBookNow(teacher?.tuitions?.[0], 0)}
                    disabled={isLoading || getBookingState(0).isProcessing || getBookingState(0).status === 'pending' || getBookingState(0).status === 'rejected'}
                  >
                    {getBookingState(0).isProcessing ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.bookNowText}>Sending...</Text>
                      </View>
                    ) : getBookingState(0).status === 'accepted' ? (
                      <View style={styles.processingContainer}>
                        <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                        <Text style={styles.bookNowText}>Accepted! Book Now</Text>
                      </View>
                    ) : getBookingState(0).status === 'rejected' ? (
                      <View style={styles.processingContainer}>
                        <Ionicons name="close-circle" size={18} color="#ffffff" />
                        <Text style={styles.bookNowText}>Declined</Text>
                      </View>
                    ) : getBookingState(0).status === 'pending' ? (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.bookNowText}>Pending...</Text>
                      </View>
                    ) : (
                      <Text style={styles.bookNowText}>Book {teacher?.tuitions?.[0]?.subject || 'Class'} Now</Text>
                    )}
                  </TouchableOpacity>
                  
                  {/* Info Icon with Tooltip */}
                  <TouchableOpacity 
                    style={styles.infoIconContainer}
                    onPress={() => toggleTooltip(0)}
                  >
                    <Ionicons name="information-circle" size={24} color="#4255ff" />
                  </TouchableOpacity>
                  
                  {/* Tooltip Popup */}
                  {getBookingState(0).showTooltip && (
                    <View style={styles.tooltipContainer}>
                      <View style={styles.tooltipArrow} />
                      <Text style={styles.tooltipText}>
                        The teacher will accept your request then only you will be allowed to book and pay for your class from this teacher.
                      </Text>
                    </View>
                  )}
                </View>
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

          {/* Availability Status for Mobile */}
          <View style={styles.availabilityContainer}>
            <View style={[styles.availabilityDot, { 
              backgroundColor: teacherAvailability === 'available' ? '#22C55E' : 
                            teacherAvailability === 'busy' ? '#FBBF24' : '#9CA3AF' 
            }]} />
            <Text style={styles.availabilityText}>
              {teacherAvailability === 'available' ? 'Available for classes' : 
               teacherAvailability === 'busy' ? 'Currently busy' : 'Offline'}
            </Text>
          </View>

          {/* Languages Section for Mobile */}
          <View style={styles.languagesContainer}>
            <Text style={styles.languagesTitle}>Languages Spoken</Text>
            <View style={styles.languageRow}>
              {teacherLanguages.map((lang, index) => (
                <View key={index} style={styles.languagePill}>
                  <Ionicons name="language-outline" size={12} color="#4255ff" />
                  <Text style={styles.languageText}>{lang}</Text>
                </View>
              ))}
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
                      {teacher.category === "Skill teacher" 
                        ? `Skill: ${t.skill}` 
                        : t.board === "Universities"
                          ? `${t.subject} - ${t.university} (${t.year})`
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
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: wp(isTablet ? "3.1%" : "4.27%"), lineHeight: hp("2.826%"), marginBottom: hp("2.15%"), color: "#fff" }}>
              Similar Tutions
            </Text>
            {similarTutions.map((item) => (
              <View key={item.id} style={{ flexDirection: "row", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center" }}>
                <Image source={item.image} style={{ width: wp("30.933%"), height: hp("21.130%"), borderRadius: wp("2.13%"), marginRight: wp("4.27%") }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: wp(isTablet ? "3.21%" : "4.27%"), color: "#fff", fontFamily: "RedHatDisplay_400Regular", lineHeight: hp("2.15%") }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: wp(isTablet ? "3.21%" : "4.27%"), color: "#fff", marginVertical: hp("0.504%") }}>
                    ⭐ {item.rating}/5
                  </Text>
                  <Text style={{ fontSize: wp(isTablet ? "3.21%" : "4.27%"), color: "#fff", lineHeight: hp("3.23%") }}>
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

  // Recommended Teacher Card Component - based on tutor-profile-dashboard reference
  const RecommendedTeacherCard = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleViewProfile = (teacherEmail: string) => {
      router.push({
        pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
        params: { email: teacherEmail }
      });
    };

    const getTeacherImage = (profilePic: string) => {
      const source = getImageSource(profilePic);
      return source || require('../../../assets/images/Profile.png');
    };

    const getTeacherPrice = (tuitions: any[]) => {
      if (!tuitions || tuitions.length === 0) return '₹800/ hr';

      const tuition = tuitions[0];
      // Check for various possible charge field names
      const charge = tuition.charge || tuition.price || tuition.fee || tuition.amount || tuition.hourlyRate || tuition.rate;

      // Parse charge as number if it's a string
      let numericCharge: number;
      if (typeof charge === 'string') {
        // Remove currency symbols and parse
        numericCharge = parseInt(charge.replace(/[^0-9]/g, ''), 10);
      } else if (typeof charge === 'number') {
        numericCharge = charge;
      } else {
        numericCharge = 0;
      }

      // Return formatted price or fallback
      return numericCharge > 0 ? `₹${numericCharge}/ hr` : '₹800/ hr';
    };

    const getTeacherSubject = (category: string, tuitions: any[]) => {
      if (category) return category.toUpperCase();
      if (tuitions && tuitions.length > 0) return tuitions[0].subject?.toUpperCase() || 'SCIENCE';
      return 'SCIENCE';
    };

    if (similarTeachersLoading) {
      return (
        <View style={[webStyles.recommendedCard, { marginTop: 24 }]}>
          <View style={webStyles.recommendedCardHeader}>
            <Text style={webStyles.recommendedCardHeaderText}>Recommended Teacher</Text>
          </View>
          <View style={webStyles.recommendedCardContent}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        </View>
      );
    }

    if (similarTeachers.length === 0) return null;

    const currentTeacher = similarTeachers[currentIndex];

    return (
      <View style={[webStyles.recommendedCard, { marginTop: 24 }]}>
        {/* Blue Header */}
        <View style={webStyles.recommendedCardHeader}>
          <Text style={webStyles.recommendedCardHeaderText}>Recommended Teacher</Text>
        </View>

        {/* Card Content */}
        <View style={webStyles.recommendedCardContent}>
          {/* Teacher Image with Badge Overlay */}
          <View style={webStyles.recommendedImageContainer}>
            <Image
              source={getTeacherImage(currentTeacher.profilepic)}
              style={webStyles.recommendedImage}
              resizeMode="cover"
            />
            {/* Subject Badge */}
            <View style={webStyles.recommendedSubjectBadge}>
              <Text style={webStyles.recommendedSubjectBadgeText}>
                {getTeacherSubject(currentTeacher.category, currentTeacher.tuitions)}
              </Text>
            </View>
          </View>

          {/* Teacher Info Section */}
          <View style={webStyles.recommendedInfoSection}>
            {/* Name and Rating Row */}
            <View style={webStyles.recommendedNameRow}>
              <Text style={webStyles.recommendedTeacherName} numberOfLines={1}>
                {currentTeacher.name}
              </Text>
              <View style={webStyles.recommendedRatingBadge}>
                <Ionicons name="star" size={11} color={COLORS.starYellow} />
                <Text style={webStyles.recommendedRatingText}>4.9</Text>
              </View>
            </View>

            {/* Experience/Description */}
            <Text style={webStyles.recommendedDescription} numberOfLines={2}>
              {currentTeacher.introduction || currentTeacher.workexperience || 'PhD in Physics with 10 years of experience helping students excel in board exams and competitive tests.'}
            </Text>

            {/* Price and View Profile Row */}
            <View style={webStyles.recommendedFooter}>
              <Text style={webStyles.recommendedPrice}>{getTeacherPrice(currentTeacher.tuitions)}</Text>
              <TouchableOpacity
                style={webStyles.recommendedViewProfileBtn}
                onPress={() => handleViewProfile(currentTeacher.email)}
              >
                <Text style={webStyles.recommendedViewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Carousel Dots */}
          {similarTeachers.length > 1 && (
            <View style={webStyles.recommendedDots}>
              {similarTeachers.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    webStyles.recommendedDot,
                    index === currentIndex && webStyles.recommendedDotActive
                  ]}
                  onPress={() => setCurrentIndex(index)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Similar Teachers Section Component (legacy - kept for compatibility)
  const SimilarTeachersSection = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleViewProfile = (teacherEmail: string) => {
      router.push({
        pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
        params: { email: teacherEmail }
      });
    };

    const getTeacherImage = (profilePic: string) => {
      const source = getImageSource(profilePic);
      return source || require('../../../assets/images/Profile.png');
    };

    const getTeacherPrice = (tuitions: any[]) => {
      if (!tuitions || tuitions.length === 0) return '₹800/ hr';

      const tuition = tuitions[0];
      const charge = tuition.charge || tuition.price || tuition.fee || tuition.amount || tuition.hourlyRate || tuition.rate;

      let numericCharge: number;
      if (typeof charge === 'string') {
        numericCharge = parseInt(charge.replace(/[^0-9]/g, ''), 10);
      } else if (typeof charge === 'number') {
        numericCharge = charge;
      } else {
        numericCharge = 0;
      }

      return numericCharge > 0 ? `₹${numericCharge}/hr` : '₹800/ hr';
    };

    const getTeacherSubject = (category: string, tuitions: any[]) => {
      if (category) return category.toUpperCase();
      if (tuitions && tuitions.length > 0) return tuitions[0].subject?.toUpperCase() || 'SUBJECT';
      return 'SUBJECT';
    };

    if (similarTeachersLoading) {
      return (
        <View style={[webStyles.similarTeachersCard, { marginTop: 24 }]}>
          <View style={webStyles.similarTeachersHeader}>
            <Text style={webStyles.similarTeachersHeaderText}>Similar Tuitions</Text>
          </View>
          <View style={webStyles.similarTeachersContent}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        </View>
      );
    }

    if (similarTeachers.length === 0) return null;

    const currentTeacher = similarTeachers[currentIndex];

    return (
      <View style={[webStyles.similarTeachersCard, { marginTop: 24 }]}>
        {/* Blue Header */}
        <View style={webStyles.similarTeachersHeader}>
          <Text style={webStyles.similarTeachersHeaderText}>Similar Tuitions</Text>
        </View>

        {/* Card Content */}
        <View style={webStyles.similarTeachersContent}>
          {/* Teacher Image */}
          <View style={webStyles.teacherImageContainer}>
            <Image 
              source={getTeacherImage(currentTeacher.profilepic)} 
              style={webStyles.teacherImage}
              resizeMode="cover"
            />
          </View>

          {/* Teacher Info Card */}
          <View style={webStyles.teacherInfoCard}>
            {/* Subject Badge */}
            <Text style={webStyles.subjectBadge}>
              {getTeacherSubject(currentTeacher.category, currentTeacher.tuitions)}
            </Text>

            {/* Name and Rating Row */}
            <View style={webStyles.nameRatingRowCard}>
              <Text style={webStyles.teacherNameCard} numberOfLines={1}>
                {currentTeacher.name}
              </Text>
              <View style={webStyles.ratingBadge}>
                <Ionicons name="star" size={12} color={COLORS.starYellow} />
                <Text style={webStyles.ratingText}>4.9</Text>
              </View>
            </View>

            {/* Experience/Description */}
            <Text style={webStyles.teacherDescCard} numberOfLines={2}>
              {currentTeacher.introduction || currentTeacher.workexperience || 'Experienced teacher dedicated to helping students achieve their academic goals.'}
            </Text>

            {/* Price and View Profile Row */}
            <View style={webStyles.priceActionRow}>
              <Text style={webStyles.priceText}>{getTeacherPrice(currentTeacher.tuitions)}</Text>
              <TouchableOpacity 
                style={webStyles.viewProfileBtn}
                onPress={() => handleViewProfile(currentTeacher.email)}
              >
                <Text style={webStyles.viewProfileBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Carousel Dots */}
          {similarTeachers.length > 1 && (
            <View style={webStyles.carouselDots}>
              {similarTeachers.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    webStyles.dot,
                    index === currentIndex && webStyles.dotActive
                  ]}
                  onPress={() => setCurrentIndex(index)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Web UI (Class8ScienceProfileScreen style)
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
              <View style={[webStyles.pageNavHeader, isSmallWebScreen && webStyles.pageNavHeaderSmall]}>
                <TouchableOpacity style={[webStyles.backButton, isSmallWebScreen && webStyles.backButtonSmall]} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={isSmallWebScreen ? 18 : 20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={[webStyles.pageTitle, isSmallWebScreen && webStyles.pageTitleSmall]}>{teacher.category || 'Teacher'} | {teacher.name}</Text>
              </View>

              <View style={[webStyles.boxContainer, isSmallWebScreen && webStyles.boxContainerSmall]}>
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
                        <SubjectCard key={index} tuition={tuition} index={index} />
                      ))}
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

                    {/* Recommended Teacher Card - based on tutor-profile-dashboard reference */}
                    <RecommendedTeacherCard />

                    {/* Achievements Section */}
                    <View style={[webStyles.blueHeaderCard, { marginTop: 24 }]}>
                      <View style={webStyles.blueHeaderPanel}><Text style={webStyles.blueHeaderText}>Achievements</Text></View>
                      <View style={[webStyles.blueContentPanel, { padding: 12 }]}>
                        {ACHIEVEMENTS.map((achievement, index) => (
                          <AchievementCard key={index} achievement={achievement} />
                        ))}
                      </View>
                    </View>
        <MockRecommendedTeacher />

                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
          </View>
          </View>
    </SafeAreaView>
  );

  // Confirmation Modal Component
  const ConfirmationModal = () => (
    <Modal
      visible={showConfirmationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle" size={48} color="#3B5BFE" />
              <Text style={styles.modalTitle}>Send Booking Request?</Text>
            </View>

            <Text style={styles.modalDescription}>
              You are about to send a booking request to {teacher?.name || 'this teacher'}. The teacher will review your request and accept it before you can proceed with booking and payment.
            </Text>

            <View style={styles.modalInfoBox}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.modalInfoText}>
                Please wait for the teacher's confirmation. You will be notified once they accept your request.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmationModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmRequest}
              >
                <Text style={styles.modalButtonConfirmText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render platform-specific UI
  return (
    <>
      {Platform.OS === 'web' ? <WebUI /> : <AndroidUI />}
      <ConfirmationModal />
    </>
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

  // Mobile styles for new components
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: wp('4%'),
    marginTop: hp('2%'),
    marginHorizontal: wp('5.33%'),
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  availabilityText: {
    fontSize: wp('4%'),
    color: '#1f2937',
    fontWeight: '500',
  },

  languagesContainer: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('5.33%'),
  },
  languagesTitle: {
    fontSize: wp('4.27%'),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: hp('1%'),
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#3b5bfe',
  },
  languageText: {
    fontSize: wp('3.5%'),
    color: '#3b5bfe',
    marginLeft: 6,
    fontWeight: '500',
  },
  // Booking button styles
  bookButtonWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#6B7280',
  },
  bookButtonSuccess: {
    backgroundColor: '#10B981',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Info tooltip styles
  infoIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: '120%',
    left: -50,
    right: -50,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    zIndex: 99999,
    minWidth: wp('60%'),
    maxWidth: wp('80%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: wp('3.2%'),
    lineHeight: hp('2.5%'),
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      },
    }),
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonCancelText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B5BFE',
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
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
  pageNavHeaderSmall: { marginBottom: 16 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16
  },
  backButtonSmall: { width: 36, height: 36, marginRight: 12 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },
  pageTitleSmall: { fontSize: 18 },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 24,
    marginBottom: 32,
    shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1,
  },
  boxContainerSmall: {
    padding: 16,
    marginBottom: 24,
  },

  // --- PROFILE HEADER ---
  profileHeaderBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 24, marginBottom: 24,
  },
  profileHeaderBoxSmall: {
    flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 16, marginBottom: 16,
  },
  profileLeftCol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileLeftColSmall: { flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: 16 },
  profAvatarlg: { width: 100, height: 100, borderRadius: 50, marginRight: 24 },
  profAvatarlgSmall: { width: 80, height: 80, borderRadius: 40, marginRight: 0, marginBottom: 12 },
  profInfoBlock: { flex: 1, justifyContent: 'center' },
  profInfoBlockSmall: { width: '100%' },
  profNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  profName: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },
  profNameSmall: { fontSize: 20 },
  profRating: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.starYellow, marginLeft: 4 },
  profRatingSmall: { fontSize: 14 },
  profDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  profDetailText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textPrimary, marginLeft: 8 },
  profDetailTextSmall: { fontSize: 12 },
  profDetailTextBlue: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.primary, marginLeft: 8 },
  profDetailTextBlueSmall: { fontSize: 12 },

  profileRightCol: { flexDirection: 'row', gap: 16 },
  profileRightColSmall: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'flex-start' },
  badgeWrapper: { alignItems: 'center', width: 80 },
  badgeWrapperSmall: { width: 70 },
  badgeCircleOuter: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.starYellow, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  badgeCircleOuterSmall: { width: 50, height: 50, borderRadius: 25 },
  badgeCircleInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  badgeCircleInnerSmall: { width: 40, height: 40, borderRadius: 20 },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 9, color: COLORS.textPrimary, textAlign: 'center', marginTop: 8 },
  badgeTextSmall: { fontSize: 8 },

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
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 16, marginBottom: 32 },
  subCardContainer: { width: '23%', minWidth: 240, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.primary, padding: 16 },
  subCardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  subCardIconBg: { backgroundColor: COLORS.tagRedBg, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  subCardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary, flex: 1, flexShrink: 1 },
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
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', flex: 1 },
  bookBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.white, textAlign: 'center' },
  
  // Booking button wrapper styles
  bookBtnWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  bookBtnDisabled: {
    opacity: 0.7,
    backgroundColor: '#6B7280',
  },
  bookBtnSuccess: {
    backgroundColor: '#10B981',
  },
  infoIconWrapper: {
    marginLeft: 10,
    padding: 4,
  },
  tooltipWrapper: {
    position: 'absolute',
    bottom: '130%',
    left: -20,
    right: -20,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    zIndex: 99999,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tooltipArrowWeb: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  tooltipTextWeb: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

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

  mockRecommendedCard: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' },
  mockRecommendedHeader: { backgroundColor: '#3B5BFE', paddingVertical: 10, paddingHorizontal: 16 },
  mockRecommendedTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.white },
  mockRecommendedContent: { padding: 16, alignItems: 'center' },
  mockRecommendedImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  mockRecommendedName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.white, marginBottom: 4 },
  mockRecommendedSubject: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9CA3AF', marginBottom: 12 },
  mockRecommendedPoints: { gap: 6, width: '100%' },
  mockRecommendedPoint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mockRecommendedPointText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#D1D5DB' },

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

  // --- NEW COMPONENTS ---
  achievementCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, 
    borderRadius: 12, padding: 16, marginBottom: 12 
  },
  achievementIconBg: { 
    backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', marginRight: 16 
  },
  achievementContent: { flex: 1 },
  achievementTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary, marginBottom: 2 },
  achievementDesc: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary },

  availabilityContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, 
    borderRadius: 12, padding: 16, marginBottom: 16 
  },
  availabilityDot: { 
    width: 12, height: 12, borderRadius: 6, marginRight: 12 
  },
  availabilityText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary },

  languagesContainer: { 
    backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 16 
  },
  sectionTitle: { 
    fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 
  },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languagePill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, 
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primary 
  },
  languageText: { 
    fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.primary, marginLeft: 6 
  },
  white: { color: COLORS.white },

  // --- SIMILAR TEACHERS SECTION ---
  similarTeachersCard: { 
    backgroundColor: '#3B5BFE', 
    borderRadius: 20, 
    overflow: 'hidden',
    shadowColor: 'rgba(59, 91, 254, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  similarTeachersHeader: { 
    paddingVertical: 14, 
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarTeachersHeaderText: { 
    fontFamily: 'Poppins_600SemiBold', 
    fontSize: 18, 
    color: COLORS.white,
  },
  similarTeachersContent: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16,
    margin: 10,
    marginTop: 0,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  teacherImageContainer: { 
    width: '100%', 
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  teacherImage: { 
    width: '100%', 
    height: '100%',
  },
  teacherInfoCard: { 
    paddingHorizontal: 14, 
    paddingTop: 14,
    paddingBottom: 12,
  },
  subjectBadge: { 
    fontFamily: 'Poppins_600SemiBold', 
    fontSize: 11, 
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  nameRatingRowCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teacherNameCard: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 17, 
    color: COLORS.headerTxt,
    flex: 1,
  },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#DCFAE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
    gap: 4,
  },
  ratingText: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 13, 
    color: '#16A34A',
  },
  teacherDescCard: { 
    fontFamily: 'Poppins_400Regular', 
    fontSize: 12, 
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  priceActionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  priceText: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 16, 
    color: COLORS.textPrimary,
  },
  viewProfileBtn: { 
    backgroundColor: '#DCFAE6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewProfileBtnText: { 
    fontFamily: 'Poppins_600SemiBold', 
    fontSize: 13, 
    color: '#16A34A',
  },
  carouselDots: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 14,
    gap: 8,
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: { 
    width: 24, 
    height: 8, 
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // --- RECOMMENDED TEACHER CARD (tutor-profile-dashboard style) ---
  recommendedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: 'rgba(59, 91, 254, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  recommendedCardHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedCardHeaderText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.white,
  },
  recommendedCardContent: {
    backgroundColor: COLORS.white,
    padding: 0,
  },
  recommendedImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: COLORS.background,
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  recommendedSubjectBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recommendedSubjectBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  recommendedInfoSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  recommendedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendedTeacherName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.headerTxt,
    flex: 1,
  },
  recommendedRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    gap: 3,
  },
  recommendedRatingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#D97706',
  },
  recommendedDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  recommendedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendedPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  recommendedViewProfileBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  recommendedViewProfileText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  recommendedDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 14,
    gap: 6,
  },
  recommendedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  recommendedDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
