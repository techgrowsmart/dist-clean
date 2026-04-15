import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  OpenSans_600SemiBold,
  OpenSans_300Light,
  OpenSans_400Regular,
} from '@expo-google-fonts/open-sans';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Sidebar from "./Sidebar";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebNavbar from "../../../components/ui/WebNavbar";
import ResponsiveSidebar from "../../../components/ui/ResponsiveSidebar";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import axios from "axios";
import { getFavoriteTeachers } from '../../../services/favoriteTeachers'; 
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../../utils/favoritesEvents';
import BackButton from '../../../components/BackButton';
import { getImageSource } from '../../../utils/imageHelper';

const COLORS = { primary: '#3B5BFE', lightBackground: '#F5F7FB', cardBackground: '#FFFFFF', border: '#E5E7EB', textPrimary: '#1F2937', textSecondary: '#6B7280', ratingGreen: '#22C55E', ratingLight: '#DCFCE7' };

const ITEMS_PER_PAGE = 6;

const Favourite = () => {
  const router = useRouter();
  const [allFavourites, setAllFavourites] = useState([]);

  const { width: screenWidth } = Dimensions.get('window');
  const isDesktop = screenWidth >= 1024;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isMobile = screenWidth < 768;

  // Generate responsive styles based on screen width
  const styles = getResponsiveStyles(screenWidth);

  const [sidebarActiveItem, setSidebarActiveItem] = useState("Favourite");

  const handleSidebarItemPress = (itemName: string) => {
    setSidebarActiveItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Favourite") router.push("/(tabs)/StudentDashBoard/Favourite");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
    if (itemName === "Billing") router.push({ pathname: "/(tabs)/Billing", params: { userEmail: storedUserEmail, userType: userRole } });
    if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
    if (itemName === "Share") router.push({ pathname: "/(tabs)/StudentDashBoard/Share", params: { userEmail: storedUserEmail, studentName, profileImage } });
    if (itemName === "Subscription") router.push({ pathname: "/(tabs)/StudentDashBoard/Subscription", params: { userEmail: storedUserEmail } });
    if (itemName === "Terms") router.push("/(tabs)/StudentDashBoard/TermsAndConditions");
    if (itemName === "Contact Us") router.push({ pathname: "/(tabs)/Contact" });
    if (itemName === "Privacy Policy") router.push({ pathname: "/(tabs)/StudentDashBoard/PrivacyPolicy" });
    if (itemName === "Log out") { AsyncStorage.clear(); router.push("/login"); }
  };

  // Load all fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_500Medium,
    OpenSans_600SemiBold,
    OpenSans_300Light,
    OpenSans_400Regular,
    Montserrat_400Regular,
  });
  
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storedUserEmail, setStoredUserEmail] = useState<string | null>(null);
  
  // ADD UNREAD COUNT STATE
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count - FIXED HEADER IMPLEMENTATION
  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('🔍 [Favourite] Fetching unread count...');
      const auth = await getAuthData();
      if (!auth?.token) {
        console.log('🔑 [Favourite] No auth token found');
        return;
      }

      // CORRECT HEADER IMPLEMENTATION - Same as AllBoardsPage
      const headers = {
        Authorization: `Bearer ${auth?.token}`,
        "Content-Type": "application/json",
      };

      const response = await axios.get(
        `${BASE_URL}/api/notifications/unread-count`,
        { headers } // Using headers object exactly like AllBoardsPage
      );
      
      if (response.data && typeof response.data.count === 'number') {
        console.log(`✅ [Favourite] Setting unread count to: ${response.data.count}`);
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Set up polling for unread notifications
  useEffect(() => {
    if (studentName) {
      fetchUnreadCount();
      
      // Set up polling every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [studentName, fetchUnreadCount]);

  // ADDED USEEFFECT FOR USER DATA
  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("user_role");
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (storedEmail) {
          setStoredUserEmail(storedEmail);
          if (storedRole) {
            setUserRole(storedRole);
          }
        }
      } catch (error) {
        console.error("Error loading user email:", error);
      }
    };
    loadUserEmail();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;

        // CORRECT HEADER IMPLEMENTATION - Same as AllBoardsPage
        const headers = {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        };

        const profileResponse = await axios.post(
          `${BASE_URL}/api/userProfile`,
          { email: auth.email },
          { headers } // Using headers object exactly like AllBoardsPage
        );

        const profileData = profileResponse.data;
        setStudentName(profileData.name || "");
        setProfileImage(profileData.profileimage || null);

        await AsyncStorage.multiSet([
          ["studentName", profileData.name || ""],
          ["profileImage", profileData.profileimage || ""],
        ]);
      } catch (error) {
        console.error("❌ Error fetching student profile:", error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchFavourites = async () => {
        setLoading(true);
        try {
            const favorites = await getFavoriteTeachers();
            console.log("✅ Raw favorites data:", favorites);
            
            setAllFavourites(favorites);
            
            // Set all teachers as liked since they're favorites
            const likedStatus: {[key: string]: boolean} = {};
            favorites.forEach(fav => {
                const teacherEmail = fav.email;
                likedStatus[teacherEmail] = true;
            });
            setLikedTeachers(likedStatus);
        } catch (err) {
            console.error("❌ Failed to fetch favourites:", err);
            setAllFavourites([]);
        } finally {
            setLoading(false);
        }
    };

    fetchFavourites();
  }, []);


  const favouritesWithDetails = useMemo(() => {
    console.log("🔄 Processing allFavourites:", allFavourites);
    
    if (!Array.isArray(allFavourites)) {
        console.log("❌ allFavourites is not an array:", allFavourites);
        return [];
    }
    
    return allFavourites.map((item, index) => {
        const teacherData = item || {};
        
        const teacherEmail = teacherData.email || "";
        const teacherName = teacherData.name || "Unknown Teacher";
        
        // Clean profile picture URL
        let profilePic = '';
        if (teacherData.profilepic) {
            profilePic = String(teacherData.profilepic).trim().replace(/^"|"$/g, "");
        }
        
        // Create description based on category
        let description = teacherData.introduction || teacherData.description || "";
        let categoryDisplay = teacherData.category || "";
        
        // Add specific details based on category
        if (teacherData.category === "Subject teacher") {
            if (teacherData.subject) {
                categoryDisplay = `${teacherData.subject} Teacher`;
            }
            if (teacherData.teachingClass) {
                description = `Class ${teacherData.teachingClass} • ${description}`;
            }
        } else if (teacherData.category === "Skill teacher") {
            if (teacherData.skill_name) {
                categoryDisplay = `${teacherData.skill_name} Expert`;
            }
        }
        
        const result = {
            ...item,
            id: index.toString(),
            name: teacherName,
            email: teacherEmail,
            profilePic: profilePic,
            introduction: teacherData.introduction || teacherData.description || "",
            description: description,
            category: categoryDisplay,
            subject: teacherData.subject || "",
            teachingClass: teacherData.teachingClass || "",
            language: teacherData.language || "",
            board: teacherData.board || "",
            isLiked: likedTeachers[teacherEmail] || true,
            image: getImageSource(profilePic) || require("../../../assets/images/Profile.png"),
        };
          
        console.log("✅ Final processed item:", result);
        return result;
    });
  }, [allFavourites, likedTeachers]);

  // Pagination logic
  const totalPages = Math.ceil(favouritesWithDetails.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFavourites = favouritesWithDetails.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBackPress = useCallback(() => { router.push('/(tabs)/StudentDashBoard/Student'); }, [router]);

  const handleContactPress = (item: any) => router.push({
    pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
    params: {
      name: item.name,
      email: item.email,
      profilePic: item.profilePic,
      board: item.board || "",
      teachingClass: item.teachingClass || "",
      subject: item.subject || "",
      language: item.language || "",
      charge: item.charge,
      description: item.introduction || item.description || "",
      category: item.category,
    },
  });

  const handleFavoritePress = (itemEmail: string, event: any) => {
    event.stopPropagation();
    setLikedTeachers(prev => ({ ...prev, [itemEmail]: !prev[itemEmail] }));
  };

  const handleReviewPress = (item: any, event: any) => {
    event.stopPropagation();
    router.push({
      pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
      params: {
        name: item.name,
        email: item.email,
        profilePic: item.profilePic,
        showReview: "true"
      }
    });
  };

  const renderFavouriteCard = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.tuitionCard} onPress={() => handleContactPress(item)} activeOpacity={0.8}>
      <View style={styles.cardImageContainer}>
        <Image source={getImageSource(item.profilePic) || require("../../../assets/images/Profile.png")} style={styles.cardImage} />
        <TouchableOpacity style={styles.heartButton} onPress={(e) => handleFavoritePress(item.email, e)}>
          <Ionicons name={likedTeachers[item.email] ? "heart" : "heart-outline"} size={16} color={likedTeachers[item.email] ? "#FF0000" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.tagText}>{item.subject || item.category || 'Teacher'}</Text>
          <View style={styles.ratingBadge}><Ionicons name="star" size={12} color="#FFFFFF" /><Text style={styles.ratingText}>4.5</Text></View>
        </View>
        <Text style={styles.teacherName}>{item.name}</Text>
        <Text style={styles.teacherDesc} numberOfLines={2}>{item.introduction || item.description || 'Professional teacher with expertise in various subjects.'}</Text>
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.reviewBtn} onPress={(e) => handleReviewPress(item, e)}>
            <Text style={styles.reviewBtnText}>Your Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [handleBackPress]);

  if (!fontsLoaded) return <Text>Loading...</Text>;

  if (loading) {
    return (
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <ActivityIndicator size="large" color="#4255FF" />
            <Text style={{ marginTop: 10, fontSize: wp('3.73%'), color: "#666" }}>Loading Favorites...</Text>
        </View>
    );
  }

  // Web return with ResponsiveSidebar
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Web Header - outside ResponsiveSidebar like Student Dashboard */}
        <WebNavbar
          studentName={studentName}
          profileImage={profileImage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <View style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}>
          <ResponsiveSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={storedUserEmail || ""}
            studentName={studentName || ""}
            profileImage={profileImage || null}
          >
            <View style={{ flex: 1, padding: 24 }}>
              <View style={styles.pageTitleContainer}>
                <BackButton onPress={handleBackPress} color="white" />
                <Ionicons name="heart" size={28} color={COLORS.textPrimary} />
                <Text style={styles.pageTitle}>My Favourites</Text>
              </View>

              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.tuitionGrid} showsVerticalScrollIndicator={false}>
                  {loading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your favourites...</Text></View>
                  ) : paginatedFavourites.length > 0 ? (
                    <>
                      <View style={styles.cardsWrapper}>
                        {paginatedFavourites.map((item) => renderFavouriteCard(item))}
                      </View>
                      {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                          <TouchableOpacity 
                            onPress={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                          >
                            <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <TouchableOpacity 
                              key={page} 
                              style={[styles.pageDot, currentPage === page && styles.pageDotActive]}
                              onPress={() => handlePageChange(page)}
                            >
                              <Text style={[styles.pageDotText, currentPage === page && styles.pageDotTextActive]}>{page}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity 
                            onPress={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                          >
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>No Favourites Yet</Text>
                      <Text style={styles.emptyText}>Your favourite teachers will appear here once you add them.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </ResponsiveSidebar>
        </View>
      </View>
    );
  }

  // Mobile return
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── MOBILE TOP NAVBAR ── */}
      <View style={styles.topHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput placeholder="Search favourites" placeholderTextColor={COLORS.textSecondary} style={styles.searchInput as any} value={searchQuery} onChangeText={setSearchQuery} />
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

      <View style={styles.rootContainer}>

        {/* ── LEFT SIDEBAR (mobile only) - hidden for now ── */}
        <Sidebar
          visible={false}
          onClose={() => {}}
          activeItem={sidebarActiveItem}
          onItemPress={handleSidebarItemPress}
          userEmail={storedUserEmail || ""}
          studentName={studentName || "Student"}
          profileImage={profileImage}
        />

        {/* ── MAIN AREA ── */}
        <View style={styles.mainLayout}>

          {/* ── CONTENT COLUMNS ── */}
          <View style={styles.contentColumns}>

            {/* CENTER: My Favourites Grid */}
            <View style={styles.centerContent}>
              <View style={styles.pageTitleContainer}>
                <BackButton onPress={handleBackPress} color="white" />
                <Ionicons name="heart" size={28} color={COLORS.textPrimary} />
                <Text style={styles.pageTitle}>My Favourites</Text>
              </View>

              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.tuitionGrid} showsVerticalScrollIndicator={false}>
                  {loading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your favourites...</Text></View>
                  ) : favouritesWithDetails.length > 0 ? (
                    <>
                      <View style={styles.cardsWrapper}>
                        {favouritesWithDetails.map((item) => renderFavouriteCard(item))}
                      </View>
                      {totalPages > 1 && (
                        <View style={styles.paginationContainer}>
                          <TouchableOpacity 
                            onPress={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                          >
                            <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <TouchableOpacity 
                              key={page} 
                              style={[styles.pageDot, currentPage === page && styles.pageDotActive]}
                              onPress={() => handlePageChange(page)}
                            >
                              <Text style={[styles.pageDotText, currentPage === page && styles.pageDotTextActive]}>{page}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity 
                            onPress={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                          >
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>No Favourites Yet</Text>
                      <Text style={styles.emptyText}>Your favourite teachers will appear here once you add them.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>

          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
export default Favourite;

// ─── RESPONSIVE STYLE HELPER ──────────────────────────────────────────────────────────
const getResponsiveStyles = (screenWidth: number) => {
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isSmallMobile = screenWidth < 375;
  const isMediumMobile = screenWidth >= 375 && screenWidth < 768;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    rootContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.cardBackground },
    mainLayout: { flex: 1, backgroundColor: COLORS.lightBackground },
    topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: isSmallMobile ? 10 : isMobile ? 14 : 32, paddingVertical: isSmallMobile ? 8 : isMobile ? 10 : 20, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightBackground, borderRadius: isMobile ? 16 : 30, paddingHorizontal: isSmallMobile ? 10 : 14, height: isSmallMobile ? 36 : isMediumMobile ? 40 : 44, flex: 1, maxWidth: isSmallMobile ? '45%' : isMobile ? '50%' : '40%', marginRight: isSmallMobile ? 6 : isMobile ? 8 : 12 },
    searchIcon: { marginRight: isSmallMobile ? 6 : 8 },
    searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: isSmallMobile ? 12 : isMobile ? 13 : 14, color: COLORS.textPrimary },
    profileHeaderSection: { flexDirection: 'row', alignItems: 'center' },
    bellIcon: { marginRight: isSmallMobile ? 8 : isMobile ? 10 : 20, padding: isSmallMobile ? 5 : isMobile ? 6 : 8, backgroundColor: COLORS.lightBackground, borderRadius: 16 },
    notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', borderRadius: 8, minWidth: isSmallMobile ? 16 : 18, height: isSmallMobile ? 16 : 18, justifyContent: 'center', alignItems: 'center' },
    notificationText: { color: 'white', fontSize: isSmallMobile ? 9 : 10, fontWeight: 'bold' },
    headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: isSmallMobile ? 11 : isMobile ? 12 : 14, color: COLORS.textPrimary, marginRight: isSmallMobile ? 6 : isMobile ? 8 : 12, maxWidth: isSmallMobile ? 60 : isMobile ? 80 : 120 },
    headerAvatar: { width: isSmallMobile ? 32 : isMobile ? 36 : 40, height: isSmallMobile ? 32 : isMobile ? 36 : 40, borderRadius: isSmallMobile ? 16 : isMobile ? 18 : 20 },
    contentColumns: { flex: 1, flexDirection: isMobile ? 'column' : 'row' },
    centerContent: { flex: 1, paddingTop: isSmallMobile ? 10 : isMobile ? 14 : 32, paddingHorizontal: isSmallMobile ? 10 : isMobile ? 14 : 32, paddingBottom: isSmallMobile ? 14 : isMobile ? 20 : 24 },
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: isSmallMobile ? 12 : isMobile ? 16 : 24 },
    pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: isSmallMobile ? 18 : isMobile ? 20 : 24, color: COLORS.textPrimary, marginLeft: 10 },
    container: {
      flex: 1,
      backgroundColor: COLORS.cardBackground,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: COLORS.lightBackground,
      paddingHorizontal: isSmallMobile ? 12 : isMobile ? 14 : 32,
      paddingTop: isSmallMobile ? 12 : isMobile ? 16 : 32,
      paddingBottom: isSmallMobile ? 16 : isMobile ? 20 : 24,
    },
    gridContainerBox: {
      flex: 1,
      backgroundColor: COLORS.cardBackground,
      borderRadius: isSmallMobile ? 10 : isMobile ? 12 : 20,
      borderWidth: 1,
      borderColor: '#E4ECF7',
      padding: isSmallMobile ? 10 : isMobile ? 12 : 24,
      ...Platform.select({
        web: { boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
        default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 }
      })
    },
    tuitionGrid: {
      paddingBottom: 16,
    },
    cardsWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: isMobile ? 'center' : 'space-between',
      gap: isSmallMobile ? 10 : isMobile ? 12 : 16,
    },
    tuitionCard: {
      width: isSmallMobile ? '100%' : isMobile ? '100%' : isTablet ? '48%' : '31%',
      minWidth: isSmallMobile ? '100%' : isMobile ? 280 : 180,
      marginBottom: isSmallMobile ? 10 : isMobile ? 12 : 16,
      backgroundColor: COLORS.cardBackground,
      borderRadius: isSmallMobile ? 12 : 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: 'hidden',
    },
    cardImageContainer: {
      width: '100%',
      height: isSmallMobile ? 160 : isMobile ? 180 : 180,
      position: 'relative',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    heartButton: {
      position: 'absolute',
      top: isSmallMobile ? 8 : 12,
      right: isSmallMobile ? 8 : 12,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: isSmallMobile ? 12 : 16,
      padding: isSmallMobile ? 4 : 6,
    },
    cardBody: {
      padding: isSmallMobile ? 12 : isMobile ? 14 : 16,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isSmallMobile ? 6 : 8,
    },
    tagText: {
      color: COLORS.primary,
      fontFamily: 'Poppins_600SemiBold',
      fontSize: isSmallMobile ? 9 : 10,
      letterSpacing: 0.5,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.ratingGreen,
      paddingHorizontal: isSmallMobile ? 6 : 8,
      paddingVertical: 2,
      borderRadius: isSmallMobile ? 8 : 10,
    },
    ratingText: {
      color: '#FFFFFF',
      fontFamily: 'Poppins_600SemiBold',
      fontSize: isSmallMobile ? 10 : 11,
      marginLeft: isSmallMobile ? 3 : 4,
    },
    teacherName: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: isSmallMobile ? 13 : isMobile ? 14 : 14,
      color: COLORS.textPrimary,
      marginBottom: isSmallMobile ? 3 : 4,
    },
    teacherDesc: {
      fontFamily: 'Poppins_400Regular',
      fontSize: isSmallMobile ? 10 : isMobile ? 11 : 11,
      color: COLORS.textSecondary,
      lineHeight: isSmallMobile ? 14 : 16,
      marginBottom: isSmallMobile ? 12 : 16,
    },
    cardFooter: {
      alignItems: 'flex-end',
    },
    reviewBtn: {
      backgroundColor: COLORS.ratingLight,
      paddingHorizontal: isSmallMobile ? 12 : 16,
      paddingVertical: isSmallMobile ? 5 : 6,
      borderRadius: isSmallMobile ? 16 : 20,
    },
    reviewBtnText: {
      color: COLORS.textPrimary,
      fontFamily: 'Poppins_500Medium',
      fontSize: isSmallMobile ? 11 : 12,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isSmallMobile ? 16 : isMobile ? 20 : 32,
      gap: isSmallMobile ? 6 : 8,
    },
    pageDot: {
      width: isSmallMobile ? 28 : 32,
      height: isSmallMobile ? 28 : 32,
      borderRadius: isSmallMobile ? 6 : 8,
      backgroundColor: COLORS.lightBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pageDotActive: {
      backgroundColor: COLORS.textSecondary,
    },
    pageDotText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: isSmallMobile ? 13 : 14,
      color: COLORS.textPrimary,
    },
    pageDotTextActive: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: isSmallMobile ? 13 : 14,
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isSmallMobile ? 30 : 50,
    },
    loadingText: {
      fontSize: isSmallMobile ? 14 : 16,
      fontFamily: 'Poppins_400Regular',
      color: COLORS.textSecondary,
      marginTop: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallMobile ? 16 : isMobile ? 20 : 40,
      marginTop: isSmallMobile ? 30 : 50,
    },
    emptyTitle: {
      fontSize: isSmallMobile ? 18 : 20,
      fontFamily: 'Poppins_600SemiBold',
      color: COLORS.textPrimary,
      marginBottom: isSmallMobile ? 8 : 10,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: isSmallMobile ? 13 : 14,
      fontFamily: 'Poppins_400Regular',
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: isSmallMobile ? 18 : 20,
    },
    paginationWrapper: {
      marginTop: hp('2%'),
      marginBottom: hp('2%'),
    },
    pagination: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp('2%'),
    },
    arrows: {
      backgroundColor: '#f0f0f0',
      borderRadius: wp('2%'),
      width: wp('8%'),
      height: hp('5%'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightArrow: {
      backgroundColor: '#f0f0f0',
      borderRadius: wp('2%'),
      width: wp('8%'),
      height: hp('5%'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowText: {
      fontSize: wp('4%'),
      color: '#333',
      fontWeight: 'bold',
    },
    page: {
      marginHorizontal: wp('1%'),
    },
    pageNumber: {
      width: wp('8%'),
      height: hp('5%'),
      borderRadius: wp('2%'),
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
    },
    activePage: {
      backgroundColor: '#4255FF',
      borderWidth: 0,
    },
    pageNum: {
      fontSize: wp('3.2%'),
      color: '#333',
      fontWeight: '600',
    },
  });
};