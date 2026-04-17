import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, ActivityIndicator, Alert, TextInput, Pressable, Platform, SafeAreaView, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import { getAuthData } from "../../../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../../../config";
import { db } from "../../../firebaseConfig";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeInRight,
  FadeInLeft,
} from 'react-native-reanimated';
import WebHeader from "../../../components/ui/WebHeader";
import WebSidebar from "../../../components/ui/WebSidebar";
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { getAuthData as getAuthDataUtil, storeAuthData } from '../../../utils/authStorage';
import UnifiedThoughtsCard, { UnifiedThoughtsBackground } from 'components/ui/UnifiedThoughtsCard';

// ─── Design tokens ──────────────────────────────────────────────────────────
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  textPrimary: '#1a1a1a',
  white: '#FFFFFF',
  bannerTint: '#EEF2FF',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  chatListBg: '#FAFBFC',
  chatWindowBg: '#F9FAFB',
  onlineGreen: '#10B981',
  receivedBubble: '#F3F4F6',
};

interface Contact {
  id: string;
  name: string;
  profilePic?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
  userType?: string;
  status?: string;
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
  teacherName?: string;
  read?: boolean;
  pending?: boolean;
}

interface ConnectionRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  studentProfilePic?: string;
  teacherEmail: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  subject?: string;
  className?: string;
  charge?: number;
  timestamp?: string;
  studentInfo?: any;
}

interface ConnectWebProps { 
  onBack?: () => void; 
  isEmbedded?: boolean; // Add this prop to indicate if it's embedded in the main layout
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

