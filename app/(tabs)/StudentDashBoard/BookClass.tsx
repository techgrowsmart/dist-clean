import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomNavigation from "../../../app/(tabs)/BottomNavigation";
import axios from "axios";
import Checkbox from "expo-checkbox";
import { BASE_URL } from "../../../config";
import { Dimensions } from "react-native";
import DangerousIcon from "../../../assets/svgIcons/Dangerous";
import BulbIcon from "../../../assets/svgIcons/BulbIcon";
import { getAuthData } from "../../../utils/authStorage";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import Entypo from "@expo/vector-icons/Entypo";
import { Ionicons } from "@expo/vector-icons";
import CustomCheckbox from "../../../components/CustomCheckbox";

const { width, height } = Dimensions.get("window");

export default function BookClass() {
  const router = useRouter();
  const { teacherEmail, selectedSubject, selectedClass, teacherProfilePic, description } = useLocalSearchParams();
  const [tuitions, setTuitions] = useState<any[]>([]);
  const [selectedTuitions, setSelectedTuitions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchTuitions = async () => {
      try {
        const auth = await getAuthData();
        const headers = { Authorization: `Bearer ${auth?.token}`, "Content-Type": "application/json" };
        
        const res = await axios.post(`${BASE_URL}/api/teacher`, { email: teacherEmail }, { headers });
        const data = res.data?.tuitions || [];
        setTuitions(data);
        setSelectedTuitions([]);
      } catch (err) {
        console.error("Error fetching teacher tuitions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTuitions();
  }, [teacherEmail]);

  const toggleSelection = (key: string) => {
    setSelectedTuitions((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const toggleDaysExpansion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleProceedToPayment = () => {
    const selectedDetails = tuitions.filter((t) => {
      const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
      return selectedTuitions.includes(key);
    });
  
    const totalCharge = selectedDetails.reduce((acc, t) => {
      const chargeStr = typeof t.charge === "string" ? t.charge : "";
      const numericCharge = parseInt(chargeStr);
      return acc + (isNaN(numericCharge) ? 0 : numericCharge);
    }, 0);
  
    router.push({
      pathname: "/(tabs)/StudentDashBoard/Checkout",
      params: { teacherEmail, selected: JSON.stringify(selectedDetails), total: totalCharge, profilepic: teacherProfilePic, description },
    });
  };

  const isCheckoutEmpty = selectedTuitions.length === 0;

  if (loading) return <Text style={styles.title}>Loading tuitions...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.titleContent}>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>Confirm Your Class :</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={wp("10%")} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.lableContainer}>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Study now, pay later</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Best Teachers from anywhere</Text></View>
          <View style={styles.label}><BulbIcon color="#FFF" /><Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit>Get the best classes</Text></View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tuitions.map((t, index) => {
          const key = t.skill ? t.skill : `${t.subject}-${t.class}`;
          const daysArray = t.day ? t.day.split(",").map((day: string) => day.trim()) : [];
          const firstDay = daysArray[0] || "";
          const hasMultipleDays = daysArray.length > 1;
          const isExpanded = expandedIndex === index;
          
          return (
            <View key={index} style={styles.tuitionItem}>
              <View style={styles.checkboxContainer}>
                {/* Left Section - Day & Time (33% width) */}
                <View style={styles.leftSection}>
                  <View style={styles.dayTimeContainer}>
                    <View style={styles.dayRow}>
                      {hasMultipleDays && (
                        <TouchableOpacity onPress={() => toggleDaysExpansion(index)} style={styles.chevronButton}>
                          <Entypo 
                            name={isExpanded ? "chevron-down" : "chevron-right"} 
                            size={wp("4%")} 
                            color="#000" 
                          />
                        </TouchableOpacity>
                      )}
                      <Text 
                        style={styles.day} 
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {firstDay}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timing} numberOfLines={1} adjustsFontSizeToFit>{t.timeFrom}</Text>
                      <Text style={styles.timing} numberOfLines={1} adjustsFontSizeToFit>{t.timeTo}</Text>
                    </View>
                  </View>
                </View>

                {/* Vertical Divider */}
                <View style={styles.separator} />

                {/* Right Section - Subject & Checkbox (67% width) */}
                <View style={styles.rightSection}>
                  <View style={styles.subjectContainer}>
                    {t.skill ? (
                      <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.skill}</Text>
                    ) : (
                      <>
                        <Text style={styles.subject} numberOfLines={1} adjustsFontSizeToFit>{t.subject}</Text>
                        <Text style={styles.className} numberOfLines={1} adjustsFontSizeToFit>{t.class}</Text>
                      </>
                    )}
                  </View>
                    <CustomCheckbox 
                      value={selectedTuitions.includes(key)} 
                      onValueChange={() => toggleSelection(key)} 
                      size={wp("5.66%") * 1.5}
                    />
                </View>
              </View>

              {/* Dropdown for additional days */}
              {isExpanded && hasMultipleDays && (
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownContent}>
                    {daysArray.map((day, dayIndex) => (
                      <View key={dayIndex} style={styles.dayItem}>
                        <View style={styles.dayDot} />
                        <Text style={styles.dayText} numberOfLines={1} adjustsFontSizeToFit>{day}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      
      {isCheckoutEmpty && <Text style={styles.warningText}>Please select at least one class to proceed.</Text>}

      <TouchableOpacity style={[styles.button, isCheckoutEmpty && { opacity: 0.5 }]} onPress={handleProceedToPayment} disabled={isCheckoutEmpty}>
        <Text style={styles.buttonText}>Confirm Class</Text>
      </TouchableOpacity>

      <BottomNavigation userType="student" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topContainer: { height: hp("33.243%"), backgroundColor: "#5f5fff", borderBottomLeftRadius: wp("8.53%"), borderBottomRightRadius: wp("8.53%"), paddingHorizontal: wp("5.33%"), paddingTop: hp("4.31%"), paddingBottom: hp("3.23%") },
  content: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: hp("25%") },
  titleContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: wp("8.266%"), fontWeight: "700", lineHeight: hp("6.325%"), color: "#fff", width: width * 0.7, flexShrink: 1 },
  label: { flexDirection: "row", alignItems: "center", gap: wp("2.933%"), flexShrink: 1 },
  text: { fontSize: wp("4%"), lineHeight: hp("2.96%"), color: "#fff", fontWeight: "700", marginTop: hp("1.08%"), flexShrink: 1 },
  lableContainer: { padding: 10, borderRadius: 12, flexDirection: "column", alignItems: "flex-start", gap: 6 },
  tuitionItem: { alignItems: "center", justifyContent: "center", marginTop: hp("1.95%") },
  checkboxContainer: { width: wp("82.4%"), height: hp("11.843%"), flexDirection: "row", alignItems: "center", borderWidth: wp("0.22%"), borderColor: "#71d561", padding: wp("4.27%"), borderRadius: wp("5.86%") },
  leftSection: { width: "33%", paddingRight: wp("2%"), flexShrink: 1 },
  dayTimeContainer: { flex: 1, justifyContent: "center", flexShrink: 1 },
  dayRow: { flexDirection: "row", alignItems: "center", marginBottom: hp("0.8%"), flexShrink: 1 },
  chevronButton: { marginRight: wp("1%") },
  day: { fontWeight: "600", fontSize: wp("2.93%"), lineHeight: hp("1.884%"), color: "#000000", flexShrink: 1, flex: 1 },
  timeContainer: { marginLeft: wp("4%"), flexShrink: 1 },
  timing: { fontSize: wp("3.2%"), color: "#000000", lineHeight: hp("2.2%"), flexShrink: 1 },
  separator: { width: wp("0.44%"), backgroundColor: "#ccc", height: "130%", marginHorizontal: wp("2%") },
  rightSection: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingLeft: wp("2%"), flexShrink: 1 },
  subjectContainer: { flex: 1, flexShrink: 1 },
  subject: { fontWeight: "600", fontSize: wp("3.733%"), marginBottom: hp("0.5%"), flexShrink: 1 },
  className: { fontSize: wp("3.2%"), color: "#555", lineHeight: hp("2.15%"), flexShrink: 1 },
  checkbox: { transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }], height: wp("5.66%"), width: wp("5.66%") },
  dropdownContainer: { width: wp("82.4%"), marginTop: hp("0.5%"), backgroundColor: "#f8f9fa", borderRadius: wp("2%"), borderWidth: wp("0.22%"), borderColor: "#71d561", padding: wp("3%") },
  dropdownContent: { flexDirection: "column", gap: hp("1%") },
  dayItem: { flexDirection: "row", alignItems: "center", gap: wp("2%") },
  dayDot: { width: wp("1.5%"), height: wp("1.5%"), borderRadius: wp("0.75%"), backgroundColor: "#71d561" },
  dayText: { fontSize: wp("3%"), color: "#000", fontWeight: "500", flexShrink: 1 },
  button: { position: "absolute", bottom: hp("18%"), left: wp("6.933%"), right: wp("6.933%"), height: hp("7.533%"), backgroundColor: "#5f5fff", borderRadius: 22, alignItems: "center", justifyContent: "center", elevation: 5 },
  buttonText: { color: "#fff", fontSize: wp("4.27%"), fontWeight: "600" },
  warningText: { color: "#000", textAlign: "center", marginBottom: hp("1.5%"), fontSize: wp("3.5%"), fontWeight: "600" },
});