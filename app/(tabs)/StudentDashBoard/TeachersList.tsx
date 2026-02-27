import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import BackButton from "../../../components/BackButton";
import { BASE_URL } from "../../../config";
import { useRouter } from "expo-router";
import { getAuthData } from "../../../utils/authStorage";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { AntDesign } from "@expo/vector-icons";
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';
import { favoritesEvents, FAVORITES_CHANGED_EVENT } from '../../../utils/favoritesEvents';

const ITEMS_PER_PAGE = 6;
const { width } = Dimensions.get("window");

interface Tuition {
  class: string;
  subject: string;
  board: string;
  timeFrom: string;
  timeTo: string;
  charge: string;
  day: string;
  classId?: string;
  skill?: string;
  skillId?: string;
}

interface Teacher {
  name: string;
  email: string;
  board: string;
  teachingClass?: string;
  class?: string;
  subject: string;
  language: string;
  profilepic: string;
  profilePic?: string;
  charge: number | string;
  description?: string;
  introduction?: string;
  rating?: number;
  reviewCount?: number;
  tuitions?: Tuition[] | string; // Can be array or string (JSON)
  category?: string;
  isspotlight?: boolean;
  qualifications?: any;
  teachingmode?: any;
  workexperience?: string;
}

export default function TeachersList({
  boardName,
  selectedClass,
  selectedSubject,
  onBack,
  onFavoritesChange,
}: {
  boardName: string;
  selectedClass: string;
  selectedSubject: string;
  onBack: () => void;
  onFavoritesChange?: () => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});

  const router = useRouter();

  // Add this useEffect to check favorite status on load
