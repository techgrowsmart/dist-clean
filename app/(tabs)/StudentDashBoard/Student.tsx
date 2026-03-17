import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import BookOpenReaderIcon from "../../../assets/svgIcons/BookOpenReader";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Roboto_500Medium, Roboto_400Regular } from "@expo-google-fonts/roboto";
import { OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Montserrat_400Regular } from "@expo-google-fonts/montserrat";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Animated, PanResponder, StatusBar, ActivityIndicator,
} from 'react-native';
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
  if (Platform.OS === "ios" || Platform.OS === "android") { if (!RazorpayCheckout) console.log("Razorpay module not available"); }
} catch (error) { console.log("Razorpay module not available:", error); }

// ─── Shared interfaces ────────────────────────────────────────────────────────
interface StudentState { name: string; profileImage: string | null; }
interface Teacher {
  _id: string; profilePic: string | any; name: string; email: string;
  isPopular?: boolean; rating?: number; experience?: number; price?: number;
  about?: string; tutions?: any[]; language?: string; qualification?: string;
}
interface Post {
  id: string;
  author: { email: string; name: string; role: string; profile_pic: string; };
  content: string; likes: number; comments?: any[]; createdAt: string;
  tags?: string[]; postImage?: string; isLiked?: boolean;
}
interface Comment {
  id: string; author: { email: string; name: string; role: string; profile_pic: string; };
  content: string; likes: number; createdAt: string; isLiked?: boolean;
}

// ─── Android constants ────────────────────────────────────────────────────────
const SCREEN_COUNT = 3;

const categoryColors: Record<string, string> = {
  'Chemistry': '#00BCD4', 'History': '#E91E63', 'Mathematics': '#3F51B5',
  'English Literature': '#1A237E', 'Physical Education': '#4CAF50',
};

// ─── Helpers (shared) ─────────────────────────────────────────────────────────
const getProfileImageSource = (profilePic?: string) => {
  if (!profilePic || ['', 'null', 'undefined'].includes(profilePic)) return null;
  if (typeof profilePic === 'string') {
    if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
    const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    return { uri: `${BASE_URL}/${clean}` };
  }
  return null;
};

const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  if (typeof dateString === 'string' && dateString.includes('ago')) return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Just now';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'Just now';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min. ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

