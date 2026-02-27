import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BASE_URL } from "../../../config";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../../components/BackButton";
import { getAuthData } from "../../../utils/authStorage";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { OpenSans_400Regular, useFonts } from '@expo-google-fonts/open-sans'

const { height } = Dimensions.get("window");

export default function Checkout() {
  const { teacherEmail, selected, total, profilepic, description } = useLocalSearchParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [selectedTuitions, setSelectedTuitions] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(Number(total));

  let [fontsLoaded] = useFonts({ OpenSans_400Regular });

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const auth = await getAuthData();
        const headers = { Authorization: `Bearer ${auth?.token}`, "Content-Type": "application/json" };
        const res = await fetch(`${BASE_URL}/api/teacher`, { method: "POST", headers, body: JSON.stringify({ email: teacherEmail }) });
        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error("Failed to fetch teacher", err);
      }
    };

    fetchTeacher();
    setSelectedTuitions(JSON.parse(selected));
  }, []);

  useEffect(() => {
    const updatedTotal = selectedTuitions.reduce((acc, item) => {
      const amount = parseInt(item.charge);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);
    setSubtotal(updatedTotal);
  }, [selectedTuitions]);

  const removeTuition = (index) => {
    setSelectedTuitions((prev) => prev.filter((_, i) => i !== index));
  };

  const isTuitions = selectedTuitions.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <BackButton size={20} color="#000" onPress={() => router.back()} />
        <Text style={styles.heading}>Confirm class</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false}>
        {isTuitions && <Text style={styles.warningText}>Please select at least one class to proceed.</Text>}
        {selectedTuitions.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.leftSection}>
              <Image source={teacher?.profilepic ? { uri: teacher.profilepic } : require("../../../assets/images/Profile.png")} style={styles.image} />
              <Text style={styles.name}>{teacher?.name || "Teacher"}</Text>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.professionRow}>
                <View style={styles.subjectContainer}>
                  {item.subject && <Text style={styles.subjectText}>{item.subject}</Text>}
                  {item.class && <Text style={styles.classText}>{item.class}</Text>}
                  {item.skill && <Text style={styles.subjectText}>{item.skill}</Text>}
                </View>
                <Text style={styles.rateText}>₹{item.charge}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Text style={styles.reviewText}>Review -</Text>
                <Text style={styles.rating}> ★★★★☆</Text>
              </View>
              <View style={styles.actionsRow}>
                <Text style={styles.description} numberOfLines={3}>{teacher?.introduction || "Teacher description"}</Text>
                <TouchableOpacity onPress={() => removeTuition(index)}><Ionicons name="trash-outline" size={wp("6.4%")} color="#858585" /></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>Subtotal:</Text>
          <Text style={styles.subtotalAmount}>₹{subtotal}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => {
          const numericAmount = subtotal;
          if (!numericAmount) { alert("Invalid charge amount"); return; }
          router.push({
            pathname: "/ProceedToPayment",
            params: {
              amount: numericAmount * 100,
              teacherEmail,
              teacherName: teacher?.name || "Teacher",
              selectedTuitions: JSON.stringify(selectedTuitions),
              teacherProfilePic: teacher?.profilepic || "",
              subject: selectedTuitions.map((t) => t.subject).join(", "),
              className: selectedTuitions.map((t) => t.class).join(", "),
            },
          });
        }}>
          <Text style={styles.buttonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  topContainer: { flexDirection: "row", alignItems: "center", marginTop: hp('2.69%'), marginBottom: hp('2.69%'), gap: wp('5.33%') },
  heading: { fontSize: wp('5.86%'), fontWeight: "bold", flex: 1 },
  scrollContent: { paddingBottom: 200 },
  card: { height: hp('18.9%'), flexDirection: "row", padding: wp('2.13%'), alignItems: "flex-start", gap: hp('2.69%'), marginBottom: hp('2.69%') },
  leftSection: { alignItems: "center", justifyContent: "center", width: wp('28.8%'), height: hp('17.9%'), borderRadius: 16, borderWidth: wp('0.22%'), borderColor: "#faf5e6" },
  image: { width: wp('24.53%'), height: hp('12.38%'), borderRadius: wp('2.667%') },
  name: { fontSize: wp('3.2%'), fontWeight: "600", textAlign: "center", color: "#0d0c12" },
  rightSection: { flex: 1, marginTop: wp('5.33%') },
  professionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  subjectContainer: { flexDirection: "row", alignItems: "center", gap: wp('2%') },
  subjectText: { fontSize: wp('3.733%'), fontWeight: "700", color: "#0d0c12", lineHeight: hp('3.23%'), fontFamily: "OpenSans_400Regular" },
  classText: { fontSize: wp('3.733%'), fontWeight: "700", color: "#0d0c12", lineHeight: hp('3.23%'), fontFamily: "OpenSans_400Regular" },
  rateText: { fontSize: wp('4.2%'), fontWeight: "500", color: "#000000" },
  ratingContainer: { flexDirection: "row", alignItems: "center" },
  reviewText: { fontSize: wp('3.2%') },
  rating: { fontSize: wp('3.2%'), color: "#f1c40f" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: wp('2.3%') },
  description: { fontSize: wp('2.667%'), lineHeight: hp('2.01%'), color: "#555", marginBottom: 8 },
  bottomSection: { position: "absolute", bottom: wp('10.66%'), left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: wp('4.27%'), paddingBottom: hp('3.23%'), paddingTop: hp('1.61%') },
  subtotalContainer: { paddingVertical: hp('1.08%'), flexDirection: "row", justifyContent: "space-between", marginBottom: hp('1.345%'), paddingHorizontal: hp('1.61%') },
  subtotalLabel: { fontSize: wp('4.8%') },
  subtotalAmount: { fontSize: wp('4.8%') },
  button: { backgroundColor: "#4255ff", padding: wp('3.733%'), borderRadius: wp('2.667%'), alignItems: "center" },
  buttonText: { color: "#fff", fontSize: wp('4.27%'), fontWeight: "600" },
  warningText: { color: "#000", textAlign: "center", marginBottom: hp("1.5%"), fontSize: wp("3.5%"), fontWeight: "600" },
});