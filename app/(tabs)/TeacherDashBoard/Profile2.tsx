import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import Building from "../../../assets/svgIcons/Building";
import Menubook from "../../../assets/svgIcons/MenuBook";
import Pencil from "../../../assets/svgIcons/Pencil";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";

import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { isTablet } from "../../../utils/devices";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface FormErrors {
  introduction?: string;
  selectedCategory?: string;
  selectedBoard?: string;
  selectedClass?: string;
  selectedSubject?: string;
  selectedSkill?: string;
  teachingMode?: string;
  [key: string]: string | undefined;
}

const { width, height } = Dimensions.get("window");

export default function TeacherProfile() {
  const fontsLoaded = true;
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [educationJson, setEducationJson] = useState<any[]>([]);

  const [boards, setBoards] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subject, setSubject] = useState<any[]>([]);
  const [chargeOptions, setChargeOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherName, setTeacherName] = useState<string>("");

  const [email, setEmail] = useState<string>("");
  const [university, setUniversity] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);

  const [selectedClass, setSelectedClass] = useState<string>("");

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedBoard, setSelectedBoard] = useState<string>("CBSE");

  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  const [userStatus, setUserStatus] = useState<string>("dormant");

const [selectedDays, setSelectedDays] = useState<string[]>([]);
const [maxDays] = useState(7);
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [selectedQualification, setSelectedQualification] =
    useState<string>("");

  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [isEditable, setIsEditable] = useState(false);

  const [introduction, setIntroduction] = useState("");

const [qualifications, setQualifications] = useState([
  { subject: "", college: "", year: "" },
  { subject: "", college: "", year: "" },
  { subject: "", college: "", year: "" },
  { subject: "", college: "", year: "" }, // Add 4th qualification
]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    moment().month()
  );

  const [teachingMode, setTeachingMode] = useState<string[]>(["Online"]);
  const [workExperience, setWorkExperience] = useState("");
