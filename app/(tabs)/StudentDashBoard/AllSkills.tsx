import { OpenSans_600SemiBold } from '@expo-google-fonts/open-sans';
import axios from "axios";
import { useFonts } from "expo-font";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import BackButton from "../../../components/BackButton";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";

const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 12; // Increased for web grid

// Android Layout Component (Original)
const AndroidLayout = ({ 
  onBack, 
  onSkillSelect, 
  category,
  currentPage,
  totalPages,
  paginatedData,
  boardsWithDetails,
  handlePageChange,
  renderPagination 
}) => {
  const columns = 1; // Android always single column
  
  return (
    <View style={androidStyles.container}>
      <View style={androidStyles.header}>
        <View style={androidStyles.back}>
          <BackButton size={24} color="#000" onPress={onBack} style={androidStyles.backButton} />
          <Text style={androidStyles.title}>All Skills</Text>
        </View>
        <Text style={androidStyles.totalCount}>{boardsWithDetails.length} Skills Found</Text>
      </View>

      <FlatList
        data={paginatedData}
        numColumns={columns}
        columnWrapperStyle={{ justifyContent: "center", gap: 20 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSkillSelect(item.boardName, item.boardId)}
            style={androidStyles.card}
          >
            <Image source={item.image} style={androidStyles.image} />
            <View style={androidStyles.textContent}>
              <Text style={androidStyles.name}>{item.board}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={androidStyles.grid}
        style={{ flex: 1 }}
      />

      {renderPagination()}
    </View>
  );
};

// Web Layout Component (New Uizard Design)
const WebLayout = ({ 
  onBack, 
  onSkillSelect, 
  category,
  currentPage,
  totalPages,
  paginatedData,
  boardsWithDetails,
  handlePageChange,
  renderPagination 
}) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenWidth(result.window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);
  
  const shouldHideRightPanel = screenWidth < 1200;
  const shouldCollapseSidebar = screenWidth < 900;
  
  // Board grid responsiveness
  const getBoardCardWidth = () => {
    if (screenWidth < 700) return "45%";
    if (screenWidth < 1000) return "30%";
    return "22%";
  };
  
  // Logo responsiveness
  const getLogoFontSize = () => {
    if (screenWidth < 600) return 20;
    return 24;
  };
  
  return (
    <View style={webStyles.page}>
      {/* TOP HEADER */}
      <View style={webStyles.header}>
        <View style={webStyles.headerLeft}>
          <Text style={[webStyles.logoText, { fontSize: getLogoFontSize() }]}>Growsmart</Text>
        </View>
        
        <View style={webStyles.headerCenter}>
          <View style={webStyles.searchBar}>
            <Text style={webStyles.searchPlaceholder}>Type in search</Text>
          </View>
        </View>
        
        <View style={webStyles.headerRight}>
          <TouchableOpacity style={webStyles.notificationIcon}>
            <Text style={webStyles.notificationBell}>🔔</Text>
          </TouchableOpacity>
          <View style={webStyles.avatarPlaceholder} />
          <Text style={webStyles.userName}>Ben Goro</Text>
        </View>
      </View>

      <View style={webStyles.contentArea}>
        {/* LEFT SIDEBAR */}
        <View style={[
          webStyles.sidebar,
          shouldCollapseSidebar && webStyles.sidebarCollapsed
        ]}>
          <ScrollView
            style={webStyles.sidebarScroll}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={webStyles.sidebarMenu}>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "🏠" : "Home"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "👤" : "Profile"}</Text>
              </TouchableOpacity>
              
              <View style={webStyles.divider} />
              
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "⭐" : "Favorites"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "📚" : "My Tuitions"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "🔗" : "Connect"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "📤" : "Share"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "💳" : "Subscription"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "💰" : "Billing"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "❓" : "FAQ"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "📄" : "Terms & Conditions"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "🔒" : "Privacy Policy"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "📞" : "Contact Us"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "⚠️" : "Raise a Complaint"}</Text>
              </TouchableOpacity>
            </View>
            
            {/* ADVERTISING CARD */}
            {!shouldCollapseSidebar && (
              <View style={webStyles.adCard}>
                <View style={webStyles.imagePlaceholder} />
                <Text style={webStyles.adTitle}>Summer sale is on!</Text>
                <Text style={webStyles.adDescription}>
                  Buy your loved pieces with reduced prices up to 70% off.
                </Text>
              </View>
            )}
            
            <View style={webStyles.sidebarBottom}>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "💬" : "Help & Support"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.menuItem}>
                <Text style={webStyles.menuText}>{shouldCollapseSidebar ? "🚪" : "Log out"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* CENTER CONTENT */}
        <ScrollView
  style={webStyles.mainContent}
  contentContainerStyle={{ paddingBottom: 80 }}
  showsVerticalScrollIndicator={false}