useEffect(() => {
    const checkFavorites = async () => {
        const statuses: {[key: string]: boolean} = {};
        for (const teacher of teachers) {
            statuses[teacher.email] = await checkFavoriteStatus(teacher.email);
        }
        setLikedTeachers(statuses);
    };
    
    if (teachers.length > 0) {
        checkFavorites();
    }
}, [teachers]);

  useEffect(() => {
const fetchTeachers = async () => {
  if (!boardName || !selectedClass || !selectedSubject) return;
  setLoading(true);
  try {
    const auth = await getAuthData();
    if (!auth || !auth.token) {
      console.error("No authentication token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${BASE_URL}/api/teacherInfo`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        board: boardName,
        className: selectedClass,
        subject: selectedSubject,
      }),
    });
    const data = await res.json();
    
    console.log("🔍 FULL API RESPONSE:", JSON.stringify(data, null, 2));
    
    // FIX: Check BOTH spotlightTeachers AND popularTeachers
    const spotlightTeachers = data.spotlightTeachers || {};
    const popularTeachers = data.popularTeachers || {};
    
    // Get teachers from both sources
    const spotlightSubjectTeachers = spotlightTeachers["Subject teacher"] || [];
    const popularSubjectTeachers = popularTeachers["Subject teacher"] || [];
    
    // Combine both arrays
    const subjectTeachers = [...spotlightSubjectTeachers, ...popularSubjectTeachers];
    
    console.log("🌟 Spotlight Teachers:", spotlightSubjectTeachers.length);
    console.log("📊 Popular Teachers:", popularSubjectTeachers.length); 
    console.log("🎯 Combined Subject Teachers:", subjectTeachers.length);
    console.log("📋 Total teachers to filter:", subjectTeachers.length);

    // If we have teachers, log the first one to see the structure
    if (subjectTeachers.length > 0) {
      const firstTeacher = subjectTeachers[0];
      console.log("👨‍🏫 First Teacher Data:", JSON.stringify(firstTeacher, null, 2));
      console.log("📚 First Teacher Tuitions:", firstTeacher.tuitions);
      console.log("📚 First Teacher Tuitions Type:", typeof firstTeacher.tuitions);
    }

    // Parse and filter teachers on the frontend
    let filtered = subjectTeachers.filter(item => {
        if (!item) return false;
        
        console.log("🔍 Checking teacher:", item.name);
        console.log("📚 Available fields:", Object.keys(item));
        
        // Parse tuitions to check for matches
        let tuitions = item.tuitions;
        if (typeof tuitions === 'string') {
            try {
                tuitions = JSON.parse(tuitions);
                console.log("✅ Parsed tuitions:", tuitions);
            } catch (err) {
                console.error("❌ Failed to parse tuitions:", err);
                tuitions = [];
            }
        }
        
        // Check if this teacher has a tuition that matches our criteria
        if (Array.isArray(tuitions)) {
            console.log("📋 Tuitions array length:", tuitions.length);
            const hasMatch = tuitions.some(tuition => {
                const matchesBoard = tuition.board === boardName;
                const matchesClass = tuition.class === selectedClass;
                const matchesSubject = tuition.subject === selectedSubject;
                
                console.log(`📊 Match results:`, {
                    tuitionBoard: tuition.board,
                    requiredBoard: boardName,
                    tuitionClass: tuition.class,
                    requiredClass: selectedClass, 
                    tuitionSubject: tuition.subject,
                    requiredSubject: selectedSubject,
                    matches: matchesBoard && matchesClass && matchesSubject
                });
                
                return matchesBoard && matchesClass && matchesSubject;
            });
            console.log("✅ Teacher has match:", hasMatch);
            return hasMatch;
        } else {
            console.log("❌ Tuitions is not an array or empty:", tuitions);
        }
        
        return false;
    });
    
    // Remove duplicates
    filtered = Array.from(new Map(filtered.map(item => [item.email, item])).values());
    
    console.log("🎯 Final filtered count:", filtered.length);
    console.log("🎯 Filtered teachers:", filtered);
    
    setTeachers(filtered || []);
    setCurrentPage(1);
  } catch (err) {
    console.error("Failed to fetch teachers:", err);
  } finally {
    setLoading(false);
  }
};

    fetchTeachers();
  }, [boardName, selectedClass, selectedSubject]);

  const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);

  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    console.log("Logging Teachers:", teachers);
    return teachers.slice(start, end);
  }, [teachers, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

const handleLikePress = async (teacherEmail: string) => {
    try {
        const isLiked = likedTeachers[teacherEmail] || false;
        
        // Optimistic update
        setLikedTeachers(prev => ({
            ...prev, 
            [teacherEmail]: !isLiked
        }));
        
        // API call
        if (isLiked) {
            await removeFavoriteTeacher(teacherEmail);
        } else {
            await addFavoriteTeacher(teacherEmail);
        }
        
        // Emit favorites change event
        favoritesEvents.emit(FAVORITES_CHANGED_EVENT);
        
        // Notify parent component of favorites change
        if (onFavoritesChange) {
            onFavoritesChange();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        // Revert on error
        setLikedTeachers(prev => ({
            ...prev, 
            [teacherEmail]: !prev[teacherEmail]
        }));
        // Optional: Show error toast
    }
};


  const renderStars = (rating: number = 4) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? "★" : "☆"}
        </Text>
      );
    }
    return stars;
  };

  const formatCharge = (charge: number | string) => {
    if (typeof charge === "string") {
      // Extract number from string like "800/pm"
      const match = charge.match(/\d+/);
      return match ? `₹ ${match[0]}` : `₹ ${charge}`;
    }
    return `₹ ${charge}`;
  };

const renderPagination = () => (
  <View style={styles.paginationWrapper}>
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.pagination}
      style={{ overflow: 'visible' }}
    >
      <TouchableOpacity
        onPress={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={styles.arrows}
      >
        <BackButton
          size={24}
          color="#4255ff"
          onPress={() => handlePageChange(currentPage - 1)}
        />
      </TouchableOpacity>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <TouchableOpacity
          key={page}
          onPress={() => handlePageChange(page)}
          style={styles.page}
        >
          <View
            style={[
              styles.pageNumber,
              currentPage === page && styles.activePage,
            ]}
          >
            <Text style={[
              styles.pageNum,
              currentPage === page && styles.activePageText
            ]}>
              {page}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={styles.rightArrow}
      >
        <BackButton
          size={24}
          color="#4255ff"
          onPress={() => handlePageChange(currentPage + 1)}
        />
      </TouchableOpacity>
    </ScrollView>
  </View>
);


