import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import BackButton from "../../../components/BackButton";
import WebNavbar from '../../../components/ui/WebNavbar';
import WebSidebar from '../../../components/ui/WebSidebar';
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import ThoughtsCard from './ThoughtsCard';

const { width } = Dimensions.get("window");

// --- Post Interface for ThoughtsCard ---
interface Post {
  id: string;
  author: { email: string; name: string; role: string; profile_pic: string; };
  content: string;
  likes: number;
  comments?: any[];
  createdAt: string;
  tags?: string[];
  postImage?: string;
  postImages?: string[];
  isLiked?: boolean;
}

interface Comment {
  id: string; 
  author: { email: string; name: string; role: string; profile_pic: string; };
  content: string; 
  likes: number; 
  createdAt: string; 
  isLiked?: boolean;
}

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  tagBg: '#C7D2FE',
  tagTxt: '#1F2937',
  paginationActiveBg: '#374151',
  paginationInactiveBg: '#E5E7EB',
  paginationInactiveTxt: '#6B7280',
  headerTxt: '#000000',
};

// --- Board Data Interface ---
interface BoardData {
  board: string;
  boardname: string;
  name?: string; // Added for compatibility with existing code
  fullName?: string; // Added for compatibility with existing code
  id?: string;
  count?: number;
  image?: any;
  logo?: string;
  color?: string;
  teacherCount?: number;
  description?: string;
  headquarters?: string;
  established?: string;
  isUniversities?: boolean; // Flag for All Universities special handling
}

