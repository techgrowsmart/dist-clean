import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Dimensions, ScrollView, SafeAreaView, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import ThoughtsCard from './ThoughtsCard';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import Sidebar from "./Sidebar";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebNavbar from "../../../components/ui/WebNavbar";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";

const COLORS = { primary: '#3B5BFE', lightBackground: '#F5F7FB', cardBackground: '#FFFFFF', border: '#E5E7EB', textPrimary: '#1F2937', textSecondary: '#6B7280', ratingGreen: '#22C55E', ratingLight: '#DCFCE7' };

interface Contact { name: string; profilePic: string | any; email: string; lastMessage?: string; lastMessageTime?: string; subject?: string; rating?: number; description?: string; }

const MyTuitions = () => {
  const router = useRouter();
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Roboto_500Medium, OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular, Montserrat_400Regular });

  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("My Tuitions");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("My Tuitions");
  const [unreadCount, setUnreadCount] = useState(0);
  const [favoriteContacts, setFavoriteContacts] = useState<Set<string>>(new Set());

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

  // ── Fetch profile ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;
        if (auth.token === "bypass_token_student1" && auth.email === "student1@example.com") {
          setStudentName("Student"); setProfileImage(null); setUserEmail(auth.email);
          await AsyncStorage.multiSet([["studentName", "Student"], ["profileImage", ""]]);
          return;
        }
        const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
        const profileResponse = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers });
        const profileData = profileResponse.data;
        setStudentName(profileData.name || ""); setProfileImage(profileData.profileimage || null); setUserEmail(auth.email);
        await AsyncStorage.multiSet([["studentName", profileData.name || ""], ["profileImage", profileData.profileimage || ""]]);
      } catch (error: any) {
        const cachedName = await AsyncStorage.getItem("studentName");
        const cachedImage = await AsyncStorage.getItem("profileImage");
        if (cachedName) { setStudentName(cachedName); setProfileImage(cachedImage || null); }
      }
    };
    fetchProfile();
  }, []);

  // ── Load user role ──
  useEffect(() => {
    const loadUserRole = async () => {
      try { const storedRole = await AsyncStorage.getItem("user_role"); if (storedRole) setUserRole(storedRole); } catch {}
    };
    loadUserRole();
  }, []);

  // ── Fetch contacts ──
  const fetchContacts = useCallback(async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const auth = await getAuthData();
      const token = auth?.token;
      if (token === "bypass_token_student1" && auth?.email === "student1@example.com") {
        const mockContacts: Contact[] = [
          { name: "Dr. Sarah Johnson", profilePic: require("../../../assets/images/Mentor1.png"), email: "sarah.j@example.com", lastMessage: "Welcome to Mathematics class!", lastMessageTime: "2:30 PM", subject: "MATHEMATICS", rating: 4.9, description: "PhD in Mathematics with 10 years of experience helping students excel in math..." },
          { name: "Prof. Michael Chen", profilePic: require("../../../assets/images/Mentor2.png"), email: "michael.c@example.com", lastMessage: "Physics session tomorrow", lastMessageTime: "1:15 PM", subject: "PHYSICS", rating: 4.8, description: "Experienced physics educator specializing in high school curriculum..." },
          { name: "Dr. Emily Watson", profilePic: require("../../../assets/images/Mentor3.png"), email: "emily.w@example.com", lastMessage: "Chemistry lab notes attached", lastMessageTime: "12:45 PM", subject: "CHEMISTRY", rating: 4.7, description: "Expert in organic chemistry with research background..." },
        ];
        setContacts(mockContacts); setFilteredContacts(mockContacts); setLoading(false); return;
      }
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await axios.post(`${BASE_URL}/api/contacts`, { userEmail, type: "student" }, { headers });
      if (res.data.success) {
        const data = res.data.contacts.map((contact: any) => ({ name: contact.teacherName || contact.name || "Unknown Teacher", profilePic: contact.teacherProfilePic || contact.profilePic || "", email: contact.teacherEmail || contact.email, lastMessage: contact.lastMessage || "No messages yet", lastMessageTime: contact.lastMessageTime || "", subject: contact.subject || "SUBJECT", rating: contact.rating || 4.5, description: contact.description || "Experienced educator..." }));
        setContacts(data); setFilteredContacts(data);
      }
    } catch (error: any) {
      const cachedName = await AsyncStorage.getItem("studentName");
      if (cachedName) { setContacts([]); setFilteredContacts([]); }
      else {
        const mockContacts: Contact[] = [{ name: "Dr. Sarah Johnson", profilePic: require("../../../assets/images/Mentor1.png"), email: "sarah.j@example.com", lastMessage: "Welcome to Mathematics class!", lastMessageTime: "2:30 PM", subject: "MATHEMATICS", rating: 4.9, description: "PhD in Mathematics with 10 years of experience helping students excel in math..." }];
        setContacts(mockContacts); setFilteredContacts(mockContacts);
      }
    } finally { setLoading(false); }
  }, [userEmail]);

  useEffect(() => { if (userEmail) fetchContacts(); }, [userEmail, fetchContacts]);

  useEffect(() => {
    if (searchQuery.trim() === "") { setFilteredContacts(contacts); }
    else { setFilteredContacts(contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()))); }
  }, [searchQuery, contacts]);

  // ── Unread count ──
  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      if (auth.token === "bypass_token_student1") { setUnreadCount(0); return; }
      const response = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' } });
      if (response.data && typeof response.data.count === 'number') setUnreadCount(response.data.count);
    } catch { setUnreadCount(0); }
  }, []);

  useEffect(() => {
    if (studentName) { fetchUnreadCount(); const interval = setInterval(fetchUnreadCount, 30000); return () => clearInterval(interval); }
  }, [studentName, fetchUnreadCount]);

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

  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) return null;
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
      if (profilePic.startsWith('/')) return { uri: `${BASE_URL}${profilePic}` };
      return { uri: `${BASE_URL}/${profilePic}` };
    }
    return null;
  };

  const initials = (name: string) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

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

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const init = async () => {
      try {
        await autoRefreshToken();
        const authData = await getAuthData();
        if (authData?.token) { setAuthToken(authData.token); await fetchPosts(authData.token); }
      } catch {}
    };
    init();
  }, []);

  if (!fontsLoaded) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  // ── Handlers ──
  const handleContactPress = (contact: Contact) => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails", params: { name: contact.name, email: contact.email, profilePic: contact.profilePic } });

  const handleFavoritePress = (contactEmail: string, event: any) => {
    event.stopPropagation();
    setFavoriteContacts(prev => { const n = new Set(prev); n.has(contactEmail) ? n.delete(contactEmail) : n.add(contactEmail); return n; });
  };

  const handleReviewPress = (contact: Contact, event: any) => {
    event.stopPropagation();
    router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails", params: { name: contact.name, email: contact.email, profilePic: contact.profilePic, showReview: "true" } });
  };

  const handleSidebarItemPress = (itemName: string) => {
    setActiveMenu(itemName);
    setSidebarActiveItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
    if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail, userType: userRole } });
    if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName, profileImage } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push("/(tabs)/Contact");
    if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  // ── Render tuition card ──
  const renderTuitionCard = (contact: Contact, index: number) => (
    <TouchableOpacity key={contact.email} style={styles.tuitionCard} onPress={() => handleContactPress(contact)} activeOpacity={0.8}>
      <View style={styles.cardImageContainer}>
        <Image source={contact.profilePic ? (typeof contact.profilePic === 'string' ? { uri: contact.profilePic } : contact.profilePic) : require("../../../assets/images/Profile.png")} style={styles.cardImage} />
        <TouchableOpacity style={styles.heartButton} onPress={(e) => handleFavoritePress(contact.email, e)}>
          <Ionicons name={favoriteContacts.has(contact.email) ? "heart" : "heart-outline"} size={16} color={favoriteContacts.has(contact.email) ? "#FF0000" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.tagText}>{contact.subject}</Text>
          <View style={styles.ratingBadge}><Ionicons name="star" size={12} color="#FFFFFF" /><Text style={styles.ratingText}>{contact.rating}</Text></View>
        </View>
        <Text style={styles.teacherName}>{contact.name}</Text>
        <Text style={styles.teacherDesc} numberOfLines={2}>{contact.description}</Text>
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.reviewBtn} onPress={(e) => handleReviewPress(contact, e)}>
            <Text style={styles.reviewBtnText}>Your Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── WEB HEADER - Full Width ── */}
      {isDesktop && (
        <WebNavbar
          studentName={studentName}
          profileImage={profileImage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <View style={styles.rootContainer}>

        {/* ── MOBILE TOP NAVBAR ── */}
        {!isDesktop && (
          <View style={styles.topHeader}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput placeholder="Type in search" placeholderTextColor={COLORS.textSecondary} style={styles.searchInput as any} value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <View style={styles.profileHeaderSection}>
              <TouchableOpacity style={styles.bellIcon} onPress={() => router.push("/(tabs)/StudentDashBoard/StudentNotification")}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}><Text style={styles.notificationText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                )}
              </TouchableOpacity>
              <Text style={styles.headerUserName}>{studentName || 'Student'}</Text>
              <Image source={profileImage ? { uri: profileImage } : require("../../../assets/images/Profile.png")} style={styles.headerAvatar} />
            </View>
          </View>
        )}

        {/* ── LEFT SIDEBAR (WebSidebar component — desktop only, no duplicate) ── */}
        {isDesktop && (
          <WebSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || "student@example.com"}
            studentName={studentName || "Student"}
            profileImage={profileImage}
          />
        )}

        {/* ── LEFT SIDEBAR (reused component) ── */}
        <Sidebar
          activeMenu={activeMenu}
          onItemPress={handleSidebarItemPress}
          studentName={studentName}
          profileImage={profileImage}
          userEmail={userEmail}
          userRole={userRole}
        />

        {/* ── MAIN AREA ── */}
        <View style={styles.mainLayout}>

          {/* ── CONTENT COLUMNS ── */}
          <View style={styles.contentColumns}>

            {/* CENTER: My Tuitions Grid */}
            <View style={styles.centerContent}>
              <View style={styles.pageTitleContainer}>
                <Ionicons name="school" size={28} color={COLORS.textPrimary} />
                <Text style={styles.pageTitle}>My Tuitions</Text>
              </View>

              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.tuitionGrid} showsVerticalScrollIndicator={false}>
                  {loading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your tuitions...</Text></View>
                  ) : filteredContacts.length > 0 ? (
                    <>
                      <View style={styles.cardsWrapper}>
                        {filteredContacts.map((contact, index) => renderTuitionCard(contact, index))}
                      </View>
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity><Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} /></TouchableOpacity>
                        <TouchableOpacity style={[styles.pageDot, styles.pageDotActive]}><Text style={styles.pageDotTextActive}>1</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.pageDot}><Text style={styles.pageDotText}>2</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.pageDot}><Text style={styles.pageDotText}>3</Text></TouchableOpacity>
                        <TouchableOpacity><Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} /></TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>No Tuitions Yet</Text>
                      <Text style={styles.emptyText}>You haven't enrolled in any tuitions yet. Start by connecting with teachers!</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>

            {/* RIGHT: Thoughts Panel (ThoughtsCard reused from Student.tsx) */}
            <View style={styles.rightPanel}>
              <Text style={styles.rightPanelTitle}>Thoughts</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
                {postsLoading && posts.length === 0 && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />}
                {!postsLoading && posts.length === 0 && (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <MaterialIcons name="post-add" size={40} color="#ccc" />
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
      </View>

      {/* ── Comments Modal ── */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
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
              <TextInput style={styles.commentInput as any} placeholder="Add a comment..." value={commentText} onChangeText={setCommentText} multiline />
              <TouchableOpacity style={styles.commentSendBtn} onPress={addComment}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Report Modal ── */}
      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            <TextInput style={[styles.commentInput as any, { margin: 16, height: 100 }]} placeholder="Reason for report..." value={reportReason} onChangeText={setReportReason} multiline />
            <TouchableOpacity style={[styles.commentSendBtn, { margin: 16, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }]} onPress={submitReport}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold' }}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rootContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.cardBackground },
  mainLayout: { flex: 1, backgroundColor: COLORS.lightBackground },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 20, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightBackground, borderRadius: 30, paddingHorizontal: 16, height: 44, width: Platform.OS === 'web' ? '40%' : '40%' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary },
  profileHeaderSection: { flexDirection: 'row', alignItems: 'center' },
  bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.lightBackground, borderRadius: 20 },
  notificationBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  notificationText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  contentColumns: { flex: 1, flexDirection: 'row' },
  centerContent: { flex: 1, paddingTop: 32, paddingHorizontal: 32, paddingBottom: 24 },
  pageTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.textPrimary, marginLeft: 12 },
  gridContainerBox: { flex: 1, backgroundColor: COLORS.cardBackground, borderRadius: 20, borderWidth: 1, borderColor: '#E4ECF7', padding: 24, shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 },
  tuitionGrid: { paddingBottom: 20 },
  cardsWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  tuitionCard: { width: '31%', minWidth: 180, marginBottom: 16, backgroundColor: COLORS.cardBackground, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  cardImageContainer: { width: '100%', height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  heartButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 6 },
  cardBody: { padding: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tagText: { color: COLORS.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 0.5 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.ratingGreen, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  ratingText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 11, marginLeft: 4 },
  teacherName: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  teacherDesc: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textSecondary, lineHeight: 16, marginBottom: 16 },
  cardFooter: { alignItems: 'flex-end' },
  reviewBtn: { backgroundColor: COLORS.ratingLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  reviewBtnText: { color: COLORS.textPrimary, fontFamily: 'Poppins_500Medium', fontSize: 12 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 8 },
  pageDot: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.lightBackground, justifyContent: 'center', alignItems: 'center' },
  pageDotActive: { backgroundColor: COLORS.textSecondary },
  pageDotText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary },
  pageDotTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  rightPanel: { width: Platform.OS === 'web' ? '25%' : '25%', minWidth: 300, backgroundColor: COLORS.cardBackground, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 20 },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'right' },
  thoughtsList: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary, marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 50 },
  emptyTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.textPrimary },
  commentsList: { paddingHorizontal: 16, paddingTop: 12 },
  commentItem: { marginBottom: 16, padding: 12, backgroundColor: COLORS.lightBackground, borderRadius: 10 },
  commentAuthor: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  commentContent: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },
  commentTime: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  commentInput: { flex: 1, backgroundColor: COLORS.lightBackground, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, maxHeight: 100 },
  commentSendBtn: { marginLeft: 10, backgroundColor: COLORS.primary, borderRadius: 20, padding: 10 },
});

// ─── WEB-ONLY STYLES (from Student.tsx) ─────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  // Header
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff', zIndex: 10 },
  logo: { fontSize: 18, fontWeight: 'bold', color: '#4A7BF7', fontFamily: 'Poppins_700Bold', marginRight: 20, minWidth: 110 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 7, maxWidth: 480 },
  searchInput: { flex: 1, fontSize: 13, color: '#333', fontFamily: 'Poppins_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' as any },
  headerUsername: { fontSize: 13, color: '#333', fontFamily: 'Poppins_400Regular', marginRight: 8 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

export default MyTuitions;