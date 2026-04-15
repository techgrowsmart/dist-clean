import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import WebNavbar from '../../../components/ui/WebNavbar';
import WebSidebar from '../../../components/ui/WebSidebar';
import BackButton from '../../../components/BackButton';

const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
};

// Universities data from allBoards.json
const UNIVERSITIES_DATA = [
  {
    id: 'university_delhi',
    name: 'Delhi University',
    location: 'Delhi, India',
    established: '1922',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=80',
    years: [
      { id: 'year_1', name: '1st Year' },
      { id: 'year_2', name: '2nd Year' },
      { id: 'year_3', name: '3rd Year' },
      { id: 'year_4', name: '4th Year' },
      { id: 'year_5', name: '5th Year' },
      { id: 'year_6', name: '6th Year' },
    ]
  },
  {
    id: 'university_mumbai',
    name: 'Mumbai University',
    location: 'Mumbai, Maharashtra',
    established: '1857',
    image: 'https://images.unsplash.com/photo-1592295896862-4f88bf5d9f90?w=400&q=80',
    years: [
      { id: 'mu_year_1', name: '1st Year' },
      { id: 'mu_year_2', name: '2nd Year' },
      { id: 'mu_year_3', name: '3rd Year' },
      { id: 'mu_year_4', name: '4th Year' },
      { id: 'mu_year_5', name: '5th Year' },
      { id: 'mu_year_6', name: '6th Year' },
    ]
  },
  {
    id: 'university_bangalore',
    name: 'Bangalore University',
    location: 'Bangalore, Karnataka',
    established: '1964',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80',
    years: [
      { id: 'bu_year_1', name: '1st Year' },
      { id: 'bu_year_2', name: '2nd Year' },
      { id: 'bu_year_3', name: '3rd Year' },
      { id: 'bu_year_4', name: '4th Year' },
      { id: 'bu_year_5', name: '5th Year' },
      { id: 'bu_year_6', name: '6th Year' },
    ]
  },
];

const Banner = () => (
  <View style={styles.bannerContainer}>
    <Image 
      source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80' }} 
      style={styles.bannerImage} 
    />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerSmallText}>Choose Your Path</Text>
      <Text style={styles.bannerLargeText}>Select Your University</Text>
    </View>
  </View>
);

