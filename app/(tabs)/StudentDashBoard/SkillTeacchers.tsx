import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts } from "expo-font";
import { OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { AntDesign } from '@expo/vector-icons';
import { addFavoriteTeacher, removeFavoriteTeacher, checkFavoriteStatus } from '../../../services/favoriteTeachers';

const ITEMS_PER_PAGE = 4;

interface Teacher {
  email: string;
  name: string;
  profilePic: string;
  introduction?: string;
  description?: string;
  charge: string | number;
  board?: string;
  subject?: string;
  teachingClass?: string;
  language?: string;
  category?: string;
}

const SkillTeachers = ({ onBack, selectedSkill }) => {
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [likedTeachers, setLikedTeachers] = useState<{[key: string]: boolean}>({});
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'OpenSans-SemiBold': OpenSans_600SemiBold,
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        if (!selectedSkill) return;
        
        const auth = await getAuthData();
        if (!auth || !auth.token) {
          Alert.alert("Session Expired", "Please log in again.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await fetch(`${BASE_URL}/api/teachers/skill`, {
          method: "POST",
          headers,
          body: JSON.stringify({ selectedSkill }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch skill teachers");
        
        setAllTeachers(data);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        Alert.alert("Error", "Failed to fetch teachers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Add this useEffect to check favorite status on load
  useEffect(() => {
    const checkFavorites = async () => {
      const statuses: {[key: string]: boolean} = {};
      for (const teacher of allTeachers) {
        statuses[teacher.email] = await checkFavoriteStatus(teacher.email);
      }
      setLikedTeachers(statuses);
    };
    
    if (allTeachers.length > 0) {
      checkFavorites();
    }
  }, [allTeachers]);

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
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      setLikedTeachers(prev => ({
        ...prev, 
        [teacherEmail]: !prev[teacherEmail]
      }));
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const totalPages = Math.ceil(allTeachers.length / ITEMS_PER_PAGE);
  const paginatedData = allTeachers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const offerIndex = 2;
  const paginatedDataWithOffer = [...paginatedData];
  if (paginatedData.length > offerIndex) {
    paginatedDataWithOffer.splice(offerIndex, 0, { type: "offer", id: "offer-banner" });
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPagination = () => (
    <View style={styles.paginationWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pagination} style={{ overflow: 'visible' }}>
        <TouchableOpacity onPress={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={styles.arrows}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity key={page} onPress={() => handlePageChange(page)} style={styles.page}>
            <View style={[styles.pageNumber, currentPage === page && styles.activePage]}>
              <Text style={styles.pageNum}>{page}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={styles.rightArrow}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }) => {
    if (item.type === "offer") {
      return (
        <View style={styles.offerContainer}>
          <Text style={styles.thanksTitle}>🎉 Thanksgiving is Coming!</Text>
          <Text style={styles.thanksDescription}>
            Get up to 50% off every course. Keep learning daily and grow your skills. Don't miss it!
          </Text>
        </View>
      );
    }

    const isLiked = likedTeachers[item.email] || false;
    const profileImage = item.profilePic?.trim()?.replace(/^"|"$/g, "") || "";
    const introduction = item.introduction || item.description || "No description available.";
    const charge = item.charge?.toString() || "800";

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push({
          pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
          params: {
            name: item.name,
            email: item.email,
            board: item.board || "",
            teachingClass: item.teachingClass || "",
            subject: item.subject || "",
            language: item.language || "",
            profilePic: profileImage,
            charge: charge,
            description: introduction,
          },
        })}
      >
        <View style={styles.leftSection}>
          <Image 
            source={{ uri: profileImage }} 
            style={styles.image} 
            defaultSource={require("../../../assets/images/Profile.png")}
          />
          <Text style={styles.name}>{item.name || "Unnamed"}</Text>
        </View>
        <View style={styles.rightSection}>
          <View style={styles.titleRow}>
            <Text style={styles.profession}>{selectedSkill}</Text>
            <Text style={styles.charge}>₹{charge}</Text>
          </View>
          <Text style={styles.description} numberOfLines={3}>
            {introduction}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>
            <TouchableOpacity 
              onPress={(e) => { 
                e.stopPropagation(); 
                handleLikePress(item.email); 
              }} 
              style={styles.likeButton}
            >
              <AntDesign 
                name={isLiked ? "like1" : "like2"} 
                size={24} 
                color={isLiked ? "#4255ff" : "black"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4255FF" />
        <Text style={styles.loadingText}>Loading Skill Teachers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.back}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <BackArrowIcon size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Skill Teachers</Text>
        </View>
        <Text style={styles.totalCount}>{allTeachers.length} Found</Text>
      </View>

      <View style={styles.flex1}>
        <FlatList 
          data={paginatedDataWithOffer} 
          numColumns={1} 
          keyExtractor={(item, index) => `${item?.email || "no-email"}-${index}`} 
          renderItem={renderItem} 
          contentContainerStyle={[styles.grid, styles.paddingBottom15]} 
        />
      </View>

      {renderPagination()}
    </View>
  );
};

export default SkillTeachers;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: wp('4.27%'), paddingTop: hp('2.69%'), paddingBottom: 0 },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: hp('2.15%'), justifyContent: "space-between" },
  backButton: { width: wp('12.8%'), height: wp('12.8%'), alignItems: "center", justifyContent: "center", borderRadius: wp('6.4%'), padding: wp("1.04%"), backgroundColor: "#f5f6f8" },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  title: { fontSize: wp('4.27%'), fontWeight: "bold", marginLeft: wp('2.4%'), color: "#0d0c12" },
  totalCount: { fontSize: wp('3.73%'), color: "#4255ff", textAlign: "right" },
  grid: { paddingBottom: hp('2.15%') },
  paddingBottom15: { paddingBottom: hp('15%') },
  flex1: { flex: 1 },
  card: { flexDirection: "row", backgroundColor: "#ffffff", padding: wp('4.27%'), borderRadius: wp('4.27%'), marginVertical: hp('1.08%'), alignItems: "flex-start", gap: wp('4.27%'), borderWidth: 1, borderColor: "#edeeee" },
  leftSection: { alignItems: "center", width: wp('28.8%'), height: hp('17.9%'), backgroundColor: "#ffffff", padding: wp('2.67%'), borderRadius: wp('4.27%'), borderWidth: 1, borderColor: "#faf5e6" },
  image: { width: wp('24.5%'), height: wp('24.5%'), borderRadius: wp('2.13%'), marginBottom: hp('1.07%') },
  name: { fontSize: wp('4.27%'), fontWeight: "600", textAlign: "center", color: "#0d0c12" },
  rightSection: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: hp('0.8%') },
  profession: { fontSize: wp('4.27%'), fontWeight: "bold", color: "#0d0c12" },
  charge: { fontSize: wp('4.27%'), fontWeight: "500", color: "#000000" },
  description: { fontSize: wp('3.73%'), color: "#555", marginBottom: hp('1.07%'), lineHeight: wp('4.5%') },
  ratingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rating: { fontSize: wp('4.27%'), color: "#f1c40f" },
  likeButton: { padding: wp('1%') },
  paginationWrapper: { width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: hp("15%"), gap: wp("2.66%"), overflow: 'visible', position: 'absolute', bottom: hp("3%"), left: 0, right: 0, backgroundColor: '#fff', paddingTop: hp('1%') },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: wp("2%"), overflow: 'visible' },
  page: { alignItems: "center", justifyContent: "center", overflow: 'visible' },
  pageNumber: { alignItems: "center", justifyContent: "center", height: wp("8%"), width: wp("8%"), paddingHorizontal: wp("2.13%"), borderRadius: 5, backgroundColor: "#ffffff", marginHorizontal: 0, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
  pageNum: { fontSize: wp("4.27%"), color: "#000000ff", fontFamily: 'OpenSans-SemiBold' },
  activePage: { color: "#000000", elevation: 1 },
  arrowText: { fontSize: wp("5%"), color: "#000000", fontFamily: 'OpenSans-SemiBold', textAlign: 'center', fontWeight: '600' },
  arrows: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
  rightArrow: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
  offerContainer: { width: "100%", marginVertical: hp('2.69%'), padding: wp('4.27%'), backgroundColor: "#663259", height: hp('18.17%') },
  thanksTitle: { color: "#fff", fontSize: wp('4.27%'), fontWeight: "bold", marginBottom: hp('1.07%'), lineHeight: hp('2.83%') },
  thanksDescription: { color: "rgba(255,255,255,0.6)", fontSize: wp('4%'), lineHeight: hp('2.69%'), marginTop: hp('2.69%') },
});