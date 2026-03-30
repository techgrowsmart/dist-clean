import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
  TextInput,
} from 'react-native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  mathColor: '#FF6B6B',
  scienceColor: '#4ECDC4',
  englishColor: '#45B7D1',
  historyColor: '#96CEB4',
  artsColor: '#FFEAA7',
  programmingColor: '#DDA0DD',
};

// --- Mock Data ---
type Subject = {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  chapters: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  icon: string;
};

const SUBJECTS_DATA: Subject[] = [
  {
    id: '1',
    name: 'Mathematics',
    category: 'Core',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    description: 'Master mathematical concepts from algebra to calculus',
    chapters: 24,
    duration: '12 weeks',
    difficulty: 'Medium',
    color: COLORS.mathColor,
    icon: 'calculator'
  },
  {
    id: '2',
    name: 'Physics',
    category: 'Science',
    image: 'https://images.unsplash.com/photo-1532097850253-341b7c1a5c9b?w=400&q=80',
    description: 'Explore the fundamental laws of nature',
    chapters: 18,
    duration: '10 weeks',
    difficulty: 'Hard',
    color: COLORS.scienceColor,
    icon: 'flask'
  },
  {
    id: '3',
    name: 'Chemistry',
    category: 'Science',
    image: 'https://images.unsplash.com/photo-1532097850253-341b7c1a5c9b?w=400&q=80',
    description: 'Discover the world of molecules and reactions',
    chapters: 20,
    duration: '10 weeks',
    difficulty: 'Medium',
    color: COLORS.scienceColor,
    icon: 'test-tube'
  },
  {
    id: '4',
    name: 'Biology',
    category: 'Science',
    image: 'https://images.unsplash.com/photo-1532097850253-341b7c1a5c9b?w=400&q=80',
    description: 'Study life and living organisms',
    chapters: 16,
    duration: '8 weeks',
    difficulty: 'Easy',
    color: COLORS.scienceColor,
    icon: 'leaf'
  },
  {
    id: '5',
    name: 'English',
    category: 'Language',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
    description: 'Improve reading, writing, and communication skills',
    chapters: 15,
    duration: '8 weeks',
    difficulty: 'Easy',
    color: COLORS.englishColor,
    icon: 'book'
  },
  {
    id: '6',
    name: 'History',
    category: 'Social Studies',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e2f0bb3?w=400&q=80',
    description: 'Learn about past civilizations and events',
    chapters: 12,
    duration: '6 weeks',
    difficulty: 'Easy',
    color: COLORS.historyColor,
    icon: 'globe'
  },
  {
    id: '7',
    name: 'Geography',
    category: 'Social Studies',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    description: 'Explore our planet and its features',
    chapters: 10,
    duration: '6 weeks',
    difficulty: 'Easy',
    color: COLORS.historyColor,
    icon: 'map'
  },
  {
    id: '8',
    name: 'Computer Science',
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80',
    description: 'Learn programming and computer fundamentals',
    chapters: 22,
    duration: '14 weeks',
    difficulty: 'Hard',
    color: COLORS.programmingColor,
    icon: 'laptop'
  }
];

interface AllSubjectsProps {
  userEmail?: string;
  studentName?: string;
  profileImage?: string;
}

export default function AllSubjects({ userEmail, studentName, profileImage }: AllSubjectsProps) {
  const router = useRouter();

  const handleSubjectPress = (subject: Subject) => {
    // Navigate to subject details
    router.push({
      pathname: '/(tabs)/StudentDashBoard/SubjectDetails' as any,
      params: {
        subjectId: subject.id,
        subjectName: subject.name,
        category: subject.category,
        userEmail: userEmail || ''
      }
    });
  };

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search:', query);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return COLORS.textSecondary;
    }
  };

  const renderSubjectCard = (subject: Subject) => (
    <TouchableOpacity 
      key={subject.id} 
      style={styles.subjectCard}
      onPress={() => handleSubjectPress(subject)}
    >
      <View style={[styles.subjectHeader, { backgroundColor: subject.color }]}>
        <View style={styles.subjectIconContainer}>
          <Ionicons 
            name={subject.icon as any} 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
        <Text style={styles.subjectName}>{subject.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{subject.category}</Text>
        </View>
      </View>
      
      <View style={styles.subjectContent}>
        <Text style={styles.subjectDescription}>{subject.description}</Text>
        
        <View style={styles.subjectMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{subject.chapters} chapters</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{subject.duration}</Text>
          </View>
        </View>
        
        <View style={styles.difficultyContainer}>
          <Text style={styles.difficultyLabel}>Difficulty:</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(subject.difficulty) }]}>
            <Text style={styles.difficultyText}>{subject.difficulty}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Subjects</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects..."
          placeholderTextColor={COLORS.textSecondary}
          onChangeText={handleSearch}
        />
      </View>

      {/* Subjects List */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.subjectsList}>
          {SUBJECTS_DATA.map(renderSubjectCard)}
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
  subjectsList: {
    flexDirection: 'column',
  },
  subjectCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Poppins_500Medium',
  },
  subjectContent: {
    padding: 16,
  },
  subjectDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  subjectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
