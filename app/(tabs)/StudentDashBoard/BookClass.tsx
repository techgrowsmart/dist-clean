import React, { useEffect, useState, useRef } from "react";
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
  ActivityIndicator,
  Modal,
  Alert
} from "react-native";
import { io, Socket } from "socket.io-client";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [tuitions, setTuitions] = useState<any[]>([]);
  const [selectedTuitions, setSelectedTuitions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Booking flow state
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'requesting' | 'waiting' | 'accepted' | 'rejected' | 'subscribed'>('idle');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  
  // Socket reference and connection state
  const socketRef = useRef<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // Pre-select tuition based on URL params when coming from "Accepted! Book Now"
  useEffect(() => {
    if (selectedSubject && selectedClass && tuitions.length > 0) {
      console.log('📌 Pre-selecting tuition from URL params:', { selectedSubject, selectedClass });

      // Find the matching tuition
      const matchingTuition = tuitions.find((t) => {
        const subjectMatch = (t.subject || t.skill) === selectedSubject;
        const classMatch = (t.class || t.className) === selectedClass;
        return subjectMatch && classMatch;
      });

      if (matchingTuition) {
        const tuitionKey = matchingTuition.skill 
          ? matchingTuition.skill 
          : `${matchingTuition.subject}-${matchingTuition.class}`;
        setSelectedTuitions([tuitionKey]);
        console.log('✅ Pre-selected tuition:', tuitionKey);
      } else {
        // If no match found, create a key from URL params
        const tuitionKey = `${selectedSubject}-${selectedClass}`;
        setSelectedTuitions([tuitionKey]);
        console.log('✅ Pre-selected tuition (from URL):', tuitionKey);
      }
    }
  }, [selectedSubject, selectedClass, tuitions]);

  // Check existing booking status on mount
  const checkBookingStatus = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token || !teacherEmail) return;

      console.log('🔍 Checking booking status for student:', auth.email, 'teacher:', teacherEmail);

      // First check AsyncStorage for cached status (for immediate UI update)
      const cachedStatus = await AsyncStorage.getItem(`booking_${auth.email}_${teacherEmail}`);
      const cachedBookingId = await AsyncStorage.getItem(`bookingId_${auth.email}_${teacherEmail}`);

      if (cachedStatus && cachedBookingId) {
        console.log('📦 Found cached booking status:', cachedStatus);
        if (cachedStatus === 'accepted') {
          setBookingStatus('accepted');
          setBookingId(cachedBookingId);
          setupWebSocketListeners();
        } else if (cachedStatus === 'pending') {
          setBookingStatus('waiting');
          setBookingId(cachedBookingId);
          setShowWaitingModal(true);
          setupWebSocketListeners();
        } else if (cachedStatus === 'rejected') {
          setBookingStatus('rejected');
          setRejectionMessage("Your previous request was declined. Please try again.");
          setShowRejectedModal(true);
        } else if (cachedStatus === 'subscribed') {
          setBookingStatus('subscribed');
          setBookingId(cachedBookingId);
          console.log('✅ Student is subscribed to this teacher');
        }
      }

      // Then verify with backend
      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      const res = await axios.post(`${BASE_URL}/api/bookings/check-status`, {
        studentEmail: auth.email,
        teacherEmail: teacherEmail
      }, { headers });

      console.log('📋 Booking status response:', res.data);

      if (res.data.success && res.data.status) {
        console.log('📋 Booking status found:', res.data.status);
        
        // Cache the status in AsyncStorage
        await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, res.data.status);
        if (res.data.requestId) {
          await AsyncStorage.setItem(`bookingId_${auth.email}_${teacherEmail}`, res.data.requestId);
        }

        if (res.data.status === 'accepted') {
          setBookingStatus('accepted');
          setBookingId(res.data.requestId);
          console.log('✅ Request already accepted, showing payment button');
          setupWebSocketListeners();
        } else if (res.data.status === 'pending') {
          setBookingStatus('waiting');
          setBookingId(res.data.requestId);
          setShowWaitingModal(true);
          console.log('⏳ Request pending, showing waiting state');
          setupWebSocketListeners();
        } else if (res.data.status === 'rejected') {
          setBookingStatus('rejected');
          setRejectionMessage("Your previous request was declined. Please try again.");
          setShowRejectedModal(true);
          console.log('❌ Request rejected, showing rejection message');
        } else if (res.data.status === 'subscribed') {
          setBookingStatus('subscribed');
          setBookingId(res.data.requestId);
          console.log('✅ Student is already subscribed to this teacher');
        }
      } else {
        console.log('📋 No existing booking request found, showing send request button');
        setBookingStatus('idle');
        // Clear cached status if none exists
        await AsyncStorage.removeItem(`booking_${auth.email}_${teacherEmail}`);
        await AsyncStorage.removeItem(`bookingId_${auth.email}_${teacherEmail}`);
      }
    } catch (error) {
      console.error('Error checking booking status:', error);
      console.log('📋 Error checking status, defaulting to idle state');
      setBookingStatus('idle');
    }
  };

  // Set up WebSocket listeners for status updates
  const setupWebSocketListeners = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;

      // Initialize socket if not already connected
      if (!socketRef.current) {
        const socket = await initSocketConnection();
        if (!socket) return;
        socketRef.current = socket;
      }

      const socket = socketRef.current;

      // Remove all existing listeners to prevent duplicates
      socket.removeAllListeners('booking_status_update');

      // Set up listener for booking status updates
      socket.on('booking_status_update', async (response: any) => {
        console.log('📨 Booking status update received:', response);
        console.log('📨 Current bookingId:', bookingId, 'Response bookingId:', response.bookingId);
        console.log('📨 Teacher email:', response.teacherEmail, 'Current teacher:', teacherEmail);
        console.log('📨 Current booking status:', bookingStatus);

        // Accept update if:
        // 1. Teacher email matches, OR
        // 2. We're in waiting state (expecting a response)
        const shouldUpdate = response.teacherEmail === teacherEmail || bookingStatus === 'waiting';

        if (!shouldUpdate) {
          console.log('⚠️ Skipping update - teacher mismatch and not waiting');
          return;
        }

        // Validate status - only allow pending, accepted, rejected, or subscribed
        const validStatuses = ['pending', 'accepted', 'rejected', 'subscribed'];
        if (!validStatuses.includes(response.status)) {
          console.error('❌ Invalid status received:', response.status);
          console.error('❌ Status must be one of:', validStatuses);
          Alert.alert('Status Error', `Invalid booking status: ${response.status}. Please contact support.`);
          return;
        }

        // Prevent automatic status updates to 'complete' or any other invalid status
        if (response.status === 'complete') {
          console.error('❌ Attempted to set status to complete - this should not happen');
          Alert.alert('Error', 'Invalid status update. Please complete payment through the checkout page.');
          return;
        }

        if (response.status === 'accepted') {
          console.log('✅ Updating status to accepted');
          setBookingStatus(prev => {
            console.log('✅ State update callback - previous status:', prev);
            return 'accepted';
          });
          setShowWaitingModal(false);
          setBookingId(response.bookingId);
          
          // Cache the accepted status for persistence
          const auth = await getAuthData();
          if (auth?.email && teacherEmail) {
            await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, 'accepted');
            await AsyncStorage.setItem(`bookingId_${auth.email}_${teacherEmail}`, response.bookingId);
          }

          // Teacher accepted - proceed to payment
          console.log('📦 Selected tuitions:', selectedTuitions);
          console.log('📦 Available tuitions:', tuitions);
          const selectedDetails = tuitions.filter((t) => {
            const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
            return selectedTuitions.includes(key);
          });
          console.log('📦 Filtered selected details:', selectedDetails);

          const totalCharge = selectedDetails.reduce((acc, t) => {
            const chargeStr = typeof t.charge === "string" ? t.charge : "";
            const numericCharge = parseInt(chargeStr);
            return acc + (isNaN(numericCharge) ? 0 : numericCharge);
          }, 0);

          setTimeout(() => {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Checkout",
              params: {
                teacherEmail,
                selected: JSON.stringify(selectedDetails),
                total: totalCharge,
                profilepic: teacherProfilePic,
                description,
                bookingId: response.bookingId
              },
            });
          }, 100);
        } else if (response.status === 'rejected') {
          console.log('❌ Updating status to rejected');
          setBookingStatus('rejected');
          setShowWaitingModal(false);
          setRejectionMessage(response.message || "The teacher has declined your booking request.");
          setShowRejectedModal(true);
          
          // Cache the rejected status for persistence
          const auth = await getAuthData();
          if (auth?.email && teacherEmail) {
            await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, 'rejected');
          }
        } else if (response.status === 'pending') {
          console.log('⏳ Status is pending - keeping waiting state');
          setBookingStatus('waiting');
          setShowWaitingModal(true);
          
          // Cache the pending status for persistence
          const auth = await getAuthData();
          if (auth?.email && teacherEmail) {
            await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, 'pending');
          }
        } else if (response.status === 'subscribed') {
          console.log('✅ Status is subscribed - payment completed');
          setBookingStatus('subscribed');
          setShowWaitingModal(false);
          setBookingId(response.bookingId);
          
          // Cache the subscribed status for persistence (permanent)
          const auth = await getAuthData();
          if (auth?.email && teacherEmail) {
            await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, 'subscribed');
            await AsyncStorage.setItem(`bookingId_${auth.email}_${teacherEmail}`, response.bookingId);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up WebSocket listeners:', error);
    }
  };

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
        // Keep loading state true for 9 seconds minimum
        setTimeout(() => {
          setLoading(false);
          setInitialLoadComplete(true);
        }, 9000);
      }
    };

    fetchTuitions();
    checkBookingStatus();
  }, [teacherEmail]);

  const toggleSelection = (key: string) => {
    setSelectedTuitions((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const toggleDaysExpansion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Check if student has active subscription
  const checkSubscription = async (): Promise<boolean> => {
    try {
      setIsCheckingSubscription(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        Alert.alert("Authentication Required", "Please login to continue.");
        return false;
      }

      const response = await axios.get(`${BASE_URL}/api/subscriptions/check-subscription`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      const hasActive = response.data?.has_active_subscription === true;
      setHasSubscription(hasActive);
      return hasActive;
    } catch (error) {
      console.error("Error checking subscription:", error);
      Alert.alert("Error", "Failed to check subscription status.");
      return false;
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  // Initialize WebSocket connection
  const initSocketConnection = async (): Promise<Socket | null> => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        setSocketError('Authentication required for real-time updates');
        Alert.alert('Authentication Error', 'Please login to use real-time booking features.');
        return null;
      }

      setSocketError(null);
      console.log('🔌 Connecting to WebSocket server...');

      // Connect to WebSocket server
      const socket = io(BASE_URL, {
        auth: { token: auth.token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setSocketConnected(true);
        setSocketError(null);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setSocketConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, need to reconnect manually
          Alert.alert('Connection Lost', 'You were disconnected from the server. Please try again.');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        setSocketConnected(false);
        setSocketError(error.message);
        
        // Show user-friendly error message
        if (error.message.includes('auth') || error.message.includes('unauthorized')) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
        } else if (error.message.includes('timeout')) {
          Alert.alert('Connection Timeout', 'Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          Alert.alert('Connection Error', 'Unable to establish real-time connection. Booking may still work but updates will be delayed.');
        }
      });

      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        setSocketError('Connection error occurred');
      });

      return socket;
    } catch (error) {
      console.error('❌ Error initializing socket:', error);
      setSocketConnected(false);
      setSocketError('Failed to initialize connection');
      Alert.alert('Connection Error', 'Failed to establish real-time connection. Please refresh the page and try again.');
      return null;
    }
  };

  // Send booking request to teacher via WebSocket
  const sendBookingRequest = async () => {
    const selectedDetails = tuitions.filter((t) => {
      const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
      return selectedTuitions.includes(key);
    });

    if (!teacherEmail || typeof teacherEmail !== 'string') {
      Alert.alert("Error", "Teacher information is missing.");
      return;
    }

    // Initialize socket if not already connected
    if (!socketRef.current) {
      const socket = await initSocketConnection();
      if (!socket) {
        Alert.alert("Connection Error", "Failed to establish real-time connection. Please check your internet connection and try again.");
        return;
      }
      socketRef.current = socket;
    }

    const socket = socketRef.current;
    const auth = await getAuthData();

    // Create booking request data
    const bookingRequest = {
      teacherEmail: teacherEmail,
      subject: selectedSubject || selectedDetails.map(d => d.subject || d.skill).join(', '),
      className: selectedClass || selectedDetails.map(d => d.class).join(', '),
      charge: selectedDetails.reduce((acc, t) => {
        const chargeStr = typeof t.charge === "string" ? t.charge : "";
        const numericCharge = parseInt(chargeStr);
        return acc + (isNaN(numericCharge) ? 0 : numericCharge);
      }, 0),
      studentInfo: {
        name: studentName,
        email: auth?.email,
        selectedTuitions: selectedDetails
      }
    };

    // Set up WebSocket listeners for status updates
    await setupWebSocketListeners();

    // Listen for confirmation that request was sent
    socket.off('booking_request_sent');
    socket.on('booking_request_sent', async (response: any) => {
      if (response.success) {
        setBookingId(response.bookingId);
        setBookingStatus('waiting');
        setShowWaitingModal(true);
        
        // Cache the pending status for persistence
        const auth = await getAuthData();
        if (auth?.email && teacherEmail) {
          await AsyncStorage.setItem(`booking_${auth.email}_${teacherEmail}`, 'pending');
          await AsyncStorage.setItem(`bookingId_${auth.email}_${teacherEmail}`, response.bookingId);
        }
      } else {
        Alert.alert("Error", response.message || "Failed to send booking request.");
        setBookingStatus('idle');
      }
    });

    // Listen for errors
    socket.off('error');
    socket.on('error', (error: any) => {
      console.error('Socket error during booking:', error);
      Alert.alert('Connection Error', 'An error occurred while sending your request. Please try again.');
      setBookingStatus('idle');
    });

    // Send the booking request
    setBookingStatus('requesting');
    
    try {
      socket.emit('booking_request', bookingRequest);
      
      // Fallback: if no response within 5 seconds, try API
      setTimeout(async () => {
        if (bookingStatus === 'requesting') {
          console.log('⚠️ WebSocket response timeout, trying API fallback');
          try {
            const headers = { 
              Authorization: `Bearer ${auth?.token}`, 
              "Content-Type": "application/json" 
            };
            const response = await axios.post(`${BASE_URL}/api/bookings/request`, bookingRequest, { headers });
            
            if (response.data.success) {
              setBookingId(response.data.booking.id);
              setBookingStatus('waiting');
              setShowWaitingModal(true);
              Alert.alert('Request Sent', 'Your booking request has been sent successfully.');
            } else {
              Alert.alert('Error', response.data.message || 'Failed to send booking request.');
              setBookingStatus('idle');
            }
          } catch (apiError) {
            console.error('API fallback failed:', apiError);
            Alert.alert('Error', 'Failed to send booking request. Please check your connection and try again.');
            setBookingStatus('idle');
          }
        }
      }, 5000);
    } catch (error) {
      console.error('Error emitting booking request:', error);
      Alert.alert('Error', 'Failed to send booking request. Please try again.');
      setBookingStatus('idle');
    }
  };

  // Main booking flow handler
  const handleProceedToPayment = async () => {
    // If already accepted, proceed directly to payment
    if (bookingStatus === 'accepted') {
      console.log('✅ Request already accepted, proceeding to payment');

      // Use URL params to find the correct tuition
      const selectedDetails = tuitions.filter((t) => {
        // Match by subject and class from URL params
        const subjectMatch = (t.subject || t.skill) === selectedSubject;
        const classMatch = (t.class || t.className) === selectedClass;
        return subjectMatch && classMatch;
      });

      // If no match found, create a synthetic tuition object from URL params
      let finalDetails = selectedDetails;
      if (selectedDetails.length === 0 && selectedSubject && selectedClass) {
        finalDetails = [{
          subject: selectedSubject,
          class: selectedClass,
          charge: charge || '0',
          skill: selectedSubject,
          board: '',
          days: '',
          time: ''
        }];
      }

      const totalCharge = finalDetails.reduce((acc, t) => {
        const chargeStr = typeof t.charge === "string" ? t.charge : String(t.charge || "0");
        const numericCharge = parseInt(chargeStr.replace(/[₹,]/g, '').trim());
        return acc + (isNaN(numericCharge) ? 0 : numericCharge);
      }, 0);

      console.log('📦 Selected details for payment:', finalDetails);
      console.log('💰 Total charge:', totalCharge);

      router.push({
        pathname: "/(tabs)/StudentDashBoard/Checkout",
        params: {
          teacherEmail,
          selected: JSON.stringify(finalDetails),
          total: totalCharge,
          profilepic: teacherProfilePic,
          description,
          bookingId: bookingId
        },
      });
      return;
    }

    // If waiting or requesting, don't allow new request
    if (bookingStatus === 'waiting' || bookingStatus === 'requesting') {
      console.log('⚠️ Request already sent, waiting for teacher response');
      Alert.alert("Request Already Sent", "Your request is already being processed by the teacher. Please wait for their response.");
      return;
    }

    // Step 1: Check subscription
    const isSubscribed = await checkSubscription();

    if (!isSubscribed) {
      setShowSubscriptionModal(true);
      return;
    }

    // Step 2: Send booking request to teacher
    console.log('📤 Sending new booking request to teacher');
    await sendBookingRequest();
  };

  // Navigate to subscription page
  const handleSubscribe = () => {
    setShowSubscriptionModal(false);
    router.push({
      pathname: "/(tabs)/StudentDashBoard/Subscription",
      params: { userEmail: '' }
    });
  };

  // Cancel waiting and close modal
  const handleCancelWaiting = () => {
    setShowWaitingModal(false);
    setBookingStatus('idle');
    // Optionally notify server that student cancelled
    if (socketRef.current && bookingId) {
      socketRef.current.emit('booking_cancelled', { bookingId });
    }
  };

  // Close rejection modal
  const handleCloseRejection = () => {
    setShowRejectedModal(false);
    setBookingStatus('idle');
    setRejectionMessage("");
  };

  const isCheckoutEmpty = selectedTuitions.length === 0 && bookingStatus !== 'accepted';

  // Helper to check if payment can proceed (accepted bookings have URL params)
  const canProceedToPayment = bookingStatus === 'accepted' || selectedTuitions.length > 0;

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

  // Debug: Log bookingStatus changes
  useEffect(() => {
    console.log('🔄 Booking status changed to:', bookingStatus);
    console.log('🔄 Show waiting modal:', showWaitingModal);
    console.log('🔄 Show rejected modal:', showRejectedModal);
  }, [bookingStatus, showWaitingModal, showRejectedModal]);

  // Debug: Log selectedTuitions changes
  useEffect(() => {
    console.log('🔄 Selected tuitions changed:', selectedTuitions);
  }, [selectedTuitions]);

  // Strong initial loading screen with 3 loaders - only loads once
  if (loading && !initialLoadComplete) {
    return (
      <View style={loaderStyles.container}>
        <View style={loaderStyles.loaderRow}>
          <ActivityIndicator size="large" color={COLORS.primary} style={loaderStyles.loader} />
          <ActivityIndicator size="large" color={COLORS.darkBlue} style={loaderStyles.loader} />
          <ActivityIndicator size="large" color={COLORS.primary} style={loaderStyles.loader} />
        </View>
        <Text style={loaderStyles.loadingText}>Loading class details...</Text>
        <Text style={loaderStyles.subText}>Please wait while we prepare your booking</Text>
      </View>
    );
  }

  // Mobile UI (current implementation)
  const MobileUI = () => (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.titleContent}>
          <TouchableOpacity 
            style={styles.backBtnCircle} 
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>Confirm Your Class :</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
            <Text style={{ fontSize: 10, color: '#FFF' }}>Ready</Text>
          </View>
        </View>
        <View style={styles.lableContainer}>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Study now, pay later</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Best Teachers from anywhere</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Get the best classes</Text></View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tuitions.map((t, index) => {
          const key = t.skill ? t.skill : t.board === 'Universities' ? `${t.subject}-${t.university}-${t.year}` : `${t.subject}-${t.class}`;
          const daysArray = t.day ? t.day.split(",").map((day: string) => day.trim()) : [];
          const firstDay = daysArray[0] || "";
          const hasMultipleDays = daysArray.length > 1;
          const isExpanded = expandedIndex === index;
          
          const isSelected = selectedTuitions.includes(key);
          const isDisabled = bookingStatus === 'accepted' && !isSelected;

          return (
            <View key={index} style={styles.tuitionItem}>
              <View style={[
                styles.checkboxContainer,
                isSelected && bookingStatus === 'accepted' && { borderColor: '#10B981', borderWidth: 2, backgroundColor: '#F0FDF4' },
                isDisabled && { opacity: 0.5, borderColor: '#E5E7EB' }
              ]}>
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
                    ) : t.board === 'Universities' ? (
                      <>
                        <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.subject}</Text>
                        <Text style={styles.className} numberOfLines={1} adjustsFontSizeToFit>{t.university} ({t.year})</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.subject}</Text>
                        <Text style={styles.className} numberOfLines={1} adjustsFontSizeToFit>{t.class || 'N/A'}</Text>
                      </>
                    )}
                  </View>
                    <CustomCheckbox
                      value={selectedTuitions.includes(key)}
                      onValueChange={() => {
                        // When status is accepted, only allow toggling the already selected one
                        if (bookingStatus === 'accepted') {
                          if (selectedTuitions.includes(key)) {
                            // Don't allow unselecting the only selected item when accepted
                            return;
                          }
                          // Don't allow selecting new items when accepted
                          return;
                        }
                        toggleSelection(key);
                      }}
                      size={wp("5.66%") * 1.5}
                      disabled={bookingStatus === 'accepted' && !selectedTuitions.includes(key)}
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
      
      {isCheckoutEmpty && bookingStatus !== 'accepted' && <Text style={styles.warningText}>Please select at least one class to proceed.</Text>}

      <TouchableOpacity
        style={[
          styles.button,
          !canProceedToPayment && { opacity: 0.5 },
          bookingStatus === 'accepted' && { backgroundColor: '#10B981' },
          bookingStatus === 'subscribed' && { backgroundColor: '#10B981' }
        ]}
        onPress={handleProceedToPayment}
        disabled={!canProceedToPayment || bookingStatus === 'requesting' || bookingStatus === 'waiting' || bookingStatus === 'subscribed'}
      >
        <Text style={styles.buttonText}>
          {(() => {
            console.log('🎨 Rendering button - bookingStatus:', bookingStatus);
            if (bookingStatus === 'subscribed') return '✓ Subscribed';
            if (bookingStatus === 'accepted') return '✓ Teacher Accepted - Proceed to Payment';
            if (bookingStatus === 'requesting') return 'Sending Request...';
            if (bookingStatus === 'waiting') return '⏳ Waiting for Teacher Response';
            if (bookingStatus === 'rejected') return '✗ Request Declined - Try Again';
            return 'Send Request to Teacher';
          })()}
        </Text>
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
                <TouchableOpacity style={webStyles.backButton} onPress={handleBackPress}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={webStyles.pageTitle}>Book Class</Text>
              </View>

              <View style={webStyles.boxContainer}>
                <View style={webStyles.bookingHeader}>
                  <View>
                    <Text style={webStyles.bookingTitle}>Confirm Your Class</Text>
                    <Text style={webStyles.bookingSubtitle}>Select your preferred tuition slots</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Ready</Text>
                  </View>
                </View>

                {tuitions.map((t, index) => {
                  const key = t.skill ? t.skill : t.board === 'Universities' ? `${t.subject}-${t.university}-${t.year}` : `${t.subject}-${t.class}`;
                  const daysArray = t.day ? t.day.split(",").map((day: string) => day.trim()) : [];
                  const firstDay = daysArray[0] || "";
                  const hasMultipleDays = daysArray.length > 1;
                  const isExpanded = expandedIndex === index;
                  const isSelected = selectedTuitions.includes(key);
                  const isDisabled = bookingStatus === 'accepted' && !isSelected;

                  return (
                    <View key={index} style={[
                      webStyles.tuitionCard,
                      isSelected && bookingStatus === 'accepted' && { borderColor: '#10B981', borderWidth: 2, backgroundColor: '#F0FDF4' },
                      isDisabled && { opacity: 0.6 }
                    ]}>
                      <View style={webStyles.tuitionCardHeader}>
                        <View style={webStyles.tuitionSubject}>
                          {t.skill ? (
                            <Text style={webStyles.tuitionSubjectText}>{t.skill}</Text>
                          ) : t.board === 'Universities' ? (
                            <>
                              <Text style={webStyles.tuitionSubjectText}>{t.subject}</Text>
                              <Text style={webStyles.tuitionClassText}>{t.university} ({t.year})</Text>
                            </>
                          ) : (
                            <>
                              <Text style={webStyles.tuitionSubjectText}>{t.subject}</Text>
                              <Text style={webStyles.tuitionClassText}>{t.class || 'N/A'}</Text>
                            </>
                          )}
                        </View>
                        <CustomCheckbox
                          value={selectedTuitions.includes(key)}
                          onValueChange={() => {
                            // When status is accepted, only allow toggling the already selected one
                            if (bookingStatus === 'accepted') {
                              if (selectedTuitions.includes(key)) {
                                // Don't allow unselecting the only selected item when accepted
                                return;
                              }
                              // Don't allow selecting new items when accepted
                              return;
                            }
                            toggleSelection(key);
                          }}
                          size={20}
                          disabled={bookingStatus === 'accepted' && !selectedTuitions.includes(key)}
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
                          <Text style={webStyles.scheduleText}>₹{t.charge?.toString().replace(/[₹,]/g, '').trim()}</Text>
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
              </View>

              {isCheckoutEmpty && bookingStatus !== 'accepted' && <Text style={webStyles.warningText}>Please select at least one class to proceed.</Text>}

              <TouchableOpacity
                style={[
                  webStyles.confirmButton,
                  !canProceedToPayment && { opacity: 0.5 },
                  bookingStatus === 'accepted' && { backgroundColor: '#10B981' },
                  bookingStatus === 'subscribed' && { backgroundColor: '#10B981' }
                ]}
                onPress={handleProceedToPayment}
                disabled={!canProceedToPayment || bookingStatus === 'requesting' || bookingStatus === 'waiting' || bookingStatus === 'subscribed'}
              >
                <Text style={webStyles.confirmButtonText}>
                  {bookingStatus === 'subscribed' ? '✓ Subscribed' :
                   bookingStatus === 'accepted' ? 'Proceed to Payment' :
                   bookingStatus === 'requesting' ? 'Sending Request...' :
                   bookingStatus === 'waiting' ? '⏳ Waiting for Teacher Response' :
                   bookingStatus === 'rejected' ? '✗ Request Declined - Try Again' :
                   'Send Request to Teacher'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  // Render platform-specific UI
  return (
    <>
      {Platform.OS === 'web' ? <WebUI /> : <MobileUI />}
      
      {/* Subscription Required Modal */}
      <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Ionicons name="card-outline" size={64} color={COLORS.primary} />
            <Text style={modalStyles.title}>Subscription Required</Text>
            <Text style={modalStyles.message}>
              You need an active subscription to book classes. Please subscribe to continue.
            </Text>
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.secondaryButton]}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={modalStyles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[modalStyles.button, modalStyles.primaryButton]}
                onPress={handleSubscribe}
              >
                <Text style={modalStyles.primaryButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Waiting for Teacher Response Modal */}
      <Modal
        visible={showWaitingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelWaiting}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 20 }} />
            <Text style={modalStyles.title}>Waiting for Teacher</Text>
            <Text style={modalStyles.message}>
              Your booking request has been sent to the teacher. Please wait for their response...
            </Text>
            <Text style={modalStyles.subMessage}>
              This may take a few moments. You can cancel this request if needed.
            </Text>
            <TouchableOpacity 
              style={[modalStyles.button, modalStyles.cancelButton]}
              onPress={handleCancelWaiting}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Teacher Rejection Modal */}
      <Modal
        visible={showRejectedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseRejection}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
            <Text style={modalStyles.title}>Request Declined</Text>
            <Text style={modalStyles.message}>
              {rejectionMessage || "The teacher has declined your booking request."}
            </Text>
            <Text style={modalStyles.subMessage}>
              You can try booking with another teacher or try again later.
            </Text>
            <TouchableOpacity 
              style={[modalStyles.button, modalStyles.primaryButton]}
              onPress={handleCloseRejection}
            >
              <Text style={modalStyles.primaryButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay for Subscription Check */}
      {isCheckingSubscription && (
        <View style={modalStyles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={modalStyles.loadingText}>Checking subscription...</Text>
        </View>
      )}
    </>
  );
}

// Modal Styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  subMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topContainer: { height: hp("33.243%"), backgroundColor: "#5f5fff", borderBottomLeftRadius: wp("8.53%"), borderBottomRightRadius: wp("8.53%"), paddingHorizontal: wp("5.33%"), paddingTop: hp("4.31%"), paddingBottom: hp("3.23%") },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: hp("25%") },
  titleContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: { fontSize: wp("8.266%"), fontWeight: "700", lineHeight: hp("6.325%"), color: "#fff", flex: 1 },
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

// Loader styles for initial loading screen
const loaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },
  loader: {
    transform: [{ scale: 1.2 }],
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});