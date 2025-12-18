import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { isTablet } from "../../../utils/devices";
const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 4;

const MyTeacher = ({ onBack }) => {
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const auth = await getAuthData();
        if (!auth || !auth.token || !auth.email) {
          Alert.alert("Session Expired", "Please log in again.");
        } else {
          const headers = {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          };
          const userEmail=auth.email
          const type = auth.role
          const response = await axios.post(
            `${BASE_URL}/api/contacts`,{userEmail,type},
            { headers }
          );
    
          const data = response.data;
          console.log("data", data);
    
          if (data.success) {
            setAllTeachers(data.contacts || []);
          } else {
            Alert.alert("Error", "No teachers found.");
          }
        }
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        Alert.alert("Error", "Failed to fetch teachers.");
      } finally {
        setLoading(false);
      }
    };
    

    fetchTeachers();
  }, []);

  const totalPages = Math.ceil(allTeachers.length / ITEMS_PER_PAGE);
  const paginatedData = allTeachers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const offerIndex = 2;
  const paginatedDataWithOffer = [...paginatedData];
  if (paginatedData.length > offerIndex) {
    paginatedDataWithOffer.splice(offerIndex, 0, { type: "offer", id: "offer-banner" });
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => (
    <View style={styles.paginationWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pagination}>
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={styles.arrows}
        >
          <BackArrowIcon size={24} color={currentPage === 1 ? "#ccc" : "#000"} />
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
          <BackArrowIcon size={24} color={currentPage === totalPages ? "#ccc" : "#000"} />
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
            Get up to 50% off every course. Keep learning daily and grow your skills. Don’t miss it!
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
      style={styles.card}
      onPress={() => {}
        // router.push({
        //   pathname: "/(tabs)/StudentDashBoard/TeacherDetails",
        //   params: {
        //     name: item.name,
        //     email: item.email,
        //     board: item.board,
        //     teachingClass: item.teachingClass,
        //     subject: item.subject,
        //     language: item.language,
        //     profilePic: item.profilepic,
        //     charge: item.charge,
        //     description: item.description,
        //   },
        // })
      }
    >
      <View style={styles.leftSection}>
        <Image
          source={{ uri: item.teacherProfilePic?.trim().replace(/^"|"$/g, "") }}
          style={styles.image}
        />
        <Text style={styles.name}>{item.teacherName}</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.professionRow}>
          <View>
          <Text style={styles.professionText}>{item.className}</Text>
          <Text style={styles.professionTextSub}>{item.subject}</Text>
          </View>
          <Text style={styles.rateText}>{item.charge}</Text>
        </View>
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
        <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#4255FF" />
        <Text style={{ marginTop: 10 }}>Loading Teachers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
     
    <View style={styles.header}>
        <View style={styles.back}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <BackArrowIcon size={24}  color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>My Teachers</Text>
        </View>
        <Text style={styles.totalCount}>{allTeachers.length} Found</Text>
      </View>
      {/* Teacher List */}
      <FlatList
        data={paginatedDataWithOffer}
        numColumns={1}
        keyExtractor={(item, index) => `${item?.teacherEmail || "no-email"}-${index}`}
        renderItem={renderItem}
     
        contentContainerStyle={styles.list}
      />
      {renderPagination()}
  
  
    </View>
  );
  
};

