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
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import { 
  OpenSans_600SemiBold,
  OpenSans_300Light,
  OpenSans_400Regular,
} from '@expo-google-fonts/open-sans';
import { 
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../BottomNavigation";
import Sidebar from "./Sidebar";
import axios from "axios";
import { getFavoriteTeachers } from '../../../services/favoriteTeachers' 
import { AntDesign } from '@expo/vector-icons';

const ITEMS_PER_PAGE = 6;

const Favourite = ({ onBack }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [allFavourites, setAllFavourites] = useState([]);
  
  // Load all fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
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
  
  // ADDED STATE VARIABLES
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSubText, setActiveSubText] = useState<string | null>("Dashboard");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storedUserEmail, setStoredUserEmail] = useState<string | null>(null);
  
  // ADD UNREAD COUNT STATE
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      console.log('🔍 [Favourite] Fetching unread count...');
      const auth = await getAuthData();
      if (!auth?.token) {
        console.log('🔑 [Favourite] No auth token found');
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/notifications/unread-count`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
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

        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const profileResponse = await axios.post(
          `${BASE_URL}/api/userProfile`,
          { email: auth.email },
          { headers }
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

  const handleUnlikePress = async (teacherEmail: string) => {
    try {
        // Optimistic update - remove from UI immediately
        setAllFavourites(prev => 
            prev.filter(fav => fav.email !== teacherEmail)
        );
        
        // Update liked status
        setLikedTeachers(prev => ({
            ...prev,
            [teacherEmail]: false
        }));
        
        // API call to remove from favorites
        const { removeFavoriteTeacher } = await import('../../../services/favoriteTeachers');
        await removeFavoriteTeacher(teacherEmail);
        
    } catch (error) {
        console.error('Error removing favorite:', error);
        // Revert on error
        const fetchFavourites = async () => {
            const favorites = await getFavoriteTeachers();
            setAllFavourites(favorites);
        };
        fetchFavourites();
        Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

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
            image: profilePic 
                ? { uri: profilePic }
                : require("../../../assets/images/Profile.png"),
        };
          
        console.log("✅ Final processed item:", result);
        return result;
    });
  }, [allFavourites, likedTeachers]);

  const totalPages = Math.ceil(favouritesWithDetails.length / ITEMS_PER_PAGE);
  const paginatedData = favouritesWithDetails.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPagination = () => (
    <View style={styles.paginationWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pagination} style={{ overflow: 'visible' }}>
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.arrows}
        >
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity key={page} onPress={() => handlePageChange(page)} style={styles.page}>
            <View style={[styles.pageNumber, currentPage === page && styles.activePage]}>
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

  if (!fontsLoaded) return <Text>Loading...</Text>;

  if (loading) {
    return (
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <ActivityIndicator size="large" color="#4255FF" />
            <Text style={{ marginTop: 10, fontSize: wp('3.73%'), color: "#666" }}>Loading Favorites...</Text>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section - Exactly like Student Dashboard */}
      <View style={styles.headerContainer}>
        {/* Logo Container with Text - Same as Student.tsx */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>GROWSMART</Text>
        </View>

        <View style={styles.topRow}>
          {/* Profile - UPDATED WITH ONPRESS */}
          <TouchableOpacity 
            onPress={() => setIsSidebarVisible(true)}
            style={styles.profileContainer}
          >
            <Image
              style={styles.profileImage}
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../../assets/images/Profile.png")
              }
            />
          </TouchableOpacity>

          {/* Search Bar - Same logic as Student.tsx */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Image
                style={styles.searchIcon}
                source={require("../../../assets/images/Search.png")}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search favourites"
                placeholderTextColor="#82878F"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery("")} 
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notification Bell - WITH UNREAD COUNT */}
          <TouchableOpacity
            onPress={() =>
              router.push("/(tabs)/StudentDashBoard/StudentNotification")
            }
          >
            <View style={{ position: "relative" }}>
              <NotificationBellIcon size={wp("6.4%")} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
            <Text style={styles.title}>Favourites</Text>
          <Text style={styles.totalCount}>{favouritesWithDetails.length} Found</Text>
        </View>

        <FlatList
          data={paginatedData}
          numColumns={1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => router.push({
                    pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
                    params: {
                        name: item.name,
                        email: item.email,
                        board: item.board || "",
                        teachingClass: item.teachingClass || "",
                        subject: item.subject || "",
                        language: item.language || "",
                        profilePic: item.profilePic,
                        charge: item.charge,
                        description: item.introduction || item.description || "",
                        category: item.category,
                    },
                })}
            >
                <View style={styles.leftSection}>
                    <Image 
                        source={item.profilePic 
                            ? { uri: item.profilePic } 
                            : require("../../../assets/images/Profile.png")} 
                        style={styles.image}
                        defaultSource={require("../../../assets/images/Profile.png")}
                    />
                    <Text style={styles.name}>{item.name}</Text>
                </View>
                <View style={styles.rightSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.profession}>{item.category}</Text>
                    </View>
                    <Text style={styles.description} numberOfLines={3}>
                        {item.introduction || item.description || ""}
                    </Text>
                    <View style={styles.ratingRow}>
                        <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>
                        <TouchableOpacity 
                            onPress={(e) => { 
                                e.stopPropagation(); 
                                handleUnlikePress(item.email); 
                            }} 
                            style={styles.likeButton}
                        >
                            <AntDesign 
                                name="like1" 
                                size={24} 
                                color="#4255ff" 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.grid}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptyText}>Your favourite items will appear here once you add them.</Text>
            </View>
          }
        />

        {favouritesWithDetails.length > -1 && renderPagination()}
      </View>

      {/* ADDED SIDEBAR COMPONENT */}
      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSubText={activeSubText}
        setActiveSubText={setActiveSubText}
        studentName={studentName}
        profileImage={profileImage}
        userEmail={storedUserEmail || ""}
        onItemPress={(itemName: string) => {
          setActiveMenu(itemName);
          if (itemName === "Billing") {
            router.push({
              pathname: "/(tabs)/Billing",
              params: {
                userEmail: storedUserEmail,
                userType: userRole,
              },
            });
          }
          if (itemName === "My Tutions") {
            // Handle My Tutions navigation if needed
          }
          if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
          if (itemName === "Share") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Share",
              params: { userEmail: storedUserEmail, studentName, profileImage },
            });
          }
          if (itemName === "Subscription") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Subscription",
              params: { userEmail: storedUserEmail },
            });
          }
          if (itemName === "Terms") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/TermsAndConditions",
            });
          }
          if (itemName === "Contact Us") {
            router.push({ pathname: "/(tabs)/Contact" });
          }
          if (itemName === "Privacy Policy") {
            router.push({ pathname: "/(tabs)/StudentDashBoard/PrivacyPolicy" });
          }
        }}
      />

      <BottomNavigation userType="student" />
    </View>
  );
};

export default Favourite;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
headerContainer: { 
  backgroundColor: "#5f5fff", 
  paddingHorizontal: wp("4.8%"), 
  paddingTop: hp("5%"), // Should match Student.tsx
  paddingBottom: hp("2%"), // Should match Student.tsx
  borderBottomLeftRadius: wp("4.53%"), 
  borderBottomRightRadius: wp("4.53%") 
},
logoContainer: {
  alignItems: 'center',
  width: '100%',
  marginBottom: hp('1%'), // Add margin for spacing
},
logoText: {
  color: '#e5e7eb',
  fontSize: wp('4%'),
  fontFamily: 'Poppins_400Regular',
  fontWeight: '500',
  lineHeight: hp('1.6%'), // Match Student.tsx
  textAlign: 'center',
  letterSpacing: wp('0.2%'),
  top: hp('2%'), // Match Student.tsx
  bottom: hp('3%'), // Match Student.tsx
  marginBottom: hp('1%'),
},
topRow: { 
  flexDirection: "row", 
  alignItems: "center", 
  justifyContent: "space-between", 
  width: "100%", 
  paddingHorizontal: wp("4%"),
  marginTop: hp('0.5%'), // Add small margin for better spacing
},
  profileContainer: { 
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: wp("2%"), 
    borderWidth: 1, 
    borderColor: 'white', 
    borderRadius: 100 
  },
  profileImage: { 
    width: wp("12%"), 
    height: wp("12%"), 
    borderRadius: wp("6%") 
  },
  searchRow: { 
    flex: 1, 
    marginHorizontal: wp("2%") 
  },
 searchInputContainer: { 
  flexDirection: "row", 
  alignItems: "center", 
  backgroundColor: "#f1f1f1", 
  paddingHorizontal: wp("2%"), // Reduced padding
  borderRadius: wp("4.27%"), 
  height: wp("10%") 
},
  searchIcon: { 
    width: wp("4%"), 
    height: wp("4%"), 
    marginRight: wp("2%"), 
    tintColor: "#000" 
  },
searchInput: { 
  flex: 1, 
  fontFamily: "Montserrat_400Regular", 
  fontSize: wp("3.73%"), 
  color: "#7d7d7d", 
  overflowX: "hidden", 
  height: "100%", 
  borderWidth: 0, 
  outlineWidth: 0, 
  width: "100%", 
  paddingVertical: 0, 
  textAlignVertical: "center",
  paddingHorizontal: wp("1%"), // Added padding
},
  clearButton: {
    padding: wp("1%"),
    marginLeft: wp("1%"),
  },
  clearButtonText: {
    fontSize: wp("4%"),
    color: "#666",
  },
  notificationBadge: { 
    position: "absolute", 
    top: hp("-0.538%"), 
    right: wp("-1.066%"), 
    backgroundColor: "red", 
    borderRadius: wp("2.666%"), 
    minWidth: wp("4.8%"), 
    height: wp("4.8%"), 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: wp("1.065%"), 
    zIndex: 1 
  },
  notificationText: { 
    color: "white", 
    fontSize: wp("3.2%"), 
    fontWeight: "bold" 
  },
  contentContainer: { 
    flex: 1, 
    backgroundColor: "#fff", 
    paddingHorizontal: wp('4.27%'), 
    paddingTop: hp('2.69%'), 
    paddingBottom: 0 
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: hp('2.15%'), 
    justifyContent: "space-between" 
  },
  title: { 
    fontSize: wp('4.27%'), 
    fontWeight: "bold", 
    marginLeft: wp('2.4%'), 
    color: "#0d0c12",
    fontFamily: "Poppins_600SemiBold"
  },
  totalCount: { 
    fontSize: wp('3.73%'), 
    color: "#4255ff", 
    textAlign: "right",
    fontFamily: "Poppins_400Regular"
  },
  grid: { 
    paddingBottom: hp('20%')
  },
  card: { 
    flexDirection: "row", 
    backgroundColor: "#ffffff", 
    padding: wp('4.27%'), 
    borderRadius: wp('4.27%'), 
    marginVertical: hp('1.08%'), 
    alignItems: "flex-start", 
    gap: wp('4.27%'), 
    borderWidth: 1, 
    borderColor: "#edeeee" 
  },
  leftSection: { 
    alignItems: "center", 
    width: wp('28.8%'), 
    height: hp('17.9%'), 
    backgroundColor: "#ffffff", 
    padding: wp('2.67%'), 
    borderRadius: wp('4.27%'), 
    borderWidth: 1, 
    borderColor: "#faf5e6" 
  },
  image: { 
    width: wp('24.5%'), 
    height: wp('24.5%'), 
    borderRadius: wp('2.13%'), 
    marginBottom: hp('1.07%') 
  },
  name: { 
    fontSize: wp('4.27%'), 
    fontWeight: "600", 
    textAlign: "center", 
    color: "#0d0c12",
    fontFamily: "OpenSans_400Regular"
  },
  rightSection: { 
    flex: 1 
  },
  titleRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: hp('0.8%') 
  },
  profession: { 
    fontSize: wp('4.27%'), 
    fontWeight: "bold", 
    color: "#0d0c12",
    fontFamily: "Roboto_500Medium"
  },
  description: { 
    fontSize: wp('3.73%'), 
    color: "#555", 
    marginBottom: hp('1.07%'), 
    lineHeight: wp('4.5%'),
    fontFamily: "OpenSans_400Regular"
  },
  ratingRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  rating: { 
    fontSize: wp('4.27%'), 
    color: "#f1c40f" 
  },
  likeButton: { 
    padding: wp('1%') 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: hp('10%') 
  },
  emptyTitle: { 
    fontSize: wp('4.27%'), 
    fontWeight: "bold", 
    color: "#0d0c12", 
    marginBottom: hp('1.08%'),
    fontFamily: "Poppins_600SemiBold"
  },
  emptyText: { 
    fontSize: wp('3.73%'), 
    color: "#666", 
    textAlign: "center",
    fontFamily: "OpenSans_400Regular"
  },
  paginationWrapper: { 
    width: "100%", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingBottom: hp("15%"), 
    gap: wp("2.66%"), 
    overflow: 'visible', 
    position: 'absolute', 
    bottom: hp("1%"), 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    paddingTop: hp('1%') 
  },
  pagination: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: wp("2%"), 
    overflow: 'visible' 
  },
  page: { 
    alignItems: "center", 
    justifyContent: "center", 
    overflow: 'visible' 
  },
  pageNumber: { 
    alignItems: "center", 
    justifyContent: "center", 
    height: wp("8%"), 
    width: wp("8%"), 
    paddingHorizontal: wp("2.13%"), 
    borderRadius: 5, 
    backgroundColor: "#ffffff", 
    marginHorizontal: 0, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
    elevation: 4
  },
  pageNum: { 
    fontSize: wp("4.27%"), 
    color: "#000000ff", 
    fontFamily: "OpenSans_600SemiBold"
  },
  activePage: { 
    backgroundColor: "#f0f0f0",
    elevation: 5
  },
  arrowText: { 
    fontSize: wp("5%"), 
    color: "#000000", 
    fontFamily: "OpenSans_600SemiBold", 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  arrows: { 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: wp("1.33%"), 
    backgroundColor: "#ffffff", 
    marginHorizontal: wp("1.06%"), 
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
  },
  rightArrow: { 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: wp("1.33%"), 
    backgroundColor: "#ffffff", 
    marginHorizontal: wp("1.06%"), 
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
  },
});