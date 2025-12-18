import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native"; 
import axios from "axios";
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { useFonts } from "expo-font";
import { OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
const ITEMS_PER_PAGE = 6;

const skillImages = {
  dance: require("../../../assets/image/Dance.jpeg"),
  music: require("../../../assets/image/Music.jpeg"),
  arts: require("../../../assets/image/Art.jpeg"),
  cooking: require("../../../assets/image/Cooking.jpeg"),
  photography: require("../../../assets/image/Photography.jpeg"),
  workout: require("../../../assets/image/Workout.jpeg"),
};
const AllSkillsPage = ({
  onBack,
  onSkillSelect,
  category = "Skill teacher",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [skills, setSkills] = useState([]);
  const [skillTeachers, setSkillTeachers] = useState([]);

  const [fontsLoaded] = useFonts({
      'OpenSans-SemiBold': OpenSans_600SemiBold,
  });

  useEffect(() => {
    const fetchSkillsData = async () => {
      try {
        const auth = await getAuthData();
        const headers = {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        };
        console.log("Category", category);

        const res = await axios.post(
          `${BASE_URL}/api/allboards`,
          { category },
          { headers }
        );

        const fetchedSkills = res.data || [];

        const allTeachers = fetchedSkills.flatMap((skill) =>
          (skill.teachers || []).map((t) => ({
            ...t,
            skill: skill.name,
          }))
        );
        console.log("all skill teachers", allTeachers);
        setSkills(fetchedSkills);
        setSkillTeachers(allTeachers);
      } catch (err) {
        console.error("❌ Failed to fetch skills:", err.message);
      }
    };

    fetchSkillsData();
  }, [category]);

  const skillTeacherCounts = useMemo(() => {
    const counts = {};
    skillTeachers.forEach(({ skill }) => {
      const key = skill.trim().toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [skillTeachers]);

  const skillsWithDetails = useMemo(() => {
    return skills.map((skillData, index) => {
      const key = skillData.name.trim().toLowerCase();
      const count = skillTeacherCounts[key] || 0;

      return {
        ...skillData,
        id: index.toString(),
        count,
        image: skillImages[key],
      };
    });
  }, [skills, skillTeacherCounts]);

  const totalPages = Math.ceil(skillsWithDetails.length / ITEMS_PER_PAGE);

  const paginatedData = skillsWithDetails.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
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
                    <BackArrowIcon
                        width={wp("6.4%")}
                        height={wp("6.4%")}
                        color="#000"
                    />
                </TouchableOpacity>
                <Text style={styles.title}>All Skills</Text>
            </View>
            <Text style={styles.totalCount}>
                {skillsWithDetails.length} Skills Found
            </Text>
        </View>

        <View style={styles.content}>
            <FlatList
                data={paginatedData}
                numColumns={1}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => onSkillSelect(item.name, item.id)}
                        style={styles.card}
                    >
                        <Image source={item.image} style={styles.image} />
                        <View style={styles.textContent}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.countText}>
                                {item.count} teachers{item.count !== 1 ? "s" : ""}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.grid}
            />
        </View>

        {renderPagination()}
    </View>
);
};

export default AllSkillsPage;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    content: { flex: 1, paddingHorizontal: wp("4.27%"), paddingTop: hp("2.69%"), paddingBottom: hp("22%"), },
    header: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: hp("2.15%"), 
        justifyContent: "space-between", 
        paddingHorizontal: wp("4.27%"), 
        paddingTop: hp("2.69%") 
    },
    backButton: {
        width: wp("12.8%"),
        height: wp("12.8%"),
        alignItems: "center",
        justifyContent: "center",
        borderRadius: wp("6.4%"),
        padding: wp("1.04%"),
        backgroundColor: "#f5f6f8",
    },
    back: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    title: {
        fontSize: wp("4.27%"),
        fontWeight: "bold",
        marginLeft: wp("2.4%"),
        color: "#0d0c12",
    },
    totalCount: {
        fontSize: wp("3.73%"),
        color: "#4255ff",
        textAlign: "right",
    },
    grid: {
        paddingBottom: hp("2.15%"),
    },
    card: {
        width: wp("86.1%"),
        height: hp("13.45%"),
        flexDirection: "row",
        backgroundColor: "#ffffff",
        marginVertical: hp("1.08%"),
        paddingHorizontal: wp("2.13%"),
        borderRadius: wp("4.27%"),
        alignItems: "center",
        gap: wp("3.2%"),
        borderWidth: 1,
        borderColor: "#edeeee",
    },
    image: {
        width: wp("21.6%"),
        height: hp("10.497%"),
        resizeMode: "cover",
    },
    textContent: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        height: "80%",
    },
    name: {
        fontSize: wp("4.27%"),
        fontWeight: "600",
        color: "#000",
    },
    countText: {
        fontSize: wp("3.46%"),
        color: "#666",
    },
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
});
