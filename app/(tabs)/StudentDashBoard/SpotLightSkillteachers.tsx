import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons, AntDesign } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';
import BackButton from "../../../components/BackButton";

const { width } = Dimensions.get("window");

// Mock data for spotlight skill teachers
const mockSpotlightTeachers = [
  {
    id: 1,
    name: 'Alexander Thompson',
    email: 'alex.t@example.com',
    profilePic: require('../../../assets/images/Profile.png'),
    specialty: 'Classical Piano Virtuoso',
    experience: '15+ years',
    rating: 4.9,
    reviews: 342,
    price: '$65/hr',
    description: 'Juilliard-trained pianist with international performance experience',
    languages: ['English', 'French', 'Italian'],
    availability: 'Flexible',
    achievements: ['Carnegie Hall Performer', 'Grammy Winner', 'Royal Conservatory Certified'],
    spotlight: true
  },
  {
    id: 2,
    name: 'Isabella Rodriguez',
    email: 'isabella.r@example.com',
    profilePic: require('../../../assets/images/Profile.png'),
    specialty: 'Contemporary Dance Pioneer',
    experience: '12+ years',
    rating: 4.8,
    reviews: 287,
    price: '$55/hr',
    description: 'Broadway choreographer and dance innovator',
    languages: ['English', 'Spanish'],
    availability: 'Weekends',
    achievements: ['Tony Award Winner', 'NYC Ballet Principal', 'Dance Magazine Cover'],
    spotlight: true
  },
  {
    id: 3,
    name: 'Marcus Chen',
    email: 'marcus.c@example.com',
    profilePic: require('../../../assets/images/Profile.png'),
    specialty: 'Digital Art Master',
    experience: '10+ years',
    rating: 4.9,
    reviews: 198,
    price: '$70/hr',
    description: 'Award-winning digital artist and creative director',
    languages: ['English', 'Mandarin'],
    availability: 'Weekdays',
    achievements: ['Adobe Certified Expert', 'Art Basel Featured', 'Tech Art Pioneer'],
    spotlight: true
  }
];

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
  const [filteredTeachers, setFilteredTeachers] = useState(mockSpotlightTeachers);

  const teachersPerPage = Platform.OS === 'web' ? 4 : 3;
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const startIndex = (currentPage - 1) * teachersPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, startIndex + teachersPerPage);

  useEffect(() => {
    const filtered = mockSpotlightTeachers.filter(teacher => 
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [searchQuery]);

  const handleLike = (teacherId: number) => {
    setLikedTeachers(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
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

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  // Web Layout
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.webHeader}>
          <View style={styles.webHeaderLeft}>
            <TouchableOpacity onPress={onBack} style={styles.webBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View>
              <Text style={styles.webTitle}>Spotlight Teachers</Text>
              <Text style={styles.webSubtitle}>Featured master instructors and industry leaders</Text>
            </View>
          </View>
          <View style={styles.webHeaderRight}>
            <View style={styles.webSpotlightBadge}>
              <Ionicons name="star" size={16} color="#FFA500" />
              <Text style={styles.webSpotlightBadgeText}>Premium</Text>
            </View>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.webHeroSection}>
          <View style={styles.webHeroContent}>
            <Text style={styles.webHeroTitle}>Learn from the Best</Text>
            <Text style={styles.webHeroDescription}>
              Our spotlight teachers are industry-recognized experts with exceptional credentials
            </Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.webSearchSection}>
          <View style={styles.webSearchBar}>
            <FontAwesome name="search" size={16} color="#999" style={styles.webSearchIcon} />
            <TextInput
              style={styles.webSearchInput}
              placeholder="Search spotlight teachers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Teachers Grid */}
        <ScrollView style={styles.webTeachersContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.webTeachersGrid}>
            {currentTeachers.map((teacher) => (
              <View key={teacher.id} style={styles.webTeacherCard}>
                <View style={styles.webTeacherHeader}>
                  <Image source={teacher.profilePic} style={styles.webTeacherImage} />
                  <View style={styles.webTeacherOverlay}>
                    <View style={styles.webSpotlightIcon}>
                      <Ionicons name="star" size={20} color="#FFA500" />
                    </View>
                    <TouchableOpacity 
                      style={styles.webLikeBtn}
                      onPress={() => handleLike(teacher.id)}
                    >
                      <AntDesign 
                        name={likedTeachers[teacher.id] ? "heart" : "hearto"} 
                        size={20} 
                        color={likedTeachers[teacher.id] ? "#FF4444" : "#fff"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.webTeacherInfo}>
                  <Text style={styles.webTeacherName}>{teacher.name}</Text>
                  <Text style={styles.webTeacherSpecialty}>{teacher.specialty}</Text>
                  <View style={styles.webTeacherMeta}>
                    <View style={styles.webRating}>
                      <FontAwesome name="star" size={12} color="#FFA500" />
                      <Text style={styles.webRatingText}>{teacher.rating}</Text>
                      <Text style={styles.webReviewsText}>({teacher.reviews})</Text>
                    </View>
                    <Text style={styles.webExperience}>{teacher.experience}</Text>
                  </View>
                  <Text style={styles.webTeacherDescription}>{teacher.description}</Text>
                  
                  {/* Achievements */}
                  <View style={styles.webAchievements}>
                    <Text style={styles.webAchievementsTitle}>Achievements:</Text>
                    {teacher.achievements.slice(0, 2).map((achievement, index) => (
                      <View key={index} style={styles.webAchievementBadge}>
                        <Ionicons name="trophy" size={10} color="#FFA500" />
                        <Text style={styles.webAchievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.webTeacherFooter}>
                    <Text style={styles.webTeacherPrice}>{teacher.price}</Text>
                    <View style={styles.webTeacherActions}>
                      <TouchableOpacity 
                        style={styles.webViewProfileBtn}
                        onPress={() => handleViewProfile(teacher)}
                      >
                        <Text style={styles.webViewProfileBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.webBookBtn}
                        onPress={() => handleBookClass(teacher)}
                      >
                        <Text style={styles.webBookBtnText}>Book Class</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Pagination */}
        <View style={styles.webPagination}>
          <TouchableOpacity 
            style={[styles.webPageBtn, currentPage === 1 && styles.webPageBtnDisabled]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.webPageText}>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity 
            style={[styles.webPageBtn, currentPage === totalPages && styles.webPageBtnDisabled]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#333'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <BackButton size={24} color="#000" onPress={onBack} />
          <View>
            <Text style={styles.mobileTitle}>Spotlight Teachers</Text>
            <Text style={styles.mobileSubtitle}>Featured Masters</Text>
          </View>
        </View>
        <View style={styles.mobileSpotlightBadge}>
          <Ionicons name="star" size={14} color="#FFA500" />
          <Text style={styles.mobileSpotlightBadgeText}>Premium</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.mobileSearchSection}>
        <View style={styles.mobileSearchBar}>
          <FontAwesome name="search" size={16} color="#999" style={styles.mobileSearchIcon} />
          <TextInput
            style={styles.mobileSearchInput}
            placeholder="Search spotlight teachers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Teachers List */}
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
                <View style={styles.mobileSpotlightIcon}>
                  <Ionicons name="star" size={18} color="#FFA500" />
                </View>
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

      {/* Mobile Pagination */}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  },
});
