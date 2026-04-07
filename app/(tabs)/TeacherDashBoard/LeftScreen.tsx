import { Platform } from 'react-native'; import React, { useState, useEffect, useCallback } from 'react';
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
  SafeAreaView,
  StatusBar
} from 'react-native';
import {   useFonts } from 'expo-font';
import {   Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import {   BASE_URL } from '../../../config';
import {   getAuthData } from '../../../utils/authStorage';
import {  useNavigation } from '@react-navigation/native';

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
  qualifications?: Array<{ subject: string; college: string; year: string }>;
  tuitions?: Array<{ subject: string; class?: string; className?: string; skill?: string; charge?: number; timeFrom?: string; timeTo?: string; day?: string }>;
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

const LeftScreen: React.FC<{ leftFont?: string }> = ({ leftFont }) => {
  const navigation = useNavigation();
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
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllReviews, setLoadingAllReviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [ratingsCount, setRatingsCount] = useState<RatingsCount>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const fetchTeacherData = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) { setLoading(true); } else { setRefreshing(true); }
    try {
      const auth = await getAuthData();
      if (!auth?.token || !auth?.email) { throw new Error('Authentication required'); }
      const teacherEmail = auth.email;
      const teacherRes = await axios.post(`${BASE_URL}/api/teacherProfile`, { email: teacherEmail }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` } });
      console.log('Teacher API Response:', teacherRes.data);
      console.log('Teacher name from API:', teacherRes.data?.name);
      const encodedEmail = encodeURIComponent(teacherEmail);
      const reviewsRes = await axios.get(`${BASE_URL}/review?email=${encodedEmail}`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` } });
      console.log('Reviews API Response:', reviewsRes.data);
      if (teacherRes.data) {
        setTeacherData({ _id: teacherRes.data._id || '', name: teacherRes.data.name || '', profilepic: teacherRes.data.profileimage || teacherRes.data.profilePic || '', email: teacherRes.data.email || '', category: teacherRes.data.category || '', university: teacherRes.data.university || '', workexperience: teacherRes.data.workexperience || teacherRes.data.workExperience || '', teachingmode: teacherRes.data.teachingmode || [], qualifications: teacherRes.data.qualifications || [], tuitions: teacherRes.data.tuitions || [] });
        console.log('Updated teacherData with name:', teacherRes.data.name);
        console.log('Updated teacherData with profilepic:', teacherRes.data.profileimage || teacherRes.data.profilePic);
      }
      if (reviewsRes.data && reviewsRes.data.reviews) {
        const reviewsData = reviewsRes.data.reviews;
        console.log('Raw reviews data:', reviewsData);
        
        // Process reviews to extract student names properly
        const processedReviews = reviewsData.map((review: any) => {
          console.log('Processing review:', review);
          
          // Try different possible name fields
          const studentName = review.student_name || 
                           review.studentName || 
                           review.name || 
                           review.reviewer_name || 
                           review.reviewerName ||
                           (review.student_email && review.student_email.includes('@') ? 
                             review.student_email.split('@')[0].replace('.', ' ').replace(/\d/g, '').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
                             null) ||
                           'Anonymous';
          
          console.log('Extracted student name:', studentName);
          
          return {
            ...review,
            studentName // Ensure studentName is properly set
          };
        });
        
        setReviews(processedReviews);
        const ratings = processedReviews.map((r: any) => { const rating = Number(r.rating); return isNaN(rating) ? 0 : Math.max(1, Math.min(5, rating)); });
        const total = ratings.length;
        const sum = ratings.reduce((acc: number, cur: number) => acc + cur, 0);
        const avgRating = total > 0 ? sum / total : 0;
        setAverageRating(avgRating);
        const newRatingsCount: RatingsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach((rating: number) => { if (rating >= 1 && rating <= 5) { newRatingsCount[rating as keyof RatingsCount]++; } });
        setRatingsCount(newRatingsCount);
        console.log('Updated reviews with real data:', processedReviews.length, 'reviews');
        console.log('Calculated average rating:', avgRating);
        console.log('Ratings distribution:', newRatingsCount);
      } else {
        setReviews([]);
        setAverageRating(0);
        setRatingsCount({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }
    } catch (error: any) {
      console.error('Error in fetchTeacherData:', error);
      if (error.response) { Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to load data. Please try again.', [{ text: 'OK' }]); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAllReviews = useCallback(async () => {
    setLoadingAllReviews(true);
    try {
      const auth = await getAuthData();
      if (!auth?.token) { throw new Error('Authentication required'); }

      const response = await axios.get(`${BASE_URL}/api/review/all-reviews`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (response.data.success) {
        const processedReviews = response.data.reviews.map((review: any) => {
          const studentName = review.student_name || 
                           review.studentName || 
                           review.name ||
                           review.reviewer_name || 
                           review.reviewerName ||
                           (review.student_email && review.student_email.includes('@') ? 
                             review.student_email.split('@')[0].replace('.', ' ').replace(/\d/g, '').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
                             null) ||
                           'Anonymous';
          
          return {
            ...review,
            studentName
          };
        });
        
        setAllReviews(processedReviews);
        console.log('Fetched all reviews:', processedReviews.length, 'reviews');
      } else {
        setAllReviews([]);
      }
    } catch (error: any) {
      console.error('Error fetching all reviews:', error);
      setAllReviews([]);
    } finally {
      setLoadingAllReviews(false);
    }
  }, []);

  useEffect(() => { 
    fetchTeacherData(); 
    if (activeTab === 'reviews') {
      fetchAllReviews();
    }
  }, [fetchTeacherData, fetchAllReviews, activeTab]);

  useEffect(() => {
    if (activeTab === 'reviews' && allReviews.length === 0) {
      fetchAllReviews();
    }
  }, [activeTab, fetchAllReviews, allReviews.length]);

  const onRefresh = useCallback(() => { 
    fetchTeacherData(true); 
    if (activeTab === 'reviews') {
      fetchAllReviews();
    }
  }, [fetchTeacherData, fetchAllReviews, activeTab]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { return 'Recently'; }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) { return 'Recently'; }
  };

  const getTotalReviews = () => { return Object.values(ratingsCount).reduce((sum, count) => sum + count, 0); };
  const totalReviews = Math.max(reviews.length, getTotalReviews());

  const renderStars = (rating: number) => {
    const safeRating = isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating));
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons 
        key={`star-${index}`} 
        name={index < Math.round(safeRating) ? 'star' : 'star-outline'} 
        size={16} 
        color="#5B7FFF" 
        style={{ marginHorizontal: 1 }} 
      />
    ));
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) { 
      return require('../../../assets/images/Profile.png'); 
    }
    
    // Handle different profile image formats
    if (typeof profilePic === 'string') {
      // If it's already a full URL (http/https/file)
      if (profilePic.startsWith('http') || profilePic.startsWith('file://')) {
        return { uri: profilePic };
      }
      
      // If it's a relative path starting with /
      if (profilePic.startsWith('/')) {
        return { uri: `${BASE_URL}${profilePic}` };
      }
      
      // If it's a relative path without leading /
      if (profilePic.includes('uploads/') || profilePic.includes('images/')) {
        return { uri: `${BASE_URL}/${profilePic}` };
      }
      
      // Default case - treat as relative path
      return { uri: `${BASE_URL}/${profilePic}` };
    }
    
    return require('../../../assets/images/Profile.png');
  };

  const getReviewerProfileImage = (studentProfilePic?: string) => {
    if (!studentProfilePic) { 
      return null; // Will show initials instead
    }
    
    return getProfileImageSource(studentProfilePic);
  };

  if (!fontsLoaded || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B7FFF" />
        <Text style={{ marginTop: 10, color: '#666', fontFamily: 'Quicksand-Regular' }}>
          Loading your data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#5B7FFF" />
      <ImageBackground 
        source={require('../../../assets/images/TeacherLeftBackground.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: leftFont || styles.headerTitle.fontFamily }]}>My Reviews</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Swipe Hint */}
        <View style={styles.swipeHintContainer}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.swipeHintText}>Swipe right for home</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent} 
          showsVerticalScrollIndicator={false} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#5B7FFF']} 
              tintColor="#5B7FFF" 
            />
          }
        >
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={getProfileImageSource(teacherData?.profilepic || teacherData?.profileimage || teacherData?.profilePic)} 
                style={styles.profileImage} 
                onError={(e) => console.log('Error loading profile image:', e.nativeEvent.error)} 
              />
            </View>
            <Text style={[styles.teacherName, { fontFamily: leftFont || styles.teacherName.fontFamily }]} numberOfLines={1}>
              {teacherData?.name || 'Teacher Name'}
            </Text>
            {teacherData?.category && (
              <Text style={styles.teacherCategory} numberOfLines={1}>
                {teacherData.category}
              </Text>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'myReviews' && styles.activeTabButton]} 
              onPress={() => setActiveTab('myReviews')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'myReviews' && styles.activeTabButtonText]}>
                My Reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'reviews' && styles.activeTabButton]} 
              onPress={() => {
                setActiveTab('reviews');
                if (allReviews.length === 0) {
                  fetchAllReviews();
                }
              }}
            >
              <Text style={[styles.tabButtonText, activeTab === 'reviews' && styles.activeTabButtonText]}>
                All Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating Overview Card */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingTopSection}>
              <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
              <View style={styles.starsContainer}>
                {renderStars(averageRating)}
              </View>
              <Text style={styles.totalReviewsText}>{totalReviews} reviews</Text>
            </View>
            <View style={styles.ratingBarsContainer}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingsCount[star as keyof RatingsCount];
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <View key={`rating-${star}`} style={styles.ratingBarRow}>
                    <Text style={styles.ratingLabel}>{star}</Text>
                    <View style={styles.ratingBarBackground}>
                      <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.ratingPercentage}>
                      {percentage > 0 ? `${Math.round(percentage)} %` : '0 %'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Student Feedback Section */}
          <View style={styles.feedbackHeader}>
            <Text style={styles.feedbackTitle}>Student Feedback</Text>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewsSection}>
            {/* My Reviews Tab */}
            {activeTab === 'myReviews' && (
              <>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5B7FFF" />
                    <Text style={styles.loadingText}>Loading your reviews...</Text>
                  </View>
                ) : reviews.length > 0 ? (
                  reviews.map((review, index) => {
                const studentName = review.student_name || review.studentName || review.name || 'Anonymous';
                const studentProfilePic = review.student_profile_pic || review.studentProfilePic || review.profilePic;
                const reviewText = review.review_text || review.reviewText || review.review || review.message || '';
                const createdAt = review.createdAt || review.created_at || review.date || new Date().toISOString();
                return (
                  <View key={review._id || `review-${index}-${Date.now()}`} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {getReviewerProfileImage(studentProfilePic) ? (
                        <Image 
                          source={getReviewerProfileImage(studentProfilePic)!} 
                          style={styles.reviewerImage} 
                          onError={(e) => console.log('Error loading reviewer image:', e.nativeEvent.error)} 
                        />
                      ) : (
                        <View style={styles.reviewerInitialsContainer}>
                          <Text style={styles.reviewerInitials}>
                            {studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerTopRow}>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {studentName}
                          </Text>
                          <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(createdAt)}</Text>
                      </View>
                    </View>
                    {reviewText && (
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewText}>{reviewText}</Text>
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
              </>
            )}

            {/* All Reviews Tab */}
            {activeTab === 'reviews' && (
              <>
                {loadingAllReviews ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5B7FFF" />
                    <Text style={styles.loadingText}>Loading all reviews...</Text>
                  </View>
                ) : allReviews.length > 0 ? (
                  allReviews.map((review, index) => {
                const studentName = review.student_name || review.studentName || review.name || 'Anonymous';
                const studentProfilePic = review.student_profile_pic || review.studentProfilePic || review.profilePic;
                const reviewText = review.review_text || review.reviewText || review.review || review.message || '';
                const createdAt = review.createdAt || review.created_at || review.date || new Date().toISOString();
                return (
                  <View key={review._id || `all-review-${index}-${Date.now()}`} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {getReviewerProfileImage(studentProfilePic) ? (
                        <Image 
                          source={getReviewerProfileImage(studentProfilePic)!} 
                          style={styles.reviewerImage} 
                          onError={(e) => console.log('Error loading reviewer image:', e.nativeEvent.error)} 
                        />
                      ) : (
                        <View style={styles.reviewerInitialsContainer}>
                          <Text style={styles.reviewerInitials}>
                            {studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerTopRow}>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {studentName}
                          </Text>
                          <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(createdAt)}</Text>
                      </View>
                    </View>
                    {reviewText && (
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewText}>{reviewText}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No reviews available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Check back later for student reviews
                </Text>
              </View>
            )}
              </>
            )}
          </View>
          
          {/* Bottom padding for safe area */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default LeftScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5B7FFF',
  },
  container: { 
    flex: 1,
  },
  scrollView: { 
    flex: 1,
  },
  scrollViewContent: { 
    paddingBottom: 30,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#5B7FFF' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'OpenSans-Regular',
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'OpenSans-SemiBold', 
    color: '#fff', 
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 44, // Same as back button for symmetry
  },
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    opacity: 0.8,
  },
  swipeHintText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    color: '#fff',
    marginLeft: 8,
  },
  profileSection: { 
    alignItems: 'center', 
    paddingBottom: 25 
  },
  profileImageContainer: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15, 
    borderWidth: 4, 
    borderColor: '#fff', 
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
    elevation: 5 
  },
  profileImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 55 
  },
  teacherName: { 
    fontSize: 22, 
    fontFamily: 'OpenSans-Bold', 
    color: '#fff', 
    marginBottom: 5, 
    textAlign: 'center', 
    letterSpacing: 0.3 
  },
  teacherCategory: { 
    fontSize: 15, 
    fontFamily: 'Quicksand-Medium', 
    color: '#E8EFFF', 
    textAlign: 'center' 
  },
  tabsContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginTop: 0, 
    marginBottom: 20, 
    backgroundColor: '#fff', 
    borderRadius: 25, 
    padding: 4, 
    borderWidth: 2, 
    borderColor: '#E8EFFF' 
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  activeTabButton: { 
    backgroundColor: '#5B7FFF', 
    borderColor: '#5B7FFF' 
  },
  tabButtonText: { 
    fontFamily: 'Quicksand-SemiBold', 
    fontSize: 14, 
    color: '#5B7FFF' 
  },
  activeTabButtonText: { 
    color: '#fff' 
  },
  ratingCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginHorizontal: 20, 
    marginBottom: 20, 
    padding: 25, 
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
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  ratingTopSection: { 
    alignItems: 'center', 
    marginBottom: 25 
  },
  averageRatingText: { 
    fontSize: 52, 
    fontFamily: 'OpenSans-Bold', 
    color: '#1a1a1a', 
    marginBottom: 8, 
    lineHeight: 52 
  },
  starsContainer: { 
    flexDirection: 'row', 
    marginBottom: 10 
  },
  totalReviewsText: { 
    fontSize: 14, 
    fontFamily: 'Quicksand-Medium', 
    color: '#888' 
  },
  ratingBarsContainer: { 
    width: '100%' 
  },
  ratingBarRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    height: 20 
  },
  ratingLabel: { 
    width: 15, 
    fontSize: 14, 
    fontFamily: 'Quicksand-SemiBold', 
    color: '#333', 
    marginRight: 15 
  },
  ratingBarBackground: { 
    flex: 1, 
    height: 10, 
    backgroundColor: '#E8E8E8', 
    borderRadius: 10, 
    marginHorizontal: 0, 
    overflow: 'hidden' 
  },
  ratingBarFill: { 
    height: '100%', 
    backgroundColor: '#5B7FFF', 
    borderRadius: 10 
  },
  ratingPercentage: { 
    width: 45, 
    textAlign: 'right', 
    fontSize: 13, 
    fontFamily: 'Quicksand-Medium', 
    color: '#999', 
    marginLeft: 15 
  },
  feedbackHeader: { 
    paddingHorizontal: 20, 
    paddingBottom: 15 
  },
  feedbackTitle: { 
    fontSize: 16, 
    fontFamily: 'Quicksand-Bold', 
    color: '#333', 
    letterSpacing: 0.3 
  },
  reviewsSection: { 
    paddingHorizontal: 20 
  },
  reviewCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
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
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  reviewHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 0 
  },
  reviewerInfo: { 
    flex: 1, 
    marginLeft: 12 
  },
  reviewerImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  reviewerInitialsContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E8EFFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  reviewerInitials: { 
    fontSize: 14, 
    fontFamily: 'OpenSans-Bold', 
    color: '#5B7FFF' 
  },
  reviewerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  reviewerName: { 
    fontSize: 14, 
    fontFamily: 'Quicksand-Bold', 
    color: '#1a1a1a', 
    flex: 1 
  },
  reviewStars: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 8 
  },
  reviewDate: { 
    fontSize: 11, 
    fontFamily: 'Quicksand-Regular', 
    color: '#999' 
  },
  reviewText: { 
    fontSize: 13, 
    fontFamily: 'Quicksand-Regular', 
    color: '#555', 
    lineHeight: 20 
  },
  reviewContent: { 
    marginTop: 12, 
    paddingTop: 0 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 50, 
    paddingHorizontal: 30 
  },
  emptyStateText: { 
    fontSize: 16, 
    color: '#333', 
    textAlign: 'center', 
    marginTop: 10, 
    fontFamily: 'Quicksand-SemiBold' 
  },
  emptyStateSubtext: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginTop: 8, 
    fontFamily: 'Quicksand-Regular', 
    lineHeight: 20 
  },
});