>
          {/* TITLE ROW */}
          <View style={webStyles.titleRow}>
            <TouchableOpacity style={webStyles.backArrow} onPress={onBack}>
              <Text style={webStyles.backArrowText}>←</Text>
            </TouchableOpacity>
            <Text style={webStyles.pageTitle}>All Skills</Text>
          </View>

          {/* BANNER CARD */}
          <View style={webStyles.bannerCard}>
            <View style={webStyles.bannerPlaceholder} />
            <View style={webStyles.bannerOverlay}>
              <Text style={webStyles.bannerText}>
                Upgrade your Skills
                {"\n"}Conquer world
              </Text>
            </View>
          </View>

          {/* SKILLS GRID */}
          <View style={webStyles.boardsGrid}>
            {["Dance", "Guitar", "Photography", "Cooking", "Singing", "Coding", "Handcraft", "Painting", "Yoga", "Video Editing", "Content Writing", "CAD/CAM"].map((skill, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onSkillSelect(skill, index.toString())}
                style={[webStyles.skillCard, { width: getBoardCardWidth() }]}
              >
                <View style={webStyles.skillImagePlaceholder} />
                <View style={webStyles.skillOverlay}>
                   <Text style={webStyles.skillText}>{skill}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* PAGINATION */}
          <View style={webStyles.paginationContainer}>
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={webStyles.paginationArrow}
            >
              <Text style={webStyles.paginationText}>{'<'}</Text>
            </TouchableOpacity>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <TouchableOpacity
                key={page}
                onPress={() => handlePageChange(page)}
                style={[
                  webStyles.paginationNumber,
                  currentPage === page && webStyles.activePagination
                ]}
              >
                <Text style={[
                  webStyles.paginationText,
                  currentPage === page && webStyles.activePaginationText
                ]}>{page}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={webStyles.paginationArrow}
            >
              <Text style={webStyles.paginationText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* RIGHT PANEL */}
        {!shouldHideRightPanel && (
          <View style={webStyles.rightPanel}>
            <Text style={webStyles.panelTitle}>Thoughts</Text>
            
            <ScrollView style={webStyles.thoughtsContainer}>
              {/* THOUGHT CARD 1 */}
              <View style={webStyles.thoughtCard}>
                <View style={webStyles.thoughtHeader}>
                  <View style={webStyles.avatarPlaceholder} />
                  <View>
                    <Text style={webStyles.thoughtAuthor}>Robert Hammond | Mathematics</Text>
                    <Text style={webStyles.thoughtTime}>20 min ago</Text>
                  </View>
                </View>
                <Text style={webStyles.thoughtText}>
                  Just discovered an amazing way to teach calculus using real-world examples. Students are finally getting it!
                </Text>
                <View style={webStyles.thoughtImages}>
                  <View style={webStyles.thoughtImagePlaceholder} />
                  <View style={webStyles.thoughtImagePlaceholder} />
                </View>
                <View style={webStyles.thoughtActions}>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Like</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Thoughts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* THOUGHT CARD 2 */}
              <View style={webStyles.thoughtCard}>
                <View style={webStyles.thoughtHeader}>
                  <View style={webStyles.avatarPlaceholder} />
                  <View>
                    <Text style={webStyles.thoughtAuthor}>Sarah Chen | Physics</Text>
                    <Text style={webStyles.thoughtTime}>45 min ago</Text>
                  </View>
                </View>
                <Text style={webStyles.thoughtText}>
                  Today's lab experiment was a huge success! Students loved the hands-on approach to quantum mechanics.
                </Text>
                <View style={webStyles.thoughtImages}>
                  <View style={webStyles.thoughtImagePlaceholder} />
                </View>
                <View style={webStyles.thoughtActions}>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Like</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Thoughts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={webStyles.actionButton}>
                    <Text style={webStyles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* THOUGHT CARD 3 */}
<View style={webStyles.thoughtCard}>
  <View style={webStyles.thoughtHeader}>
    <View style={webStyles.avatarPlaceholder} />
    <View>
      <Text style={webStyles.thoughtAuthor}>Daniel Moore | Chemistry</Text>
      <Text style={webStyles.thoughtTime}>1 hour ago</Text>
    </View>
  </View>

  <Text style={webStyles.thoughtText}>
    Students enjoyed today's practical experiment on chemical bonding.
  </Text>

  <View style={webStyles.thoughtImages}>
    <View style={webStyles.thoughtImagePlaceholder} />
  </View>

  <View style={webStyles.thoughtActions}>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Like</Text>
    </TouchableOpacity>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Thoughts</Text>
    </TouchableOpacity>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Share</Text>
    </TouchableOpacity>
  </View>
</View>


{/* THOUGHT CARD 4 */}
<View style={webStyles.thoughtCard}>
  <View style={webStyles.thoughtHeader}>
    <View style={webStyles.avatarPlaceholder} />
    <View>
      <Text style={webStyles.thoughtAuthor}>Emily Watson | Biology</Text>
      <Text style={webStyles.thoughtTime}>2 hours ago</Text>
    </View>
  </View>

  <Text style={webStyles.thoughtText}>
    Interactive diagrams helped students understand the human circulatory system better.
  </Text>

  <View style={webStyles.thoughtImages}>
    <View style={webStyles.thoughtImagePlaceholder} />
    <View style={webStyles.thoughtImagePlaceholder} />
  </View>

  <View style={webStyles.thoughtActions}>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Like</Text>
    </TouchableOpacity>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Thoughts</Text>
    </TouchableOpacity>
    <TouchableOpacity style={webStyles.actionButton}>
      <Text style={webStyles.actionText}>Share</Text>
    </TouchableOpacity>
  </View>
</View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const AllSkills = ({ onBack, onSkillSelect , category = "Subject teacher"}: {
  onBack: () => void;
  onSkillSelect: (skillName: string, skillId: string) => void;
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
            { board: "WBBSE", boardname: "West Bengal Board of Secondary Education" },
            { board: "NIOS", boardname: "National Institute of Open Schooling" },
            { board: "WBCHSE", boardname: "West Bengal Council of Higher Secondary Education" },
            { board: "KVS", boardname: "Kendriya Vidyalaya Sangathan" },
            { board: "NVS", boardname: "Navodaya Vidyalaya Samiti" },
            { board: "MSBSHSE", boardname: "Maharashtra State Board of Secondary and Higher Secondary Education" },
            { board: "TNSB", boardname: "Tamil Nadu State Board" },
            { board: "UPMSP", boardname: "Uttar Pradesh Madhyamik Shiksha Parishad" },
            { board: "RBSE", boardname: "Rajasthan Board of Secondary Education" },
            { board: "PSEB", boardname: "Punjab School Education Board" }
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
          { board: "WBBSE", boardname: "West Bengal Board of Secondary Education" },
          { board: "NIOS", boardname: "National Institute of Open Schooling" },
          { board: "WBCHSE", boardname: "West Bengal Council of Higher Secondary Education" },
          { board: "KVS", boardname: "Kendriya Vidyalaya Sangathan" },
          { board: "NVS", boardname: "Navodaya Vidyalaya Samiti" },
          { board: "MSBSHSE", boardname: "Maharashtra State Board of Secondary and Higher Secondary Education" },
          { board: "TNSB", boardname: "Tamil Nadu State Board" },
          { board: "UPMSP", boardname: "Uttar Pradesh Madhyamik Shiksha Parishad" },
          { board: "RBSE", boardname: "Rajasthan Board of Secondary Education" },
          { board: "PSEB", boardname: "Punjab School Education Board" }
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
  
  const totalPages = 3;

  const paginatedData = boardsWithDetails;

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

  if (!fontsLoaded) return <Text>Loading...</Text>;

  // Conditional rendering based on platform
  if (Platform.OS === "web") {
    return (
      <WebLayout 
        onBack={onBack}
        onSkillSelect={onSkillSelect}
        category={category}
        currentPage={currentPage}
        totalPages={totalPages}
        paginatedData={paginatedData}
        boardsWithDetails={boardsWithDetails}
        handlePageChange={handlePageChange}
        renderPagination={renderPagination}
      />
    );
  }

  return (
    <AndroidLayout 
      onBack={onBack}
      onSkillSelect={onSkillSelect}
      category={category}
      currentPage={currentPage}
      totalPages={totalPages}
      paginatedData={paginatedData}
      boardsWithDetails={boardsWithDetails}
      handlePageChange={handlePageChange}
      renderPagination={renderPagination}
    />
  );
};

export default AllSkills;

// Android Styles (Original)
const androidStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: wp('4.27%'), paddingTop: hp('2.69%'), paddingBottom: 0 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: hp('2.15%'), justifyContent: "space-between" },
  backButton: { width: wp('12.8%'), height: wp('12.8%'), alignItems: "center", justifyContent: "center", borderRadius: wp('6.4%'), padding: wp("1.04%"), backgroundColor: "#f5f6f8" },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  title: { fontSize: wp('4.27%'), fontWeight: "bold", marginLeft: wp('2.4%'), color: "#0d0c12" },
  totalCount: { fontSize: wp('3.73%'), color: "#4255ff", textAlign: "right" },
  grid: {
    paddingBottom: hp("2.15%"),
    alignItems: "stretch",
  },
  card: {
    width: wp("86.1%"),
    height: hp("13.45%"),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginVertical: hp("1.08%"),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#edeeee",
  },
  image: {
    width: wp("21.6%"),
    height: hp("10.497%"),
    resizeMode: "contain",
  },
  textContent: { flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "flex-start", height: "75%" },
  name: {
    fontSize: wp("3.733%"),
    fontWeight: "600",
    color: "#0d0c12",
  },
  countText: { fontSize: wp("3.46%"), color: "#666" },
  paginationWrapper: { width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: hp("15%"), gap: wp("2.66%"), overflow: 'visible' },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp("1.34%"), gap: wp("2%"), overflow: 'visible' },
  page: { alignItems: "center", justifyContent: "center", overflow: 'visible' },
  pageNumber: { alignItems: "center", justifyContent: "center", height: wp("8%"), width: wp("8%"), paddingHorizontal: wp("2.13%"), borderRadius: 5, backgroundColor: "#ffffff", marginHorizontal: 0 },
  pageNum: { fontSize: wp("4.27%"), color: "#000000ff", fontFamily: 'OpenSans-SemiBold' },
  activePage: { color: "#000000", elevation: 1 },
  arrowText: { fontSize: wp("5%"), color: "#000000", fontFamily: 'OpenSans-SemiBold', textAlign: 'center', fontWeight: '600' },
  arrows: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1 },
  rightArrow: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1 },
});

