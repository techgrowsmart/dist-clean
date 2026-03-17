import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function CongratsTeacher() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [teacherName, setTeacherName] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [daysSinceJoining, setDaysSinceJoining] = useState(0);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Get data from route params
    if (params.teacherName) {
      setTeacherName(params.teacherName as string);
    }
    if (params.createdAt) {
      console.log('🔍 CongratsTeacher - createdAt param:', params.createdAt);
      const joinDate = new Date(params.createdAt as string);
      console.log('📅 CongratsTeacher - parsed joinDate:', joinDate);
      setDateOfJoining(formatDate(joinDate));
      const days = calculateDaysSince(joinDate);
      console.log('📊 CongratsTeacher - calculated days:', days);
      setDaysSinceJoining(days);
    }
  }, [params]);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const calculateDaysSince = (startDate: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Header with Back Arrow */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={wp("6.4%")} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Congratulations Text */}
        <View style={styles.congratsSection}>
          <Text style={styles.congratsText}>Congratulations,</Text>
          <Text style={styles.nameText}>Mr. {teacherName} !</Text>
          <Text style={styles.subtitleText}>
            Celebrating your dedication and passion for education .
          </Text>
        </View>

        {/* Advertisement Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../../assets/image/congratsTeacher.png")}
            style={styles.advertisementImage}
            resizeMode="contain"
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Joining</Text>
              <Text style={styles.infoValue}>{dateOfJoining}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Days since joining</Text>
              <Text style={styles.infoValueLarge}>{daysSinceJoining}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation userType="teacher" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { paddingTop: hp("6%"), paddingHorizontal: wp("5.33%"), paddingBottom: hp("2%") },
  backButton: { width: wp("10%"), height: wp("10%"), justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: wp("6.4%"), alignItems: "center" },
  congratsSection: { alignItems: "center", marginTop: hp("2%"), marginBottom: hp("3%") },
  congratsText: { fontSize: wp("6.4%"), fontFamily: "Poppins_700Bold", color: "#000", textAlign: "center", lineHeight: hp("4%") },
  nameText: { fontSize: wp("6.4%"), fontFamily: "Poppins_700Bold", color: "#000", textAlign: "center", lineHeight: hp("4%") },
  subtitleText: { fontSize: wp("3.73%"), fontFamily: "Poppins_400Regular", color: "#808080", textAlign: "center", marginTop: hp("1%"), lineHeight: hp("2.5%") },
  imageContainer: { width: wp("87.2%"), height: hp("25%"), justifyContent: "center", alignItems: "center", marginBottom: hp("4%") },
  advertisementImage: { width: "100%", height: "100%", borderRadius: wp("4%") },
  infoCard: { backgroundColor: "#dfecf3", borderRadius: wp("5.33%"), paddingVertical: hp("3%"), paddingHorizontal: wp("8%"), width: wp("87.2%") },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  divider: { width: wp("0.53%"), height: hp("8%"), backgroundColor: "#b8d8e8", marginHorizontal: wp("4%") },
  infoLabel: { fontSize: wp("3.73%"), fontFamily: "Poppins_400Regular", color: "#008bcd", marginBottom: hp("1%"), textAlign: "center", lineHeight: hp("2.2%") },
  infoValue: { fontSize: wp("4.8%"), fontFamily: "Poppins_500Medium", color: "#000", textAlign: "center", lineHeight: hp("3%") },
  infoValueLarge: { fontSize: wp("10.67%"), fontFamily: "Poppins_700Bold", color: "#000", textAlign: "center", lineHeight: hp("5.5%") },
  infoItem: { flex: 1, alignItems: "center" },
});