export default function AllBoardsPage({ onBack, onBoardSelect, category = "Subject teacher" }: {
  onBack?: () => void;
  onBoardSelect?: (boardName: string, boardId: string) => void;
  category?: string;
}) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<BoardData[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSidebarItem, setActiveSidebarItem] = useState('All Boards');
  const [studentName, setStudentName] = useState('Student');
  const [profileImage, setProfileImage] = useState(null);
  const [storedUserEmail, setStoredUserEmail] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // ThoughtsCard states
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

  const handleSidebarItemPress = (itemName: string) => {
    setActiveSidebarItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
    if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail: storedUserEmail, userType: userRole } });
    if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail: storedUserEmail, studentName, profileImage } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail: storedUserEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push("/(tabs)/Contact");
    if (itemName === "Privacy Policy") router.push("/(tabs)/StudentDashBoard/PrivacyPolicy");
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  const boardsPerPage = Platform.OS === 'web' ? 6 : 4;
  const totalPages = Math.ceil(filteredBoards.length / boardsPerPage);
  const startIndex = (currentPage - 1) * boardsPerPage;
  const currentBoards = filteredBoards.slice(startIndex, startIndex + boardsPerPage);

  // Helper functions for ThoughtsCard
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

  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic || ['', 'null', 'undefined'].includes(profilePic)) return null;
    if (typeof profilePic === 'string') {
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) return { uri: profilePic };
      const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      return { uri: `${BASE_URL}/${clean}` };
    }
    return null;
  };

  const resolvePostAuthor = (post: Post) => {
    const cached = userProfileCache.get(post.author.email) || { name: '', profilePic: '' };
    // Prioritize post.author.name first, then cache, then fallback
    let name = post.author.name || cached.name || '';
    let pic: string | null = post.author.profile_pic || cached.profilePic || null;
    if (!name || name === 'null' || name.includes('@')) name = post.author.email?.split('@')[0] || 'User';
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = null;
    return { name, pic, role: post.author.role || 'User' };
  };

  // Fetch boards from API
  const fetchBoards = useCallback(async () => {
    try {
      setBoardsLoading(true);
      const auth = await getAuthData();
      
      if (!auth?.token) {
        console.log("No auth token found");
        setBoards([]);
        setFilteredBoards([]);
        return;
      }
      
      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.post(`${BASE_URL}/api/allboards`, { category }, { headers });
      console.log("Boards Response:", response.data);
      
      // Handle API response format - can be { boards: [...], universities: [...] } or [...]
      let boardsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Skill teacher returns array directly
          boardsData = response.data;
        } else if (response.data.boards && Array.isArray(response.data.boards)) {
          // Subject teacher returns { boards: [...], universities: [...] }
          boardsData = response.data.boards;
        }
      }
      
      if (boardsData.length > 0) {
        // Use exact structure from allBoards.json - only add minimal necessary fields
        const boardsWithDetails = boardsData.map((board: any, index: number) => ({
          id: board.boardId || board.id,
          name: board.boardName || board.name,
          board: board.boardName || board.name,
          boardname: board.boardName || board.name,
          boardId: board.boardId || board.id,
          boardName: board.boardName || board.name,
          fullName: board.boardName || board.name,
          teacherCount: board.teacherCount || 0,
          description: board.description || `${board.boardName || 'Educational Board'} - Learn and grow`,
          headquarters: board.headquarters || 'India',
          established: board.established || 'Various',
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6],
          logo: board.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(board.boardName || board.name || 'Board')}&background=F5F7FB&color=3B5BFE&rounded=true&size=150`,
          classes: board.classes || []
        }));
        
        setBoards(boardsWithDetails);
        setFilteredBoards(boardsWithDetails);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      setBoards([]);
      setFilteredBoards([]);
      Alert.alert("Error", "Failed to load boards. Please try again later.");
    } finally {
      setBoardsLoading(false);
    }
  }, [category]);

  // Fetch posts for ThoughtsCard (same as Student.tsx)
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

  // Load user data and fetch boards/posts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;
        
        setStoredUserEmail(auth.email);
        setAuthToken(auth.token);
        
        // Load profile
        try {
          const profileResponse = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, { headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" } });
          const profileData = profileResponse.data;
          setStudentName(profileData.name || "Student");
          setProfileImage(profileData.profileimage || null);
          setUserRole(auth.role || null);
          await AsyncStorage.multiSet([["studentName", profileData.name || ""], ["profileImage", profileData.profileimage || ""], ["user_role", auth.role || ""]]);
        } catch {
          const cachedName = await AsyncStorage.getItem("studentName");
          const cachedImage = await AsyncStorage.getItem("profileImage");
          const cachedRole = await AsyncStorage.getItem("user_role");
          setStudentName(cachedName || "Student");
          setProfileImage(cachedImage || null);
          setUserRole(cachedRole || null);
        }
        
        // Fetch boards and posts
        await fetchBoards();
        await fetchPosts(auth.token);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();

    // Add ESC key handler for web
    if (Platform.OS === 'web') {
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

  useEffect(() => {
    const filtered = boards.filter(board => {
      const name = board.name || board.board || '';
      const fullName = board.fullName || board.boardname || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredBoards(filtered);
  }, [searchQuery, boards]);

  const handleBoardPress = (board: BoardData) => {
    const boardName = board.name || board.board || '';
    const boardId = board.id || '';
    
    // Handle All Universities specially - navigate to UniversitiesList page
    if (board.isUniversities || boardName === 'All Universities') {
      console.log('All Universities selected - navigating to universities list');
      if (onBoardSelect) {
        onBoardSelect('All Universities', 'universities');
      } else {
        router.push({
          pathname: '/(tabs)/StudentDashBoard/UniversitiesList',
          params: { category: 'universities' }
        } as any);
      }
      return;
    }
    
    if (onBoardSelect) {
      onBoardSelect(boardName, boardId);
    } else {
      // If accessed as standalone route, navigate to ClassSelection page
      console.log('Board selected:', { boardName, boardId });
      router.push({
        pathname: '/(tabs)/StudentDashBoard/ClassSelection',
        params: { boardName, boardId }
      } as any);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  // Web Layout with reusable components
  if (Platform.OS === 'web') {
    const Banner = () => (
      <View style={styles.bannerContainer}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&fit=crop' }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerSmallText}>Education is not preparation for life</Text>
          <Text style={styles.bannerLargeText}>Education is life itself</Text>
        </View>
      </View>
    );

    const BoardCard = ({ item }: { item: BoardData }) => {
      const [imageError, setImageError] = useState(false);
      const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.board || 'Board')}&background=${(item.color || '#3B5BFE').replace('#', '')}&color=fff&size=150`;
      
      return (
        <TouchableOpacity
          style={styles.boardCardWrapper}
          onPress={() => handleBoardPress(item)}
        >
          <View style={[styles.boardCardContainer, { backgroundColor: item.color ? item.color + '15' : '#F5F7FB' }]}>
            <Image
              source={{ uri: imageError ? placeholderImage : (item.logo || placeholderImage) }}
              style={styles.boardLogo}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          </View>
          <View style={styles.boardLabelPill}>
            <Text style={styles.boardLabelText}>{item.name || item.board}</Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.rootLayout}>
          <WebNavbar 
            studentName={studentName} 
            profileImage={profileImage}
          />

          <View style={styles.mainColumnsLayout}>
            <WebSidebar 
              activeItem={activeSidebarItem}
              onItemPress={handleSidebarItemPress}
              userEmail={storedUserEmail || ''}
              studentName={studentName}
              profileImage={profileImage}
            />

            {/* 2. CENTER CONTENT */}
            <View style={styles.centerContentContainer}>
              <ImageBackground 
                source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
                style={{ flex: 1 }}
                imageStyle={{ opacity: 0.15 }}
              >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
                  
                  {/* Navigation Title Header */}
                  <View style={styles.pageNavHeader}>
                    <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>All Boards</Text>
                  </View>

                  {/* Main Bounded Container */}
                  <View style={styles.boxContainer}>
                    
                    <Banner />

                    <View style={styles.gridContainer}>
                      {boardsLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                          <ActivityIndicator size="large" color="#4A7BF7" />
                          <Text style={{ marginTop: 12, color: '#666', fontFamily: 'Poppins_400Regular' }}>Loading boards...</Text>
                        </View>
                      ) : filteredBoards.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                          <MaterialCommunityIcons name="school-outline" size={40} color="#ccc" />
                          <Text style={{ marginTop: 12, color: '#aaa', fontFamily: 'Poppins_400Regular' }}>No boards found</Text>
                        </View>
                      ) : (
                        filteredBoards.map(board => (
                          <BoardCard key={board.id} item={board} />
                        ))
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

                </ScrollView>
              </ImageBackground>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <BackButton size={24} color="#000" onPress={onBack || (() => router.back())} />
          <View>
            <Text style={styles.mobileTitle}>Educational Boards</Text>
            <Text style={styles.mobileSubtitle}>{filteredBoards.length} Available</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.mobileSearchSection}>
        <View style={styles.mobileSearchBar}>
          <FontAwesome name="search" size={16} color="#999" style={styles.mobileSearchIcon} />
          <TextInput
            style={styles.mobileSearchInput}
            placeholder="Search educational boards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Boards List */}
      {boardsLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#4A7BF7" />
          <Text style={{ marginTop: 12, color: '#666', fontFamily: 'Poppins_400Regular' }}>Loading boards...</Text>
        </View>
      ) : filteredBoards.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <MaterialCommunityIcons name="school-outline" size={40} color="#ccc" />
          <Text style={{ marginTop: 12, color: '#aaa', fontFamily: 'Poppins_400Regular' }}>No boards found</Text>
        </View>
      ) : (
        <FlatList
          data={currentBoards}
          keyExtractor={(item) => item.id?.toString() || item.board || ''}
          contentContainerStyle={styles.mobileBoardsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const [mobileImageError, setMobileImageError] = useState(false);
            const mobilePlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || item.board || 'Board')}&background=${(item.color || '#3B5BFE').replace('#', '')}&color=fff&size=150`;
            
            return (
            <TouchableOpacity
              style={styles.mobileBoardCard}
              onPress={() => handleBoardPress(item)}
            >
              <View style={[styles.mobileBoardHeader, { backgroundColor: (item.color || '#4A7BF7') + '20' }]}>
                <Image
                  source={{ uri: mobileImageError ? mobilePlaceholder : (item.logo || mobilePlaceholder) }}
                  style={styles.mobileBoardLogo}
                  onError={() => setMobileImageError(true)}
                />
                <View style={styles.mobileBoardBadge}>
                  <Text style={styles.mobileBoardBadgeText}>{item.teacherCount || 0}</Text>
                </View>
              </View>
              <View style={styles.mobileBoardInfo}>
                <Text style={styles.mobileBoardName}>{item.name || item.board || 'Unknown Board'}</Text>
                <Text style={styles.mobileBoardFullName}>{item.fullName || item.boardname || ''}</Text>
                <Text style={styles.mobileBoardDescription}>{item.description || `${item.boardname || 'Educational Board'} - Learn and grow`}</Text>
                <View style={styles.mobileBoardMeta}>
                  <View style={styles.mobileBoardMetaItem}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.mobileBoardMetaText}>{item.headquarters || 'India'}</Text>
                  </View>
                  <View style={styles.mobileBoardMetaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#666" />
                    <Text style={styles.mobileBoardMetaText}>Est. {item.established || 'Various'}</Text>
                  </View>
                </View>
                <View style={styles.mobileBoardFooter}>
                  <Text style={styles.mobileTeacherCount}>{item.teacherCount || 0} Teachers</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4A7BF7" />
                </View>
              </View>
            </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Mobile Pagination */}
      {!boardsLoading && filteredBoards.length > 0 && (
        <View style={styles.mobilePagination}>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === 1 && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.mobilePageText}>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === totalPages && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#333'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // New Web Layout Styles
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  rootLayout: { flex: 1, flexDirection: 'column', backgroundColor: COLORS.cardBackground },
  mainColumnsLayout: { flex: 1, flexDirection: 'row' },

  // --- CENTER CONTENT ---
  centerContentContainer: { flex: 1 },
  centerContentScroll: { padding: 32, paddingBottom: 60 },
  
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blueBorder,
    padding: 24,
    marginBottom: 32,
  },

  // --- BANNER ---
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

  // --- BOARDS GRID & CARD ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  boardCardWrapper: {
    width: '23%',  // Forms a 4-column grid (23*4 = 92% + 3 gaps)
    position: 'relative',
    marginBottom: 26, // Space for over-flowing label pill
  },
  boardCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140, 
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.03)',
    elevation: 2,
  },
  boardLogo: {
    width: 80,
    height: 80,
  },
  boardLabelPill: {
    position: 'absolute',
    bottom: -15,   // Overlaps the bottom edge cleanly
    alignSelf: 'center',
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 16,
  },
  boardLabelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.tagTxt,
    letterSpacing: 0.5,
  },

  // --- PAGINATION ---
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

  // --- THOUGHTS PANEL ---
  rightPanel: {
    width: Platform.OS === 'web' ? '25%' : wp(25), minWidth: 300, backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 24,
  },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'center' },
  thoughtsList: { paddingBottom: 40 },

  // Web Styles
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBackBtn: {
    padding: 8,
    marginRight: 15,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  webSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webTotalCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  webSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  webSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  webSearchIcon: {
    marginRight: 10,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  webBoardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  webBoardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  webBoardCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
    marginBottom: 20,
  },
  webBoardHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  webBoardLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  webBoardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4A7BF7',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webBoardBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  webBoardInfo: {
    padding: 15,
  },
  webBoardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  webBoardFullName: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  webBoardDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  webBoardMeta: {
    marginBottom: 12,
  },
  webBoardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  webBoardMetaText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 4,
  },
  webBoardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  webTeacherCount: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  webPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  webPageBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  webPageBtnDisabled: {
    opacity: 0.5,
  },
  webPageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },

  // Mobile Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginLeft: 15,
  },
  mobileSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  mobileSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  mobileSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  mobileSearchIcon: {
    marginRight: 10,
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  mobileBoardsList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mobileBoardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 15,
    overflow: 'hidden',
  },
  mobileBoardHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  mobileBoardLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  mobileBoardBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4A7BF7',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mobileBoardBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileBoardInfo: {
    padding: 15,
  },
  mobileBoardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  mobileBoardFullName: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  mobileBoardDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  mobileBoardMeta: {
    marginBottom: 12,
  },
  mobileBoardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mobileBoardMetaText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 4,
  },
  mobileBoardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  mobileTeacherCount: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobilePagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  mobilePageBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mobilePageBtnDisabled: {
    opacity: 0.5,
  },
  mobilePageText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.25)',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginRight: 10,
  },
  postBtn: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'Poppins_400Regular',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reportBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
