import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, {
    FadeInLeft,
    FadeInRight
} from 'react-native-reanimated';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import socketService from '../../../services/socketService';
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import ResponsiveSidebar from "../../../components/ui/ResponsiveSidebar";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import ThoughtsCard from './ThoughtsCard';
import BackButton from '../../../components/BackButton';

// Global Design Tokens
const COLORS = {
  background: '#F5F7FB',
  sidebarBg: '#FFFFFF',
  chatListBg: '#FAFBFC',
  chatWindowBg: '#F9FAFB',
  feedBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  activeNavBg: '#EEF2FF',
  softGreen: '#D1FAE5',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  receivedBubble: '#F3F4F6',
  sentBubble: '#E5E7EB',
  white: '#FFFFFF',
  unreadDot: '#3B5BFE',
  onlineGreen: '#10B981',
};

interface Contact {
  name: string;
  profilePic: string;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
  timestamp: Date;
  isBroadcast?: boolean;
  userType?: string,
  className?: string,
  subject?: string,
  studentEmails?: string,
  teacherName?: string
}

interface ConnectWebProps { 
  onBack?: () => void; 
  isEmbedded?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ConnectWeb({ onBack, isEmbedded = false }: ConnectWebProps) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [windowSize, setWindowSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  // State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  // const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Teachers' | 'Broadcast' | 'My Requests'>('Teachers');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [userType, setUserType] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Connect");
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Messages state
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Helper to filter out broadcast messages
  const filterBroadcastMessages = (messages: any[]) => {
    return messages.filter(msg => {
      const text = msg.text || msg.message || '';
      return !text.startsWith('📢 Broadcast:');
    });
  };

  // ScrollView ref for auto-scrolling to bottom
  const messagesScrollViewRef = useRef<ScrollView>(null);
  // Ref for message polling interval cleanup
  const messagePollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref for broadcast message polling
  const broadcastPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when chatMessages change
  useEffect(() => {
    if (chatMessages.length > 0 && messagesScrollViewRef.current) {
      setTimeout(() => {
        messagesScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);
  
  // Posts / Thoughts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportItemId, setReportItemId] = useState('');
  const [reportReason, setReportReason] = useState('');

  // Booking requests state
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Student Broadcast state
  const [studentBroadcastData, setStudentBroadcastData] = useState<any[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);
  const [broadcastMessages, setBroadcastMessages] = useState<any[]>([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // Calculate notification count for Connect icon
  const connectNotificationCount = useMemo(() => {
    let count = 0;
    // Count pending booking requests
    const pendingRequests = bookingRequests.filter(r => r.status === 'pending').length;
    count += pendingRequests;
    // Count broadcast groups (new messages)
    count += studentBroadcastData.length > 0 ? 1 : 0;
    return count;
  }, [bookingRequests, studentBroadcastData]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowSize({ width: window.width, height: window.height });
    });
    return () => subscription.remove();
  }, []);

  const isDesktop = windowSize.width >= 1024;

  const handleSidebarItemPress = (itemName: string) => {
    setActiveMenu(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
    if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail, userType: userRole } });
    if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName, profileImage: userImage } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push("/(tabs)/Contact");
    if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  // Load user info and fetch enrolled students
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const email = await AsyncStorage.getItem("user_email");
        const profileImage = await AsyncStorage.getItem("profileImage");
        const name = await AsyncStorage.getItem("studentName");
        const role = await AsyncStorage.getItem("user_role");

        if (email) setUserEmail(email);
        if (profileImage) setUserImage(profileImage);
        if (name) setStudentName(name);
        if (role) {
          setUserRole(role);
          setUserType(role);
        }
        
        if (email) {
          await fetchEnrolledStudents(email);
          await fetchStudentBookingRequests(email);
        }
      } catch (error) {
        console.error("❌ Error loading user info:", error);
      }
    };

