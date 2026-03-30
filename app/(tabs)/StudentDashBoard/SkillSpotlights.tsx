import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';

// Mock data for skill specialists
const mockSpecialists = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    specialty: 'TABLA SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.8,
    experience: '10+ years',
    description: 'Expert in classical tabla with international performance experience',
    price: '$45/hr'
  },
  {
    id: 2,
    name: 'Michael Chen',
    specialty: 'FINE ARTS SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.9,
    experience: '8+ years',
    description: 'Professional artist specializing in oil painting and digital art',
    price: '$50/hr'
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    specialty: 'PIANO SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.7,
    experience: '12+ years',
    description: 'Classical piano instructor with conservatory training',
    price: '$55/hr'
  },
  {
    id: 4,
    name: 'David Kumar',
    specialty: 'YOGA SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.9,
    experience: '15+ years',
    description: 'Certified yoga instructor specializing in Hatha and Vinyasa',
    price: '$40/hr'
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    specialty: 'DANCE SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.6,
    experience: '7+ years',
    description: 'Contemporary and ballet dance instructor',
    price: '$48/hr'
  },
  {
    id: 6,
    name: 'James Wilson',
    specialty: 'GUITAR SPECIALIST',
    image: require('../../../assets/images/Profile.png'),
    rating: 4.8,
    experience: '9+ years',
    description: 'Rock and classical guitar virtuoso',
    price: '$42/hr'
  }
];



