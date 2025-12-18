import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { isTablet } from "../../../utils/devices";
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const SpotlightTarrif = () => {
  const [selectedType, setSelectedType] = useState<"skill" | "subject">(
    "skill"
  );
  const [selectedState, setSelectedState] = useState("West Bengal - WB");
  const [selectedHotspot, setSelectedHotspot] = useState("Skill Teacher");
  const [selectedPlan, setSelectedPlan] = useState(
    "1-day spotlight plan at ₹60"
  );
  const navigation = useNavigation();

  const spotlightPlans = {
    "1-day spotlight plan at ₹60": { amount: 60, gst: 60 * 0.18 },
    "7-day spotlight plan at ₹175": { amount: 175, gst: 175 * 0.18 },
    "30-day spotlight plan at ₹350": { amount: 350, gst: 350 * 0.18 },
  };

  const selectedPricing = spotlightPlans[selectedPlan] || { amount: 0, gst: 0 };
  const total = selectedPricing.amount + selectedPricing.gst;

  const skillData = [
    { state: "Delhi", students: 1000 },
    { state: "TN", students: 2000 },
    { state: "MH", students: 1500 },
    { state: "KA", students: 2500 },
    { state: "RJ", students: 1800 },
  ];

  const subjectData = [
    { state: "Delhi", students: 1200 },
    { state: "TN", students: 1600 },
    { state: "MH", students: 2200 },
    { state: "KA", students: 1800 },
    { state: "RJ", students: 2000 },
  ];

  const maxStudents = 3000;
  const chartData = selectedType === "skill" ? skillData : subjectData;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackArrowIcon
            color="#FFF"
            width={wp(isTablet ? "4.1%" : "6.4%")}
            height={wp(isTablet ? "4.1%" : "6.4%")}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spotlight Tariff</Text>
      </View>

      {/* Info Section */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Spotlight Information</Text>
        <Text style={styles.label}>Select Location</Text>
        <View style={styles.searchContainer}>
          <Image
            source={require("../../../assets/images/Search.png")}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search your area"
            placeholderTextColor="#aaa"
            style={styles.input}
          />
        </View>
        <Text style={styles.helperText}>
          Select the locations or areas where you'd like to enhance your
          visibility in Spotlight.
        </Text>
      </View>

      {/* Type Selector */}
      <View style={styles.typeToggleContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "skill" && styles.activeTypeButton,
          ]}
          onPress={() => setSelectedType("skill")}
        >
          <Text
            style={
              selectedType === "skill" ? styles.activeTypeText : styles.typeText
            }
          >
            For Skill Teacher
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "subject" && styles.activeTypeButton,
          ]}
          onPress={() => setSelectedType("subject")}
        >
          <Text
            style={
              selectedType === "subject"
                ? styles.activeTypeText
                : styles.typeText
            }
          >
            For Subject Teacher
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bar Chart */}
      <View style={styles.graphWrapper}>
        {chartData.map((item, idx) => {
          const barHeight = (item.students / maxStudents) * 142;
          return (
            <View key={idx} style={styles.barItem}>
              <Text style={styles.topLabel}>
                {Math.round(item.students / 1000)}k
              </Text>
              <View style={styles.bar}>
                <View style={[styles.filledBar, { height: barHeight }]} />
              </View>
              <Text style={styles.bottomLabel}>{item.state}</Text>
            </View>
          );
        })}
      </View>

      {/* Pickers */}
      <View style={styles.section}>
        <Text style={styles.label}>State and Union Territory</Text>
        <Picker
          style={styles.picker}
          selectedValue={selectedState}
          onValueChange={(itemValue) => setSelectedState(itemValue)}
        >
          <Picker.Item
            style={styles.pickerLabel}
            label="West Bengal - WB"
            value="West Bengal - WB"
          />
          <Picker.Item
            style={styles.pickerLabel}
            label="Telangana - TG"
            value="Telangana - TG"
          />
          <Picker.Item
            style={styles.pickerLabel}
            label="Andhra Pradesh - AP"
            value="Andhra Pradesh - AP"
          />
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Hot Spot</Text>
        <Picker
          style={styles.picker}
          selectedValue={selectedHotspot}
          onValueChange={(itemValue) => setSelectedHotspot(itemValue)}
        >
          <Picker.Item label="Skill Teacher" value="Skill Teacher" />
          <Picker.Item label="Subject Teacher" value="Subject Teacher" />
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Pick the perfect plan to match your goals
        </Text>
        <Picker
          style={styles.picker}
          selectedValue={selectedPlan}
          onValueChange={(itemValue) => setSelectedPlan(itemValue)}
        >
          <Picker.Item
            label="1-day spotlight plan at ₹60"
            value="1-day spotlight plan at ₹60"
          />
          <Picker.Item
            label="7-day spotlight plan at ₹175"
            value="7-day spotlight plan at ₹175"
          />
          <Picker.Item
            label="30-day spotlight plan at ₹350"
            value="30-day spotlight plan at ₹350"
          />
        </Picker>
      </View>

      {/* Payment Summary */}
      <View style={styles.paymentSection}>
        <Text style={styles.paymentSectionTitle}>Pay for Spotlight</Text>
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentText}>
            Pay - ₹{selectedPricing.amount}
          </Text>
          <Text style={styles.paymentText}>
            IGST - 18% ₹{selectedPricing.gst.toFixed(0)}
          </Text>
          <Text style={styles.totalAmount}>Total - ₹{total.toFixed(0)}</Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/TeacherDashBoard/Payment",
              params: {
                selectedState,
                selectedHotspot,
                selectedPlan,
                paymentAmount: selectedPricing.amount,
                gst: selectedPricing.gst.toFixed(0),
                total: total.toFixed(0),
              },
            })
          }
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SpotlightTarrif;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#5f5fff",
    flex: 1,
    paddingHorizontal: wp("5.33%"),
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3.2%"),
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: wp(isTablet ? "4.2%" : "5.33%"),
    fontWeight: "bold",
    color: "#fff",
  },
  body: {
    marginBottom: hp("2.69%"),
  },
  sectionTitle: {
    fontSize: wp(isTablet ? "3.1%" : "4.8%"),
    fontWeight: "600",
    marginBottom: hp("2.15%"),
    color: "#FFF",
  },
  label: {
    fontSize: wp(isTablet ? "2.5%" : "3.44%"),
    color: "#FFF",
    marginBottom: hp("1.345%"),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: wp("2.667%"),
    paddingHorizontal: wp("2.667%"),
    marginBottom: hp("1.61%"),
  },
  searchIcon: {
    width: wp(isTablet ? "4.1%" : "5.33%"),
    height: wp(isTablet ? "4.1%" : "5.33%"),
    marginRight: wp("1.08%"),
    tintColor: "#555",
  },
  input: {
    flex: 1,
    height: hp(isTablet ? "4.25%" : "5.383%"),
    fontSize: wp(isTablet ? "2.9%" : "3.733%"),
    color: "#000",
    paddingHorizontal: wp("2.13%"),
  },
  helperText: {
    fontSize: wp(isTablet ? "2.5%" : "3.2%"),
    color: "#FFF",
    marginTop: 4,
    lineHeight: hp("2.422%"),
  },
  pickerLabel: {
    fontSize: wp(isTablet ? "2.1%" : "3.733%"),
  },
  typeToggleContainer: {
    flexDirection: "row",
    borderRadius: wp("2.18%"),
    padding: 4,
    marginBottom: hp("2.69%"),
    justifyContent: "space-around",
  },
  typeButton: {
    paddingVertical: hp("1.08%"),
    paddingHorizontal: wp("4.27%"),
    borderRadius: wp("1.6%"),
  },
  activeTypeButton: {
    backgroundColor: "#ffffff",
    fontWeight: "600",
    fontSize: wp(isTablet ? "2.15%" : "3.733%"),
  },
  typeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: wp(isTablet ? "2.15%" : "3.733%"),
  },
  activeTypeText: {
    color: "#5f5fff",
    fontWeight: "600",
    fontSize: wp(isTablet ? "2.15%" : "3.733%"),
  },
  graphWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: hp("2.69%"),
    paddingBottom: hp("5.3835%"),
    backgroundColor: "#FFF",
    borderRadius: wp("2.667%"),
    paddingHorizontal: wp("4.27%"),
    marginBottom: hp("2.69%"),
  },
  barItem: {
    alignItems: "center",
    width: wp("10.66%"),
    marginTop: hp("2.69%"),
  },
  topLabel: {
    color: "#2e2e30",
    marginBottom: 6,
    fontSize: wp("3.733%"),
  },
  bottomLabel: {
    color: "#2e2e30",
    marginTop: 6,
    fontSize: wp("3.2%"),
  },
  bar: {
    width: wp("6.66%"),
    height: hp("19.11%"),
    backgroundColor: "#e9ecf1",
    borderRadius: wp("0.8%"),
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  filledBar: {
    width: wp("6.66%"),
    backgroundColor: "#344bfd",
    borderRadius: wp("0.8%"),
  },

  item: { color: "#000" },
  section: {
    marginBottom: 20,
  },
  paymentSection: {
    marginTop: hp("2.69%"),
  },
  paymentSectionTitle: {
    fontSize: wp(isTablet ? "3.1%" : "4.8%"),
    fontWeight: "600",
    color: "#FFF",
  },
  paymentDetails: {
    marginTop: hp("1.345%"),
    backgroundColor: "#fff",
    padding: wp("4.27%"),
    borderRadius: wp("2.667%"),
    marginBottom: hp("4.037%"),
    borderWidth: wp("1.515%"),
    borderColor: "#71d561",
  },
  paymentText: {
    fontSize: wp("3.733%"),
    color: "#333",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: wp("4.27%"),
    color: "#000",
    fontWeight: "600",
    marginTop: hp("1.08%"),
  },
  buttonWrapper: {
    alignItems: "center",
    marginBottom: hp("10.76%"),
  },
  continueButton: {
    backgroundColor: "#f5b726",
    paddingVertical: hp("1.61%"),
    paddingHorizontal: wp("10.66%"),
    borderRadius: wp("2.13%"),
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#00000",
    fontSize: wp("4.27%"),
    fontWeight: "bold",
  },
  picker: {
    backgroundColor: "#fff",
    paddingHorizontal: wp("2.13%"),
    borderRadius: wp("2.13%"),
    marginBottom: hp("2.15%"),
    color: "#000",
    height: hp("6.729%"),
    fontSize: wp(isTablet ? "2.15%" : "4.27%"),
    borderWidth: 0,
  },
});
