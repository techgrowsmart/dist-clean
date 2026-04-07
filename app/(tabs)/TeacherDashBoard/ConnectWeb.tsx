import React, { useState, useEffect } from 'react';
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
import { getAuthData as getAuthDataUtil } from '../../../utils/authStorage';

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

interface Contact {
  name: string;
  profilePic: string;
  lastMessage?: string;
  lastMessageTime?: string;
  email: string;
  userType?: string;
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
  
  // Teacher data
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Teacher Posts Data for Thoughts
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());

  // Chat state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'broadcast'>('chats');

  // Load teacher data and fetch posts
  useEffect(() => {
    const loadTeacherDataAndPosts = async () => {
      try {
        const authData = await getAuthDataUtil();
        if (authData?.token) {
          setAuthToken(authData.token);
          setTeacherName(authData.name || '');
          setTeacherEmail(authData.email || '');
          setProfileImage(authData.profileImage || null);
          await fetchPosts(authData.token);
        }
      } catch (error) {
        console.error('Error loading teacher data:', error);
      }
    };

    loadTeacherDataAndPosts();
  }, []);

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
    let name = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
    
    // Handle email fallback for name
    if (!name || name === 'null' || name.includes('@')) {
      name = post.author?.email?.split('@')[0] || teacherName || 'Unknown Teacher';
      // Clean up the name (remove dots, capitalize)
      name = name.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Handle profile image path
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) {
      pic = `/${pic}`;
    }
    if (pic === '' || pic === 'null') {
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

  // Fetch contacts and messages
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        if (!authToken) {
          setLoading(false);
          return;
        }

        // Fetch real contacts from API
        const response = await axios.get(`${BASE_URL}/api/teacher/contacts`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.contacts) {
          const formattedContacts = response.data.contacts.map((contact: any) => ({
            name: contact.name || contact.studentName || 'Unknown',
            profilePic: contact.profilePic || contact.profile_image || null,
            lastMessage: contact.lastMessage || 'No messages yet',
            lastMessageTime: contact.lastMessageTime || 'Just now',
            email: contact.email || contact.studentEmail || '',
            userType: contact.userType || 'student',
            id: contact.id || contact._id
          }));
          setContacts(formattedContacts);
        } else {
          setContacts([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
        setLoading(false);
      }
    };

    fetchContacts();
  }, [authToken]);

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
    // Load messages for this contact
    loadMessagesForContact(contact.email);
  };

  // Load messages for a specific contact
  const loadMessagesForContact = async (contactEmail: string) => {
    try {
      if (!authToken) return;
      
      const response = await axios.get(`${BASE_URL}/api/messages/${contactEmail}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };
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

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedContact) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageInput.trim(),
        sender: "me",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(),
      };
      
      setMessages([...messages, newMessage]);
      setMessageInput('');
      
      // Update contact's last message
      setContacts(contacts.map(contact => 
        contact.email === selectedContact.email 
          ? { ...contact, lastMessage: messageInput.trim(), lastMessageTime: 'Just now' }
          : contact
      ));
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setConnectionRequests(connectionRequests.filter(req => req.id !== requestId));
    Alert.alert('Success', 'Connection request accepted!');
  };

  const handleRejectRequest = (requestId: string) => {
    setConnectionRequests(connectionRequests.filter(req => req.id !== requestId));
  };

  const renderContactItem = (contact: Contact) => (
    <TouchableOpacity
      key={contact.email}
      style={styles.contactItem}
      onPress={() => handleContactSelect(contact)}
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
          {contact.lastMessage}
        </Text>
      </View>
      <View style={styles.contactMeta}>
        <Text style={styles.contactTime}>{contact.lastMessageTime}</Text>
        {contact.userType === 'student' && (
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>Student</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
    <View key={request.id} style={styles.requestItem}>
      <Image source={{ uri: request.studentProfilePic }} style={styles.requestAvatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{request.studentName}</Text>
        <Text style={styles.requestEmail}>{request.studentEmail}</Text>
        <Text style={styles.requestStatus}>Status: {request.status}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request.id)}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(request.id)}
        >
          <Ionicons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
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
          </View>
        )}

        {activeTab === 'requests' && (
          <View style={styles.requestsContainer}>
            {connectionRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-add-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            ) : (
              connectionRequests.map(renderConnectionRequest)
            )}
          </View>
        )}

        {activeTab === 'broadcast' && (
          <View style={styles.broadcastContainer}>
            <View style={styles.broadcastForm}>
              <Text style={styles.broadcastTitle}>Send Broadcast Message</Text>
              <TextInput
                style={styles.broadcastInput}
                placeholder="Type your message here..."
                multiline
                value={messageInput}
                onChangeText={setMessageInput}
              />
              <TouchableOpacity style={styles.broadcastButton}>
                <Text style={styles.broadcastButtonText}>Send to All Students</Text>
              </TouchableOpacity>
            </View>
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
      <TeacherWebHeader 
        teacherName={teacherName}
        profileImage={profileImage}
      />
      
      <View style={styles.contentLayout}>
        {/* Sidebar */}
        <TeacherWebSidebar 
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={teacherEmail}
          teacherName={teacherName}
          profileImage={profileImage}
          subjectCount={0}
          studentCount={contacts.length}
          revenue="₹12.5K"
          isSpotlight={true}
        />
        
        {/* Main Content */}
        <View style={styles.mainWrapper}>
          <View style={styles.mainContent}>
            {/* LEFT: Chat List */}
            <View style={styles.chatListPanel}>
              <View style={styles.chatListHeader}>
                <Text style={styles.chatListTitle}>Messages</Text>
                <TouchableOpacity onPress={() => setShowRequestsModal(true)}>
                  <Ionicons name="person-add" size={20} color={COLORS.primaryBlue} />
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
                  <View style={styles.broadcastForm}>
                    <Text style={styles.broadcastTitle}>Send Broadcast Message</Text>
                    <TextInput
                      style={styles.broadcastInput}
                      placeholder="Type your message here..."
                      multiline
                      value={messageInput}
                      onChangeText={setMessageInput}
                    />
                    <TouchableOpacity style={styles.broadcastButton}>
                      <Text style={styles.broadcastButtonText}>Send to All Students</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
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
                    {messages.length === 0 ? (
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
                    <TouchableOpacity style={styles.sendButton}>
                      <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.chatEmptyState}>
                  <Ionicons name="chatbubble-outline" size={64} color={COLORS.textMuted} />
                  <Text style={styles.chatEmptyTitle}>Select a conversation</Text>
                  <Text style={styles.chatEmptySubtitle}>Choose a contact from the list to start chatting</Text>
                </View>
              )}
            </View>

            {/* RIGHT: Thoughts Panel - Using TutorDashboardWeb UI */}
            <View style={styles.rightPanel}>
              <Text style={styles.rightPanelTitle}>Thoughts</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                <TeacherPostComposer
                  onCreatePost={handleCreatePost}
                  placeholder="Post your thoughts..."
                />
                {postsLoading && posts.length === 0 && (
                  <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                )}
                {!postsLoading && posts.length === 0 && (
                  <View style={styles.thoughtsLoadingContainer}>
                    <Text style={styles.loadingText}>No thoughts yet. Be the first to share!</Text>
                  </View>
                )}
                {posts.map((post: any) => (
                  <TeacherThoughtsCard
                    key={post.id}
                    post={post}
                    userProfileCache={userProfileCache}
                    onLike={(postId: string) => {
                      setPosts(posts.map(p => 
                        p.id === postId 
                          ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
                          : p
                      ));
                    }}
                    onComment={(post) => {
                      // Handle comment logic
                    }}
                    onReport={(post) => {
                      // Handle report logic
                    }}
                    getProfileImageSource={getProfileImageSource}
                    initials={initials}
                    resolvePostAuthor={resolvePostAuthor}
                  />
                ))}
              </ScrollView>
            </View>
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
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
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
  requestStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  chatWindowPanel: {
    flex: 1,
    backgroundColor: COLORS.chatWindowBg,
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
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textHeader,
    marginLeft: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 12,
    fontFamily: 'Poppins_400Regular',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    maxWidth: '70%',
    marginBottom: 12,
  },
  messageSent: {
    alignSelf: 'flex-end',
  },
  messageReceived: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    padding: 12,
    borderRadius: 16,
    fontFamily: 'Poppins_400Regular',
  },
  messageTextSent: {
    backgroundColor: COLORS.primaryBlue,
    color: '#fff',
  },
  messageTextReceived: {
    backgroundColor: COLORS.receivedBubble,
    color: COLORS.textHeader,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  messageTimeSent: {
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
  },
  messageTimeReceived: {
    color: COLORS.textMuted,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontFamily: 'Poppins_400Regular',
  },
  sendButton: {
    backgroundColor: COLORS.primaryBlue,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  rightPanel: {
    width: Platform.OS === 'web' ? '25%' : '25%',
    minWidth: 300,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
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
  thoughtsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  // Chat Window Styles
  chatWindowPanel: {
    flex: 1,
    backgroundColor: COLORS.chatWindowBg,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  chatWindow: {
    flex: 1,
    flexDirection: 'column',
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
    lineHeight: 20,
  },
  sentMessageText: {
    color: COLORS.white,
  },
  receivedMessageText: {
    color: COLORS.textHeader,
  },
  messageTime: {
    fontSize: 11,
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
});
