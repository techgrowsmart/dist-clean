import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import ThoughtsCard from './ThoughtsCard';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular } from "@expo-google-fonts/open-sans";
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import Sidebar from "./Sidebar";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebNavbar from "../../../components/ui/WebNavbar";
import ResponsiveSidebar from "../../../components/ui/ResponsiveSidebar";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import { safeBack } from "../../../utils/navigation";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const { width } = Dimensions.get("window");
const COLORS = { primary: '#3B5BFE', lightBackground: '#F5F7FB', cardBackground: '#FFFFFF', border: '#E5E7EB', blueBorder: '#D4DEFF', textPrimary: '#1F2937', textSecondary: '#6B7280', white: '#FFFFFF', paginationActiveBg: '#374151', paginationInactiveBg: '#E5E7EB', paginationInactiveTxt: '#6B7280', headerTxt: '#000000' };

const ITEMS_PER_PAGE = 6;

// --- Helper function to get subject-specific images (using exact images from Class8SubjectsScreen) ---
const getSubjectImage = (subjectName: string) => {
  const name = subjectName.toLowerCase();
  
  // Mathematics - exact image from Class8SubjectsScreen
  if (name.includes('math') || name.includes('calculation')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80';
  }
  
  // Science - exact image from Class8SubjectsScreen
  if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&q=80';
  }
  
  // Geography - exact image from Class8SubjectsScreen
  if (name.includes('geography') || name.includes('geo')) {
    return 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80';
  }
  
  // History - exact image from Class8SubjectsScreen
  if (name.includes('history') || name.includes('histor')) {
    return 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80';
  }
  
  // English - exact image from Class8SubjectsScreen
  if (name.includes('english')) {
    return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80';
  }
  
  // Language - exact image from Class8SubjectsScreen
  if (name.includes('language') || name.includes('literature') || name.includes('writing')) {
    return 'https://images.unsplash.com/photo-1517842645767-db50dd7f8ad8?w=400&q=80';
  }
  
  // Computer - exact image from Class8SubjectsScreen
  if (name.includes('computer') || name.includes('coding') || name.includes('programming') || name.includes('tech')) {
    return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80';
  }
  
  // Default - use the Mathematics image as fallback (same as Class8SubjectsScreen)
  return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80';
};