const initials = (name: string) =>
  name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { email, userType, userEmail } = useLocalSearchParams<{ email?: string; userType?: string; userEmail?: string }>();
  const { width } = Dimensions.get('window');

  // ── fonts ──
  const [fontsLoaded] = useFonts({
    Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold,
    Roboto_500Medium, OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular, Montserrat_400Regular,
  });

  // ── shared state ──
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [storedUserEmail, setStoredUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ── teacher state ──
  const [allSpotlightSubjectTeachers, setAllSpotlightSubjectTeachers] = useState<Teacher[]>([]);
  const [allSpotlightSkillTeachers, setAllSpotlightSkillTeachers] = useState<Teacher[]>([]);
  const [allPopularSubjectTeachers, setAllPopularSubjectTeachers] = useState<Teacher[]>([]);
  const [allPopularSkillTeachers, setAllPopularSkillTeachers] = useState<Teacher[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showAiText, setShowAiText] = useState(false);
  const [selectedAiTextIndex, setSelectedAiTextIndex] = useState(0);
  const aiTexts = [
    "According to our Intelligence, you have these teachers...",
    "Diving in the database for you...",
    "These are the research regarding your query",
    "Happy surfing.."
  ];

  // ── web-specific: posts / thoughts ──
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportItemId, setReportItemId] = useState('');
  const [reportReason, setReportReason] = useState('');

  // ── web-specific: nav ──
  const [selectedCategory, setSelectedCategory] = useState('Chemistry');
  const webCategories = ['Chemistry', 'History', 'Mathematics', 'English Literature', 'Physical Education'];

  // ── android-specific state ──
  const [currentScreenIndex, setCurrentScreenIndex] = useState(1);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartX = useRef(0);
  const isSwipeLocked = useRef(false);
  const [blinkAnim] = useState(new Animated.Value(1));
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [currentSection, setCurrentSection] = useState("home");
  const [student, setStudent] = useState<StudentState>({ name: "", profileImage: null });

  // ── Android PanResponder ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        if (isSwipeLocked.current) return false;
        const absDx = Math.abs(dx); const absDy = Math.abs(dy);
        return absDx > 15 && absDx > absDy * 1.5;
      },
      onPanResponderGrant: () => {
        if (isSwipeLocked.current) return;
        setIsSwiping(true); swipeAnim.stopAnimation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, { dx }) => {
        if (isSwipeLocked.current) return;
        let newPosition = -width * currentScreenIndex + dx;
        const min = -width * (SCREEN_COUNT - 1); const max = 0;
        if (currentScreenIndex === 0 && dx > 0) newPosition = dx * 0.2;
        else if (currentScreenIndex === SCREEN_COUNT - 1 && dx < 0) newPosition = -width * (SCREEN_COUNT - 1) + dx * 0.2;
        swipeAnim.setValue(Math.max(min, Math.min(max, newPosition)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (isSwipeLocked.current) return;
        setIsSwiping(false);
        let newIndex = currentScreenIndex;
        const swipeThreshold = width * 0.3; const velocityThreshold = 0.3;
        const isSwipingLeft = dx < -swipeThreshold || (dx < 0 && Math.abs(vx) > velocityThreshold);
        const isSwipingRight = dx > swipeThreshold || (dx > 0 && Math.abs(vx) > velocityThreshold);
        if (isSwipingLeft && currentScreenIndex < SCREEN_COUNT - 1) newIndex = currentScreenIndex + 1;
        else if (isSwipingRight && currentScreenIndex > 0) newIndex = currentScreenIndex - 1;
        newIndex = Math.max(0, Math.min(SCREEN_COUNT - 1, newIndex));
        isSwipeLocked.current = true;
        Animated.spring(swipeAnim, { toValue: -width * newIndex, useNativeDriver: true, tension: 80, friction: 10, overshootClamping: true }).start(() => { isSwipeLocked.current = false; setCurrentScreenIndex(newIndex); });
        if (newIndex !== currentScreenIndex) Haptics.selectionAsync();
      },
      onPanResponderTerminate: () => {
        setIsSwiping(false);
        if (!isSwipeLocked.current) Animated.spring(swipeAnim, { toValue: -width * currentScreenIndex, useNativeDriver: true, tension: 80, friction: 10, overshootClamping: true }).start();
      },
    })
  ).current;

  // ── Shared: fetchProfile ──
  const fetchProfileAndBalance = async () => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.email) { Alert.alert("Session Expired", "Please log in again."); return; }
      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      try {
        const res = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers });
        setStudentName(res.data.name || ""); setProfileImage(res.data.profileimage || null);
        setStudent({ name: res.data.name || "", profileImage: res.data.profileimage || null });
        await AsyncStorage.multiSet([["studentName", res.data.name || ""], ["profileImage", res.data.profileimage || ""]]);
      } catch {
        const cachedName = await AsyncStorage.getItem("studentName") || "Student";
        const cachedImage = await AsyncStorage.getItem("profileImage") || null;
        setStudentName(cachedName); setProfileImage(cachedImage);
        setStudent({ name: cachedName, profileImage: cachedImage });
      }
      setStoredUserEmail(auth.email);
    } catch { setStudentName("Student"); setProfileImage(null); }
  };

  // ── Shared: fetchTeachers ──
  const fetchTeachers = useCallback(async (isLoadMore = false) => {
    if (loadingMore || !hasMoreData) return;
    try {
      setLoadingMore(true);
      const body: any = { count: 10, page };
      if (searchQuery.trim()) body.search = searchQuery.trim();
      if (selectedBoard?.boardName) body.board = selectedBoard.boardName;
      const auth = await getAuthData();
      if (!auth?.token) { Alert.alert("Session Expired", "Please log in again."); return; }
      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      const response = await axios.post(`${BASE_URL}/api/teachers`, body, { headers });
      const spotlightObj = response.data.spotlightTeachers || {};
      const popularObj = response.data.popularTeachers || {};
      const clean = (t: any): Teacher => {
        let tuitions = []; let qualifications = [];
        try { tuitions = t?.tuitions ? JSON.parse(t.tuitions) : []; } catch {}
        try { qualifications = t?.qualifications ? JSON.parse(t.qualifications) : []; } catch {}
        return { _id: t._id || t.email, profilePic: typeof t.profilePic === 'string' ? t.profilePic.replace(/"/g, '').trim() : null, name: t.name || 'Unknown', email: t.email || 'Unknown', isPopular: !!t.isspotlight, tutions: tuitions, qualifications, language: t.language || '', qualification: '' };
      };
      const filterByName = (arr: Teacher[]) => searchQuery.trim() ? arr.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) : arr;
      const seen = new Set<string>();
      const uniq = (arr: Teacher[]) => arr.filter(t => { if (seen.has(t.email)) return false; seen.add(t.email); return true; });
      const ss = uniq(filterByName((spotlightObj["Subject teacher"] || []).map(clean)));
      const sk = uniq(filterByName((spotlightObj["Skill teacher"] || []).map(clean)));
      const ps = uniq(filterByName((popularObj["Subject teacher"] || []).map(clean)));
      const pk = uniq(filterByName((popularObj["Skill teacher"] || []).map(clean)));
      if (ss.length + sk.length + ps.length + pk.length < 10) setHasMoreData(false);
      if (isLoadMore) {
        setAllSpotlightSubjectTeachers(p => [...p, ...ss]); setAllSpotlightSkillTeachers(p => [...p, ...sk]);
        setAllPopularSubjectTeachers(p => [...p, ...ps]); setAllPopularSkillTeachers(p => [...p, ...pk]);
      } else {
        setAllSpotlightSubjectTeachers(ss); setAllSpotlightSkillTeachers(sk);
        setAllPopularSubjectTeachers(ps); setAllPopularSkillTeachers(pk);
      }
    } catch {
      const mock: Teacher[] = [
        { _id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.j@example.com', profilePic: null, isPopular: true, tutions: [{ subject: 'Mathematics' }], language: 'English' },
        { _id: '2', name: 'Prof. Michael Chen', email: 'michael.c@example.com', profilePic: null, isPopular: true, tutions: [{ subject: 'Physics' }], language: 'English' },
      ];
      setAllSpotlightSubjectTeachers(mock); setAllSpotlightSkillTeachers(mock.slice(0, 1));
      setAllPopularSubjectTeachers(mock); setAllPopularSkillTeachers(mock.slice(0, 1));
      setHasMoreData(false);
    } finally { setLoadingMore(false); }
  }, [page, searchQuery, loadingMore, hasMoreData, selectedBoard]);

  // ── Web: fetchPosts ──
  const fetchUserProfile = async (token: string, profileEmail: string) => {
    if (userProfileCache.has(profileEmail)) return userProfileCache.get(profileEmail)!;
    try {
      const res = await axios.post(`${BASE_URL}/api/userProfile`, { email: profileEmail, source: 'astraDB' }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (res.data) {
        const pic = res.data.profileimage || res.data.profilePic || res.data.profilepic || '';
        const name = res.data.name || res.data.userName || res.data.fullname || '';
        let finalPic = pic;
        if (finalPic && !finalPic.startsWith('http') && !finalPic.startsWith('/')) finalPic = `/${finalPic}`;
        const data = { name: name || 'Unknown User', profilePic: finalPic || '' };
        setUserProfileCache(prev => new Map(prev.set(profileEmail, data)));
        return data;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
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
        const uniqueEmails = [...new Set(postsWithComments.map((p: Post) => p.author.email))];
        await Promise.all(uniqueEmails.map(e => fetchUserProfile(token, e)));
        setPosts(postsWithComments);
      } else setPosts([]);
    } catch { setPosts([]); }
    finally { setPostsLoading(false); }
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    const post = posts.find(p => p.id === postId); if (!post) return;
    const newLiked = !post.isLiked;
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: newLiked ? p.likes + 1 : Math.max(0, p.likes - 1), isLiked: newLiked } : p));
    try {
      if (newLiked) await axios.post(`${BASE_URL}/api/posts/${postId}/like`, {}, { headers: { 'Authorization': `Bearer ${authToken}` } });
      else await axios.delete(`${BASE_URL}/api/posts/${postId}/like`, { headers: { 'Authorization': `Bearer ${authToken}` } });
    } catch { setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: post.likes, isLiked: post.isLiked } : p)); }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.data.success) setPostComments(res.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })));
    } catch { setPostComments([]); }
  };

  const openCommentsModal = async (post: Post) => {
    setSelectedPost(post); setShowCommentsModal(true); setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await axios.post(`${BASE_URL}/api/posts/${selectedPost.id}/comments`, { content: commentText.trim() }, { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } });
      if (res.data.success) {
        const newC: Comment = { ...res.data.data, createdAt: 'Just now', isLiked: false };
        setPostComments(prev => [newC, ...prev]);
        setCommentText('');
        setPosts(ps => ps.map(p => p.id === selectedPost.id ? { ...p, comments: [newC, ...(p.comments || [])] } : p));
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

  // ── Shared: fetchUnreadCount ──
  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const res = await axios.get(`${BASE_URL}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' } });
      if (res.data && typeof res.data.count === 'number') setUnreadCount(res.data.count);
    } catch {}
  }, []);

  // ── Effects ──
  useEffect(() => {
    swipeAnim.setValue(-width); setCurrentScreenIndex(1);
  }, []);

  useEffect(() => {
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]));
    blink.start(); return () => blink.stop();
  }, []);

  useEffect(() => { fetchProfileAndBalance(); fetchTeachers(false); }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("user_role");
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (storedEmail) { setStoredUserEmail(storedEmail); if (storedRole) setUserRole(storedRole); }
        else {
          const auth = await getAuthData();
          if (auth?.email) { setStoredUserEmail(auth.email); if (auth.role) setUserRole(auth.role); }
        }
      } catch {}
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const init = async () => {
      try {
        const wasRefreshed = await autoRefreshToken();
        const authData = await getAuthData();
        if (authData?.token) {
          setAuthToken(authData.token);
          await fetchPosts(authData.token);
        }
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    if (storedUserEmail) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [storedUserEmail, fetchUnreadCount]);

  if (!fontsLoaded) return <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 16, textAlign: 'center', marginTop: 50 }}>Loading...</Text>;

  // ─────────────────────────────────────────────────────────────────────────────
  // WEB RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const renderWebHeader = () => (
    <View style={ws.header}>
      <Text style={ws.logo}>Growsmart</Text>
      <View style={ws.searchBar}>
        <FontAwesome name="search" size={14} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput style={ws.searchInput} placeholder="Type in search" placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <View style={ws.headerRight}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/StudentNotification")} style={{ marginRight: 18, position: 'relative' }}>
          <FontAwesome name="bell-o" size={20} color="#444" />
          {unreadCount > 0 && (
            <View style={ws.notifBadge}><Text style={ws.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
          )}
        </TouchableOpacity>
        <Text style={ws.headerUsername}>{studentName || 'Ben Goro'}</Text>
        <View style={ws.headerAvatar}>
          {profileImage
            ? <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            : <FontAwesome name="user" size={18} color="#fff" />}
        </View>
      </View>
    </View>
  );

  // ─── UPDATED: renderWebLeftSidebar ───────────────────────────────────────────
  // Matches the screenshot: flat nav items, section dividers, Favorites as bold
  // header, Advertising as a standalone card at the bottom of the menu group.
  const renderWebLeftSidebar = () => (
    <ScrollView style={ws.leftSidebar} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

      {/* Home */}
      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="home" size={15} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Home</Text>
      </TouchableOpacity>

      {/* Profile – shows real avatar thumbnail */}
      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push('/(tabs)/StudentDashBoard/StudentProfile' as any)}
      >
        <View style={ws.sidebarAvatarThumb}>
          {profileImage
            ? <Image source={{ uri: profileImage }} style={{ width: 20, height: 20, borderRadius: 10 }} />
            : <FontAwesome name="user" size={12} color="#999" />}
        </View>
        <Text style={ws.navText}>Profile</Text>
      </TouchableOpacity>

      {/* ── Divider ── */}
      <View style={ws.divider} />

      {/* Favorites section header */}
      <Text style={ws.sectionHeader}>Favorites</Text>

      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="graduation-cap" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>My Tutions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="comment-o" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Connect</Text>
      </TouchableOpacity>

      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="share-alt" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push({ pathname: '/(tabs)/StudentDashBoard/Subscription' as any, params: { userEmail: storedUserEmail } })}
      >
        <FontAwesome name="heart-o" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Subscription</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push({ pathname: '/(tabs)/Billing' as any, params: { userEmail: storedUserEmail, userType: userRole } })}
      >
        <FontAwesome name="th-large" size={13} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Billing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push('/(tabs)/StudentDashBoard/Faq' as any)}
      >
        <FontAwesome name="question-circle-o" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Faq</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push('/(tabs)/StudentDashBoard/TermsAndConditions' as any)}
      >
        <FontAwesome name="file-text-o" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Terms & Conditions</Text>
      </TouchableOpacity>

      {/* ── Divider ── */}
      <View style={ws.divider} />

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push('/(tabs)/StudentDashBoard/PrivacyPolicy' as any)}
      >
        <FontAwesome name="lock" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Privacy Policy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => router.push('/(tabs)/Contact' as any)}
      >
        <FontAwesome name="phone" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Contact Us</Text>
      </TouchableOpacity>

      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="exclamation-triangle" size={13} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Raise a Complaint</Text>
      </TouchableOpacity>

      {/* ── Advertising card ── */}
      <View style={ws.adCard}>
        <Text style={ws.adSectionLabel}>Advertising</Text>
        <Image
          source={require('../../../assets/images/Profile.png')}
          style={ws.adImg}
          resizeMode="cover"
        />
        <Text style={ws.adTitle}>Summer sale is on!</Text>
        <Text style={ws.adDesc}>Buy your loved pieces with reduced prices up to 70% off!</Text>
      </View>

      {/* ── Divider ── */}
      <View style={ws.divider} />

      <TouchableOpacity style={ws.navItem} onPress={() => {}}>
        <FontAwesome name="question-circle" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Help & Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={ws.navItem}
        onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', onPress: () => {} }])}
      >
        <FontAwesome name="sign-out" size={14} color="#555" style={{ width: 20 }} />
        <Text style={ws.navText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Web spotlight/skill card
  const renderSpotCard = (teacher: Teacher, idx: number) => {
    const imgSrc = getProfileImageSource(teacher.profilePic);
    const subject = teacher.tutions?.[0]?.subject || 'Subject';
    return (
      <TouchableOpacity key={`${teacher._id}-${idx}`} style={ws.spotCard}
        onPress={() => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails" as any, params: { name: teacher.name, email: teacher.email, language: teacher.language, profilePic: teacher.profilePic } })}>
        {imgSrc
          ? <Image source={imgSrc} style={ws.spotBg} resizeMode="cover" />
          : <View style={[ws.spotBg, { backgroundColor: '#c8d0e0', alignItems: 'center', justifyContent: 'center' }]}><FontAwesome name="user" size={48} color="#fff" /></View>}
        <View style={ws.spotDim} />
        <View style={ws.spotOverlay}>
          <View style={ws.spotBadge}><Text style={ws.spotBadgeText}>{subject.toUpperCase()} SPECIALIST</Text></View>
          <Text style={ws.spotSubject}>{subject}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <FontAwesome name="star" size={11} color="#FFD700" /><Text style={ws.spotRating}> (120)</Text>
          </View>
          <Text style={ws.spotName}>{teacher.name}</Text>
          <Text style={ws.spotDesc}>Experienced educator specializing in middle school curriculum with a focu...</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={ws.spotPrice}>800/ hr</Text>
            <TouchableOpacity style={ws.viewBtn}
              onPress={() => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails" as any, params: { name: teacher.name, email: teacher.email, language: teacher.language, profilePic: teacher.profilePic } })}>
              <Text style={ws.viewBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderWebMainContent = () => (
    <ScrollView style={ws.main} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

      {/* My Tutors */}
      <View style={ws.card}>
        <View style={ws.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BookOpenReaderIcon width={20} height={20} />
            <Text style={ws.cardTitle}> My Tutors</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/AllBoardsPage" as any)}>
            <Text style={ws.seeAll}>See all &gt;</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {webCategories.map((cat) => {
            const col = categoryColors[cat] || '#5f5fff'; const sel = selectedCategory === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[ws.catChip, { borderColor: col, backgroundColor: sel ? col : 'transparent' }]}>
                <Text style={[ws.catText, { color: sel ? '#fff' : col }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(allPopularSubjectTeachers.length > 0 ? allPopularSubjectTeachers : allSpotlightSubjectTeachers).slice(0, 8).map((t, i) => {
            const col = categoryColors[t.tutions?.[0]?.subject || ''] || '#5f5fff';
            const imgSrc = getProfileImageSource(t.profilePic);
            return (
              <TouchableOpacity key={`${t._id}-${i}`} style={ws.tutorCard}
                onPress={() => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails" as any, params: { name: t.name, email: t.email, language: t.language, profilePic: t.profilePic } })}>
                <View style={[ws.tutorChip, { borderColor: col }]}>
                  <Text style={[ws.tutorChipText, { color: col }]} numberOfLines={1}>{t.tutions?.[0]?.subject || 'Subject'}</Text>
                </View>
                {imgSrc
                  ? <Image source={imgSrc} style={ws.tutorImg} />
                  : <View style={[ws.tutorImg, { backgroundColor: '#dde', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 22, fontWeight: 'bold', color: '#5f5fff' }}>{initials(t.name)}</Text></View>}
                <Text style={ws.tutorName} numberOfLines={1}>{t.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={ws.dotRow}>{[0, 1, 2, 3].map(i => <View key={i} style={[ws.dot, i === 2 && ws.dotActive]} />)}</View>
      </View>

      {/* Tutors Spotlight Trending */}
      <View style={ws.card}>
        <View style={ws.cardHeader}>
          <Text style={ws.cardTitle}>
            Tutors <Text style={{ fontWeight: 'bold', color: '#222' }}>Spotlight</Text>{' '}
            <Text style={{ color: '#FF6600', fontWeight: 'bold' }}>Trending</Text>
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/SpotLight" as any)}>
            <Text style={ws.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {allSpotlightSubjectTeachers.length === 0
          ? <ActivityIndicator color="#5f5fff" style={{ marginVertical: 20 }} />
          : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{allSpotlightSubjectTeachers.slice(0, 6).map(renderSpotCard)}</ScrollView>}
        <View style={ws.dotRow}>{[0, 1, 2, 3].map(i => <View key={i} style={[ws.dot, i === 2 && ws.dotActive]} />)}</View>
      </View>

      {/* Skill Classes */}
      <View style={ws.card}>
        <View style={ws.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <BookOpenReaderIcon width={20} height={20} />
            <Text style={ws.cardTitle}> Skill Classes</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/AllSkills" as any)}>
            <Text style={ws.seeAll}>See all &gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={[ws.cardHeader, { marginTop: 2 }]}>
          <Text style={ws.cardTitle}>
            Tutors <Text style={{ fontWeight: 'bold', color: '#222' }}>Spotlight</Text>{' '}
            <Text style={{ color: '#FF6600', fontWeight: 'bold' }}>Trending</Text>
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/SpotLightSkillteachers" as any)}>
            <Text style={ws.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {allSpotlightSkillTeachers.length === 0
          ? <ActivityIndicator color="#5f5fff" style={{ marginVertical: 20 }} />
          : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{allSpotlightSkillTeachers.slice(0, 6).map(renderSpotCard)}</ScrollView>}
        <View style={ws.dotRow}>{[0, 1, 2, 3].map(i => <View key={i} style={[ws.dot, i === 2 && ws.dotActive]} />)}</View>
      </View>

    </ScrollView>
  );

  // Web post card author helper
  const resolvePostAuthor = (post: Post) => {
    const cached = userProfileCache.get(post.author.email) || { name: '', profilePic: '' };
    let name = cached.name || post.author.name || '';
    let pic: string | null = cached.profilePic || post.author.profile_pic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author.email?.split('@')[0] || 'User';
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;
    const role = post.author.role || 'User';
    return { name, pic, role };
  };

  const renderWebRightSidebar = () => (
    <ScrollView style={ws.rightSidebar} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={ws.thoughtsTitle}>Thoughts</Text>

      {postsLoading && posts.length === 0 && (
        <ActivityIndicator color="#4A7BF7" style={{ marginTop: 30 }} />
      )}

      {!postsLoading && posts.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <MaterialCommunityIcons name="post-outline" size={40} color="#ccc" />
          <Text style={{ color: '#aaa', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>No thoughts yet</Text>
        </View>
      )}

      {posts.map((post) => {
        const { name, pic, role } = resolvePostAuthor(post);
        const imgSrc = getProfileImageSource(pic || undefined);
        return (
          <View key={post.id} style={ws.thoughtCard}>
            <View style={ws.thoughtRow}>
              {imgSrc
                ? <Image source={imgSrc} style={ws.thoughtAvatar} />
                : <View style={[ws.thoughtAvatar, ws.avatarPlaceholder]}><Text style={ws.avatarTxt}>{initials(name)}</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={ws.thoughtAuthor}>
                  {name}{' '}
                  <Text style={{ color: '#888', fontWeight: 'normal', fontSize: 12 }}>| {role}</Text>
                </Text>
                <Text style={ws.thoughtTime}>{post.createdAt}</Text>
              </View>
              <TouchableOpacity onPress={() => { setReportType('post'); setReportItemId(post.id); setReportReason(''); setShowReportModal(true); }}>
                <Text style={{ color: '#bbb', fontSize: 16, paddingLeft: 6 }}>•••</Text>
              </TouchableOpacity>
            </View>

            <Text style={ws.thoughtBody}>{post.content}</Text>

            {post.postImage ? (
              <View style={{ marginBottom: 10 }}>
                <Image source={{ uri: post.postImage }} style={ws.thoughtFullImg} resizeMode="cover" />
              </View>
            ) : null}

            {post.tags && post.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {post.tags.map((tag, ti) => (
                  <View key={ti} style={ws.tag}><Text style={ws.tagText}>#{tag}</Text></View>
                ))}
              </View>
            )}

            <View style={ws.thoughtFooter}>
              <TouchableOpacity style={ws.actionBtn} onPress={() => handleLike(post.id)}>
                <FontAwesome name={post.isLiked ? "thumbs-up" : "thumbs-o-up"} size={13} color={post.isLiked ? "#4A7BF7" : "#666"} />
                <Text style={[ws.actionTxt, post.isLiked && { color: '#4A7BF7' }]}>  Like  {post.likes > 0 ? post.likes : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ws.actionBtn} onPress={() => openCommentsModal(post)}>
                <FontAwesome name="comment-o" size={13} color="#666" />
                <Text style={ws.actionTxt}>  Thoughts  {(post.comments?.length || 0) > 0 ? post.comments!.length : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ws.actionBtn}>
                <FontAwesome name="share" size={13} color="#666" />
                <Text style={ws.actionTxt}>  Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <View style={ws.modalOverlay}>
          <View style={ws.modalBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={ws.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
              <TextInput style={ws.commentInput} placeholder="Add a comment..." placeholderTextColor="#999" value={commentText} onChangeText={setCommentText} multiline maxLength={200} />
              <TouchableOpacity style={[ws.postBtn, !commentText.trim() && { backgroundColor: '#ccc' }]} onPress={addComment} disabled={!commentText.trim()}>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>Post</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {postComments.length === 0
                ? <Text style={{ textAlign: 'center', color: '#aaa', paddingVertical: 30, fontFamily: 'Poppins_400Regular' }}>No comments yet</Text>
                : postComments.map((c) => {
                    const ca = resolvePostAuthor({ author: c.author } as Post);
                    const cSrc = getProfileImageSource(ca.pic || undefined);
                    return (
                      <View key={c.id} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                        {cSrc ? <Image source={cSrc} style={ws.commentAvatar} /> : <View style={[ws.commentAvatar, ws.avatarPlaceholder]}><Text style={ws.avatarTxt}>{initials(ca.name)}</Text></View>}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins_600SemiBold' }}>{ca.name}</Text>
                          <Text style={{ fontSize: 13, color: '#374151', marginTop: 2, fontFamily: 'Poppins_400Regular' }}>{c.content}</Text>
                          <Text style={{ fontSize: 11, color: '#aaa', marginTop: 3, fontFamily: 'Poppins_400Regular' }}>{c.createdAt}</Text>
                        </View>
                      </View>
                    );
                  })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="fade" transparent onRequestClose={() => setShowReportModal(false)}>
        <View style={ws.modalOverlay}>
          <View style={[ws.modalBox, { maxHeight: undefined }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={ws.modalTitle}>Report {reportType === 'post' ? 'Post' : 'Comment'}</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 12, fontFamily: 'Poppins_400Regular' }}>Please provide a reason for reporting:</Text>
            <TextInput style={ws.reportInput} placeholder="Enter reason..." placeholderTextColor="#999" value={reportReason} onChangeText={setReportReason} multiline maxLength={200} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
              <TouchableOpacity style={ws.cancelBtn} onPress={() => setShowReportModal(false)}><Text style={{ color: '#666', fontFamily: 'Poppins_400Regular' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[ws.reportBtn, !reportReason.trim() && { backgroundColor: '#ccc' }]} onPress={submitReport} disabled={!reportReason.trim()}>
                <Text style={{ color: '#fff', fontFamily: 'Poppins_400Regular' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // WEB PLATFORM RETURN
  // ─────────────────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {renderWebHeader()}
        <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
          {renderWebLeftSidebar()}
          {renderWebMainContent()}
          {renderWebRightSidebar()}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANDROID / IOS
  // ─────────────────────────────────────────────────────────────────────────────

  const MarqueeTeacherList = ({ teachers, isSkill = false, reverseDirection = false }: { teachers: Teacher[], isSkill?: boolean, reverseDirection?: boolean }) => {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const SCROLL_SPEED = 1.8; const SCROLL_INTERVAL = 36;
    const cardWidth = wp("28%"); const cardMargin = wp("1.6%");
    const totalCardWidth = cardWidth + cardMargin;
    const totalContentWidth = totalCardWidth * teachers.length * 3;
    const scrollX = useRef(reverseDirection ? totalContentWidth : 0);

    const startAutoScroll = () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      scrollInterval.current = setInterval(() => {
        if (!isPaused && scrollViewRef.current && teachers.length > 0) {
          if (reverseDirection) { scrollX.current -= SCROLL_SPEED; if (scrollX.current <= 0) scrollX.current = totalContentWidth; }
          else { scrollX.current += SCROLL_SPEED; if (scrollX.current >= totalContentWidth) scrollX.current = 0; }
          scrollViewRef.current.scrollTo({ x: scrollX.current, animated: false });
        }
      }, SCROLL_INTERVAL);
    };
    const stopAutoScroll = () => { if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null; } };
    useEffect(() => { if (teachers.length > 0) startAutoScroll(); return () => stopAutoScroll(); }, [isPaused, teachers.length]);

    const navToTeacher = (item: Teacher) => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails", params: { name: item.name, email: item.email, language: item.language, profilePic: item.profilePic, ...(isSkill && { profilepic: item.profilePic }) } });

    if (teachers.length <= 3) {
      return (
        <View style={styles.teachersRow}>
          {teachers.map((item, index) => (
            <TouchableOpacity key={`${item.email}-${index}`} style={styles.teacherCard} onPress={() => navToTeacher(item)} activeOpacity={0.7}>
              <Image source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")} style={styles.teacherImage} resizeMode="cover" />
              <Text style={styles.teacherName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.teacherSub} numberOfLines={1}>{isSkill ? 'Skill Teacher' : (item.tutions?.[0]?.subject || 'Basic Subject')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.marqueeTeacherContainer}>
        <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marqueeTeacherContent} scrollEventThrottle={16} bounces={false} scrollEnabled={false}>
          {[...teachers, ...teachers, ...teachers].map((teacher, index) => (
            <TouchableOpacity key={`teacher-${teacher.email}-${index}`} style={styles.teacherCard} onPressIn={() => setIsPaused(true)} onPressOut={() => setIsPaused(false)} activeOpacity={0.8} onPress={() => navToTeacher(teacher)}>
              <Image source={teacher.profilePic ? { uri: teacher.profilePic } : require("../../../assets/images/Profile.png")} style={styles.teacherImage} resizeMode="cover" />
              <Text style={styles.teacherName} numberOfLines={1}>{teacher.name}</Text>
              <Text style={styles.teacherSub} numberOfLines={1}>{isSkill ? 'Skill' : (teacher.tutions?.[0]?.subject || 'Subject')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContent = () => {
    switch (currentSection) {
      case "spotlight": return <SpotLight onBack={() => setCurrentSection("home")} />;
      case "boards": return <AllBoardsPage onBack={() => setCurrentSection("home")} onBoardSelect={(boardName: string, boardId: string) => { setSelectedBoard({ boardName, boardId } as any); setCurrentSection("classSelection"); }} />;
      case "classSelection": return <ClassSelection boardName={selectedBoard?.boardName || ""} boardId={selectedBoard?.boardId || ""} onBack={() => setCurrentSection("boards")} onClassSelect={(sc: { classId: string; className: string }) => { setSelectedBoard((p: any) => ({ ...p!, selectedClass: sc, className: sc.className, classId: sc.classId, subjectsPerClass: p?.subjectsPerClass || [] })); setCurrentSection("subjectSelection"); }} />;
      case "subjectSelection": return <SubjectSelection classId={selectedBoard?.classId || ""} boardId={selectedBoard?.boardId || ""} className={selectedBoard?.className || ""} boardName={selectedBoard?.boardName || ""} selectedClass={{ classId: selectedBoard?.classId || "", className: selectedBoard?.className || "" }} onBack={() => setCurrentSection("classSelection")} onSubjectSelect={(sub: any) => { setSelectedBoard((p: any) => ({ ...p!, selectedSubject: sub })); setCurrentSection("teachers"); }} />;
      case "teachers": return <TeachersList boardName={selectedBoard?.boardName || ""} selectedClass={selectedBoard?.selectedClass?.className || selectedBoard?.className || ""} selectedSubject={selectedBoard?.selectedSubject || ""} onBack={() => setCurrentSection("subjectSelection")} />;
      case "myTeachers": return <MyTeacher onBack={() => setCurrentSection("home")} />;
      case "skill": return <AllSkills category="Skill teacher" onBack={() => setCurrentSection("home")} onSkillSelect={(sel: string) => { setSelectedBoard((p: any) => ({ ...p!, selectedSkill: sel })); setCurrentSection("skillTeachers"); }} />;
      case "skillTeachers": return <SkillTeachers onBack={() => setCurrentSection("skill")} selectedSkill={selectedBoard?.selectedSkill || ""} allSpotlightSkillTeachers={allSpotlightSkillTeachers} allPopularSkillTeachers={allPopularSkillTeachers} />;
      case "skillspotlight": return <SpotLightSkillteachers onBack={() => setCurrentSection("home")} />;
      default: return renderHome();
    }
  };

  const renderHome = () => {
    const displaySpotlightSubject = isSearching ? allSpotlightSubjectTeachers : allSpotlightSubjectTeachers.slice(0, 50);
    const displaySpotlightSkill = isSearching ? allSpotlightSkillTeachers : allSpotlightSkillTeachers.slice(0, 4);
    const ContainerComponent = isSearching ? View : ScrollView;
    const containerProps = isSearching ? {} : { contentContainerStyle: { paddingBottom: hp("20%") }, showsVerticalScrollIndicator: false };

    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ContainerComponent style={{ flex: 1 }} {...containerProps}>
          {isSearching && (
            <View style={styles.searchResultsContainer}>
              <Text style={[styles.searchResultsText, showAiText && { fontStyle: 'italic' }]}>
                {showAiText ? aiTexts[selectedAiTextIndex] : `Search results for "${searchQuery}"`}
              </Text>
            </View>
          )}
          {!isSearching && (
            <TouchableOpacity onPress={() => setCurrentSection("boards")}>
              <View style={styles.mytutorsContainer}>
                <View style={styles.mytutorsContainerTitle}>
                  <BookOpenReaderIcon width={wp("13.33%")} height={wp("13.33%")} color="#ffffff" />
                  <Text style={styles.titleText}>My Tutors</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          {(!isSearching || displaySpotlightSubject.length > 0) && (
            <View style={styles.spotlight}>
              {!isSearching && (
                <View style={styles.spotlightHeader}>
                  <View style={{ flexDirection: "row", gap: wp("4%") }}>
                    <View style={styles.spotlightT}>
                      <Text style={styles.tutors}>Tutors</Text>
                      <Text style={styles.spot}>Spotlight</Text>
                      <Animated.Text style={[styles.trend, { opacity: blinkAnim }]}>Trending</Animated.Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setCurrentSection("spotlight")}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
              )}
              {displaySpotlightSubject.length > 0 ? (
                !isSearching
                  ? <MarqueeTeacherList teachers={displaySpotlightSubject} isSkill={false} />
                  : <View style={styles.searchResultsList}>
                    {displaySpotlightSubject.map((item) => (
                      <TouchableOpacity key={item.email} style={styles.searchTeacherCard} onPress={() => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails", params: { name: item.name, email: item.email, language: item.language, profilePic: item.profilePic } })}>
                        <Image source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")} style={styles.searchTeacherImage} resizeMode="cover" />
                        <View style={styles.searchTeacherInfo}>
                          <Text style={styles.teacherName}>{item.name}</Text>
                          <Text style={styles.teacherSub}>{item.tutions?.[0]?.subject || "Basic Subject"}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
              ) : isSearching ? (
                <View style={styles.noResultsContainer}><Text style={styles.noResultsText}>No teachers found for "{searchQuery}"</Text></View>
              ) : null}
            </View>
          )}
          {!isSearching && (
            <>
              <Image source={require("../../../assets/images/growsmart.png")} style={{ width: '100%', height: 200 }} resizeMode="cover" />
              <TouchableOpacity onPress={() => setCurrentSection("skill")}>
                <View style={styles.mytutorsContainer}>
                  <View style={styles.mytutorsContainerTitle}>
                    <BookOpenReaderIcon width={50} height={50} color="#ffffff" />
                    <Text style={styles.titleText}>Skill Classes</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
          {(!isSearching || displaySpotlightSkill.length > 0) && (
            <View style={styles.spotlight}>
              {!isSearching && (
                <View style={styles.spotlightHeader}>
                  <View style={{ flexDirection: "row", gap: 15 }}>
                    <View style={styles.spotlightT}>
                      <Text style={styles.tutors}>Skill</Text>
                      <Text style={styles.spot}>Spotlight</Text>
                      <Animated.Text style={[styles.trend, { opacity: blinkAnim }]}>Trending</Animated.Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setCurrentSection("skillspotlight")}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
                </View>
              )}
              {displaySpotlightSkill.length > 0 ? (
                !isSearching
                  ? <MarqueeTeacherList teachers={displaySpotlightSkill} isSkill={true} reverseDirection={true} />
                  : <View style={styles.searchResultsList}>
                    {displaySpotlightSkill.map((item) => (
                      <TouchableOpacity key={item.email} style={styles.searchTeacherCard} onPress={() => router.push({ pathname: "/(tabs)/StudentDashBoard/TeacherDetails", params: { name: item.name, email: item.email, profilepic: item.profilePic } })}>
                        <Image source={item.profilePic ? { uri: item.profilePic } : require("../../../assets/images/Profile.png")} style={styles.searchTeacherImage} resizeMode="cover" />
                        <View style={styles.searchTeacherInfo}>
                          <Text style={styles.teacherName}>{item.name}</Text>
                          <Text style={styles.teacherSub}>Skill Teacher</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
              ) : isSearching ? (
                <View style={styles.noResultsContainer}><Text style={styles.noResultsText}>No skill teachers found for "{searchQuery}"</Text></View>
              ) : null}
            </View>
          )}
          {!isSearching && (
            <View style={styles.offerBanner}>
              <Image source={require("../../../assets/image/offer-banner.png")} style={styles.offerImage} resizeMode="cover" />
            </View>
          )}
        </ContainerComponent>
      </View>
    );
  };

  const snapTo = (idx: number) => {
    if (isSwipeLocked.current || currentScreenIndex === idx) return;
    isSwipeLocked.current = true;
    Animated.spring(swipeAnim, { toValue: -width * idx, useNativeDriver: true, tension: 100, friction: 8, overshootClamping: true, restSpeedThreshold: 0.1, restDisplacementThreshold: 0.1 }).start(() => { isSwipeLocked.current = false; setCurrentScreenIndex(idx); });
  };

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        <Animated.View style={[styles.swipeContent, { transform: [{ translateX: swipeAnim }], width: width * SCREEN_COUNT }]} {...panResponder.panHandlers}>
          <View style={[styles.screen, { width }]}><LeftScreen /></View>
          <View style={[styles.screen, { width }]}>
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}><Text style={styles.logoText}>GROWSMART</Text></View>
              <View style={styles.topRow}>
                <TouchableOpacity onPress={() => setIsSidebarVisible(true)} style={styles.profileContainer}>
                  <Image style={styles.profileImage} source={profileImage ? { uri: profileImage } : require("../../../assets/images/Profile.png")} />
                </TouchableOpacity>
                <View style={styles.centerSection}>
                  <View style={styles.searchInputContainer}>
                    <Image style={styles.searchIcon} source={require("../../../assets/images/Search.png")} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search teachers"
                      placeholderTextColor="#82878F"
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                        if (text.trim() === "") { setIsSearching(false); setShowAiText(false); setPage(1); setHasMoreData(true); fetchTeachers(false); }
                      }}
                      returnKeyType="search"
                      onSubmitEditing={() => { if (searchQuery.trim()) { setIsSearching(true); setShowAiText(false); setPage(1); setHasMoreData(true); fetchTeachers(false); } }}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => { setSearchQuery(""); setIsSearching(false); setShowAiText(false); setPage(1); setHasMoreData(true); fetchTeachers(false); }} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/StudentNotification")} style={styles.notificationButton}>
                  <View style={{ position: "relative" }}>
                    <NotificationBellIcon size={wp("6.4%")} />
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}><Text style={styles.notificationText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.contentContainer}>{renderContent()}</View>
          </View>
          <View style={[styles.screen, { width }]}><RightScreen /></View>
        </Animated.View>

        <View style={styles.swipeIndicators}>
          <View style={styles.indicatorContainer}>
            {(['Teachers', 'Home', 'Thoughts'] as const).map((label, idx) => (
              <TouchableOpacity key={label} style={[styles.indicatorDot, currentScreenIndex === idx && styles.activeIndicatorDot]} onPress={() => snapTo(idx)}>
                <Text style={[styles.indicatorText, currentScreenIndex === idx && styles.activeIndicatorText]}>{label}</Text>
              </TouchableOpacity>
            ))}
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
          if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail: storedUserEmail, userType: userRole } });
          if (itemName === "My Tuitions") setCurrentSection("myTeachers");
          if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
          if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName, profileImage } });
          if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } });
          if (itemName === "Terms") router.push({ pathname: "/(tabs)/StudentDashBoard/TermsAndConditions" });
          if (itemName === "Contact Us") router.push({ pathname: "/(tabs)/Contact" });
          if (itemName === "Privacy Policy") router.push({ pathname: "/(tabs)/StudentDashBoard/PrivacyPolicy" });
        }}
      />
      <BottomNavigation userType="student" />
    </View>
  );
}

// ─── ANDROID STYLES ───────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  screen: { flex: 1 },
  swipeContainer: { flex: 1, overflow: "hidden", backgroundColor: "#fff" },
  swipeContent: { flex: 1, flexDirection: "row", height: "100%" },
  fullScreenContainer: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, backgroundColor: '#fff' },
  topHeader: { backgroundColor: "#5f5fff", paddingTop: STATUS_BAR_HEIGHT + (SCREEN_HEIGHT * 0.015), paddingBottom: SCREEN_HEIGHT * 0.015, paddingHorizontal: SCREEN_WIDTH * 0.065 },
  topHeaderContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: SCREEN_HEIGHT * 0.05, width: '100%', marginBottom: SCREEN_HEIGHT * 0.01 },
  leftSection: { width: wp('12%'), justifyContent: 'center', alignItems: 'flex-start' },
  centerSection: { flex: 1, marginHorizontal: wp("2%") },
  centerContent: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  rightSection: { width: wp('12%'), justifyContent: 'center', alignItems: 'flex-end' },
  growsmartText: { color: '#e5e7eb', fontSize: wp('3.78%'), fontFamily: 'Poppins_400Regular', fontWeight: '500', textAlign: 'center', letterSpacing: wp('0.15%') },
  searchBarInHeader: { marginTop: SCREEN_HEIGHT * 0.005 },
  searchBarContainer: { paddingHorizontal: wp("4.8%"), paddingVertical: hp("1%"), backgroundColor: "#fff" },
  headerContainer: { backgroundColor: "#5f5fff", paddingHorizontal: wp("4.8%"), paddingTop: hp("5%"), paddingBottom: hp("3%"), borderBottomLeftRadius: wp("4.53%"), borderBottomRightRadius: wp("4.53%") },
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
  logoContainer: { alignItems: 'center', width: '100%', marginBottom: hp('1%') },
  logoText: { color: '#e5e7eb', fontSize: wp('4%'), fontWeight: '500', lineHeight: hp('1.6%'), textAlign: 'center', letterSpacing: wp('0.2%'), top: hp('2%'), bottom: hp('3%'), marginBottom: hp('1%') },
  profileContainer: { justifyContent: "center", alignItems: "center", marginRight: wp("2%"), borderWidth: 1, borderColor: 'white', borderRadius: 100 },
  profileImage: { width: wp("12%"), height: wp("12%"), borderRadius: wp("6%") },
  searchRow: { flex: 1, marginHorizontal: wp("2%") },
  searchInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f1f1", paddingHorizontal: wp("2%"), borderRadius: wp("4.27%"), height: wp("10%") },
  searchIcon: { width: wp("4%"), height: wp("4%"), marginRight: wp("2%"), tintColor: "#000" },
  searchInput: { flex: 1, fontSize: wp("3.73%"), color: "#000", height: "100%", borderWidth: 0, outlineWidth: 0, width: "100%", paddingVertical: 0, paddingRight: wp("2%"), borderRadius: wp("4.27%"), textAlign: "left", backgroundColor: "transparent" },
  clearButton: { padding: wp("1%"), borderRadius: wp("2%") },
  clearButtonText: { fontSize: wp("3.2%"), color: "#82878F", fontWeight: "bold" },
  questionButton: { padding: wp("1%"), marginLeft: wp("1%") },
  notificationButton: { padding: wp("1.5%"), borderRadius: wp("2%"), backgroundColor: "rgba(255,255,255,0.1)", position: "relative" },
  notificationBadge: { position: "absolute", top: -3, right: -3, backgroundColor: "#FF3B30", borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", paddingHorizontal: 4, zIndex: 1000, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  notificationText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textAlign: "center", includeFontPadding: false },
  spotlightT: { flexDirection: "row", alignItems: "center", gap: wp("0.8%"), flexShrink: 1 },
  tutors: { color: "#454358", fontSize: wp("5.33%"), fontWeight: "500", fontFamily: "Poppins_400Regular", lineHeight: hp("4%") },
  spot: { color: "#03070e", fontSize: wp("5.33%"), fontWeight: "600", fontFamily: "Poppins_600SemiBold", lineHeight: hp("4%"), flexShrink: 1, flexWrap: "nowrap" },
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
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: wp("4%"), marginTop: hp('0.5%') },
  swipeIndicators: { position: 'absolute', bottom: hp('2%'), left: 0, right: 0, alignItems: 'center', paddingHorizontal: wp('4%') },
  indicatorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: wp('5%'), paddingHorizontal: wp('3%'), paddingVertical: hp('1%') },
  indicatorDot: { paddingHorizontal: wp('3%'), paddingVertical: hp('0.8%'), borderRadius: wp('3%'), marginHorizontal: wp('1%'), backgroundColor: 'rgba(255, 255, 255, 0.3)' },
  activeIndicatorDot: { backgroundColor: '#5f5fff' },
  indicatorText: { fontSize: wp('3%'), fontFamily: 'Poppins_400Regular', color: '#ffffff', textAlign: 'center' },
  activeIndicatorText: { color: '#ffffff', fontFamily: 'Poppins_600SemiBold' },
});

// ─── WEB-ONLY STYLES ─────────────────────────────────────────────────────────
const ws = StyleSheet.create({
  // Header
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#4A7BF7', fontFamily: 'Poppins_700Bold', marginRight: 28, minWidth: 120 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, maxWidth: 520 },
  searchInput: { flex: 1, fontSize: 13, color: '#333', fontFamily: 'Poppins_400Regular' },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' as any },
  headerUsername: { fontSize: 14, color: '#333', fontFamily: 'Poppins_400Regular', marginRight: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#bbb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ─── Left Sidebar ────────────────────────────────────────────────────────────
  leftSidebar: { width: 2, borderRightWidth: 1, borderRightColor: '#eee', backgroundColor: '#fff', paddingTop: 6 },

  // Nav items – flat list, no sub-items
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  navText: { fontSize: 12, color: '#333', marginLeft: 8, fontFamily: 'Poppins_400Regular' },
  // kept for TS compat (not used in new sidebar but may exist elsewhere)
  navBold: { fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  subNav: { paddingLeft: 46, paddingBottom: 2 },
  subNavItem: { paddingVertical: 7 },
  subNavText: { fontSize: 12, color: '#666', fontFamily: 'Poppins_400Regular' },

  // Section divider line
  divider: { height: 1, backgroundColor: '#eeeeee', marginVertical: 6, marginHorizontal: 0 },

  // "Favorites" bold section header
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 10, paddingTop: 4, paddingBottom: 3 },

  // Profile avatar thumbnail in sidebar
  sidebarAvatarThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  // Advertising card – "Advertising" label lives INSIDE the card
  adCard: { margin: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e8e8e8', padding: 6, backgroundColor: '#fff' },
  adSectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  adImg: { width: '100%', height: 95, borderRadius: 6 },
  adTitle: { fontSize: 13, fontWeight: 'bold', color: '#222', paddingTop: 8, fontFamily: 'Poppins_600SemiBold' },
  adDesc: { fontSize: 11, color: '#777', paddingTop: 4, paddingBottom: 4, lineHeight: 16, fontFamily: 'Poppins_400Regular' },

  // Main
  main: { flex: 1, backgroundColor: '#f4f6fb', paddingHorizontal: 12, paddingTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e8e8e8', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', fontFamily: 'Poppins_600SemiBold' },
  seeAll: { fontSize: 13, color: '#4A7BF7', fontFamily: 'Poppins_400Regular' },
  catChip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5, marginRight: 8 },
  catText: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  tutorCard: { alignItems: 'center', marginRight: 16, width: 90 },
  tutorChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 8, alignItems: 'center' },
  tutorChipText: { fontSize: 9, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  tutorImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 5 },
  tutorName: { fontSize: 11, textAlign: 'center', color: '#333', fontFamily: 'Poppins_400Regular' },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ddd', marginHorizontal: 3 },
  dotActive: { backgroundColor: '#444', width: 20, borderRadius: 4 },

  // Spotlight cards
  spotCard: { width: 240, height: 280, marginRight: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  spotBg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  spotDim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  spotOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.62)' },
  spotBadge: { backgroundColor: '#FF6600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  spotBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', fontFamily: 'Poppins_600SemiBold' },
  spotSubject: { color: '#eee', fontSize: 11, fontFamily: 'Poppins_400Regular', marginBottom: 1 },
  spotRating: { color: '#eee', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  spotName: { color: '#fff', fontSize: 13, fontWeight: 'bold', fontFamily: 'Poppins_700Bold', marginBottom: 3 },
  spotDesc: { color: '#ddd', fontSize: 10, fontFamily: 'Poppins_400Regular', marginBottom: 8, lineHeight: 14 },
  spotPrice: { color: '#fff', fontSize: 12, fontWeight: 'bold', fontFamily: 'Poppins_600SemiBold' },
  viewBtn: { backgroundColor: '#4A7BF7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  viewBtnText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Right sidebar – Thoughts
  rightSidebar: { width: 10, borderLeftWidth: 1, borderLeftColor: '#eee', backgroundColor: '#fff', paddingHorizontal: 6, paddingTop: 10 },
  thoughtsTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A7BF7', fontFamily: 'Poppins_700Bold', marginBottom: 8 },
  thoughtCard: { borderWidth: 1, borderColor: '#eee', borderRadius: 6, padding: 6, marginBottom: 6, backgroundColor: '#fff' },
  thoughtRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  thoughtAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  avatarPlaceholder: { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', fontFamily: 'Poppins_600SemiBold' },
  thoughtAuthor: { fontSize: 13, fontWeight: 'bold', color: '#222', fontFamily: 'Poppins_600SemiBold' },
  thoughtTime: { fontSize: 11, color: '#aaa', marginTop: 2, fontFamily: 'Poppins_400Regular' },
  thoughtBody: { fontSize: 11, color: '#333', lineHeight: 16, marginBottom: 4, fontFamily: 'Poppins_400Regular' },
  thoughtFullImg: { width: '100%', height: 100, borderRadius: 4 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  tagText: { fontSize: 11, color: '#6366F1', fontFamily: 'Poppins_400Regular' },
  thoughtFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionTxt: { fontSize: 12, color: '#555', fontFamily: 'Poppins_400Regular' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, width: '85%', maxWidth: 500, maxHeight: '80%', padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', fontFamily: 'Poppins_600SemiBold' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#1F2937' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  postBtn: { backgroundColor: '#4A7BF7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 10 },
  reportInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 80, fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#1F2937', textAlignVertical: 'top' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  reportBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EF4444' },
});
