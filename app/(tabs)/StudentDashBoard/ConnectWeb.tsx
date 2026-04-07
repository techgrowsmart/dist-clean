import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import ThoughtsCard from './ThoughtsCard';

// Global Design Tokens from ConnectScreen
const COLORS = {
  background: '#F7F9FC',
  sidebarBg: '#FFFFFF',
  chatListBg: '#FFFFFF',
  chatWindowBg: '#F8FAFC',
  feedBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  activeNavBg: '#EEF2FF',
  softGreen: '#D1FAE5',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#EEF2F6',
  receivedBubble: '#F3F4F6',
  sentBubble: '#E5E7EB',
  white: '#FFFFFF',
  unreadDot: '#2563EB',
  onlineGreen: '#10B981',
};

// Minimal mock data
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

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

interface ConnectionRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  studentProfilePic: string;
  teacherEmail: string;
  status: string;
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

  const [windowSize, setWindowSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherBroadcastData, setTeacherBroadcastData] = useState<any[]>([]);
  const [teacherBroadcastMessages, setTeacherBroadcastMessages] = useState<any[]>([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [messageInput, setMessageInput] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Teachers' | 'Broadcast'>('Teachers');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [userType, setUserType] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Connect");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  
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

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowSize({ width: window.width, height: window.height });
    });
    return () => subscription.remove();
  }, []);

  const isDesktop = windowSize.width >= 1200;

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

  // Load user info
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
      } catch (error) {
        console.error("❌ Error loading user info:", error);
      }
    };

    loadUserInfo();
  }, []);

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

  // ── Posts / Thoughts helpers ──
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
    let name = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
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
        const postsWithComments = await Promise.all(res.data.data.map(async (post: any) => {
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

  // ── Chat API Functions ──
  const fetchContacts = async () => {
    if (!userEmail) {
      console.warn("Cannot fetch contacts: userEmail is null");
      return;
    }
  
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      
      if (!token) {
        console.error("No authentication token found");
        Alert.alert("Authentication Error", "Please log in again");
        return;
      }
 
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
  
      const type = userType === "teacher" ? "teacher" : "student";
  
      console.log("Fetching contacts for:", userEmail);
      const res = await axios.post(
        `${BASE_URL}/api/contacts`,
        { userEmail, type },
        { headers, timeout: 10000 }
      );
  
      if (res.data.success) {
        const data = res.data.contacts.map((contact: any) => ({
          name: contact.teacherName || contact.studentName || 'Unknown User',
          profilePic:  contact.teacherProfilePic || contact.studentProfilePic || contact.profilePic || "",
          email: contact.teacherEmail || contact.studentEmail,
          lastMessage: contact.lastMessage,
          lastMessageTime: contact.lastMessageTime,
        }));
  
        console.log("Successfully fetched", data.length, "contacts");
        setContacts(data);
      } else {
        const errorMsg = res.data.message || "Could not fetch contacts";
        console.error("API Error:", errorMsg);
        Alert.alert("Failed", errorMsg);
      }
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      
      if (error.code === 'ECONNABORTED') {
        Alert.alert("Network Error", "Request timed out. Please check your connection.");
      } else if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        Alert.alert("Permission Error", "You don't have permission to access contacts.");
      } else if (error.response?.status >= 500) {
        Alert.alert("Server Error", "Something went wrong on our end. Please try again later.");
      } else {
        Alert.alert("Error", "Failed to fetch contacts. Please check your internet connection.");
      }
    }
  };

  const fetchBroadcasts = async () => {
    if (!userEmail) return;

    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      
      const token = auth.token;
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const requestBody = userType === "teacher" ? { userEmail } : { studentEmail: userEmail };

      const res = await axios.post(
        `${BASE_URL}/api/broadcasts`,
        requestBody,
        { 
          headers,
          timeout: 10000
        }
      );

      if (res.data && res.data.broadcasts) {
        const broadcasts = res.data.broadcasts;
        const contactMap = new Map();
        
        broadcasts.forEach((b) => {
          const email = b.teacherEmail;
          const name = b.teacherName || "Teacher";
          const proile = b.teacherProfilePic;
         
          if (!contactMap.has(email)) {
            contactMap.set(email, {
              email,
              name,
              profilePic: proile,
              lastMessage: b.topic,
              lastMessageTime: new Date(b.timestamp._seconds * 1000).toLocaleTimeString(),
            });
          }
        });

        const contactList = Array.from(contactMap.values());
        setContacts((prevContacts) => {
          const mergedMap = new Map<string, Contact>();

          prevContacts.forEach((contact) => mergedMap.set(contact.email, contact));
          contactList.forEach((contact) => {
            if (!mergedMap.has(contact.email)) {
              mergedMap.set(contact.email, contact);
            } else {
              const existing = mergedMap.get(contact.email)!;
              mergedMap.set(contact.email, {
                ...existing,
                lastMessage: contact.lastMessage || existing.lastMessage,
                lastMessageTime: contact.lastMessageTime || existing.lastMessageTime,
              });
            }
          });

          return Array.from(mergedMap.values());
        });
      }
    } catch (err) {
      console.log("Broadcast fetch error (silent):", err);
    }
  };

  const sendMessage = async (contactName: string, message: { text: string }, broadcastMetadata?: any) => {
    if (!userEmail || !message.text.trim()) {
      console.warn("Cannot send message: missing user email or message text");
      Alert.alert("Error", "Message or user email is missing.");
      return;
    }

    try {
      const auth = await getAuthData();
      const token = auth?.token;
      
      if (!token) {
        console.error("No authentication token found for sending message");
        Alert.alert("Authentication Error", "Please log in again");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // Broadcast Mode for teachers
      if (activeTab === "Broadcast" && userType === "teacher" && broadcastMetadata) {
        try {
          const params = {
            userType,
            teacherEmail: broadcastMetadata.teacheremail,
            className: broadcastMetadata.classname,
            subject: broadcastMetadata.subject,
            studentEmails: broadcastMetadata.emails,
            studentNames: broadcastMetadata.names,
            isBroadcast: true,
            sender: broadcastMetadata.teacheremail,
            teacherName: broadcastMetadata.teachername,
            text: broadcastMetadata.message
          };

          await axios.post(`${BASE_URL}/api/broadcast-message-list-add`, params, { headers, timeout: 10000 });
          console.log("Broadcast message sent successfully");
        } catch (error) {
          console.error("❌ Broadcast send error:", error);
          Alert.alert("Error", "Something went wrong while sending broadcast");
        }
      } else {
        // Direct message mode
        const recipientEmail = contacts.find((c) => c.name === contactName)?.email;
        if (!recipientEmail) {
          console.error("Recipient not found for contact:", contactName);
          Alert.alert("Error", "Recipient not found.");
          return;
        }

        const authData = await getAuthData();
        const role = authData?.role;
        let senderName;
        
        if (role === "teacher") {
          senderName = await AsyncStorage.getItem("teacherName");
        } else {
          senderName = await AsyncStorage.getItem("studentName");
        }

        console.log("Sending message from", userEmail, "to", recipientEmail);
        const res = await axios.post(
          `${BASE_URL}/api/send`,
          {
            sender: userEmail,
            senderName: senderName || 'User',
            recipient: recipientEmail,
            text: message.text.trim(),
            isBroadcast: false,
          },
          { headers, timeout: 10000 }
        );

        if (res.status >= 200 && res.status < 300) {
          const newMessage: Message = {
            id: new Date().toISOString(),
            text: message.text.trim(),
            sender: "me",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: new Date(),
          };

          setMessages((prevMessages) => ({
            ...prevMessages,
            [contactName]: [...(prevMessages[contactName] || []), newMessage],
          }));

          setContacts((prevContacts) =>
            prevContacts.map((contact) =>
              contact.name === contactName 
                ? { ...contact, lastMessage: message.text.trim(), lastMessageTime: newMessage.time }
                : contact
            )
          );
          
          console.log("Message sent successfully");
        } else {
          console.error("❌ Direct Message Error:", res.data);
          Alert.alert("Error", res.data.message || "Failed to send message");
        }
      }
    } catch (error: any) {
      console.error("❌ Message Error:", error);
      
      if (error.code === 'ECONNABORTED') {
        Alert.alert("Network Error", "Request timed out. Please check your connection.");
      } else if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        Alert.alert("Permission Error", "You don't have permission to send messages.");
      } else if (error.response?.status >= 500) {
        Alert.alert("Server Error", "Something went wrong on our end. Please try again later.");
      } else {
        Alert.alert("Error", "Failed to send message. Please check your internet connection.");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(selectedContact.name, { text: messageInput });
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

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

  // Fetch contacts when userEmail is loaded
  useEffect(() => {
    if (userEmail) {
      fetchContacts();
    }
  }, [userEmail]);

  // Fetch broadcasts when activeTab changes to broadcast
  useEffect(() => {
    if (activeTab === 'Broadcast' && userEmail) {
      fetchBroadcasts();
    }
  }, [activeTab, userEmail]);

  // Firebase real-time messaging
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
        const isBroadcast = data.isBroadcast || false;
        const isMe = data.sender === userEmail;
        const isRecipient = data.recipient === userEmail;

        const shouldInclude = (activeTab === "Broadcast" && isBroadcast) || (activeTab === "Teachers" && !isBroadcast);
      
        if ((isMe || isRecipient) && shouldInclude) {
          messagesList.push({
            id: doc.id,
            text: data.text,
            sender: isMe ? "me" : "other",
            time: new Date(data.timestamp?.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: data.timestamp?.toDate(),
            isBroadcast: isBroadcast,
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
  }, [selectedContact, userEmail, activeTab]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  // MessageInputBar component with access to state
  const MessageInputBar = () => {
    const [isFocused, setIsFocused] = useState(false);
    return (
       <View style={styles.msgInputWrapper}>
        <View style={[styles.msgInputInner, isFocused && styles.msgInputFocused]}>
          <View style={styles.msgIconsL}>
            <TouchableOpacity style={styles.msgIcon}><Ionicons name="add" size={24} color={COLORS.textMuted} /></TouchableOpacity>
            <TouchableOpacity style={styles.msgIcon}><Ionicons name="image-outline" size={22} color={COLORS.textMuted} /></TouchableOpacity>
            <TouchableOpacity style={styles.msgIcon}><Ionicons name="attach-outline" size={22} color={COLORS.textMuted} /></TouchableOpacity>
          </View>
          <TextInput 
            style={styles.msgTextEntry} 
            placeholder="Aa" 
            placeholderTextColor={COLORS.textMuted} 
            value={messageInput}
            onChangeText={setMessageInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!isSending}
          />
          <View style={styles.msgIconsR}>
            <TouchableOpacity style={styles.msgIcon}><Feather name="smile" size={20} color={COLORS.textMuted} /></TouchableOpacity>
            <TouchableOpacity 
              style={styles.msgSendBtn} 
              onPress={handleSendMessage}
              disabled={isSending || !messageInput.trim() || !selectedContact}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={COLORS.primaryBlue} />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.primaryBlue} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
   );
};

  // For desktop/web, return the desktop layout with WebSidebar, WebHeader, and ConnectScreen UI
  if (isDesktop) {
    // If embedded in the main layout, only render the chat content with ConnectScreen UI
    if (isEmbedded) {
      return (
        <View style={styles.embeddedContent}>
          <View style={styles.contentLayout}>
            {/* Chat List Panel - Left side (from ConnectScreen) */}
            <View style={styles.chatListPanel}>
              <Text style={styles.panelHeader}>Connect</Text>
              <View style={styles.segmentedToggle}>
                <TouchableOpacity 
                  style={[styles.toggleItem, activeTab === 'Teachers' && styles.toggleItemActive]}
                  onPress={() => setActiveTab('Teachers')}
                >
                  <Text style={[styles.toggleText, activeTab === 'Teachers' && styles.toggleTextActive]}>Teachers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleItem, activeTab === 'Broadcast' && styles.toggleItemActive]}
                  onPress={() => setActiveTab('Broadcast')}
                >
                  <Text style={[styles.toggleText, activeTab === 'Broadcast' && styles.toggleTextActive]}>Broadcast</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.chatListScroll}>
                {contacts
                  .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((contact) => (
                    <ChatListItem
                      key={contact.email}
                      name={contact.name}
                      msg={contact.lastMessage || 'No chats, start by saying Hello'}
                      time={contact.lastMessageTime || ''}
                      unread={false}
                      avatar={contact.profilePic || DEFAULT_AVATAR}
                      onPress={() => setSelectedContact(contact)}
                    />
                  ))}
              </ScrollView>
            </View>

            {/* Chat Window - Middle (from ConnectScreen) */}
            <View style={styles.chatWindow}>
              {/* Subtle Pattern Overlay */}
              <View style={styles.patternOverlay} style={{pointerEvents:"none"}} />
              
              <ChatHeader 
                name={selectedContact?.name || ''} 
                avatar={selectedContact?.profilePic || DEFAULT_AVATAR} 
                status="Online now" 
              />
              
              <ScrollView 
                style={styles.messagesArea} 
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedContact ? (
                  messages[selectedContact.name]?.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      text={message.text} 
                      position={message.sender === 'me' ? 'right' : 'left'} 
                    />
                  )) || (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                        No messages yet. Start the conversation!
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                      Select a contact to start chatting
                    </Text>
                  </View>
                )}
                

                              </ScrollView>

              <MessageInputBar />
            </View>

            {/* RIGHT: Thoughts Panel */}
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
                    onReport={(p) => { setReportType('post'); setReportItemId(p.id); setReportReason(''); setShowReportModal(true); }}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      );
    }

    // Full layout for standalone usage with WebSidebar, WebHeader, and ConnectScreen UI
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* WEB HEADER - Full Width */}
        <WebNavbar
          studentName={studentName}
          profileImage={userImage}
        />

        <View style={styles.desktopChatLayout}>
          {/* WebSidebar */}
          <View style={styles.sidebarContainer}>
            <WebSidebar
              activeItem={activeMenu}
              onItemPress={handleSidebarItemPress}
              userEmail={userEmail || ""}
              studentName={studentName || ""}
              profileImage={userImage || null}
            />
          </View>

          {/* Main Content with ConnectScreen UI */}
          <View style={styles.contentLayout}>
            {/* Chat List Panel - Left side (from ConnectScreen) */}
            <View style={styles.chatListPanel}>
              <Text style={styles.panelHeader}>Connect</Text>
              <View style={styles.segmentedToggle}>
                <TouchableOpacity 
                  style={[styles.toggleItem, activeTab === 'Teachers' && styles.toggleItemActive]}
                  onPress={() => setActiveTab('Teachers')}
                >
                  <Text style={[styles.toggleText, activeTab === 'Teachers' && styles.toggleTextActive]}>Teachers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleItem, activeTab === 'Broadcast' && styles.toggleItemActive]}
                  onPress={() => setActiveTab('Broadcast')}
                >
                  <Text style={[styles.toggleText, activeTab === 'Broadcast' && styles.toggleTextActive]}>Broadcast</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.chatListScroll}>
                {contacts
                  .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((contact) => (
                    <ChatListItem
                      key={contact.email}
                      name={contact.name}
                      msg={contact.lastMessage || 'No chats, start by saying Hello'}
                      time={contact.lastMessageTime || ''}
                      unread={false}
                      avatar={contact.profilePic || DEFAULT_AVATAR}
                      onPress={() => setSelectedContact(contact)}
                    />
                  ))}
              </ScrollView>
            </View>

            {/* Chat Window - Middle (from ConnectScreen) */}
            <View style={styles.chatWindow}>
              {/* Subtle Pattern Overlay */}
              <View style={styles.patternOverlay} style={{pointerEvents:"none"}} />
              
              <ChatHeader 
                name={selectedContact?.name || ''} 
                avatar={selectedContact?.profilePic || DEFAULT_AVATAR} 
                status="Online now" 
              />
              
              <ScrollView 
                style={styles.messagesArea} 
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {selectedContact ? (
                  messages[selectedContact.name]?.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      text={message.text} 
                      position={message.sender === 'me' ? 'right' : 'left'} 
                    />
                  )) || (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                        No messages yet. Start the conversation!
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                      Select a contact to start chatting
                    </Text>
                  </View>
                )}
                

                              </ScrollView>

              <MessageInputBar />
            </View>

            {/* RIGHT: Thoughts Panel */}
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
                    onReport={(p) => { setReportType('post'); setReportItemId(p.id); setReportReason(''); setShowReportModal(true); }}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        </SafeAreaView>
    );
  }

  // For mobile/tablet, return the ConnectScreen UI
  return (
    <View style={[styles.container, { height: windowSize.height }]}>
      <View style={styles.contentLayout}>
        {/* Chat List Panel for mobile */}
        <View style={styles.chatListPanel}>
          <Text style={styles.panelHeader}>Connect</Text>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity 
              style={[styles.toggleItem, activeTab === 'Teachers' && styles.toggleItemActive]}
              onPress={() => setActiveTab('Teachers')}
            >
              <Text style={[styles.toggleText, activeTab === 'Teachers' && styles.toggleTextActive]}>Teachers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleItem, activeTab === 'Broadcast' && styles.toggleItemActive]}
              onPress={() => setActiveTab('Broadcast')}
            >
              <Text style={[styles.toggleText, activeTab === 'Broadcast' && styles.toggleTextActive]}>Broadcast</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.chatListScroll}>
            {contacts
              .filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((contact) => (
                <ChatListItem
                  key={contact.email}
                  name={contact.name}
                  msg={contact.lastMessage || 'No chats, start by saying Hello'}
                  time={contact.lastMessageTime || ''}
                  unread={false}
                  avatar={contact.profilePic || DEFAULT_AVATAR}
                  onPress={() => setSelectedContact(contact)}
                />
              ))}
          </ScrollView>
        </View>

        {/* Chat Window for mobile */}
        <View style={styles.chatWindow}>
          <View style={styles.patternOverlay} style={{pointerEvents:"none"}} />
          
          <ChatHeader 
            name={selectedContact?.name || ''} 
            avatar={selectedContact?.profilePic || DEFAULT_AVATAR} 
            status="Online now" 
          />
          
          <ScrollView 
            style={styles.messagesArea} 
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedContact ? (
                  messages[selectedContact.name]?.map((message) => (
                    <ChatBubble 
                      key={message.id} 
                      text={message.text} 
                      position={message.sender === 'me' ? 'right' : 'left'} 
                    />
                  )) || (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                        No messages yet. Start the conversation!
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                      Select a contact to start chatting
                    </Text>
                  </View>
                )}
            
            <View style={{ height: 35 }} />

          </ScrollView>

          <MessageInputBar />
        </View>
      </View>
      
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

