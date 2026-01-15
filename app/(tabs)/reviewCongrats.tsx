import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

type RouteParams = {
  teacherId: string;
  teacherName: string;
  teacherDepartment: string;
  teacherAvatar?: string;
  rating: string;
};

const ReviewCongratsScreen = () => {
  const params = useLocalSearchParams<RouteParams>();
  
  useEffect(() => {
    // Auto-navigate back to Student screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/StudentDashBoard/Student');
    }, 300000);
    
    return () => clearTimeout(timer);
  }, []);

  const [fontsLoaded] = useFonts({
    'OpenSans-Bold': require('@expo-google-fonts/open-sans').OpenSans_700Bold,
    'Quicksand-Regular': require('@expo-google-fonts/quicksand').Quicksand_400Regular,
    'Quicksand-Medium': require('@expo-google-fonts/quicksand').Quicksand_500Medium,
    'Quicksand-SemiBold': require('@expo-google-fonts/quicksand').Quicksand_600SemiBold,
    'Quicksand-Bold': require('@expo-google-fonts/quicksand').Quicksand_700Bold,
  });

  const teacher = {
    teacherId: params.teacherId || '1',
    teacherName: params.teacherName || 'Mr. James Anderson',
    teacherDepartment: params.teacherDepartment || 'Mathematics Dept.',
    teacherAvatar: params.teacherAvatar ? { uri: params.teacherAvatar } : undefined,
    rating: parseInt(params.rating || '5'),
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#5B5FE8" /></View>;
  }

  return (
    <ImageBackground source={require('../../assets/images/TeacherLeftBackground.png')} style={styles.background} resizeMode="cover">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          
          <View style={styles.illustrationContainer}>
            <Image source={require('../../assets/images/reviewCongrats.png')} style={styles.illustration} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Review Submitted !</Text>

          <Text style={styles.description}>Thanks for sharing! Your feedback for {teacher.teacherName} has been successfully{'\n'}submitted.</Text>

          <View style={styles.teacherCard}>
            <View style={styles.teacherInfo}>
              <View style={styles.avatarContainer}>
                {teacher.teacherAvatar ? (
                  <Image source={teacher.teacherAvatar} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{getInitials(teacher.teacherName)}</Text>
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{teacher.teacherName}</Text>
                <Text style={styles.teacherDepartment}>{teacher.teacherDepartment}</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={18} color="#FFC107" style={styles.star} />
                  ))}
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8} 
            onPress={() => router.replace('/(tabs)/StudentDashBoard/Student')}
          >
            <Text style={styles.primaryButtonText}>Return to Teacher List</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: height * 0.05, paddingTop: height * 0.05, paddingHorizontal: width * 0.06 },
  container: { width: '100%', minHeight: '100%', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  illustrationContainer: { width: width * 2, height: height * 0.35, marginBottom: height * 0.02, alignItems: 'center', justifyContent: 'center' },
  illustration: { width: '100%', height: '100%' },
  title: { fontSize: width * 0.068, fontFamily: 'OpenSans-Bold', color: '#FFFFFF', marginBottom: height * 0.02, textAlign: 'center' },
  description: { fontSize: width * 0.04, fontFamily: 'Quicksand-Medium', color: '#FFFFFF', marginBottom: height * 0.03, textAlign: 'center', lineHeight: width * 0.055, paddingHorizontal: width * 0.02 },
  teacherCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: width * 0.045, marginBottom: height * 0.025, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  teacherInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontFamily: 'Quicksand-Bold', color: '#4A5568' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  teacherDetails: { flex: 1 },
  teacherName: { fontSize: width * 0.045, fontFamily: 'Quicksand-Bold', color: '#1E293B', marginBottom: 2 },
  teacherDepartment: { fontSize: width * 0.035, fontFamily: 'Quicksand-Medium', color: '#64748B', marginBottom: 6 },
  starsContainer: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
  primaryButton: { backgroundColor: '#3730A3', paddingVertical: height * 0.02, paddingHorizontal: width * 0.08, borderRadius: 30, width: '100%', alignItems: 'center', marginBottom: height * 0.015, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  primaryButtonText: { fontSize: width * 0.042, fontFamily: 'Quicksand-Bold', color: '#FFFFFF' },
});

export default ReviewCongratsScreen;