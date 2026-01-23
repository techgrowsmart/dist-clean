import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
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
        setReviews(reviewsData);
        const ratings = reviewsData.map((r: any) => { const rating = Number(r.rating); return isNaN(rating) ? 0 : Math.max(1, Math.min(5, rating)); });
        const total = ratings.length;
        const sum = ratings.reduce((acc: number, cur: number) => acc + cur, 0);
        const avgRating = total > 0 ? sum / total : 0;
        setAverageRating(avgRating);
        const newRatingsCount: RatingsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach((rating: number) => { if (rating >= 1 && rating <= 5) { newRatingsCount[rating as keyof RatingsCount]++; } });
        setRatingsCount(newRatingsCount);
        console.log('Updated reviews with real data:', reviewsData.length, 'reviews');
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

  useEffect(() => { fetchTeacherData(); }, [fetchTeacherData]);

  const onRefresh = useCallback(() => { fetchTeacherData(true); }, [fetchTeacherData]);

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
    return Array.from({ length: 5 }).map((_, index) => <Ionicons key={`star-${index}`} name={index < Math.round(safeRating) ? 'star' : 'star-outline'} size={16} color="#5B7FFF" style={{ marginHorizontal: 1 }} />);
  };

  const getProfileImageSource = () => {
    const profilePic = teacherData?.profilepic || teacherData?.profileimage || teacherData?.profilePic;
    if (!profilePic) { return require('../../../assets/images/Profile.png'); }
    if (typeof profilePic === 'string' && (profilePic.startsWith('http') || profilePic.startsWith('file'))) { return { uri: profilePic }; }
    if (typeof profilePic === 'string') {
      const cleanProfilePic = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      return { uri: `${BASE_URL}/${cleanProfilePic}` };
    }
    return require('../../../assets/images/Profile.png');
  };

  if (!fontsLoaded || (loading && !refreshing)) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B7FFF" /><Text style={{ marginTop: 10, color: '#666', fontFamily: 'Quicksand-Regular' }}>Loading your data...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5B7FFF']} tintColor="#5B7FFF" />}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Reviews</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image source={getProfileImageSource()} style={styles.profileImage} onError={(e) => console.log('Error loading profile image:', e.nativeEvent.error)} />
          </View>
          <Text style={styles.teacherName} numberOfLines={1}>{teacherData?.name || 'Teacher Name'}</Text>
          {teacherData?.category && <Text style={styles.teacherCategory} numberOfLines={1}>{teacherData.category}</Text>}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'myReviews' && styles.activeTabButton]} onPress={() => setActiveTab('myReviews')}>
            <Text style={[styles.tabButtonText, activeTab === 'myReviews' && styles.activeTabButtonText]}>My Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'reviews' && styles.activeTabButton]} onPress={() => setActiveTab('reviews')}>
            <Text style={[styles.tabButtonText, activeTab === 'reviews' && styles.activeTabButtonText]}>Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Overview Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingTopSection}>
            <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsContainer}>{renderStars(averageRating)}</View>
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
                  <Text style={styles.ratingPercentage}>{percentage > 0 ? `${Math.round(percentage)} %` : '0 %'}</Text>
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
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const studentName = review.student_name || review.studentName || review.name || 'Anonymous';
              const studentProfilePic = review.student_profile_pic || review.studentProfilePic || review.profilePic;
              const reviewText = review.review_text || review.reviewText || review.review || review.message || '';
              const createdAt = review.createdAt || review.created_at || review.date || new Date().toISOString();
              return (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    {studentProfilePic ? (
                      <Image source={{ uri: studentProfilePic }} style={styles.reviewerImage} onError={(e) => console.log('Error loading reviewer image:', e.nativeEvent.error)} />
                    ) : (
                      <View style={styles.reviewerInitialsContainer}>
                        <Text style={styles.reviewerInitials}>{studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}</Text>
                      </View>
                    )}
                    <View style={styles.reviewerInfo}>
                      <View style={styles.reviewerTopRow}>
                        <Text style={styles.reviewerName} numberOfLines={1}>{studentName}</Text>
                        <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
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
              <Text style={styles.emptyStateSubtext}>Your reviews will appear here once students leave feedback</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default LeftScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5B7FFF' },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#5B7FFF' },
  header: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', backgroundColor: '#5B7FFF' },
  headerTitle: { fontSize: 20, fontFamily: 'OpenSans-SemiBold', color: '#fff', letterSpacing: 0.5 },
  profileSection: { alignItems: 'center', paddingBottom: 25, backgroundColor: '#5B7FFF' },
  profileImageContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 4, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  profileImage: { width: '100%', height: '100%', borderRadius: 55 },
  teacherName: { fontSize: 22, fontFamily: 'OpenSans-Bold', color: '#fff', marginBottom: 5, textAlign: 'center', letterSpacing: 0.3 },
  teacherCategory: { fontSize: 15, fontFamily: 'Quicksand-Medium', color: '#E8EFFF', textAlign: 'center' },
  tabsContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 0, marginBottom: 20, backgroundColor: '#fff', borderRadius: 25, padding: 4, borderWidth: 2, borderColor: '#E8EFFF' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  activeTabButton: { backgroundColor: '#5B7FFF', borderColor: '#5B7FFF' },
  tabButtonText: { fontFamily: 'Quicksand-SemiBold', fontSize: 14, color: '#5B7FFF' },
  activeTabButtonText: { color: '#fff' },
  ratingCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 20, marginBottom: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  ratingTopSection: { alignItems: 'center', marginBottom: 25 },
  averageRatingText: { fontSize: 52, fontFamily: 'OpenSans-Bold', color: '#1a1a1a', marginBottom: 8, lineHeight: 52 },
  starsContainer: { flexDirection: 'row', marginBottom: 10 },
  totalReviewsText: { fontSize: 14, fontFamily: 'Quicksand-Medium', color: '#888' },
  ratingBarsContainer: { width: '100%' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, height: 20 },
  ratingLabel: { width: 15, fontSize: 14, fontFamily: 'Quicksand-SemiBold', color: '#333', marginRight: 15 },
  ratingBarBackground: { flex: 1, height: 10, backgroundColor: '#E8E8E8', borderRadius: 10, marginHorizontal: 0, overflow: 'hidden' },
  ratingBarFill: { height: '100%', backgroundColor: '#5B7FFF', borderRadius: 10 },
  ratingPercentage: { width: 45, textAlign: 'right', fontSize: 13, fontFamily: 'Quicksand-Medium', color: '#999', marginLeft: 15 },
  feedbackHeader: { paddingHorizontal: 20, paddingBottom: 15 },
  feedbackTitle: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: '#fff', letterSpacing: 0.3 },
  reviewsSection: { paddingHorizontal: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  reviewerInfo: { flex: 1, marginLeft: 12 },
  reviewerImage: { width: 40, height: 40, borderRadius: 20 },
  reviewerInitialsContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8EFFF', justifyContent: 'center', alignItems: 'center' },
  reviewerInitials: { fontSize: 14, fontFamily: 'OpenSans-Bold', color: '#5B7FFF' },
  reviewerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontSize: 14, fontFamily: 'Quicksand-Bold', color: '#1a1a1a', flex: 1 },
  reviewStars: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  reviewDate: { fontSize: 11, fontFamily: 'Quicksand-Regular', color: '#999' },
  reviewText: { fontSize: 13, fontFamily: 'Quicksand-Regular', color: '#555', lineHeight: 20 },
  reviewContent: { marginTop: 12, paddingTop: 0 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyStateText: { fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 10, fontFamily: 'Quicksand-SemiBold' },
  emptyStateSubtext: { fontSize: 14, color: '#E8EFFF', textAlign: 'center', marginTop: 8, fontFamily: 'Quicksand-Regular', lineHeight: 20 },
});