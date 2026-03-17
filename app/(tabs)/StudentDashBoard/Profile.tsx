import { OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { Poppins_600SemiBold, useFonts } from "@expo-google-fonts/poppins";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import BackButton from "../../../components/BackButton";
import BookOpenReaderIcon from "../../../assets/svgIcons/BookOpenReader";
import CakeIcon from "../../../assets/svgIcons/CakeIcon";
import DangerousIcon from "../../../assets/svgIcons/Dangerous";
import DriverUpload from "../../../assets/svgIcons/DriverUpload";
import Map from "../../../assets/svgIcons/Map";
import PhoneIcon from "../../../assets/svgIcons/PhoneIcon";
import SchoolIcon from "../../../assets/svgIcons/SchoolIcon";
import { BASE_URL } from "../../../config";
import { db } from "../../../firebaseConfig";
import { getAuthData } from "../../../utils/authStorage";
import Pencil from "../../../assets/svgIcons/Pencil";
import { Entypo, Ionicons, FontAwesome6, FontAwesome } from "@expo/vector-icons";

interface FormErrors {
  studentName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  educationBoard?: string;
  instituteName?: string;
  preferredMedium?: string;
  classYear?: string;
  pincode?: string;
}

const { width, height } = Dimensions.get("window");

// Responsive breakpoints
const isWeb = Platform.OS === 'web';
const isLargeScreen = isWeb && width >= 768;
const isMobile = !isLargeScreen;

const calculateAge = (dateOfBirth: string): string => {
  try {
    const [day, month, year] = dateOfBirth.split('/');
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'N/A';
  }
};

export default function Profile() {
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const { userType, userEmail } = useLocalSearchParams<{
    userType: string;
    userEmail: string;
  }>();
  const [studentName, setStudentName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dateOfBirth, setDateofBirth] = useState("");
  const [educationBoard, setEducationBoard] = useState("");
  const [category, setCategory] = useState(userType || "");
  const [instituteName, setInstituteName] = useState("");
  const [preferredMedium, setPreferredMedium] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("");
  const [classYear, setClassYear] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [boards, setBoards] = useState<Array<{boardName: string, boardId?: string}>>([]);
  const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (previewModalVisible) {
          setPreviewModalVisible(false);
          return true;
        }
        if (modalVisible) {
          setModalVisible(false);
          return true;
        }
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [router, previewModalVisible, modalVisible])
  );

  let [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    OpenSans_600SemiBold,
  });

  const validateForm = () => {
    const newErrors: FormErrors = {};
  
    if (!studentName.trim()) newErrors.studentName = "Name is required.";
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = "Phone number must be 10 digits.";
    
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Please enter a valid email.";
    
    if (!dateOfBirth.trim()) newErrors.dateOfBirth = "Date of Birth is required.";
    if (!educationBoard.trim()) newErrors.educationBoard = "Board is required.";
    if (!instituteName.trim()) newErrors.instituteName = "Institute Name is required.";
    if (!preferredMedium.trim()) newErrors.preferredMedium = "Medium is required.";
    if (!classYear) newErrors.classYear = "Class is required.";
    if (pincode && !/^\d{6}$/.test(pincode)) newErrors.pincode = "Pincode must be 6 digits.";
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString("en-GB");
      console.log("📅 Selected:", formattedDate);
      setDateofBirth(formattedDate);
    }
    setShowPicker(false);
  };

  const fetchProfileAndBoards = async () => {
    try {
      const auth = await getAuthData();
      
      if (!auth || !auth.token) {
        console.error("No authentication data found");
        Alert.alert("Error", "Please login again");
        return;
      }
      console.log("auth", auth.email);
      const role = auth.role;
      const loggedInEmail = auth.email;
      const token = auth.token;
      console.log("token", token);
      
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${BASE_URL}/api/sudentProfile`,
        { email: loggedInEmail },
        { headers }
      );
      console.log("res", response.data);

      const {
        name,
        email,
        phone,
        profileimage,
        dateOfBirth,
        educationBoard,
        instituteName,
        preferredMedium,
        fullAddress,
        stateName,
        pincode,
        country,
        classYear,
      } = response.data;

      setStudentName(name || "");
      setEmail(email || "");
      setPhone(phone || "");
      setProfileImage(profileimage || null);
      setDateofBirth(dateOfBirth || "");
      setEducationBoard(educationBoard || "");
      setInstituteName(instituteName || "");
      setPreferredMedium(preferredMedium || "");
      setFullAddress(fullAddress || "");
      setStateName(stateName || "");
      setPincode(pincode || "");
      setCountry(country || "");
      setClassYear(classYear || "");

      console.log("Making API call to:", `${BASE_URL}/api/allboards`);
      try {
        const boardsResponse = await axios.post(
          `${BASE_URL}/api/allboards`,
          { category: "student" },
          { headers }
        );

        console.log("Boards API raw data:", boardsResponse.data);
        
        const boardsData = Array.isArray(boardsResponse.data) ? boardsResponse.data : [];
        
        const formattedBoards = boardsData
          .map((board: any) => ({
            boardName: board.boardName,
            boardId: board.boardId
          }))
          .filter(board => board.boardName);

        console.log("Formatted boards:", formattedBoards);
        setBoards(formattedBoards);
        
      } catch (boardsError) {
        console.log("Boards not available, using default boards");
        const defaultBoards = [
          { boardName: 'CBSE', boardId: 'board_cbse' },
          { boardName: 'ICSE', boardId: 'board_icse' },
          { boardName: 'State Board', boardId: 'board_state' }
        ];
        setBoards(defaultBoards);
      }
      
    } catch (error) {
      console.error("Error fetching profile from backend:", error);
      Alert.alert("Error", "Failed to load profile. Please try again later.");
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      await fetchProfileAndBoards();
      setIsLoading(false);
    };

    initializePage();
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5f5fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const uploadImageToS3AndUpdateProfile = async (uri: string) => {
    console.log("🚀 Uploading image to S3...");
    const auth = await getAuthData();
    try {
      const auth = await getAuthData();
      if (!auth || !auth.token) {
        throw new Error("User not authenticated");
      }

      const formData = new FormData();
      const filename = `profile_${Date.now()}.jpg`;

      if (Platform.OS === "web") {
        console.log("🌐 Platform is Web. Converting blob URI to File...");
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type });
        formData.append("profileimage", file);
      } else {
        const match = /\.(\w+)$/.exec(uri.split("/").pop() ?? "");
        const ext = match?.[1];

        const imageFile = {
          uri,
          name: filename,
          type: 'image/jpeg',
        } as any;
        formData.append("profileimage", imageFile);
      }

      formData.append("email", email || "");
      formData.append("name", studentName || "");
      formData.append("dateofBirth", dateOfBirth || "");
      formData.append("educationBoard", educationBoard || "");
      formData.append("instituteName", instituteName || "");
      formData.append("classYear", classYear || "");
      formData.append("preferredMedium", preferredMedium || "");
      formData.append("phone_number", phone || "");
      formData.append("fullAddress", fullAddress || "");
      formData.append("stateName", stateName || "");
      formData.append("pincode", pincode || "");
      formData.append("country", country || "");

      const token = auth.token;
      
      return await fetch(
        `${BASE_URL}/api/updateStudentProfileWithImage`, {
          method: "POST", 
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).then(async res => {
        const data = await res.json();
        if (res.status !== 200) {
          throw new Error("Failed to upload profile to S3/backend");
        }
        console.log("✅ Profile updated successfully", data.imageUrl);
        return data.imageUrl;
      }).catch(err => console.log("Upload err:",JSON.stringify(err)));

    } catch (error) {
      console.error("❌ Error uploading to S3 and updating profile:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    try {
      console.log("Profile:",profileImage)
      if (
          profileImage &&
          (profileImage.startsWith("file://") || profileImage.startsWith("blob:"))
      ) {
        let imageUrl = await uploadImageToS3AndUpdateProfile(profileImage);
        console.log("imageUrl", imageUrl);
        await setDoc(doc(db, "users", email), {
          name: studentName,
          email,
          phone,
          profileImage: imageUrl,
        });
        await AsyncStorage.setItem("studentName", studentName);
        await AsyncStorage.setItem("email", email);
        await AsyncStorage.setItem("phone", phone);

        router.push({
          pathname: "/(tabs)/StudentDashBoard/Student",
          params: {
            userType: userType || "student",
            userEmail: email,
            studentName,
            phone
          },
        });
        return;
      }

      await setDoc(doc(db, "users", email), {
        name: studentName,
        email,
        phone
      });
      
      const formData = new FormData();
      formData.append("email", email || "");
      formData.append("name", studentName || "");
      formData.append("dateofBirth", dateOfBirth || "");
      formData.append("educationBoard", educationBoard || "");
      formData.append("instituteName", instituteName || "");
      formData.append("classYear", classYear || "");
      formData.append("preferredMedium", preferredMedium || "");
      formData.append("phone_number", phone || "");
      formData.append("fullAddress", fullAddress || "");
      formData.append("stateName", stateName || "");
      formData.append("pincode", pincode || "");
      formData.append("country", country || "");
      
      const auth = await getAuthData();
      // @ts-ignore
      const token = auth.token;
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      
      let object : any = {};
      formData.forEach(function(value, key: any){
        object[key] = value;
      });

      const response = await axios.post(
          `${BASE_URL}/api/updateStudentProfile`,
          object,
          { headers }
      );

      if (response.status !== 200) {
        throw new Error("Updated student profile");
      }

      console.log("✅ Profile updated successfully:", response.data);

      await AsyncStorage.setItem("studentName", studentName);
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("phone", phone);

      router.push({
        pathname: "/(tabs)/StudentDashBoard/Student",
        params: {
          userType: userType || "student",
          userEmail: email,
          studentName,
          phone
        },
      });
    } catch (error) {
      console.error("Error saving profile data:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  };

  const handleImagePicker = () => {
    setModalVisible(true);
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "You need to grant camera permissions to use this feature."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      cropImage(uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "You need to grant gallery permissions to use this feature."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      cropImage(uri);
    }
  };

  const cropImage = async (uri: string) => {
    try {
      const croppedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      setProfileImage(croppedImage.uri);
      setModalVisible(false);
    } catch (error) {
      console.error("Cropper Error: ", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {isLargeScreen ? (
        // Web/Desktop Layout
        <View style={styles.webContainer}>
          <View style={styles.webHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push("/(tabs)/StudentDashBoard/Student")}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.webHeaderTitle}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.webContent}>
            <View style={styles.webLeftColumn}>
              {/* Profile Image Section */}
              <View style={styles.webImageSection}>
                <Image
                  style={styles.webProfileImage}
                  source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }}
                />
                <TouchableOpacity
                  onPress={handleImagePicker}
                  style={styles.webUploadButton}
                >
                  <Text style={styles.webUploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.webRightColumn}>
              <ScrollView style={styles.webFormContainer} showsVerticalScrollIndicator={false}>
                {/* Form Fields */}
                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Full Name <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.webInput}
                      value={studentName}
                      onChangeText={setStudentName}
                      placeholder="Enter your name"
                      placeholderTextColor={"#afb3c1"}
                    />
                    {errors.studentName && (
                      <Text style={styles.errorText}>{errors.studentName}</Text>
                    )}
                  </View>

                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Email <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.webInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      placeholderTextColor={"#afb3c1"}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Date of Birth <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)}>
                      <TextInput
                        style={styles.webInput}
                        value={dateOfBirth}
                        editable={false}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={"#afb3c1"}
                      />
                    </TouchableOpacity>
                    {errors.dateOfBirth && (
                      <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                    )}
                  </View>

                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Phone Number <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.webInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor={"#afb3c1"}
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Education Board <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={[styles.webInput, !educationBoard && { justifyContent: 'center' }]}>
                      <Picker
                        selectedValue={educationBoard}
                        dropdownIconColor="#5f5fff"
                        onValueChange={(itemValue: string) => setEducationBoard(itemValue)}
                        style={educationBoard ? { color: '#000' } : { color: '#afb3c1' }}
                        mode="dropdown"
                      >
                        <Picker.Item label="Select Education Board" value="" />
                        {boards.map((board, index) => (
                          <Picker.Item key={index} label={board.boardName} value={board.boardName} />
                        ))}
                      </Picker>
                    </View>
                    {errors.educationBoard && (
                      <Text style={styles.errorText}>{errors.educationBoard}</Text>
                    )}
                  </View>

                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Class/Year <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.webInput}>
                      <Picker
                        selectedValue={classYear}
                        onValueChange={(itemValue) => setClassYear(itemValue)}
                        style={classYear ? { color: "#000" } : { color: "#afb3c1" }}
                        mode="dropdown"
                        dropdownIconColor="#5f5fff"
                      >
                        <Picker.Item label="Enter your Class" value="" />
                        <Picker.Item label="Class 6" value="Class 6" />
                        <Picker.Item label="Class 7" value="Class 7" />
                        <Picker.Item label="Class 8" value="Class 8" />
                        <Picker.Item label="Class 9" value="Class 9" />
                        <Picker.Item label="Class 10" value="Class 10" />
                        <Picker.Item label="Class 11" value="Class 11" />
                        <Picker.Item label="Class 12" value="Class 12" />
                        <Picker.Item label="1st Year" value="1st Year" />
                        <Picker.Item label="2nd Year" value="2nd Year" />
                        <Picker.Item label="3rd Year" value="3rd Year" />
                        <Picker.Item label="4th Year" value="4th Year" />
                        <Picker.Item label="5th Year" value="5th Year" />
                      </Picker>
                    </View>
                    {errors.classYear && (
                      <Text style={styles.errorText}>{errors.classYear}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormFieldFull}>
                    <Text style={styles.webLabel}>
                      School/College/University <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.webInput}
                      value={instituteName}
                      onChangeText={setInstituteName}
                      placeholder="Enter your institution"
                      placeholderTextColor={"#afb3c1"}
                    />
                    {errors.instituteName && (
                      <Text style={styles.errorText}>{errors.instituteName}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>
                      Preferred Medium <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.webInput}>
                      <Picker
                        selectedValue={preferredMedium}
                        onValueChange={(itemValue) => setPreferredMedium(itemValue)}
                        style={preferredMedium ? { color: "#000" } : { color: "#afb3c1" }}
                        mode="dropdown"
                        dropdownIconColor="#5f5fff"
                      >
                        <Picker.Item label="Select Medium" value="" />
                        <Picker.Item label="English" value="English" />
                        <Picker.Item label="Bengali" value="Bengali" />
                        <Picker.Item label="Hindi" value="Hindi" />
                      </Picker>
                    </View>
                    {errors.preferredMedium && <Text style={styles.errorText}>{errors.preferredMedium}</Text>}
                  </View>

                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>State</Text>
                    <View style={styles.webInput}>
                      <Picker
                        selectedValue={stateName}
                        onValueChange={(itemValue) => setStateName(itemValue)}
                        style={stateName ? { color: "#000" } : { color: "#afb3c1" }}
                        mode="dropdown"
                      >
                        <Picker.Item label="Select your State/UT" value="" />
                        <Picker.Item label="Andhra Pradesh" value="Andhra Pradesh" />
                        <Picker.Item label="Arunachal Pradesh" value="Arunachal Pradesh" />
                        <Picker.Item label="Assam" value="Assam" />
                        <Picker.Item label="Bihar" value="Bihar" />
                        <Picker.Item label="Chhattisgarh" value="Chhattisgarh" />
                        <Picker.Item label="Goa" value="Goa" />
                        <Picker.Item label="Gujarat" value="Gujarat" />
                        <Picker.Item label="Haryana" value="Haryana" />
                        <Picker.Item label="Himachal Pradesh" value="Himachal Pradesh" />
                        <Picker.Item label="Jharkhand" value="Jharkhand" />
                        <Picker.Item label="Karnataka" value="Karnataka" />
                        <Picker.Item label="Kerala" value="Kerala" />
                        <Picker.Item label="Madhya Pradesh" value="Madhya Pradesh" />
                        <Picker.Item label="Maharashtra" value="Maharashtra" />
                        <Picker.Item label="Manipur" value="Manipur" />
                        <Picker.Item label="Meghalaya" value="Meghalaya" />
                        <Picker.Item label="Mizoram" value="Mizoram" />
                        <Picker.Item label="Nagaland" value="Nagaland" />
                        <Picker.Item label="Odisha" value="Odisha" />
                        <Picker.Item label="Punjab" value="Punjab" />
                        <Picker.Item label="Rajasthan" value="Rajasthan" />
                        <Picker.Item label="Sikkim" value="Sikkim" />
                        <Picker.Item label="Tamil Nadu" value="Tamil Nadu" />
                        <Picker.Item label="Telangana" value="Telangana" />
                        <Picker.Item label="Tripura" value="Tripura" />
                        <Picker.Item label="Uttar Pradesh" value="Uttar Pradesh" />
                        <Picker.Item label="Uttarakhand" value="Uttarakhand" />
                        <Picker.Item label="West Bengal" value="West Bengal" />
                        <Picker.Item label="Andaman and Nicobar Islands" value="Andaman and Nicobar Islands" />
                        <Picker.Item label="Chandigarh" value="Chandigarh" />
                        <Picker.Item label="Dadra and Nagar Haveli and Daman and Diu" value="Dadra and Nagar Haveli and Daman and Diu" />
                        <Picker.Item label="Delhi" value="Delhi" />
                        <Picker.Item label="Jammu and Kashmir" value="Jammu and Kashmir" />
                        <Picker.Item label="Ladakh" value="Ladakh" />
                        <Picker.Item label="Lakshadweep" value="Lakshadweep" />
                        <Picker.Item label="Puducherry" value="Puducherry" />
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>Full Address</Text>
                    <TextInput
                      style={styles.webInput}
                      value={fullAddress}
                      onChangeText={setFullAddress}
                      placeholder="Street No | State | Pin Code"
                      placeholderTextColor={"#afb3c1"}
                    />
                  </View>

                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>Pincode</Text>
                    <TextInput
                      style={styles.webInput}
                      value={pincode}
                      onChangeText={setPincode}
                      placeholder="Enter pin code"
                      keyboardType="numeric"
                      maxLength={6}
                      placeholderTextColor={"#afb3c1"}
                    />
                  </View>
                </View>

                <View style={styles.webFormRow}>
                  <View style={styles.webFormField}>
                    <Text style={styles.webLabel}>Country</Text>
                    <View style={styles.webInput}>
                      <Picker
                        selectedValue={country}
                        onValueChange={(itemValue) => setCountry(itemValue)}
                        style={country ? { color: "#000" } : { color: "#afb3c1" }}
                        mode="dropdown"
                      >
                        <Picker.Item label="Select your Country" value="" />
                        <Picker.Item label="India" value="India" />
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.webFormField} />
                </View>

                <View style={styles.webButtonRow}>
                  <TouchableOpacity style={styles.webButton} onPress={handleSave}>
                    <Text style={styles.webButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.webButtonSecondary}
                    onPress={() => setPreviewModalVisible(true)}
                  >
                    <Text style={styles.webButtonTextSecondary}>Preview</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      ) : (
        // Mobile Layout (existing)
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {!previewModalVisible ? (
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <View style={styles.header}>
                <BackButton 
      size={wp("6.4%")} 
      color="#4255ff" 
      onPress={() => router.push("/(tabs)/StudentDashBoard/Student")}
/>
                <Text style={styles.headerTitle}>Edit profile</Text>
              </View>

              <View style={styles.imageContainer}>
                <Image
                  style={styles.profileImage}
                  source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }}
                />
                <View style={styles.upload}>
                  <DriverUpload size={32} />
                  <TouchableOpacity
                    onPress={handleImagePicker}
                    style={styles.uploadBtn}
                  >
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>

            <Text style={styles.label}>
              Full Name <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Enter your name"
              placeholderTextColor={"#afb3c1"}
            />
            {errors.studentName && (
              <Text style={styles.errorText}>{errors.studentName}</Text>
            )}

            <Text style={styles.label}>
              Email <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              placeholderTextColor={"#afb3c1"}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>
              Date of Birth <Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <TextInput
                style={styles.input}
                value={dateOfBirth}
                editable={false}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={"#afb3c1"}
              />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                mode="date"
                value={new Date()}
                display="default"
                onChange={onChange}
                maximumDate={new Date()}
              />
            )}
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}

            <Text style={styles.label}>
              Education Board <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={[styles.input, !educationBoard && { justifyContent: 'center' }]}>
              <Picker
                selectedValue={educationBoard}
                dropdownIconColor="#5f5fff"
                onValueChange={(itemValue: string) => setEducationBoard(itemValue)}
                style={educationBoard ? { color: '#000' } : { color: '#afb3c1' }}
                mode="dropdown"
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="Select Education Board" value=""
                style={{ backgroundColor: '#f5f5f5', color: '#afb3c1' }}/>
                {boards.map((board, index) => (
                  <Picker.Item 
                    key={index} 
                    label={board.boardName} 
                    value={board.boardName}
                    color="#000"
                    style={{ color: '#000', fontSize: 16}}
                  />
                ))}
              </Picker>
            </View>
            {errors.educationBoard && (
              <Text style={styles.errorText}>{errors.educationBoard}</Text>
            )}

            <Text style={styles.label}>
              School/College/University <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={instituteName}
              onChangeText={setInstituteName}
              placeholder="Enter your institution"
              placeholderTextColor={"#afb3c1"}
            />
            {errors.instituteName && (
              <Text style={styles.errorText}>{errors.instituteName}</Text>
            )}

            <Text style={styles.label}>
              Class/Year <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.input}>
              <Picker
                selectedValue={classYear}
                onValueChange={(itemValue) => setClassYear(itemValue)}
                style={classYear ? { color: "#000" } : { color: "#afb3c1" }}
                mode="dropdown"
                dropdownIconColor="#5f5fff"
              >
                <Picker.Item 
                  label="Enter your Class" 
                  value="" 
                  style={{ backgroundColor: 'transparent ', color: '#afb3c1', fontSize: 16 }} 
                />
                <Picker.Item label="Class 6" value="Class 6" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 7" value="Class 7" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 8" value="Class 8" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 9" value="Class 9" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 10" value="Class 10" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 11" value="Class 11" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Class 12" value="Class 12" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="1st Year" value="1st Year" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="2nd Year" value="2nd Year" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="3rd Year" value="3rd Year" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="4th Year" value="4th Year" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
                <Picker.Item label="5th Year" value="5th Year" style={{ backgroundColor: '#f5f5f5', color: '#000', fontSize: 16 }} />
              </Picker>
            </View>
            {errors.classYear && (
              <Text style={styles.errorText}>{errors.classYear}</Text>
            )}

            <Text style={styles.label}>
              Preferred Medium <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.input}>
              <Picker
                selectedValue={preferredMedium}
                onValueChange={(itemValue) => setPreferredMedium(itemValue)}
                style={preferredMedium ? { color: "#000" } : { color: "#afb3c1" }}
                mode="dropdown"
                dropdownIconColor="#5f5fff"
              >
                <Picker.Item label="Select Medium" value="" style={{ backgroundColor: 'transparent', color: '#afb3c1', fontSize: 16 }} />
                <Picker.Item label="English" value="English" style={{ backgroundColor: 'transparent', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Bengali" value="Bengali" style={{ backgroundColor: 'transparent', color: '#000', fontSize: 16 }} />
                <Picker.Item label="Hindi" value="Hindi" style={{ backgroundColor: 'transparent', color: '#000', fontSize: 16 }} />
              </Picker>
            </View>
            {errors.preferredMedium &&  <Text style={styles.errorText}>{errors.preferredMedium}</Text>}

            <Text style={styles.label}>
              Phone Number <Text style={styles.asterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              placeholderTextColor={"#afb3c1"}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>Full Address</Text>
            <TextInput
              style={styles.input}
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder="Street No | State | Pin Code"
              placeholderTextColor={"#afb3c1"}
            />

            <Text style={styles.label}>State</Text>
            <View style={styles.input}>
              <Picker
                selectedValue={stateName}
                onValueChange={(itemValue) => setStateName(itemValue)}
                style={stateName ? { color: "#000" } : { color: "#afb3c1" }}
                mode="dropdown"
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="Select your State/UT" value="" style={{ backgroundColor: 'transparent', color: '#afb3c1' }} />
                <Picker.Item label="Andhra Pradesh" value="Andhra Pradesh"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Arunachal Pradesh" value="Arunachal Pradesh"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Assam" value="Assam"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Bihar" value="Bihar"   style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Chhattisgarh" value="Chhattisgarh"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Goa" value="Goa" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Gujarat" value="Gujarat"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Haryana" value="Haryana"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Himachal Pradesh" value="Himachal Pradesh"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Jharkhand" value="Jharkhand"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Karnataka" value="Karnataka" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Kerala" value="Kerala"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Madhya Pradesh" value="Madhya Pradesh"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Maharashtra" value="Maharashtra"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Manipur" value="Manipur"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Meghalaya" value="Meghalaya"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Mizoram" value="Mizoram"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Nagaland" value="Nagaland" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Odisha" value="Odisha"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Punjab" value="Punjab"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Rajasthan" value="Rajasthan"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Sikkim" value="Sikkim" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Tamil Nadu" value="Tamil Nadu"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Telangana" value="Telangana"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Tripura" value="Tripura"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Uttar Pradesh" value="Uttar Pradesh"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Uttarakhand" value="Uttarakhand" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="West Bengal" value="West Bengal" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Andaman and Nicobar Islands" value="Andaman and Nicobar Islands" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Chandigarh" value="Chandigarh" style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Dadra and Nagar Haveli and Daman and Diu" value="Dadra and Nagar Haveli and Daman and Diu"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Delhi" value="Delhi"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Jammu and Kashmir" value="Jammu and Kashmir"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Ladakh" value="Ladakh"  style={{ backgroundColor: 'transparent', color: '#000' }} />
                <Picker.Item label="Lakshadweep" value="Lakshadweep"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
                <Picker.Item label="Puducherry" value="Puducherry"  style={{ backgroundColor: 'transparent', color: '#000' }}  />
              </Picker>
            </View>

            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={pincode}
              onChangeText={setPincode}
              placeholder="Enter pin code"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={"#afb3c1"}
            />

            <Text style={styles.label}>Country</Text>
            <View style={styles.input}>
              <Picker
                selectedValue={country}
                onValueChange={(itemValue) => setCountry(itemValue)}
                style={country ? { color: "#000" } : { color: "#afb3c1" }}
                mode="dropdown"
                itemStyle={styles.pickerItem} 
              >
                <Picker.Item label="Select your Country" value="" style={{ backgroundColor: 'transparent', color: '#afb3c1' }} />
                <Picker.Item label="India" value="India" style={{ backgroundColor: 'transparent', color: '#000' }} />
              </Picker>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonTxt}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setPreviewModalVisible(true)}
              >
                <Text style={styles.buttonTxt}>Preview</Text>
              </TouchableOpacity>
            </View>

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <TouchableOpacity
                    onPress={handleCamera}
                    style={styles.modalBts}
                  >
                    <Text style={styles.modelTxt}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleGallery}
                    style={styles.modalBts}
                  >
                    <Text style={styles.modelTxt}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalBts}
                  >
                    <Text style={styles.modelTxt}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        </KeyboardAvoidingView>
      )}

      {/* Preview Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <SafeAreaView style={styles.previewMainContainer}>
          <View style={styles.previewTopSection}>
            <TouchableOpacity 
              style={styles.crossPreviewButton}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Entypo name="cross" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editPreviewButton}
              onPress={() => setPreviewModalVisible(false)}
            >
              <FontAwesome6 name="pen" size={16} color="#ffffff" />
            </TouchableOpacity>
            
            <Text style={styles.previewHeaderText}>PROFILE PREVIEW</Text>
            
            <Image
              style={styles.profileImagePreview}
              source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }}
            />
            <Text style={styles.studentName}>{studentName || "Student Name"}</Text>
          </View>

          <ScrollView style={styles.previewCardsContainer}>
            <View style={styles.previewCardRow}>
              <View style={styles.previewCard}>
                <BookOpenReaderIcon size={32} color="#5f5fff" />
                <Text style={styles.previewCardLabel}>Class</Text>
                <Text style={styles.previewCardValue}>{classYear || "N/A"}</Text>
              </View>
              
              <View style={styles.previewCard}>
                <SchoolIcon size={32} color="#5f5fff" />
                <Text style={styles.previewCardLabel}>Board</Text>
                <Text style={styles.previewCardValueSmall}>{educationBoard || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.previewCardRow}>
              <View style={styles.previewCard}>
                <CakeIcon size={32} color="#5f5fff" />
                <Text style={styles.previewCardLabel}>Age</Text>
                <Text style={styles.previewCardValue}>
                  {dateOfBirth ? calculateAge(dateOfBirth) : "N/A"}
                  <Text style={styles.previewCardSuperscript}> yrs</Text>
                </Text>
              </View>
              
              <View style={styles.previewCard}>
                <PhoneIcon size={32} color="#5f5fff" />
                <Text style={styles.previewCardLabel}>Phone</Text>
                <Text style={styles.previewCardValueSmall}>{phone || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.previewFullWidthCard}>
              <Map size={40} color="#5f5fff" />
              <View style={styles.previewFullWidthCardText}>
                <Text style={styles.previewFullWidthCardLabel}>INSTITUTION</Text>
                <Text style={styles.previewFullWidthCardValue}>{instituteName || "N/A"}</Text>
              </View>
            </View>

            <View style={styles.previewFullWidthCard}>
              <FontAwesome name="envelope" size={24} color="#5f5fff" />
              <View style={styles.previewFullWidthCardText}>
                <Text style={styles.previewFullWidthCardLabel}>EMAIL</Text>
                <Text style={styles.previewFullWidthCardValue}>{email || "N/A"}</Text>
              </View>
            </View>

            {(fullAddress || stateName || pincode) && (
              <View style={styles.previewFullWidthCard}>
                <Map size={24} color="#5f5fff" />
                <View style={styles.previewFullWidthCardText}>
                  <Text style={styles.previewFullWidthCardLabel}>ADDRESS</Text>
                  <Text style={styles.previewFullWidthCardValue}>
                    {[
                      fullAddress,
                      stateName,
                      pincode,
                      country
                    ].filter(Boolean).join(", ") || "N/A"}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.previewFullWidthCard}>
              <FontAwesome name="language" size={24} color="#5f5fff" />
              <View style={styles.previewFullWidthCardText}>
                <Text style={styles.previewFullWidthCardLabel}>MEDIUM</Text>
                <Text style={styles.previewFullWidthCardValue}>{preferredMedium || "N/A"}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inputError: { borderColor: "red", borderWidth: 1 },
  errorText: { color: "red", fontSize: wp("3%"), marginBottom: 6, marginTop: -6 },
  contentContainer: { paddingVertical: 10, paddingHorizontal: 16, paddingBottom: 20 },
  upload: { flex: 1, alignItems: "center", justifyContent: "center", gap: wp("1.3%"), flexDirection: "row", width: 98, height: 40 },
  backText: { fontSize: 18, color: "blue" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  imageContainer: { alignItems: "center", marginBottom: hp("1.345%"), justifyContent: "center" },
  profileImage: { height: wp("37.33%"), width: wp("37.33%"), borderRadius: wp("50%") },
  emptyImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#ccc" },
  uploadBtn: { marginTop: 8, backgroundColor: "#5f5fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  BackButton: { position: "absolute", top: 40, left: 20, zIndex: 1000, backgroundColor: "#f5f6f8", borderRadius: 100, height: 40, width: 40, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, marginBottom: 10, backgroundColor: "#f5f5f5", width: "100%" },
  backIconContainer: { width: wp("10%"), height: wp("10%"), alignItems: "center", justifyContent: "center", borderRadius: wp("6.4%"), padding: wp("1.04%"), backgroundColor: "#f5f6f8", marginRight: 10 },
  headerTitleContainer: { flex: 1, justifyContent: "center" },
  headerTitle: { fontSize: wp("6%"), fontWeight: "300", lineHeight: hp("8.36%"), color: "#21242d", fontFamily: "Poppins_600SemiBold", includeFontPadding: false, textAlignVertical: "center" },
  uploadBtnText: { color: "#fff", fontWeight: "500" },
  label: { fontSize: wp("3.2%"), fontWeight: "700", marginTop: hp("1.1%"), color: "#353945", lineHeight: hp("1.61%") },
  input: { width: wp("87.2%"), height: hp("6.46%"), backgroundColor: "rgba(255,255,255,0)", borderRadius: wp("24%"), paddingHorizontal: wp("2.13%"), marginTop: hp("0.504%"), marginBottom: hp("2.01%"), borderWidth: wp("0.53%"), borderColor: "#e4e6ea", elevation: 0, fontSize: wp("4.27%"), lineHeight: hp("3.23%"), color: "#000000", paddingVertical: Platform.OS === "ios" ? hp("1%") : 0 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: hp("2.69%") },
  button: { backgroundColor: "#5f5fff", padding: 8, borderRadius: 50, flex: 1, alignItems: "center", justifyContent: "center", marginRight: 10, borderColor: "#26cb63", width: wp("37.06%"), height: hp("4.84%") },
  buttonTxt: { color: "#fff", textAlign: "center", fontSize: wp("4.8%"), lineHeight: hp("2%") },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center", width: "90%" },
  modalBts: { width: "90%", height: 60, backgroundColor: "#5f5fff", marginBottom: 20, alignItems: "center", justifyContent: "center" },
  modelTxt: { fontSize: 16, lineHeight: 21, color: "#ffffff", fontWeight: "600" },
  scrollContentContainer: { paddingVertical: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === "android" ? hp("10%") : hp("5%") },
  picker: { width: "100%", height: hp("6.46%"), color: "#000000" },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
  },
  loadingText: { 
    marginTop: 10, 
    color: '#666',
    fontSize: wp('4%')
  },
  pickerItem: {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: wp("4.27%"),
  },
  
  // Preview Modal Styles - Single Page Responsive
  previewMainContainer: {
    flex: 1,
    backgroundColor: "#5f5fff",
  },
  previewContainer: { 
    flex: 1,
    backgroundColor: "#5f5fff",
  },
  previewTopSection: {
    backgroundColor: "#5f5fff",
    alignItems: "center",
    paddingTop: hp("3%"),
    paddingBottom: hp("2.5%"),
    position: "relative"
  },
  crossPreviewButton: { 
    position: "absolute", 
    top: hp("1%"), 
    left: wp("5%"), 
    zIndex: 10, 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: wp("4%")
  },
  editPreviewButton: { 
    position: "absolute", 
    top: hp("1%"), 
    right: wp("5%"), 
    zIndex: 10, 
    height: wp("8%"), 
    width: wp("8%"), 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: wp("4%")
  },
  previewHeaderText: {
    color: "#ffffff",
    fontSize: wp("3%"),
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: hp("1%"),
    fontFamily: "Poppins_600SemiBold"
  },
  profileImagePreview: { 
    height: wp("35%"), 
    width: wp("35%"), 
    borderRadius: wp("50%"),
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginBottom: hp("1.5%")
  },
  studentName: { 
    color: "#ffffff", 
    fontSize: wp("5.5%"), 
    fontWeight: "600", 
    fontFamily: "Poppins_600SemiBold",
    marginTop: hp("0.8%"),
    textAlign: "center",
    paddingHorizontal: wp("10%")
  },
  previewCardsContainer: {
    paddingHorizontal: wp("6%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("2%"),
    gap: hp("2%"),
    flex: 1,
  },
  previewCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp("2.5%")
  },
  previewCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: wp("3%"),
    padding: wp("4%"),
    alignItems: "center",
    justifyContent: "center",
    minHeight: hp("14%"),
    maxHeight: hp("16%")
  },
  previewCardLabel: {
    color: "#7a7a7a",
    fontSize: wp("3%"),
    fontWeight: "600",
    marginTop: hp("0.5%"),
    marginBottom: hp("0.3%"),
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  previewCardValue: {
    color: "#000000",
    fontSize: wp("8%"),
    fontWeight: "bold",
    fontFamily: "Poppins_600SemiBold"
  },
  previewCardSuperscript: {
    color: "#000000",
    fontSize: wp("3.5%"),
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold"
  },
  previewCardValueSmall: {
    color: "#000000",
    fontSize: wp("3.5%"),
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold"
  },
  previewFullWidthCard: {
    backgroundColor: "#e8e8ff",
    borderRadius: wp("3%"),
    padding: wp("4%"),
    flexDirection: "row",
    alignItems: "center",
    gap: wp("3%"),
    minHeight: hp("10%"),
    maxHeight: hp("12%")
  },
  previewFullWidthCardText: {
    flex: 1
  },
  previewFullWidthCardLabel: {
    color: "#7a7a7a",
    fontSize: wp("3%"),
    fontWeight: "600",
    marginBottom: hp("0.3%"),
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  previewFullWidthCardValue: {
    color: "#000000",
    fontSize: wp("3.5%"),
    fontWeight: "500",
    fontFamily: "Poppins_600SemiBold"
  },
  // Web-specific styles
  webContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#5f5fff',
    fontWeight: '600',
  },
  webHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webLeftColumn: {
    width: '35%',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webImageSection: {
    alignItems: 'center',
  },
  webProfileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  webUploadButton: {
    backgroundColor: '#5f5fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  webUploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  webRightColumn: {
    flex: 1,
    padding: 40,
  },
  webFormContainer: {
    flex: 1,
  },
  webFormRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  webFormField: {
    flex: 1,
  },
  webFormFieldFull: {
    width: '100%',
  },
  webLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  asterisk: {
    color: '#ff0000',
  },
  webInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  webButtonRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 30,
  },
  webButton: {
    backgroundColor: '#5f5fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    flex: 1,
  },
  webButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  webButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#5f5fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    flex: 1,
  },
  webButtonTextSecondary: {
    color: '#5f5fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});