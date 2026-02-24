import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ImageBackground, 
  TextInput, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";

const { width, height } = Dimensions.get('window');

interface Review {
  review_id: string;
  teacher_email: string;
  teacher_name: string;
  student_email: string;
  student_name: string;
  student_profile_pic: string;
  rating: number;
  selected_tags: string;
  review_text: string;
  created_at: string;
}

interface ApiError {
  message?: string;
  status?: number;
}

const LeftScreen: React.FC = () => {
  // Fonts loading
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    OpenSans_700Bold,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  // State management
  const [activeTab, setActiveTab] = useState<'myReviews' | 'reviews'>('myReviews');
  const [searchQuery, setSearchQuery] = useState('');
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loadingMyReviews, setLoadingMyReviews] = useState(false);
  const [loadingAllReviews, setLoadingAllReviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [studentEmail, setStudentEmail] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [myReviewsError, setMyReviewsError] = useState<string | null>(null);
  const [allReviewsError, setAllReviewsError] = useState<string | null>(null);

  // Load student email on mount
  useEffect(() => {
    loadStudentEmail();
  }, []);

  // Fetch reviews when email is available
  useEffect(() => {
    if (studentEmail) {
      fetchMyReviews();
      fetchAllReviews();
    }
  }, [studentEmail]);

  // Load student email with better error handling
  const loadStudentEmail = async () => {
    try {
      setEmailLoading(true);
      // First try to get from auth storage (the proper way)
      const authData = await getAuthData();
      if (authData?.email) {
        setStudentEmail(authData.email);
        return;
      }
      
      // Fallback to direct AsyncStorage
      const email = await AsyncStorage.getItem('userEmail') || await AsyncStorage.getItem('user_email');
      
      if (email) {
        setStudentEmail(email);
      } else {
        // No email found - maybe user needs to login
        Alert.alert(
          "Not Logged In",
          "Please log in to view your reviews",
          [
            { text: "Go to Login", onPress: () => router.push('/login') },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
    } catch (error) {
      console.error('Error loading student email:', error);
      setMyReviewsError('Failed to load user information');
    } finally {
      setEmailLoading(false);
    }
  };

  // Fetch user's reviews
  const fetchMyReviews = async () => {
    if (!studentEmail) {
      setMyReviewsError('No email available');
      return;
    }
    
    try {
      setLoadingMyReviews(true);
      setMyReviewsError(null);
      
      console.log('Fetching reviews for student:', studentEmail);
      const response = await axios.get(`${BASE_URL}/api/review/student-reviews`, {
        params: { studentEmail }
      });
      
      // Handle different response structures
      const reviewsData = response.data?.reviews || response.data?.data || response.data || [];
      setMyReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
    } catch (error: any) {
      console.error('Error fetching my reviews:', error);
      
      let errorMessage = 'Failed to load your reviews';
      if (error.response?.status === 404) {
        errorMessage = 'Reviews endpoint not found';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error - check your connection';
      }
      
      setMyReviewsError(errorMessage);
      setMyReviews([]);
      
      // Show error toast or alert for critical errors
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again");
      }
    } finally {
      setLoadingMyReviews(false);
    }
  };

  // Fetch all reviews
  const fetchAllReviews = async () => {
    try {
      setLoadingAllReviews(true);
      setAllReviewsError(null);
      
      const response = await axios.get(`${BASE_URL}/api/review/all-reviews`);
      
      // Handle different response structures
      const reviewsData = response.data?.reviews || response.data?.data || response.data || [];
      setAllReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
    } catch (error: any) {
      console.error('Error fetching all reviews:', error);
      
      let errorMessage = 'Failed to load reviews';
      if (error.response?.status === 404) {
        errorMessage = 'Reviews endpoint not found';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server';
      }
      
      setAllReviewsError(errorMessage);
      setAllReviews([]);
    } finally {
      setLoadingAllReviews(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Test if backend routes are working
    try {
      const testResponse = await axios.get(`${BASE_URL}/api/review/ping`);
      console.log('Backend ping response:', testResponse.data);
    } catch (error: any) {
      console.error('Backend ping failed:', error);
    }
    
    // Reload email first (in case it changed)
    await loadStudentEmail();
    
    // Fetch data if email exists
    if (studentEmail) {
      await Promise.all([
        fetchMyReviews(),
        fetchAllReviews()
      ]);
    }
    
    setRefreshing(false);
  }, [studentEmail]);

  // Memoized filtered lists for performance
  const filteredMyReviews = useMemo(() => {
    return myReviews.filter(review =>
      review.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review_text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [myReviews, searchQuery]);

  const filteredAllReviews = useMemo(() => {
    return allReviews.filter(review =>
      review.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allReviews, searchQuery]);

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Render error state
  const renderError = (message: string, onRetry: () => void) => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (!fontsLoaded || emailLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B5FE8" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../../assets/images/TeacherLeftBackground.png')} 
      style={styles.background} 
      resizeMode="cover"
    >
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#5B5FE8']}
              tintColor="#5B5FE8"
            />
          }
        >
          <Text style={styles.headerTitle}>My Teachers</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search for a teacher or review ..." 
              placeholderTextColor="#A0A0A0" 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'myReviews' && styles.activeTab]} 
              onPress={() => setActiveTab('myReviews')}
            >
              <Text style={[styles.tabText, activeTab === 'myReviews' && styles.activeTabText]}>
                My Reviews ({myReviews.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} 
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                All Reviews ({allReviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* My Reviews Tab */}
          {activeTab === 'myReviews' && (
            <View style={styles.reviewsList}>
              {loadingMyReviews ? (
                <View style={styles.inlineLoadingContainer}>
                  <ActivityIndicator size="large" color="#5B5FE8" />
                  <Text style={styles.loadingText}>Loading your reviews...</Text>
                </View>
              ) : myReviewsError ? (
                renderError(myReviewsError, fetchMyReviews)
              ) : filteredMyReviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>You haven't written any reviews yet</Text>
                  <Text style={styles.emptySubText}>Start by reviewing your teachers!</Text>
                </View>
              ) : (
                filteredMyReviews.map((review) => (
                  <View key={review.review_id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatarContainer}>
                        {review.student_profile_pic && review.student_profile_pic.trim() ? (
                          <Image source={{ uri: review.student_profile_pic }} style={styles.reviewAvatar} />
                        ) : (
                          <Image 
                            source={require("../../../assets/image/Person1.jpeg")} 
                            style={styles.reviewAvatar} 
                          />
                        )}
                      </View>
                      <View style={styles.reviewTeacherInfo}>
                        <View style={styles.reviewTopRow}>
                          <Text style={styles.reviewTeacherName}>{review.teacher_name}</Text>
                        </View>
                        <View style={styles.ratingRow}>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons 
                                key={star} 
                                name={star <= Math.floor(review.rating) ? "star" : "star-outline"} 
                                size={16} 
                                color="#FFC107" 
                                style={styles.starIcon} 
                              />
                            ))}
                          </View>
                          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.review_text}</Text>
                    {review.selected_tags && typeof review.selected_tags === 'string' && review.selected_tags.trim() && (
                      <View style={styles.tagsContainer}>
                        {review.selected_tags.split(',').map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* All Reviews Tab */}
          {activeTab === 'reviews' && (
            <View style={styles.reviewsList}>
              {loadingAllReviews ? (
                <View style={styles.inlineLoadingContainer}>
                  <ActivityIndicator size="large" color="#5B5FE8" />
                  <Text style={styles.loadingText}>Loading all reviews...</Text>
                </View>
              ) : allReviewsError ? (
                renderError(allReviewsError, fetchAllReviews)
              ) : filteredAllReviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyText}>No reviews available</Text>
                  <Text style={styles.emptySubText}>Be the first to write a review!</Text>
                </View>
              ) : (
                filteredAllReviews.map((review) => (
                  <View key={review.review_id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatarContainer}>
                        {review.student_profile_pic ? (
                          <Image source={{ uri: review.student_profile_pic }} style={styles.reviewAvatar} />
                        ) : (
                          <Image 
                            source={require("../../../assets/image/Person2.jpeg")} 
                            style={styles.reviewAvatar} 
                          />
                        )}
                      </View>
                      <View style={styles.reviewTeacherInfo}>
                        <View style={styles.reviewTopRow}>
                          <Text style={styles.reviewTeacherName}>{review.teacher_name}</Text>
                          <View style={styles.studentBadge}>
                            <Text style={styles.studentBadgeText}>by {review.student_name}</Text>
                          </View>
                        </View>
                        <View style={styles.ratingRow}>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons 
                                key={star} 
                                name={star <= Math.floor(review.rating) ? "star" : "star-outline"} 
                                size={16} 
                                color="#FFC107" 
                                style={styles.starIcon} 
                              />
                            ))}
                          </View>
                          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.review_text}</Text>
                    {review.selected_tags && typeof review.selected_tags === 'string' && review.selected_tags.trim() && (
                      <View style={styles.tagsContainer}>
                        {review.selected_tags.split(',').map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: hp('5%') },
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: hp('10%'), paddingTop: hp('6%'), paddingHorizontal: wp('5%') },
  headerTitle: { fontSize: wp('6.5%'), fontFamily: 'OpenSans_700Bold', color: '#FFFFFF', marginBottom: hp('2.5%'), textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: wp('8%'), paddingHorizontal: wp('4.5%'), paddingVertical: hp('1.6%'), marginBottom: hp('2%'), shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchIcon: { marginRight: wp('2%') },
  searchInput: { flex: 1, fontSize: wp('3.8%'), fontFamily: 'Montserrat_400Regular', color: '#333' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: wp('8%'), padding: 5, marginBottom: hp('2%'), shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tab: { flex: 1, paddingVertical: hp('1.4%'), alignItems: 'center', borderRadius: wp('6%') },
  activeTab: { backgroundColor: '#5B5FE8' },
  tabText: { fontSize: wp('3.8%'), fontFamily: 'Montserrat_600SemiBold', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  reviewsList: { flex: 1, marginBottom: hp('2%') },
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: wp('5%'), padding: wp('4%'), marginBottom: hp('1.5%'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  reviewHeader: { flexDirection: 'row', marginBottom: hp('1.2%') },
  reviewAvatarContainer: { marginRight: wp('3%') },
  reviewAvatar: { width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%') },
  reviewTeacherInfo: { flex: 1 },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  reviewTeacherName: { fontSize: wp('3.8%'), fontFamily: 'Quicksand_700Bold', color: '#1E293B', marginRight: wp('2%') },
  reviewDate: { fontSize: wp('3%'), fontFamily: 'Quicksand_400Regular', color: '#94A3B8', marginTop: 2 },
  studentBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: wp('2.5%'), paddingVertical: hp('0.3%'), borderRadius: wp('3%') },
  studentBadgeText: { fontSize: wp('2.8%'), fontFamily: 'Quicksand_600SemiBold', color: '#5B5FE8' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: hp('1%'), gap: 5 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: wp('2%'), paddingVertical: hp('0.5%'), borderRadius: wp('2%') },
  tagText: { fontSize: wp('2.8%'), fontFamily: 'Quicksand_500Medium', color: '#64748B' },
  inlineLoadingContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: hp('5%') },
  loadingText: { fontSize: wp('3.5%'), fontFamily: 'Montserrat_500Medium', color: '#64748B', marginTop: hp('1%') },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp('10%') },
  emptyText: { fontSize: wp('4%'), fontFamily: 'Montserrat_600SemiBold', color: '#64748B', marginTop: hp('1%') },
  emptySubText: { fontSize: wp('3.5%'), fontFamily: 'Montserrat_400Regular', color: '#94A3B8', marginTop: hp('0.5%') },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  starsRow: { flexDirection: 'row', marginRight: wp('1.5%') },
  starIcon: { marginRight: 2 },
  ratingText: { fontSize: wp('3.8%'), fontFamily: 'Quicksand_700Bold', color: '#FFA500', marginRight: 4 },
  totalReviewsText: { fontSize: wp('3.2%'), fontFamily: 'Quicksand_500Medium', color: '#64748B' },
  reviewText: { fontSize: wp('3.5%'), fontFamily: 'Quicksand_400Regular', color: '#475569', lineHeight: wp('5%') },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp('5%'), paddingHorizontal: wp('5%') },
  errorText: { fontSize: wp('3.5%'), fontFamily: 'Montserrat_400Regular', color: '#64748B', marginTop: hp('1%'), textAlign: 'center' },
  errorTitle: { fontSize: wp('5%'), fontFamily: 'Montserrat_700Bold', color: '#EF4444', marginTop: hp('1%'), textAlign: 'center' },
  errorMessage: { fontSize: wp('3.5%'), fontFamily: 'Montserrat_400Regular', color: '#64748B', marginTop: hp('1%'), textAlign: 'center', lineHeight: wp('5%') },
  retryButton: { backgroundColor: '#5B5FE8', paddingHorizontal: wp('6%'), paddingVertical: hp('2%'), borderRadius: wp('3%'), marginTop: hp('3%') },
  retryButtonText: { fontSize: wp('3.5%'), fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF', textAlign: 'center' },
});

export default LeftScreen;