const [tuitions, setTuitions] = useState([
  {
    class: "",
    subject: "",
    timeFrom: "",
    timeTo: "",
    charge: "", // Add default charge
    day: "",
    board: "",
    skill: "",
  },
  {
    class: "",
    subject: "",
    timeFrom: "",
    timeTo: "",
    charge: "", // Add default charge
    day: "",
    board: "",
    skill: "",
  },
  {
    class: "",
    subject: "",
    timeFrom: "",
    timeTo: "",
    charge: "", // Add default charge
    day: "",
    board: "",
    skill: "",
  },
]);

  const [tuitionCount, setTuitionCount] = useState(1); 

  const [category, setCategory] = useState<string>("");

  const [educationData, setEducationData] = useState<any[]>([]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const [showQualificationPicker, setShowQualificationPicker] = useState(false);
  const [skillItems, setSkillItems] = useState([]);
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const [tempDay, setTempDay] = useState("");
  const [tempTimeFrom, setTempTimeFrom] = useState("");
  const [tempTimeTo, setTempTimeTo] = useState("");
  const [selectedTimingIndex, setSelectedTimingIndex] = useState<number | null>(
    null
  );
  const [subjectClassItems, setSubjectClassItems] = useState<any[]>([]);


  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [boardItems, setBoardItems] = useState([]);
  const [classItems, setClassItems] = useState([]);
  const [subjectItems, setSubjectItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  interface RatingsCount {
    [key: number]: number;
  }
  const [ratingsCount, setRatingsCount] = useState<RatingsCount>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  
const validateForm = () => {
  const newErrors: any = {};

  // if (!university.trim()) {
  //   newErrors.university = "Please enter your university name.";
  // }

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

  if (!introduction.trim()) {
    newErrors.introduction = "Please enter your introduction.";
  }
// Only validate first qualification as required
if (!qualifications[0]?.subject?.trim()) {
  newErrors.qualification_subject_0 = "Enter subject for qualification";
}
if (!qualifications[0]?.college?.trim()) {
  newErrors.qualification_college_0 = "Enter college name for qualification";
}
if (!qualifications[0]?.year?.trim()) {
  newErrors.qualification_year_0 = "Enter year for qualification";
}

  // Only validate the first tuitionCount entries
  for (let i = 0; i < tuitionCount; i++) {
    const t = tuitions[i];
    const prefix = `tuition_${i}`;
    
    if (selectedCategory === "Subject teacher") {
      if (!t.board?.trim())
        newErrors[`${prefix}_board`] = `Select board for tuition ${i + 1}`;
      if (!t.subject?.trim())
        newErrors[`${prefix}_subject`] = `Select subject for tuition ${i + 1}`;
      if (!t.class?.trim())
        newErrors[`${prefix}_class`] = `Select class for tuition ${i + 1}`;
    } else if (selectedCategory === "Skill teacher") {
      if (!t.skill?.trim())
        newErrors[`${prefix}_skill`] = `Select skill for tuition ${i + 1}`;
    }

    // Uncomment if charge validation is needed
    // newErrors[`${prefix}_charge`] = `Enter charge for tuition ${i + 1}`;
    if (!t.day?.trim())
      newErrors[`${prefix}_day`] = `Select day for tuition ${i + 1}`;
    if (!t.timeFrom?.trim())
      newErrors[`${prefix}_timeFrom`] = `Select starting time for tuition ${i + 1}`;
    if (!t.timeTo?.trim())
      newErrors[`${prefix}_timeTo`] = `Select ending time for tuition ${i + 1}`;
  }

  if (!teachingMode || teachingMode.length === 0) {
    newErrors.teachingMode = "Please select at least one mode of teaching.";
  }

  // Debug: Log validation errors
  console.log("🔍 Validation errors:", newErrors);
  console.log("📋 Form data:", {
    university,
    selectedCategory,
    selectedBoard,
    selectedClass,
    selectedSubject,
    selectedSkill,
    introduction,
    teachingMode,
    tuitionCount,
    tuitions: tuitions.slice(0, tuitionCount)
  });

  setErrors(newErrors);
  return true; // Always allow component to render, handle validation in UI
};

 const addTuition = () => {
  setTuitionCount(tuitionCount + 1);
  
  // Add a new empty tuition if needed
  if (tuitions.length <= tuitionCount) {
    setTuitions([
      ...tuitions,
      {
        class: "",
        subject: "",
        timeFrom: "",
        timeTo: "",
        charge: "", 
        day: "",
        board: "",
        skill: "",
      },
    ]);
  }
};
  // Add this function to handle deleting tuition entries
const deleteTuition = (index: number) => {
  if (tuitionCount > 1) {
    const updatedTuitions = [...tuitions];
    updatedTuitions.splice(index, 1);
    
    setTuitions(updatedTuitions);
    setTuitionCount(tuitionCount - 1);
  }
};

// // In your JSX, modify the educationDetailsTitle section for each tuition:
// {tuitions.slice(0, tuitionCount).map((tuition, index) => (
//   <View key={index} style={styles.subjects}>
//     <View style={styles.educationDetailsTitle}>
//       <Text style={styles.tutionTitle}>
//         {index === 0 
//           ? "Subjects for Tuition" 
//           : `Subjects for Tuition`}
//       </Text>
//       <View style={styles.titleActions}>
//         {index === 0 && !isEditable && (
//           <TouchableOpacity
//             onPress={() => setIsEditable(true)}
//             style={styles.edit}
//           >
//             <Pencil color="#000" />
//           </TouchableOpacity>
//         )}
//         {/* Add delete button for additional tuitions (not the first one) */}
//         {index > 0 && isEditable && (
//           <TouchableOpacity
//             onPress={() => deleteTuition(index)}
//             style={styles.deleteButton}
//           >
//             {/* Add a dustbin icon - you'll need to import or create one */}
//             <MaterialIcons name="delete" size={24} color="#c30707" />
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
    
//   </View>
// ))}

useEffect(() => {
  const backAction = () => {
    router.push("/(tabs)/TeacherDashBoard/Teacher");
    return true; // Prevent default behavior
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove();
}, [router]);

// Add this function before loadProfileData
const fetchUserStatus = async () => {
  try {
    const auth = await getAuthData();
    if (!auth?.token) return;

    const headers = {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      `${BASE_URL}/api/userProfile`,
      { email: auth.email },
      { headers }
    );

    if (response.data && response.data.status) {
      setUserStatus(response.data.status);
    }
  } catch (error) {
    console.error("Error fetching user status:", error);
  }
};



useEffect(() => {
  const loadProfileData = async () => {
    try {
        setIsLoading(true);
      const auth = await getAuthData();

      // Add null check for auth
      if (!auth || !auth.token) {
        console.error("No authentication data found");
        Alert.alert("Error", "Please login again");
        return;
      }

      const email = auth.email;
      const token = auth.token;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("🔄 Fetching teacher profile from backend for:", email);

      // Try to fetch from backend first
      try {
        const response = await axios.post(
          `${BASE_URL}/api/teacherProfile`,
          { email },
          { headers }
        );

        if (response.status === 200 && response.data) {
          const profileData = response.data;
          console.log("✅ Successfully loaded profile from backend:", profileData);

          setIsExistingProfile(true);

          // Set all the state values from backend
          setTeacherName(profileData.name || "");
          setEmail(profileData.email || "");
          setPhone(""); // Phone is not stored in teachers1 table
          setProfileImage(profileData.profileimage || profileData.profilePic || null);
          setIntroduction(profileData.introduction || "");
          setWorkExperience(profileData.workExperience || "");
          // setHeighestDegree(profileData.heighest_degree || ""); 
          setUniversity(profileData.university || "");
          // Set category and update related states
          const savedCategory = profileData.category || "Subject teacher";
          setSelectedCategory(savedCategory);
          setCategory(savedCategory);

          // Set teaching mode
          const teachingMode = Array.isArray(profileData.teachingMode)
            ? profileData.teachingMode
            : ["Online"];
          setTeachingMode(teachingMode);

          // Set qualifications
          const qualifications = Array.isArray(profileData.qualifications)
            ? profileData.qualifications
            : [];
          // Ensure we always have 4 qualification slots
          const qualificationsWithDefaults = [
              { subject: "", college: "", year: "" },
              { subject: "", college: "", year: "" },
              { subject: "", college: "", year: "" },
              { subject: "", college: "", year: "" } // Add 4th slot
            ];

          if (qualifications.length > 0) {
            qualifications.forEach((qual: any, index: number) => {
              if (index < 4) {
                qualificationsWithDefaults[index] = {
                  ...qualificationsWithDefaults[index],
                  ...qual
                };
              }
            });
          }
          setQualifications(qualificationsWithDefaults);

          // Set tuitions
          const tuitions = Array.isArray(profileData.tuitions) ? profileData.tuitions : [];
          setTuitionCount(tuitions.length > 0 ? tuitions.length : 1);

          // Update tuitions state with backend data
          const defaultTuitions = [
            { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
            { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
            { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" }
          ];

          if (tuitions.length > 0) {
            tuitions.forEach((savedTuition: any, index: number) => {
              if (index < 4) {
                defaultTuitions[index] = {
                  ...defaultTuitions[index],
                  ...savedTuition,
                  charge: savedTuition.charge || ""
                };
              }
            });
          }

          setTuitions(defaultTuitions);

          // Save to AsyncStorage as backup
          await AsyncStorage.multiSet([
            ["teacherName", profileData.name || ""],
            ["email", profileData.email || ""],
            ["profileImage", profileData.profileimage || profileData.profilePic || ""],
            ["introduction", profileData.introduction || ""],
            ["workexperience", profileData.workExperience || ""],
            ["category", savedCategory],
            ["teachingmode", JSON.stringify(teachingMode)],
            ["tutions", JSON.stringify(tuitions)],
            ["qualifications", JSON.stringify(qualifications)],
            // ["heighest_degree", profileData.heighest_degree || ""]
              ["university", profileData.university || ""], // ✅ Add this
          ]);

          console.log("💾 Saved to AsyncStorage as backup");
          return; // Successfully loaded from backend
        }
      } catch (apiError) {
        console.log("⚠️ Backend API failed, trying AsyncStorage fallback:", apiError instanceof Error ? apiError.message : String(apiError));
      }

      // Fallback to AsyncStorage if backend fails
      console.log("🔄 Loading from AsyncStorage fallback...");
      const storedData = await AsyncStorage.multiGet([
        "teacherName", "email", "phone", "profileImage", "introduction",
        "qualifications", "category", "workexperience", "teachingmode",
        "tutions", "university"
      ]);
      const data = Object.fromEntries(storedData);

      console.log("📥 Loaded from AsyncStorage fallback:", data);

      setIsExistingProfile(true);

      // Set all the state values from storage
      setTeacherName(data.teacherName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setProfileImage(data.profileImage || null);
      setIntroduction(data.introduction || "");
      setWorkExperience(data.workexperience || "");
      setUniversity(data.university || "");

      // Set category and update related states
      const savedCategory = data.category || "Subject teacher";
      setSelectedCategory(savedCategory);
      setCategory(savedCategory);

      // Parse and set teaching mode
      try {
        const parsedTeachingMode = JSON.parse(data.teachingmode || "[]");
        setTeachingMode(Array.isArray(parsedTeachingMode) ? parsedTeachingMode : []);
      } catch {
        setTeachingMode([]);
      }

      // Parse and set qualifications
      try {
        const parsedQualifications = JSON.parse(data.qualifications || "[]");
        // Ensure we always have 3 qualification slots
        const qualificationsWithDefaults = [
          { subject: "", college: "", year: "" },
          { subject: "", college: "", year: "" },
          { subject: "", college: "", year: "" },
          { subject: "", college: "", year: "" }
        ];

        if (Array.isArray(parsedQualifications)) {
          parsedQualifications.forEach((qual: any, index: number) => {
            if (index < 4) {
              qualificationsWithDefaults[index] = {
                ...qualificationsWithDefaults[index],
                ...qual
              };
            }
          });
        }
        setQualifications(qualificationsWithDefaults);
      } catch {
        setQualifications([
          { subject: "", college: "", year: "" },
          { subject: "", college: "", year: "" },
          { subject: "", college: "", year: "" }
        ]);
      }

      // Parse and set tuitions
      try {
        const parsedTuitions = JSON.parse(data.tutions || "[]");

        // Count valid tuitions
        const validTuitions = parsedTuitions.filter((t: any) =>
          t.class || t.subject || t.skill || t.timeFrom || t.timeTo || t.board || t.day
        );

        setTuitionCount(validTuitions.length > 0 ? validTuitions.length : 1);

        // Update tuitions state with saved data
        const defaultTuitions = [
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" }
        ];

        if (Array.isArray(parsedTuitions)) {
          parsedTuitions.forEach((savedTuition: any, index: number) => {
            if (index < 4) {
              defaultTuitions[index] = {
                ...defaultTuitions[index],
                ...savedTuition,
                charge: savedTuition.charge || ""
              };
            }
          });
        }

        setTuitions(defaultTuitions);
      } catch {
        setTuitions([
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" },
          { class: "", subject: "", timeFrom: "", timeTo: "", charge: "", day: "", board: "", skill: "" }
        ]);
        setTuitionCount(1);
      }

    } catch (error) {
      console.error("❌ Error loading profile data:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    }
    finally {
      setIsLoading(false);
    }
    
  };

  loadProfileData();
  fetchUserStatus();
}, []);

  useEffect(() => {
    if (!email) return;
    const fetchReviews = async () => {
      if (!email || Array.isArray(email)) return;

      try {
        const encodedEmail = encodeURIComponent(email);
        console.log("📩 Encoded Email:", encodedEmail);

        const auth = await getAuthData();
        if (!auth || !auth.token) {
          console.error("No authentication token found");
          return;
        }
        const headers = {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        };

        const res = await axios.get(
          `${BASE_URL}/review?email=${encodedEmail}`,
          {
            headers,
          }
        );

        console.log("✅ Reviews:", res.data.reviews);
        setReviews(res.data.reviews || []);
        setReviews(res.data.reviews || []);

        const ratings = res.data.reviews.map((r: any) => Number(r.rating));
        const total = ratings.length;

        // Calculate ratings count
        const countByStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
          if (rating >= 1 && rating <= 5) {
            countByStars[rating as keyof typeof countByStars]++;
          }
        });
        
        setRatingsCount(countByStars);
      } catch (error) {
        console.error("❌ Failed to fetch reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [email]);

  useEffect(() => {
    const debug = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys);
    };
    debug();
  }, []);
  useEffect(() => {
    if (selectedDate) {
      const monthIndex = moment(selectedDate).month();
      setSelectedMonthIndex(monthIndex);
    }
  }, [selectedDate]);

  const uploadImageToS3AndUpdateProfile = async (
    uri: string,
    email: string,
    name: string
  ) => {
    try {
      const auth = await getAuthData();
      if (!auth || !auth.token) {
        throw new Error("User not authenticated");
      }

      const filename = `profile_${Date.now()}.jpg`;
      const formData = new FormData();
      
      if (Platform.OS === "web") {
        console.log("Platform is Web. Fetching blob from:", uri);
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type });
        formData.append("profileimage", file);
      } else {
        console.log("Platform is not Web. Fetching file from:", uri);
        const ext = uri.split(".").pop();
        const mimeType = ext ? `image/${ext}` : "image/jpeg";

        formData.append("profileimage", {
          uri,
          name: filename,
          type: mimeType,
        } as any);
      }

      formData.append("email", email);
      formData.append("name", name);

      console.log("Uploading image...");
      const response = await fetch(`${BASE_URL}/api/uploadTeacherimg`, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log("✅ Upload successful:", responseData);
      
      if (!responseData.imageUrl) {
        throw new Error("No image URL returned from server");
      }

      // Update the profile image in the state
      setProfileImage(responseData.imageUrl);
      
      // Also save to AsyncStorage for persistence
      await AsyncStorage.setItem("profileImage", responseData.imageUrl);
      
      return responseData.imageUrl;
    } catch (err) {
      console.error("❌ Upload failed:", err);
      Alert.alert("Upload Failed", "Failed to upload profile image. Please try again.");
      return null;
    }
  };

  const updateQualification = (index: any, field: any, value: any) => {
    setQualifications((prevQualifications) => {
      const updated = [...prevQualifications];

      while (updated.length <= index) {
        updated.push({ subject: "", college: "", year: "" });
      }

      updated[index][field] = value;
      return updated;
    });
  };

  const updateTuitionField = (index: any, key: any, value: any) => {
    const updatedTutions = [...tuitions];
    updatedTutions[index] = {
      ...updatedTutions[index],
      [key]: value,
    };

    setTuitions(updatedTutions);
  };

  const filteredQualifications = qualifications.filter(
    (q) => q.subject || q.college || q.year
  );
  useEffect(() => {
    const fetchEducationData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/valuesToselect`);

        const boards =
          res.data.find((item: any) => item.id === "Subject teacher")?.boards ||
          [];
        const skills =
          res.data.find((item: any) => item.id === "Skill teacher")?.skills ||
          [];

        setEducationData(boards);

        if (boards.length > 0) {
          const defaultBoard = boards[0];
          setSelectedBoard(defaultBoard.name);

          const defaultClass = defaultBoard.classes?.[0]?.name;
          setSelectedClass(defaultClass);

          const defaultSubject = defaultBoard.classes?.[0]?.subjects?.[0]?.name;
          setSelectedSubject(defaultSubject);
        }
        const skillList = skills.map((s: any) => ({
          label: s.name,
          value: s.name,
        }));

        setSkillItems(skillList);

        if (skillList.length > 0) {
          setSelectedSkill(skillList[0].value);
        }
      } catch (err) {
        console.error("Failed to fetch education structure:", err);
      }
    };

    fetchEducationData();
  }, []);

  useEffect(() => {
    if (!selectedBoard || educationData.length === 0) return;
    const boardList = educationData.map((b: any) => ({
      label: b.name,
      value: b.name,
    }));

    setBoardItems(boardList);

    const selectedBoardData = educationData.find(
      (b) => b.name === selectedBoard
    );

    if (selectedBoardData) {
      const classes = selectedBoardData.classes.map((c: any) => ({
        label: c.name,
        value: c.name,
      }));

      setClassItems(classes);

      if (!selectedBoardData.classes.some((c) => c.name === selectedClass)) {
        setSelectedClass(selectedBoardData.classes?.[0]?.name || null);
      }
    }
    const boardData = educationData.find(
      (board) => board.name === selectedBoard
    );
    if (!boardData) return;

    const subjectClassList = [];

    boardData.classes.forEach((cls: any) => {
      cls.subjects.forEach((subj: any) => {
        subjectClassList.push({
          label: `${subj.name} - ${cls.name}`,
          value: `${subj.name}__${cls.name}`,
        });
      });
    });

    setSubjectClassItems(subjectClassList);
  }, [selectedBoard, educationData]);
  const handleBoardChange = (index: any, boardName: string) => {
    const updated = [...tuitions];
    updated[index].board = boardName;
    updated[index].subject = "";
    updated[index].class = "";
    setTuitions(updated);
    setSelectedBoard(boardName);
  };

const cleanedTuitions = tuitions.slice(0, tuitionCount).map((t) => {
  if (selectedCategory === "Skill teacher") {
    return {
      skill: t.skill,
      timeFrom: t.timeFrom,
      timeTo: t.timeTo,
      charge: t.charge || "",
      day: t.day,
    };
  } else {
    return {
      class: t.class,
      subject: t.subject,
      board: t.board,
      timeFrom: t.timeFrom,
      timeTo: t.timeTo,
      charge: t.charge || "",
      day: t.day,
    };
  }
});

  useEffect(() => {
    if (!selectedBoard || !selectedClass) return;

    const boardData = educationData.find((b) => b.name === selectedBoard);
    const classData = boardData?.classes.find(
      (c: any) => c.name === selectedClass
    );

    if (classData) {
      const subjects = classData.subjects.map((s: any) => ({
        label: s.name,
        value: s.name,
      }));

      setSubjectItems(subjects);

      if (!classData.subjects.some((s) => s.name === selectedSubject)) {
        setSelectedSubject(classData.subjects?.[0]?.name || null);
      }
    }
  }, [selectedBoard, selectedClass]);
  useEffect(() => {
    if (selectedCategory === "Subject teacher") {
      const schooling = educationJson.find(
        (item) => item.id === "Subject teacher"
      );
      if (schooling) {
        setBoards(schooling.boards);
      }
    } else {
      setBoards([]);
      setSelectedBoard(null);
      setClasses([]);
      setSelectedClass(null);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedClass) {
      const selected = classes.find((c) => c.name === selectedClass);
      if (selected && selected.subjects) {
        setSubject(selected.subjects);
      } else {
        setSubject([]);
      }
    } else {
      setSubject([]);
    }
  }, [selectedClass]);

  // Add this useEffect to handle parsing days when modal opens
useEffect(() => {
  if (timingModalVisible && selectedTimingIndex !== null) {
    const currentTuition = tuitions[selectedTimingIndex];
    
    if (currentTuition?.day) {
      // Parse the comma-separated days back into an array
      const daysArray = currentTuition.day.split(',').map(day => day.trim());
      setSelectedDays(daysArray);
    } else {
      setSelectedDays([]);
    }
    
    setTempTimeFrom(currentTuition?.timeFrom || "");
    setTempTimeTo(currentTuition?.timeTo || "");
  }
}, [timingModalVisible, selectedTimingIndex, tuitions]);

  useEffect(() => {
  // Generate 10 charge options from 200 to 2000
  const charges = [];
  const step = Math.floor((2000 - 200) / 9); // 200 interval between options
  for (let i = 200; i <= 2000; i += step) {
    charges.push(`₹ ${i}/pm`);
  }
  setChargeOptions(charges);
}, []);



const validateTimeRange = () => {
  if (!tempTimeFrom || !tempTimeTo) return true;
  
  const fromTime = moment(tempTimeFrom, "HH:mm");
  const toTime = moment(tempTimeTo, "HH:mm");
  
  return toTime.isAfter(fromTime);
};

  const handleSave = async () => {
  if (!validateForm()) {
    Alert.alert("Missing Fields", "Please fill in all required fields.");
    return;
  }
  
  const auth = await getAuthData();
  if (!auth) {
    Alert.alert("Error", "User not authenticated. Please log in again.");
    return;
  }
  
  const { email, token } = auth;
  let imageUrl = profileImage;

  console.log("image Url", imageUrl);
  if (
    profileImage &&
    (profileImage.startsWith("file://") || profileImage.startsWith("blob:"))
  ) {
    imageUrl = await uploadImageToS3AndUpdateProfile(
      profileImage,
      email,
      teacherName
    );
    console.log("img", imageUrl);
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ✅ FIRST: Update teachers1 table (existing code)
  await axios.post(
  `${BASE_URL}/api/teacherss`,
  {
    fullName: teacherName,
    email,
    profilePic: imageUrl,
    introduction: introduction,
    qualifications: filteredQualifications,
    category: selectedCategory,
    tuitions: cleanedTuitions,
    teachingMode,
    workExperience,
    university: university, // ✅ Add this line
  },
  { headers }
);

  // try {
  //   await axios.post(
  //     `${BASE_URL}/api/update-tutor-degree`,
  //     {
  //       email: email,
  //       heighest_degree: heighestDegree
  //     },
  //     { headers }
  //   );
  // } catch (error) {
  //   console.error("Failed to update highest degree in tutors table:", error);
  // }

  // Save to AsyncStorage
  await AsyncStorage.multiSet([
    ["teacherName", teacherName],
    ["email", email],
    ["profileImage", imageUrl || ""],
    ["introduction", introduction],
    ["workexperience", workExperience],
    ["category", selectedCategory],
    ["teachingmode", JSON.stringify(teachingMode)],
    ["tutions", JSON.stringify(cleanedTuitions)],
    ["qualifications", JSON.stringify(filteredQualifications)],
    ["university", university], 
  ]);

    // Debug: Log what was saved
    console.log("💾 Saved to AsyncStorage:", {
      teacherName,
      email,
      profileImage: imageUrl || "",
      introduction,
      workExperience,
      category: selectedCategory,
      teachingMode,
      tuitions: cleanedTuitions,
      qualifications: filteredQualifications,
      university: university,
    });
    router.push({
      pathname: "/(tabs)/TeacherDashBoard/Teacher",
      params: {
        userType: "teacher",
        userEmail: email,
        profileImage: imageUrl || "",
        teachingClass: selectedClass,
        subject: selectedSubject,
        board: selectedBoard,
        language: selectedLanguage,
        qualification: selectedQualification,
      },
    });
  };

  const handleImagePicker = () => setImageModalVisible(true);
  const cropImage = async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      console.log("✅ Manipulated Image URI:", manipulatedImage.uri);
      setProfileImage(manipulatedImage.uri);
      setImageModalVisible(false);
    } catch (error) {
      console.error("❌ Cropper Error:", error);
    }
  };
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      cropImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      cropImage(result.assets[0].uri);
    }
  };
  const renderPickerField = (
    label: string,
    value: string,
    onPress: () => void
  ) => {
    return (
      <TouchableOpacity style={styles.iosPickerButton} onPress={onPress}>
        <Text style={styles.iosPickerButtonText}>
          {value || `Select ${label}`}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B7FFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/TeacherDashBoard/Teacher")}
            style={styles.backButton}
          >
            <BackArrowIcon width={wp("2.4%")} height={hp("2.23%")} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.imageContainer}
          >
            {profileImage ? (
              <Image
                style={styles.profileImage}
                source={{ uri: profileImage }}
              />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.uploadContainer}>
                  <Image
                    source={require("../../../assets/image/upload.png")}
                    style={styles.uploadIcon}
                  />
                </View>

                <Text style={styles.uploadTxt}>Upload Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>
         <View style={styles.nameSection}>


  {/* First Row: Name and Rating */}
   <View style={styles.nameRow}>
    <Text style={styles.teacherName}>{teacherName}</Text>
    <View style={styles.rating}>
      <Text style={styles.ratingtxt}>
        ⭐{averageRating} ({reviews.length})
      </Text>
    </View>
  </View>

  <View style={styles.universityRow}>
    <TouchableOpacity style={styles.editUniversity}>
      <Pencil color="#000" />
    </TouchableOpacity>
<TextInput
  placeholder="Edit recent University"
  placeholderTextColor={"#ffffff"}
  style={styles.universityInput}
  editable={isEditable}
  value={university}
  onChangeText={setUniversity}
/>
  </View>
</View>
        </View>

        <View style={{ paddingHorizontal: 12, paddingVertical: 25 }}>
            <View style={styles.infoContainer}>
            <View style={styles.introContainer}>
  <Text style={styles.introductionHeading}>
    Introduction
  </Text>
  {!isEditable && (
    <TouchableOpacity
      onPress={() => setIsEditable(true)}
      style={styles.edit}
    >
      <Pencil color="#000" />
    </TouchableOpacity>
  )}
</View>
{errors.introduction?.trim() && (
  <Text style={[styles.errorText, styles.introError]}>{errors.introduction}</Text>
)}

              <View style={styles.feildsContainer}>
            <TextInput
  value={introduction}
  onChangeText={setIntroduction}
  editable={isEditable}
  placeholder="Edit your introduction"
  placeholderTextColor={"#686868"}
  multiline
  style={[
    styles.intorInput,
    { 
      // Start with minimum height, let it grow
      minHeight: hp("7%"),
      // Remove fixed height entirely for auto-sizing
      height: undefined,
      // Add maxHeight to prevent it from growing too large
      maxHeight: hp("80%")
    }
  ]}
/>

      <View style={styles.edContent}>
  <View style={styles.educationTitle}>
    <View>
      <Text style={styles.edTitle}>
        Educational Qualification
      </Text>
    </View>
    <View>
      {!isEditable && (
        <TouchableOpacity
          onPress={() => setIsEditable(true)}
          style={styles.edit}
        >
          <Pencil color="#000" />
        </TouchableOpacity>
      )}
    </View>
  </View>
  
  {/* First Qualification */}
  <View style={styles.educationItem}>
    <View style={{ flexDirection: "row", gap: wp("2.4%") }}>
      <View style={[styles.buldingIcon, { backgroundColor: "#f3e9ff" }]}> {/* Pinkish */}
        <Building size={wp("4.533%")} color="#A855F7" />
      </View>
      <View style={styles.edTitles}>
        <TextInput
          placeholder="Edit Subject Name"
          placeholderTextColor={"#475569"}
          value={qualifications[0]?.subject || ""}
          onChangeText={(text) => updateQualification(0, "subject", text)}
          editable={isEditable}
          style={styles.subjectInput}
        />
        <TextInput
          placeholder="Edit College Name"
          placeholderTextColor={"#475569"}
          value={qualifications[0]?.college || ""}
          onChangeText={(text) => updateQualification(0, "college", text)}
          editable={isEditable}
          style={styles.collegeInput}
        />
      </View>
    </View>
    <View style={styles.years}>
      <TextInput
        placeholder="Year - Year"
        placeholderTextColor={"#475569"}
        value={qualifications[0]?.year || ""}
        onChangeText={(text) => updateQualification(0, "year", text)}
        editable={isEditable}
        style={styles.year}
      />
    </View>
  </View>
  
  {/* First Qualification Errors */}
  <View style={styles.qualificationErrors}>
    {errors.qualification_subject_0?.trim() && (
      <Text style={[styles.errorText, styles.qualificationError]}>{errors.qualification_subject_0}</Text>
    )}
    {errors.qualification_college_0?.trim() && (
      <Text style={[styles.errorText, styles.qualificationError]}>{errors.qualification_college_0}</Text>
    )}
    {errors.qualification_year_0?.trim() && (
      <Text style={[styles.errorText, styles.qualificationError]}>{errors.qualification_year_0}</Text>
    )}
  </View>

  {/* Second Qualification */}
  <View style={styles.educationItem}>
    <View style={{ flexDirection: "row", gap: wp("2.4%") }}>
      <View style={[styles.buldingIcon, { backgroundColor: "#daeafe" }]}> {/* Blueish */}
        <Building size={wp("4.533%")} color="#3a82f6" />
      </View>
      <View style={styles.edTitles}>
        <TextInput
          placeholder="Edit Subject Name"
          placeholderTextColor={"#475569"}
          value={qualifications[1]?.subject || ""}
          onChangeText={(text) => updateQualification(1, "subject", text)}
          editable={isEditable}
          style={styles.subjectInput}
        />
        <TextInput
          placeholder="Edit College Name"
          placeholderTextColor={"#475569"}
          value={qualifications[1]?.college || ""}
          onChangeText={(text) => updateQualification(1, "college", text)}
          editable={isEditable}
          style={styles.collegeInput}
        />
      </View>
    </View>
    <View style={styles.years}>
      <TextInput
        placeholder="Year - Year"
        placeholderTextColor={"#475569"}
        value={qualifications[1]?.year || ""}
        onChangeText={(text) => updateQualification(1, "year", text)}
        editable={isEditable}
        style={styles.year}
      />
    </View>
  </View>

  {/* Third Qualification */}
<View style={styles.educationItem}>
  <View style={{ flexDirection: "row", gap: wp("2.4%") }}>
    <View style={[styles.buldingIcon, { backgroundColor: "#f3e9ff" }]}> {/* Blueish */}
      <Building size={wp("4.533%")} color="#A855F7" />
    </View>
    <View style={styles.edTitles}>
      <TextInput
        placeholder="Edit Subject Name"
        placeholderTextColor={"#475569"}
        value={qualifications[2]?.subject || ""}
        onChangeText={(text) => updateQualification(2, "subject", text)}
        editable={isEditable}
        style={styles.subjectInput}
      />
      <TextInput
        placeholder="Edit College Name"
        placeholderTextColor={"#475569"}
        value={qualifications[2]?.college || ""}
        onChangeText={(text) => updateQualification(2, "college", text)}
        editable={isEditable}
        style={styles.collegeInput}
      />
    </View>
  </View>
  <View style={styles.years}>
    <TextInput
      placeholder="Year - Year"
      placeholderTextColor={"#475569"}
      value={qualifications[2]?.year || ""}
      onChangeText={(text) => updateQualification(2, "year", text)}
      editable={isEditable}
      style={styles.year}
    />
  </View>
</View>

{/* Fourth Qualification */}
<View style={styles.educationItem}>
  <View style={{ flexDirection: "row", gap: wp("2.4%") }}>
    <View style={[styles.buldingIcon, { backgroundColor: "#daeafe" }]}> {/* Blueish */}
      <Building size={wp("4.533%")} color="#3a82f6" />
    </View>
    <View style={styles.edTitles}>
      <TextInput
        placeholder="Edit Subject Name"
        placeholderTextColor={"#475569"}
        value={qualifications[3]?.subject || ""}
        onChangeText={(text) => updateQualification(3, "subject", text)}
        editable={isEditable}
        style={styles.subjectInput}
      />
      <TextInput
        placeholder="Edit College Name"
        placeholderTextColor={"#475569"}
        value={qualifications[3]?.college || ""}
        onChangeText={(text) => updateQualification(3, "college", text)}
        editable={isEditable}
        style={styles.collegeInput}
      />
    </View>
  </View>
  <View style={styles.years}>
    <TextInput
      placeholder="Year - Year"
      placeholderTextColor={"#475569"}
      value={qualifications[3]?.year || ""}
      onChangeText={(text) => updateQualification(3, "year", text)}
      editable={isEditable}
      style={styles.year}
    />
  </View>
</View>
</View>
              </View>
            </View>
<View style={styles.categoryRow}>
  <Text style={styles.categoryLabel}>Category</Text>
  <View style={styles.categoryContainer}>
    <Picker
      mode={"dropdown"}
      selectedValue={selectedCategory}
      onValueChange={(itemValue) => {
        setSelectedCategory(itemValue);
        setSelectedBoard(null);
        setClasses([]);
        setSelectedClass(null);
        setSubject([]);
      }}
      style={styles.category}
    >
      <Picker.Item style={{ fontSize: wp("3.2%") }} label="Subject teacher" value="Subject teacher" />
      <Picker.Item style={{ fontSize: wp("3.2%") }} label="Skill teacher" value="Skill teacher" />
    </Picker>
  </View>
</View>
{errors.selectedCategory?.trim() && (
  <Text style={[styles.errorText, styles.categoryError]}>{errors.selectedCategory}</Text>
)}        

              {tuitions.slice(0, tuitionCount).map((tuition, index) => (
                <View key={index} style={styles.subjects}>
                  <View style={styles.educationDetailsTitle}>
                    <Text style={styles.tutionTitle}>
                      {index === 0 
                        ? "Subjects for Tuition" 
                        : `Subjects for Tuition`}
                    </Text>
                    <View style={styles.titleActions}>
                      {index === 0 && !isEditable && (
                        <TouchableOpacity
                          onPress={() => setIsEditable(true)}
                          style={styles.edit}
                        >
                        <Pencil color="#000" />
                        </TouchableOpacity>
                      )}
                    {index > 0 && isEditable && (
                      <TouchableOpacity
                        onPress={() => deleteTuition(index)}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={24} color="#c30707" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.classContainer}>
                  <Menubook size={wp("10.66%")} />
                  {selectedCategory === "Subject teacher" ? (
                      <View style={styles.classSubjectContainerInner}>
                    <Picker
                      selectedValue={
                        tuitions[index].subject && tuitions[index].class
                          ? `${tuitions[index].subject}__${tuitions[index].class}`
                          : ""
                      }
                      onValueChange={(itemValue) => {
                        const [subject, className] = itemValue.split("__");
                        const updatedTuition = [...tuitions];
                        updatedTuition[index].subject = subject;
                        updatedTuition[index].class = className;
                        setTuitions(updatedTuition);
                      }}
                      style={styles.classSubject}
                    >
                      <Picker.Item label="Select Subject-Class" value="" />
                      {subjectClassItems.map((item, i) => (
                        <Picker.Item
                          key={i}
                          label={item.label}
                          value={item.value}
                        />
                      ))}
                    </Picker>
                      </View>
                  ) : (
                      <View style={styles.classSubjectContainerInner}>
                    <Picker
                      selectedValue={tuitions[index].skill}
                      onValueChange={(value) =>
                        updateTuitionField(index, "skill", value)
                      }
                      style={styles.classSubject}
                    >
                      <Picker.Item label="Select Skill" value="" />
                      {skillItems.map((skill, i) => (
                        <Picker.Item
                          key={i}
                          label={skill.label}
                          value={skill.value}
                        />
                      ))}
                    </Picker>
                        </View>
                  )}
                </View>

                {errors[`tuition_${index}_skill`]?.trim() && (
                  <Text style={styles.errorText}>
                    {errors[`tuition_${index}_skill`]}
                  </Text>
                )}
                {errors[`tuition_${index}_class`]?.trim() && (
                  <Text style={styles.errorText}>
                    {errors[`tuition_${index}_class`]}
                  </Text>
                )}

                {/* Timing */}
                <View style={styles.timecontainer} pointerEvents="box-none">
                  <TouchableOpacity
                    // Replace these three onPress handlers:
                    onPress={() => {
                      setSelectedTimingIndex(index);
                      setTempDay(tuition.day);
                      setTempTimeFrom(tuition.timeFrom);
                      setTempTimeTo(tuition.timeTo);
                      setTimingModalVisible(true);
                      
                      // Load existing days when opening modal
                      if (tuition.day) {
                        // If there's a day saved, treat it as the first selected day
                        setSelectedDays([tuition.day]);
                      } else {
                        setSelectedDays([]);
                      }
                    }}
                    disabled={!isEditable}
                    style={styles.time}
                  >
                    <Text style={styles.timeTxt}>
                      {tuition.timeFrom ? tuition.timeFrom : "6:00 PM"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    // Replace these three onPress handlers:
                    onPress={() => {
                      setSelectedTimingIndex(index);
                      setTempDay(tuition.day);
                      setTempTimeFrom(tuition.timeFrom);
                      setTempTimeTo(tuition.timeTo);
                      setTimingModalVisible(true);
                      
                      // Load existing days when opening modal
                      if (tuition.day) {
                        // If there's a day saved, treat it as the first selected day
                        setSelectedDays([tuition.day]);
                      } else {
                        setSelectedDays([]);
                      }
                    }}
                    disabled={!isEditable}
                    style={styles.time}
                  >
                    <Text style={styles.timeTxt}>
                      {tuition.timeTo ? tuition.timeTo : "7:00 PM"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors[`tuition_${index}_timeFrom`]?.trim() && (
                  <Text style={styles.errorText}>
                    {errors[`tuition_${index}_timeFrom`]}
                  </Text>
                )}

{/* Charge & Day */}
<View style={styles.dateContainer}>
  <View style={styles.feesContainer}>
    <View style={styles.chargeInputContainer}>
      <Text style={styles.currencySymbol}>₹</Text>
      <TextInput
        value={tuition.charge || ''}
        onChangeText={(value) => {
          // Allow only numbers
          const numericValue = value.replace(/[^0-9]/g, '');
          updateTuitionField(index, "charge", numericValue || '');
        }}
        editable={isEditable}
        style={styles.chargeInput}
        placeholder="Charge"
        placeholderTextColor="#686868"
        keyboardType="numeric"
        maxLength={6}
      />
      <Text style={styles.chargeSuffix}>/pm</Text>
    </View>
  </View>
  
  {/* Day Display - Show all selected days as boxes */}
<View style={styles.selectedDaysDisplay}>
  {tuition.day ? (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.daysScrollView}
      contentContainerStyle={styles.selectedDaysContent}
    >
      {tuition.day.split(', ').map((day, index) => (
        <View key={index} style={styles.dayDisplayBox}>
          <Text style={styles.dayDisplayText}>
            {day.trim()}
          </Text>
        </View>
      ))}
    </ScrollView>
  ) : (
    <TouchableOpacity
      onPress={() => {
        setSelectedTimingIndex(index);
        setTempDay(tuition.day);
        setTempTimeFrom(tuition.timeFrom);
        setTempTimeTo(tuition.timeTo);
        setTimingModalVisible(true);
        
        if (tuition.day) {
          setSelectedDays([tuition.day]);
        } else {
          setSelectedDays([]);
        }
      }}
      disabled={!isEditable}
      style={styles.time}
    >
      <Text style={styles.timeDay}>Monday</Text>
    </TouchableOpacity>
  )}
</View>
</View>
    
                {errors[`tuition_${index}_charge`]?.trim() && (
                  <Text style={styles.errorText}>
                    {errors[`tuition_${index}_charge`]}
                  </Text>
                )}
                {errors[`tuition_${index}_day`]?.trim() && (
                  <Text style={styles.errorText}>
                    {errors[`tuition_${index}_day`]}
                  </Text>
                )}
              {selectedCategory === "Subject teacher" && (
  <View style={styles.boardContainer}>
    <Text style={styles.boardTitle}>Board</Text>
    <View style={styles.boardContainerInner}>
      <Picker
        selectedValue={tuitions[index].board}
        onValueChange={(value) => {
          setSelectedBoard(value);
          updateTuitionField(index, "board", value);
        }}
        style={styles.category}
      >
        <Picker.Item label="Select Board" value={null} style={{ color: "#00000" }} />
        {boardItems.map((board, boardIndex) => (
          <Picker.Item key={boardIndex} label={board.label} value={board.label} />
        ))}
      </Picker>
    </View>
  </View>
)}
{errors[`tuition_${index}_board`]?.trim() && (
  <Text style={[styles.errorText, styles.boardError]}>{errors[`tuition_${index}_board`]}</Text>
)}
                    {index === tuitionCount - 1 && tuitionCount < 100 && (
                      <TouchableOpacity onPress={addTuition} style={styles.addButton}>
                        <Text style={styles.addButtonText}>+ Add Another Tuition</Text>
                      </TouchableOpacity>
                    )}
              </View>
            ))}
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>
              Once you register, you will not be allowed to change the timing
              for the next 1 month
            </Text>
          </View>

         <View style={styles.modeContainer}>
  <Text style={styles.modeTitle}>I will teach</Text>
  <View style={styles.modeOptions}>
    {["Online", "Face to Face"].map((mode) => {
      const isSelected = teachingMode.includes(mode);
      return (
        <TouchableOpacity
          key={mode}
          onPress={() => {
            setTeachingMode((prev) =>
              isSelected
                ? prev.filter((m) => m !== mode)
                : [...prev, mode]
            );
          }}
          style={[
            styles.modeButton,
            isSelected && styles.selectedModeButton,
          ]}
        >
          <Text
            style={[
              styles.modeText,
              isSelected && styles.selectedModeText,
            ]}
          >
            {mode}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
</View>
{errors.teachingMode?.trim() && (
  <Text style={[styles.errorText, styles.modeError]}>{errors.teachingMode}</Text>
)}
          <View style={styles.workExperienceContainer}>
            <Text style={styles.workExperienceTitle}>
              Work Experience (optional)
            </Text>
          <View style={{ marginTop: hp("1.40%") }}>
  <View
    style={{
      minHeight: hp("6%"), // Minimum container height
      borderWidth: wp("0.22%"),
      borderColor: "#edeeee",
      borderRadius: wp("2.133%"),
      paddingTop: hp("1.480%"),
      paddingHorizontal: wp("3.46%"),
    }}
  >
    <TextInput
      value={workExperience}
      onChangeText={setWorkExperience}
      style={[
        styles.expInput,
        { 
          // Start with minimum height, let it grow
          minHeight: hp("10%"),
          // Remove fixed height entirely for auto-sizing
          height: undefined,
        }
      ]}
      placeholder="Add your Work Experience"
      multiline
    />
              </View>
            </View>
          </View>

<View style={styles.saveButtonContainer}>
  <TouchableOpacity 
    style={[
      styles.saveButton, 
      userStatus === "dormant" && styles.disabledButton
    ]} 
    onPress={handleSave}
    disabled={userStatus === "dormant"}
  >
    <Text style={styles.saveButtonText}>
      {isExistingProfile ? "Update" : "Save"}
    </Text>
  </TouchableOpacity>
  
  {userStatus === "dormant" && (
    <TouchableOpacity 
      style={styles.infoIconContainer}
      onPress={() => Alert.alert("Info", "Wait till account is active")}
    >
      <Feather name="info" size={24} color="black" />
    </TouchableOpacity>
  )}
</View>
{timingModalVisible && (
  <Modal
    animationType="slide"
    transparent={false}
    visible={timingModalVisible}
    onRequestClose={() => setTimingModalVisible(false)}
  >
    <View style={styles.modalFullScreen}>
      {/* Back Arrow */}
      <TouchableOpacity
        onPress={() => setTimingModalVisible(false)}
        style={styles.modalBackButton}
      >
        <BackArrowIcon />
      </TouchableOpacity>

      {/* Teacher Name */}
      <Text style={styles.modalHeaderTitle}>{teacherName}</Text>

      {/* Wrap content in ScrollView */}
      <ScrollView 
        style={styles.modalScrollView}
        contentContainerStyle={styles.modalScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.datecontent}>
          {/* Calendar Header */}
          <View style={styles.calendarDropdowns}>
            <Text style={styles.dateTitle}>Date</Text>
            {/* Custom Month Dropdown */}
            <TouchableOpacity 
              style={styles.customDropdown}
              onPress={() => setShowMonthPicker(!showMonthPicker)}
            >
              <Text style={styles.dropdownText}>
                {moment.monthsShort()[selectedMonthIndex]}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#000" />
            </TouchableOpacity>

            {/* Month Picker Modal */}
            <Modal
              visible={showMonthPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowMonthPicker(false)}
            >
              <TouchableOpacity 
                style={styles.monthModalContainer}
                activeOpacity={1}
                onPress={() => setShowMonthPicker(false)}
              >
                <View style={styles.monthModalContent}>
                  <Text style={styles.modalTitle}>Select Month</Text>
                  
                  <ScrollView style={styles.monthList}>
                    {moment.monthsShort().map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.monthItem,
                          index === selectedMonthIndex && styles.selectedMonthItem
                        ]}
                        onPress={() => {
                          setSelectedMonthIndex(index);
                          const newDate = moment(selectedDate || new Date())
                            .month(index)
                            .format("YYYY-MM-DD");
                          setSelectedDate(newDate);
                          setTempDay(moment(newDate).format("dddd"));
                          setShowMonthPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.monthText,
                          index === selectedMonthIndex && styles.selectedMonthText
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          {/* Day of Week Selection */}
          <View style={styles.daysOfWeekContainer}>
            <Text style={styles.daysOfWeekTitle}>Select Days</Text>
            <Text style={styles.daysOfWeekSubtitle}>Choose up to {maxDays} days</Text>
            
            <View style={styles.daysGrid}>
              {daysOfWeek.map((day) => {
                const isSelected = selectedDays.includes(day);
                const isDisabled = selectedDays.length >= maxDays && !isSelected;
                
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayOfWeekButton,
                      isSelected && styles.dayOfWeekButtonSelected,
                      isDisabled && styles.dayOfWeekButtonDisabled
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        // Remove day if already selected
                        setSelectedDays(selectedDays.filter(d => d !== day));
                      } else if (!isDisabled) {
                        // Add day if not at limit
                        setSelectedDays([...selectedDays, day]);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.dayOfWeekText,
                      isSelected && styles.dayOfWeekTextSelected,
                      isDisabled && styles.dayOfWeekTextDisabled
                    ]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Days Display */}
          <View style={styles.selectedDaysContainer}>
            <Text style={styles.selectedDaysTitle}>
              Selected Days ({selectedDays.length}/{maxDays})
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.daysScrollView}
              contentContainerStyle={styles.daysScrollContent}
            >
              {selectedDays.map((day, index) => (
                <View key={day} style={styles.dayBox}>
                  <Text style={styles.dayBoxText}>
                    {day}
                  </Text>
                  <TouchableOpacity 
                    style={styles.removeDayButton}
                    onPress={() => {
                      setSelectedDays(selectedDays.filter(d => d !== day));
                    }}
                  >
                    <Text style={styles.removeDayText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {selectedDays.length === 0 && (
                <Text style={styles.noDaysText}>No days selected. Tap on days above to select.</Text>
              )}
            </ScrollView>
          </View>
        </View>

        <View style={styles.timeCnt}>
          <Text style={styles.timeSlotTitle}>Start Time</Text>
          <View style={styles.timeSlotContainer}>
            {[
              ["07:00", "08:00", "09:00", "10:00"],
              ["11:00", "12:00", "13:00", "14:00"], 
              ["15:00", "16:00", "17:00", "18:00"],
              ["19:00", "20:00", "21:00", "22:00"]
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.timeSlotRow}>
                {row.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => {
                      setTempTimeFrom(slot);
                    }}
                    style={[
                      styles.timeSlotButton,
                      tempTimeFrom === slot && styles.timeSlotSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        tempTimeFrom === slot && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          <Text style={[styles.timeSlotTitle, { marginTop: hp('3%') }]}>End Time</Text>
          <View style={styles.timeSlotContainer}>
            {[
              ["07:00", "08:00", "09:00", "10:00"],
              ["11:00", "12:00", "13:00", "14:00"], 
              ["15:00", "16:00", "17:00", "18:00"],
              ["19:00", "20:00", "21:00", "22:00"]
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.timeSlotRow}>
                {row.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => {
                      setTempTimeTo(slot);
                    }}
                    style={[
                      styles.timeSlotButton,
                      tempTimeTo === slot && styles.timeSlotSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        tempTimeTo === slot && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => {
          if (selectedTimingIndex !== null && selectedDays.length > 0) {
            // Validate time range
            if (!validateTimeRange()) {
              Alert.alert("Invalid Time Range", "End time must be after start time.");
              return;
            }
            
            const updated = [...tuitions];
            
            // Store all selected days as comma separated string for backend
            updated[selectedTimingIndex].day = selectedDays.join(', ');
            updated[selectedTimingIndex].timeFrom = tempTimeFrom;
            updated[selectedTimingIndex].timeTo = tempTimeTo;
            
            setTuitions(updated);
            setTimingModalVisible(false);
          } else if (selectedDays.length === 0) {
            Alert.alert("No Days Selected", "Please select at least one day");
          }
        }}
      >
        <Text style={styles.confirmButtonText}>
          Confirm {selectedDays.length > 0 ? `(${selectedDays.length} days)` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  </Modal>
)}

          <Modal
            animationType="slide"
            transparent
            visible={imageModalVisible}
            onRequestClose={() => setImageModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Choose Profile Picture</Text>
                <>
                <TouchableOpacity style={styles.modalButton} onPress={handleCamera}>
                  <Text style={styles.modalButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleGallery}
                >
                  <Text style={styles.modalButtonText}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setImageModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                </>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  selectedDaysDisplay: {
  flex: 1,
  minHeight: hp('6%'),
},
selectedDaysContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: wp('2%'),
},
dayDisplayBox: {
  minHeight: hp('5.6%'),
  borderWidth: wp('0.22%'),
  paddingHorizontal: wp('2.13%'),
  borderColor: '#d1d5db',
  borderRadius: 4,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  minWidth: wp('25%'),
},
dayDisplayText: {
  fontSize: wp('3.5%'),
  fontWeight: '400',
  lineHeight: hp('3.23%'),
  textAlign: 'center',
  color: '#000',
},
  daysOfWeekContainer: {
  marginTop: hp('2%'),
  borderWidth: wp('0.3%'),
  borderColor: '#dedede',
  borderRadius: wp('2%'),
  padding: wp('3%'),
  backgroundColor: '#f9f9f9',
},
daysOfWeekTitle: {
  fontSize: wp('4%'),
  fontWeight: '600',
  color: '#030303',
  marginBottom: hp('0.5%'),
},
daysOfWeekSubtitle: {
  fontSize: wp('3.2%'),
  color: '#666',
  marginBottom: hp('1.5%'),
},
daysGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: wp('1.5%'),
},
dayOfWeekButton: {
  width: wp('12%'),
  height: wp('12%'),
  borderRadius: wp('2%'),
  backgroundColor: '#ffffff',
  borderWidth: wp('0.3%'),
  borderColor: '#dedede',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: hp('1%'),
},
dayOfWeekButtonSelected: {
  backgroundColor: '#ffffff',
  borderColor: '#ffffff',
},
dayOfWeekButtonDisabled: {
  backgroundColor: '#f0f0f0',
  borderColor: '#e0e0e0',
  opacity: 0.5,
},
dayOfWeekText: {
  fontSize: wp('3.2%'),
  fontWeight: '600',
  color: '#333',
},
dayOfWeekTextSelected: {
  color: '#ffffff',
},
dayOfWeekTextDisabled: {
  color: '#999',
},
selectedDaysContainer: {
  marginTop: hp('2%'),
  borderWidth: wp('0.3%'),
  borderColor: '#dedede',
  borderRadius: wp('2%'),
  padding: wp('3%'),
  backgroundColor: '#f9f9f9',
},
selectedDaysTitle: {
  fontSize: wp('3.8%'),
  fontWeight: '600',
  color: '#2e8040ff',
  marginBottom: hp('1.5%'),
},
daysScrollContent: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: wp('2%'),
  paddingVertical: wp('1%'),
},
daysScrollView: {
  maxHeight: hp('10%'),
},
daysContainer: {
  flexDirection: 'row',
  gap: wp('2%'),
},
dayBox: {
  minWidth: wp('15%'),
  height: wp('12%'),
  backgroundColor: '#5f5fff',
  borderRadius: wp('2%'),
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: wp('3%'),
  position: 'relative',
  marginTop: wp('4%'),
},
dayBoxText: {
  color: '#ffffff',
  fontSize: wp('3.5%'),
  fontWeight: '600',
},
removeDayButton: {
  position: 'absolute',
  top: -wp('1.5%'),
  right: -wp('1.5%'),
  backgroundColor: '#ff4444',
  width: wp('5%'),
  height: wp('5%'),
  borderRadius: wp('2.5%'),
  justifyContent: 'center',
  alignItems: 'center',
},
removeDayText: {
  color: '#ffffff',
  fontSize: wp('3%'),
  fontWeight: 'bold',
  lineHeight: wp('3.5%'),
},
noDaysText: {
  fontSize: wp('3.5%'),
  color: '#666',
  fontStyle: 'italic',
  textAlign: 'center',
  width: '100%',
  padding: wp('3%'),
},
  timeSlotContainer: { 
  flexDirection: "column",
  justifyContent: "center", 
  alignItems: "center",
  paddingHorizontal: wp("2%"),
  paddingVertical: hp("2%"),
  gap: hp("1.5%")
},
timeSlotRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  gap: wp("2%")
},
timeSlotButton: { 
  flex: 1,
  minHeight: hp("6%"),
  maxHeight: hp("7%"),
  alignItems: "center", 
  justifyContent: "center", 
  borderRadius: wp("2%"), 
  borderWidth: wp("0.3%"), 
  borderColor: "#dedede",
  backgroundColor: "#ffffff",
  paddingVertical: hp("1%"),
  paddingHorizontal: wp("1%")
},
timeSlotSelected: { 
  backgroundColor: "#f5b726",
  borderColor: "#f5b726"
},
timeSlotText: { 
  color: "#000", 
  fontWeight: "600", 
  fontSize: wp("3.5%"),
  textAlign: "center"
},
timeSlotTextSelected: { 
  color: "#000", 
  fontWeight: "600", 
  fontSize: wp("3.5%"),
  textAlign: "center"
},
  modalFullScreen: { 
  flex: 1, 
  backgroundColor: "#fff", 
  paddingHorizontal: wp("6.4%"), 
  paddingTop: hp("4.30%"), 
  paddingBottom: hp("4%") 
},
modalScrollView: {
  flex: 1,
},
modalScrollContent: {
  paddingBottom: hp("10%"), // Add padding for the fixed button
},
dateTitle: {
  fontSize: wp(isTablet ? "2.9%" : "4.266%"),
  fontWeight: "600",
  color: "#030303",
},
confirmButton: { 
  backgroundColor: "#5f5fff", 
  paddingVertical: 14, 
  borderRadius: 4, 
  alignItems: "center", 
  justifyContent: "center", 
  width: "100%", 
  alignSelf: "center", 
  minHeight: hp("7%"), 
  position: "absolute", 
  bottom: hp("2%"), 
  left: wp("6.4%"), 
  right: wp("6.4%") 
},
dayBoxMonth: {
  color: '#ffffff',
  fontSize: wp('2.8%'),
  marginTop: hp('0.5%'),
},
  nameSection: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: "center", width: '100%' },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: '100%', marginBottom: hp('-0.5%'), gap: 10 },
  universityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: '100%', paddingHorizontal: wp('8%'), paddingBottom: hp('0.2%') },
  teacherName: { fontSize: wp("6%"), lineHeight: hp("4%"), fontWeight: "700", color: "#FFF", fontFamily: "OpenSans_500Medium", includeFontPadding: false, textAlignVertical: 'center' },
  rating: { backgroundColor: "#fff7ed", paddingHorizontal: wp("2%"), paddingVertical: hp("0.2%"), borderRadius: wp("10%"), alignItems: "center", justifyContent: "center" },
  ratingtxt: { fontSize: wp("3.8%"), lineHeight: hp("2.8%"), color: "#4255ff", fontFamily: "OpenSans_400Regular", includeFontPadding: false, textAlignVertical: 'center', fontWeight: '600' },
  universityInput: { fontSize: wp("3.5%"), textAlign: "center", lineHeight: hp("2.8%"), color: "#ffffff", includeFontPadding: false, marginLeft: wp('2%') },
  editUniversity: { padding: 5, borderRadius: 50, backgroundColor: "#f5f6f8", width: wp("6.933%"), height: wp("6.933%"), alignItems: "center", justifyContent: "center" },
  profileContainer: { minHeight: hp("55%"), backgroundColor: "#5f5fff", borderBottomLeftRadius: 50, borderBottomRightRadius: 50, padding: wp('6%'), justifyContent: "space-between", alignItems: "center", position: "relative" },
  container: { flex: 1, backgroundColor: "#FFF", alignItems: "center", justifyContent: 'flex-start' },
  scrollContainer: { width: "100%", marginBottom: 50, flexGrow: 1 },
  backButton: { position: "absolute", top: hp("6%"), left: wp("6%"), backgroundColor: "#f5f6f8", borderRadius: 100, height: wp("12%"), width: wp("12%"), justifyContent: "center", alignItems: "center", zIndex: 10 },
  imageContainer: { width: wp("75%"), aspectRatio: 1, alignItems: "center", justifyContent: "center", marginTop: hp("5%"), marginBottom: hp("2%"), borderRadius: wp("75%") },
  profileImage: { width: "100%", height: "100%", borderRadius: wp("75%"), borderWidth: wp("0.4%"), borderColor: "#FFF", backgroundColor: "#ffffff" },
  placeholder: { width: "100%", height: "100%", borderRadius: wp("75%"), borderWidth: wp("1.5%"), borderColor: "#FFF", backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: wp('5%') },
  uploadIcon: { width: wp('15%'), height: wp('15%'), resizeMode: "contain", marginBottom: hp('1%') },
  uploadTxt: { fontSize: wp("3.5%"), color: "#777", textAlign: "center", fontWeight: '500' },
  infoContainer: { paddingHorizontal: wp("1.7%"), paddingVertical: wp("2.2%") },
  introContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: hp('1%'),
  minHeight: hp('6%'), // Ensure minimum height
},
  feildsContainer: { borderWidth: wp("0.22%"), borderColor: "#edeeee", borderRadius: 10, padding: wp('3%'), minHeight: hp('20%') },
  intorInput: { fontSize: wp("4%"), borderWidth: wp("0.22%"), lineHeight: hp("3%"), borderColor: "#ccc", borderRadius: wp("2.66%"), padding: wp("3%"), minHeight: hp("15%"), textAlignVertical: "top", backgroundColor: "#fff", includeFontPadding: false },
  educationDetailsTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: hp("3.1%") },
  edContent: { flexDirection: "column", alignItems: "center", marginTop: hp("2.11%") },
  educationTitle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: hp("1.480%") },
  edTitle: { fontSize: wp("4.533%"), lineHeight: hp("3.09%"), fontWeight: "500", color: "#000" },
educationItem: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "center", 
  width: "100%",
  marginBottom: hp("-1.5%"), // Changed to NEGATIVE value to reduce space
  paddingVertical: 0, // Remove vertical padding
},
  // educationItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 5, width: "100%" },
  buldingIcon: { width: wp("9.6%"), height: wp("9.6%"), borderRadius: "50%", backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  edTitles: { marginLeft: 10, flexDirection: "column", gap: 5 },
  subjectInput: { color: "#0f172a", fontSize: wp("3.773%"), lineHeight: hp("2.691%"), opacity: 0.95, width: width * 0.4, top: hp("-1.3%") },
  collegeInput: { color: "#0f172a", fontSize: wp("3.2%"), lineHeight: hp("2.691%"), opacity: 0.95, top: hp("-4.8%") },
  years: { alignContent: "center", justifyContent: "center" },
  year: { textAlign: "right", fontSize: wp("3.2%"), lineHeight: hp("2.691%"), opacity: 0.95, top: hp("-3%") },
  edit: { alignItems: "center", justifyContent: "center", padding: 5, borderRadius: "50%", backgroundColor: "#f2f4f7", height: wp("10.66%"), width: wp("10.66%") },
  categoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  categoryLabel: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  categoryContainer: { borderWidth: wp("0.566%"), borderColor: "#71d561", borderRadius: 4, width: wp("49%"), height: hp("6.8%"), justifyContent: "center" },
  category: { borderRadius: 4, borderColor: "#71d561", boxSizing: "border-box", alignItems: "center", justifyContent: "center", width: wp("48%"), height: hp("7.6%"), borderWidth: wp("0.266%"), fontSize: hp("1.2%"), fontWeight: "600", backgroundColor: 'transparent', color: '#030303' },
  subjects: { width: '100%', paddingHorizontal: wp('5%'), marginTop: hp('2%'), alignItems: 'center' },
  tutionTitle: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  titleActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: wp('2%') },
  classContainer: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 20 },
  classSubject: { width: wp("61.86%"), height: hp("6.912%"), borderWidth: wp("0.22%"), borderRadius: wp("0.44%"), borderColor: "#d1d5db", backgroundColor: "transparent", fontSize: hp("1.2%"), fontWeight: "600", color: "#030303" },
  classSubjectContainerInner: { borderWidth: wp("0.22%"), borderColor: "#d1d5db", borderRadius: 4, width: wp("70%"), height: hp("5.6%"), justifyContent: "center", backgroundColor: "transparent" },
  timecontainer: { flexDirection: "row", justifyContent: "flex-end", gap: 15, marginTop: 15, marginRight: wp("-27%") },
  time: { minHeight: hp("5.6%"), borderWidth: wp("0.22%"), paddingHorizontal: wp("2.13%"), borderColor: "#d1d5db", borderRadius: 4, width: wp("25%"), alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  timeTxt: { backgroundColor: "#fff", fontSize: wp("4%"), fontWeight: "600", lineHeight: hp("3.23%"), alignItems: "center", justifyContent: "center" },
  timeDay: { backgroundColor: "#fff", fontSize: wp("3.5%"), fontWeight: "400", lineHeight: hp("3.23%"), textAlign: "center" },
  dateContainer: { flexDirection: "row", justifyContent: "flex-end", gap: 20, marginTop: 15, left: wp("4.7%") },
  boardContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  boardTitle: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  boardContainerInner: { borderWidth: wp("0.22%"), borderColor: "#d1d5db", borderRadius: 4, width: wp("58.86%"), height: hp("5.6%"), justifyContent: "center", backgroundColor: "transparent", left: wp("5.033%") },
  // feesContainer: { borderWidth: wp("0.22%"), borderColor: "#d1d5db", borderRadius: 4, width: wp("35"), height: hp("5.6%"), justifyContent: "center", backgroundColor: "transparent", color: "#030303" },
  // chargeInput: { width: '100%', height: '100%', fontSize: wp('3.5%'), color: '#030303', textAlign: 'center', padding: 0, fontWeight: "400", backgroundColor: 'transparent' },
  noticeContainer: { marginTop: hp("2.633%"), paddingHorizontal: wp("6.4%") },
  noticeText: { color: "red", fontSize: wp("3.733%"), fontWeight: "500", textAlign: "center", opacity: 0.74 },
  modeContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: hp("1.615%") },
  modeTitle: { color: "#000000", fontSize: wp("3.46%"), lineHeight: hp("2.557%"), fontWeight: "600", fontFamily: "OpenSans_400Regular" },
  modeOptions: { flexDirection: "row", gap: wp("5.866%"), alignItems: "center", paddingVertical: 10 },
  modeButton: { width: wp("24%"), height: hp("4.41%"), borderRadius: 3, backgroundColor: "#ffffff", marginHorizontal: 5, borderWidth: wp("0.22%"), borderColor: "#ff000f", alignItems: "center", justifyContent: "center" },
  selectedModeButton: { borderWidth: wp("0.22%"), borderColor: "#26cb63", color: "#000000" },
  modeText: { color: "#000000", fontWeight: "500", fontSize: wp("3.7%") },
  selectedModeText: { color: "#000000", fontWeight: "500", fontSize: wp("4%") },
  workExperienceContainer: { marginTop: hp("2.633%"), paddingHorizontal: wp("5.33%") },
  workExperienceTitle: { fontSize: wp("3.733%"), color: "#000000", opacity: 0.74, lineHeight: hp("3.36%") },
  expInput: { height: "95%", borderRadius: wp("2.133%"), padding: wp("2.17%"), fontSize: wp("4.26%"), lineHeight: hp("2.557%"), color: "#686868", fontWeight: "400", textAlignVertical: "top", textAlign: "left" },
  saveButton: { minWidth: wp("40%"), minHeight: hp("7%"), marginTop: 40, marginBottom: 60, backgroundColor: "#5f5fff", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: "center", alignSelf: "center", justifyContent: "center" },
  saveButtonText: { color: "#fff", fontSize: wp("4.266%"), fontWeight: "bold" },
  addButton: { marginTop: hp('2%'), padding: wp('3%'), backgroundColor: '#5f5fff', borderRadius: wp('2%'), alignItems: 'center', alignSelf: 'center', minWidth: wp('45%'), minHeight: hp('5%') },
  addButtonText: { color: '#fff', fontSize: wp('3.5%'), fontWeight: '600' },
  deleteButton: { padding: wp('1%'), borderRadius: wp('1%'), justifyContent: 'center', alignItems: 'center', width: wp('20%'), height: wp('20%') },
  // errorText: { color: "#ff4d4d", fontSize: wp("3%"), marginBottom: 6, marginTop: 2, fontWeight: "bold" },
  timeCnt: { 
  borderWidth: wp("0.3%"), 
  borderColor: "#dedede", 
  marginTop: hp("2%"), 
  minHeight: hp("35%"),
  borderRadius: wp("2%"),
  backgroundColor: "#ffffff"
},
chargePicker: {
  backgroundColor: 'transparent',
},


introductionHeading: {
  fontWeight: "500",
  color: "#162e54",
  fontFamily: "OpenSans_500Medium",
  fontSize: wp("3.98%"),
  lineHeight: hp("5.2%"), // Increased line height
  includeFontPadding: false,
  textAlignVertical: 'center'
},
introError: {
  marginTop: hp('1%'),
  marginLeft: wp('1%'),
},
categoryError: {
  marginTop: hp('1%'),
  textAlign: 'center',
},
boardError: {
  marginTop: hp('0.5%'),
  textAlign: 'center',
},
modeError: {
  marginTop: hp('1%'),
  textAlign: 'center',
},
errorText: {
  color: "#ff4d4d",
  fontSize: wp("3%"),
  fontWeight: "bold",
  marginHorizontal: wp('2%'),
},


feesContainer: { 
  borderWidth: wp("0.22%"), 
  borderColor: "#d1d5db", 
  borderRadius: 4, 
  width: wp("35%"), 
  height: hp("5.6%"), 
  justifyContent: "center", 
  backgroundColor: "transparent",
},
chargeInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // Center everything
  paddingHorizontal: wp('1.5%'),
  height: '100%',
},
currencySymbol: {
  fontSize: wp('3.5%'),
  color: '#030303',
  fontWeight: '600',
  marginRight: wp('0.5%'), // Small space for ₹
},
chargeInput: {
  fontSize: wp('3.8%'),
  color: '#030303',
  fontWeight: '600',
  backgroundColor: 'transparent',
  textAlign: 'center',
  minWidth: wp('8%'), // Very small minimum width
  maxWidth: wp('20%'), // Maximum width to prevent overflow
  includeFontPadding: false,
  textAlignVertical: 'center',
  paddingHorizontal: 0, // No horizontal padding
  marginHorizontal: wp('0.5%'), // Small margins on both sides
},
chargeSuffix: {
  fontSize: wp('3%'),
  color: '#030303',
  fontWeight: '600',
  marginLeft: wp('0.5%'), // Small space for /pm
},
  calendarContainer: { width: '100%', height: hp('43%'), paddingHorizontal: 0, paddingVertical: 0, marginVertical: 0 },
  datecontent: { borderWidth: wp("0.22%"), borderColor: "#dedede", marginTop: hp("2.96%"), borderRadius: wp("0.88%"), padding: wp("4.2%"), minHeight: hp("45%") },
  customDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#dedede', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', width: wp('35%'), minHeight: hp('5%') },
  dropdownText: { fontSize: wp('3.5%'), color: '#000000', fontWeight: '500' },
  monthModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  monthModalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '80%', maxHeight: '60%' },
  modalTitle: { fontSize: wp('4%'), fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  monthList: { maxHeight: hp('30%') },
  monthItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  selectedMonthItem: { backgroundColor: '#5f5fff' },
  monthText: { fontSize: wp('3.8%'), color: '#000000' },
  selectedMonthText: { color: '#ffffff', fontWeight: 'bold' },
  closeButton: { marginTop: 15, backgroundColor: '#5f5fff', paddingVertical: 12, borderRadius: 5, alignItems: 'center' },
  closeButtonText: { color: 'white', fontSize: wp('3.8%'), fontWeight: 'bold' },
  calendarDropdowns: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timeSlotTitle: { fontSize: wp("4.22%"), textAlign: "left", marginTop: hp("2.153%"), marginLeft: wp("4.22%"), color: "#030303", fontWeight: "600", lineHeight: hp("2.69%") },
  modalHeaderTitle: { marginTop: hp("6%"), fontSize: wp("4.5%"), color: "#030303", fontWeight: "400", textAlign: "left" },
  confirmButtonText: { color: "#fff", fontSize: wp("4.22%"), fontWeight: "600" },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },
  modalView: { backgroundColor: "white", borderRadius: 10, padding: 20, width: "100%", height: "100%", alignItems: "center" },
  modalButton: { backgroundColor: "#5f5fff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginVertical: 5, width: "100%", alignItems: "center" },
  modalButtonText: { color: "#fff", fontSize: 16 },
  cancelButton: { backgroundColor: "#ddd" },
  cancelButtonText: { color: "#000" },
  modalBackButton: { position: "absolute", top: hp("5%"), left: wp("5%"), zIndex: 1000, backgroundColor: "#f5f6f8", borderRadius: 100, height: wp("7.46%"), width: wp("7.46%"), justifyContent: "center", alignItems: "center" },
  uploadContainer: { width: 70, height: 66, borderWidth: 1, borderRadius: 10, borderColor: "rgba(0,0,0,0.25)", boxSizing: "border-box", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  timeSlotDisabled: {
  backgroundColor: "#f0f0f0",
  borderColor: "#d9d9d9",
},
timeSlotTextDisabled: {
  color: "#999",
},
qualificationErrors: {
  width: '100%',
  marginBottom: hp('1%'),
  paddingLeft: wp('15%'),
},
qualificationError: {
  marginTop: hp('0.3%'),
  marginBottom: hp('0.3%'),
  textAlign: 'left',
},
disabledButton: {
  backgroundColor: "#cccccc",
  opacity: 0.6,
},
disabledText: {
  color: "#ff4444",
  fontSize: wp("2.5%"),
  textAlign: "center",
  marginTop: hp("0.5%"),
  fontWeight: "bold",
},
saveButtonContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 40,
  marginBottom: 60,
  gap: wp('2%'),
},
infoIconContainer: {
  padding: wp('1%'),
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
},
loadingText: {
  marginTop: 10,
  fontSize: 16,
  color: '#5B7FFF',
  fontFamily: 'OpenSans-Regular',
},
});