const renderTeacherCard = ({ item }: { item: Teacher }) => {
  const profileImage = item.profilePic || item.profilepic;
  const isLiked = likedTeachers[item.email] || false;
  
  // Parse tuitions to find the matching tuition for this teacher
  let tuitions: any[] = [];
  if (item.tuitions) {
    if (typeof item.tuitions === 'string') {
      try {
        tuitions = JSON.parse(item.tuitions);
      } catch (err) {
        console.error("Failed to parse tuitions:", err);
        tuitions = [];
      }
    } else if (Array.isArray(item.tuitions)) {
      tuitions = item.tuitions;
    }
  }
  
  // Find the specific tuition that matches our search criteria
  const matchingTuition = tuitions.find(tuition => 
    tuition.board === boardName && 
    tuition.class === selectedClass && 
    tuition.subject === selectedSubject
  );
  
  // Use the matching tuition data, fallback to item data
  const teachingClass = matchingTuition?.class || selectedClass;
  const subject = matchingTuition?.subject || selectedSubject;
  const charge = matchingTuition?.charge || item.charge || "₹ 0";
  const introduction = item.introduction || item.description || "Experienced educator with passion for teaching";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
          params: {
            name: item.name,
            email: item.email,
            board: boardName,
            teachingClass: teachingClass,
            subject: subject,
            language: item.language || "English",
            profilePic: profileImage,
            charge: charge.toString(),
            description: introduction,
          },
        })
      }
    >
      <View style={styles.leftSection}>
        <View style={styles.imageContainer}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../../assets/images/Profile.png")
            }
            style={styles.image}
          />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.headerRow}>
          <View style={styles.classSubjectContainer}>
            <Text style={styles.classText}>{teachingClass}</Text>
            <Text style={styles.subjectText}>{subject}</Text>
          </View>
          <View style={styles.chargeLikeContainer}>
            <Text style={styles.chargeText}>{formatCharge(charge)}</Text>
            {/* ✅ ADD LIKE BUTTON HERE */}
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                handleLikePress(item.email);
              }}
              style={styles.likeButton}
            >
              <AntDesign
                name={isLiked ? "like1" : "like2"}
                size={wp("5.5%")}
                color={isLiked ? "#4255ff" : "black"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reviewContainer}>
          <Text style={styles.reviewLabel}>Review - </Text>
          <View style={styles.starsContainer}>
            {renderStars(item.rating || 4)}
          </View>
        </View>

        <Text style={styles.introduction} numberOfLines={3}>
          {introduction}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4255ff" />
      </View>
    );
  }

