import React, { useEffect, useState, useMemo } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome, Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';
import BackButton from "../../../components/BackButton";
import { getAuthData } from "../../../utils/authStorage";
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebNavbar from "../../../components/ui/WebNavbar";
import ResponsiveSidebar from "../../../components/ui/ResponsiveSidebar";
import StudentThoughtsCard from "../../../components/ui/StudentThoughtsCard";
import ThoughtsCard from "./ThoughtsCard";
import axios from "axios";
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../../utils/favoritesEvents';

const { width } = Dimensions.get("window");

const COLORS = {
  primary: '#4255ff',
  secondary: '#f0f0f0',
  background: '#ffffff',
  textPrimary: '#1a1a2e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  lightBackground: '#f9fafb',
  cardBackground: '#ffffff',
};

interface Teacher {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
  profilepic?: string;
  board?: string;
  class?: string;
  subject?: string;
  charge?: number | string;
  hourlyRate?: number | string;
  rate?: number | string;
  price?: number | string;
  fee?: number | string;
  amount?: number | string;
  hourly_charge?: number | string;
  tuition_fee?: number | string;
  cost?: number | string;
  sessionCharge?: number | string;
  classCharge?: number | string;
  rating?: number;
  introduction?: string;
  description?: string;
  language?: string;
  tuitions?: any;
  workexperience?: string;
  qualifications?: any;
  teachingmode?: any;
  category?: string;
  isspotlight?: boolean;
}

const ITEMS_PER_PAGE = 6;