export default MyTeacher;



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 120, 
      },
    
      
      header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: hp(isTablet ? '1.8%' : '2.15%'),
        justifyContent: "space-between",
      },
      backButton: { 
        width: wp(isTablet ? '10%' : '12.8%'),
        height: wp(isTablet ? '10%' : '12.8%'),
        alignItems: "center",
        justifyContent: "center",
        borderRadius: wp(isTablet ? '5%' : '6.4%'),
        padding: wp("1.04%"),
        backgroundColor: "#f5f6f8"
      },
      back: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
      },
      title: {
        fontSize: wp(isTablet ? '3.6%' : '4.27%'),
        fontWeight: "bold",
        marginLeft: wp('2.4%'), 
        color: "#0d0c12",
      },
      totalCount: {
        fontSize: wp(isTablet ? '3.2%' : '3.73%'),
        color: "#4255ff",
        textAlign: "right",
      },
    grid: {
      paddingBottom: 16,
    },
    card: {
      flexDirection: "row",
      backgroundColor: "#fff",
      borderRadius: wp("4%"),
      padding: wp("3%"),
      marginVertical: hp("1%"),
      borderWidth: 1,
      borderColor: "#edeeee",
      width: "86%",
      alignSelf: "center",
      elevation: 2,
      height:hp("18.84%"),
      alignItems:"center",
      justifyContent:"center"
    },
    leftSection: {
      width: wp(isTablet ? "25%" : "28%"),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor:"#ffffff",
      height:hp('17.9%'),
      borderWidth:1,
      borderColor:"#faf5e6",
      borderRadius:wp("4.27%"),
      boxShadow:"0px 4px 12px rgba(0,0,0,0.05)",
      boxSizing:"border-box"
    },
    image: {
      width: wp(isTablet ? "18%" : "24%"),
      height: wp(isTablet ? "18%" : "24%"),
      borderRadius: wp("4%"),
      resizeMode: "cover",
      marginBottom: hp("0.5%"),
    },
    name: {
      fontSize: wp(isTablet ? "3%" : "3.2%"),
      fontWeight: "500",
      textAlign: "center",
      color: "#242a30",
    },
    rightSection: {
      flex: 1,
      justifyContent: "space-between",
      paddingLeft: wp("2%"),
    },
    professionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hp("1%"),
    },
    professionText: {
      fontSize: wp(isTablet ? "3%" : "3.73%"),
      fontWeight: "700",
      color: "#0d0c12",
      lineHeight:hp('3.23%')
    },
    professionTextSub:{
      color:"#0d0c12",
      fontSize: wp(isTablet ? "3%" : "3.73%"),
      lineHeight:hp('1.61%')
    },
    rateText: {
      fontSize: wp(isTablet ? "2.8%" : "3.73%"),
      color: "#000000",
      fontWeight: "500",
      lineHeight:hp('2.15%')
    },
    description: {
      fontSize: wp(isTablet ? "2.8%" : "3.2%"),
      color: "#555",
      lineHeight: hp("2.5%"),
      marginBottom: hp("0.5%"),
    },
    rating: {
      fontSize: wp(isTablet ? "3%" : "3.5%"),
      color: "#f1c40f",
    },
    paginationWrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: hp(isTablet ? "2%" : "3%"),
      gap: wp(isTablet ? "2%" : "2.66%"),
      
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: hp(isTablet ? "1%" : "1.34%"),
      gap: wp(isTablet ? "4%" : "5.33%"),
    },
    page:{
      alignItems:"center",
      justifyContent:"center",
    },
    pageNumber: {
      alignItems: "center",
      justifyContent: "center",
      height: wp(isTablet ? "7%" : "8%"),
      width: wp(isTablet ? "7%" : "8%"),
      paddingHorizontal: wp("2.13%"),
      borderRadius: 5,
      backgroundColor: "#ffffff",
      marginHorizontal: 4,
      boxShadow: "0px 4px 25px rgba(0,0,0,0.25)",
    },
    pageNum:{
      fontSize: wp(isTablet ? "3.8%" : "4.27%"),
      color: "#000000",
    },
    activePage: {
      color: "#000000",
      elevation: 5,
    },
    arrows: {
      height: wp(isTablet ? "7%" : "8%"),
      width: wp(isTablet ? "7%" : "8%"),
      paddingHorizontal: wp("2.13%"),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: wp("1.33%"),
      backgroundColor: "#ffffff",
      marginHorizontal: wp("1.06%"),
      elevation: wp("1.06%"),
      boxShadow: "0px 4px 25px rgba(0,0,0,0.25)",
    },
    rightArrow: {
      height: wp(isTablet ? "7%" : "8%"),
      width: wp(isTablet ? "7%" : "8%"),
      paddingHorizontal: wp("2.13%"),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: wp("1.33%"),
      backgroundColor: "#ffffff",
      marginHorizontal: wp("1.06%"),
      transform: [{ rotate: "180deg" }],
      elevation: wp("1.06%"),
      boxShadow: "0px 4px 25px rgba(0,0,0,0.25)",
    },
    list: {
      paddingBottom: hp("5%"), 
    },
    offerContainer: {
      width: "100%",
      marginVertical: 20,
      padding: 16,
      borderRadius: 16,
      backgroundColor: "#663259",
    },
    thanksTitle: {
      color: "#fff",
      fontSize: width * 0.05,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
    },
    thanksDescription: {
      color: "#f5f5f5",
      fontSize: width * 0.038,
      lineHeight: 20,
      textAlign: "center",
    },
  });
  