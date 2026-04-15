import React, { useEffect, useState } from "react";
import { Platform, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ScrollView, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebNavbar from "../../../components/ui/WebNavbar";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import axios from "axios";

const COLORS = { 
  primary: '#3B5BFE', 
  lightBackground: '#F5F7FB', 
  cardBackground: '#FFFFFF',  
  border: '#E5E7EB',  
  textPrimary: '#1F2937', 
  textSecondary: '#6B7280',
  textHeader: '#1F2937',
  white: '#FFFFFF'
};

interface Year {
  yearId: string;
  yearName: string;
  teacherCount: number;
}

const YearSelection = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { width: screenWidth } = Dimensions.get('window');
  const isDesktop = screenWidth >= 1024;

  const universityId = params.universityId as string;
  const universityName = params.universityName as string;

  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Class Selection");

  // Fetch years from backend
  useEffect(() => {
    const fetchYears = async () => {
      if (!universityId) return;
      
      try {
        setLoading(true);
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error("No authentication token found");
          setLoading(false);
          return;
        }
        
        const res = await axios.post(`${BASE_URL}/api/universities/${universityId}/years`, {}, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          }
        });
        
        console.log('📚 Backend years response:', res.data);
        setYears(res.data.years || []);
      } catch (error) {
        console.error("Error fetching years:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchYears();
  }, [universityId]);

  // Debug logging
  useEffect(() => {
    console.log('🎓 YearSelection mounted');
    console.log('🎓 University:', universityName, universityId);
    console.log('🎓 Rendering years:', years.map(y => `${y.yearId} (${y.yearName})`));
  }, [years]);

  const handleYearPress = (year: Year) => {
    console.log('Year selected:', year.yearName);
    router.push({
      pathname: '/(tabs)/StudentDashBoard/SubjectSelection',
      params: {
        universityId: universityId,
        universityName: universityName,
        classId: year.yearId,
        className: year.yearName,
        isUniversity: 'true'
      }
    } as any);
  };

  const handleSidebarItemPress = (itemName: string) => {
    setSidebarActiveItem(itemName);
    if (itemName === "Home") router.push("/(tabs)/StudentDashBoard/Student");
    if (itemName === "My Tuitions") router.push("/(tabs)/StudentDashBoard/MyTuitions");
    if (itemName === "Class Selection") router.push("/(tabs)/StudentDashBoard/ClassSelection");
    if (itemName === "Connect") router.push("/(tabs)/StudentDashBoard/ConnectWeb");
    if (itemName === "Profile") router.push("/(tabs)/StudentDashBoard/Profile");
  };

  const getResponsiveStyles = (screenWidth: number) => {
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    
    return StyleSheet.create({
      safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
      rootContainer: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.cardBackground },
      mainLayout: { flex: 1, backgroundColor: COLORS.lightBackground },
      topHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: isMobile ? 16 : 32, 
        paddingVertical: isMobile ? 12 : 20, 
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
        flex: 1, 
        maxWidth: isMobile ? '70%' : '50%', 
        marginRight: 12 
      },
      searchIcon: { marginRight: 10 },
      searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary },
      profileHeaderSection: { flexDirection: 'row', alignItems: 'center' },
      bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.lightBackground, borderRadius: 20 },
      headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
      headerAvatar: { width: 40, height: 40, borderRadius: 20 },
      contentColumns: { flex: 1, flexDirection: isMobile ? 'column' : 'row' },
      centerContent: { flex: 1, paddingTop: isMobile ? 16 : 32, paddingHorizontal: isMobile ? 16 : 32, paddingBottom: 24 },
      pageTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
      pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.textPrimary, marginLeft: 12 },
      subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textSecondary, marginLeft: 44, marginBottom: 24 },
      gridContainerBox: { 
        flex: 1, 
        backgroundColor: COLORS.cardBackground, 
        borderRadius: isMobile ? 12 : 20, 
        borderWidth: 1, 
        borderColor: '#E4ECF7', 
        padding: isMobile ? 12 : 24, 
        shadowColor: 'rgba(0,0,0,0.02)', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 1, 
        shadowRadius: 10 
      },
      yearsGrid: { paddingBottom: 20 },
      cardsWrapper: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: isMobile ? 'center' : 'space-between', 
        gap: isMobile ? 12 : 16 
      },
      yearCard: {
        width: isMobile ? '100%' : isTablet ? '48%' : '31%',
        minWidth: isMobile ? '100%' : 280,
        marginBottom: isMobile ? 12 : 16,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
      },
      yearName: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: COLORS.textPrimary, marginBottom: 8 },
      cardBody: { flex: 1 },
      description: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textSecondary },
      loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
      loadingText: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary, marginTop: 10 },
      emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: isMobile ? 20 : 40, marginTop: 50 },
      emptyTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
      emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
    });
  };

  const styles = getResponsiveStyles(screenWidth);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Web Header - Full Width */}
      {isDesktop && (
        <WebNavbar
          studentName={studentName}
          profileImage={profileImage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <View style={styles.rootContainer}>
        {/* Mobile Top Navbar */}
        {!isDesktop && (
          <View style={styles.topHeader}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput 
                placeholder="Search years..." 
                placeholderTextColor={COLORS.textSecondary} 
                style={styles.searchInput} 
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.profileHeaderSection}>
              <TouchableOpacity style={styles.bellIcon}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.headerUserName}>{studentName}</Text>
              <Image 
                source={profileImage ? { uri: profileImage } : require("../../../assets/images/Profile.png")} 
                style={styles.headerAvatar} 
              />
            </View>
          </View>
        )}

        {/* Left Sidebar (WebSidebar component — desktop only) */}
        {isDesktop && (
          <WebSidebar
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarItemPress}
            userEmail={userEmail || "student@example.com"}
            studentName={studentName}
            profileImage={profileImage}
          />
        )}

        {/* Main Area */}
        <View style={styles.mainLayout}>
          <View style={styles.contentColumns}>
            {/* CENTER: Years Grid */}
            <View style={styles.centerContent}>
              <View style={styles.pageTitleContainer}>
                <Ionicons name="calendar" size={28} color={COLORS.textPrimary} />
                <Text style={styles.pageTitle}>Select Year</Text>
              </View>
              <Text style={styles.subtitle}>{universityName}</Text>

              <View style={styles.gridContainerBox}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading years...</Text>
                  </View>
                ) : years.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No years found</Text>
                    <Text style={styles.emptyText}>Please try again later</Text>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={styles.yearsGrid} showsVerticalScrollIndicator={false}>
                    <View style={styles.cardsWrapper}>
                      {years.map((year) => (
                        <TouchableOpacity
                          key={year.yearId}
                          style={styles.yearCard}
                          onPress={() => handleYearPress(year)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.cardBody}>
                            <Text style={styles.yearName}>{year.yearName}</Text>
                            <Text style={styles.description}>{year.teacherCount || 0} teachers available</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default YearSelection;