export default function TeachersList({ 
  boardName: propBoardName, 
  selectedClass: propSelectedClass, 
  selectedSubject: propSelectedSubject, 
  onBack, 
  onFavoritesChange 
}: {
  boardName?: string;
  selectedClass?: string;
  selectedSubject?: string;
  onBack?: () => void;
  onFavoritesChange?: () => void;
}) {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get props from either direct props or router params
  const boardName = propBoardName || params.boardName as string;
  const selectedClass = propSelectedClass || params.selectedClass as string;
  const selectedSubject = propSelectedSubject || params.selectedSubject as string;
  const showAllTutors = params.showAllTutors === 'true';

  // University flow params
  const isUniversityFlow = params.isUniversities === 'true' || params.isUniversity === 'true';
  const universityId = params.universityId as string;
  const universityName = params.universityName as string;
  const yearId = params.yearId as string;
  const yearName = params.yearName as string;
  const year = params.year as string;
  const yearIndex = params.yearIndex as string;
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});
  const [studentName, setStudentName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Home");

  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;
  const [isMobile, setIsMobile] = useState(Dimensions.get('window').width < 768);

  // Update isMobile on resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsMobile(window.width < 768);
    });
    return () => subscription?.remove();
  }, []);

  // Posts-related state for ThoughtsCard
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

  const formatCharge = (charge: string | number | undefined | null) => {
    if (!charge && charge !== 0) return '₹0';
    const num = typeof charge === 'string' ? parseFloat(charge) : charge;
    if (isNaN(num)) return '₹0';
    return `₹${num.toFixed(0)}`;
  };

  useEffect(() => {
    console.log("🚀 useEffect triggered!");
    console.log("📋 Props received:", { boardName, selectedClass, selectedSubject, showAllTutors, isUniversityFlow, universityName, yearName });
    fetchTeachers();
  }, [boardName, selectedClass, selectedSubject, showAllTutors, isUniversityFlow, universityName, yearName]);

  // Fetch posts for ThoughtsCard (web only)
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

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fetchUserProfile = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.email) {
            setUserEmail(authData.email);
            setUserRole(authData.role || 'student');

            const res = await fetch(`${BASE_URL}/api/userProfile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
              },
              body: JSON.stringify({
                email: authData.email,
                source: 'astraDB'
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.data?.name || data.data?.profileimage) {
                setStudentName(data.data.name || '');
                setProfileImage(data.data.profileimage || '');
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();

      // Add ESC key handler for web
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (onBack) {
            onBack();
          } else {
            router.back();
          }
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [onBack, router]);

  const fetchTeachers = async () => {
    // If showAllTutors is true, fetch all subject teachers regardless of board/class/subject
    if (showAllTutors) {
      setLoading(true);
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };
        const res = await fetch(`${BASE_URL}/api/teachers`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            category: "Subject teacher"
          }),
        });
        const data = await res.json();
        console.log("🔍 ALL TEACHERS API RESPONSE:", JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
          setTeachers(data.data);
          setCurrentPage(1);
          setLoading(false);
          return;
        } else {
          setTeachers([]);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error fetching all teachers:", error);
        setTeachers([]);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
    }

    // University flow: fetch university teachers
    if (isUniversityFlow && universityName && yearName && selectedSubject) {
      setLoading(true);
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };
        console.log("📡 Fetching university teachers:", { university: universityName, year: yearName, subject: selectedSubject });
        const res = await fetch(`${BASE_URL}/api/teachers/universities/teachers`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            university: universityName,
            year: yearName,
            subject: selectedSubject,
          }),
        });
        const data = await res.json();
        console.log("🔍 UNIVERSITY TEACHERS API RESPONSE:", JSON.stringify(data, null, 2));
        if (Array.isArray(data)) {
          setTeachers(data);
        } else {
          setTeachers([]);
        }
        setCurrentPage(1);
        setLoading(false);
        return;
      } catch (error) {
        console.error("Error fetching university teachers:", error);
        setTeachers([]);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
    }

    // Original logic for board/class/subject specific teachers
    if (!boardName || !selectedClass || !selectedSubject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const auth = await getAuthData();
      if (!auth || !auth.token) {
        console.error("No authentication token found");
        setLoading(false);
        return;
      }
      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(`${BASE_URL}/api/teacherInfo`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          board: boardName,
          className: selectedClass,
          subject: selectedSubject,
        }),
      });
      const data = await res.json();
      console.log("🔍 FULL API RESPONSE:", JSON.stringify(data, null, 2));
      if (!data || (!data.spotlightTeachers && !data.popularTeachers)) {
        console.error("❌ Invalid API response structure:", data);
        if (Array.isArray(data)) {
          console.log("🔄 Using direct array structure");
          setTeachers(data);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
        setTeachers([]);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      const spotlightTeachers = data.spotlightTeachers || {};
      const popularTeachers = data.popularTeachers || {};
      const spotlightSubjectTeachers = spotlightTeachers["Subject teacher"] || [];
      const popularSubjectTeachers = popularTeachers["Subject teacher"] || [];
      const subjectTeachers = [...spotlightSubjectTeachers, ...popularSubjectTeachers];
      console.log("🌟 Spotlight Teachers:", spotlightSubjectTeachers.length);
      console.log("📊 Popular Teachers:", popularSubjectTeachers.length);
      console.log("🎯 Combined Subject Teachers:", subjectTeachers.length);
      console.log("📋 Total teachers to filter:", subjectTeachers.length);
      console.log("📋 Combined teachers array:", subjectTeachers);
      if (subjectTeachers.length > 0) {
        const firstTeacher = subjectTeachers[0];
        console.log("👨‍🏫 First Teacher Data:", JSON.stringify(firstTeacher, null, 2));
        console.log("📚 First Teacher Tuitions:", firstTeacher.tuitions);
        console.log("📚 First Teacher Tuitions Type:", typeof firstTeacher.tuitions);
      } else {
        console.log("❌ No teachers found in combined array");
        console.log("🔍 Spotlight Teachers Keys:", Object.keys(spotlightTeachers));
        console.log("🔍 Popular Teachers Keys:", Object.keys(popularTeachers));
        console.log("🔍 Spotlight Teachers Full:", spotlightTeachers);
        console.log("🔍 Popular Teachers Full:", popularTeachers);
      }
      
      const filtered = subjectTeachers.filter((teacher: Teacher) => {
        if (!teacher.tuitions) return false;
        
        let tuitions: any[] = [];
        if (typeof teacher.tuitions === 'string') {
          try {
            tuitions = JSON.parse(teacher.tuitions);
          } catch (e) {
            console.error("Error parsing tuitions:", e);
            return false;
          }
        } else if (Array.isArray(teacher.tuitions)) {
          tuitions = teacher.tuitions;
        }
        
        if (!Array.isArray(tuitions) || tuitions.length === 0) {
          console.log("No valid tuitions array for teacher:", teacher.name);
          return false;
        }
        
        const hasMatchingTuition = tuitions.some((tuition: any) => {
          const matchesBoard = tuition.board === boardName;
          const matchesClass = tuition.class === selectedClass;
          const matchesSubject = tuition.subject === selectedSubject;
          return matchesBoard && matchesClass && matchesSubject;
        });
        
        if (!hasMatchingTuition) {
          console.log(`Teacher ${teacher.name} filtered out - no matching tuition`);
        }
        
        return hasMatchingTuition;
      });
      
      const uniqueFiltered = filtered.filter((teacher, index, self) =>
        index === self.findIndex((t) => t.email === teacher.email)
      );
      
      console.log("✅ Final filtered teachers:", uniqueFiltered.length);
      setTeachers(uniqueFiltered || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);

  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    console.log("Logging Teachers:", teachers);
    return teachers.slice(start, end);
  }, [teachers, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleLikePress = async (teacherEmail: string) => {
    const isLiked = likedTeachers[teacherEmail] || false;
    
    try {
        // Optimistic update
        setLikedTeachers(prev => ({
            ...prev, 
            [teacherEmail]: !isLiked
        }));
        
        if (isLiked) {
            await removeFavoriteTeacher(teacherEmail);
        } else {
            await addFavoriteTeacher(teacherEmail);
        }
        
        // Trigger refresh for other components
        favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
        
        if (onFavoritesChange) {
            onFavoritesChange();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert optimistic update on error
        setLikedTeachers(prev => ({
            ...prev, 
            [teacherEmail]: isLiked
        }));
    }
  };

  const handleSidebarItemPress = (itemName: string) => {
    setActiveMenu(itemName);
    setSidebarActiveItem(itemName);
    
    // Navigate to the appropriate screen
    switch(itemName) {
      case "Home":
        router.push("/(tabs)/StudentDashBoard");
        break;
      case "My Tuitions":
        router.push("/(tabs)/StudentDashBoard/MyTuitions");
        break;
      case "Profile":
        router.push("/(tabs)/StudentDashBoard/Profile");
        break;
      case "Connect":
        router.push("/(tabs)/StudentDashBoard/Connect");
        break;
      case "Share":
        router.push("/(tabs)/StudentDashBoard/Share");
        break;
      case "Subscription":
        router.push("/(tabs)/StudentDashBoard/Subscription");
        break;
      case "Billing":
        router.push("/(tabs)/StudentDashBoard/Billing");
        break;
      case "Faq":
        router.push("/(tabs)/StudentDashBoard/Faq");
        break;
      case "Help & Support":
        router.push("/(tabs)/StudentDashBoard/HelpSupport");
        break;
      default:
        break;
    }
  };

  const renderWebRightSidebar = () => (
    <StudentThoughtsCard
      posts={posts}
      postsLoading={postsLoading}
      userProfileCache={userProfileCache}
      currentUserEmail={userEmail || undefined}
      getProfileImageSource={getProfileImageSource}
      initials={initials}
      resolvePostAuthor={resolvePostAuthor}
      handleLike={handleLike}
      setPosts={setPosts}
      onComment={openCommentsModal}
      isMobile={isMobile}
      showThoughtsPanel={true}
      authToken={authToken}
      BASE_URL={BASE_URL}
      formatTimeAgo={formatTimeAgo}
      router={router}
    />
  );

  // Posts-related functions for ThoughtsCard
  const formatTimeAgo = (createdAt: string) => {
    try {
      if (!createdAt || createdAt === 'null' || createdAt === 'undefined') return 'Just now';
      if (typeof createdAt === 'string' && createdAt.includes('ago')) return createdAt;
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return 'Just now';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch { return 'Just now'; }
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email, source: 'astraDB' }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data?.data?.name) {
        const profile = { name: response.data.data.name, profilePic: response.data.data.profileimage || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profile)));
        return profile;
      }
      return { name: 'Unknown User', profilePic: '' };
    } catch { return { name: 'Unknown User', profilePic: '' }; }
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
  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) return null;
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
      return require("../../../assets/images/Profile.png");
    }
    return profilePic;
  };

  const initials = (name: string) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const resolvePostAuthor = (post: any) => {
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    // Prioritize post.author.name first, then cache, then fallback
    let name = post.author?.name || cached.name || '';
    let pic: string | null = post.author?.profile_pic || cached.profilePic || null;
    if (!name) name = 'Unknown User';
    return { name, pic: pic || '', role: 'student' };
  };

  const handleLike = async (postId: string) => {
    if (!authToken) return;
    const post = posts.find((p: any) => p.id === postId); if (!post) return;
    const newLiked = !post.isLiked;
    setPosts(posts.map((p: any) => p.id === postId ? { ...p, isLiked: newLiked, likesCount: (p.likesCount || 0) + (newLiked ? 1 : -1) } : p));
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error();
    } catch {
      setPosts(posts.map((p: any) => p.id === postId ? { ...p, isLiked: !newLiked, likesCount: (p.likesCount || 0) + (newLiked ? -1 : 1) } : p));
    }
  };

  const openCommentsModal = async (post: any) => { 
    setSelectedPost(post); 
    setShowCommentsModal(true); 
    setCommentText(''); 
    await fetchPostComments(post.id); 
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) setPostComments(await res.json());
    } catch { setPostComments([]); }
  };

  const renderTeacherCard = ({ item }: { item: Teacher }) => {
    const profileImg = item.profilePic || item.profilepic;
    const isLiked = likedTeachers[item.email] || false;

    let tuitions: any[] = [];
    if (item.tuitions) {
      if (typeof item.tuitions === 'string') {
        try { tuitions = JSON.parse(item.tuitions); } catch { tuitions = []; }
      } else if (Array.isArray(item.tuitions)) {
        tuitions = item.tuitions;
      }
    }

    // For university flow, use universityName and yearName instead of boardName/class
    const searchBoard = isUniversityFlow ? universityName : boardName;
    const searchClass = isUniversityFlow ? yearName : selectedClass;

    // Debug: Log the tuition data for first teacher
    if (tuitions.length > 0 && __DEV__) {
      console.log('🔍 Teacher:', item.name);
      console.log('🔍 Tuitions:', JSON.stringify(tuitions, null, 2));
      console.log('🔍 Search:', { searchBoard, searchClass, selectedSubject });
    }

    // Find matching tuition - for universities, also check if board equals "Universities"
    let matchingTuition = tuitions.find(t =>
      (t.board === searchBoard || t.university === searchBoard || (isUniversityFlow && t.board === 'Universities')) &&
      (t.class === searchClass || t.year === searchClass || (isUniversityFlow && t.year === yearName)) &&
      (t.subject === selectedSubject)
    );

    // If no exact match and this is university flow, just use the first tuition
    if (!matchingTuition && isUniversityFlow && tuitions.length > 0) {
      matchingTuition = tuitions[0];
      console.log('🔍 Using first tuition as fallback for university teacher');
    }

    // Debug: Log if matching tuition found
    if (__DEV__) {
      console.log('🔍 Matching tuition:', matchingTuition ? 'FOUND' : 'NOT FOUND');
      if (matchingTuition) {
        console.log('🔍 Matching tuition data:', JSON.stringify(matchingTuition, null, 2));
      }
    }

    const teachingClass = matchingTuition?.class || matchingTuition?.year || searchClass;
    const subject = matchingTuition?.subject || selectedSubject;

    // Extract charge from matching tuition or fall back to item level
    let chargeValue: string | number = '0';

    if (matchingTuition) {
      // Try all possible field names on the matching tuition
      chargeValue = matchingTuition.charge ??
                    matchingTuition.price ??
                    matchingTuition.fee ??
                    matchingTuition.amount ??
                    matchingTuition.hourlyRate ??
                    matchingTuition.rate ??
                    matchingTuition.hourly_charge ??
                    matchingTuition.tuition_fee ??
                    matchingTuition.cost ??
                    matchingTuition.sessionCharge ??
                    matchingTuition.classCharge ??
                    '0';
    }

    // If still no charge, try item-level fields
    if (chargeValue === '0' || chargeValue === 0 || chargeValue === undefined || chargeValue === null || chargeValue === '') {
      chargeValue = item.charge ??
                    item.hourlyRate ??
                    item.rate ??
                    item.price ??
                    item.fee ??
                    item.amount ??
                    item.hourly_charge ??
                    item.tuition_fee ??
                    item.cost ??
                    item.sessionCharge ??
                    item.classCharge ??
                    '0';
    }

    // Debug: Log the final charge value
    if (__DEV__) {
      console.log('💰 Final charge value:', chargeValue, typeof chargeValue);
    }

    const charge = chargeValue;
    const introduction = item.introduction || item.description || 'Experienced educator with passion for teaching';
    const rating = item.rating || 4.9;

    if (Platform.OS === 'web') {
      return (
        <TouchableOpacity
          style={webCardStyles.card}
          activeOpacity={0.92}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
              params: {
                name: item.name, email: item.email, board: boardName,
                teachingClass, subject, language: item.language || 'English',
                profilePic: profileImg, charge: charge.toString(), description: introduction,
              },
            })
          }
        >
          {/* Image */}
          <View style={webCardStyles.imageWrapper}>
            <Image
              source={profileImg ? { uri: profileImg } : require('../../../assets/images/Profile.png')}
              style={webCardStyles.image}
            />
            {/* Heart */}
            <TouchableOpacity
              style={webCardStyles.heartBtn}
              onPress={(e) => { e.stopPropagation?.(); handleLikePress(item.email); }}
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? '#e74c3c' : '#fff'} />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={webCardStyles.info}>
            <View style={webCardStyles.tagRow}>
              <Text style={webCardStyles.subjectTag}>{subject?.toUpperCase()}</Text>
              <View style={webCardStyles.ratingBadge}>
                <Text style={webCardStyles.ratingStar}>★</Text>
                <Text style={webCardStyles.ratingText}>{rating}</Text>
              </View>
            </View>

            <Text style={webCardStyles.teacherName} numberOfLines={1}>{item.name}</Text>
            <Text style={webCardStyles.description} numberOfLines={2}>{introduction}</Text>

            <View style={webCardStyles.footer}>
              <Text style={webCardStyles.price}>{formatCharge(charge)}/ hr</Text>
              <TouchableOpacity
                style={webCardStyles.viewBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
                    params: {
                      name: item.name, email: item.email, board: boardName,
                      teachingClass, subject, language: item.language || 'English',
                      profilePic: profileImg, charge: charge.toString(), description: introduction,
                    },
                  })
                }
              >
                <Text style={webCardStyles.viewBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // --- existing mobile card JSX unchanged below ---
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
            params: {
              name: item.name, email: item.email, board: boardName,
              teachingClass, subject, language: item.language || 'English',
              profilePic: profileImg, charge: charge.toString(), description: introduction,
            },
          })
        }
      >
        <View style={styles.leftSection}>
          <View style={styles.imageContainer}>
            <Image
              source={profileImg ? { uri: profileImg } : require('../../../assets/images/Profile.png')}
              style={styles.image}
            />
            {/* Heart/Favorite Button */}
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={(e) => { e.stopPropagation(); handleLikePress(item.email); }}
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? '#e74c3c' : '#fff'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.webClassInfo}>
            <View style={styles.webClassInfoItem}>
              <Ionicons name="book-outline" size={12} color="#666" />
              <Text style={styles.webClassInfoText}>{boardName}</Text>
            </View>
            <View style={styles.webClassInfoItem}>
              <Ionicons name="people-outline" size={12} color="#666" />
              <Text style={styles.webClassInfoText}>{teachingClass}</Text>
            </View>
          </View>
          <View style={styles.webTeacherFooter}>
            <Text style={styles.webTeacherPrice}>{formatCharge(charge)}</Text>
            <View style={styles.webTeacherActions}>
              <TouchableOpacity style={styles.webViewProfileBtn}
                onPress={() => router.push({ pathname: '/(tabs)/StudentDashBoard/TeacherDetails', params: { name: item.name, email: item.email, board: boardName, teachingClass, subject, language: item.language || 'English', profilePic: profileImg, charge: charge.toString(), description: introduction } })}
              >
                <Text style={styles.webViewProfileBtnText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.leftArrow}
        >
          <BackButton
            size={24}
            color="#4255ff"
            onPress={() => handlePageChange(currentPage - 1)}
          />
        </TouchableOpacity>
        
        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={styles.rightArrow}
        >
          <BackButton
            size={24}
            color="#4255ff"
            onPress={() => handlePageChange(currentPage + 1)}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
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

              {/* CENTER: Teachers Grid */}
              <View style={styles.centerContent}>
                <View style={styles.pageNavHeader}>
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => {
                      if (onBack) {
                        onBack();
                      } else {
                        router.back();
                      }
                    }}
                  >
                    <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.pageTitle}>{selectedSubject} Teachers</Text>
                </View>

                <View style={styles.webTeachersHeader}>
                  <Text style={styles.webTotalCount}>{teachers.length} Teachers Found</Text>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                ) : teachers.length === 0 ? (
                  <View style={styles.noTeachersContainer}>
                    <Ionicons name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.noTeachersText}>No teachers found</Text>
                    <Text style={styles.noTeachersSubtext}>
                      Try adjusting your filters or search criteria
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.webTeachersContainer}>
                    <View style={styles.webTeachersGrid}>
                      {paginatedTeachers.map((teacher) => (
                        <View key={teacher.email} style={styles.webTeacherCard}>
                          {renderTeacherCard({ item: teacher })}
                        </View>
                      ))}
                    </View>
                    {renderPagination()}
                  </ScrollView>
                )}
              </View>

              {/* RIGHT: Thoughts Panel (ThoughtsCard reused from Student.tsx) */}
              <>
                {isMobile ? (
                  renderWebRightSidebar()
                ) : (
                  <View style={styles.rightPanel}>{renderWebRightSidebar()}</View>
                )}
              </>

            </View>
          </View>
      </ResponsiveSidebar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mobileHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4255ff" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>Teachers</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.mobileContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : teachers.length === 0 ? (
          <View style={styles.noTeachersContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.noTeachersText}>No teachers found</Text>
            <Text style={styles.noTeachersSubtext}>
              Try adjusting your filters or search criteria
            </Text>
          </View>
        ) : (
          <FlatList
            data={paginatedTeachers}
            renderItem={renderTeacherCard}
            keyExtractor={(item) => item.email}
            contentContainerStyle={styles.mobileTeachersList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={renderPagination}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const webCardStyles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.13)',
  },
  imageWrapper: {
    width: '100%',
    height: 260,
    backgroundColor: '#e8e8e8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(110,110,110,0.72)',
    borderRadius: 22,
    padding: 9,
  },
  info: {
    padding: 16,
    paddingTop: 18,
    backgroundColor: '#fff',
    marginTop: -22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectTag: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4255ff',
    letterSpacing: 0.9,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingStar: {
    fontSize: 14,
    color: '#f59e0b',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#166534',
  },
  teacherName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
  },
  viewBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  viewBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rootContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: COLORS.cardBackground 
  },
  mainLayout: { 
    flex: 1, 
    backgroundColor: COLORS.lightBackground 
  },
  contentColumns: { flex: 1, flexDirection: 'row' },
  centerContent: { flex: 1, paddingTop: 32, paddingHorizontal: 32, paddingBottom: 24 },
  rightPanel: { width: Platform.OS === 'web' ? '25%' : '25%', minWidth: 300, backgroundColor: COLORS.cardBackground, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 20 },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'right' },
  thoughtsList: { paddingBottom: 40 },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 32, 
    paddingVertical: 20, 
    backgroundColor: COLORS.cardBackground, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightBackground, 
    borderRadius: 30, 
    paddingHorizontal: 16, 
    height: 44, 
    width: Platform.OS === 'web' ? '40%' : '40%' 
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    fontFamily: 'Poppins_400Regular', 
    fontSize: 14, 
    color: COLORS.textPrimary 
  },
  profileHeaderSection: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  bellIcon: { 
    marginRight: 20, 
    padding: 8, 
    backgroundColor: COLORS.lightBackground, 
    borderRadius: 20 
  },
  headerUserName: { 
    fontFamily: 'Poppins_500Medium', 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    marginRight: 12 
  },
  headerAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  pageTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  pageNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  centerContent: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webBackButton: {
    padding: 8,
  },
  webHeaderTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  webSearchFilter: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webTeachersHeader: {
    marginBottom: 20,
  },
  webTotalCount: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
  },
  webTeachersContainer: {
    flex: 1,
  },
  webTeachersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingBottom: 24,
  },
  webTeacherCard: {
    width: '31%',
  },
  noTeachersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noTeachersText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  noTeachersSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  mobileHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mobileTeachersList: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  heartBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  webClassInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  webClassInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  webClassInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  webTeacherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webTeacherPrice: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
  },
  webTeacherActions: {
    flexDirection: 'row',
  },
  webViewProfileBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  webViewProfileBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  leftArrow: {
    transform: [{ rotate: '180deg' }],
  },
  rightArrow: {
    transform: [{ rotate: '0deg' }],
  },
  pageInfo: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },
});
