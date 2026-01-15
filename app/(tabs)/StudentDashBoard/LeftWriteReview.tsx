import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, TextInput, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const { width, height } = Dimensions.get('window');


const WriteReviewScreen: React.FC = () => {
  const params = useLocalSearchParams<{
    teacherId: string;
    teacherName: string;
    teacherDepartment: string;
    teacherAvatar?: string;
  }>();
  
  const teacher = {
    teacherId: params.teacherId || '1',
    teacherName: params.teacherName || 'Unknown Teacher',
    teacherDepartment: params.teacherDepartment || 'Unknown Department',
    teacherAvatar: params.teacherAvatar ? { uri: params.teacherAvatar } : undefined
  };
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': require('@expo-google-fonts/montserrat').Montserrat_400Regular,
    'Montserrat-Medium': require('@expo-google-fonts/montserrat').Montserrat_500Medium,
    'Montserrat-SemiBold': require('@expo-google-fonts/montserrat').Montserrat_600SemiBold,
    'Montserrat-Bold': require('@expo-google-fonts/montserrat').Montserrat_700Bold,
  });

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');


  const tags = ['Helpful', 'Clear', 'Patient', 'Engaging', 'Fair'];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B5FE8" /></View>;
  }

  const handleSubmitReview = () => {
    // Here you would typically submit the review to your backend
    // Then navigate to the congrats screen
    router.push({
      pathname: '/(tabs)/reviewCongrats',
      params: {
        teacherId: teacher.teacherId,
        teacherName: teacher.teacherName,
        teacherDepartment: teacher.teacherDepartment,
        teacherAvatar: params.teacherAvatar,
        rating: rating,
        reviewText: reviewText,
        selectedTags: selectedTags
      }
    });
  };

  return (
    <ImageBackground source={require('../../../assets/images/TeacherLeftBackground.png')} style={styles.background} resizeMode="cover">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#5B5FE8" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Write Review</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.teacherSection}>
            <View style={styles.avatarContainer}>
              {teacher.teacherAvatar ? (
                <Image source={teacher.teacherAvatar} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(teacher.teacherName)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.teacherName}>{teacher.teacherName}</Text>
            <Text style={styles.teacherDepartment}>{teacher.teacherDepartment}</Text>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.questionText}>How was your experience ?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                  <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={50} color="#FFC107" />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.tapText}>Tap a star to rate</Text>
          </View>

          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>What went well ?</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TouchableOpacity key={tag} style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>Your Review</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </View>
            <View style={styles.textInputContainer}>
              <TextInput style={styles.textInput} placeholder="Share your experience with this teacher ..." placeholderTextColor="#A0A0A0" multiline numberOfLines={6} textAlignVertical="top" value={reviewText} onChangeText={setReviewText} maxLength={500} />
              <Text style={styles.charCount}>{reviewText.length}/500</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (!rating || !reviewText) && styles.submitButtonDisabled]} 
            activeOpacity={0.8}
            onPress={handleSubmitReview}
            disabled={!rating || !reviewText}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" style={styles.submitIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: height * 0.05, paddingTop: height * 0.05, paddingHorizontal: width * 0.05 },
  container: { width: '100%', minHeight: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerPlaceholder: {
    width: 40, // Same as back button for centering
  },
  headerTitle: { fontSize: width * 0.06, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: height * 0.03, textAlign: 'center' },
  teacherSection: { alignItems: 'center', marginBottom: height * 0.03 },
  avatarContainer: { marginBottom: height * 0.015 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 40, fontFamily: 'Montserrat-Bold', color: '#4A5568' },
  teacherName: { fontSize: width * 0.055, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginBottom: height * 0.005, textAlign: 'center' },
  teacherDepartment: { fontSize: width * 0.038, fontFamily: 'Montserrat-Medium', color: '#E0E7FF', textAlign: 'center' },
  ratingSection: { alignItems: 'center', marginBottom: height * 0.03 },
  questionText: { fontSize: width * 0.045, fontFamily: 'Montserrat-SemiBold', color: '#FFFFFF', marginBottom: height * 0.015, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: height * 0.01 },
  starButton: { marginHorizontal: 3 },
  tapText: { fontSize: width * 0.035, fontFamily: 'Montserrat-Regular', color: '#E0E7FF', textAlign: 'center' },
  tagsSection: { marginBottom: height * 0.025 },
  tagsTitle: { fontSize: width * 0.04, fontFamily: 'Montserrat-SemiBold', color: '#FFFFFF', marginBottom: height * 0.015 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: '#FFFFFF', paddingHorizontal: width * 0.05, paddingVertical: height * 0.012, borderRadius: 25, marginRight: 8, marginBottom: 8 },
  tagSelected: { backgroundColor: '#5B5FE8' },
  tagText: { fontSize: width * 0.037, fontFamily: 'Montserrat-SemiBold', color: '#5B5FE8' },
  tagTextSelected: { color: '#FFFFFF' },
  reviewSection: { marginBottom: height * 0.025 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: height * 0.012 },
  reviewTitle: { fontSize: width * 0.04, fontFamily: 'Montserrat-SemiBold', color: '#FFFFFF', marginRight: 8 },
  badge: { backgroundColor: '#5B5FE8', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: width * 0.032, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' },
  textInputContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: width * 0.04, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  textInput: { fontSize: width * 0.037, fontFamily: 'Montserrat-Regular', color: '#333', minHeight: height * 0.15, marginBottom: height * 0.01 },
  charCount: { fontSize: width * 0.032, fontFamily: 'Montserrat-Medium', color: '#A0A0A0', textAlign: 'right' },
  submitButton: { 
    backgroundColor: '#3730A3', 
    paddingVertical: height * 0.02, 
    paddingHorizontal: width * 0.06, 
    borderRadius: 30, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    elevation: 6 
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: { fontSize: width * 0.045, fontFamily: 'Montserrat-Bold', color: '#FFFFFF', marginRight: 8 },
  submitIcon: { marginLeft: 4 },
});

export default WriteReviewScreen;