import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    useFonts,
} from '@expo-google-fonts/poppins';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import WebSidebar from '../../../components/ui/WebSidebar';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import ThoughtsCard from './ThoughtsCard';

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  lightBackground: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  paginationActiveBg: '#374151',
  paginationInactiveBg: '#E5E7EB',
  paginationInactiveTxt: '#6B7280',
  headerTxt: '#000000',
};

// Development mode flag
const IS_DEVELOPMENT_MODE = true; // Set to false in production

// --- Mock Data for Fallback ---
const getMockSubjects = (boardId: string, classId: string) => {
  const mockData: { [key: string]: { [key: string]: { id: string; name: string; teacherCount: number; }[] } } = {
    'board_cbse': {
      'cbse_class_8': [
        { id: 'cbse_class_8_subject_1', name: 'English', teacherCount: 12 },
        { id: 'cbse_class_8_subject_2', name: 'Maths', teacherCount: 15 },
        { id: 'cbse_class_8_subject_3', name: 'Social Studies', teacherCount: 8 },
        { id: 'cbse_class_8_subject_4', name: 'Science', teacherCount: 10 },
        { id: 'cbse_class_8_subject_5', name: 'Hindi', teacherCount: 9 },
        { id: 'cbse_class_8_subject_6', name: 'Physics', teacherCount: 7 },
        { id: 'cbse_class_8_subject_7', name: 'Biology', teacherCount: 6 },
      ],
    },
    'board_icse': {
      'icse_class_8': [
        { id: 'icse_class_8_subject_1', name: 'English', teacherCount: 10 },
        { id: 'icse_class_8_subject_2', name: 'Maths', teacherCount: 12 },
        { id: 'icse_class_8_subject_3', name: 'Physics', teacherCount: 8 },
        { id: 'icse_class_8_subject_4', name: 'Chemistry', teacherCount: 7 },
        { id: 'icse_class_8_subject_5', name: 'Biology', teacherCount: 9 },
        { id: 'icse_class_8_subject_6', name: 'History', teacherCount: 5 },
        { id: 'icse_class_8_subject_7', name: 'Geography', teacherCount: 6 },
      ],
    },
  };
  
  return mockData[boardId]?.[classId] || [];
};

const ITEMS_PER_PAGE = 6;

const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

