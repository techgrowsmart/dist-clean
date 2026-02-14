import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { OpenSans_700Bold } from '@expo-google-fonts/open-sans';
import { Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

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

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded]);

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

  if (!isReady) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B5FE8" /></View>;
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
        >
          <Text style={styles.headerTitle}>My Teachers</Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search for a teacher ..." 
              placeholderTextColor="#A0A0A0" 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'myReviews' && styles.activeTab]} 
              onPress={() => setActiveTab('myReviews')}
            >
              <Text style={[styles.tabText, activeTab === 'myReviews' && styles.activeTabText]}>My Reviews</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]} 
              onPress={() => setActiveTab('reviews')}
            >
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
                        <Image source={teacher.avatar} style={styles.avatar} />
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
                        <Text style={styles.ratingText}>{review.rating}</Text>
                        <Text style={styles.totalReviewsText}>({review.totalReviews})</Text>
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
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
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
  teachersList: { flex: 1, marginBottom: hp('2%') },
  teacherCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: wp('5%'), padding: wp('4%'), marginBottom: hp('1.5%'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  teacherInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: wp('4%') },
  avatar: { width: wp('12%'), height: wp('12%'), borderRadius: wp('6%') },
  avatarPlaceholder: { width: wp('12%'), height: wp('12%'), borderRadius: wp('6%'), backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: wp('4%'), fontFamily: 'Montserrat_700Bold', color: '#4A5568' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: wp('2.5%'), height: wp('2.5%'), borderRadius: wp('1.25%'), backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF' },
  teacherDetails: { flex: 1, marginRight: wp('2%') },
  teacherName: { fontSize: wp('4.2%'), fontFamily: 'Montserrat_700Bold', color: '#1E293B', marginBottom: 3 },
  teacherDepartment: { fontSize: wp('3.4%'), fontFamily: 'Montserrat_500Medium', color: '#64748B' },
  reviewButton: { backgroundColor: '#E0E7FF', paddingHorizontal: wp('5.5%'), paddingVertical: hp('1.1%'), borderRadius: wp('4.5%') },
  reviewButtonText: { fontSize: wp('3.6%'), fontFamily: 'Montserrat_600SemiBold', color: '#5B5FE8' },
  reviewsList: { flex: 1, marginBottom: hp('2%') },
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: wp('5%'), padding: wp('4%'), marginBottom: hp('1.5%'), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  reviewHeader: { flexDirection: 'row', marginBottom: hp('1.2%') },
  reviewAvatarContainer: { marginRight: wp('3%') },
  reviewAvatar: { width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%') },
  reviewAvatarPlaceholder: { width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%'), backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: wp('4%'), fontFamily: 'Quicksand_700Bold', color: '#4A5568' },
  reviewTeacherInfo: { flex: 1 },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  reviewTeacherName: { fontSize: wp('3.8%'), fontFamily: 'Quicksand_700Bold', color: '#1E293B', marginRight: wp('2%') },
  departmentBadge: { backgroundColor: '#A7F3D0', paddingHorizontal: wp('2.5%'), paddingVertical: hp('0.3%'), borderRadius: wp('3%') },
  departmentBadgeText: { fontSize: wp('2.8%'), fontFamily: 'Quicksand_700Bold', color: '#059669' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  starsRow: { flexDirection: 'row', marginRight: wp('1.5%') },
  starIcon: { marginRight: 2 },
  ratingText: { fontSize: wp('3.8%'), fontFamily: 'Quicksand_700Bold', color: '#FFA500', marginRight: 4 },
  totalReviewsText: { fontSize: wp('3.2%'), fontFamily: 'Quicksand_500Medium', color: '#64748B' },
  reviewText: { fontSize: wp('3.5%'), fontFamily: 'Quicksand_400Regular', color: '#475569', lineHeight: wp('5%') },
  bottomSection: { alignItems: 'center', marginTop: hp('3%'), marginBottom: hp('2%') },
  addTeacherButton: { width: wp('15%'), height: wp('15%'), borderRadius: wp('7.5%'), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: hp('2%'), shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  bottomText: { fontSize: wp('4.2%'), fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF', marginBottom: hp('0.8%'), textAlign: 'center' },
  bottomSubText: { fontSize: wp('3.6%'), fontFamily: 'Montserrat_500Medium', color: '#E0E7FF', textAlign: 'center' },
});

export default LeftScreen;