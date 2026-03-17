import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

// Import fonts
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Roboto_500Medium } from '@expo-google-fonts/roboto';
import {
  OpenSans_500Medium,
  OpenSans_300Light,
  OpenSans_400Regular,
} from "@expo-google-fonts/open-sans";
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat';

// Import components
import BottomNavigation from "../BottomNavigation";
import Sidebar from "./Sidebar";
import NotificationBellIcon from "../../../assets/svgIcons/NotificationBell";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface Contact {
  name: string;
  profilePic: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

const MyTuitions = () => {
  const router = useRouter();
  
  // Load fonts
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_500Medium,
    OpenSans_500Medium,
    OpenSans_300Light,
    OpenSans_400Regular,
    Montserrat_400Regular,
  });

  // State variables
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeSubText, setActiveSubText] = useState<string | null>("Dashboard");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) return;

        // Handle bypass token for student1@example.com
        if (auth.token === "bypass_token_student1" && auth.email === "student1@example.com") {
          console.log('🔓 [MyTuitions] Using bypass token - setting mock data');
          setStudentName("Student");
          setProfileImage(null);
          setUserEmail(auth.email);
          await AsyncStorage.multiSet([
            ["studentName", "Student"],
            ["profileImage", ""],
          ]);
          return;
        }

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
        setUserEmail(auth.email);

        await AsyncStorage.multiSet([
          ["studentName", profileData.name || ""],
          ["profileImage", profileData.profileimage || ""],
        ]);
      } catch (error: any) {
        // Handle 403 authentication errors gracefully
        if (error.response?.status === 403) {
          console.log('🔒 [MyTuitions] Authentication failed - using fallback');
        } else {
          console.log('🌐 [MyTuitions] Network error - using fallback');
        }
        
        // Fallback to cached data
        console.log("🔄 Using fallback student data");
        const cachedName = await AsyncStorage.getItem("studentName");
        const cachedImage = await AsyncStorage.getItem("profileImage");
        
        if (cachedName) {
          setStudentName(cachedName);
          setProfileImage(cachedImage || null);
        }
      }
    };

    fetchProfile();
  }, []);

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("user_role");
        if (storedRole) {
          setUserRole(storedRole);
        }
      } catch (error) {
        console.error("Error loading user role:", error);
      }
    };
    loadUserRole();
  }, []);

  // Fetch contacts (teachers) - Same as Messages.tsx
  const fetchContacts = useCallback(async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const auth = await getAuthData();
      const token = auth?.token;

      // Handle bypass token for student1@example.com
      if (token === "bypass_token_student1" && auth && auth.email === "student1@example.com") {
        console.log('🔓 [MyTuitions fetchContacts] Using bypass token - setting mock contacts');
        
        const mockContacts: Contact[] = [
          {
            name: "Dr. Sarah Johnson",
            profilePic: "",
            email: "sarah.j@example.com",
            lastMessage: "Welcome to Mathematics class!",
            lastMessageTime: "2:30 PM"
          },
          {
            name: "Prof. Michael Chen",
            profilePic: "",
            email: "michael.c@example.com",
            lastMessage: "Physics session tomorrow",
            lastMessageTime: "1:15 PM"
          }
        ];
        
        setContacts(mockContacts);
        setFilteredContacts(mockContacts);
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // For students, we want to fetch connected teachers
      const type = "student"; // Always student for My Tuitions page

      const res = await axios.post(
        `${BASE_URL}/api/contacts`,
        { userEmail, type },
        { headers }
      );

      if (res.data.success) {
        const data = res.data.contacts.map((contact: any) => ({
          name: contact.teacherName || contact.name || "Unknown Teacher",
          profilePic: contact.teacherProfilePic || contact.profilePic || "",
          email: contact.teacherEmail || contact.email,
          lastMessage: contact.lastMessage || "No messages yet",
          lastMessageTime: contact.lastMessageTime || "",
        }));

        setContacts(data);
        setFilteredContacts(data);
      } else {
        console.log("Could not fetch contacts");
      }
    } catch (error: any) {
      // Handle 403 authentication errors gracefully
      if (error.response?.status === 403) {
        console.log('🔒 [MyTuitions fetchContacts] Authentication failed - using fallback');
      } else {
        console.log('🌐 [MyTuitions fetchContacts] Network error - using fallback');
      }
      
      // Fallback to mock contacts
      console.log("🔄 Using fallback contacts data");
      const mockContacts: Contact[] = [
        {
          name: "Dr. Sarah Johnson",
          profilePic: "",
          email: "sarah.j@example.com",
          lastMessage: "Welcome to Mathematics class!",
          lastMessageTime: "2:30 PM"
        }
      ];
      
      setContacts(mockContacts);
      setFilteredContacts(mockContacts);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Fetch contacts when userEmail is available
  useEffect(() => {
    if (userEmail) {
      fetchContacts();
    }
  }, [userEmail, fetchContacts]);

  // Filter contacts based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        return;
      }

      // Handle bypass token for student1@example.com
      if (auth.token === "bypass_token_student1" && auth.email === "student1@example.com") {
        console.log('🔓 [MyTuitions fetchUnreadCount] Using bypass token - setting default count');
        setUnreadCount(0);
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
        setUnreadCount(response.data.count);
      }
    } catch (error: any) {
      // Handle 403 authentication errors gracefully
      if (error.response?.status === 403) {
        console.log('🔒 [MyTuitions fetchUnreadCount] Authentication failed - using fallback');
      } else {
        console.log('🌐 [MyTuitions fetchUnreadCount] Network error - using fallback');
      }
      
      // Always use fallback for development/testing
      console.log('🔄 Using fallback unread count');
      setUnreadCount(0);
    }
  }, []);

  // Set up polling for notifications
  useEffect(() => {
    if (studentName) {
      fetchUnreadCount();
      
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [studentName, fetchUnreadCount]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleContactPress = (contact: Contact) => {
    // Navigate to teacher details or chat
    router.push({
      pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
      params: {
        name: contact.name,
        email: contact.email,
        profilePic: contact.profilePic,
      },
    });
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => handleContactPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.contactImageContainer}>
        <Image
          source={
            item.profilePic
              ? { uri: item.profilePic }
              : require("../../../assets/images/Profile.png")
          }
          style={styles.contactImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.contactEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Tuitions Yet</Text>
      <Text style={styles.emptyText}>
        You haven't enrolled in any tuitions yet. Start by connecting with teachers!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section - Same as Student Dashboard */}
      <View style={styles.headerContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require("../../../assets/image/logo.png")} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.topRow}>
          {/* Profile */}
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

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Image
                style={styles.searchIcon}
                source={require("../../../assets/images/Search.png")}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teachers..."
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

          {/* Notification Bell */}
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

      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Tuitions</Text>
        <Text style={styles.contactsCount}>
          {filteredContacts.length} {filteredContacts.length === 1 ? 'Teacher' : 'Teachers'}
        </Text>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4255FF" />
            <Text style={styles.loadingText}>Loading your tuitions...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.email}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={renderEmptyState}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Sidebar */}
      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        activeSubText={activeSubText}
        setActiveSubText={setActiveSubText}
        studentName={studentName}
        profileImage={profileImage}
        userEmail={userEmail || ""}
        onItemPress={(itemName: string) => {
          setActiveMenu(itemName);
          if (itemName === "Billing") {
            router.push({
              pathname: "/(tabs)/Billing",
              params: {
                userEmail: userEmail,
                userType: userRole,
              },
            });
          }
          if (itemName === "My Tuitions") {
            // Already on My Tuitions page
          }
          if (itemName === "Faq") router.push("/(tabs)/StudentDashBoard/Faq");
          if (itemName === "Share") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Share",
              params: { userEmail, studentName, profileImage },
            });
          }
          if (itemName === "Subscription") {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/Subscription",
              params: { userEmail },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Header Styles - Same as Student.tsx
  headerContainer: { 
    backgroundColor: "#5f5fff", 
    paddingHorizontal: wp("4.8%"), 
    paddingTop: hp("5.1%"), 
    paddingBottom: hp("2.96%"), 
    borderBottomLeftRadius: wp("4.53%"), 
    borderBottomRightRadius: wp("4.53%") 
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    width: wp('20%'),
    height: wp('20%'),
    marginTop: -hp('5%'),
    marginBottom: -hp("1.5%"),
  },
  topRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    width: "100%", 
    paddingHorizontal: wp("4%") 
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
    paddingHorizontal: wp("3%"), 
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
    textAlignVertical: "center" 
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

  // Page Header
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("2%"),
    backgroundColor: "#fff",
  },
  pageTitle: {
    fontSize: wp("4.8%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#0d0c12",
  },
  contactsCount: {
    fontSize: wp("3.73%"),
    fontFamily: "Poppins_400Regular",
    color: "#4255ff",
  },

  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flatListContent: {
    paddingHorizontal: wp("4%"),
    paddingBottom: hp("15%"),
  },

  // Contact Card
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: wp("3%"),
    borderRadius: wp("3%"),
    marginVertical: hp("0.5%"),
    borderWidth: 1,
    borderColor: "#edeeee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactImageContainer: {
    marginRight: wp("3%"),
  },
  contactImage: {
    width: wp("15%"),
    height: wp("15%"),
    borderRadius: wp("2%"),
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: wp("4%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#0d0c12",
    marginBottom: hp("0.5%"),
  },
  contactEmail: {
    fontSize: wp("3.5%"),
    fontFamily: "OpenSans_400Regular",
    color: "#666",
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: wp("1%"),
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: wp("3.73%"),
    fontFamily: "OpenSans_400Regular",
    color: "#666",
    marginTop: hp("2%"),
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp("10%"),
    marginTop: hp("10%"),
  },
  emptyTitle: {
    fontSize: wp("4.27%"),
    fontFamily: "Poppins_600SemiBold",
    color: "#0d0c12",
    marginBottom: hp("1%"),
    textAlign: "center",
  },
  emptyText: {
    fontSize: wp("3.73%"),
    fontFamily: "OpenSans_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: hp("2.5%"),
  },
});

export default MyTuitions;