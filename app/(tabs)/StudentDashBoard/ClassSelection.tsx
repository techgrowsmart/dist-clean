import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Dimensions, ScrollView, SafeAreaView, Alert, Modal, ImageBackground } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
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

// --- CBSE Classes Data ---
const CLASSES_DATA = [
  { id: '1', name: 'Class 8', teachers: '900 Teachers', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80' },
  { id: '2', name: 'Class 9', teachers: '500 Teachers', image: 'https://images.unsplash.com/photo-1546410531-bea422015320?w=300&q=80' },
  { id: '3', name: 'Class 10', teachers: '700 Teachers', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80' },
  { id: '4', name: 'Class 11', teachers: '800 Teachers', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80' },
  { id: '5', name: 'Class 12', teachers: '950 Teachers', image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=300&q=80' },
];
const Banner = () => (
  <View style={styles.bannerContainer}>
    <Image source={{ uri: 'https://images.unsplash.com/photo-1522661067900-ab829854a57f?q=80&w=1200&fit=crop' }} style={styles.bannerImage} />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerSmallText}>Knowledge is power</Text>
      <Text style={styles.bannerLargeText}>Learn relentlessly</Text>
    </View>
  </View>
);

const ClassCard = ({ item, onPress, isFromFallback = false }: { item: any; onPress: () => void; isFromFallback?: boolean }) => (
  <TouchableOpacity style={styles.classCardWrapper} onPress={onPress}>
    <View style={styles.classCardContainer}>
      <Image source={{ uri: item.image }} style={styles.classCardImage} resizeMode="cover" />
      <View style={styles.classCardContent}>
        <Text style={styles.classCardTitle}>{item.className || item.name}</Text>
        <View style={styles.classCardTag}>
          <Text style={styles.classCardTagText}>
            {item.teacherCount || 0} Teachers
            {isFromFallback && ' ⚠️'}
          </Text>
        </View>
        {isFromFallback && (
          <Text style={styles.fallbackText}>Using estimated data</Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const ClassSelection = ({ boardName, boardId, onBack, onClassSelect }: {
  boardName?: string;
  boardId?: string;
  onBack?: () => void;
  onClassSelect?: (selectedClass: {
    classId: string;
    className: string;
  }) => void;
}) => {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  
  // Get data from props or route params
  const finalBoardName = boardName || (localParams.boardName as string) || '';
  const finalBoardId = boardId || (localParams.boardId as string) || '';
  
  const [classesData, setClassesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Roboto_500Medium, OpenSans_500Medium, OpenSans_300Light, OpenSans_400Regular, Montserrat_400Regular });

  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Class Selection");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Class Selection");
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

  // Fetch classes for the selected board
  useEffect(() => {
    const fetchClasses = async () => {
      if (!finalBoardId) {
        console.error('❌ No boardId provided');
        return;
      }
      
      setLoading(true);
      
      try {
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error('❌ No authentication token found');
          return;
        }
        
        console.log('🔑 Auth token found:', auth.token.substring(0, 20) + '...');
        
        const headers = { 
          'Authorization': `Bearer ${auth.token}`, 
          'Content-Type': 'application/json' 
        };
        
        console.log('🔄 Fetching classes for boardId:', finalBoardId);
        
        const response = await axios.post(`${BASE_URL}/api/board`, 
          { boardId: finalBoardId }, 
          { headers }
        );
        
        console.log('📊 Backend classes response:', response.data);
        console.log('📊 Response status:', response.status);
        
        if (response.data && response.data.classes) {
          console.log('✅ Classes received from API:', response.data.classes);
          
          // Filter for classes 6-12 only
          const filteredClasses = response.data.classes.filter((cls: any) => {
            const classNumber = parseInt(cls.className.replace(/[^0-9]/g, ''));
            return classNumber >= 6 && classNumber <= 12;
          });
          
          console.log('🎯 Filtered classes 6-12:', filteredClasses);
          
          // Add images for classes 6-12
          const imageUrls = [
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80',
            'https://images.unsplash.com/photo-1546410531-bea422015320?w=300&q=80',
            'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80',
            'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80',
            'https://images.unsplash.com/photo-1588072432836-e10032774350?w=300&q=80',
            'https://images.unsplash.com/photo-1522661067900-ab829854a57f?w=300&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80'
          ];
          
          const classesWithImages = filteredClasses.map((cls: any, index: number) => ({
            ...cls,
            image: imageUrls[index % imageUrls.length],
            // Ensure we use the real teacherCount from backend
            teacherCount: cls.teacherCount || 0
          }));
          
          console.log('🎨 Classes with images and real teacher counts:', classesWithImages);
          
          setClassesData(classesWithImages);
        } else {
          console.error('❌ Invalid response structure:', response.data);
        }
      } catch (error: any) {
        console.error('❌ Error fetching classes from API:', error);
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Only use fallback if API completely fails, but log it clearly
        console.warn('⚠️ Using fallback data - API failed');
        const fallbackClasses = [
          { id: '6', name: 'Class 6', teacherCount: 0, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80' },
          { id: '7', name: 'Class 7', teacherCount: 0, image: 'https://images.unsplash.com/photo-1546410531-bea422015320?w=300&q=80' },
          { id: '8', name: 'Class 8', teacherCount: 0, image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80' },
          { id: '9', name: 'Class 9', teacherCount: 0, image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80' },
          { id: '10', name: 'Class 10', teacherCount: 0, image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=300&q=80' },
          { id: '11', name: 'Class 11', teacherCount: 0, image: 'https://images.unsplash.com/photo-1522661067900-ab829854a57f?w=300&q=80' },
          { id: '12', name: 'Class 12', teacherCount: 0, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' }
        ];
        
        // Store fallback data with a flag
        const fallbackDataWithFlag = fallbackClasses.map(cls => ({ ...cls, isFromFallback: true }));
        setClassesData(fallbackDataWithFlag);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [finalBoardId]);

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

  // Remove unread count polling since WebNavbar handles it now

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
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail, studentName: "Student", profileImage: null } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push("/(tabs)/Contact");
    if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── WEB HEADER - Full Width ── */}
      {isDesktop && (
        <WebNavbar
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
              <Text style={styles.headerUserName}>Student</Text>
              <Image source={require("../../../assets/images/Profile.png")} style={styles.headerAvatar} />
            </View>
          </View>
        )}

        {/* ── LEFT SIDEBAR (WebSidebar component — desktop only, no duplicate) ── */}
        {isDesktop && (
          <WebSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || "student@example.com"}
            studentName="Student"
            profileImage={null}
          />
        )}

        {/* ── MAIN AREA ── */}
        <View style={styles.mainLayout}>

          {/* ── CONTENT COLUMNS ── */}
          <View style={styles.contentColumns}>

            {/* CENTER: Class Selection Content */}
            <View style={styles.centerContent}>

              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.classSelectionScroll} showsVerticalScrollIndicator={false}>
                  <ImageBackground 
                    source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
                    style={{ flex: 1 }}
                    imageStyle={{ opacity: 0.15 }}
                  >
                    
                    {/* Navigation Title Header */}
                    <View style={styles.pageNavHeader}>
                      <TouchableOpacity style={styles.backButton} onPress={onBack || (() => router.back())}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.pageTitle}>{finalBoardName} | All Classes</Text>
                    </View>

                    {/* Main Bounded Container */}
                    <View style={styles.boxContainer}>
                      
                      <Banner />

                      <View style={styles.gridContainer}>
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>Loading classes...</Text>
                          </View>
                        ) : classesData.length > 0 ? (
                          classesData.map((classItem) => (
                            <ClassCard 
                              key={classItem.id} 
                              item={classItem} 
                              isFromFallback={classItem.isFromFallback}
                              onPress={() => {
                              console.log('🎯 ClassItem pressed:', classItem);
                              console.log('🎯 ClassItem properties:', {
                                id: classItem.id,
                                classId: classItem.classId,
                                name: classItem.name,
                                className: classItem.className
                              });
                              
                              if (onClassSelect) {
                                const selectedClass = { 
                                  classId: classItem.classId || classItem.id, 
                                  className: classItem.className || classItem.name 
                                };
                                console.log('🚀 Calling onClassSelect with:', selectedClass);
                                onClassSelect(selectedClass);
                              } else {
                                // Navigate to the web UI version from growsmart-ui-screens
                                console.log('Class selected:', { classId: classItem.classId || classItem.id, className: classItem.className || classItem.name });
                                router.push({
                                  pathname: '/(tabs)/StudentDashBoard/SubjectSelection',
                                  params: { 
                                    boardName: finalBoardName, 
                                    boardId: finalBoardId,
                                    classId: classItem.classId || classItem.id,
                                    className: classItem.className || classItem.name
                                  }
                                } as any);
                              }
                            }}
                            />
                          ))
                        ) : (
                          <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No Classes Available</Text>
                            <Text style={styles.emptyText}>No classes found for this board.</Text>
                          </View>
                        )}
                      </View>

                    </View>

                    {/* Pagination */}
                    <View style={styles.paginationRow}>
                      <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                        <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.pageBtnActive}>
                        <Text style={styles.pageBtnUserTextActive}>1</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.pageBtnInactive}>
                        <Text style={styles.pageBtnUserTextInactive}>2</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.pageBtnInactive}>
                        <Text style={styles.pageBtnUserTextInactive}>3</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </View>

                  </ImageBackground>
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
  classSelectionScroll: { paddingBottom: 20 },
  
  // Class Selection specific styles
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4DEFF',
    padding: 24,
    marginBottom: 32,
  },
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
  },
  classCardWrapper: {
    width: '48.5%',
    marginBottom: 8,
  },
  classCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 140,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  classCardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 20,
    backgroundColor: COLORS.lightBackground,
  },
  classCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  classCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 12,
  },
  classCardTag: {
    backgroundColor: '#D9F99D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  classCardTagText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#1F2937',
  },
  fallbackText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 4,
    textAlign: 'center',
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
    width: 34, height: 34, backgroundColor: '#374151',
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnInactive: {
    width: 34, height: 34, backgroundColor: '#E5E7EB',
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnUserTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  pageBtnUserTextInactive: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#6B7280' },

  rightPanel: { width: Platform.OS === 'web' ? '25%' : '25%', minWidth: 300, backgroundColor: COLORS.cardBackground, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 20 },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'right' },
  thoughtsList: { paddingBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: 'white', borderRadius: 12, width: '90%', maxWidth: 500, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.textPrimary },
  commentsList: { flex: 1, marginBottom: 16 },
  commentItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  commentAuthor: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  commentContent: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  commentTime: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary },
  commentInputRow: { flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  commentSendBtn: { backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, justifyContent: 'center', alignItems: 'center' },
  
  // Loading and empty states
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: 'Poppins_500Medium', fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
  emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});

const ws = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  logo: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightBackground, borderRadius: 30, paddingHorizontal: 16, height: 44, width: '40%', maxWidth: 500 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, outlineStyle: 'none' } as any,
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notifBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: 'red', borderRadius: 12, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  headerUsername: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});

export default ClassSelection;