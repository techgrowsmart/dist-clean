import ArrowBack from "../../../assets/svgIcons/ArrowBack";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Poppins_400Regular, useFonts } from "@expo-google-fonts/poppins";
import CustomDropdown from "../../../app/CustomDropdown";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { isTablet } from "../../../utils/devices";

export default function AddonClass() {
  const [errors, setErrors] = useState({});
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Poppins_400Regular });

  const [educationData, setEducationData] = useState([]);
  const [boardItems, setBoardItems] = useState([]);
  const [classItems, setClassItems] = useState([]);
  const [subjectItems, setSubjectItems] = useState([]);
  const [skillItems, setSkillItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("Subject teacher");
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedCharge, setSelectedCharge] = useState("");

  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/valuesToselect`);
        const boards =
          res.data.find((item) => item.id === "Subject teacher")?.boards || [];
        const skills =
          res.data.find((item) => item.id === "Skill teacher")?.skills || [];

        setEducationData(boards);
        if (boards.length > 0) {
          const defaultBoard = boards[0];
          setSelectedBoard(defaultBoard.name);
          const defaultClass = defaultBoard.classes?.[0]?.name;
          setSelectedClass(defaultClass);
          const defaultSubject = defaultBoard.classes?.[0]?.subjects?.[0]?.name;
          setSelectedSubject(defaultSubject);
        }

        const skillList = skills.map((s) => ({ label: s.name, value: s.name }));
        setSkillItems(skillList);
        if (skillList.length > 0) setSelectedSkill(skillList[0].value);
      } catch (err) {
        console.error("Failed to fetch education structure:", err);
      }
    };

    fetchEducationData();
  }, []);
  const validateForm = () => {
    const newErrors = {};

    if (!selectedCategory || selectedCategory === "") {
      newErrors.selectedCategory = "Please select the category.";
    }

    if (selectedCategory === "Subject teacher") {
      if (!selectedBoard) newErrors.selectedBoard = "Please select the board.";
      if (!selectedClass) newErrors.selectedClass = "Please select the class.";
      if (!selectedSubject)
        newErrors.selectedSubject = "Please select the subject.";
    }

    if (selectedCategory === "Skill teacher") {
      if (!selectedSkill) newErrors.selectedSkill = "Please select the skill.";
    }

    if (!selectedCharge) newErrors.selectedCharge = "Please select the charge.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (
      !educationData.length ||
      !selectedBoard ||
      selectedCategory !== "Subject teacher"
    )
      return;

    const boardList = educationData.map((b) => ({
      label: b.name,
      value: b.name,
    }));
    setBoardItems(boardList);

    const selectedBoardData = educationData.find(
      (b) => b.name === selectedBoard
    );
    if (selectedBoardData) {
      const classes = selectedBoardData.classes.map((c) => ({
        label: c.name,
        value: c.name,
      }));
      setClassItems(classes);
      if (!selectedBoardData.classes.some((c) => c.name === selectedClass)) {
        setSelectedClass(selectedBoardData.classes?.[0]?.name || null);
      }
    }
  }, [educationData, selectedBoard, selectedCategory]);

  useEffect(() => {
    if (
      !selectedBoard ||
      !selectedClass ||
      selectedCategory !== "Subject teacher"
    )
      return;

    const boardData = educationData.find((b) => b.name === selectedBoard);
    const classData = boardData?.classes.find((c) => c.name === selectedClass);

    if (classData) {
      const subjects = classData.subjects.map((s) => ({
        label: s.name,
        value: s.name,
      }));
      setSubjectItems(subjects);
      if (!classData.subjects.some((s) => s.name === selectedSubject)) {
        setSelectedSubject(classData.subjects?.[0]?.name || null);
      }
    }
  }, [selectedBoard, selectedClass, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === "Skill teacher") {
      setSelectedBoard(null);
      setSelectedClass(null);
      setSelectedSubject(null);
    } else {
      setSelectedSkill(null);
    }
  }, [selectedCategory]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    try {
      const auth = await getAuthData();
      if (!auth?.email || !auth.token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const email = auth.email;
      const profileRes = await axios.post(
        `${BASE_URL}/api/teacher/`,
        { email },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const profile = profileRes.data;
      const subjectOrSkill =
        selectedCategory === "Subject teacher"
          ? selectedSubject
          : selectedSkill;
      if (!selectedCharge) {
        Alert.alert("Error", "Please select a charge");
        return;
      }

      const payload = {
        email: auth.email,
        name: profile.name,
        category: selectedCategory,
        board: selectedCategory === "Subject teacher" ? selectedBoard : "",
        className: selectedCategory === "Subject teacher" ? selectedClass : "",
        subject: subjectOrSkill,
        timeFrom: "",
        timeTo: "",
        day: "",
        charge: selectedCharge,
        profileimage: profile.profilepic,
      };

      const response = await axios.post(
        `${BASE_URL}/api/addonClass`,
        payload,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      if (response.status === 201) {
        router.push("/(tabs)/TeacherDashBoard/Congratulations");
      }
    } catch (error) {
      console.error("Error adding class:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowBack size={wp(isTablet ? "6%" : "8%")} />
        </TouchableOpacity>
        <Text style={styles.title}>Add on Class</Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.checkoutSummary}>
            <Text style={styles.checkoutTitle}>Basic information</Text>

            <CustomDropdown
              label="Select Category"
              options={[
                { label: "Subject Teacher", value: "Subject teacher" },
                { label: "Skill Teacher", value: "Skill teacher" },
              ]}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />

            {selectedCategory === "Subject teacher" ? (
              <>
                <CustomDropdown
                  label="Select Board"
                  options={boardItems}
                  selected={selectedBoard}
                  onSelect={setSelectedBoard}
                />
                {errors.selectedBoard && (
                  <Text style={styles.errorText}>{errors.selectedBoard}</Text>
                )}
                <CustomDropdown
                  label="Select Class"
                  options={classItems}
                  selected={selectedClass}
                  onSelect={setSelectedClass}
                />
                {errors.selectedClass && (
                  <Text style={styles.errorText}>{errors.selectedClass}</Text>
                )}
                <CustomDropdown
                  label="Select Subject"
                  options={subjectItems}
                  selected={selectedSubject}
                  onSelect={setSelectedSubject}
                />
                {errors.selectedSubject && (
                  <Text style={styles.errorText}>{errors.selectedSubject}</Text>
                )}
                <CustomDropdown
                  label="Charge"
                  options={[
                    { label: "200/Hr", value: "200/Hr" },
                    { label: "2000/Monthly", value: "2000/Monthly" },
                  ]}
                  selected={selectedCharge}
                  onSelect={setSelectedCharge}
                />
                {errors.selectedCharge && (
                  <Text style={styles.errorText}>{errors.selectedCharge}</Text>
                )}
              </>
            ) : (
              <>
                <CustomDropdown
                  label="Select Skill"
                  options={skillItems}
                  selected={selectedSkill}
                  onSelect={setSelectedSkill}
                />
                {errors.selectedSkill && (
                  <Text style={styles.errorText}>{errors.selectedSkill}</Text>
                )}
                <CustomDropdown
                  label="Charge"
                  options={[
                    { label: "200/Hr", value: "200/Hr" },
                    { label: "2000/Monthly", value: "2000/Monthly" },
                  ]}
                  selected={selectedCharge}
                  onSelect={setSelectedCharge}
                />
                {errors.selectedCharge && (
                  <Text style={styles.errorText}>{errors.selectedCharge}</Text>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={{ width: "100%", alignItems: "center" }}
            onPress={handleSubmit}
          >
            <Text style={styles.payText}>Add on class</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#5f5fff" },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "#ff4d4d",
    fontSize: wp("3%"),
    marginBottom: 6,
    marginTop: 2,
    fontWeight: "bold",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp("5.33%"),
    marginBottom: hp("2.69%"),
    marginTop: 50,
    paddingHorizontal: wp("5.33%"),
  },
  title: {
    fontSize: wp("5.33%"),
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "Poppins_400Regular",
  },
  content: {
    flex: 1,
    backgroundColor: "#c0c0eb",
    borderTopLeftRadius: wp("5.86%"),
    borderTopRightRadius: wp("5.86%"),
  },
  scrollContent: { paddingBottom: 80 },
  checkoutSummary: { padding: wp("5.33%") },
  checkoutTitle: {
    fontSize: wp("5.33%"),
    lineHeight: hp("3.449%"),
    fontWeight: "bold",
    marginBottom: hp("2.15%"),
    color: "#143e29",
    fontFamily: "Poppins_400Regular",
  },
  btnContainer: {
    marginHorizontal: wp("5.33%"),
    paddingVertical: hp("1.884%"),
    backgroundColor: "#5f5fff",
    borderRadius: wp("2.667%"),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  payText: {
    color: "#fff",
    fontSize: wp("4.27%"),
    fontWeight: "600",
    fontFamily: "Poppins_400Regular",
  },
});