return (
  <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.back}>
        <BackButton 
          size={24} 
          color="#4255ff" 
          onPress={onBack}
        />
        <Text style={styles.title}>
          {selectedClass} {selectedSubject} teacher
        </Text>
      </View>
      <Text style={styles.totalCount}>{teachers.length} Found</Text>
    </View>

    <FlatList
      data={paginatedTeachers}
      keyExtractor={(item, index) => item.email + index}
      renderItem={renderTeacherCard}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={
        totalPages > 1 ? (
          <View style={styles.paginationFooter}>
            {renderPagination()}
          </View>
        ) : null
      }
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    paddingHorizontal: wp("4%"), 
    paddingTop: hp("2.5%"),
  },
  
  listContent: {
    paddingBottom: hp("2%"),
  },
  
  paginationFooter: {
    paddingVertical: hp("3%"),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  // Keep all your existing pagination styles exactly as they are:
  paginationWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp("2%"),
    overflow: 'visible'
  },
  
  page: {
    alignItems: "center",
    justifyContent: "center",
    overflow: 'visible'
  },
  
  pageNumber: {
    alignItems: "center",
    justifyContent: "center",
    height: wp("8%"),
    width: wp("8%"),
    paddingHorizontal: wp("2.13%"),
    borderRadius: 5,
    backgroundColor: "#ffffff",
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  
  pageNum: {
    fontSize: wp("4.27%"),
    color: "#000000",
    fontWeight: "600"
  },
  
  activePage: {
    backgroundColor: "#4255ff",
  },
  
  activePageText: {
    color: "#ffffff",
  },
  
  arrows: {
    height: wp("8%"),
    width: wp("8%"),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: wp("1.33%"),
    backgroundColor: "#ffffff",
    marginHorizontal: wp("1.06%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  
  rightArrow: {
    height: wp("8%"),
    width: wp("8%"),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: wp("1.33%"),
    backgroundColor: "#ffffff",
    marginHorizontal: wp("1.06%"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5
  },
  
  rightArrowIcon: {
    transform: [{ rotate: "180deg" }],
  },

  // Keep all your other existing styles
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: hp("2.5%"), justifyContent: "space-between" },
  backButton: { width: wp("12%"), height: wp("12%"), alignItems: "center", justifyContent: "center", borderRadius: wp("6%"), backgroundColor: "#f5f6f8" },
  back: { flexDirection: "row", alignItems: "center", flex: 1 },
  title: { fontSize: wp("4.5%"), fontWeight: "700", marginLeft: wp("3%"), color: "#0d0c12", flex: 1 },
  totalCount: { fontSize: wp("3.5%"), color: "#4255ff", fontWeight: "500" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: wp("4%"), padding: wp("4%"), marginVertical: hp("1%"), marginHorizontal: wp("2%"), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: "#f0f0f0", minHeight: hp("20%") },
  leftSection: { width: wp("30%"), height: hp("25%") ,  alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: wp("3%"), padding: wp("3%"), marginRight: wp("1.5%"), shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: "#f5f5f5" },
  imageContainer: { width: wp("26%"), height: wp("26%"), borderRadius: wp("2%"), overflow: "hidden", marginBottom: hp("1.2%"), backgroundColor: "#f9f9f9" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  name: { fontSize: wp("3.2%"), fontWeight: "600", textAlign: "center", color: "#1a1a1a", lineHeight: wp("4.2%"), paddingHorizontal: wp("1%") },
  rightSection: { flex: 1, justifyContent: "flex-start", paddingLeft: wp("1%") },
  // headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: hp("1.5%") },
  headerRow: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "flex-start", 
  marginBottom: hp("1.5%") 
},
  classSubjectContainer: { flex: 1 },
  classText: { fontSize: wp("4.2%"), fontWeight: "700", color: "#1a1a1a", lineHeight: wp("5%") },
  subjectText: { fontSize: wp("4.2%"), color: "#1a1a1a", fontWeight: "400", lineHeight: wp("5%"), marginTop: hp("0.2%") },
  // chargeText: { fontSize: wp("4.2%"), color: "#1a1a1a", fontWeight: "700", textAlign: "right" },
  chargeText: { 
  fontSize: wp("4.2%"), 
  color: "#1a1a1a", 
  fontWeight: "700" 
},
  reviewContainer: { flexDirection: "row", alignItems: "center", marginBottom: hp("1.5%") },
  reviewLabel: { fontSize: wp("3.8%"), color: "#1a1a1a", fontWeight: "400" },
  starsContainer: { flexDirection: "row", alignItems: "center" },
  star: { fontSize: wp("4%"), color: "#FFD700", marginRight: wp("0.5%") },
  introduction: { fontSize: wp("3.5%"), color: "#666666", lineHeight: wp("4.8%"), textAlign: "left" },
  // Add these styles to the StyleSheet object
chargeLikeContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: wp("2%"),
},  

likeButton: {
  padding: wp("1%"),
},
});