  const { width, height } = Dimensions.get('window');
  const isSmallMobile = width < 480;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  
  // Dynamic helper functions for enhanced responsiveness
  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.9;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.8;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };
  
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Connect');

  // Thoughts panel – shown on web desktop only
  const showThoughtsPanel = Platform.OS === 'web' && !isMobile;

  // Add dimension listener for responsive updates
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Force re-render with new dimensions
      const newWidth = window.width;
      const newHeight = window.height;
      // Component will automatically recalc isMobile, isTablet, etc.
    });
    return () => subscription?.remove();
  }, []);

  // Handle back button press
  const handleBackPress = () => {
    router.push("/(tabs)/TeacherDashBoard/Teacher");
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
  
  // Teacher data
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Teacher Posts Data for Thoughts
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [isThoughtsCollapsed, setIsThoughtsCollapsed] = useState(false);

  // Comment modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  // Tooltip state for ThoughtsCard
  const [showThoughtsTooltip, setShowThoughtsTooltip] = useState(false);

  // Auto-hide tooltip after 4.5 seconds
  useEffect(() => {
    if (showThoughtsTooltip) {
      const timer = setTimeout(() => {
        setShowThoughtsTooltip(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showThoughtsTooltip]);

  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'broadcast'>('chats');
  const [bookingRequests, setBookingRequests] = useState<ConnectionRequest[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Broadcast state
  const [teacherBroadcastData, setTeacherBroadcastData] = useState<any[]>([]);
  const [teacherBroadcastMessages, setTeacherBroadcastMessages] = useState<any[]>([]);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any | null>(null);

  // Tab-specific loading states
  const [chatsLoading, setChatsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastMessagesLoading, setBroadcastMessagesLoading] = useState(false);

  // Load teacher data and fetch posts - with retry mechanism for web reload
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let isMounted = true;

    const loadTeacherDataAndPosts = async () => {
      try {
        // Try to get auth data from AsyncStorage first
        let authData = await getAuthDataUtil();
        
        // If not found and on web, try localStorage as fallback
        if (!authData?.token && Platform.OS === 'web') {
          const webToken = localStorage.getItem('user_token');
          const webEmail = localStorage.getItem('user_email');
          const webName = localStorage.getItem('user_name');
          const webRole = localStorage.getItem('user_role');
          
          if (webToken && webRole === 'teacher') {
            authData = {
              token: webToken,
              email: webEmail || '',
              name: webName || '',
              role: webRole,
            };
          }
        }

        if (!isMounted) return;

        if (authData?.token) {
          setAuthToken(authData.token);
          setTeacherName(authData.name || '');
          setTeacherEmail(authData.email || '');
          setProfileImage(authData.profileImage || null);
          await fetchPosts(authData.token);
          await fetchBookingRequests(authData.token);
        } else if (retryCount < maxRetries) {
          // Retry after a short delay
          retryCount++;
          console.log(`Auth data not ready, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(loadTeacherDataAndPosts, 500);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(loadTeacherDataAndPosts, 500);
        }
      }
    };

    loadTeacherDataAndPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  // NOTE: WebSocket real-time updates disabled - using API polling only

  // Fetch existing booking requests from API
  const fetchBookingRequests = async (token: string) => {
    try {
      setRequestsLoading(true);
      console.log('📋 Fetching booking requests...');
      
      const response = await axios.get(`${BASE_URL}/api/bookings/teacher-requests`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data.success && response.data.requests) {
        console.log('📦 Raw requests from API:', JSON.stringify(response.data.requests, null, 2));
        
        const formattedRequests: ConnectionRequest[] = response.data.requests.map((req: any) => ({
          id: req.id,
          studentName: req.studentName,
          studentEmail: req.studentEmail,
          studentProfilePic: req.studentInfo?.profilePic,
          teacherEmail: req.teacherEmail,
          status: req.status,
          subject: req.subject,
          className: req.className,
          charge: req.charge,
          timestamp: req.timestamp,
          studentInfo: req.studentInfo
        }));
        
        console.log(`✅ Found ${formattedRequests.length} booking requests`);
        console.log('💰 First request charge:', formattedRequests[0]?.charge);
        
        // Replace state with fresh data (keeps all requests: pending, accepted, rejected)
        setBookingRequests(formattedRequests);
        setConnectionRequests(formattedRequests);
      }
      setRequestsLoading(false);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      setRequestsLoading(false);
    }
  };

  // Helper functions for teacher posts (same as TutorDashboardWeb)
  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: teacherName || 'Unknown Teacher',
        pic: profileImage || null,
        role: 'teacher'
      };
    }
    
    // Use cached profile data like student's version
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    
    // Priority: cached name > post author name > email fallback
    let name = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
    
    // Handle email fallback for name when name is empty/invalid
    if (!name || name === 'null' || name === 'undefined' || name.trim() === '' || name.includes('@')) {
      name = post.author?.email?.split('@')[0] || 'Unknown Teacher';
      // Clean up the name (remove dots, capitalize)
      name = name.split('.').map((part: string) => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Handle profile image path
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) {
      pic = `/${pic}`;
    }
    if (!pic || pic === '' || pic === 'null' || pic === 'undefined') {
      pic = profileImage || null;
    }
    
    return { name, pic, role: post.author?.role || 'teacher' };
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (profilePic) {
      // Handle different image path formats
      if (profilePic.startsWith('http')) {
        return { uri: profilePic };
      }
      // For local paths, construct proper URL
      const imageUrl = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
      return { uri: `${BASE_URL}${imageUrl}` };
    }
    return null;
  };

  const initials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.displayName;
        const profileData = { name: userName || 'Unknown User', profilePic: profilePic || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profileData)));
        return profileData;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
  };

  // Fetch posts function (same as TutorDashboardWeb)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.data.success) {
        // Get unique emails from all posts and fetch their profiles
        const uniqueEmails = [...new Set(res.data.data.map((p: any) => p.author?.email as string).filter((email: string) => Boolean(email)))];
        await Promise.all(uniqueEmails.map((email: string) => fetchUserProfile(token, email)));
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Handle post creation
  const handleCreatePost = async (content: string) => {
    if (!authToken || !teacherEmail) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/posts/create`,
        {
          content: content.trim(),
          tags: ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        // Refresh posts to include the new one
        if (authToken) {
          await fetchPosts(authToken);
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create post. Please try again.');
    }
  };

  // Comment modal functions
  const fetchPostComments = async (postId: string) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPostComments(res.data.data);
      } else {
        setPostComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setPostComments([]);
    }
  };

  const openCommentsModal = async (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/${selectedPost.id}/comments`,
        { content: commentText.trim() },
        { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        const newC = { ...res.data.data, createdAt: 'Just now', isLiked: false };
        setPostComments((prev) => [newC, ...prev]);
        setCommentText('');
        setPosts((ps) =>
          ps.map((p: any) => (p.id === selectedPost.id ? { ...p, comments: [newC, ...(p.comments || [])] } : p))
        );
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add comment');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    if (!authToken) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    try {
      const res = await axios.delete(
        `${BASE_URL}/api/posts/${postId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if (res.data.success) {
        await fetchPosts(authToken);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to delete post');
      }
    } catch (err: any) {
      console.error('Error deleting post:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete post');
    }
  };

  // Handle like post
  const handleLike = async (postId: string) => {
    if (!authToken) {
      Alert.alert('Error', 'Please log in to like posts');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newIsLiked = !post.isLiked;
    const newLikes = newIsLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);

    setPosts((ps) => ps.map((p) =>
      p.id === postId
        ? { ...p, isLiked: newIsLiked, likes: newLikes }
        : p
    ));

    try {
      const endpoint = `${BASE_URL}/api/posts/${postId}/like`;

      if (newIsLiked) {
        await axios.post(endpoint, {}, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } else {
        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch (err: any) {
      console.error('Error toggling like:', err);
      setPosts((ps) => ps.map((p) =>
        p.id === postId
          ? { ...p, isLiked: post.isLiked, likes: post.likes }
          : p
      ));
      Alert.alert('Error', err.response?.data?.message || 'Failed to toggle like');
    }
  };

  // Fetch contacts and messages
  useEffect(() => {
    const fetchContacts = async () => {
      if (activeTab !== 'chats') return; // Only fetch when chats tab is active
      
      try {
        setChatsLoading(true);
        if (!authToken || !teacherEmail) {
          setLoading(false);
          setChatsLoading(false);
          return;
        }

        console.log('📋 Fetching contacts for teacher chats...');
        
        // Use Firebase-based contacts endpoint to get subscribed students (same as Messages.tsx)
        const response = await axios.post(
          `${BASE_URL}/api/firebase-contacts`,
          { userEmail: teacherEmail, type: 'teacher' },
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        let formattedContacts: Contact[] = [];

        if (response.data.success) {
          formattedContacts = response.data.contacts.map((contact: any) => ({
            name: contact.teacherName || contact.studentName || contact.contactName,
            profilePic: contact.teacherProfilePic || contact.studentProfilePic || contact.contactProfilePic || contact.profilePic || "",
            lastMessage: contact.lastMessage || "No messages yet",
            lastMessageTime: contact.lastMessageTime || "Just now",
            email: contact.teacherEmail || contact.studentEmail || contact.contactEmail,
            userType: contact.userType || 'student',
            id: contact.id || contact._id || contact.email
          }));
          console.log(`✅ Found ${formattedContacts.length} contacts`);
        }

        // Add students from teacherBroadcastData to contacts
        if (teacherBroadcastData && teacherBroadcastData.length > 0) {
          const broadcastContacts: Contact[] = teacherBroadcastData
            .filter((item: any) => item.studentemail && item.studentname)
            .map((item: any) => {
              const email = item.studentemail;
              // Check if already in contacts
              const existingContact = formattedContacts.find(c => c.email === email);
              if (existingContact) {
                return existingContact;
              }
              // Add new contact from broadcast data
              return {
                name: item.studentname || 'Unknown',
                profilePic: item.studentprofilepic || null,
                lastMessage: 'No messages yet',
                lastMessageTime: 'Just now',
                email: email,
                userType: 'student',
                id: email,
                status: 'online'
              };
            });

          // Merge contacts, avoiding duplicates
          const mergedContacts = [...formattedContacts];
          broadcastContacts.forEach(broadcastContact => {
            if (!mergedContacts.find(c => c.email === broadcastContact.email)) {
              mergedContacts.push(broadcastContact);
            }
          });

          setContacts(mergedContacts);
        } else {
          setContacts(formattedContacts);
        }

        setLoading(false);
        setChatsLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
        setLoading(false);
        setChatsLoading(false);
        Alert.alert('Error', 'Failed to fetch contacts. Please try again.');
      }
    };

    fetchContacts();
  }, [authToken, teacherEmail, activeTab, teacherBroadcastData]);

  // Tab-specific data fetching
  useEffect(() => {
    if (!authToken || !teacherEmail) return;

    if (activeTab === 'broadcast') {
      fetchTeacherBroadcast();
    }
  }, [activeTab, authToken, teacherEmail]);

  // Render message item
  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageItem,
      message.sender === 'me' ? styles.sentMessage : styles.receivedMessage
    ]}>
      <Text style={[
        styles.messageText,
        message.sender === 'me' ? styles.sentMessageText : styles.receivedMessageText
      ]}>
        {message.text}
      </Text>
      <Text style={[
        styles.messageTime,
        message.sender === 'me' ? styles.sentMessageTime : styles.receivedMessageTime
      ]}>
        {message.time}
      </Text>
    </View>
  );

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    // Messages are now loaded automatically via Firebase real-time listener in useEffect
  };

  // Load messages for a specific contact using Firebase real-time
  useEffect(() => {
    if (!selectedContact || !teacherEmail) return;

    const contactEmail = selectedContact.email;
    if (!contactEmail) return;

    // Set loading state when starting to load messages
    setMessagesLoading(true);

    // Create chat ID like techgrowsmart does
    const chatId = [teacherEmail, contactEmail].sort().join('_');

    let pollingInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Primary: API polling mechanism (avoids Firestore onSnapshot errors on web)
    const startAPIMessagePolling = async () => {
      console.log('🔄 Starting API message polling...');
      
      const fetchMessagesViaAPI = async () => {
        if (!isMounted || !authToken) return;
        try {
          console.log(`📡 Fetching messages for chat: ${chatId}`);
          
          // Use correct API endpoint: /api/messages/:contactEmail
          const response = await axios.get(
            `${BASE_URL}/api/messages/${encodeURIComponent(contactEmail)}`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );

          if (response.data && (response.data.messages || response.data.success)) {
            const messages = response.data.messages || [];
            console.log(`✅ Fetched ${messages.length} messages via API`);
            
            const messagesList: Message[] = messages.map((msg: any) => ({
              id: msg.id || msg._id,
              text: msg.text || msg.message || '',
              sender: msg.sender === teacherEmail ? 'me' : 'other',
              time: msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              isBroadcast: msg.isBroadcast || false,
            }));

            if (isMounted) {
              setMessages(messagesList);
              setMessagesLoading(false);
            }
          }
        } catch (error) {
          console.warn('❌ API message fetch error:', error);
          // Don't set loading false on error - keep trying
        }
      };

      // Initial fetch
      await fetchMessagesViaAPI();
      
      // Poll every 5 seconds
      pollingInterval = setInterval(fetchMessagesViaAPI, 5000);
    };

    // Start API polling immediately
    startAPIMessagePolling();

    return () => {
      isMounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  }, [selectedContact, teacherEmail, authToken]);

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    const navigationMap: { [key: string]: any } = {
      "Home": "/(tabs)/TeacherDashBoard/TutorDashboardWeb",
      "My Subjects": "/(tabs)/TeacherDashBoard/MySubjectsWeb",
      "Connect": "/(tabs)/TeacherDashBoard/ConnectWeb",
      "Share": "/(tabs)/TeacherDashBoard/Share",
      "Profile": "/(tabs)/TeacherDashBoard/ProfileWeb",
    };
    
    if (navigationMap[item]) {
      router.push(navigationMap[item]);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || !teacherEmail || !authToken) return;

    const recipientEmail = selectedContact.email;
    const text = messageInput.trim();
    const tempId = `temp_${Date.now()}`;
    const now = new Date();

    // OPTIMISTIC UPDATE: Add message to chat immediately
    const optimisticMessage: Message = {
      id: tempId,
      text: text,
      sender: 'me',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      read: false,
      pending: true // Mark as pending until confirmed
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    try {
      // Create chatId consistent with student side
      const chatId = [teacherEmail, recipientEmail].sort().join('_');
      
      // Get teacher name for sender
      let senderName = teacherName;
      if (!senderName) {
        senderName = await AsyncStorage.getItem('teacherName') || teacherEmail.split('@')[0];
      }

      // Send via API - same endpoint as student side
      const headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      await axios.post(
        `${BASE_URL}/api/messages/send`,
        {
          sender: teacherEmail,
          recipient: recipientEmail,
          senderName: senderName,
          text: text,
        },
        { headers, timeout: 10000 }
      );

      console.log('✅ Message sent successfully');

      // Update the optimistic message to confirmed
      setMessages(prev =>
        prev.map(msg => msg.id === tempId ? { ...msg, pending: false } : msg)
      );

      // Update contact's last message locally
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.email === recipientEmail
            ? { ...contact, lastMessage: text, lastMessageTime: 'Just now' }
            : contact
        )
      );
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessageInput(text); // Restore the message text
    }
  };

  // Fetch teacher broadcast data
  const fetchTeacherBroadcast = async () => {
    try {
      setBroadcastLoading(true);
      if (!authToken || !teacherEmail) {
        setBroadcastLoading(false);
        return;
      }

      console.log('📢 Fetching teacher broadcast data...');
      
      const headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      const res = await axios.post(
        `${BASE_URL}/api/messages/get_teacher_broadcast`,
        { userEmail: teacherEmail, type: 'teacher' },
        { headers, timeout: 10000 }
      );

      if (res.data.teacherBroadcastData) {
        // Normalize data to handle both camelCase and lowercase property names from API
        const normalizedData = res.data.teacherBroadcastData.map((item: any) => ({
          ...item,
          // Ensure consistent property names (lowercase)
          classname: item.classname || item.className || '',
          subject: item.subject || item.Subject || '',
          studentemail: item.studentemail || item.studentEmail || '',
          studentname: item.studentname || item.studentName || '',
          teacheremail: item.teacheremail || item.teacherEmail || '',
          teachername: item.teachername || item.teacherName || '',
        }));
        setTeacherBroadcastData(normalizedData);
        console.log(`✅ Found ${normalizedData.length} broadcast entries`);
      }
      setBroadcastLoading(false);
    } catch (e) {
      console.error('Error fetching teacher broadcast:', e);
      setBroadcastLoading(false);
      // Don't show alert for broadcast errors as it's not critical
    }
  };

  // Fetch broadcast message list for teacher
  const fetchBroadcastMessageList = async () => {
    try {
      setBroadcastMessagesLoading(true);
      if (!authToken || !teacherEmail) {
        setBroadcastMessagesLoading(false);
        return;
      }

      console.log('📜 Fetching broadcast message list...');
      
      const headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      const resp = await axios.post(
        `${BASE_URL}/api/broadcast-message-list`,
        { userEmail: teacherEmail, userType: 'teacher' },
        { headers, timeout: 10000 }
      );
      setTeacherBroadcastMessages(resp.data.teacherBroadcastData || []);
      console.log(`✅ Found ${resp.data.teacherBroadcastData?.length || 0} broadcast messages`);
      setBroadcastMessagesLoading(false);
    } catch (e) {
      console.error('Error fetching broadcast message list:', e);
      setBroadcastMessagesLoading(false);
    }
  };

  // Load broadcast messages for a specific class-subject group with polling
  const loadBroadcastMessages = async (className: string, subject: string) => {
    if (!teacherEmail || !authToken) return;

    // Clear any existing broadcast poll interval
    if (broadcastPollIntervalRef.current) {
      clearInterval(broadcastPollIntervalRef.current);
      broadcastPollIntervalRef.current = null;
    }

    const fetchBroadcasts = async () => {
      try {
        setBroadcastMessagesLoading(true);
        
        const headers = {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        };

        const resp = await axios.post(
          `${BASE_URL}/api/broadcast-message-list`,
          { userEmail: teacherEmail, userType: 'teacher' },
          { headers, timeout: 10000 }
        );
        
        if (resp.data.teacherBroadcastData) {
          // Filter messages for the selected class/subject and format them
          const filteredMessages = resp.data.teacherBroadcastData
            .filter((msg: any) => {
              const msgClassName = msg.classname || msg.className || '';
              const msgSubject = msg.subject || msg.Subject || '';
              return msgClassName === className && msgSubject === subject;
            })
            .map((msg: any) => ({
              id: msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`,
              text: msg.text || msg.message || msg.content || '',
              classname: msg.classname || msg.className || className,
              subject: msg.subject || msg.Subject || subject,
              time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              sender: msg.sender || msg.teacherEmail || teacherEmail,
              teacherName: msg.teacherName || teacherName || 'Teacher',
              pending: false
            }));
          
          setTeacherBroadcastMessages(filteredMessages);
          console.log(`✅ Loaded ${filteredMessages.length} broadcast messages for ${className} - ${subject}`);
        }
      } catch (e) {
        console.error('Error fetching broadcast messages:', e);
      } finally {
        setBroadcastMessagesLoading(false);
      }
    };

    // Fetch immediately
    await fetchBroadcasts();

    // Set up polling every 5 seconds
    broadcastPollIntervalRef.current = setInterval(fetchBroadcasts, 5000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (broadcastPollIntervalRef.current) {
        clearInterval(broadcastPollIntervalRef.current);
        broadcastPollIntervalRef.current = null;
      }
    };
  }, []);

  // Handle broadcast selection
  const handleBroadcastSelect = (broadcastItem: any) => {
    setSelectedBroadcast(broadcastItem);
    
    // Load broadcast messages for this class-subject with polling
    const className = broadcastItem.classname || broadcastItem.className;
    const subject = broadcastItem.subject || broadcastItem.Subject;
    
    if (className && subject) {
      loadBroadcastMessages(className, subject);
    }
  };

  // ScrollView refs for auto-scrolling to bottom
  const broadcastScrollViewRef = useRef<ScrollView>(null);
  const messagesScrollViewRef = useRef<ScrollView>(null);
  
  // Ref for broadcast message polling interval cleanup
  const broadcastPollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messagesScrollViewRef.current) {
      setTimeout(() => {
        messagesScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Auto-scroll to bottom when broadcast messages change
  useEffect(() => {
    if (teacherBroadcastMessages.length > 0 && broadcastScrollViewRef.current) {
      setTimeout(() => {
        broadcastScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [teacherBroadcastMessages]);

  // Handle sending broadcast message
  const handleSendBroadcast = async () => {
    if (!messageInput.trim() || !selectedBroadcast || !teacherEmail || !authToken) {
      if (!authToken) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
      }
      return;
    }

    const text = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Get student emails and names for this class/subject
    const emails: string[] = [];
    const names: string[] = [];
    
    // Helper to get property with fallback (handles both camelCase and lowercase)
    const getProp = (obj: any, ...keys: string[]) => {
      for (const key of keys) {
        if (obj[key] !== undefined) return obj[key];
      }
      return undefined;
    };
    
    // Get selected broadcast properties with fallbacks
    const selectedClassName = getProp(selectedBroadcast, 'classname', 'className');
    const selectedSubject = getProp(selectedBroadcast, 'subject', 'subject');
    
    if (!selectedClassName || !selectedSubject) {
      Alert.alert('Error', 'Invalid broadcast group selected');
      return;
    }
    
    teacherBroadcastData.forEach((item: any) => {
      const itemClassName = getProp(item, 'classname', 'className');
      const itemSubject = getProp(item, 'subject', 'subject');
      
      if (itemClassName === selectedClassName && itemSubject === selectedSubject) {
        const studentEmail = getProp(item, 'studentemail', 'studentEmail');
        const studentName = getProp(item, 'studentname', 'studentName');
        if (studentEmail) emails.push(studentEmail);
        if (studentName) names.push(studentName);
      }
    });

    if (emails.length === 0) {
      Alert.alert('Error', 'No students found for this broadcast group');
      return;
    }

    // Optimistically add message to UI immediately
    const optimisticMessage = {
      id: tempId,
      text: text,
      classname: selectedBroadcast.classname,
      subject: selectedBroadcast.subject,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(),
      sender: teacherEmail,
      teacherName: teacherName || teacherEmail.split('@')[0],
      pending: true
    };
    
    setTeacherBroadcastMessages(prev => [optimisticMessage, ...prev]);
    setMessageInput('');
    
    // Scroll to bottom after a short delay
    setTimeout(() => {
      broadcastScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      const params = {
        userType: 'teacher',
        teacherEmail: teacherEmail,
        className: selectedBroadcast.classname,
        subject: selectedBroadcast.subject,
        studentEmails: emails,
        studentNames: names,
        isBroadcast: true,
        sender: teacherEmail,
        teacherName: teacherName || teacherEmail.split('@')[0],
        text: text,
      };

      await axios.post(
        `${BASE_URL}/api/broadcast-message-list-add`,
        params,
        { headers }
      );

      // Remove pending status from the message
      setTeacherBroadcastMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, pending: false } : m)
      );
    } catch (error) {
      console.error('Error sending broadcast:', error);
      // Remove the optimistic message on error
      setTeacherBroadcastMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Error', 'Failed to send broadcast. Please try again.');
    }
  };

  // Fetch broadcasts when broadcast tab is active
  useEffect(() => {
    if (activeTab === 'broadcast' && teacherEmail) {
      fetchTeacherBroadcast();
    }
  }, [activeTab, teacherEmail]);

  // Fetch booking requests when requests tab becomes active
  useEffect(() => {
    if (activeTab === 'requests' && authToken) {
      fetchBookingRequests(authToken);
    }
  }, [activeTab, authToken]);

  const handleAcceptRequest = async (request: ConnectionRequest) => {
    if (!authToken) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    console.log('📝 Accepting request:', { bookingId: request.id, status: 'accepted', teacherName });

    try {
      // Update local state immediately for responsiveness
      setBookingRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'accepted' } : r)
      );
      setConnectionRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'accepted' } : r)
      );

      // Update via API for persistence
      const requestBody = {
        bookingId: request.id,
        status: 'accepted',
        message: `${teacherName} accepted your request`
      };
      console.log('📤 Sending accept request:', requestBody);
      
      const response = await axios.put(
        `${BASE_URL}/api/bookings/respond`,
        requestBody,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('📥 Accept response:', response.data);

      if (response.data.success) {
        Alert.alert('✅ Request Accepted', `You accepted ${request.studentName}'s request for ${request.subject}`);
      }
    } catch (error: any) {
      console.error('❌ Error accepting request:', error);
      console.error('❌ Error response:', error?.response?.data);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to accept request. Please try again.');
      // Revert state
      fetchBookingRequests(authToken);
    }
  };

  const handleRejectRequest = async (request: ConnectionRequest) => {
    if (!authToken) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    console.log('📝 Rejecting request:', { bookingId: request.id, status: 'rejected' });

    try {
      // Update local state immediately
      setBookingRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r)
      );
      setConnectionRequests(prev => 
        prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r)
      );

      // Update via API
      const rejectBody = {
        bookingId: request.id,
        status: 'rejected',
        message: 'Request declined'
      };
      console.log('📤 Sending reject request:', rejectBody);
      
      const rejectResponse = await axios.put(
        `${BASE_URL}/api/bookings/respond`,
        rejectBody,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      console.log('📥 Reject response:', rejectResponse.data);

      // Remove from list after a delay
      setTimeout(() => {
        setBookingRequests(prev => prev.filter(r => r.id !== request.id));
      }, 2000);

      Alert.alert('Request Declined', `You declined ${request.studentName}'s request`);
    } catch (error: any) {
      console.error('❌ Error rejecting request:', error);
      console.error('❌ Error response:', error?.response?.data);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to decline request. Please try again.');
      fetchBookingRequests(authToken);
    }
  };

  const renderContactItem = (contact: Contact) => {
    const safeName = contact.name || 'Unknown';
    const initials = safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
      <TouchableOpacity
        key={contact.email}
        style={styles.contactItem}
        onPress={() => handleContactSelect(contact)}
      >
        {contact.profilePic ? (
          <Image source={{ uri: contact.profilePic }} style={styles.contactAvatar} />
        ) : (
          <View style={styles.contactAvatarFallback}>
            <Text style={styles.contactAvatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{safeName}</Text>
          <Text style={styles.contactLastMessage} numberOfLines={1}>
            {contact.lastMessage || 'No messages yet'}
          </Text>
        </View>
        <View style={styles.contactMeta}>
          <Text style={styles.contactTime}>{contact.lastMessageTime || 'Just now'}</Text>
          {contact.userType === 'student' && (
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>Student</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageItem,
        message.sender === 'me' ? styles.messageSent : styles.messageReceived
      ]}
    >
      <Text style={[
        styles.messageText,
        message.sender === 'me' ? styles.messageTextSent : styles.messageTextReceived
      ]}>
        {message.text}
      </Text>
      <Text style={[
        styles.messageTime,
        message.sender === 'me' ? styles.messageTimeSent : styles.messageTimeReceived
      ]}>
        {message.time}
      </Text>
    </View>
  );

  const renderConnectionRequest = (request: ConnectionRequest) => (
    <View key={request.id} style={[
      styles.requestItem,
      request.status === 'accepted' && { backgroundColor: '#DCFCE7' },
      request.status === 'rejected' && { backgroundColor: '#FEE2E2' }
    ]}>
      {request.studentProfilePic ? (
        <Image source={{ uri: request.studentProfilePic }} style={styles.requestAvatar} />
      ) : (
        <View style={[styles.requestAvatar, { backgroundColor: '#3B5BFE', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            {request.studentName?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{request.studentName}</Text>
        <Text style={styles.requestEmail}>{request.studentEmail}</Text>
        <Text style={styles.requestSubject}>{request.subject}{request.className ? ` - ${request.className}` : ''}</Text>
        {request.charge && (
          <Text style={[styles.requestStatus, { color: '#3B5BFE', fontWeight: '600' }]}>
            {(() => {
              const chargeStr = String(request.charge);
              // Clean up charge string - remove any existing ₹ and trim
              const cleanCharge = chargeStr.replace(/[₹\s]/g, '').trim();
              // Add ₹ prefix
              return `₹${cleanCharge}`;
            })()}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={[
            styles.statusBadge,
            request.status === 'pending' && { backgroundColor: '#FEF3C7' },
            request.status === 'accepted' && { backgroundColor: '#22C55E' },
            request.status === 'rejected' && { backgroundColor: '#EF4444' }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              request.status === 'pending' && { color: '#92400E' },
              (request.status === 'accepted' || request.status === 'rejected') && { color: '#fff' }
            ]}>
              {request.status.toUpperCase()}
            </Text>
          </View>
          {request.timestamp && (
            <Text style={{ fontSize: 11, color: '#6B7280', marginLeft: 8 }}>
              {new Date(request.timestamp).toLocaleDateString()}
            </Text>
          )}
        </View>
        {request.status === 'accepted' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 4, fontStyle: 'italic' }}>
              Student will complete payment
            </Text>
          </View>
        )}
      </View>
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(request)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(request)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  if (isMobile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textHeader} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect</Text>
          <TouchableOpacity onPress={() => setShowRequestsModal(true)}>
            <Ionicons name="person-add" size={24} color={COLORS.primaryBlue} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
            onPress={() => setActiveTab('chats')}
          >
            <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'broadcast' && styles.activeTab]}
            onPress={() => setActiveTab('broadcast')}
          >
            <Text style={[styles.tabText, activeTab === 'broadcast' && styles.activeTabText]}>
              Broadcast
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'chats' && (
          <View style={styles.chatsContainer}>
            {chatsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.loadingText}>Loading conversations...</Text>
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No conversations yet</Text>
                <Text style={styles.emptySubtext}>Start connecting with your students</Text>
              </View>
            ) : (
              contacts.map(renderContactItem)
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <ScrollView style={styles.requestsContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textDark }}>
                Class Booking Requests
              </Text>
            </View>
            
            {requestsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : bookingRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No pending requests</Text>
                <Text style={[styles.emptySubtext, { marginTop: 8 }]}>
                  When students request to book your classes, they'll appear here in real-time
                </Text>
              </View>
            ) : (
              bookingRequests.map(renderConnectionRequest)
            )}
          </ScrollView>
        )}

        {activeTab === 'broadcast' && (
          <View style={styles.broadcastContainer}>
            {selectedBroadcast ? (
              // Show broadcast chat interface
              <View style={styles.broadcastChatContainer}>
                <View style={styles.broadcastChatHeader}>
                  <TouchableOpacity onPress={() => setSelectedBroadcast(null)}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textHeader} />
                  </TouchableOpacity>
                  <Text style={styles.broadcastChatTitle}>
                    {selectedBroadcast.classname} - {selectedBroadcast.subject}
                  </Text>
                  <View style={{ width: 24 }} />
                </View>
                
                <ScrollView style={styles.broadcastMessages}>
                  {broadcastMessagesLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                      <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                  ) : teacherBroadcastMessages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No messages yet</Text>
                      <Text style={styles.emptySubtext}>
                        Send a broadcast to your students
                      </Text>
                    </View>
                  ) : (
                    teacherBroadcastMessages.map((msg: any, idx: number) => (
                      <View key={msg.id || idx} style={styles.broadcastMessageItem}>
                        <View style={[
                          styles.broadcastMessageBubble,
                          msg.pending && { opacity: 0.7 }
                        ]}>
                          <Text style={styles.broadcastMessageText}>{msg.text}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={styles.broadcastMessageTime}>{msg.time}</Text>
                            {msg.pending && (
                              <ActivityIndicator size="small" color={COLORS.textMuted} style={{ marginLeft: 8 }} />
                            )}
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.broadcastInputContainer}>
                  <TextInput
                    style={styles.broadcastMessageInput}
                    placeholder="Type broadcast message..."
                    multiline
                    value={messageInput}
                    onChangeText={setMessageInput}
                  />
                  <TouchableOpacity 
                    style={styles.broadcastSendButton}
                    onPress={handleSendBroadcast}
                  >
                    <Ionicons name="send" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Show broadcast groups list
              <View style={styles.broadcastGroupsContainer}>
                <Text style={styles.broadcastSectionTitle}>Select Class to Broadcast</Text>
                {teacherBroadcastData.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="megaphone-outline" size={64} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No broadcast groups</Text>
                    <Text style={styles.emptySubtext}>
                      Your broadcast groups will appear here
                    </Text>
                  </View>
                ) : (
                  // Group by classname-subject combination
                  Array.from(new Map(teacherBroadcastData.map((item: any) => 
                    [`${item.classname}-${item.subject}`, item]
                  )).values()).map((group: any, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.broadcastGroupItem}
                      onPress={() => handleBroadcastSelect(group)}
                    >
                      <View style={styles.broadcastGroupIcon}>
                        <Ionicons name="megaphone" size={24} color={COLORS.white} />
                      </View>
                      <View style={styles.broadcastGroupInfo}>
                        <Text style={styles.broadcastGroupName}>
                          {group.classname} - {group.subject}
                        </Text>
                        <Text style={styles.broadcastGroupCount}>
                          {teacherBroadcastData.filter((s: any) => 
                            s.classname === group.classname && s.subject === group.subject
                          ).length} students
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        <Modal
          visible={showRequestsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRequestsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Connection Requests</Text>
                <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textHeader} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {connectionRequests.length === 0 ? (
                  <Text style={styles.noRequestsText}>No pending requests</Text>
                ) : (
                  connectionRequests.map(renderConnectionRequest)
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header at top level like TutorDashboardWeb */}
      <TeacherWebHeader />
      
      <View style={styles.contentLayout}>
        {/* Sidebar */}
        <TeacherWebSidebar 
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={teacherEmail}
          subjectCount={0}
          studentCount={contacts.length}
          revenue="₹12.5K"
          isSpotlight={true}
        />
        
        {/* Main Content */}
        <View style={styles.mainWrapper}>
          <View style={styles.contentColumns}>
            {/* CENTER: Chat Content */}
            <View style={styles.centerContent}>
              {/* LEFT: Chat List */}
              <View style={styles.chatListPanel}>
              <View style={styles.chatListHeader}>
                <View style={styles.pageHeader}>
                  <TouchableOpacity style={styles.backBtnCircle} onPress={handleBackPress}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                  </TouchableOpacity>
                  <Text style={styles.chatListTitle}>Messages</Text>
                </View>
              </View>
              
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
                  onPress={() => setActiveTab('chats')}
                >
                  <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
                    Chats
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                  onPress={() => setActiveTab('requests')}
                >
                  <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                    Requests
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'broadcast' && styles.activeTab]}
                  onPress={() => setActiveTab('broadcast')}
                >
                  <Text style={[styles.tabText, activeTab === 'broadcast' && styles.activeTabText]}>
                    Broadcast
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'chats' && (
                <ScrollView style={styles.chatList}>
                  {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                  ) : contacts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
                      <Text style={styles.emptyText}>No conversations yet</Text>
                      <Text style={styles.emptySubtext}>Start connecting with your students</Text>
                    </View>
                  ) : (
                    contacts.map(renderContactItem)
                  )}
                </ScrollView>
              )}

              {activeTab === 'requests' && (
                <ScrollView style={styles.chatList}>
                  {connectionRequests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="person-add-outline" size={64} color={COLORS.textMuted} />
                      <Text style={styles.emptyText}>No pending requests</Text>
                    </View>
                  ) : (
                    connectionRequests.map(renderConnectionRequest)
                  )}
                </ScrollView>
              )}

              {activeTab === 'broadcast' && (
                <ScrollView style={styles.chatList}>
                  <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.textHeader, marginBottom: 16, fontFamily: 'Poppins_600SemiBold' }}>
                      Select Class to Broadcast
                    </Text>
                    {broadcastLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                        <Text style={styles.loadingText}>Loading broadcast groups...</Text>
                      </View>
                    ) : teacherBroadcastData.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="megaphone-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>No broadcast groups</Text>
                        <Text style={styles.emptySubtext}>
                          Your broadcast groups will appear here
                        </Text>
                      </View>
                    ) : (
                      // Group by classname-subject combination
                      Array.from(new Map(teacherBroadcastData.map((item: any) => 
                        [`${item.classname}-${item.subject}`, item]
                      )).values()).map((group: any, idx: number) => (
                        <TouchableOpacity
                          key={idx}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 16,
                            backgroundColor: selectedBroadcast?.classname === group.classname && selectedBroadcast?.subject === group.subject ? '#EEF2FF' : COLORS.white,
                            borderRadius: 12,
                            marginBottom: 12,
                            borderWidth: selectedBroadcast?.classname === group.classname && selectedBroadcast?.subject === group.subject ? 2 : 0,
                            borderColor: COLORS.primaryBlue,
                          }}
                          onPress={() => handleBroadcastSelect(group)}
                        >
                          <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: COLORS.primaryBlue,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 12,
                          }}>
                            <Ionicons name="megaphone" size={24} color={COLORS.white} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textHeader, fontFamily: 'Poppins_600SemiBold' }}>
                              {group.classname} - {group.subject}
                            </Text>
                            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4, fontFamily: 'Poppins_400Regular' }}>
                              {teacherBroadcastData.filter((s: any) => 
                                s.classname === group.classname && s.subject === group.subject
                              ).length} students
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* CENTER: Chat Window */}
            <View style={styles.chatWindowPanel}>
              {activeTab === 'broadcast' && selectedBroadcast ? (
                // Broadcast Chat Window
                <View style={styles.chatWindow}>
                  {/* Broadcast Chat Header */}
                  <View style={styles.chatHeader}>
                    <View style={styles.chatHeaderLeft}>
                      <View style={[styles.chatAvatarFallback, { backgroundColor: COLORS.primaryBlue }]}>
                        <Ionicons name="megaphone" size={20} color={COLORS.white} />
                      </View>
                      <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderName}>
                          {selectedBroadcast.classname} - {selectedBroadcast.subject}
                        </Text>
                        <Text style={styles.chatHeaderStatus}>Broadcast Group</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedBroadcast(null)}>
                      <Ionicons name="close" size={24} color={COLORS.textHeader} />
                    </TouchableOpacity>
                  </View>

                  {/* Broadcast Messages Area */}
                  <ScrollView 
                    ref={broadcastScrollViewRef}
                    style={styles.messagesArea}
                    contentContainerStyle={{ paddingVertical: 16 }}
                  >
                    {broadcastMessagesLoading ? (
                      <View style={styles.chatEmptyContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                        <Text style={styles.chatEmptyText}>Loading broadcast messages...</Text>
                      </View>
                    ) : teacherBroadcastMessages.length === 0 ? (
                      <View style={styles.chatEmptyContainer}>
                        <Text style={styles.chatEmptyText}>
                          Send a broadcast message to {selectedBroadcast.classname} - {selectedBroadcast.subject}
                        </Text>
                      </View>
                    ) : (
                      teacherBroadcastMessages.map((msg: any, idx: number) => (
                        <View key={msg.id || idx} style={[styles.messageItem, { alignSelf: 'flex-start', maxWidth: '80%' }]}>
                          <View style={[
                            styles.receivedMessage, 
                            { backgroundColor: COLORS.primaryBlue },
                            msg.pending && { opacity: 0.7 }
                          ]}>
                            <Text style={[styles.receivedMessageText, { color: COLORS.white }]}>{msg.text}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <Text style={[styles.receivedMessageTime, { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
                              {msg.pending && (
                                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
                              )}
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>

                  {/* Broadcast Input */}
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type broadcast message..."
                      value={messageInput}
                      onChangeText={setMessageInput}
                      multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendBroadcast}>
                      <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : selectedContact ? (
                // Regular Chat Window
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
                        <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
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
                    ) : messages.length === 0 ? (
                      <View style={styles.chatEmptyContainer}>
                        <Text style={styles.chatEmptyText}>Start a conversation with {selectedContact.name}</Text>
                      </View>
                    ) : (
                      messages.map(renderMessage)
                    )}
                  </ScrollView>

                  {/* Message Input */}
                  <View style={styles.messageInputContainer}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Type a message..."
                      value={messageInput}
                      onChangeText={setMessageInput}
                      multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                      <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.chatEmptyState}>
                  <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                  <Text style={styles.chatEmptyTitle}>
                    {activeTab === 'broadcast' ? 'Select a broadcast group' : 'Select a conversation'}
                  </Text>
                  <Text style={styles.chatEmptySubtitle}>
                    {activeTab === 'broadcast' 
                      ? 'Choose a class to send broadcast messages' 
                      : 'Choose a contact from the list to start chatting'}
                  </Text>
                </View>
              )}
            </View>
            </View>

            {/* RIGHT PANEL: Thoughts */}
            {showThoughtsPanel && (
              <View style={styles.rightPanel}>
                <TeacherThoughtsCard
                  posts={posts}
                  postsLoading={postsLoading}
                  userProfileCache={userProfileCache}
                  currentUserEmail={teacherEmail}
                  getProfileImageSource={getProfileImageSource}
                  initials={initials}
                  resolvePostAuthor={resolvePostAuthor}
                  handleCreatePost={handleCreatePost}
                  handleDeletePost={handleDeletePost}
                  handleLike={handleLike}
                  setPosts={setPosts}
                  onComment={openCommentsModal}
                  isMobile={isMobile}
                  showThoughtsPanel={showThoughtsPanel}
                  isThoughtsCollapsed={isThoughtsCollapsed}
                  setIsThoughtsCollapsed={setIsThoughtsCollapsed}
                  showTooltip={showThoughtsTooltip}
                  setShowTooltip={setShowThoughtsTooltip}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <Modal
        visible={showRequestsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connection Requests</Text>
              <TouchableOpacity onPress={() => setShowRequestsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textHeader} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {connectionRequests.length === 0 ? (
                <Text style={styles.noRequestsText}>No pending requests</Text>
              ) : (
                connectionRequests.map(renderConnectionRequest)
              )}
            </ScrollView>
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
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
  chatsContainer: {
    flex: 1,
    padding: 16,
  },
  requestsContainer: {
    flex: 1,
    padding: 16,
  },
  broadcastContainer: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
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
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  userTypeBadge: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  userTypeText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  requestEmail: {
    fontSize: 14,
    color: COLORS.textBody,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  requestSubject: {
    fontSize: 14,
    color: COLORS.primaryBlue,
    marginTop: 4,
    fontFamily: 'Poppins_500Medium',
    fontWeight: '500',
  },
  requestStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  requestActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  broadcastForm: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
  },
  broadcastTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginBottom: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  broadcastInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Poppins_400Regular',
  },
  broadcastButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  broadcastButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  noRequestsText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  chatListPanel: {
    flex: 1,
    maxWidth: 400,
    backgroundColor: COLORS.chatListBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  backBtnCircle: {
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
  chatList: {
    flex: 1,
  },
  thoughtsPanel: {
    flex: 1,
  },
  thoughtsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginBottom: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  // TutorDashboardWeb Right Panel Styles
  rightPanelTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primaryBlue,
    marginBottom: 24,
    textAlign: 'right',
  },
  thoughtsList: {
    paddingBottom: 40,
  },
  mobileThoughtsPanel: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  thoughtsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  // Message styles (for component usage)
  messageText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  messageSent: {
    alignSelf: 'flex-end',
  },
  messageReceived: {
    alignSelf: 'flex-start',
  },
  messageTextSent: {
    backgroundColor: COLORS.primaryBlue,
    color: '#fff',
    fontSize: 14,
    padding: 12,
    borderRadius: 16,
    fontFamily: 'Poppins_400Regular',
  },
  messageTextReceived: {
    backgroundColor: COLORS.receivedBubble,
    color: COLORS.textHeader,
    fontSize: 14,
    padding: 12,
    borderRadius: 16,
    fontFamily: 'Poppins_400Regular',
  },
  messageTimeSent: {
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  messageTimeReceived: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  // Chat styles
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
  sentMessageText: {
    color: COLORS.white,
  },
  receivedMessageText: {
    color: COLORS.textHeader,
  },
  sentMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  receivedMessageTime: {
    color: COLORS.textMuted,
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
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contactAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
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
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textMuted,
    marginTop: 10,
  },

  // ── Right panel (desktop) ─────────────────────────────────────────────────
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
    rightPanelCollapsed: {
      width: 52,
      paddingHorizontal: 8,
    },
    rightPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    rightPanelTitleContainer: {
      flex: 1,
    },
    rightPanelTitle: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: COLORS.textDark,
    },
    collapseBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
  
    // ── Mobile thoughts panel (vertical line that expands) ───────────────────
    mobileThoughtsContainer: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    },
    mobileThoughtsLine: {
      width: 52,
      height: '100%',
      backgroundColor: '#FAFBFC',
      borderLeftWidth: 1,
      borderLeftColor: COLORS.border,
      alignItems: 'center',
      paddingTop: 24,
    },
    mobileThoughtsLineInner: {
      width: 4,
      height: 60,
      backgroundColor: '#3B5BFE',
      borderRadius: 2,
    },
    mobileThoughtsExpanded: {
      width: 320,
      height: '100%',
      backgroundColor: '#FAFBFC',
      borderLeftWidth: 1,
      borderLeftColor: COLORS.border,
      flexDirection: 'column',
    },
    mobileThoughtsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    mobileThoughtsTitle: {
      fontSize: 18,
      fontFamily: 'Poppins_600SemiBold',
      color: COLORS.textDark,
    },
    mobileThoughtsClose: {
      padding: 6,
      borderRadius: 8,
    },
    mobileThoughtsComposer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    mobileThoughtsScroll: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
  
    // ── Thoughts feed ─────────────────────────────────────────────────────────
    composerWrapper: {
      marginBottom: 16,
    },
    thoughtsScrollView: {
      flex: 1,
    },
    thoughtsList: {
      paddingBottom: 24,
      gap: 8,
    },
    postWrapper: {
      marginBottom: 4,
    },
    thoughtsLoadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    thoughtsLoadingText: {
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
      color: COLORS.textSecondary,
      marginTop: 10,
      textAlign: 'center',
    },
    emptyState: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontFamily: 'Poppins_500Medium',
      color: COLORS.textDark,
      marginTop: 14,
      marginBottom: 6,
    },
    emptyStateText: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      color: COLORS.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    // ── Booking Request styles ─────────────────────────────────────────────────
    requestSubject: {
      fontSize: 13,
      fontFamily: 'Poppins_500Medium',
      color: COLORS.primaryBlue,
      marginTop: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusBadgeText: {
      fontSize: 10,
      fontFamily: 'Poppins_600SemiBold',
    },
    // ── Broadcast styles ─────────────────────────────────────────────────
    broadcastGroupsContainer: {
      flex: 1,
      padding: 16,
    },
    broadcastSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: COLORS.textHeader,
      marginBottom: 16,
      fontFamily: 'Poppins_600SemiBold',
    },
    broadcastGroupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: COLORS.white,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    broadcastGroupIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: COLORS.primaryBlue,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    broadcastGroupInfo: {
      flex: 1,
    },
    broadcastGroupName: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.textHeader,
      fontFamily: 'Poppins_600SemiBold',
    },
    broadcastGroupCount: {
      fontSize: 14,
      color: COLORS.textSecondary,
      marginTop: 4,
      fontFamily: 'Poppins_400Regular',
    },
    broadcastChatContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    broadcastChatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    broadcastChatTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.textHeader,
      fontFamily: 'Poppins_600SemiBold',
    },
    broadcastMessages: {
      flex: 1,
      padding: 16,
    },
    broadcastMessageItem: {
      marginBottom: 12,
      maxWidth: '80%',
      alignSelf: 'flex-start',
    },
    broadcastMessageBubble: {
      backgroundColor: COLORS.primaryBlue,
      padding: 12,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
    },
    broadcastMessageText: {
      color: COLORS.white,
      fontSize: 14,
      fontFamily: 'Poppins_400Regular',
    },
    broadcastMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 10,
      marginTop: 4,
      fontFamily: 'Poppins_400Regular',
    },
    broadcastInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      gap: 12,
    },
    broadcastMessageInput: {
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
    broadcastSendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: COLORS.primaryBlue,
      justifyContent: 'center',
      alignItems: 'center',
    },
});
