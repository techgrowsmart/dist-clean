import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
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
  paginationActiveBg: '#374151',
  paginationInactiveBg: '#E5E7EB',
  paginationInactiveTxt: '#6B7280',
  headerTxt: '#000000',
};

// --- Mock Data ---
type Board = {
  id: string;
  name: string;
  subjectCount: number;
  image: string;
  tags: string[];
  description: string;
};

const BOARDS_DATA: Board[] = [
  {
    id: '1',
    name: 'CBSE',
    subjectCount: 12,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
    tags: ['Mathematics', 'Science', 'English'],
    description: 'Central Board of Secondary Education'
  },
  {
    id: '2',
    name: 'ICSE',
    subjectCount: 10,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e2f0bb3?w=400&q=80',
    tags: ['Physics', 'Chemistry', 'Biology'],
    description: 'Indian Certificate of Secondary Education'
  },
  {
    id: '3',
    name: 'State Board',
    subjectCount: 8,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    tags: ['Regional Languages', 'Math', 'Science'],
    description: 'State Education Boards'
  },
  {
    id: '4',
    name: 'IB',
    subjectCount: 15,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80',
    tags: ['Theory of Knowledge', 'Extended Essay'],
    description: 'International Baccalaureate'
  },
  {
    id: '5',
    name: 'Cambridge',
    subjectCount: 11,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80',
    tags: ['O Level', 'A Level', 'IGCSE'],
    description: 'Cambridge International Examinations'
  },
  {
    id: '6',
    name: 'NIOS',
    subjectCount: 9,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
    tags: ['Open Schooling', 'Distance Education'],
    description: 'National Institute of Open Schooling'
  }
];

interface AllBoardsProps {
  userEmail?: string;
  studentName?: string;
  profileImage?: string;
}

export default function AllBoards({ userEmail, studentName, profileImage }: AllBoardsProps) {
  const router = useRouter();

  const handleBoardPress = (board: Board) => {
    // Navigate to board details or subjects
    router.push({
      pathname: '/(tabs)/StudentDashBoard/BoardDetails' as any,
      params: {
        boardId: board.id,
        boardName: board.name,
        subjectCount: board.subjectCount.toString(),
        userEmail: userEmail || ''
      }
    });
  };

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search:', query);
  };

  const renderBoardCard = (board: Board) => (
    <TouchableOpacity 
      key={board.id} 
      style={styles.boardCard}
      onPress={() => handleBoardPress(board)}
    >
      <ImageBackground 
        source={{ uri: board.image }} 
        style={styles.boardImage}
        resizeMode="cover"
      >
        <View style={styles.boardOverlay}>
          <View style={styles.boardContent}>
            <Text style={styles.boardName}>{board.name}</Text>
            <Text style={styles.boardDescription}>{board.description}</Text>
            <Text style={styles.boardSubjectCount}>{board.subjectCount} Subjects</Text>
            
            <View style={styles.tagsContainer}>
              {board.tags.map((tag, index) => (
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
        <Text style={styles.headerTitle}>All Boards</Text>
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
          placeholder="Search boards..."
          placeholderTextColor={COLORS.textSecondary}
          onChangeText={handleSearch}
        />
      </View>

      {/* Boards Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.boardsGrid}>
          {BOARDS_DATA.map(renderBoardCard)}
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
  boardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  boardCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  boardImage: {
    width: '100%',
    height: '100%',
  },
  boardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  boardContent: {
    padding: 12,
  },
  boardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Poppins_600SemiBold',
  },
  boardDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  boardSubjectCount: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.tagTxt,
    fontFamily: 'Poppins_400Regular',
  },
});