    loadUserInfo();
  }, []);

  // Refresh contacts when userEmail is set/updated
  useEffect(() => {
    if (userEmail) {
      fetchEnrolledStudents(userEmail);
    }
  }, [userEmail]);

  // Fetch broadcast data when Broadcast tab is active
  useEffect(() => {
    if (activeTab === 'Broadcast' && userEmail && authToken) {
      fetchStudentBroadcast();
    }
  }, [activeTab, userEmail, authToken]);

  // Cleanup message polling when selected contact changes or component unmounts
  useEffect(() => {
    return () => {
      if (messagePollIntervalRef.current) {
        clearInterval(messagePollIntervalRef.current);
        messagePollIntervalRef.current = null;
      }
      if (broadcastPollIntervalRef.current) {
        clearInterval(broadcastPollIntervalRef.current);
        broadcastPollIntervalRef.current = null;
      }
    };
  }, [selectedContact]);

  // Global cleanup on component unmount
  useEffect(() => {
    return () => {
      if (messagePollIntervalRef.current) {
        clearInterval(messagePollIntervalRef.current);
        messagePollIntervalRef.current = null;
      }
      if (broadcastPollIntervalRef.current) {
        clearInterval(broadcastPollIntervalRef.current);
        broadcastPollIntervalRef.current = null;
      }
    };
  }, []);

  // Monitor socket connection status
  useEffect(() => {
    const checkSocketConnection = () => {
      try {
        const socketService = require('../../../services/socketService').socketService;
        setSocketConnected(socketService.isConnected());
      } catch (error) {
        setSocketConnected(false);
      }
    };

    checkSocketConnection();
    const interval = setInterval(checkSocketConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // Poll for booking requests updates (for real-time status updates from teacher)
  useEffect(() => {
    if (!userEmail) return;

    const pollBookingRequests = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;

        const response = await axios.get(`${BASE_URL}/api/bookings/student-requests`, {
          headers: { Authorization: `Bearer ${auth.token}` }
        });

        if (response.data.success && response.data.requests) {
          // Only update if data changed to avoid unnecessary re-renders
          setBookingRequests(prev => {
            const newRequests = response.data.requests;
            // Check if any status changed
            const hasChanges = newRequests.some((newReq: any) => {
              const oldReq = prev.find(p => p.id === newReq.id);
              return !oldReq || oldReq.status !== newReq.status;
            });
            if (hasChanges) {
              console.log('🔄 Booking requests updated:', newRequests);
              return newRequests;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error polling booking requests:', error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(pollBookingRequests, 10000);

    return () => clearInterval(interval);
  }, [userEmail]);

  // WebSocket listener for real-time booking status updates
  useEffect(() => {
    let unsubscribeStatusUpdate: (() => void) | null = null;

    const setupSocket = async () => {
      try {
        await socketService.connect();

        // Listen for booking status updates from teacher
        unsubscribeStatusUpdate = socketService.on('booking_status_update', (data) => {
          console.log('📬 ConnectWeb: Booking status update received:', data);

          // Update the booking request in the list
          setBookingRequests(prev => {
            const updated = prev.map(req => {
              if (req.id === data.bookingId) {
                console.log(`✅ ConnectWeb: Updating request ${req.id} status to ${data.status}`);
                return { ...req, status: data.status };
              }
              return req;
            });
            return updated;
          });
        });

      } catch (error) {
        console.error('❌ ConnectWeb: WebSocket setup failed:', error);
      }
    };

    setupSocket();

    return () => {
      if (unsubscribeStatusUpdate) unsubscribeStatusUpdate();
    };
  }, []);

  // Fetch student booking requests
  const fetchStudentBookingRequests = async (studentEmail: string) => {
    try {
      setBookingLoading(true);
      const auth = await getAuthData();
      if (!auth?.token) return;

      const response = await axios.get(`${BASE_URL}/api/bookings/student-requests`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (response.data.success && response.data.requests) {
        setBookingRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching booking requests:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  // Fetch enrolled students via API (more reliable than direct Firestore)
  const fetchEnrolledStudents = async (studentEmail: string) => {
    try {
      setLoadingStudents(true);

      // Get auth token for API calls
      const auth = await getAuthData();
      if (!auth?.token) {
        console.log("⚠️ No auth token available");
        setEnrolledStudents([]);
        setContacts([]);
        return;
      }

      const enrolledTeachers = [];
      const teacherEmails = new Set(); // Track to avoid duplicates

      // 1. Fetch from API endpoint (paid/subscribed teachers from contacts collection)
      try {
        const response = await axios.post(
          `${BASE_URL}/api/firebase-contacts`,
          {
            userEmail: studentEmail,
            type: 'student'
          },
          {
            headers: {
              'Authorization': `Bearer ${auth.token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.success && response.data.contacts) {
          for (const contact of response.data.contacts) {
            const teacherEmail = contact.teacherEmail || contact.id;

            if (teacherEmails.has(teacherEmail)) continue;
            teacherEmails.add(teacherEmail);

            enrolledTeachers.push({
              id: contact.id || teacherEmail,
              email: teacherEmail,
              name: contact.teacherName || 'Unknown Teacher',
              profilePic: contact.teacherProfilePic || contact.profilePic || '',
              role: 'teacher',
              subject: contact.subject || 'Subject',
              enrollmentDate: contact.addedAt || new Date(),
              lastMessage: contact.lastMessage || '',
              lastMessageTime: contact.lastMessageTime || '',
              unread: contact.unread || 0,
              isPaid: true, // Mark as paid/subscribed from contacts
              className: contact.className || ''
            });
          }
          console.log(`✅ Loaded ${enrolledTeachers.length} teachers from API`);
        }
      } catch (apiError) {
        console.log("⚠️ API fetch error:", apiError);
      }

      // 2. Fallback: Fetch from Firestore contacts collection directly if API fails
      if (enrolledTeachers.length === 0) {
        try {
          const contactsRef = collection(db, "contacts", studentEmail, "teachers");
          const contactsSnapshot = await getDocs(contactsRef);

          for (const contactDoc of contactsSnapshot.docs) {
            const contactData = contactDoc.data();
            const teacherEmail = contactData.teacherEmail || contactDoc.id;

            if (teacherEmails.has(teacherEmail)) continue;
            teacherEmails.add(teacherEmail);

            enrolledTeachers.push({
              id: contactDoc.id,
              email: teacherEmail,
              name: contactData.teacherName || 'Unknown Teacher',
              profilePic: contactData.teacherProfilePic || '',
              role: 'teacher',
              subject: contactData.subject || 'Subject',
              enrollmentDate: contactData.addedAt,
              lastMessage: '',
              lastMessageTime: '',
              unread: 0,
              isPaid: true,
              className: contactData.className || ''
            });
          }
        } catch (firestoreError) {
          console.log("⚠️ Firestore fetch error:", firestoreError);
        }
      }

      setEnrolledStudents(enrolledTeachers);
      setContacts(enrolledTeachers);
    } catch (error) {
      console.error("❌ Error fetching enrolled students:", error);
      setEnrolledStudents([]);
      setContacts([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch student broadcast data - groups by class-subject like teacher view
  const fetchStudentBroadcast = async () => {
    if (!userEmail || !authToken) return;

    try {
      setBroadcastLoading(true);
      console.log('📢 Fetching student broadcast data...');

      // Fetch from enrolled teachers - they contain class/subject info
      const response = await axios.post(
        `${BASE_URL}/api/firebase-contacts`,
        {
          userEmail: userEmail,
          type: 'student'
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success && response.data.contacts) {
        // Group contacts by class-subject combination
        const groupedData = response.data.contacts.map((contact: any) => ({
          id: `${contact.className}-${contact.subject}`,
          classname: contact.className || 'Class',
          subject: contact.subject || 'Subject',
          teacherEmail: contact.teacherEmail,
          teacherName: contact.teacherName,
          teacherProfilePic: contact.teacherProfilePic,
          studentEmail: userEmail,
          studentName: studentName,
          unreadCount: 0
        }));

        // Remove duplicates by class-subject
        const uniqueGroups = Array.from(
          new Map(groupedData.map((item: any) => [`${item.classname}-${item.subject}`, item])).values()
        );

        setStudentBroadcastData(uniqueGroups);
        console.log(`✅ Found ${uniqueGroups.length} broadcast groups`);
      }

      // Also fetch actual broadcast messages for this student
      const broadcastsRes = await axios.post(
        `${BASE_URL}/api/broadcasts`,
        { studentEmail: userEmail },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (broadcastsRes.data.broadcasts) {
        setBroadcastMessages(broadcastsRes.data.broadcasts);
      }

      setBroadcastLoading(false);
    } catch (error) {
      console.error("❌ Error fetching student broadcast:", error);
      setBroadcastLoading(false);
    }
  };

  // Load broadcast messages for a specific class-subject group
  const loadBroadcastMessages = async (className: string, subject: string) => {
    if (!userEmail || !authToken) return;

    // Clear any existing broadcast poll interval
    if (broadcastPollIntervalRef.current) {
      clearInterval(broadcastPollIntervalRef.current);
      broadcastPollIntervalRef.current = null;
    }

    const fetchBroadcasts = async () => {
      try {
        setMessagesLoading(true);

        const response = await axios.post(
          `${BASE_URL}/api/broadcasts`,
          {
            studentEmail: userEmail,
            className,
            subject
          },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.broadcasts) {
          const formattedMessages = response.data.broadcasts.map((msg: any) => {
            // Handle params array format from backend: [teacherEmail, className, subject, batchId, studentEmails, studentNames, isBroadcast, fromEmail, fromName, messageContent, timeString, timestamp]
            const params = msg.params || [];
            const messageContent = params[9] || '';
            const timeString = params[10] || '';
            const fromName = params[8] || msg.teacherName || 'Teacher';
            const timestamp = msg.timestamp?._seconds ? new Date(msg.timestamp._seconds * 1000) :
                              msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) :
                              msg.timestamp ? new Date(msg.timestamp) : new Date();

            return {
              id: msg.id || msg._id,
              text: messageContent,
              sender: 'other', // Broadcasts are always from teacher
              time: timeString || timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: timestamp,
              isBroadcast: true,
              teacherName: fromName
            };
          });
          setChatMessages(formattedMessages);
        }
      } catch (error) {
        console.error("❌ Error loading broadcast messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    // Fetch immediately
    await fetchBroadcasts();

    // Set up polling every 5 seconds
    broadcastPollIntervalRef.current = setInterval(fetchBroadcasts, 5000);
  };

  // Handle broadcast selection
  const handleBroadcastSelect = (broadcastItem: any) => {
    setSelectedBroadcast(broadcastItem);
    setSelectedContact(null); // Clear selected contact

    // Load broadcast messages for this class-subject
    if (broadcastItem.classname && broadcastItem.subject) {
      loadBroadcastMessages(broadcastItem.classname, broadcastItem.subject);
    }
  };
const loadChatMessages = async (chatId: string) => {
  try {
    setMessagesLoading(true);

    // Clear any existing poll interval
    if (messagePollIntervalRef.current) {
      clearInterval(messagePollIntervalRef.current);
      messagePollIntervalRef.current = null;
    }

    const fetchMessages = async () => {
      try {
        // Use correct endpoint: /api/messages/:contactEmail
        const contactEmail = selectedContact?.email;
        if (!contactEmail) return;

        const response = await axios.get(
          `${BASE_URL}/api/messages/${encodeURIComponent(contactEmail)}`,
          { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 10000 }
        );
        if (response.data.success && response.data.messages) {
          // Filter out broadcast messages (only show direct teacher messages)
          const filteredMessages = filterBroadcastMessages(response.data.messages);
          const formattedMessages = filteredMessages.map((msg: any) => ({
            id: msg.id || msg._id,
            text: msg.text || msg.message,
            sender: msg.sender === userEmail ? 'me' : 'other',
            receiver: msg.recipient || msg.receiver,
            timestamp: msg.timestamp,
            read: msg.read || false
          }));
          setChatMessages(formattedMessages);
        }
      } catch (apiError) {
        console.log("⚠️ API fetch failed, using Firestore fallback:", apiError);
        // Fallback to Firestore getDocs (this is safe – no onSnapshot)
        try {
          const messagesQuery = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text,
              sender: data.sender === userEmail ? 'me' : 'other',
              receiver: data.recipient || data.receiver,
              timestamp: data.timestamp,
              read: data.read || false
            };
          });
          // Filter out broadcast messages from Firestore fallback too
          const filteredMessagesData = filterBroadcastMessages(messagesData);
          setChatMessages(filteredMessagesData);
        } catch (firestoreError) {
          console.error("❌ Firestore fallback failed:", firestoreError);
        }
      } finally {
        setMessagesLoading(false);
      }
    };

    await fetchMessages();
    // Poll every 5 seconds (increase from 3 to reduce load)
    messagePollIntervalRef.current = setInterval(fetchMessages, 5000);
  } catch (error) {
    console.error("❌ Error loading chat messages:", error);
    setMessagesLoading(false);
  }
};
  // Handle contact selection
  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    setSelectedBroadcast(null); // Clear any selected broadcast

    // Clear broadcast polling when switching to contact chat
    if (broadcastPollIntervalRef.current) {
      clearInterval(broadcastPollIntervalRef.current);
      broadcastPollIntervalRef.current = null;
    }

    const chatId = [userEmail, contact.email].sort().join('_');
    setCurrentChatId(chatId);

    loadChatMessages(chatId);
  };

  // Send message via API with optimistic update
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentChatId || !userEmail || !selectedContact) return;

    const messageText = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    const now = new Date();

    // OPTIMISTIC UPDATE: Add message to chat immediately
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      sender: 'me', // Use 'me' for optimistic updates to match the expected format
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      read: false,
      pending: true // Mark as pending until confirmed
    };

    setChatMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      setIsSending(true);

      // Try API first - use correct endpoint /api/messages/send
      try {
        await axios.post(
          `${BASE_URL}/api/messages/send`,
          {
            sender: userEmail,
            recipient: selectedContact?.email,
            senderName: studentName || userEmail?.split('@')[0],
            text: messageText,
          },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        // Update the optimistic message to confirmed
        setChatMessages(prev =>
          prev.map(msg => msg.id === tempId ? { ...msg, pending: false } : msg)
        );
      } catch (apiError) {
        console.log("⚠️ API send failed, trying Firestore fallback:", apiError);
        // Fallback to Firestore
        const messageData = {
          text: messageText,
          sender: userEmail,
          recipient: selectedContact?.email,
          timestamp: serverTimestamp(),
          read: false
        };
        await addDoc(collection(db, "chats", currentChatId, "messages"), messageData);

        // Update the optimistic message to confirmed
        setChatMessages(prev =>
          prev.map(msg => msg.id === tempId ? { ...msg, pending: false } : msg)
        );
      }

      // Update local contacts list
      const updatedContacts = contacts.map(contact =>
        contact.email === selectedContact?.email
          ? { ...contact, lastMessage: messageText, lastMessageTime: 'Just now' }
          : contact
      );
      setContacts(updatedContacts);
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Remove the optimistic message on error
      setChatMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert("Error", "Failed to send message");
      setMessageInput(messageText); // Restore the message text
    } finally {
      setIsSending(false);
    }
  };

  // Helper functions for ThoughtsCard
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

  const formatTimeAgo = (createdAt: string) => {
    try {
      if (!createdAt || createdAt === 'null' || createdAt === 'undefined') return 'Just now';
      if (typeof createdAt === 'string' && createdAt.includes('ago')) return createdAt;
      const date = new Date(createdAt); const now = new Date();
      if (isNaN(date.getTime())) return 'Just now';
      const diffInMs = now.getTime() - date.getTime();
      if (diffInMs < 0) return 'Just now';
      const diffInMins = Math.floor(diffInMs / 60000); const diffInHours = Math.floor(diffInMins / 60); const diffInDays = Math.floor(diffInHours / 24);
      if (diffInMins < 1) return 'Just now'; if (diffInMins < 60) return `${diffInMins}m ago`; if (diffInHours < 24) return `${diffInHours}h ago`; if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch { return 'Just now'; }
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.displayName;
        const profileData = { name: userName || 'Unknown User', profilePic: profilePic || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profileData))); return profileData;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
  };

  const resolvePostAuthor = (post: any) => {
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    // Prioritize post.author.name first, then cache, then fallback
    let name = post.author?.name || cached.name || '';
    let pic: string | null = post.author?.profile_pic || cached.profilePic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author?.email?.split('@')[0] || 'User';
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;
    return { name, pic, role: post.author?.role || 'User' };
  };

  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.data.success) {
        // Process posts to handle snake_case to camelCase conversion and image URLs
        const processedPosts = res.data.data.map((post: any) => {
          // Convert snake_case to camelCase for frontend compatibility
          const processedPost = {
            ...post,
            id: post.id,
            author: {
              email: post.author_email || post.author?.email,
              name: post.author_name || post.author?.name,
              role: post.author_role || post.author?.role,
              profile_pic: post.author_profile_pic || post.author?.profile_pic
            },
            content: post.content,
            postImage: post.post_image || post.postImage, // Handle both field names
            postImages: post.post_images || post.postImages || (post.post_image ? [post.post_image] : []),
            likes: post.likes_counter || post.likes || 0,
            createdAt: post.created_at || post.createdAt,
            tags: post.tags || []
          };
          
          // Handle postImage (single image) - convert to absolute URL if needed
          if (processedPost.postImage && !processedPost.postImage.startsWith('http') && !processedPost.postImage.includes(BASE_URL)) {
            processedPost.postImage = processedPost.postImage.startsWith('/') 
              ? `${BASE_URL}${processedPost.postImage}`
              : `${BASE_URL}/${processedPost.postImage}`;
          }
          
          // Handle postImages (array of images) - convert to absolute URLs if needed
          if (processedPost.postImages && Array.isArray(processedPost.postImages)) {
            processedPost.postImages = processedPost.postImages.map((img: string) => {
              if (!img || img.startsWith('http') || img.includes(BASE_URL)) return img;
              return img.startsWith('/') ? `${BASE_URL}${img}` : `${BASE_URL}/${img}`;
            });
          }
          
          return processedPost;
        });
        
        const postsWithComments = await Promise.all(processedPosts.map(async (post: any) => {
          try {
            const cr = await axios.get(`${BASE_URL}/api/posts/${post.id}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
            return { ...post, createdAt: formatTimeAgo(post.createdAt), isLiked: post.isLiked || false, comments: cr.data.success ? cr.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })) : [] };
          } catch { return { ...post, createdAt: formatTimeAgo(post.createdAt), isLiked: false, comments: [] }; }
        }));
        const uniqueEmails = [...new Set(postsWithComments.map((p: any) => p.author.email))];
        await Promise.all(uniqueEmails.map((e) => fetchUserProfile(token, e)));
        setPosts(postsWithComments);
      } else setPosts([]);
    } catch { setPosts([]); }
    finally { setPostsLoading(false); }
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    const post = posts.find((p: any) => p.id === postId); if (!post) return;
    const newLiked = !post.isLiked;
    setPosts((ps) => ps.map((p: any) => p.id === postId ? { ...p, likes: newLiked ? p.likes + 1 : Math.max(0, p.likes - 1), isLiked: newLiked } : p));
    try {
      if (newLiked) await axios.post(`${BASE_URL}/api/posts/${postId}/like`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });
      else await axios.delete(`${BASE_URL}/api/posts/${postId}/like`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    } catch { setPosts((ps) => ps.map((p: any) => p.id === postId ? { ...p, likes: post.likes, isLiked: post.isLiked } : p)); }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.data.success) setPostComments(res.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })));
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: any) => { setSelectedPost(post); setShowCommentsModal(true); setCommentText(''); await fetchPostComments(post.id); };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await axios.post(`${BASE_URL}/api/posts/${selectedPost.id}/comments`, { content: commentText.trim() }, { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } });
      if (res.data.success) {
        const newC = { ...res.data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]); setCommentText('');
        setPosts(ps => ps.map((p: any) => p.id === selectedPost.id ? { ...p, comments: [newC, ...(p.comments || [])] } : p));
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to add comment'); }
  };

  const submitReport = async () => {
    if (!authToken || !reportReason.trim()) { Alert.alert('Error', 'Please provide a reason'); return; }
    try {
      const ep = reportType === 'post' ? `${BASE_URL}/api/posts/${reportItemId}/report` : `${BASE_URL}/api/comments/${reportItemId}/report`;
      await axios.post(ep, { reason: reportReason.trim() }, { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } });
      Alert.alert('Success', 'Report submitted'); setShowReportModal(false); setReportReason('');
    } catch (err: any) { Alert.alert('Error', err.response?.data?.message || 'Failed to submit report'); }
  };

  const handleBackPress = useCallback(() => { router.push('/(tabs)/StudentDashBoard/Student'); }, [router]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [handleBackPress]);

  // Initialize posts data
  useEffect(() => {
    if (Platform.OS === 'web') {
      const init = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.token) { setAuthToken(authData.token); await fetchPosts(authData.token); }
        } catch {}
      };
      init();
    }
  }, []);

  // NOTE: Message polling is handled by loadChatMessages function - no duplicate useEffect needed

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  // Desktop Layout
  if (isDesktop) {
    // Embedded layout (when used inside another component)
    if (isEmbedded) {
      return (
        <View style={styles.container}>
          <View style={styles.contentLayout}>
            <ResponsiveSidebar
              activeItem={activeMenu}
              onItemPress={handleSidebarItemPress}
              userEmail={userEmail || ""}
              studentName={studentName || ""}
              profileImage={userImage || null}
              showHamburger={false}
              notificationCounts={{ 'Connect': connectNotificationCount }}
              >
                <View style={styles.mainWrapper}>
                <View style={styles.contentColumns}>
                  {/* CENTER: Chat Content */}
                  <View style={styles.centerContent}>
                    {/* LEFT: Chat List Panel */}
                    <View style={styles.chatListPanel}>
                      <View style={styles.chatListHeader}>
                        <BackButton onPress={handleBackPress} color="white" />
                        <Text style={styles.chatListTitle}>Messages</Text>
                        <TouchableOpacity
                          onPress={() => userEmail && fetchEnrolledStudents(userEmail)}
                          style={styles.refreshButton}
                          disabled={loadingStudents}
                        >
                          {loadingStudents ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="refresh" size={20} color="#fff" />
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* Status Banner: WebSocket & Pending Bookings */}
                      <View style={localStyles.statusBanner}>
                        <View style={localStyles.statusItem}>
                          <View style={[
                            localStyles.statusDot,
                            socketConnected ? { backgroundColor: '#22C55E' } : { backgroundColor: '#EF4444' }
                          ]} />
                          <Text style={localStyles.statusText}>
                            {socketConnected ? 'Live' : 'Offline'}
                          </Text>
                          {!socketConnected && (
                            <Ionicons name="alert" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        {bookingRequests.filter(r => r.status === 'pending').length > 0 && (
                          <TouchableOpacity
                            style={localStyles.pendingBadge}
                            onPress={() => setActiveTab('My Requests')}
                          >
                            <Ionicons name="time" size={14} color="#92400E" />
                            <Text style={localStyles.pendingBadgeText}>
                              {bookingRequests.filter(r => r.status === 'pending').length} Pending
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                    <View style={styles.tabContainer}>
                      <TouchableOpacity
                        style={[styles.tab, activeTab === 'Teachers' && styles.activeTab]}
                        onPress={() => setActiveTab('Teachers')}
                      >
                        <Text style={[styles.tabText, activeTab === 'Teachers' && styles.activeTabText]}>
                          Teachers
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tab, activeTab === 'Broadcast' && styles.activeTab]}
                        onPress={() => setActiveTab('Broadcast')}
                      >
                        <Text style={[styles.tabText, activeTab === 'Broadcast' && styles.activeTabText]}>
                          Broadcast
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tab, activeTab === 'My Requests' && styles.activeTab]}
                        onPress={() => setActiveTab('My Requests')}
                      >
                        <Text style={[styles.tabText, activeTab === 'My Requests' && styles.activeTabText]}>
                          My Requests
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.chatList}>
                      {activeTab === 'My Requests' ? (
                        <>
                          {bookingLoading && bookingRequests.length === 0 && (
                            <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                          )}
                          {!bookingLoading && bookingRequests.length === 0 && (
                            <View style={styles.emptyContainer}>
                              <Ionicons name="time-outline" size={64} color={COLORS.textMuted} />
                              <Text style={styles.emptyText}>No booking requests yet</Text>
                              <Text style={styles.emptySubtext}>Book a class from Teacher Details to see your requests here</Text>
                            </View>
                          )}
                          {bookingRequests.map((request) => (
                            <View key={request.id} style={localStyles.requestCard}>
                              <View style={localStyles.requestHeader}>
                                <Text style={localStyles.teacherName}>{request.teacherName || request.teacherEmail}</Text>
                                <View style={[localStyles.statusBadge,
                                  request.status === 'pending' && { backgroundColor: '#FEF3C7' },
                                  request.status === 'accepted' && { backgroundColor: '#22C55E' },
                                  request.status === 'rejected' && { backgroundColor: '#EF4444' }
                                ]}>
                                  <Text style={[localStyles.statusText,
                                    request.status === 'pending' && { color: '#92400E' },
                                    (request.status === 'accepted' || request.status === 'rejected') && { color: '#fff' }
                                  ]}>
                                    {request.status?.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                              <Text style={localStyles.requestSubject}>{request.subject}{request.className ? ` - ${request.className}` : ''}</Text>
                              {request.charge > 0 && (
                                <Text style={localStyles.requestCharge}>
                                  {String(request.charge).includes('₹') ? request.charge : `₹${request.charge}`}/hr
                                </Text>
                              )}
                              {request.status === 'accepted' && (
                                <TouchableOpacity
                                  style={localStyles.payButton}
                                  onPress={() => router.push({
                                    pathname: '/(tabs)/StudentDashBoard/BookClass',
                                    params: {
                                      teacherEmail: request.teacherEmail,
                                      teacherName: request.teacherName,
                                      selectedSubject: request.subject,
                                      selectedClass: request.className,
                                      charge: request.charge?.toString().replace(/[₹,]/g, '').trim()
                                    }
                                  })}
                                >
                                  <Text style={localStyles.payButtonText}>Proceed to Pay</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </>
                      ) : activeTab === 'Broadcast' ? (
                        // Broadcast Tab Content - Show Class-Subject Groups
                        <>
                          {broadcastLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                          ) : studentBroadcastData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                              <Ionicons name="megaphone-outline" size={64} color={COLORS.textMuted} />
                              <Text style={styles.emptyText}>No broadcasts yet</Text>
                              <Text style={styles.emptySubtext}>Join a class to receive broadcast messages from your teacher</Text>
                            </View>
                          ) : (
                            studentBroadcastData.map((broadcastGroup) => (
                              <TouchableOpacity
                                key={broadcastGroup.id}
                                style={[styles.broadcastGroupItem, selectedBroadcast?.id === broadcastGroup.id && styles.broadcastGroupItemActive]}
                                onPress={() => handleBroadcastSelect(broadcastGroup)}
                              >
                                <View style={styles.broadcastGroupIcon}>
                                  <Ionicons name="school" size={24} color={COLORS.primaryBlue} />
                                </View>
                                <View style={styles.broadcastGroupInfo}>
                                  <Text style={styles.broadcastGroupTitle}>
                                    {broadcastGroup.classname} - {broadcastGroup.subject}
                                  </Text>
                                  <Text style={styles.broadcastGroupSubtitle}>
                                    Teacher: {broadcastGroup.teacherName || 'Unknown'}
                                  </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                              </TouchableOpacity>
                            ))
                          )}
                        </>
                      ) : (
                        // Teachers Tab Content
                        <>
                          {loadingStudents ? (
                            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                          ) : enrolledStudents.length === 0 ? (
                            <View style={styles.emptyContainer}>
                              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
                              <Text style={styles.emptyText}>No conversations yet</Text>
                              <Text style={styles.emptySubtext}>Start connecting with your teachers</Text>
                            </View>
                          ) : (
                            enrolledStudents.map((contact) => (
                              <TouchableOpacity
                                key={contact.email}
                                style={[styles.contactItem, selectedContact?.email === contact.email && styles.contactItemActive]}
                                onPress={() => handleSelectContact(contact)}
                              >
                                {contact.profilePic ? (
                                  <Image source={{ uri: contact.profilePic }} style={styles.contactAvatar} />
                                ) : (
                                  <View style={styles.contactAvatarFallback}>
                                    <Text style={styles.contactAvatarText}>
                                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.contactInfo}>
                                  <View style={styles.contactNameRow}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    {contact.isPaid && (
                                      <View style={styles.paidBadge}>
                                        <Text style={styles.paidBadgeText}>PAID</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.contactLastMessage} numberOfLines={1}>
                                    {contact.lastMessage || 'Click to start chatting'}
                                  </Text>
                                </View>
                                <View style={styles.contactMeta}>
                                  <Text style={styles.contactTime}>{contact.lastMessageTime || ''}</Text>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </>
                      )}
                    </ScrollView>
                  </View>

                  {/* CENTER: Chat Window */}
                  <View style={styles.chatWindowPanel}>
                    {selectedContact ? (
                      <View style={styles.chatWindow}>
                        {/* Chat Header */}
                        <View style={styles.chatHeader}>
                          <View style={styles.chatHeaderLeft}>
                            {selectedContact.profilePic ? (
                              <Image source={{ uri: selectedContact.profilePic }} style={styles.chatAvatar} />
                            ) : (
                              <View style={styles.chatAvatarFallback}>
                                <Text style={styles.chatAvatarText}>
                                  {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </Text>
                              </View>
                            )}
                            <View style={styles.chatHeaderInfo}>
                              <View style={styles.contactNameRow}>
                                <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
                                {selectedContact.isPaid && (
                                  <View style={styles.paidBadge}>
                                    <Text style={styles.paidBadgeText}>PAID</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.chatHeaderStatus}>Active now</Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedContact(null)}>
                            <Ionicons name="close" size={24} color={COLORS.textHeader} />
                          </TouchableOpacity>
                        </View>

                        {/* Messages Area */}
                        <ScrollView
                          ref={messagesScrollViewRef}
                          style={styles.messagesArea}
                          contentContainerStyle={{ paddingVertical: 16 }}
                        >
                          {messagesLoading ? (
                            <View style={styles.chatEmptyContainer}>
                              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                              <Text style={styles.chatEmptyText}>Loading messages...</Text>
                            </View>
                          ) : chatMessages.length === 0 ? (
                            <View style={styles.chatEmptyContainer}>
                              <Text style={styles.chatEmptyText}>Start a conversation with {selectedContact.name}</Text>
                            </View>
                          ) : (
                            chatMessages.map((message) => (
                              <View
                                key={message.id}
                                style={[
                                  styles.messageItem,
                                  message.sender === userEmail ? styles.sentMessage : styles.receivedMessage
                                ]}
                              >
                                <Text style={[
                                  styles.messageText,
                                  message.sender === userEmail ? styles.sentMessageText : styles.receivedMessageText
                                ]}>
                                  {message.text}
                                </Text>
                                <Text style={[
                                  styles.messageTime,
                                  message.sender === userEmail ? styles.sentMessageTime : styles.receivedMessageTime
                                ]}>
                                  {message.timestamp?.toDate ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Text>
                              </View>
                            ))
                          )}
                        </ScrollView>

                        {/* Message Input - Only for contact chat, not broadcast */}
                        <View style={styles.messageInputContainer}>
                          <TextInput
                            style={styles.messageInput}
                            placeholder="Type a message..."
                            value={messageInput}
                            onChangeText={setMessageInput}
                            multiline
                          />
                          <TouchableOpacity
                            style={styles.sendButton}
                            onPress={sendMessage}
                            disabled={isSending || !messageInput.trim()}
                          >
                            {isSending ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Ionicons name="send" size={20} color={COLORS.white} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : selectedBroadcast ? (
                      /* BROADCAST CHAT VIEW - Read Only */
                      <View style={styles.chatWindow}>
                        {/* Broadcast Chat Header */}
                        <View style={styles.chatHeader}>
                          <View style={styles.chatHeaderLeft}>
                            <View style={[styles.chatAvatar, { backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center' }]}>
                              <Ionicons name="megaphone" size={24} color={COLORS.white} />
                            </View>
                            <View style={styles.chatHeaderInfo}>
                              <Text style={styles.chatHeaderName}>
                                {selectedBroadcast.classname} - {selectedBroadcast.subject}
                              </Text>
                              <Text style={styles.chatHeaderStatus}>Broadcast • Read Only</Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedBroadcast(null)}>
                            <Ionicons name="close" size={24} color={COLORS.textHeader} />
                          </TouchableOpacity>
                        </View>

                        {/* Broadcast Messages Area */}
                        <ScrollView
                          ref={messagesScrollViewRef}
                          style={styles.messagesArea}
                          contentContainerStyle={{ paddingVertical: 16 }}
                        >
                          {messagesLoading ? (
                            <View style={styles.chatEmptyContainer}>
                              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                              <Text style={styles.chatEmptyText}>Loading broadcast messages...</Text>
                            </View>
                          ) : chatMessages.length === 0 ? (
                            <View style={styles.chatEmptyContainer}>
                              <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
                              <Text style={styles.chatEmptyText}>No broadcast messages yet</Text>
                              <Text style={styles.chatEmptySubtext}>Your teacher will send announcements here</Text>
                            </View>
                          ) : (
                            chatMessages.map((message) => (
                              <View
                                key={message.id}
                                style={[styles.messageItem, styles.receivedMessage, styles.broadcastMessage]}
                              >
                                <View style={styles.broadcastHeader}>
                                  <Ionicons name="megaphone" size={14} color={COLORS.primaryBlue} />
                                  <Text style={styles.broadcastTeacherName}>{message.teacherName || 'Teacher'}</Text>
                                </View>
                                <Text style={[styles.messageText, styles.receivedMessageText]}>
                                  {message.text}
                                </Text>
                                <Text style={[styles.messageTime, styles.receivedMessageTime]}>
                                  {message.time}
                                </Text>
                              </View>
                            ))
                          )}
                        </ScrollView>

                        {/* Read Only Indicator - No Input */}
                        <View style={[styles.messageInputContainer, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="eye-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                          <Text style={{ color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 14 }}>
                            Read Only • You cannot reply to broadcasts
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.chatEmptyState}>
                        <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                        <Text style={styles.chatEmptySubtitle}>Choose a teacher or broadcast to view messages</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* RIGHT PANEL: Thoughts */}
                <View style={styles.rightPanel}>
                  <Text style={styles.rightPanelTitle}>Thoughts</Text>
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                    {postsLoading && posts.length === 0 && <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />}
                    {!postsLoading && posts.length === 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <MaterialCommunityIcons name="post-outline" size={40} color="#ccc" />
                        <Text style={{ color: '#aaa', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>No thoughts yet</Text>
                      </View>
                    )}
                    {posts.map((post) => (
                      <ThoughtsCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={openCommentsModal}
                        onReport={(p, reasons, comment) => { console.log('Report submitted for post:', p.id, 'Reasons:', reasons, 'Comment:', comment); }}
                        getProfileImageSource={getProfileImageSource}
                        initials={initials}
                        resolvePostAuthor={resolvePostAuthor}
                      />
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </ResponsiveSidebar>
        </View>
        </View>
      );
    }

    // Full standalone layout
    return (
      <View style={styles.container}>
        <WebNavbar
          studentName={studentName}
          profileImage={userImage}
        />
        
        <View style={styles.contentLayout}>
          <ResponsiveSidebar
            activeItem={activeMenu}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || ""}
            studentName={studentName || ""}
            profileImage={userImage || null}
            notificationCounts={{ 'Connect': connectNotificationCount }}
            >
            <View style={styles.mainWrapper}>
            <View style={styles.contentColumns}>
              {/* CENTER: Chat Content */}
              <View style={styles.centerContent}>
                {/* LEFT: Chat List Panel */}
                <View style={styles.chatListPanel}>
                  <View style={styles.chatListHeader}>
                    <BackButton onPress={handleBackPress} color="white" />
                    <Text style={styles.chatListTitle}>Messages</Text>
                    <TouchableOpacity
                      onPress={() => userEmail && fetchEnrolledStudents(userEmail)}
                      style={styles.refreshButton}
                      disabled={loadingStudents}
                    >
                      {loadingStudents ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="refresh" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      style={[styles.tab, activeTab === 'Teachers' && styles.activeTab]}
                      onPress={() => setActiveTab('Teachers')}
                    >
                      <Text style={[styles.tabText, activeTab === 'Teachers' && styles.activeTabText]}>
                        Teachers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, activeTab === 'Broadcast' && styles.activeTab]}
                      onPress={() => setActiveTab('Broadcast')}
                    >
                      <Text style={[styles.tabText, activeTab === 'Broadcast' && styles.activeTabText]}>
                        Broadcast
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, activeTab === 'My Requests' && styles.activeTab]}
                      onPress={() => setActiveTab('My Requests')}
                    >
                      <Text style={[styles.tabText, activeTab === 'My Requests' && styles.activeTabText]}>
                        My Requests
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.chatList}>
                    {activeTab === 'My Requests' ? (
                      <>
                        {bookingLoading && bookingRequests.length === 0 && (
                          <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                        )}
                        {!bookingLoading && bookingRequests.length === 0 && (
                          <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No booking requests yet</Text>
                            <Text style={styles.emptySubtext}>Book a class from Teacher Details to see your requests here</Text>
                          </View>
                        )}
                        {bookingRequests.map((request) => (
                          <View key={request.id} style={localStyles.requestCard}>
                            <View style={localStyles.requestHeader}>
                              <Text style={localStyles.teacherName}>{request.teacherName || request.teacherEmail}</Text>
                              <View style={[localStyles.statusBadge,
                                request.status === 'pending' && { backgroundColor: '#FEF3C7' },
                                request.status === 'accepted' && { backgroundColor: '#22C55E' },
                                request.status === 'rejected' && { backgroundColor: '#EF4444' }
                              ]}>
                                <Text style={[localStyles.statusText,
                                  request.status === 'pending' && { color: '#92400E' },
                                  (request.status === 'accepted' || request.status === 'rejected') && { color: '#fff' }
                                ]}>
                                  {request.status?.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                            <Text style={localStyles.requestSubject}>{request.subject}{request.className ? ` - ${request.className}` : ''}</Text>
                            {request.charge > 0 && (
                              <Text style={localStyles.requestCharge}>
                                {String(request.charge).includes('₹') ? request.charge : `₹${request.charge}`}/hr
                              </Text>
                            )}
                            {request.status === 'accepted' && (
                              <TouchableOpacity
                                style={localStyles.payButton}
                                onPress={() => router.push({
                                  pathname: '/(tabs)/StudentDashBoard/BookClass',
                                  params: {
                                    teacherEmail: request.teacherEmail,
                                    teacherName: request.teacherName,
                                    selectedSubject: request.subject,
                                    selectedClass: request.className,
                                    charge: request.charge?.toString().replace(/[₹,]/g, '').trim()
                                  }
                                })}
                              >
                                <Text style={localStyles.payButtonText}>Proceed to Pay</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </>
                    ) : activeTab === 'Broadcast' ? (
                      // Tablet: Broadcast Tab Content
                      <>
                        {broadcastLoading ? (
                          <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                        ) : studentBroadcastData.length === 0 ? (
                          <View style={styles.emptyContainer}>
                            <Ionicons name="megaphone-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No broadcasts yet</Text>
                            <Text style={styles.emptySubtext}>Join a class to receive broadcast messages from your teacher</Text>
                          </View>
                        ) : (
                          studentBroadcastData.map((broadcastGroup) => (
                            <TouchableOpacity
                              key={broadcastGroup.id}
                              style={[styles.broadcastGroupItem, selectedBroadcast?.id === broadcastGroup.id && styles.broadcastGroupItemActive]}
                              onPress={() => handleBroadcastSelect(broadcastGroup)}
                            >
                              <View style={styles.broadcastGroupIcon}>
                                <Ionicons name="school" size={24} color={COLORS.primaryBlue} />
                              </View>
                              <View style={styles.broadcastGroupInfo}>
                                <Text style={styles.broadcastGroupTitle}>
                                  {broadcastGroup.classname} - {broadcastGroup.subject}
                                </Text>
                                <Text style={styles.broadcastGroupSubtitle}>
                                  Teacher: {broadcastGroup.teacherName || 'Unknown'}
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>
                          ))
                        )}
                      </>
                    ) : (
                      // Tablet: Teachers Tab Content
                      <>
                        {loadingStudents ? (
                          <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                        ) : enrolledStudents.length === 0 ? (
                          <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No conversations yet</Text>
                            <Text style={styles.emptySubtext}>Start connecting with your teachers</Text>
                          </View>
                        ) : (
                          enrolledStudents.map((contact) => (
                            <TouchableOpacity
                              key={contact.email}
                              style={[styles.contactItem, selectedContact?.email === contact.email && styles.contactItemActive]}
                              onPress={() => handleSelectContact(contact)}
                            >
                              {contact.profilePic ? (
                                <Image source={{ uri: contact.profilePic }} style={styles.contactAvatar} />
                              ) : (
                                <View style={styles.contactAvatarFallback}>
                                  <Text style={styles.contactAvatarText}>
                                    {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.contactInfo}>
                                <View style={styles.contactNameRow}>
                                  <Text style={styles.contactName}>{contact.name}</Text>
                                  {contact.isPaid && (
                                    <View style={styles.paidBadge}>
                                      <Text style={styles.paidBadgeText}>PAID</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.contactLastMessage} numberOfLines={1}>
                                  {contact.lastMessage || 'Click to start chatting'}
                                </Text>
                              </View>
                              <View style={styles.contactMeta}>
                                <Text style={styles.contactTime}>{contact.lastMessageTime || ''}</Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                      </>
                    )}
                  </ScrollView>
                </View>

                {/* CENTER: Chat Window */}
                <View style={styles.chatWindowPanel}>
                  {selectedContact ? (
                    <View style={styles.chatWindow}>
                      <View style={styles.chatHeader}>
                        <View style={styles.chatHeaderLeft}>
                          {selectedContact.profilePic ? (
                            <Image source={{ uri: selectedContact.profilePic }} style={styles.chatAvatar} />
                          ) : (
                            <View style={styles.chatAvatarFallback}>
                              <Text style={styles.chatAvatarText}>
                                {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.chatHeaderInfo}>
                            <View style={styles.contactNameRow}>
                              <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
                              {selectedContact.isPaid && (
                                <View style={styles.paidBadge}>
                                  <Text style={styles.paidBadgeText}>PAID</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.chatHeaderStatus}>Active now</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedContact(null)}>
                          <Ionicons name="close" size={24} color={COLORS.textHeader} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        ref={messagesScrollViewRef}
                        style={styles.messagesArea}
                        contentContainerStyle={{ paddingVertical: 16 }}
                      >
                        {messagesLoading ? (
                          <View style={styles.chatEmptyContainer}>
                            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                            <Text style={styles.chatEmptyText}>Loading messages...</Text>
                          </View>
                        ) : chatMessages.length === 0 ? (
                          <View style={styles.chatEmptyContainer}>
                            <Text style={styles.chatEmptyText}>Start a conversation with {selectedContact.name}</Text>
                          </View>
                        ) : (
                          chatMessages.map((message) => (
                            <View
                              key={message.id}
                              style={[
                                styles.messageItem,
                                message.sender === userEmail ? styles.sentMessage : styles.receivedMessage
                              ]}
                            >
                              <Text style={[
                                styles.messageText,
                                message.sender === userEmail ? styles.sentMessageText : styles.receivedMessageText
                              ]}>
                                {message.text}
                              </Text>
                              <Text style={[
                                styles.messageTime,
                                message.sender === userEmail ? styles.sentMessageTime : styles.receivedMessageTime
                              ]}>
                                {message.timestamp?.toDate ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </Text>
                            </View>
                          ))
                        )}
                      </ScrollView>

                      <View style={styles.messageInputContainer}>
                        <TextInput
                          style={styles.messageInput}
                          placeholder="Type a message..."
                          value={messageInput}
                          onChangeText={setMessageInput}
                          multiline
                        />
                        <TouchableOpacity
                          style={styles.sendButton}
                          onPress={sendMessage}
                          disabled={isSending || !messageInput.trim()}
                        >
                          {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="send" size={20} color={COLORS.white} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : selectedBroadcast ? (
                    /* TABLET: Broadcast Chat View - Read Only */
                    <View style={styles.chatWindow}>
                      <View style={styles.chatHeader}>
                        <View style={styles.chatHeaderLeft}>
                          <View style={[styles.chatAvatar, { backgroundColor: COLORS.primaryBlue, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="megaphone" size={24} color={COLORS.white} />
                          </View>
                          <View style={styles.chatHeaderInfo}>
                            <Text style={styles.chatHeaderName}>
                              {selectedBroadcast.classname} - {selectedBroadcast.subject}
                            </Text>
                            <Text style={styles.chatHeaderStatus}>Broadcast • Read Only</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedBroadcast(null)}>
                          <Ionicons name="close" size={24} color={COLORS.textHeader} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        ref={messagesScrollViewRef}
                        style={styles.messagesArea}
                        contentContainerStyle={{ paddingVertical: 16 }}
                      >
                        {messagesLoading ? (
                          <View style={styles.chatEmptyContainer}>
                            <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                            <Text style={styles.chatEmptyText}>Loading broadcast messages...</Text>
                          </View>
                        ) : chatMessages.length === 0 ? (
                          <View style={styles.chatEmptyContainer}>
                            <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.chatEmptyText}>No broadcast messages yet</Text>
                            <Text style={styles.chatEmptySubtext}>Your teacher will send announcements here</Text>
                          </View>
                        ) : (
                          chatMessages.map((message) => (
                            <View
                              key={message.id}
                              style={[styles.messageItem, styles.receivedMessage, styles.broadcastMessage]}
                            >
                              <View style={styles.broadcastHeader}>
                                <Ionicons name="megaphone" size={14} color={COLORS.primaryBlue} />
                                <Text style={styles.broadcastTeacherName}>{message.teacherName || 'Teacher'}</Text>
                              </View>
                              <Text style={[styles.messageText, styles.receivedMessageText]}>
                                {message.text}
                              </Text>
                              <Text style={[styles.messageTime, styles.receivedMessageTime]}>
                                {message.time}
                              </Text>
                            </View>
                          ))
                        )}
                      </ScrollView>

                      <View style={[styles.messageInputContainer, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="eye-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={{ color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 14 }}>
                          Read Only • You cannot reply to broadcasts
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.chatEmptyState}>
                      <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                      <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                      <Text style={styles.chatEmptySubtitle}>Choose a teacher or broadcast to view messages</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* RIGHT PANEL: Thoughts */}
              <View style={styles.rightPanel}>
                <Text style={styles.rightPanelTitle}>Thoughts</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                  {postsLoading && posts.length === 0 && <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />}
                  {!postsLoading && posts.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <MaterialCommunityIcons name="post-outline" size={40} color="#ccc" />
                      <Text style={{ color: '#aaa', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>No thoughts yet</Text>
                    </View>
                  )}
                  {posts.map((post) => (
                    <ThoughtsCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onComment={openCommentsModal}
                      onReport={(p, reasons, comment) => { console.log('Report submitted for post:', p.id, 'Reasons:', reasons, 'Comment:', comment); }}
                      getProfileImageSource={getProfileImageSource}
                      initials={initials}
                      resolvePostAuthor={resolvePostAuthor}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
        </View>
          
          </ResponsiveSidebar>
        </View>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={[styles.container, { height: windowSize.height }]}>
      {/* Mobile Header with Back Button */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity 
          style={styles.mobileBackButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color="#5f5fff" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>Connect</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.mobileContainer}>
        {/* Chat List for Mobile */}
        <View style={styles.mobileChatList}>
          {/* Status Banner: WebSocket & Pending Bookings */}
          <View style={localStyles.mobileStatusBanner}>
            <View style={localStyles.statusItem}>
              <View style={[
                localStyles.statusDot,
                socketConnected ? { backgroundColor: '#22C55E' } : { backgroundColor: '#EF4444' }
              ]} />
              <Text style={localStyles.statusText}>
                {socketConnected ? 'Live' : 'Offline'}
              </Text>
              {!socketConnected && (
                <Ionicons name="alert" size={12} color="#EF4444" style={{ marginLeft: 4 }} />
              )}
            </View>
            {bookingRequests.filter(r => r.status === 'pending').length > 0 && (
              <TouchableOpacity
                style={localStyles.mobilePendingBadge}
                onPress={() => setActiveTab('My Requests')}
              >
                <Ionicons name="time" size={12} color="#92400E" />
                <Text style={localStyles.mobilePendingBadgeText}>
                  {bookingRequests.filter(r => r.status === 'pending').length} Pending
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => userEmail && fetchEnrolledStudents(userEmail)}
              style={[localStyles.mobileRefreshButton, loadingStudents && { opacity: 0.6 }]}
              disabled={loadingStudents}
            >
              {loadingStudents ? (
                <ActivityIndicator size="small" color={COLORS.primaryBlue} />
              ) : (
                <Ionicons name="refresh" size={18} color={COLORS.primaryBlue} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.mobileTabContainer}>
            <TouchableOpacity 
              style={[styles.mobileTab, activeTab === 'Teachers' && styles.mobileActiveTab]}
              onPress={() => setActiveTab('Teachers')}
            >
              <Text style={[styles.mobileTabText, activeTab === 'Teachers' && styles.mobileActiveTabText]}>Teachers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mobileTab, activeTab === 'Broadcast' && styles.mobileActiveTab]}
              onPress={() => setActiveTab('Broadcast')}
            >
              <Text style={[styles.mobileTabText, activeTab === 'Broadcast' && styles.mobileActiveTabText]}>Broadcast</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mobileTab, activeTab === 'My Requests' && styles.mobileActiveTab]}
              onPress={() => setActiveTab('My Requests')}
            >
              <Text style={[styles.mobileTabText, activeTab === 'My Requests' && styles.mobileActiveTabText]}>My Requests</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.mobileChatScroll}>
            {activeTab === 'My Requests' ? (
              <>
                {bookingLoading && bookingRequests.length === 0 && (
                  <View style={styles.mobileLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.mobileLoadingText}>Loading booking requests...</Text>
                  </View>
                )}
                {!bookingLoading && bookingRequests.length === 0 && (
                  <View style={styles.mobileEmptyState}>
                    <MaterialCommunityIcons name="time-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.mobileEmptyStateText}>No booking requests yet</Text>
                    <Text style={styles.mobileEmptyStateSubtext}>Book a class from Teacher Details to see your requests here</Text>
                  </View>
                )}
                {bookingRequests.map((request) => (
                  <View key={request.id} style={localStyles.requestCard}>
                    <View style={localStyles.requestHeader}>
                      <Text style={localStyles.teacherName}>{request.teacherName || request.teacherEmail}</Text>
                      <View style={[localStyles.statusBadge,
                        request.status === 'pending' && { backgroundColor: '#FEF3C7' },
                        request.status === 'accepted' && { backgroundColor: '#22C55E' },
                        request.status === 'rejected' && { backgroundColor: '#EF4444' }
                      ]}>
                        <Text style={[localStyles.statusText,
                          request.status === 'pending' && { color: '#92400E' },
                          (request.status === 'accepted' || request.status === 'rejected') && { color: '#fff' }
                        ]}>
                          {request.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={localStyles.requestSubject}>{request.subject}{request.className ? ` - ${request.className}` : ''}</Text>
                    {request.charge > 0 && (
                      <Text style={localStyles.requestCharge}>
                        {String(request.charge).includes('₹') ? request.charge : `₹${request.charge}`}/hr
                      </Text>
                    )}
                    {request.status === 'accepted' && (
                      <TouchableOpacity
                        style={localStyles.payButton}
                        onPress={() => router.push({
                          pathname: '/(tabs)/StudentDashBoard/BookClass',
                          params: {
                            teacherEmail: request.teacherEmail,
                            teacherName: request.teacherName,
                            selectedSubject: request.subject,
                            selectedClass: request.className,
                            charge: request.charge?.toString().replace(/[₹,]/g, '').trim()
                          }
                        })}
                      >
                        <Text style={localStyles.payButtonText}>Proceed to Pay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            ) : activeTab === 'Broadcast' ? (
              // Mobile: Broadcast Tab Content
              <>
                {broadcastLoading ? (
                  <View style={styles.mobileLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.mobileLoadingText}>Loading broadcasts...</Text>
                  </View>
                ) : studentBroadcastData.length === 0 ? (
                  <View style={styles.mobileEmptyState}>
                    <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
                    <Text style={styles.mobileEmptyStateText}>No broadcasts yet</Text>
                    <Text style={styles.mobileEmptyStateSubtext}>Join a class to receive broadcast messages</Text>
                  </View>
                ) : (
                  studentBroadcastData.map((broadcastGroup) => (
                    <TouchableOpacity
                      key={broadcastGroup.id}
                      style={styles.mobileBroadcastItem}
                      onPress={() => handleBroadcastSelect(broadcastGroup)}
                    >
                      <View style={styles.mobileBroadcastIcon}>
                        <Ionicons name="school" size={28} color={COLORS.primaryBlue} />
                      </View>
                      <View style={styles.mobileBroadcastInfo}>
                        <Text style={styles.mobileBroadcastTitle}>
                          {broadcastGroup.classname} - {broadcastGroup.subject}
                        </Text>
                        <Text style={styles.mobileBroadcastSubtitle}>
                          Teacher: {broadcastGroup.teacherName || 'Unknown'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              // Mobile: Teachers Tab Content
              <>
                {loadingStudents ? (
                  <View style={styles.mobileLoadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                    <Text style={styles.mobileLoadingText}>Loading enrolled teachers...</Text>
                  </View>
                ) : enrolledStudents.length === 0 ? (
                  <View style={styles.mobileEmptyState}>
                    <MaterialCommunityIcons name="account-search" size={48} color={COLORS.textMuted} />
                    <Text style={styles.mobileEmptyStateText}>No enrolled teachers found</Text>
                    <Text style={styles.mobileEmptyStateSubtext}>Enroll in subjects to start chatting with teachers</Text>
                  </View>
                ) : (
                  enrolledStudents.map((contact) => (
                    <TouchableOpacity
                      key={contact.email}
                      style={styles.mobileContactItem}
                      onPress={() => handleSelectContact(contact)}
                    >
                      {contact.profilePic ? (
                        <Image source={{ uri: contact.profilePic }} style={styles.mobileContactAvatar} />
                      ) : (
                        <View style={styles.mobileContactAvatarFallback}>
                          <Text style={styles.mobileContactAvatarText}>
                            {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.mobileContactInfo}>
                        <View style={styles.contactNameRow}>
                          <Text style={styles.mobileContactName}>{contact.name}</Text>
                          {contact.isPaid && (
                            <View style={styles.paidBadge}>
                              <Text style={styles.paidBadgeText}>PAID</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.mobileContactLastMessage} numberOfLines={1}>
                          {contact.lastMessage || 'Click to start chatting'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Chat Screen Modal for Mobile */}
      <Modal
        visible={!!selectedContact}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedContact(null)}
      >
        {selectedContact && (
          <View style={styles.mobileFullScreenChat}>
            <View style={styles.mobileChatScreenHeader}>
              <TouchableOpacity 
                style={styles.mobileBackButton} 
                onPress={() => setSelectedContact(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {selectedContact.profilePic ? (
                  <Image source={{ uri: selectedContact.profilePic }} style={styles.mobileChatHeaderAvatar} />
                ) : (
                  <View style={styles.mobileChatHeaderAvatarFallback}>
                    <Text style={styles.mobileChatHeaderAvatarText}>
                      {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                )}
                <View style={styles.mobileChatHeaderInfo}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.mobileChatHeaderName}>{selectedContact.name}</Text>
                    {selectedContact.isPaid && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>PAID</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {messagesLoading ? (
              <View style={styles.chatEmptyContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.chatEmptyText}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.mobileChatMessagesList}
                renderItem={({ item }) => (
                <View style={[
                  styles.mobileMessageBubble,
                  item.sender === userEmail ? styles.mobileMyMessage : styles.mobileOtherMessage,
                ]}>
                  <Text style={[
                    styles.mobileMessageText,
                    item.sender === userEmail ? styles.mobileMyMessageText : styles.mobileOtherMessageText,
                  ]}>
                    {item.text}
                  </Text>
                  <Text style={[
                    styles.mobileMessageTime,
                    item.sender === userEmail ? styles.mobileMyMessageTime : styles.mobileOtherMessageTime,
                  ]}>
                    {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.mobileEmptyChatContainer}>
                  <Text style={styles.mobileEmptyChatText}>No messages yet. Start the conversation!</Text>
                </View>
              }
            />
            )}

            <View style={styles.mobileChatInputContainer}>
              <TextInput
                style={styles.mobileChatInput}
                value={messageInput}
                onChangeText={setMessageInput}
                placeholder="Message to connect"
                placeholderTextColor="#888"
                editable={!isSending}
              />
              <TouchableOpacity 
                onPress={sendMessage}
                style={styles.mobileSendButton}
                disabled={isSending || !messageInput.trim()}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={COLORS.primaryBlue} />
                ) : (
                  <Ionicons name="send" size={24} color={COLORS.primaryBlue} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.commentsList}>
              {postComments.map((c, i) => (
                <View key={i} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{c.author?.name || 'User'}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <Text style={styles.commentTime}>{c.createdAt}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput style={styles.commentInput} placeholder="Add a comment..." value={commentText} onChangeText={setCommentText} multiline />
              <TouchableOpacity style={styles.commentSendBtn} onPress={addComment}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}><Ionicons name="close" size={24} color={COLORS.textHeader} /></TouchableOpacity>
            </View>
            <TextInput style={[styles.commentInput, { margin: 16, height: 100 }]} placeholder="Reason for report..." value={reportReason} onChangeText={setReportReason} multiline />
            <TouchableOpacity style={[styles.commentSendBtn, { margin: 16, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }]} onPress={submitReport}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.background,
  },
  contentColumns: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    minWidth: 0,
  },
  
  // Chat List Panel
  chatListPanel: {
    flex: 1,
    maxWidth: 400,
    backgroundColor: COLORS.chatListBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  chatListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBlue,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryBlue,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textBody,
    fontFamily: 'Poppins_500Medium',
  },
  activeTabText: {
    color: COLORS.primaryBlue,
    fontFamily: 'Poppins_600SemiBold',
  },
  chatList: {
    flex: 1,
  },
  
  // Contact Items
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 8,
  },
  contactItemActive: {
    backgroundColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  contactLastMessage: {
    fontSize: 14,
    color: COLORS.textBody,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  contactMeta: {
    alignItems: 'flex-end',
  },
  contactTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'Poppins_400Regular',
  },

  // Broadcast Group Items
  broadcastGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  broadcastGroupItemActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
  },
  broadcastGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  broadcastGroupInfo: {
    flex: 1,
  },
  broadcastGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  broadcastGroupSubtitle: {
    fontSize: 13,
    color: COLORS.textBody,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },

  // Broadcast Messages in Chat
  broadcastMessage: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryBlue,
  },
  broadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  broadcastTeacherName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primaryBlue,
  },

  // Chat Window
  chatWindowPanel: {
    flex: 1,
    backgroundColor: COLORS.chatWindowBg,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    minWidth: 0,
  },
  chatWindow: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: COLORS.onlineGreen,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  messagesArea: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.chatWindowBg,
  },
  messageItem: {
    marginBottom: 12,
    maxWidth: '70%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryBlue,
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.receivedBubble,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  sentMessageText: {
    color: COLORS.white,
  },
  receivedMessageText: {
    color: COLORS.textHeader,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedMessageTime: {
    color: COLORS.textMuted,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    maxHeight: 100,
    backgroundColor: COLORS.chatWindowBg,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chatEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  chatEmptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  chatEmptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  chatEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  chatEmptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  
  // Right Panel
  rightPanel: {
    width: 340,
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 16,
    flexDirection: 'column',
    flexShrink: 0,
  },
  rightPanelTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  thoughtsList: {
    paddingBottom: 24,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.textHeader,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  commentAuthor: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.textHeader,
    marginBottom: 4,
  },
  commentContent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.textHeader,
    lineHeight: 18,
  },
  commentTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textHeader,
    maxHeight: 100,
  },
  commentSendBtn: {
    marginLeft: 10,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 20,
    padding: 10,
  },
  
  // Mobile Styles
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobileBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileChatList: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mobileHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.textHeader,
  },
  mobileTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  mobileTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mobileActiveTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryBlue,
  },
  mobileTabText: {
    fontSize: 14,
    color: COLORS.textBody,
    fontFamily: 'Poppins_500Medium',
  },
  mobileActiveTabText: {
    color: COLORS.primaryBlue,
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileChatScroll: {
    flex: 1,
    padding: 12,
  },
  mobileLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  mobileLoadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  mobileEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  mobileEmptyStateText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: COLORS.textHeader,
    marginTop: 16,
  },
  mobileEmptyStateSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  mobileContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
  },
  mobileContactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  mobileContactAvatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileContactAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileContactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mobileContactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileContactLastMessage: {
    fontSize: 14,
    color: COLORS.textBody,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  // Mobile Broadcast Styles
  mobileBroadcastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mobileBroadcastIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mobileBroadcastInfo: {
    flex: 1,
  },
  mobileBroadcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileBroadcastSubtitle: {
    fontSize: 13,
    color: COLORS.textBody,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  mobileFullScreenChat: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },
  mobileChatScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.primaryBlue,
  },
  mobileBackButton: {
    marginRight: 12,
  },
  mobileChatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  mobileChatHeaderAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mobileChatHeaderAvatarText: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileChatHeaderInfo: {
    flex: 1,
  },
  mobileChatHeaderName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileChatMessagesList: {
    paddingVertical: 10,
  },
  mobileMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 8,
    maxWidth: Dimensions.get('window').width * 0.75,
  },
  mobileMyMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primaryBlue,
    borderBottomRightRadius: 4,
    marginRight: 12,
  },
  mobileOtherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    marginLeft: 12,
  },
  mobileMessageText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  mobileMyMessageText: {
    color: '#ffffff',
  },
  mobileOtherMessageText: {
    color: '#000000',
  },
  mobileMessageTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
    fontFamily: 'Poppins_400Regular',
  },
  mobileMyMessageTime: {
    color: '#ffffff',
  },
  mobileOtherMessageTime: {
    color: '#888',
  },
  mobileEmptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  mobileEmptyChatText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#888',
  },
  mobileChatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  mobileChatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    backgroundColor: '#fff',
  },
  mobileSendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Local styles for booking requests panel
const localStyles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontFamily: 'Poppins_500Medium',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 4,
  },
  mobilePendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mobilePendingBadgeText: {
    fontSize: 11,
    color: '#92400E',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 3,
  },
  mobileRefreshButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryBlue,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textBody,
    fontFamily: 'Poppins_500Medium',
  },
  activeTabText: {
    color: COLORS.primaryBlue,
    fontFamily: 'Poppins_600SemiBold',
  },
  badge: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teacherName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textHeader,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  requestSubject: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textBody,
    marginBottom: 4,
  },
  requestCharge: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primaryBlue,
    marginTop: 4,
  },
  payButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});