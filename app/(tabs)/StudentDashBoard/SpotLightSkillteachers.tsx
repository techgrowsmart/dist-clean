import { OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import BackButton from "../../../components/BackButton";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import axios from "axios";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const ITEMS_PER_PAGE = 4; // Changed from 9 to 4
const { width } = Dimensions.get("window");

const SpotLightSkillteachers = ({ onBack }) => {
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSpotlightCount, setTotalSpotlightCount] = useState(0);
  
  const [fontsLoaded] = useFonts({
    'OpenSans-SemiBold': OpenSans_600SemiBold,
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token) {
          Alert.alert("Session Expired", "Please log in again.");
          return;
        }
        console.log("token", auth.token);
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const response = await axios.post(
          `${BASE_URL}/api/teachers`,
          {
            count: 100, // Fetch more teachers to handle pagination client-side
            page: 1,
          },
          {
            headers,
          }
        );
        const data = response.data;
        console.log("Fetched teachers data:", data);
        console.log("🔍 [SpotLightSkillteachers] Full API Response:", JSON.stringify(data, null, 2));
        console.log("🔍 [SpotLightSkillteachers] Spotlight Teachers:", data.spotlightTeachers);
        console.log("🔍 [SpotLightSkillteachers] Skill Teachers:", data.spotlightTeachers?.["Skill teacher"]);
        console.log("🔍 [SpotLightSkillteachers] Response Headers:", response.headers);
        if (!data || !data.spotlightTeachers) {
          console.error("Invalid data format received:", data);
          Alert.alert("Error", "Invalid data format received.");
          return;
        }
        const skillOnly = data.spotlightTeachers?.["Skill teacher"] || [];
        if (!Array.isArray(skillOnly)) {
          console.error("Invalid data format for skill teachers:", skillOnly);
          Alert.alert("Error", "Invalid data format received.");
          return;
        }
        
        // Remove duplicate teachers based on email
        const uniqueTeachers = Array.from(
          new Map(skillOnly.map(teacher => [teacher.email, teacher])).values()
        );
        
        setAllTeachers(uniqueTeachers);
        setTotalSpotlightCount(uniqueTeachers.length);

      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        Alert.alert("Error", "Failed to fetch teachers.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []); // Removed currentPage dependency - fetch all data once

  const totalPages = Math.ceil(totalSpotlightCount / ITEMS_PER_PAGE);
  
  // Calculate paginated data based on current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = allTeachers.slice(startIndex, endIndex);

  // Thanksgiving offer - COMMENTED OUT
  // const offerIndex = 4;
  // const paginatedDataWithOffer = [...paginatedData];
  // if (paginatedData.length > offerIndex) {
  //   paginatedDataWithOffer.splice(offerIndex, 0, {
  //     type: "offer",
  //     id: "offer-banner",
  //   });
  // }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity key={page} onPress={() => handlePageChange(page)} style={styles.page}>
            <View style={[styles.pageNumber, currentPage === page && styles.activePage]}>
              <Text style={styles.pageNum}>
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
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderItem = ({ item, index }) => {
    // Thanksgiving offer rendering - COMMENTED OUT
    // if (item.type === "offer") {
    //   return (
    //     <View style={[styles.offerContainer, { width: '100%' }]}>
    //       <View style={{ marginTop: 20 }}>
    //         <Text style={styles.thanksTitle}>🎉 Thanksgiving is Coming!</Text>
    //         <Text style={styles.thanksDescription}>
    //           Get up to 50% off every course. Keep learning daily and grow your
    //           skills. Don't miss it!
    //         </Text>
    //       </View>
    //     </View>
    //   );
    // }

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
              params: {
                name: item.name,
                email: item.email,
                profilePic: item.profilePic,
              },
            });
          }}
          style={styles.touchableContainer}
        >
          <Image source={{ uri: item.profilePic }} style={styles.image} />
          <Text style={styles.name} numberOfLines={1}>{item.name || "Unnamed"}</Text>
          <Text style={styles.subject} numberOfLines={1}>{item.subjectName || "Skill"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.back}>
          <BackButton size={24} color="#000" onPress={onBack} style={styles.backButton} />
          <Text style={styles.title}>Skill Spotlights</Text>
        </View>
        <Text style={styles.totalCount}>{totalSpotlightCount} Found</Text>
      </View>

      <View style={styles.content}>
        <FlatList
          data={paginatedData} // Changed from paginatedDataWithOffer to paginatedData
          numColumns={2}
          keyExtractor={(item, index) => item.id?.toString() || item.email || `item-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {totalPages > 1 && renderPagination()}
    </View>
  );
};

export default SpotLightSkillteachers;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 20, paddingBottom: hp("18%") },
  header: { flexDirection: "row", alignItems: "center", marginBottom: hp('2.15%'), justifyContent: "space-between" },
  backButton: { width: wp('12.8%'), height: wp('12.8%'), alignItems: "center", justifyContent: "center", borderRadius: wp('6.4%'), padding: wp("1.04%"), backgroundColor: "#f5f6f8" },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  title: { fontSize: wp('4.27%'), fontWeight: "600", marginLeft: wp('2.4%'), color: "#0d0c12" },
  totalCount: { fontSize: wp('3.73%'), color: "#4255ff", textAlign: "right" },
  grid: { paddingHorizontal: wp('2%'), paddingBottom: 16 },
  columnWrapper: { justifyContent: "space-between", gap: wp('2%') },
  card: { 
    backgroundColor: "#ffffff", 
    borderWidth: 1,
    borderColor: "#edeeee",
    borderRadius: wp('4%'),
    alignItems: "center", 
    paddingVertical: hp('2%'),
    marginBottom: hp('1.5%'),
    flex: 1,
    maxWidth: wp('46%'),
  },
  touchableContainer: { width: '100%', alignItems: 'center' },
  image: { width: wp('28%'), height: wp('28%'), borderRadius: wp('2%'), marginBottom: hp('1%') },
  name: { fontSize: wp('3.8%'), textAlign: "center", fontFamily: "OpenSans_400Regular", width: '90%', marginBottom: hp('0.5%') },
  subject: { fontSize: wp('3.2%'), color: 'rgba(27,27,27,0.6)', textAlign: "center", lineHeight: hp('2%'), width: '90%' },
  paginationWrapper: { 
    position: 'absolute', 
    bottom: hp('13%'),
    left: 0,
    right: 0,
    width: "100%", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: hp("2%"),
    backgroundColor: '#fff',
  },
  pagination: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: hp("1.34%"), 
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
    boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" 
  },
  pageNum: { 
    fontSize: wp("4.27%"), 
    color: "#000000ff", 
    fontFamily: 'OpenSans-SemiBold' 
  },
  activePage: { 
    color: "#000000", 
    elevation: 1 
  },
  arrowText: { 
    fontSize: wp("5%"), 
    color: "#000000", 
    fontFamily: 'OpenSans-SemiBold', 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  arrows: { 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: wp("1.33%"), 
    backgroundColor: "#ffffff", 
    marginHorizontal: wp("1.06%"), 
    elevation: 1, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" 
  },
  rightArrow: { 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: wp("1.33%"), 
    backgroundColor: "#ffffff", 
    marginHorizontal: wp("1.06%"), 
    elevation: 1, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" 
  },
  // Thanksgiving styles - kept for future use
  offerContainer: { backgroundColor: "#663259", padding: wp('4%'), justifyContent: "center", marginBottom: hp('2.69%'), width: '100%', borderRadius: wp('2%') },
  thanksTitle: { color: "#fff", fontSize: wp('4.5%'), fontWeight: "bold", marginBottom: hp('1.08%'), fontFamily: "OpenSans_300Light" },
  thanksDescription: { color: "rgba(255,255,255,0.6)", fontFamily: "OpenSans_300Light", fontSize: wp('3.1%'), lineHeight: wp('5.5%') },
});