// Helper components from ConnectScreen
const ChatListItem = ({ name, msg, time, unread, avatar, online, active, onPress }: any) => (
  <TouchableOpacity style={[styles.chatItem, active && styles.chatItemActive]} onPress={onPress}>
    <View style={styles.chatAvatarWrapper}>
      <Image source={{ uri: avatar }} style={styles.listAvatar} />
      {online && <View style={styles.statusOnline} />}
    </View>
    <View style={styles.chatMain}>
      <View style={styles.chatTop}>
        <Text style={styles.chatName}>{name}</Text>
        {time ? <Text style={styles.chatTime}>{time}</Text> : null}
      </View>
      <Text style={[styles.chatMsgPreview, unread && styles.chatMsgUnread]}>{msg}</Text>
    </View>
    {unread && <View style={styles.blueUnreadDot} />}
  </TouchableOpacity>
);

const ChatHeader = ({ name, avatar, status }: any) => (
  <View style={styles.chatWinHeader}>
    <View style={styles.headerL}>
      <View style={styles.headerAvWrap}>
        <Image source={{ uri: avatar }} style={styles.headerAv} />
        <View style={styles.headerOnDot} />
      </View>
      <View style={styles.headerTxt}>
        <Text style={styles.headerNameTxt}>{name}</Text>
        <Text style={styles.headerStatusTxt}>{status}</Text>
      </View>
    </View>
    <View style={styles.headerR}>
      <TouchableOpacity style={styles.headerCallBtn}><Ionicons name="call-outline" size={20} color={COLORS.textHeader} /></TouchableOpacity>
      <TouchableOpacity style={styles.headerCallBtn}><Ionicons name="videocam-outline" size={20} color={COLORS.textHeader} /></TouchableOpacity>
    </View>
  </View>
);