// --- Components from Class8SubjectsScreen ---
const Banner = () => (
  <View style={styles.bannerContainer}>
    <Image source={{ uri: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&q=80' }} style={styles.bannerImage} />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerSmallText}>Knowledge is power</Text>
      <Text style={styles.bannerLargeText}>Learn relentlessly</Text>
    </View>
  </View>
);

const SubjectCard = ({ item, onPress }: { item: { id: string, name: string, image: string }, onPress?: () => void }) => (
  <TouchableOpacity style={styles.subjectCardWrapper} onPress={onPress}>
    <ImageBackground 
      source={{ uri: item.image }} 
      style={styles.subjectCardImageBg} 
      imageStyle={{ borderRadius: 14 }}
      resizeMode="cover"
    >
      <View style={styles.subjectCardGradientOverlay}>
        <Text style={styles.subjectCardCenterText}>{item.name}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

export default function SubjectSelection({
  selectedClass,
  boardId: propBoardId,
  classId: propClassId,
  boardName: propBoardName,
  className: propClassName,
  onBack,
  onSubjectSelect,
}: {
  selectedClass?: { classId: string; className: string };
  boardId?: string;
  classId?: string;
  boardName?: string;
  className?: string;
  onBack?: () => void;
  onSubjectSelect?: (selectedSubject: string) => void;
}) {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  
  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;
  
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Roboto_500Medium, OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular, Montserrat_400Regular });

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Home");
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | any>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      safeBack(router, '/(tabs)/StudentDashBoard/ClassSelection');
    }
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
  }, [onBack]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'comment'>('post');
  const [reportItemId, setReportItemId] = useState('');
  const [reportReason, setReportReason] = useState('');
  
  // Get data from props or route params
  // Support both regular board flow and university flow
  const finalBoardId = propBoardId || (localParams.boardId as string) || (localParams.universityId as string) || '';
  const finalClassId = propClassId || (localParams.classId as string) || '';
  const finalBoardName = propBoardName || (localParams.boardName as string) || (localParams.universityName as string) || '';
  const finalClassName = propClassName || (localParams.className as string) || '';
  
  // Extract university-specific parameters
  const universityId = localParams.universityId as string;
  const universityName = localParams.universityName as string;
  const year = localParams.year as string;
  const yearIndex = localParams.yearIndex as string;
  
  // Check if this is a university flow
  const isUniversityFlow = localParams.isUniversities === 'true' || localParams.isUniversity === 'true' || universityId !== undefined;
  
  // Fallback to selectedClass prop if main props are undefined
  const fallbackClassId = selectedClass?.classId || '';
  const fallbackClassName = selectedClass?.className || '';
  
  const effectiveBoardId = finalBoardId || '';
  const effectiveClassId = finalClassId || fallbackClassId;
  const effectiveBoardName = finalBoardName || '';
  const effectiveClassName = finalClassName || fallbackClassName;
  
  // For universities, extract the yearId from the classId
  // ClassSelection creates IDs like: ${universityId}_year_${yearIndex}
  // Backend expects just the yearId
  const effectiveYearId = isUniversityFlow && effectiveClassId.includes('_year_') 
    ? effectiveClassId.split('_year_')[1] 
    : effectiveClassId;
  
  console.log('🔍 SubjectSelection Props Debug:', {
    propBoardId,
    propClassId,
    propBoardName,
    propClassName,
    localParams,
    selectedClass,
    finalBoardId,
    finalClassId,
    finalBoardName,
    finalClassName,
    fallbackClassId,
    fallbackClassName,
    effectiveBoardId,
    effectiveClassId,
    effectiveBoardName,
    effectiveClassName
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectList, setSubjectList] = useState<
    { id: string; name: string; teacherCount?: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      console.log('🔍 SubjectSelection params:', {
        effectiveBoardId,
        effectiveClassId,
        effectiveYearId,
        effectiveBoardName,
        effectiveClassName,
        isUniversityFlow,
        universityId,
        year
      });

      if (!effectiveBoardId || !effectiveClassId) {
        console.error('❌ Missing boardId/universityId or classId/yearId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        let res;
        if (isUniversityFlow) {
          // University flow: use university-specific endpoint
          const url = `${BASE_URL}/api/teachers/universities/${effectiveBoardId}/years/${effectiveYearId}/subjects`;
          console.log('📡 Making UNIVERSITY API request to:', url);
          res = await axios.post(url, {}, { headers });
        } else {
          // Regular board flow
          console.log('📡 Making BOARD API request to:', `${BASE_URL}/api/boardId/classes`);
          console.log('📤 Request body:', { boardId: effectiveBoardId, classId: effectiveClassId });
          res = await axios.post(
            `${BASE_URL}/api/boardId/classes`,
            { boardId: effectiveBoardId, classId: effectiveClassId },
            { headers }
          );
        }

        console.log('📚 Backend subjects response:', res.data);

        // Ensure we have subjects array and properly map the data
        const subjectsArray = res.data.subjects || [];
        console.log('🎯 Raw subjects array:', subjectsArray);

        const subjectsWithCount = subjectsArray.map((subject: any) => ({
          id: subject.id || '',
          name: subject.name || '',
          teacherCount: subject.teacherCount || 0
        }));

        console.log('✅ Final subjects with teacher counts:', subjectsWithCount);

        setSubjectList(subjectsWithCount);
      } catch (err : any) {
        console.error("❌ Failed to fetch subjects:", err.message);
        console.error("❌ Full error:", err);
        if (err.response) {
          console.error("❌ Response status:", err.response.status);
          console.error("❌ Response data:", err.response.data);
        }
        setSubjectList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [effectiveBoardId, effectiveClassId, effectiveBoardName, effectiveClassName, isUniversityFlow]);

  // ── Load user role ──
  useEffect(() => {
    const loadUserRole = async () => {
      try { const storedRole = await AsyncStorage.getItem("user_role"); if (storedRole) setUserRole(storedRole); } catch {}
    };
    loadUserRole();
  }, []);

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

  // ── Handlers ──
  const handleSidebarItemPress = (itemName: string) => {
    setActiveMenu(itemName);
    setSidebarActiveItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Class Selection") router.push("/(tabs)/StudentDashBoard/ClassSelection");
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

  if (!fontsLoaded) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  const totalPages = Math.ceil(subjectList.length / ITEMS_PER_PAGE);
  const paginatedData = subjectList.length > 0 ? subjectList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) : [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPagination = () => (
    <View style={styles.paginationWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pagination}
        style={{ overflow: 'visible' }}
      >
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.arrows}
        >
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity
            key={page}
            onPress={() => handlePageChange(page)}
            style={styles.page}
          >
            <View
              style={[
                styles.pageNumber,
                currentPage === page && styles.activePage,
              ]}
            >
              <Text style={styles.pageNum}>{page}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={styles.rightArrow}
        >
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResponsiveSidebar
        activeItem={sidebarActiveItem}
        onItemPress={handleSidebarItemPress}
        userEmail={userEmail || ""}
        studentName={studentName || "Student"}
        profileImage={profileImage}
      >
        {/* ── MAIN AREA ── */}
        <View style={styles.mainLayout}>

          {/* ── CONTENT COLUMNS ── */}
          <View style={styles.contentColumns}>

            {/* CENTER: Subject Selection Content */}
            <View style={styles.centerContent}>
              {isDesktop ? (
                // WEB: Beautiful UI from Class8SubjectsScreen
                <ImageBackground 
                  source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
                  style={{ flex: 1 }}
                  imageStyle={{ opacity: 0.15 }}
                >
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
                    
                    {/* Navigation Title Header */}
                    <View style={styles.pageNavHeader}>
                      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.pageTitle}>{effectiveBoardName} | {effectiveClassName} - Subjects</Text>
                    </View>

                    {/* Main Bounded Container */}
                    <View style={styles.boxContainer}>
                      
                      {/* Subject Grid with Real Data */}
                      <View style={styles.gridContainer}>
                        {subjectList.length > 0 ? (
                          subjectList.map((subject) => (
                            <SubjectCard 
                              key={subject.id} 
                              item={{ 
                                id: subject.id, 
                                name: subject.name, 
                                image: getSubjectImage(subject.name)
                              }} 
                              onPress={() => {
                                console.log("subjectssss:", subject.id);
                                console.log("subjectssss:", subject.name);
                                if (onSubjectSelect) {
                                  onSubjectSelect(subject.name);
                                } else {
                                  // Navigate to next screen or handle selection when accessed as standalone route
                                  // Pass all context params to ensure proper navigation back/forth
                                  const params: any = {
                                    boardName: effectiveBoardName,
                                    boardId: effectiveBoardId,
                                    selectedClass: effectiveClassName,
                                    classId: effectiveClassId,
                                    selectedSubject: subject.name,
                                    subjectId: subject.id,
                                  };
                                  // Add university flag for university flow
                                  if (isUniversityFlow) {
                                    params.isUniversity = 'true';
                                    params.universityId = effectiveBoardId;
                                    params.universityName = effectiveBoardName;
                                    params.yearId = effectiveClassId;
                                    params.yearName = effectiveClassName;
                                  }
                                  router.push({
                                    pathname: "/(tabs)/StudentDashBoard/TeachersList",
                                    params,
                                  } as any);
                                }
                              }}
                            />
                          ))
                        ) : (
                          !loading && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: COLORS.textSecondary }}>
                                {effectiveBoardId && effectiveClassId ? 'No subjects found' : 'Please select board and class first'}
                              </Text>
                            </View>
                          )
                        )}
                      </View>

                      {/* Hero Banner */}
                      <Banner />

                    </View>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <View style={styles.paginationRow}>
                        <TouchableOpacity style={styles.pageBtnInactiveArrow} onPress={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                          <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <TouchableOpacity 
                            key={page}
                            style={currentPage === page ? styles.pageBtnActive : styles.pageBtnInactive}
                            onPress={() => handlePageChange(page)}
                          >
                            <Text style={currentPage === page ? styles.pageBtnUserTextActive : styles.pageBtnUserTextInactive}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity style={styles.pageBtnInactiveArrow} onPress={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                          <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    )}

                  </ScrollView>
                </ImageBackground>
              ) : (
                // MOBILE: Keep current UI unchanged
                <View style={styles.gridContainerBox}>
                  <ScrollView contentContainerStyle={styles.subjectSelectionScroll} showsVerticalScrollIndicator={false}>
                    
                    {/* Navigation Title Header */}
                    <View style={styles.pageNavHeader}>
                      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.pageTitle}>{effectiveBoardName} | {effectiveClassName} - Subjects</Text>
                    </View>

                    <View style={styles.totalCountContainer}>
                      <Text style={styles.totalCount}>
                        {subjectList.length} Subjects Found
                      </Text>
                    </View>

                    <FlatList
                      data={paginatedData}
                      keyExtractor={(item, index) => item.id + index}
                      ListEmptyComponent={() => {
                        if (loading) {
                          return (
                            <View style={styles.emptyContainer}>
                              <ActivityIndicator size="large" color="#4255ff" />
                            </View>
                          );
                        }
                        
                        if (!effectiveBoardId || !effectiveClassId) {
                          return (
                            <View style={styles.emptyContainer}>
                              <Text style={styles.emptyText}>Please select board and class first</Text>
                            </View>
                          );
                        }
                        
                        if (subjectList.length === 0) {
                          return (
                            <View style={styles.emptyContainer}>
                              <Text style={styles.emptyText}>No subjects found for this selection</Text>
                            </View>
                          );
                        }
                        
                        return null;
                      }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.card}
                          onPress={() => {
                            console.log("subjectssss:", item.id);
                            console.log("subjectssss:", item.name);
                            if (onSubjectSelect) {
                              onSubjectSelect(item.name);
                            } else {
                              // Navigate to next screen or handle selection when accessed as standalone route
                              // Pass all context params to ensure proper navigation back/forth
                              const params: any = {
                                boardName: effectiveBoardName,
                                boardId: effectiveBoardId,
                                selectedClass: effectiveClassName,
                                classId: effectiveClassId,
                                selectedSubject: item.name,
                                subjectId: item.id,
                              };
                              // Add university flag for university flow
                              if (isUniversityFlow) {
                                params.isUniversities = 'true';
                                params.universityId = effectiveBoardId;
                                params.universityName = effectiveBoardName;
                                params.yearId = effectiveYearId;
                                params.yearName = effectiveClassName;
                                params.year = year;
                                params.yearIndex = yearIndex;
                              }
                              router.push({
                                pathname: "/(tabs)/StudentDashBoard/TeachersList",
                                params,
                              } as any);
                            }
                          }}
                        >
                          <View style={styles.cardContent}>
                            <Image
                              source={require("../../../assets/images/Profile.png")}
                              style={styles.cardImage}
                            />
                            <View style={styles.textContainer}>
                              <Text style={styles.cardTitle}>{item.name}</Text>
                              <Text style={styles.cardSubtitle}>
                                {item.teacherCount || 0} Teachers Available
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#4255ff" />
                          </View>
                        </TouchableOpacity>
                      )}
                      ListFooterComponent={() => (
                        totalPages > 1 ? renderPagination() : null
                      )}
                      scrollEnabled={false}
                    />

                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      </ResponsiveSidebar>

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
  subjectSelectionScroll: { paddingBottom: 20 },
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 12,
  },
  totalCountContainer: { marginBottom: 20 },
  totalCount: { fontFamily: 'Poppins_500Medium', fontSize: 16, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardImage: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  textContainer: { flex: 1 },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textSecondary },
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
  paginationWrapper: { alignItems: "center", marginTop: 20 },
  pagination: { alignItems: "center", flexDirection: "row" },
  arrows: { backgroundColor: "#e0e0e0", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 8 },
  rightArrow: { backgroundColor: "#e0e0e0", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: 8 },
  arrowText: { fontSize: 16, color: "#000000", fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  page: { marginHorizontal: 4 },
  pageNumber: { 
    alignItems: "center", 
    justifyContent: "center", 
    height: 32, 
    width: 32, 
    paddingHorizontal: 8, 
    borderRadius: 5, 
    backgroundColor: "#ffffff", 
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  pageNum: { fontSize: 14, color: "#000000ff", fontFamily: 'Poppins_600SemiBold' },
  activePage: { color: "#000000", elevation: 1 },
  
  // --- Web-specific styles from Class8SubjectsScreen ---
  centerContentScroll: { padding: 32, paddingBottom: 60 },
  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 24,
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  subjectCardWrapper: {
    width: '31.5%',  // Ensures exact spacing logic mapped 3 wide
    height: 120,
    marginBottom: 0,
    borderRadius: 14,
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  subjectCardImageBg: {
    width: '100%',
    height: '100%',
  },
  subjectCardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', // Gradient map fallback approximation mapping standard requirements natively
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectCardCenterText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 16,
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'flex-end',
  },
  bannerSmallText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerLargeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pageBtnInactiveArrow: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnActive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationActiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnInactive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationInactiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnUserTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  pageBtnUserTextInactive: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.paginationInactiveTxt },
});