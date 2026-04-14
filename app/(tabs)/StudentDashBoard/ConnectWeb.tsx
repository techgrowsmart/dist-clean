import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Animated, {
    FadeInLeft,
    FadeInRight
} from 'react-native-reanimated';
import {
  collection,
  getDocs,
  onSnapshot,
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
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
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

  // Fetch enrolled students from Firebase
  const fetchEnrolledStudents = async (studentEmail: string) => {
    try {
      setLoadingStudents(true);
      
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentEmail", "==", studentEmail)
      );
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrolledTeachers = [];
      
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data();
        
        const teacherDoc = await getDoc(doc(db, "users", enrollmentData.teacherEmail));
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          enrolledTeachers.push({
            id: teacherDoc.id,
            email: teacherData.email,
            name: teacherData.name || teacherData.displayName || 'Unknown Teacher',
            profilePic: teacherData.profilePic || teacherData.photoURL || '',
            role: teacherData.role || 'teacher',
            subject: enrollmentData.subject || 'Subject',
            enrollmentDate: enrollmentData.enrollmentDate,
            lastMessage: '',
            lastMessageTime: '',
            unread: 0
          });
        }
      }
      
      setEnrolledStudents(enrolledTeachers);
      setContacts(enrolledTeachers);
    } catch (error) {
      console.error("❌ Error fetching enrolled students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    
    const chatId = [userEmail, contact.email].sort().join('_');
    setCurrentChatId(chatId);
    
    loadChatMessages(chatId);
  };

  // Load chat messages
  const loadChatMessages = async (chatId: string) => {
    try {
      const messagesQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc")
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChatMessages(messagesData);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("❌ Error loading chat messages:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !currentChatId || !userEmail || !selectedContact) return;
    
    try {
      setIsSending(true);
      
      const messageData = {
        text: messageInput.trim(),
        sender: userEmail,
        receiver: selectedContact?.email,
        timestamp: serverTimestamp(),
        read: false
      };
      
      await addDoc(collection(db, "chats", currentChatId, "messages"), messageData);
      
      const updatedContacts = contacts.map(contact => 
        contact.email === selectedContact?.email 
          ? { ...contact, lastMessage: messageInput.trim(), lastMessageTime: 'Just now' }
          : contact
      );
      setContacts(updatedContacts);
      
      setMessageInput('');
    } catch (error) {
      console.error("❌ Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
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

  // Real-time messaging
  useEffect(() => {
    if (!selectedContact || !userEmail) return;

    const recipientEmail = selectedContact.email;
    if (!recipientEmail) return;

    const chatId = [userEmail, recipientEmail].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    return onSnapshot(q, (querySnapshot) => {
      const messagesList: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isMe = data.sender === userEmail;
        const isRecipient = data.recipient === userEmail;

        if (isMe || isRecipient) {
          messagesList.push({
            id: doc.id,
            text: data.text,
            sender: isMe ? "me" : "other",
            time: new Date(data.timestamp?.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: data.timestamp?.toDate(),
            isBroadcast: data.isBroadcast || false,
          });
        }
      });

      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedContact.name]: messagesList,
      }));
    
      if (messagesList.length > 0) {
        const lastMessage = messagesList[messagesList.length - 1];
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.name === selectedContact.name 
              ? { ...contact, lastMessage: lastMessage.text, lastMessageTime: lastMessage.time }
              : contact
          )
        );
      }
    });
  }, [selectedContact, userEmail]);

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
                      ) : (
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
                                  <Text style={styles.contactName}>{contact.name}</Text>
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
                              <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
                              <Text style={styles.chatHeaderStatus}>Active now</Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => setSelectedContact(null)}>
                            <Ionicons name="close" size={24} color={COLORS.textHeader} />
                          </TouchableOpacity>
                        </View>

                        {/* Messages Area */}
                        <ScrollView style={styles.messagesArea}>
                          {chatMessages.length === 0 ? (
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

                        {/* Message Input */}
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
                    ) : (
                      <View style={styles.chatEmptyState}>
                        <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                        <Text style={styles.chatEmptySubtitle}>Choose a teacher from the list to start chatting</Text>
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
                    ) : (
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
                                <Text style={styles.contactName}>{contact.name}</Text>
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
                            <Text style={styles.chatHeaderName}>{selectedContact.name}</Text>
                            <Text style={styles.chatHeaderStatus}>Active now</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedContact(null)}>
                          <Ionicons name="close" size={24} color={COLORS.textHeader} />
                        </TouchableOpacity>
                      </View>

                      <ScrollView style={styles.messagesArea}>
                        {chatMessages.length === 0 ? (
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
                  ) : (
                    <View style={styles.chatEmptyState}>
                      <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                      <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                      <Text style={styles.chatEmptySubtitle}>Choose a teacher from the list to start chatting</Text>
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
            ) : (
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
                        <Text style={styles.mobileContactName}>{contact.name}</Text>
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
                  <Text style={styles.mobileChatHeaderName}>{selectedContact.name}</Text>
                </View>
              </View>
            </View>

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