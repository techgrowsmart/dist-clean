import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../../utils/authStorage';
import AsyncStorage from "@react-native-async-storage/async-storage";
import WebNavbar from '../../../../components/ui/WebNavbar';
import { useFonts } from '@expo-google-fonts/poppins';

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  tagBg: '#C7D2FE',
  tagTxt: '#1F2937',
  headerTxt: '#000000',
  class1: '#FF6B6B',
  class2: '#4ECDC4',
  class3: '#45B7D1',
  class4: '#96CEB4',
  class5: '#FFEAA7',
  class6: '#DDA0DD',
  class7: '#74B9FF',
  class8: '#A29BFE',
  class9: '#FD79A8',
  class10: '#FDCB6E',
  class11: '#6C5CE7',
  class12: '#00B894',
};

// --- Mock Data ---
type Class = {
  id: string;
  name: string;
  grade: number;
  image: string;
  description: string;
  subjects: string[];
  students: number;
  teachers: number;
  color: string;
  features: string[];
};

const CLASSES_DATA: Class[] = [
  {
    id: '1',
    name: 'Class 1',
    grade: 1,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    description: 'Foundation learning with interactive activities',
    subjects: ['English', 'Math', 'Science', 'Social Studies'],
    students: 245,
    teachers: 8,
    color: COLORS.class1,
    features: ['Play-based Learning', 'Story Time', 'Art & Craft']
  },
  {
    id: '2',
    name: 'Class 2',
    grade: 2,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    description: 'Building fundamental skills with engaging content',
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer'],
    students: 312,
    teachers: 10,
    color: COLORS.class2,
    features: ['Interactive Games', 'Reading Program', 'Basic Coding']
  },
  {
    id: '3',
    name: 'Class 3',
    grade: 3,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
    description: 'Developing critical thinking and problem-solving',
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art'],
    students: 289,
    teachers: 9,
    color: COLORS.class3,
    features: ['Science Lab', 'Math Puzzles', 'Creative Writing']
  },
  {
    id: '4',
    name: 'Class 4',
    grade: 4,
    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&q=80',
    description: 'Expanding knowledge with comprehensive curriculum',
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Music'],
    students: 356,
    teachers: 12,
    color: COLORS.class4,
    features: ['Project Work', 'Debate Club', 'Science Fair']
  },
  {
    id: '5',
    name: 'Class 5',
    grade: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    description: 'Preparing for middle school with advanced concepts',
    subjects: ['English', 'Math', 'Science', 'Social Studies', 'Computer', 'Art', 'Music', 'PE'],
    students: 423,
    teachers: 14,
    color: COLORS.class5,
    features: ['Advanced Math', 'Science Projects', 'Leadership Skills']
  },
  {
    id: '6',
    name: 'Class 6',
    grade: 6,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80',
    description: 'Middle school transition with specialized subjects',
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer'],
    students: 467,
    teachers: 16,
    color: COLORS.class6,
    features: ['Lab Experiments', 'Advanced English', 'Programming Basics']
  },
  {
    id: '7',
    name: 'Class 7',
    grade: 7,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    description: 'Developing deeper understanding of core concepts',
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer'],
    students: 412,
    teachers: 15,
    color: COLORS.class7,
    features: ['Research Projects', 'Advanced Math', 'Coding Club']
  },
  {
    id: '8',
    name: 'Class 8',
    grade: 8,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    description: 'Comprehensive education with practical applications',
    subjects: ['English', 'Math', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer'],
    students: 389,
    teachers: 14,
    color: COLORS.class8,
    features: ['Science Olympiad', 'Math Competition', 'Tech Club']
  }
];

interface AllClassesProps {
  userEmail?: string;
  studentName?: string;
  profileImage?: string;
}

export default function AllClasses({ userEmail, studentName, profileImage }: AllClassesProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleClassPress = (classItem: Class) => {
    // Navigate to class details
    router.push({
      pathname: '/(tabs)/StudentDashBoard/ClassDetails' as any,
      params: {
        classId: classItem.id,
        className: classItem.name,
        grade: classItem.grade.toString(),
        userEmail: userEmail || ''
      }
    });
  };

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search:', query);
  };

  const renderClassCard = (classItem: Class) => (
    <TouchableOpacity 
      key={classItem.id} 
      style={styles.classCard}
      onPress={() => handleClassPress(classItem)}
    >
      <ImageBackground 
        source={{ uri: classItem.image }} 
        style={styles.classImage}
        resizeMode="cover"
      >
        <View style={[styles.classOverlay, { backgroundColor: classItem.color }]}>
          <View style={styles.classContent}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{classItem.name}</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>Grade {classItem.grade}</Text>
              </View>
            </View>
            
            <Text style={styles.classDescription}>{classItem.description}</Text>
            
            <View style={styles.classStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{classItem.students} students</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{classItem.teachers} teachers</Text>
              </View>
            </View>
            
            <View style={styles.featuresContainer}>
              {classItem.features.slice(0, 2).map((feature, index) => (
                <View key={index} style={styles.featureBadge}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Web Navbar for desktop */}
      {Platform.OS === 'web' && (
        <WebNavbar
          studentName={studentName}
          profileImage={profileImage}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
        />
      )}
      
      {/* Mobile Header */}
      {Platform.OS !== 'web' && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Classes</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.searchBtn}>
              <Ionicons name="search" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar (only for mobile) */}
      {Platform.OS !== 'web' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
            placeholderTextColor={COLORS.textSecondary}
            onChangeText={handleSearch}
          />
        </View>
      )}

      {/* Classes Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.classesGrid}>
          {CLASSES_DATA.map(renderClassCard)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.headerTxt,
    fontFamily: 'Poppins_600SemiBold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: 'Poppins_400Regular',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  classImage: {
    width: '100%',
    height: '100%',
  },
  classOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  classContent: {
    padding: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  gradeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  classDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  classStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
});
