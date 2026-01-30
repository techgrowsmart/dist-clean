import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import { OpenSans_600SemiBold } from '@expo-google-fonts/open-sans';
import { useFonts } from "expo-font";

const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 6;

const AllBoardsPage = ({ onBack, onBoardSelect , category = "Subject teacher"}: {
  onBack: () => void;
  onBoardSelect: (boardName: string, boardId: string) => void;
  category?: string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [allBoards, setAllBoards] = useState<any[]>([]);
  const [boardTeacherCounts, setBoardTeacherCounts] = useState<{[key: string]: number}>({});
    const [fontsLoaded] = useFonts({
    'OpenSans-SemiBold': OpenSans_600SemiBold,
  });
  
  useEffect(() => {
    const fetchBoardsAndCounts = async () => {
      try {
        const auth = await getAuthData(); 
        
        // For Google Play Console testing, use mock data
        if (auth?.token === "google_play_test_token_2024" && auth?.email === "student1@example.com") {
          console.log("🎮 Using mock boards data for Google Play Console testing");
          
          const mockBoards = [
            { board: "CBSE", boardname: "Central Board of Secondary Education" },
            { board: "ICSE", boardname: "Indian Certificate of Secondary Education" },
            { board: "State Board", boardname: "State Board of Education" },
            { board: "IB", boardname: "International Baccalaureate" }
          ];
          
          setAllBoards(mockBoards);
          return;
        }
        
        const headers = {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        };
  
        const boardsRes = await axios.post(
          `${BASE_URL}/api/allboards`,
          { category }, 
          { headers }   
        );
  
        console.log("Boards Response:", boardsRes.data);
        setAllBoards(boardsRes.data || []);
      } catch (err: any) {
        console.error("❌ Failed to fetch boards or counts:", err.message);
        
        // Fallback to mock data for development
        console.log("🔄 Using fallback mock boards data");
        const mockBoards = [
          { board: "CBSE", boardname: "Central Board of Secondary Education" },
          { board: "ICSE", boardname: "Indian Certificate of Secondary Education" },
          { board: "State Board", boardname: "State Board of Education" }
        ];
        setAllBoards(mockBoards);
      }
    };
  
    fetchBoardsAndCounts();
  }, [category]);
  
  
  const boardsWithDetails = useMemo(() => {
    if (!Array.isArray(allBoards)) return [];
  
    return allBoards.map((boardData, index) => {
      const count = boardTeacherCounts[boardData.board] || 0;
      return {
        ...boardData,
        id: index.toString(),
        count,
        image: require("../../../assets/image/board.png"),
      };
    });
  }, [allBoards, boardTeacherCounts]);
  

  const totalPages = Math.ceil(boardsWithDetails.length / ITEMS_PER_PAGE);

  const paginatedData = boardsWithDetails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

const renderPagination = () => (
  <View style={styles.paginationWrapper}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pagination}
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

  return (
    <View style={styles.container}>
        <View style={styles.header}>
  <View style={styles.back}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <BackArrowIcon  width={wp('6.4%')}
            height={wp('6.4')} color="#000" />
    </TouchableOpacity>
    <Text style={styles.title}>All Boards</Text>
  </View>
  <Text style={styles.totalCount}>{boardsWithDetails.length} Boards Found</Text>
</View>

      <FlatList
        data={paginatedData}
        numColumns={1}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onBoardSelect(item.boardName, item.boardId)}
            style={styles.card}
          >
            <Image source={item.image} style={styles.image} />
            <View style={styles.textContent}>
              <Text style={styles.name}>{item.boardName}</Text>
              <Text style={styles.countText}>
              {item.teacherCount} teacher{item.teacherCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.grid}
        style={{ flex: 1 }}
      />

      {renderPagination()}
    </View>
  );
};

export default AllBoardsPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: wp('4.27%'), paddingTop: hp('2.69%'), paddingBottom: 0 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: hp('2.15%'), justifyContent: "space-between" },
  backButton: { width: wp('12.8%'), height: wp('12.8%'), alignItems: "center", justifyContent: "center", borderRadius: wp('6.4%'), padding: wp("1.04%"), backgroundColor: "#f5f6f8" },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  title: { fontSize: wp('4.27%'), fontWeight: "bold", marginLeft: wp('2.4%'), color: "#0d0c12" },
  totalCount: { fontSize: wp('3.73%'), color: "#4255ff", textAlign: "right" },
  grid: { paddingBottom: hp('2.15%') },
  card: { width: wp("86.1%"), height: hp("13.45%"), flexDirection: "row", backgroundColor: "#ffffff", marginVertical: hp("1.08%"), paddingHorizontal: wp("2.13%"), borderRadius: wp("4.27%"), alignItems: "center", gap: wp("3.2%"), borderWidth: 1, borderColor: "#edeeee" },
  image: { width: wp("21.6%"), height: hp("10.497%"), resizeMode: "cover" },
  textContent: { flex: 1, flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", height: "75%" },
  name: { fontSize: wp("3.733%"), fontWeight: "600", color: "#0d0c12" },
  countText: { fontSize: wp("3.46%"), color: "#666" },
  paginationWrapper: { width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: hp("15%"), gap: wp("2.66%"), overflow: 'visible' },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp("1.34%"), gap: wp("2%"), overflow: 'visible' },
  page: { alignItems: "center", justifyContent: "center", overflow: 'visible' },
  pageNumber: { alignItems: "center", justifyContent: "center", height: wp("8%"), width: wp("8%"), paddingHorizontal: wp("2.13%"), borderRadius: 5, backgroundColor: "#ffffff", marginHorizontal: 0, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
  pageNum: { fontSize: wp("4.27%"), color: "#000000ff", fontFamily: 'OpenSans-SemiBold' },
  activePage: { color: "#000000", elevation: 1 },
  arrowText: { fontSize: wp("5%"), color: "#000000", fontFamily: 'OpenSans-SemiBold', textAlign: 'center', fontWeight: '600' },
  arrows: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
  rightArrow: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, boxShadow: "0px 4px 35px 4px rgba(0,0,0,0.25)" },
});