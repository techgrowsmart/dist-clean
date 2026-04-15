import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons, AntDesign } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';
import BackButton from "../../../components/BackButton";
import WebNavbar from "../../../components/ui/WebNavbar";
import WebSidebar from "../../../components/ui/WebSidebar";
import ThoughtsCard from "./ThoughtsCard";
import { getAuthData } from "../../../utils/authStorage";
import { autoRefreshToken } from '../../../utils/tokenRefresh';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../../utils/favoritesEvents';

const { width } = Dimensions.get("window");

export default function SpotLightSkillteachers({ onBack }: {
  onBack: () => void;
}) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [totalSpotlightCount, setTotalSpotlightCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Web header and ThoughtsCard state
  const [studentName, setStudentName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Home");
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

  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

  const ITEMS_PER_PAGE = Platform.OS === 'web' ? 4 : 3;
  const totalPages = Math.ceil(totalSpotlightCount / ITEMS_PER_PAGE);
  
  // Calculate paginated data based on current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = allTeachers.slice(startIndex, endIndex);

  // Fetch real skill teachers data
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token) {
          Alert.alert("Session Expired", "Please log in again.");
          return;
        }
        console.log("token", auth.token);
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const response = await axios.post(
          `${BASE_URL}/api/teachers`,
          {
            count: 100, // Fetch more teachers to handle pagination client-side
            page: 1,
            category: "Skill teacher", // Fetch skill teachers specifically
          },
          {
            headers,
          }
        );
        const data = response.data;
        console.log("Fetched skill teachers data:", data);
        if (!data || !data.spotlightTeachers) {
          console.error("Invalid data format received:", data);
          Alert.alert("Error", "Invalid data format received.");
          return;
        }
        const skillTeachers = data.spotlightTeachers?.["Skill teacher"] || [];
        console.log("skill teacher spotlight component", skillTeachers);
        if (!Array.isArray(skillTeachers)) {
          console.error("Invalid data format for Skill teachers:", skillTeachers);
          Alert.alert("Error", "Invalid data format received.");
          return;
        }
        const uniqueTeachers = Array.from(new Map(skillTeachers.map(item => [item.email, item])).values());
        setAllTeachers(uniqueTeachers);
        setTotalSpotlightCount(uniqueTeachers.length);

      } catch (error) {
        console.error("Failed to fetch skill teachers:", error);
        Alert.alert("Error", "Failed to fetch skill teachers.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []); // Removed currentPage dependency - fetch all data once

  // Check favorite status for teachers when they are loaded
  useEffect(() => {
    const checkFavorites = async () => {
      if (allTeachers.length === 0) return;
      
      const likedStatus: {[key: string]: boolean} = {};
      
      for (const teacher of allTeachers) {
        if (teacher.email) {
          const isFavorited = await checkFavoriteStatus(teacher.email);
          likedStatus[teacher.email] = isFavorited;
        }
      }
      
      setLikedTeachers(likedStatus);
    };
    
    checkFavorites();
  }, [allTeachers]);

  const filteredTeachers = allTeachers.filter(teacher => 
    teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTeachers = filteredTeachers.slice(startIndex, endIndex);

  // Fetch posts for ThoughtsCard (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const init = async () => {
      try {
        await autoRefreshToken();
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
              if (data.name || data.profileimage) {
                setStudentName(data.name || '');
                setProfileImage(data.profileimage || '');
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, []);

  const handleTeacherLike = async (teacherEmail: string) => {
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
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setLikedTeachers(prev => ({
        ...prev,
        [teacherEmail]: isLiked
      }));
    }
  };

  const handleViewProfile = (teacher: any) => {
    router.push({
      pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
      params: { 
        name: teacher.name, 
        email: teacher.email,
        profilePic: teacher.profilePic 
      }
    });
  };

  const handleBookClass = (teacher: any) => {
    router.push({
      pathname: "/(tabs)/StudentDashBoard/BookClass",
      params: { 
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        price: teacher.price
      }
    });
  };

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
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data?.name) {
        const profile = { name: response.data.name, profilePic: response.data.profileimage || '' };
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  // Web layout with header, sidebar, and ThoughtsCard
  if (Platform.OS === 'web' && isDesktop) {
    return (
      <SafeAreaView style={styles.webContainer}>
        <WebNavbar
          studentName={studentName || 'Student'}
          profileImage={profileImage}
        />
        <View style={styles.rootContainer}>
          <WebSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || ''}
            studentName={studentName || 'Student'}
            profileImage={profileImage}
          />
          <View style={styles.mainLayout}>
            {/* Simple Page Header - matching My Tuitions */}
            <View style={styles.pageHeader}>
              <BackButton onPress={onBack} color="white" />
              <Text style={styles.pageTitle}>Spotlight Teachers</Text>
            </View>

            {/* Content */}
            <View style={styles.contentLayout}>
              {/* Teachers Grid */}
              <ScrollView style={styles.teachersContainer} showsVerticalScrollIndicator={false}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A7BF7" />
                    <Text style={styles.loadingText}>Loading spotlight teachers...</Text>
                  </View>
                ) : currentTeachers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No spotlight teachers found</Text>
                    <Text style={styles.emptySubtext}>Check back later for featured teachers</Text>
                  </View>
                ) : (
                  <View style={styles.teachersGrid}>
                    {currentTeachers.map((item, index) => (
                      <View key={item.id?.toString() || item.email || `item-${index}`} style={styles.teacherCard}>
                        <TouchableOpacity
                          onPress={() => {
                            router.push({
                              pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                              params: {
                                name: item.name,
                                email: item.email,
                                board: item.board,
                                subject: item.subject,
                                language: item.language,
                                profilePic: item.profilePic,
                              },
                            });
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.cardImageContainer}>
                            <Image source={{ uri: item.profilePic }} style={styles.teacherImage} />
                            <TouchableOpacity 
                              style={styles.heartButton}
                              onPress={(e) => { e.stopPropagation(); handleLike(item.id); }}
                            >
                              <AntDesign 
                                name={likedTeachers[item.id] ? "heart" : "hearto"} 
                                size={16} 
                                color={likedTeachers[item.id] ? "#FF0000" : "#FFFFFF"} 
                              />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.cardBody}>
                            <View style={styles.cardHeaderRow}>
                              <Text style={styles.tagText}>{item.specialty || 'SKILL'}</Text>
                              <View style={styles.ratingBadge}>
                                <FontAwesome name="star" size={12} color="#FFFFFF" />
                                <Text style={styles.ratingText}>4.8</Text>
                              </View>
                            </View>
                            <Text style={styles.teacherName}>{item.name || "Unnamed"}</Text>
                            <Text style={styles.teacherDesc} numberOfLines={2}>Professional teacher dedicated to student success and excellence in education.</Text>
                            <View style={styles.cardFooter}>
                              <TouchableOpacity style={styles.reviewBtn}>
                                <Text style={styles.reviewBtnText}>Your Review</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Pagination - matching My Tuitions style */}
              {!loading && currentTeachers.length > 0 && totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#ccc" : "#333"} />
                  </TouchableOpacity>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                      onPress={() => setCurrentPage(page)}
                    >
                      <Text style={[styles.pageText, currentPage === page && styles.pageTextActive]}>{page}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                    onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#ccc" : "#333"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      {/* Simple Header - matching My Tuitions */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <BackButton size={24} color="#000" onPress={onBack} />
          <Ionicons name="star" size={24} color="#1F2937" />
          <Text style={styles.mobileTitle}>Spotlight Teachers</Text>
        </View>
      </View>

      {/* Teachers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7BF7" />
          <Text style={styles.loadingText}>Loading spotlight teachers...</Text>
        </View>
      ) : currentTeachers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No spotlight teachers found</Text>
          <Text style={styles.emptySubtext}>Check back later for featured teachers</Text>
        </View>
      ) : (
        <FlatList
          data={currentTeachers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.mobileTeachersList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
          <View style={styles.mobileTeacherCard}>
            <View style={styles.mobileTeacherHeader}>
              <Image source={item.profilePic} style={styles.mobileTeacherImage} />
              <View style={styles.mobileTeacherOverlay}>
                <TouchableOpacity 
                  style={styles.mobileLikeBtn}
                  onPress={() => handleLike(item.id)}
                >
                  <AntDesign 
                    name={likedTeachers[item.id] ? "heart" : "hearto"} 
                    size={18} 
                    color={likedTeachers[item.id] ? "#FF4444" : "#fff"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.mobileTeacherInfo}>
              <Text style={styles.mobileTeacherName}>{item.name}</Text>
              <Text style={styles.mobileTeacherSpecialty}>{item.specialty}</Text>
              <View style={styles.mobileTeacherMeta}>
                <View style={styles.mobileRating}>
                  <FontAwesome name="star" size={12} color="#FFA500" />
                  <Text style={styles.mobileRatingText}>{item.rating}</Text>
                  <Text style={styles.mobileReviewsText}>({item.reviews})</Text>
                </View>
                <Text style={styles.mobileExperience}>{item.experience}</Text>
              </View>
              <Text style={styles.mobileTeacherDescription}>{item.description}</Text>
              
              <View style={styles.mobileTeacherFooter}>
                <Text style={styles.mobileTeacherPrice}>{item.price}</Text>
                <View style={styles.mobileTeacherActions}>
                  <TouchableOpacity 
                    style={styles.mobileViewProfileBtn}
                    onPress={() => handleViewProfile(item)}
                  >
                    <Text style={styles.mobileViewProfileBtnText}>Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.mobileBookBtn}
                    onPress={() => handleBookClass(item)}
                  >
                    <Text style={styles.mobileBookBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />
      )}

      {/* Mobile Pagination - only show when not loading and has data */}
      {!loading && currentTeachers.length > 0 && (
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
  // Web Styles
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins_700Bold'
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFA500'
  },
  spotlightBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2410C',
    marginLeft: 6
  },
  contentLayout: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  searchSection: {
    marginBottom: 24
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  searchIcon: {
    marginRight: 16
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Poppins_400Regular'
  },
  teachersContainer: {
    flex: 1,
    marginBottom: 24
  },
  teachersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  teacherCard: {
    width: '31%',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  teacherImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 6,
  },
  cardBody: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagText: {
    color: '#3B5BFE',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginLeft: 4,
  },
  teacherName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  teacherDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  reviewBtn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reviewBtnText: {
    color: '#1F2937',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pageBtnDisabled: {
    opacity: 0.4
  },
  pageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
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
  webSpotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  webSpotlightBadgeText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'Poppins_600SemiBold',
  },
  webHeroSection: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  webHeroContent: {
    maxWidth: 800,
  },
  webHeroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  webHeroDescription: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
    opacity: 0.9,
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
  webTeachersContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  webTeachersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  webTeacherCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({

      web: {

        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',

      },

      default: {

        shadowColor: '#000',

        shadowOffset: { width: 0, height: 4 },

        shadowOpacity: 0.3,

        shadowRadius: 8,

      },

    }),
    elevation: 5,
  },
  webTeacherHeader: {
    position: 'relative',
  },
  webTeacherImage: {
    width: '100%',
    height: 180,
  },
  webTeacherOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  webSpotlightIcon: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 8,
  },
  webLikeBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
  },
  webTeacherInfo: {
    padding: 15,
  },
  webTeacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  webTeacherSpecialty: {
    fontSize: 14,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  webTeacherMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  webRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webRatingText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 4,
  },
  webReviewsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 2,
  },
  webExperience: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  webTeacherDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 10,
  },
  webAchievements: {
    marginBottom: 10,
  },
  webAchievementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },
  webAchievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 3,
    gap: 5,
  },
  webAchievementText: {
    fontSize: 10,
    color: '#856404',
    fontFamily: 'Poppins_400Regular',
  },
  webTeacherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webTeacherPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
  },
  webTeacherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  webViewProfileBtn: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  webViewProfileBtnText: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  webBookBtn: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  webBookBtnText: {
    fontSize: 12,
    color: '#fff',
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
    justifyContent: 'space-between',
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
  mobileSpotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  mobileSpotlightBadgeText: {
    fontSize: 10,
    color: '#856404',
    fontFamily: 'Poppins_600SemiBold',
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
  mobileTeachersList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mobileTeacherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 15,
    overflow: 'hidden',
  },
  mobileTeacherHeader: {
    position: 'relative',
  },
  mobileTeacherImage: {
    width: '100%',
    height: 150,
  },
  mobileTeacherOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  mobileSpotlightIcon: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 8,
  },
  mobileLikeBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
  },
  mobileTeacherInfo: {
    padding: 15,
  },
  mobileTeacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  mobileTeacherSpecialty: {
    fontSize: 14,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  mobileTeacherMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileRatingText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 4,
  },
  mobileReviewsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginLeft: 2,
  },
  mobileExperience: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  mobileTeacherDescription: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 10,
  },
  mobileTeacherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileTeacherPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
  },
  mobileTeacherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mobileViewProfileBtn: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mobileViewProfileBtnText: {
    fontSize: 12,
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobileBookBtn: {
    backgroundColor: '#4A7BF7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mobileBookBtnText: {
    fontSize: 12,
    color: '#fff',
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
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
});
