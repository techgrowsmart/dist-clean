import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { BASE_URL } from '../../../config';
import BackButton from "../../../components/BackButton";
import { skills, skillTeachers } from '../../../data/skills';

const { width } = Dimensions.get("window");

// Default skill images mapping
const SKILL_IMAGES: { [key: string]: string } = {
  'Music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  'Art': 'https://images.unsplash.com/photo-1585115397848-55da82956c20?w=400&h=300&fit=crop',
  'Dance': 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  'Workout': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop',
  'Photography': 'https://images.unsplash.com/photo-1502780402662-acc01917ac2e?w=400&h=300&fit=crop',
  'Cooking': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
};

const SKILL_COLORS: { [key: string]: string } = {
  'Music': '#FF6B6B',
  'Art': '#4ECDC4',
  'Dance': '#45B7D1',
  'Workout': '#96CEB4',
  'Photography': '#FFEAA7',
  'Cooking': '#DDA0DD',
};

export default function AllSkills() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load skills from local data
  useEffect(() => {
    const skillsWithDetails = skills.map((skill, index) => {
      // Count teachers for this skill from skillTeachers data
      const teacherCount = skillTeachers.filter(teacher =>
        teacher.skill.toLowerCase() === skill.name.toLowerCase()
      ).length;

      return {
        id: index + 1,
        name: skill.name,
        image: skill.image,
        color: SKILL_COLORS[skill.name] || '#FF6B6B',
        teacherCount: teacherCount,
      };
    });
    setSkillsList(skillsWithDetails);
    setFilteredSkills(skillsWithDetails);
    setLoading(false);
  }, []);

  useEffect(() => {
    const filtered = skillsList.filter(skill => 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSkills(filtered);
  }, [searchQuery, skillsList]);

  const handleSkillPress = (skillName: string) => {
    // Navigate to TeachersList with skill parameter
    router.push({
      pathname: '/(tabs)/StudentDashBoard/TeachersList',
      params: {
        skill: skillName,
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (!fontsLoaded || loading) {
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
            <TouchableOpacity onPress={handleBack} style={styles.webBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.webTitle}>All Skills</Text>
          </View>
          <View style={styles.webHeaderRight}>
            <Text style={styles.webTotalCount}>{skillsList.length} Skills Found</Text>
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
                <Image source={{ uri: skill.image }} style={styles.webSkillImage} />
                <Text style={styles.webSkillName}>{skill.name}</Text>
                <Text style={styles.webSkillCount}>{skill.teacherCount} Teachers</Text>
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
          <BackButton size={24} color="#000" onPress={handleBack} />
          <Text style={styles.mobileTitle}>All Skills</Text>
        </View>
        <Text style={styles.mobileTotalCount}>{skillsList.length} Skills Found</Text>
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
            <Image source={{ uri: item.image }} style={styles.mobileSkillImage} />
            <Text style={styles.mobileSkillName}>{item.name}</Text>
            <Text style={styles.mobileSkillCount}>{item.teacherCount} Teachers</Text>
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
  webSkillImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
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
  mobileSkillImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
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