const UniversityCard = ({ university, onPress }: { university: typeof UNIVERSITIES_DATA[0]; onPress: () => void }) => (
  <TouchableOpacity style={styles.universityCard} onPress={onPress}>
    <Image source={{ uri: university.image }} style={styles.universityImage} />
    <View style={styles.universityContent}>
      <Text style={styles.universityName}>{university.name}</Text>
      <View style={styles.universityMeta}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.universityLocation}>{university.location}</Text>
      </View>
      <View style={styles.universityMeta}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.universityEstablished}>Est. {university.established}</Text>
      </View>
      <View style={styles.yearBadge}>
        <Text style={styles.yearBadgeText}>{university.years.length} Years</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function UniversitiesSelection({ onBack, onUniversitySelect }: {
  onBack?: () => void;
  onUniversitySelect?: (university: typeof UNIVERSITIES_DATA[0]) => void;
}) {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [loading] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Universities');
  const isDesktop = Platform.OS === 'web' && Dimensions.get('window').width >= 1024;

  const handleUniversityPress = (university: typeof UNIVERSITIES_DATA[0]) => {
    if (onUniversitySelect) {
      onUniversitySelect(university);
    } else {
      router.push({
        pathname: '/(tabs)/StudentDashBoard/YearSelection',
        params: {
          universityId: university.id,
          universityName: university.name,
        }
      } as any);
    }
  };

  const handleSidebarItemPress = (itemName: string) => {
    setActiveSidebarItem(itemName);
    if (itemName === 'Home') router.push('/(tabs)/StudentDashBoard/Student');
    if (itemName === 'My Tuitions') router.push('/(tabs)/StudentDashBoard/MyTuitions');
    if (itemName === 'Connect') router.push('/(tabs)/StudentDashBoard/ConnectWeb');
    if (itemName === 'Profile') router.push('/(tabs)/StudentDashBoard/Profile');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Web Layout
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.rootLayout}>
          <WebNavbar />
          
          <View style={styles.mainColumnsLayout}>
            <WebSidebar
              activeItem={activeSidebarItem}
              onItemPress={handleSidebarItemPress}
              userEmail=""
              studentName="Student"
              profileImage={null}
            />

            {/* Center Content */}
            <View style={styles.centerContentContainer}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
                
                {/* Navigation Header */}
                <View style={styles.pageNavHeader}>
                  <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.pageTitle}>Select University</Text>
                </View>

                <View style={styles.boxContainer}>
                  <Banner />

                  <View style={styles.gridContainer}>
                    {loading ? (
                      <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading universities...</Text>
                      </View>
                    ) : (
                      UNIVERSITIES_DATA.map((university) => (
                        <UniversityCard
                          key={university.id}
                          university={university}
                          onPress={() => handleUniversityPress(university)}
                        />
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
                    <Text style={styles.pageBtnTextActive}>1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pageBtnInactive}>
                    <Text style={styles.pageBtnTextInactive}>2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>

            {/* Right Panel */}
            <View style={styles.rightPanel}>
              <Text style={styles.rightPanelTitle}>Universities</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                  <MaterialCommunityIcons name="school-outline" size={40} color={COLORS.primary} />
                  <Text style={styles.infoTitle}>Top Universities</Text>
                  <Text style={styles.infoText}>
                    Select from India's premier universities. Each university offers a wide range of courses and experienced faculty members.
                  </Text>
                </View>
              </ScrollView>
            </View>

          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Mobile Layout
  return (
    <SafeAreaView style={styles.mobileSafeArea}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <BackButton size={24} color="#000" onPress={onBack || (() => router.back())} />
        <View>
          <Text style={styles.mobileTitle}>Select University</Text>
          <Text style={styles.mobileSubtitle}>{UNIVERSITIES_DATA.length} Universities Available</Text>
        </View>
      </View>

      {/* Universities List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileList}>
        {loading ? (
          <View style={styles.mobileLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mobileLoadingText}>Loading universities...</Text>
          </View>
        ) : (
          UNIVERSITIES_DATA.map((university) => (
            <TouchableOpacity
              key={university.id}
              style={styles.mobileCard}
              onPress={() => handleUniversityPress(university)}
            >
              <Image source={{ uri: university.image }} style={styles.mobileCardImage} />
              <View style={styles.mobileCardContent}>
                <Text style={styles.mobileCardTitle}>{university.name}</Text>
                <View style={styles.mobileCardMeta}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.mobileCardMetaText}>{university.location}</Text>
                </View>
                <View style={styles.mobileCardMeta}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.mobileCardMetaText}>Est. {university.established}</Text>
                </View>
                <View style={styles.mobileYearBadge}>
                  <Text style={styles.mobileYearBadgeText}>{university.years.length} Years</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Web Styles
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  rootLayout: { flex: 1, flexDirection: 'column' },
  mainColumnsLayout: { flex: 1, flexDirection: 'row' },
  centerContentContainer: { flex: 1, backgroundColor: COLORS.background },
  centerContentScroll: { padding: 24 },
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginRight: 12 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.textPrimary },
  boxContainer: { backgroundColor: COLORS.cardBackground, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  bannerContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  bannerImage: { width: '100%', height: 180 },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  bannerSmallText: { color: '#fff', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  bannerLargeText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 24 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  universityCard: { 
    width: Platform.OS === 'web' ? 'calc(33.333% - 11px)' : '100%', 
    backgroundColor: COLORS.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    }),
  },
  universityImage: { width: '100%', height: 140 },
  universityContent: { padding: 16 },
  universityName: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 },
  universityMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  universityLocation: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  universityEstablished: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  yearBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  yearBadgeText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular' },
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  pageBtnInactiveArrow: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  pageBtnActive: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.textPrimary, justifyContent: 'center', alignItems: 'center' },
  pageBtnInactive: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  pageBtnTextActive: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  pageBtnTextInactive: { color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  rightPanel: { width: 300, backgroundColor: COLORS.background, borderLeftWidth: 1, borderLeftColor: COLORS.border, padding: 20 },
  rightPanelTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.primary, marginBottom: 16 },
  infoCard: { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  infoTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.textPrimary, marginTop: 12, marginBottom: 8 },
  infoText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Mobile Styles
  mobileSafeArea: { flex: 1, backgroundColor: COLORS.background },
  mobileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mobileTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.textPrimary },
  mobileSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  mobileList: { padding: 16, gap: 12 },
  mobileLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  mobileLoadingText: { marginTop: 12, color: COLORS.textSecondary, fontFamily: 'Poppins_400Regular' },
  mobileCard: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.cardBackground, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    overflow: 'hidden',
    alignItems: 'center',
    paddingRight: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
    }),
  },
  mobileCardImage: { width: 100, height: 100, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  mobileCardContent: { flex: 1, padding: 12 },
  mobileCardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.textPrimary, marginBottom: 6 },
  mobileCardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  mobileCardMetaText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  mobileYearBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
  mobileYearBadgeText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.primary },
});
