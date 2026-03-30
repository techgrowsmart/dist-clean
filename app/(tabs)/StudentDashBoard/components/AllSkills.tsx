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
  skillBeginner: '#10B981',
  skillIntermediate: '#F59E0B',
  skillAdvanced: '#EF4444',
};

// --- Mock Data ---
type Skill = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  image: string;
  description: string;
  duration: string;
  enrolledCount: number;
  rating: number;
  tags: string[];
};

const SKILLS_DATA: Skill[] = [
  {
    id: '1',
    name: 'Mathematics',
    level: 'Advanced',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    description: 'Advanced mathematical concepts and problem-solving',
    duration: '12 weeks',
    enrolledCount: 1234,
    rating: 4.8,
    tags: ['Algebra', 'Calculus', 'Geometry']
  },
  {
    id: '2',
    name: 'Science',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1532097850253-341b7c1a5c9b?w=400&q=80',
    description: 'Comprehensive science education',
    duration: '10 weeks',
    enrolledCount: 892,
    rating: 4.6,
    tags: ['Physics', 'Chemistry', 'Biology']
  },
  {
    id: '3',
    name: 'Programming',
    level: 'Advanced',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80',
    description: 'Learn to code from basics to advanced',
    duration: '16 weeks',
    enrolledCount: 2156,
    rating: 4.9,
    tags: ['Python', 'JavaScript', 'Web Development']
  },
  {
    id: '4',
    name: 'English',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80',
    description: 'Improve your English language skills',
    duration: '8 weeks',
    enrolledCount: 3456,
    rating: 4.7,
    tags: ['Grammar', 'Writing', 'Speaking']
  },
  {
    id: '5',
    name: 'History',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e2f0bb3?w=400&q=80',
    description: 'Explore world history and civilizations',
    duration: '6 weeks',
    enrolledCount: 567,
    rating: 4.5,
    tags: ['World History', 'Civics', 'Geography']
  },
  {
    id: '6',
    name: 'Arts',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&q=80',
    description: 'Discover your creative potential',
    duration: '4 weeks',
    enrolledCount: 789,
    rating: 4.8,
    tags: ['Drawing', 'Painting', 'Music']
  }
];

interface AllSkillsProps {
  userEmail?: string;
  studentName?: string;
  profileImage?: string;
}

export default function AllSkills({ userEmail, studentName, profileImage }: AllSkillsProps) {
  const router = useRouter();

  const handleSkillPress = (skill: Skill) => {
    // Navigate to skill details
    router.push({
      pathname: '/(tabs)/StudentDashBoard/SkillDetails' as any,
      params: {
        skillId: skill.id,
        skillName: skill.name,
        level: skill.level,
        userEmail: userEmail || ''
      }
    });
  };

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search:', query);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return COLORS.skillBeginner;
      case 'Intermediate': return COLORS.skillIntermediate;
      case 'Advanced': return COLORS.skillAdvanced;
      default: return COLORS.textSecondary;
    }
  };

  const renderSkillCard = (skill: Skill) => (
    <TouchableOpacity 
      key={skill.id} 
      style={styles.skillCard}
      onPress={() => handleSkillPress(skill)}
    >
      <ImageBackground 
        source={{ uri: skill.image }} 
        style={styles.skillImage}
        resizeMode="cover"
      >
        <View style={styles.skillOverlay}>
          <View style={styles.skillContent}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(skill.level) }]}>
                <Text style={styles.levelText}>{skill.level}</Text>
              </View>
            </View>
            
            <Text style={styles.skillDescription}>{skill.description}</Text>
            
            <View style={styles.skillMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.metaText}>{skill.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#FFFFFF" />
                <Text style={styles.metaText}>{skill.enrolledCount}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.metaText}>{skill.rating}</Text>
              </View>
            </View>
            
            <View style={styles.tagsContainer}>
              {skill.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Skills</Text>
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
          placeholder="Search skills..."
          placeholderTextColor={COLORS.textSecondary}
          onChangeText={handleSearch}
        />
      </View>

      {/* Skills Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.skillsGrid}>
          {SKILLS_DATA.map(renderSkillCard)}
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
  skillsGrid: {
    flexDirection: 'column',
  },
  skillCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
  },
  skillImage: {
    width: '100%',
    height: '100%',
  },
  skillOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  skillContent: {
    padding: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  skillDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Poppins_400Regular',
  },
  skillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
});
