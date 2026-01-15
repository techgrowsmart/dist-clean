import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ImageBackground,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';

const { width, height } = Dimensions.get('window');

interface Review {
  _id: string;
  student_name?: string;
  studentName?: string;
  name?: string;
  student_profile_pic?: string;
  studentProfilePic?: string;
  profilePic?: string;
  rating: number;
  review_text?: string;
  reviewText?: string;
  review?: string;
  message?: string;
  createdAt?: string;
  created_at?: string;
  date?: string;
}

interface TeacherData {
  _id: string;
  name: string;
  email: string;
  profilepic?: string;
  profileimage?: string;
  profilePic?: string;
  category?: string;
  qualifications?: Array<{
    subject: string;
    college: string;
    year: string;
  }>;
  tuitions?: Array<{
    subject: string;
    class?: string;
    className?: string;
    skill?: string;
    charge?: number;
    timeFrom?: string;
    timeTo?: string;
    day?: string;
  }>;
  introduction?: string;
  university?: string;
  workexperience?: string;
  workExperience?: string;
  teachingmode?: string[];
}

interface RatingsCount {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

const LeftScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
    'OpenSans-Regular': require('@expo-google-fonts/open-sans').OpenSans_400Regular,
    'OpenSans-SemiBold': require('@expo-google-fonts/open-sans').OpenSans_600SemiBold,
    'OpenSans-Bold': require('@expo-google-fonts/open-sans').OpenSans_700Bold,
  });

  const [activeTab, setActiveTab] = useState<'myReviews' | 'reviews'>('myReviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [ratingsCount, setRatingsCount] = useState<RatingsCount>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const fetchTeacherData = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Get auth data
      const auth = await getAuthData();
      if (!auth?.token || !auth?.email) {
        throw new Error('Authentication required');
      }

      const teacherEmail = auth.email;

      // Fetch teacher profile data
      const teacherRes = await axios.post(
        `${BASE_URL}/api/teacherProfile`,
        { email: teacherEmail },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      console.log('Teacher API Response:', teacherRes.data);
      console.log('Teacher name from API:', teacherRes.data?.name);

      // Fetch reviews data
      const encodedEmail = encodeURIComponent(teacherEmail);
      const reviewsRes = await axios.get(
        `${BASE_URL}/review?email=${encodedEmail}`,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      console.log('Reviews API Response:', reviewsRes.data);

      // Update teacher data with real profile info
      if (teacherRes.data) {
        setTeacherData({
          _id: teacherRes.data._id || '',
          name: teacherRes.data.name || '',
          profilepic: teacherRes.data.profileimage || teacherRes.data.profilePic || '',
          email: teacherRes.data.email || '',
          category: teacherRes.data.category || '',
          university: teacherRes.data.university || '',
          workexperience: teacherRes.data.workexperience || teacherRes.data.workExperience || '',
          teachingmode: teacherRes.data.teachingmode || [],
          qualifications: teacherRes.data.qualifications || [],
          tuitions: teacherRes.data.tuitions || []
        });
        
        console.log('Updated teacherData with name:', teacherRes.data.name);
        console.log('Updated teacherData with profilepic:', teacherRes.data.profileimage || teacherRes.data.profilePic);
      }

      // Update reviews with real data
      if (reviewsRes.data && reviewsRes.data.reviews) {
        const reviewsData = reviewsRes.data.reviews;
        setReviews(reviewsData);
        
        // Calculate ratings distribution and average rating from real reviews
        const ratings = reviewsData.map((r: any) => {
          const rating = Number(r.rating);
          return isNaN(rating) ? 0 : Math.max(1, Math.min(5, rating));
        });
        
        const total = ratings.length;
        const sum = ratings.reduce((acc: number, cur: number) => acc + cur, 0);
        const avgRating = total > 0 ? sum / total : 0;
        setAverageRating(avgRating);
        
        // Calculate ratings count distribution
        const newRatingsCount: RatingsCount = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        
        ratings.forEach((rating: number) => {
          if (rating >= 1 && rating <= 5) {
            newRatingsCount[rating as keyof RatingsCount]++;
          }
        });
        
        setRatingsCount(newRatingsCount);
        
        console.log('Updated reviews with real data:', reviewsData.length, 'reviews');
        console.log('Calculated average rating:', avgRating);
        console.log('Ratings distribution:', newRatingsCount);
      } else {
        // If no reviews, set empty array and reset counts
        setReviews([]);
        setAverageRating(0);
        setRatingsCount({
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        });
      }
      
    } catch (error: any) {
      console.error('Error in fetchTeacherData:', error);
      
      if (error.response) {
        Alert.alert(
          'Error',
          error.response?.data?.message || error.message || 'Failed to load data. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  const onRefresh = useCallback(() => {
    fetchTeacherData(true);
  }, [fetchTeacherData]);


  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#4CAF50'; // Green
    if (rating >= 3.5) return '#8BC34A'; // Light green
    if (rating >= 2.5) return '#FFC107'; // Yellow
    if (rating >= 1.5) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Calculate total reviews from ratings count
  const getTotalReviews = () => {
    return Object.values(ratingsCount).reduce((sum, count) => sum + count, 0);
  };

  // Ensure reviews array length matches ratings count total
  const totalReviews = Math.max(reviews.length, getTotalReviews());

  const renderStars = (rating: number) => {
    // Ensure rating is a valid number between 0-5
    const safeRating = isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating));
    
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons 
        key={`star-${index}`} 
        name={index < Math.round(safeRating) ? 'star' : 'star-outline'} 
        size={18} 
        color="#5B9FFF" 
        style={{ marginHorizontal: 1 }} 
      />
    ));
  };

  // Ensure profile image URI is properly formatted
  const getProfileImageSource = () => {
    const profilePic = teacherData?.profilepic || teacherData?.profileimage || teacherData?.profilePic;
    
    if (!profilePic) {
      return require('../../../assets/images/Profile.png');
    }
    
    // If it's already a URI (starts with http)
    if (typeof profilePic === 'string' && 
        (profilePic.startsWith('http') || profilePic.startsWith('file'))) {
      return { uri: profilePic };
    }
    
    // If it's a relative path, prepend the BASE_URL
    if (typeof profilePic === 'string') {
      const cleanProfilePic = profilePic.startsWith('/') 
        ? profilePic.substring(1) 
        : profilePic;
      return { uri: `${BASE_URL}/${cleanProfilePic}` };
    }
    
    return require('../../../assets/images/Profile.png');
  };

  if (!fontsLoaded || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4255ff" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/images/TeacherLeftBackground.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4255ff']}
              tintColor="#4255ff"
            />
          }
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={getProfileImageSource()}
                style={styles.profileImage}
                onError={(e) => console.log('Error loading profile image:', e.nativeEvent.error)}
              />
            </View>
            <Text style={styles.teacherName} numberOfLines={1}>
              {teacherData?.name || 'Teacher Name'}
            </Text>
            {teacherData?.category && (
              <Text style={styles.teacherCategory} numberOfLines={1}>
                {teacherData.category}
              </Text>
            )}
            {teacherData?.university && (
              <Text style={styles.universityText} numberOfLines={2}>
                {teacherData.university}
              </Text>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'myReviews' && styles.activeTabButton
              ]}
              onPress={() => setActiveTab('myReviews')}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'myReviews' && styles.activeTabButtonText
              ]}>
                My Reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'reviews' && styles.activeTabButton,
                styles.disabledTab
              ]}
              disabled={true}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'reviews' && styles.activeTabButtonText,
                styles.disabledTabText
              ]}>
                All Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating Overview Card */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingOverview}>
              <View>
                <Text style={styles.averageRatingText}>
                  {averageRating.toFixed(1)}
                </Text>
                <View style={styles.starsContainer}>
                  {renderStars(averageRating)}
                </View>
                <Text style={styles.totalReviewsText}>
                  {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                </Text>
              </View>

              <View style={styles.ratingBarsContainer}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingsCount[star as keyof RatingsCount];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <View key={`rating-${star}`} style={styles.ratingBarRow}>
                      <Text style={styles.ratingLabel}>
                        {star} <Ionicons name="star" size={14} color="#FFD700" />
                      </Text>
                      <View style={styles.ratingBarBackground}>
                        <View 
                          style={[
                            styles.ratingBarFill,
                            { 
                              width: `${percentage}%`,
                              backgroundColor: getRatingColor(star)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.ratingCount}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsSection}>
            {reviews.length > 0 ? (
              reviews.map((review) => {
                // Handle different field names from the API
                const studentName = review.student_name || review.studentName || review.name || 'Anonymous';
                const studentProfilePic = review.student_profile_pic || review.studentProfilePic || review.profilePic;
                const reviewText = review.review_text || review.reviewText || review.review || review.message || '';
                const createdAt = review.createdAt || review.created_at || review.date || new Date().toISOString();

                return (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {studentProfilePic ? (
                        <Image
                          source={{ uri: studentProfilePic }}
                          style={styles.reviewerImage}
                          onError={(e) => console.log('Error loading reviewer image:', e.nativeEvent.error)}
                        />
                      ) : (
                        <View style={styles.reviewerInitialsContainer}>
                          <Text style={styles.reviewerInitials}>
                            {studentName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName} numberOfLines={1}>
                          {studentName}
                        </Text>
                        <View style={styles.reviewMeta}>
                          <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </View>
                          <Text style={styles.reviewDate}>
                            {formatDate(createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {reviewText && (
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewText}>
                          {reviewText}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your reviews will appear here once students leave feedback
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default LeftScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollViewContent: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  teacherName: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 4,
    maxWidth: '90%',
    textAlign: 'center',
  },
  teacherCategory: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#666',
    maxWidth: '90%',
    textAlign: 'center',
    marginBottom: 4,
  },
  universityText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#4255ff',
    maxWidth: '90%',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabButtonText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#4255ff',
  },
  disabledTabText: {
    opacity: 0.5,
  },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  averageRatingText: {
    fontSize: 36,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 2,
    lineHeight: 36,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  totalReviewsText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#999',
  },
  ratingBarsContainer: {
    flex: 1,
    marginLeft: 20,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    height: 20,
  },
  ratingLabel: {
    width: 50,
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ratingCount: {
    width: 20,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
    color: '#666',
  },
  reviewsSection: {
    paddingHorizontal: 15,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4255ff',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
    maxWidth: '90%',
  },
  reviewerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  reviewerInitialsContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitials: {
    fontSize: 16,
    fontFamily: 'OpenSans-Bold',
    color: '#4255ff',
    fontWeight: '700',
  },
  reviewerName: {
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
    color: '#333',
    marginBottom: 2,
    maxWidth: '90%',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: '#999',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#555',
    lineHeight: 20,
  },
  reviewContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'OpenSans-SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Quicksand-SemiBold',
    lineHeight: 20,
  },
});