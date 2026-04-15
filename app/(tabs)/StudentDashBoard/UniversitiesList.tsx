import React, { useEffect, useState, useCallback } from "react";
import { Platform, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ScrollView, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import WebSidebar from "../../../components/ui/WebSidebar";
import WebHeader from "../../../components/ui/WebHeader";
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
  ratingGreen: '#22C55E',
  ratingLight: '#DCFCE7',
  white: '#FFFFFF'
};

interface University {
  id: string;
  name: string;
  location: string;
  established: string;
  type: string;
  image: string;
  teacherCount: number;
}

// Universities data from allBoards.json
const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'university_delhi',
    name: 'Delhi University',
    location: 'Delhi, India',
    established: '1922',
    type: 'Central',
    image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&q=80',
    teacherCount: 150
  },
  {
    id: 'university_mumbai',
    name: 'Mumbai University',
    location: 'Mumbai, Maharashtra',
    established: '1857',
    type: 'State',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80',
    teacherCount: 120
  },
  {
    id: 'university_bangalore',
    name: 'Bangalore University',
    location: 'Bangalore, Karnataka',
    established: '1964',
    type: 'State',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80',
    teacherCount: 85
  },
  {
    id: 'university_madras',
    name: 'University of Madras',
    location: 'Chennai, Tamil Nadu',
    established: '1857',
    type: 'State',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
    teacherCount: 95
  },
  {
    id: 'university_banaras',
    name: 'Banaras Hindu University',
    location: 'Varanasi, Uttar Pradesh',
    established: '1916',
    type: 'Central',
    image: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&q=80',
    teacherCount: 200
  },
  {
    id: 'university_jnu',
    name: 'JNU Delhi',
    location: 'New Delhi, India',
    established: '1969',
    type: 'Central',
    image: 'https://images.unsplash.com/photo-1564062022182-482f4d5e1b21?w=400&q=80',
    teacherCount: 110
  },
];

const UniversitiesList = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { width: screenWidth } = Dimensions.get('window');
  const isDesktop = screenWidth >= 1024;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentName, setStudentName] = useState("Student");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Class Selection");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // Handle image load errors
  const handleImageError = (uniId: string) => {
    setImageErrors(prev => ({ ...prev, [uniId]: true }));
  };

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // Load universities from API with fallback to mock data
  useEffect(() => {
    const loadUniversities = async () => {
      setLoading(true);
      try {
        const auth = await getAuthData();
        
        // Try to fetch from API first
        try {
          const response = await axios.post(`${BASE_URL}/api/universities`, {}, {
            headers: { Authorization: `Bearer ${auth?.token}` }
          });
          
          if (response.data && Array.isArray(response.data)) {
            // Map API response to include full university data with images
            const apiUniversities = response.data.map((uni: any) => {
              const mockUni = MOCK_UNIVERSITIES.find(m => m.id === uni.universityId);
              return {
                id: uni.universityId,
                name: uni.universityName,
                location: mockUni?.location || 'India',
                established: mockUni?.established || '1950',
                type: mockUni?.type || 'University',
                image: mockUni?.image || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=400&q=80',
                teacherCount: uni.teacherCount || 0
              };
            });
            setUniversities(apiUniversities);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.log('API fetch failed, using mock data:', apiError);
        }
        
        // Fallback to mock data
        setUniversities(MOCK_UNIVERSITIES);
        setLoading(false);
      } catch (error) {
        console.error('Error loading universities:', error);
        setUniversities(MOCK_UNIVERSITIES);
        setLoading(false);
      }
    };

    loadUniversities();
  }, []);

  // Filter universities based on search
  const filteredUniversities = universities.filter(uni => 
    uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uni.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUniversityPress = (university: University) => {
    console.log('University selected:', university.name);
    router.push({
      pathname: '/(tabs)/StudentDashBoard/YearSelection',
      params: { 
        universityId: university.id,
        universityName: university.name,
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
      pageTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
      pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.textPrimary, marginLeft: 12 },
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
      universitiesGrid: { paddingBottom: 20 },
      cardsWrapper: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: isMobile ? 'center' : 'space-between', 
        gap: isMobile ? 12 : 16 
      },
      universityCard: { 
        width: isMobile ? '100%' : isTablet ? '48%' : '31%', 
        minWidth: isMobile ? '100%' : 280, 
        marginBottom: isMobile ? 12 : 16, 
        backgroundColor: COLORS.cardBackground, 
        borderRadius: 14, 
        borderWidth: 1, 
        borderColor: COLORS.border, 
        overflow: 'hidden' 
      },
      cardImageContainer: { width: '100%', height: isMobile ? 180 : 160, position: 'relative' },
      cardImage: { width: '100%', height: '100%' },
      cardOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        padding: 12 
      },
      universityName: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.white },
      cardBody: { padding: 16 },
      infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
      infoText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textSecondary, marginLeft: 8 },
      teacherCount: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.primary },
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
        <WebHeader
          studentName={studentName}
          profileImage={profileImage}
          showSidebarToggle={true}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={toggleSidebar}
        />
      )}

      <View style={styles.rootContainer}>
        {/* Mobile Top Navbar */}
        {!isDesktop && (
          <View style={styles.topHeader}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput 
                placeholder="Search universities..." 
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
            collapsible={true}
            defaultCollapsed={isSidebarCollapsed}
            onCollapseChange={setIsSidebarCollapsed}
          />
        )}

        {/* Main Area */}
        <View style={styles.mainLayout}>
          <View style={styles.contentColumns}>
            {/* CENTER: Universities Grid */}
            <View style={styles.centerContent}>
              <View style={styles.pageTitleContainer}>
                <Ionicons name="school" size={28} color={COLORS.textPrimary} />
                <Text style={styles.pageTitle}>All Universities</Text>
              </View>

              <View style={styles.gridContainerBox}>
                <ScrollView contentContainerStyle={styles.universitiesGrid} showsVerticalScrollIndicator={false}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.loadingText}>Loading universities...</Text>
                    </View>
                  ) : filteredUniversities.length > 0 ? (
                    <View style={styles.cardsWrapper}>
                      {filteredUniversities.map((university) => (
                        <TouchableOpacity 
                          key={university.id} 
                          style={styles.universityCard}
                          onPress={() => handleUniversityPress(university)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.cardImageContainer}>
                            <Image 
                              source={imageErrors[university.id] 
                                ? require("../../../assets/images/Profile.png")
                                : { uri: university.image }
                              } 
                              style={styles.cardImage}
                              onError={() => handleImageError(university.id)}
                              resizeMode="cover"
                            />
                            <View style={styles.cardOverlay}>
                              <Text style={styles.universityName}>{university.name}</Text>
                            </View>
                          </View>
                          <View style={styles.cardBody}>
                            <View style={styles.infoRow}>
                              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                              <Text style={styles.infoText}>{university.location}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                              <Text style={styles.infoText}>Est. {university.established}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                              <Text style={[styles.infoText, styles.teacherCount]}>
                                {university.teacherCount} Teachers Available
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>No Universities Found</Text>
                      <Text style={styles.emptyText}>Try adjusting your search criteria</Text>
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

export default UniversitiesList;
