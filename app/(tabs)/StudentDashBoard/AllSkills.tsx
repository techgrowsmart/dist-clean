import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';
import BackButton from "../../../components/BackButton";

const { width } = Dimensions.get("window");

// Mock data for skills
const mockSkills = [
  { id: 1, name: 'Music', icon: '🎵', color: '#FF6B6B', count: 45 },
  { id: 2, name: 'Art & Craft', icon: '🎨', color: '#4ECDC4', count: 32 },
  { id: 3, name: 'Dance', icon: '💃', color: '#45B7D1', count: 28 },
  { id: 4, name: 'Yoga & Fitness', icon: '🧘', color: '#96CEB4', count: 36 },
  { id: 5, name: 'Photography', icon: '📷', color: '#FFEAA7', count: 19 },
  { id: 6, name: 'Cooking', icon: '👨‍🍳', color: '#DDA0DD', count: 24 },
  { id: 7, name: 'Writing', icon: '✍️', color: '#98D8C8', count: 21 },
  { id: 8, name: 'Languages', icon: '🌍', color: '#F7DC6F', count: 33 },
  { id: 9, name: 'Technology', icon: '💻', color: '#BB8FCE', count: 27 },
  { id: 10, name: 'Sports', icon: '⚽', color: '#85C1E2', count: 31 },
  { id: 11, name: 'Gardening', icon: '🌱', color: '#82E0AA', count: 15 },
  { id: 12, name: 'Public Speaking', icon: '🎤', color: '#F8B739', count: 18 },
];

export default function AllSkills({ onBack, onSkillSelect, category = "Skill teacher" }: {
  onBack: () => void;
  onSkillSelect: (skill: string) => void;
  category?: string;
}) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredSkills, setFilteredSkills] = useState(mockSkills);

  useEffect(() => {
    const filtered = mockSkills.filter(skill => 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || skill.name === selectedCategory)
    );
    setFilteredSkills(filtered);
  }, [searchQuery, selectedCategory]);

  const handleSkillPress = (skillName: string) => {
    onSkillSelect(skillName);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7BF7" />
      </View>
    );
  }

  // Web Layout
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.webHeader}>
          <View style={styles.webHeaderLeft}>
            <TouchableOpacity onPress={onBack} style={styles.webBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webTitle}>All Skills</Text>
          </View>
          <View style={styles.webHeaderRight}>
            <Text style={styles.webTotalCount}>{mockSkills.length} Skills Found</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.webSearchSection}>
          <View style={styles.webSearchBar}>
            <FontAwesome name="search" size={16} color="#999" style={styles.webSearchIcon} />
            <TextInput
              style={styles.webSearchInput}
              placeholder="Search skills..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Skills Grid */}
        <ScrollView style={styles.webSkillsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.webSkillsGrid}>
            {filteredSkills.map((skill) => (
              <TouchableOpacity 
                key={skill.id} 
                style={[styles.webSkillCard, { backgroundColor: skill.color + '20' }]}
                onPress={() => handleSkillPress(skill.name)}
              >
                <View style={[styles.webSkillIcon, { backgroundColor: skill.color }]}>
                  <Text style={styles.webSkillIconText}>{skill.icon}</Text>
                </View>
                <Text style={styles.webSkillName}>{skill.name}</Text>
                <Text style={styles.webSkillCount}>{skill.count} Teachers</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={styles.mobileContainer}>
      {/* Header */}
      <View style={styles.mobileHeader}>
        <View style={styles.mobileHeaderLeft}>
          <BackButton size={24} color="#000" onPress={onBack} />
          <Text style={styles.mobileTitle}>All Skills</Text>
        </View>
        <Text style={styles.mobileTotalCount}>{mockSkills.length} Skills Found</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.mobileSearchSection}>
        <View style={styles.mobileSearchBar}>
          <FontAwesome name="search" size={16} color="#999" style={styles.mobileSearchIcon} />
          <TextInput
            style={styles.mobileSearchInput}
            placeholder="Search skills..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Skills List */}
      <FlatList
        data={filteredSkills}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.mobileSkillsList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.mobileSkillCard, { backgroundColor: item.color + '20' }]}
            onPress={() => handleSkillPress(item.name)}
          >
            <View style={[styles.mobileSkillIcon, { backgroundColor: item.color }]}>
              <Text style={styles.mobileSkillIconText}>{item.icon}</Text>
            </View>
            <Text style={styles.mobileSkillName}>{item.name}</Text>
            <Text style={styles.mobileSkillCount}>{item.count} Teachers</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Web Styles
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webBackBtn: {
    padding: 8,
    marginRight: 15,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
  },
  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webTotalCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  webSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  webSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  webSearchIcon: {
    marginRight: 10,
  },
  webSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  webSkillsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  webSkillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  webSkillCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  webSkillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  webSkillIconText: {
    fontSize: 20,
  },
  webSkillName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  webSkillCount: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },

  // Mobile Styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mobileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_700Bold',
    marginLeft: 15,
  },
  mobileTotalCount: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  mobileSearchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  mobileSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  mobileSearchIcon: {
    marginRight: 10,
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  mobileSkillsList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  mobileSkillCard: {
    flex: 1,
    margin: 5,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    minHeight: 120,
  },
  mobileSkillIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mobileSkillIconText: {
    fontSize: 24,
  },
  mobileSkillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 5,
  },
  mobileSkillCount: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