// Web Styles (New Uizard Design)
const webStyles = StyleSheet.create({
  // PAGE LAYOUT
  page: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#f5f5f5"
  },
  
  // TOP HEADER
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
    zIndex: 1000
  },
  headerLeft: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  searchBar: {
    width: "100%",
    height: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#6c757d",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  notificationIcon: {
    padding: 8,
  },
  notificationBell: {
    fontSize: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb"
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  
  // CONTENT AREA
  contentArea: {
    flex: 1,
    flexDirection: "row",
    marginTop: 72
  },
  
  // LEFT SIDEBAR
  sidebar: {
    width: 240,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarMenu: {
    padding: 20,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuText: {
    fontSize: 14,
    color: "#495057",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 16,
  },
  adCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  adImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#e5e7eb",
    borderRadius: 8
  },
  adTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 16,
  },
  sidebarBottom: {
    marginTop: "auto",
    padding: 20,
  },
  
  // CENTER CONTENT
  mainContent: {
    flex: 1,
    paddingHorizontal: 24
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backArrowText: {
    fontSize: 18,
    color: "#000000",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  bannerCard: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#e5e7eb"
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  bannerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 28,
  },
  boardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "flex-start"
  },
  boardCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
    aspectRatio: 1
  },
  boardLogo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  boardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  // SKILL CARD STYLES
  skillCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
    aspectRatio: 1,
    position: "relative",
  },
  skillImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
  },
  skillOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  skillText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  paginationArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  activePagination: {
    backgroundColor: "#007bff",
  },
  activePaginationText: {
    color: "#ffffff",
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  
  // RIGHT PANEL
  rightPanel: {
    width: 340,
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderLeftColor: "#e9ecef",
    padding: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  thoughtsContainer: {
    flex: 1,
  },
  thoughtCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  thoughtHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  thoughtAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  thoughtImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb"
  },
  thoughtAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  thoughtTime: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  thoughtText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    marginBottom: 12,
  },
  thoughtImages: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  thoughtImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  thoughtActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
  },
  actionText: {
    fontSize: 12,
    color: "#495057",
  },
});

// Shared styles for pagination
const styles = StyleSheet.create({
  paginationWrapper: { width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: hp("15%"), gap: wp("2.66%"), overflow: 'visible' },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: hp("1.34%"), gap: wp("2%"), overflow: 'visible' },
  page: { alignItems: "center", justifyContent: "center", overflow: 'visible' },
  pageNumber: { alignItems: "center", justifyContent: "center", height: wp("8%"), width: wp("8%"), paddingHorizontal: wp("2.13%"), borderRadius: 5, backgroundColor: "#ffffff", marginHorizontal: 0 },
  pageNum: { fontSize: wp("4.27%"), color: "#000000ff", fontFamily: 'OpenSans-SemiBold' },
  activePage: { color: "#000000", elevation: 1 },
  arrowText: { fontSize: wp("5%"), color: "#000000", fontFamily: 'OpenSans-SemiBold', textAlign: 'center', fontWeight: '600' },
  arrows: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1 },
  rightArrow: { height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", borderRadius: wp("1.33%"), backgroundColor: "#ffffff", marginHorizontal: wp("1.06%"), elevation: 1 },
});