// --- Banner Component ---
const Banner = () => (
  <View style={styles.bannerContainer}>
    <Image 
      source={{ uri: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&q=80' }} 
      style={styles.bannerImage} 
      resizeMode="cover"
    />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerSmallText}>Knowledge is power</Text>
      <Text style={styles.bannerLargeText}>Learn relentlessly</Text>
    </View>
  </View>
);

// --- Subject Card Component ---
const SubjectCard = ({ 
  item, 
  onPress 
}: { 
  item: { id: string; name: string; teacherCount?: number }; 
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.subjectCardWrapper} onPress={onPress}>
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80' }} 
      style={styles.subjectCardImageBg} 
      imageStyle={{ borderRadius: 14 }}
      resizeMode="cover"
    >
      <View style={styles.subjectCardGradientOverlay}>
        <Text style={styles.subjectCardCenterText}>{item.name}</Text>
        <Text style={styles.teacherCountText}>
          {item.teacherCount ?? 0} Teacher{(item.teacherCount ?? 0) !== 1 ? "s" : ""} available
        </Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

export default function Class8SubjectsScreenWrapper() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  
  // Get data from route params
  const boardId = (localParams.boardId as string) || '';
  const classId = (localParams.classId as string) || '';
  const boardName = (localParams.boardName as string) || '';
  const className = (localParams.className as string) || '';
  
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectList, setSubjectList] = useState<
    { id: string; name: string; teacherCount?: number }[]
  >([]);
  const [totalSubjectCount, setTotalSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Web state variables
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Subject Selection");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Subject Selection");
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
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

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      console.log('🔍 Class8SubjectsScreen params:', { boardId, classId, boardName, className });
      console.log('🌐 API URL:', `${BASE_URL}/api/boardId/classes`);
      
      if (!boardId || !classId) {
        console.error('❌ Missing boardId or classId');
        setLoading(false);
        return;
      }
      
      try {
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error("❌ No authentication token found");
          setLoading(false);
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };
        
        console.log('📡 Making API call to:', `${BASE_URL}/api/boardId/classes`);
        console.log('📤 Request body:', { boardId, classId });
        console.log('🔑 Auth token (first 20 chars):', auth.token.substring(0, 20) + '...');
        
        // Add timeout to prevent hanging
        const res = await Promise.race([
          axios.post(
            `${BASE_URL}/api/boardId/classes`,
            { boardId, classId },
            { 
              headers,
              timeout: 10000, // 10 second timeout
            }
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as any;
        
        console.log('📚 Backend subjects response:', res.data);
        console.log('📊 Response status:', res.status);
        console.log('📊 Response headers:', res.headers);
        
        // Use the subjectCount from backend response
        const backendSubjectCount = res.data.subjectCount || 0;
        const subjectsWithCount = (res.data.subjects || []).map((subject: { teacherCount: any; }) => ({
          ...subject,
          teacherCount: subject.teacherCount || 0
        }));
        
        console.log('🎯 Backend subjectCount:', backendSubjectCount);
        console.log('🎯 Subjects with real teacher counts:', subjectsWithCount);
        
        setSubjectList(subjectsWithCount);
        setTotalSubjectCount(backendSubjectCount);
      } catch (err : any) {
        console.error("❌ Failed to fetch subjects:", err.message);
        console.error("❌ Full error:", err);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        
        // Check if it's a network error (backend not reachable)
        if (IS_DEVELOPMENT_MODE && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('Network Error') || err.message.includes('Request timeout'))) {
          console.log("🔄 Backend not reachable or timeout, using mock data as fallback (Development Mode)");
          const mockSubjects = getMockSubjects(boardId, classId);
          console.log("📚 Using mock subjects:", mockSubjects);
          setSubjectList(mockSubjects);
          setTotalSubjectCount(mockSubjects.length);
        } else {
          // For other errors, set empty state
          setSubjectList([]);
          setTotalSubjectCount(0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [boardId, classId, boardName, className]);

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
    // Prioritize post.author.name first, then cache, then fallback
    let name = post.author?.name || cached.name || '';
    let pic: string | null = post.author?.profile_pic || cached.profilePic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author?.email?.split?.('@')[0] || 'User';
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
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  const totalPages = Math.ceil(subjectList.length / ITEMS_PER_PAGE);
  const paginatedData = subjectList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSubjectSelect = (subject: { id: string; name: string; teacherCount?: number }) => {
    console.log('Subject selected:', subject.name);
    console.log('Subject ID:', subject.id);
    // You can navigate to teacher selection or handle selection as needed
    // router.push('/teacher-selection');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── WEB HEADER - Full Width ── */}
      {isDesktop && (
        <View style={ws.header}>
          <Text style={ws.logo}>Growsmart</Text>
          <View style={ws.searchBar}>
            <FontAwesome name="search" size={14} color="#aaa" style={{ marginRight: 8 }} />
            <TextInput style={ws.searchInput} placeholder="Type in search" placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <View style={ws.headerRight}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/StudentDashBoard/StudentNotification")} style={{ marginRight: 18, position: 'relative' }}>
              <FontAwesome name="bell-o" size={20} color="#444" />
              {unreadCount > 0 && <View style={ws.notifBadge}><Text style={ws.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
            </TouchableOpacity>
            <Text style={ws.headerUsername}>{studentName || 'Ben Goro'}</Text>
            <View style={ws.headerAvatar}>
              {profileImage ? <Image source={{ uri: profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} /> : <FontAwesome name="user" size={18} color="#fff" />}
            </View>
          </View>
        </View>
      )}

      <View style={styles.rootContainer}>

        {/* ── MOBILE TOP NAVBAR ── */}
        {!isDesktop && (
          <View style={styles.mobileTopHeader}>
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

        {/* ── LEFT SIDEBAR (WebSidebar component — desktop only) ── */}
        {isDesktop && (
          <WebSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || "student@example.com"}
            studentName={studentName || "Student"}
            profileImage={profileImage}
          />
        )}

        {/* ── MAIN AREA ── */}
        <View style={styles.mainLayout}>

          {/* ── CONTENT COLUMNS ── */}
          <View style={styles.contentColumns}>

            {/* CENTER: Subject Selection Content */}
            <View style={styles.centerContent}>
              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.subjectSelectionScroll} showsVerticalScrollIndicator={false}>
                  <ImageBackground 
                    source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
                    style={{ flex: 1 }}
                    imageStyle={{ opacity: 0.15 }}
                  >
                    
                    {/* Navigation Title Header */}
                    <View style={styles.pageNavHeader}>
                      <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                      >
                        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.pageTitle}>
                        {className || 'Class 8'} | All ojfiv
                      </Text>
                    </View>

                    {/* Subject Count */}
                    <View style={styles.subjectCountContainer}>
                      <Text style={styles.subjectCountText}>
                        {totalSubjectCount} Subjects Found
                      </Text>
                    </View>

                    {/* Main Bounded Container */}
                    <View style={styles.boxContainer}>
                      
                      <View style={styles.gridContainer}>
                        {paginatedData.map(subject => (
                          <SubjectCard 
                            key={subject.id} 
                            item={subject} 
                            onPress={() => handleSubjectSelect(subject)}
                          />
                        ))}
                      </View>

                      {subjectList.length > 0 && <Banner />}

                    </View>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <View style={styles.paginationRow}>
                        <TouchableOpacity 
                          onPress={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={[
                            styles.pageBtnInactiveArrow,
                            currentPage === 1 && styles.disabledArrow
                          ]}
                        >
                          <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <TouchableOpacity
                            key={page}
                            onPress={() => handlePageChange(page)}
                            style={[
                              styles.pageBtnInactive,
                              currentPage === page && styles.pageBtnActive
                            ]}
                          >
                            <Text style={[
                              styles.pageBtnUserTextInactive,
                              currentPage === page && styles.pageBtnUserTextActive
                            ]}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity 
                          onPress={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={[
                            styles.pageBtnInactiveArrow,
                            currentPage === totalPages && styles.disabledArrow
                          ]}
                        >
                          <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    )}

                  </ImageBackground>
                </ScrollView>
              </View>
            </View>

            {/* RIGHT: Thoughts Panel (ThoughtsCard reused from Student.tsx) */}
            {isDesktop && (
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
                      onReport={(p, reasons, comment) => { console.log('Report submitted for post:', p.id, 'Reasons:', reasons, 'Comment:', comment); }}
                      getProfileImageSource={getProfileImageSource}
                      initials={initials}
                      resolvePostAuthor={resolvePostAuthor}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

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
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  rootContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.cardBackground },
  mainLayout: { flex: 1, backgroundColor: COLORS.lightBackground },
  contentColumns: { flex: 1, flexDirection: 'row' },

  // --- MOBILE TOP NAVBAR ---
  mobileTopHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: COLORS.cardBackground, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightBackground, 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    height: 36, 
    flex: 1, 
    marginRight: 12 
  },
  searchIcon: { marginRight: 8 },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    fontFamily: 'Poppins_400Regular' 
  },
  profileHeaderSection: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  bellIcon: { 
    marginRight: 12, 
    position: 'relative' 
  },
  notificationBadge: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    backgroundColor: 'red', 
    borderRadius: 10, 
    minWidth: 18, 
    height: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  notificationText: { 
    color: '#fff', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  headerUserName: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: COLORS.textPrimary, 
    marginRight: 8, 
    fontFamily: 'Poppins_500Medium' 
  },
  headerAvatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16 
  },

  // --- CENTER CONTENT ---
  centerContent: { flex: 1 },
  gridContainerBox: { flex: 1 },
  subjectSelectionScroll: { padding: 16 },
  
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  pageTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.headerTxt,
    fontFamily: 'Poppins_700Bold',
  },

  subjectCountContainer: {
    marginBottom: 16,
  },
  subjectCountText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 16,
    marginBottom: 16,
  },

  // --- SUBJECT GRID ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  subjectCard: {
    width: '48%',
    height: 120,
    marginBottom: 0,
    borderRadius: 14,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)',
    elevation: 3,
  },
  subjectCardImageBg: {
    width: '100%',
    height: '100%',
  },
  subjectCardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  subjectCardCenterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
  },
  teacherCountText: {
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    opacity: 0.9,
  },

  // --- HERO BANNER ---
  bannerContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 12,
    marginBottom: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'flex-end',
  },
  bannerSmallText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 3,
    fontFamily: 'Poppins_500Medium',
  },
  bannerLargeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  // --- PAGINATION ---
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pageBtnInactiveArrow: {
    width: 32, 
    height: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  disabledArrow: {
    opacity: 0.5,
  },
  pageBtnActive: {
    width: 34, 
    height: 34, 
    backgroundColor: COLORS.paginationActiveBg,
    borderRadius: 6, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  pageBtnInactive: {
    width: 34, 
    height: 34, 
    backgroundColor: COLORS.paginationInactiveBg,
    borderRadius: 6, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  pageBtnUserTextActive: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  pageBtnUserTextInactive: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: COLORS.paginationInactiveTxt,
    fontFamily: 'Poppins_500Medium',
  },

  // --- RIGHT PANEL ---
  rightPanel: { 
    width: 320, 
    backgroundColor: COLORS.cardBackground, 
    borderLeftWidth: 1, 
    borderLeftColor: COLORS.border,
    padding: 20,
  },
  rightPanelTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.textPrimary, 
    marginBottom: 16,
    fontFamily: 'Poppins_700Bold',
  },
  thoughtsList: { 
    paddingBottom: 20 
  },

  // --- MODALS ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  commentsList: {
    flex: 1,
    padding: 20,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  commentContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  commentInputRow: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontFamily: 'Poppins_400Regular',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Web styles
const ws = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  logo: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 24, 
    color: COLORS.primary 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightBackground, 
    borderRadius: 30, 
    paddingHorizontal: 16, 
    height: 44, 
    width: '40%', 
    maxWidth: 500 
  },
  searchInput: { 
    flex: 1, 
    fontFamily: 'Poppins_400Regular', 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    outlineStyle: 'none' 
  } as any,
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  notifBadge: { 
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: 'red', 
    borderRadius: 12, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  notifBadgeText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  headerUsername: { 
    fontFamily: 'Poppins_500Medium', 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    marginRight: 12 
  },
  headerAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
