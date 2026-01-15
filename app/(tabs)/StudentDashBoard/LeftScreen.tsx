import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, TextInput, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface Teacher {
  id: string;
  name: string;
  department: string;
  avatar?: any;
  isOnline?: boolean;
}

interface Review {
  id: string;
  teacherName: string;
  department: string;
  avatar?: any;
  rating: number;
  totalReviews: number;
  reviewText: string;
}

const LeftScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': require('@expo-google-fonts/montserrat').Montserrat_400Regular,
    'Montserrat-Medium': require('@expo-google-fonts/montserrat').Montserrat_500Medium,
    'Montserrat-SemiBold': require('@expo-google-fonts/montserrat').Montserrat_600SemiBold,
    'Montserrat-Bold': require('@expo-google-fonts/montserrat').Montserrat_700Bold,
    'OpenSans-Bold': require('@expo-google-fonts/open-sans').OpenSans_700Bold,
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
  });

  const [activeTab, setActiveTab] = useState<'myReviews' | 'reviews'>('myReviews');
  const [searchQuery, setSearchQuery] = useState('');

  const [teachers] = useState<Teacher[]>([
    { id: '1', name: 'Mr. Anderson', department: 'Physics Department', isOnline: true },
    { id: '2', name: 'Ms. Davis', department: 'Literature 10th Grade' },
    { id: '3', name: 'Ms. Davis', department: 'Literature 10th Grade' },
    { id: '4', name: 'Ms. Davis', department: 'Literature 10th Grade' },
    { id: '5', name: 'Ms. Frizzle', department: 'Science', isOnline: true },
  ]);

  const [reviews] = useState<Review[]>([
    { id: '1', teacherName: 'Mrs. Krabappel Elementary', department: 'SCIENCE', rating: 4.5, totalReviews: 1394, reviewText: 'She seems really tired all the time and just plays movies. Not very engaging for the students .' },
    { id: '2', teacherName: 'Mrs. Krabappel Elementary', department: 'SCIENCE', rating: 4.5, totalReviews: 1394, reviewText: 'She seems really tired all the time and just plays movies. Not very engaging for the students .' },
    { id: '3', teacherName: 'Mrs. Krabappel Elementary', department: 'SCIENCE', rating: 4.5, totalReviews: 1394, reviewText: 'She seems really tired all the time and just plays movies. Not very engaging for the students .' },
    { id: '4', teacherName: 'Mrs. Krabappel Elementary', department: 'SCIENCE', rating: 4.5, totalReviews: 1394, reviewText: 'She seems really tired all the time and just plays movies. Not very engaging for the students .' },
  ]);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter(review =>
    review.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B5FE8" /></View>;
  }

  return (
    <ImageBackground source={require('../../../assets/images/TeacherLeftBackground.png')} style={styles.background} resizeMode="cover">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>My Teachers</Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Search for a teacher ..." placeholderTextColor="#A0A0A0" value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'myReviews' && styles.activeTab]} onPress={() => setActiveTab('myReviews')}>
              <Text style={[styles.tabText, activeTab === 'myReviews' && styles.activeTabText]}>My Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} onPress={() => setActiveTab('reviews')}>
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'myReviews' ? (
            <View style={styles.teachersList}>
              {filteredTeachers.map((teacher) => (
                <View key={teacher.id} style={styles.teacherCard}>
                  <View style={styles.teacherInfo}>
                    <View style={styles.avatarContainer}>
                      {teacher.avatar ? (
                        <Image source={teacher.avatar} style={styles.avatar} onError={() => { teacher.avatar = null; }} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>{getInitials(teacher.name)}</Text>
                        </View>
                      )}
                      {teacher.isOnline && <View style={styles.onlineBadge} />}
                    </View>
                    <View style={styles.teacherDetails}>
                      <Text style={styles.teacherName}>{teacher.name}</Text>
                      <Text style={styles.teacherDepartment}>{teacher.department}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.reviewButton}
                    onPress={() => router.push({
                      pathname: '/(tabs)/StudentDashBoard/LeftWriteReview',
                      params: {
                        teacherId: teacher.id,
                        teacherName: teacher.name,
                        teacherDepartment: teacher.department,
                        teacherAvatar: teacher.avatar
                      }
                    })}
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {filteredReviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarContainer}>
                      {review.avatar ? (
                        <Image source={review.avatar} style={styles.reviewAvatar} />
                      ) : (
                        <View style={styles.reviewAvatarPlaceholder}>
                          <Text style={styles.reviewAvatarText}>{getInitials(review.teacherName)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.reviewTeacherInfo}>
                      <View style={styles.reviewTopRow}>
                        <Text style={styles.reviewTeacherName}>{review.teacherName}</Text>
                        <View style={styles.departmentBadge}>
                          <Text style={styles.departmentBadgeText}>{review.department}</Text>
                        </View>
                      </View>
                      <View style={styles.ratingRow}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4].map((star) => (
                            <Ionicons key={star} name="star" size={18} color="#FFC107" style={styles.starIcon} />
                          ))}
                        </View>
                        <Text style={styles.ratingText}>{review.rating}</Text>
                        <Text style={styles.totalReviewsText}>Total reviews: {review.totalReviews}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'myReviews' && (
            <View style={styles.bottomSection}>
              <View style={styles.addTeacherButton}>
                <Ionicons name="person-add" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.bottomText}>Don't see your teacher ?</Text>
              <Text style={styles.bottomSubText}>Find new teachers to subscribe</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: height * 0.05, paddingTop: height * 0.06, paddingHorizontal: width * 0.05 },
  container: { width: '100%', minHeight: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: width * 0.065, fontFamily: 'OpenSans-Bold', color: '#FFFFFF', marginBottom: height * 0.025, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 30, paddingHorizontal: width * 0.045, paddingVertical: height * 0.016, marginBottom: height * 0.02, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: width * 0.038, fontFamily: 'Montserrat-Regular', color: '#333' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 30, padding: 5, marginBottom: height * 0.02, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tab: { flex: 1, paddingVertical: height * 0.014, alignItems: 'center', borderRadius: 25 },
  activeTab: { backgroundColor: '#5B5FE8' },
  tabText: { fontSize: width * 0.038, fontFamily: 'Montserrat-SemiBold', color: '#64748B' },
  activeTabText: { color: '#FFFFFF' },
  teachersList: { flex: 1, marginBottom: height * 0.02 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 20, padding: width * 0.04, marginBottom: height * 0.015, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  teacherInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 55, height: 55, borderRadius: 27.5 },
  avatarPlaceholder: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#4A5568' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF' },
  teacherDetails: { flex: 1, marginRight: 10 },
  teacherName: { fontSize: width * 0.042, fontFamily: 'Montserrat-Bold', color: '#1E293B', marginBottom: 3 },
  teacherDepartment: { fontSize: width * 0.034, fontFamily: 'Montserrat-Medium', color: '#64748B' },
  reviewButton: { backgroundColor: '#E0E7FF', paddingHorizontal: width * 0.055, paddingVertical: height * 0.011, borderRadius: 18 },
  reviewButtonText: { fontSize: width * 0.036, fontFamily: 'Montserrat-SemiBold', color: '#5B5FE8' },
  reviewsList: { flex: 1, marginBottom: height * 0.02 },
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: width * 0.04, marginBottom: height * 0.015, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  reviewHeader: { flexDirection: 'row', marginBottom: height * 0.012 },
  reviewAvatarContainer: { marginRight: 12 },
  reviewAvatar: { width: 50, height: 50, borderRadius: 25 },
  reviewAvatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: 16, fontFamily: 'Quicksand-Bold', color: '#4A5568' },
  reviewTeacherInfo: { flex: 1 },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewTeacherName: { fontSize: width * 0.038, fontFamily: 'Quicksand-Bold', color: '#1E293B', marginRight: 8 },
  departmentBadge: { backgroundColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  departmentBadgeText: { fontSize: width * 0.028, fontFamily: 'Quicksand-Bold', color: '#059669' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  starsRow: { flexDirection: 'row', marginRight: 6 },
  starIcon: { marginRight: 1 },
  ratingText: { fontSize: width * 0.042, fontFamily: 'Quicksand-Bold', color: '#FFA500', marginRight: 6 },
  totalReviewsText: { fontSize: width * 0.032, fontFamily: 'Quicksand-Medium', color: '#64748B' },
  reviewText: { fontSize: width * 0.035, fontFamily: 'Quicksand-Regular', color: '#475569', lineHeight: width * 0.05 },
  bottomSection: { alignItems: 'center', marginTop: height * 0.03, marginBottom: height * 0.02 },
  addTeacherButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: height * 0.02, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  bottomText: { fontSize: width * 0.042, fontFamily: 'Montserrat-SemiBold', color: '#FFFFFF', marginBottom: height * 0.008, textAlign: 'center' },
  bottomSubText: { fontSize: width * 0.036, fontFamily: 'Montserrat-Medium', color: '#E0E7FF', textAlign: 'center' },
});

export default LeftScreen;