const ChatBubble = ({ text, position }: any) => (
  <Animated.View 
     entering={position === 'right' ? FadeInRight.delay(100) : FadeInLeft.delay(100)}
     style={[styles.bubbleWrap, position === 'right' ? styles.bubbleR : styles.bubbleL]}
  >
    <View style={[styles.bubbleBox, position === 'right' ? styles.bubbleBoxR : styles.bubbleBoxL]}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  </Animated.View>
);

// Web-only styles (same as MyTuitions.tsx)
const ws = StyleSheet.create({
  // Header
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff', zIndex: 10 },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#4A7BF7', fontFamily: 'Poppins_700Bold', marginRight: 20, minWidth: 110 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 20, paddingHorizontal: 12, height: 36, marginRight: 20 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', fontFamily: 'Poppins_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#dc3545', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', fontFamily: 'Poppins_600SemiBold' },
  headerUsername: { fontSize: 14, color: '#333', marginRight: 12, fontFamily: 'Poppins_500Medium' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
});

const styles = StyleSheet.create({
  // Basic styles
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  embeddedContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  desktopChatLayout: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  sidebarContainer: {
    width: 240,
    minWidth: 200,
    maxWidth: 260,
  },

  // ConnectScreen styles
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    overflow: 'hidden'
  },
  contentLayout: { 
    flex: 1, 
    flexDirection: 'row',
    height: '100%'
  },

  // Chat List Panel (from ConnectScreen)
  chatListPanel: { 
    width: 300, 
    height: '100%',
    backgroundColor: COLORS.chatListBg, 
    borderRightWidth: 1, 
    borderRightColor: COLORS.border 
  },
  panelHeader: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: COLORS.textHeader, padding: 25, paddingBottom: 15 },
  segmentedToggle: { flexDirection: 'row', backgroundColor: COLORS.softGreen, borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 20 },
  toggleItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleItemActive: { backgroundColor: COLORS.primaryBlue },
  toggleText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textHeader },
  toggleTextActive: { color: COLORS.white },
  chatListScroll: { flex: 1 },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', position: 'relative' },
  chatItemActive: { backgroundColor: '#F3F4F6' },
  chatAvatarWrapper: { position: 'relative' },
  listAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0' },
  statusOnline: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.onlineGreen, borderWidth: 2, borderColor: COLORS.white },
  chatMain: { flex: 1, marginLeft: 15 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.textHeader },
  chatTime: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textMuted },
  chatMsgPreview: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textBody },
  chatMsgUnread: { color: COLORS.primaryBlue, fontFamily: 'Poppins_600SemiBold' },
  blueUnreadDot: { position: 'absolute', right: 20, top: '40%', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.unreadDot },

  // Chat Window (from ConnectScreen)
  chatWindow: { 
    flex: 1, 
    height: '100%',
    backgroundColor: COLORS.chatWindowBg, 
    position: 'relative' 
  },
  patternOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.04, backgroundColor: 'transparent' },
  chatWinHeader: { height: 85, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerL: { flexDirection: 'row', alignItems: 'center' },
  headerAvWrap: { position: 'relative' },
  headerAv: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E2E8F0' },
  headerOnDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.onlineGreen, borderWidth: 2, borderColor: COLORS.white },
  headerTxt: { marginLeft: 16 },
  headerNameTxt: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.textHeader },
  headerStatusTxt: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textMuted },
  headerR: { flexDirection: 'row', gap: 16 },
  headerCallBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  messagesArea: { flex: 1 },
  messagesContent: { padding: 30, paddingBottom: 110 },
  dateCenter: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 25 },
  timeCenter: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginBottom: 25, backgroundColor: '#EDF2F7', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  bubbleWrap: { marginBottom: 18, maxWidth: '65%' },
  bubbleL: { alignSelf: 'flex-start' },
  bubbleR: { alignSelf: 'flex-end' },
  bubbleBox: { paddingHorizontal: 22, paddingVertical: 14, borderRadius: 22 },
  bubbleBoxL: { backgroundColor: COLORS.receivedBubble, borderTopLeftRadius: 5 },
  bubbleBoxR: { backgroundColor: COLORS.sentBubble, borderTopRightRadius: 5 },
  bubbleText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textHeader, lineHeight: 22 },
  imageCardContainer: { alignSelf: 'flex-end', width: '65%', height: 260, borderRadius: 24, overflow: 'hidden', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 6 },
  chatImageCard: { width: '100%', height: '100%' },

  // Message Input Bar
  msgInputWrapper: { paddingHorizontal: 30, paddingBottom: 25, position: 'absolute', bottom: 0, left: 0, right: 0 },
  msgInputInner: { height: 64, backgroundColor: COLORS.white, borderRadius: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 12 },
  msgInputFocused: { shadowOpacity: 0.12, shadowRadius: 22, borderColor: COLORS.primaryBlue + '20', borderWidth: 1 },
  msgIconsL: { flexDirection: 'row', gap: 14 },
  msgIconsR: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  msgIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  msgTextEntry: { flex: 1, marginHorizontal: 18, fontFamily: 'Poppins_400Regular', fontSize: 15 },
  msgSendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },

  // Right Panel
  rightPanel: { 
    width: 360, 
    height: '100%',
    backgroundColor: COLORS.feedBg, 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border, 
    position: 'relative' 
  },
  rightPanelTitle: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: COLORS.primaryBlue, padding: 25, paddingBottom: 15, textAlign: 'right' },
  thoughtsList: { paddingBottom: 40 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.textHeader },
  commentsList: { paddingHorizontal: 16, paddingTop: 12 },
  commentItem: { marginBottom: 16, padding: 12, backgroundColor: COLORS.background, borderRadius: 10 },
  commentAuthor: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textHeader, marginBottom: 4 },
  commentContent: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textHeader, lineHeight: 18 },
  commentTime: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  commentInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textHeader, maxHeight: 100 },
  commentSendBtn: { marginLeft: 10, backgroundColor: COLORS.primaryBlue, borderRadius: 20, padding: 10 },
});