export default function SkillSpotlights() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [userName] = useState('Ben Goro');
  const [notificationCount] = useState(3);

  const specialistsPerPage = 6;
  const totalPages = Math.ceil(mockSpecialists.length / specialistsPerPage);
  const startIndex = (currentPage - 1) * specialistsPerPage;
  const currentSpecialists = mockSpecialists.slice(startIndex, startIndex + specialistsPerPage);

  const handleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleViewProfile = (specialist: any) => {
    router.push({
      pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
      params: { 
        name: specialist.name, 
        email: `${specialist.name.toLowerCase().replace(' ', '.')}@example.com`,
        profilePic: specialist.image 
      }
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
          <Text style={styles.webLogo}>Growsmart</Text>
          <View style={styles.webSearchBar}>
            <FontAwesome name="search" size={16} color="#999" style={styles.webSearchIcon} />
            <TextInput
              style={styles.webSearchInput}
              placeholder="Type in search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.webHeaderRight}>
            <TouchableOpacity style={styles.webNotificationBtn}>
              <Ionicons name="notifications-outline" size={20} color="#333" />
              {notificationCount > 0 && (
                <View style={styles.webNotificationBadge}>
                  <Text style={styles.webNotificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.webProfile}>
              <View style={styles.webAvatar}>
                <Text style={styles.webAvatarText}>{getInitials(userName)}</Text>
              </View>
              <Text style={styles.webUsername}>{userName}</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.webMainContent}>
          {/* Left Sidebar */}
          <View style={styles.webLeftSidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.webNavItem}>
                <Ionicons name="home-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Home</Text>
              </View>
              <View style={styles.webNavItemActive}>
                <Ionicons name="person-outline" size={18} color="#4A7BF7" />
                <Text style={[styles.webNavText, styles.webNavTextActive]}>Profile</Text>
              </View>
              
              <View style={styles.webNavDivider} />
              <Text style={styles.webNavSectionHeader}>Favorites</Text>
              <View style={styles.webNavItem}>
                <Ionicons name="book-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>My Tutions</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="people-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Connect</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="share-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Share</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="card-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Subscription</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="receipt-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Billing</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="help-circle-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>FAQ</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="document-text-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Terms & Conditions</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="shield-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Privacy Policy</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="call-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Contact Us</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="warning-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Raise a Complaint</Text>
              </View>

              {/* Advertising Section */}
              <View style={styles.webAdCard}>
                <Text style={styles.webAdLabel}>Advertising</Text>
                <Image 
                  source={require('../../../assets/images/growsmart.png')} 
                  style={styles.webAdImage}
                  resizeMode="cover"
                />
                <Text style={styles.webAdTitle}>Summer sale</Text>
                <Text style={styles.webAdDesc}>Get 20% off on all courses</Text>
              </View>

              <View style={styles.webNavDivider} />
              <View style={styles.webNavItem}>
                <Ionicons name="help-buoy-outline" size={18} color="#333" />
                <Text style={styles.webNavText}>Help & Support</Text>
              </View>
              <View style={styles.webNavItem}>
                <Ionicons name="log-out-outline" size={18} color="#FF4444" />
                <Text style={[styles.webNavText, { color: '#FF4444' }]}>Log out</Text>
              </View>
            </ScrollView>
          </View>

          {/* Center Content */}
          <View style={styles.webCenterContent}>
            <View style={styles.webSkillSpotlights}>
              <Text style={styles.webSectionTitle}>Skill Spotlights</Text>
              
              {/* Pagination Controls */}
              <View style={styles.webPagination}>
                <TouchableOpacity 
                  style={[styles.webPageBtn, currentPage === 1 && styles.webPageBtnDisabled]}
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#333'} />
                </TouchableOpacity>
                <Text style={styles.webPageText}>
                  Page {currentPage} of {totalPages}
                </Text>
                <TouchableOpacity 
                  style={[styles.webPageBtn, currentPage === totalPages && styles.webPageBtnDisabled]}
                  onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#333'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Specialists Grid */}
            <View style={styles.webSpecialistsGrid}>
              {currentSpecialists.map((specialist) => (
                <View key={specialist.id} style={styles.webSpecialistCard}>
                  <Image 
                    source={specialist.image} 
                    style={styles.webSpecialistImage}
                    resizeMode="cover"
                  />
                  <View style={styles.webSpecialistInfo}>
                    <Text style={styles.webSpecialistTitle}>{specialist.specialty}</Text>
                    <Text style={styles.webSpecialistName}>{specialist.name}</Text>
                    <Text style={styles.webSpecialistDesc}>{specialist.description}</Text>
                    <TouchableOpacity 
                      style={styles.webViewProfileBtn}
                      onPress={() => handleViewProfile(specialist)}
                    >
                      <Text style={styles.webViewProfileBtnText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      <Text style={styles.mobileTitle}>Skill Spotlights</Text>
      
      {/* Specialists List for Mobile */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mobileSpecialistsList}>
          {currentSpecialists.map((specialist) => (
            <TouchableOpacity 
              key={specialist.id} 
              style={styles.mobileSpecialistCard}
              onPress={() => handleViewProfile(specialist)}
            >
              <Image 
                source={specialist.image} 
                style={styles.mobileSpecialistImage}
                resizeMode="cover"
              />
              <View style={styles.mobileSpecialistInfo}>
                <Text style={styles.mobileSpecialistTitle}>{specialist.specialty}</Text>
                <Text style={styles.mobileSpecialistName}>{specialist.name}</Text>
                <Text style={styles.mobileSpecialistDesc}>{specialist.description}</Text>
                <View style={styles.mobileSpecialistMeta}>
                  <Text style={styles.mobileSpecialistRating}>⭐ {specialist.rating}</Text>
                  <Text style={styles.mobileSpecialistPrice}>{specialist.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Pagination for Mobile */}
        <View style={styles.mobilePagination}>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === 1 && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.mobilePageText}>
            Page {currentPage} of {totalPages}
          </Text>
          <TouchableOpacity 
            style={[styles.mobilePageBtn, currentPage === totalPages && styles.mobilePageBtnDisabled]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#ccc' : '#333'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  webLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
    marginRight: 20,
    minWidth: 110,
  },
  webSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 480,
  },
  webSearchIcon: {
    marginRight: 10,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  webNotificationBtn: {
    position: 'relative',
    padding: 8,
    marginRight: 12,
  },
  webNotificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  webNotificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Poppins_600SemiBold',
  },
  webProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4A7BF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  webAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  webUsername: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  webMainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webLeftSidebar: {
    width: 180,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    backgroundColor: '#fff',
    paddingTop: 6,
  },
  webNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  webNavItemActive: {
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4A7BF7',
  },
  webNavText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 9,
    fontFamily: 'Poppins_400Regular',
  },
  webNavTextActive: {
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  webNavDivider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 8,
    marginHorizontal: 14,
  },
  webNavSectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  webAdCard: {
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 9,
    backgroundColor: '#fff',
  },
  webAdLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 7,
  },
  webAdImage: {
    width: '100%',
    height: 85,
    borderRadius: 5,
    marginBottom: 7,
  },
  webAdTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 3,
  },
  webAdDesc: {
    fontSize: 10,
    color: '#777',
    fontFamily: 'Poppins_400Regular',
  },
  webCenterContent: {
    flex: 1,
    backgroundColor: '#f4f6fb',
    padding: 20,
  },
  webSkillSpotlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  webSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  webPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  webSpecialistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  webSpecialistCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  webSpecialistImage: {
    width: '100%',
    height: 180,
  },
  webSpecialistInfo: {
    padding: 15,
  },
  webSpecialistTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },
  webSpecialistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
  },
  webSpecialistDesc: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginBottom: 15,
  },
  webViewProfileBtn: {
    backgroundColor: '#4A7BF7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  webViewProfileBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  webRightSidebar: {
    width: 260,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  webThoughtsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  webThoughtCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 11,
    marginBottom: 11,
    backgroundColor: '#fff',
  },
  webThoughtHeader: {
    marginBottom: 7,
  },
  webThoughtAuthor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  webThoughtAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 9,
  },
  webThoughtAuthorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins_600SemiBold',
  },
  webThoughtTime: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 1,
    fontFamily: 'Poppins_400Regular',
  },
  webThoughtContent: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
    marginBottom: 8,
  },
  webThoughtImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  webThoughtActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  webThoughtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  webThoughtBtnText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  // Mobile Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    padding: 20,
    paddingBottom: 10,
  },
  mobileSpecialistsList: {
    paddingHorizontal: 20,
  },
  mobileSpecialistCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  mobileSpecialistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  mobileSpecialistInfo: {
    flex: 1,
  },
  mobileSpecialistTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 3,
  },
  mobileSpecialistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 5,
  },
  mobileSpecialistDesc: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
    marginBottom: 8,
  },
  mobileSpecialistMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileSpecialistRating: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  mobileSpecialistPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A7BF7',
    fontFamily: 'Poppins_600SemiBold',
  },
  mobilePagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    padding: 20,
  },
  mobilePageBtn: {
    padding: 10,
    borderRadius: 8,
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
