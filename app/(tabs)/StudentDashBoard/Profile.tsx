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
import {
  Platform,
  ActivityIndicator, Alert, BackHandler, Image, KeyboardAvoidingView,
  Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Dimensions, Animated,
} from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "../../../components/BackButton";
import BookOpenReaderIcon from "../../../assets/svgIcons/BookOpenReader";
import CakeIcon from "../../../assets/svgIcons/CakeIcon";
import DriverUpload from "../../../assets/svgIcons/DriverUpload";
import Map from "../../../assets/svgIcons/Map";
import PhoneIcon from "../../../assets/svgIcons/PhoneIcon";
import SchoolIcon from "../../../assets/svgIcons/SchoolIcon";
import { BASE_URL } from "../../../config";
import { db } from "../../../firebaseConfig";
import { getAuthData } from "../../../utils/authStorage";
import { Entypo, FontAwesome6, FontAwesome, Ionicons } from "@expo/vector-icons";

interface FormErrors {
  studentName?: string; email?: string; phone?: string; dateOfBirth?: string;
  educationBoard?: string; instituteName?: string; preferredMedium?: string;
  classYear?: string; pincode?: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];
const CLASS_OPTIONS = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','1st Year','2nd Year','3rd Year','4th Year','5th Year'];
const DEFAULT_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const ALL_INDIA_BOARDS = [
  // National Boards
  { boardName: 'CBSE' },
  { boardName: 'ICSE' },
  { boardName: 'NIOS (National Institute of Open Schooling)' },
  // International Boards
  { boardName: 'IB (International Baccalaureate)' },
  { boardName: 'IGCSE (Cambridge International)' },
  { boardName: 'CAIE (Cambridge Assessment International Education)' },
  // State Boards
  { boardName: 'Andhra Pradesh Board of Secondary Education (BSEAP)' },
  { boardName: 'Assam Board of Secondary Education (SEBA)' },
  { boardName: 'Bihar School Examination Board (BSEB)' },
  { boardName: 'Chhattisgarh Board of Secondary Education (CGBSE)' },
  { boardName: 'Goa Board of Secondary and Higher Secondary Education (GBSHSE)' },
  { boardName: 'Gujarat Secondary and Higher Secondary Education Board (GSEB)' },
  { boardName: 'Haryana Board of School Education (HBSE)' },
  { boardName: 'Himachal Pradesh Board of School Education (HPBOSE)' },
  { boardName: 'Jharkhand Academic Council (JAC)' },
  { boardName: 'Karnataka Secondary Education Examination Board (KSEEB)' },
  { boardName: 'Kerala Board of Public Examinations (KBPE)' },
  { boardName: 'Madhya Pradesh Board of Secondary Education (MPBSE)' },
  { boardName: 'Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE)' },
  { boardName: 'Manipur Board of Secondary Education (BOSEM)' },
  { boardName: 'Meghalaya Board of School Education (MBOSE)' },
  { boardName: 'Mizoram Board of School Education (MBSE)' },
  { boardName: 'Nagaland Board of School Education (NBSE)' },
  { boardName: 'Odisha Board of Secondary Education (BSE Odisha)' },
  { boardName: 'Punjab School Education Board (PSEB)' },
  { boardName: 'Rajasthan Board of Secondary Education (RBSE)' },
  { boardName: 'Tamil Nadu State Board (TN Board)' },
  { boardName: 'Telangana State Board of Intermediate Education (TSBIE)' },
  { boardName: 'Tripura Board of Secondary Education (TBSE)' },
  { boardName: 'Uttar Pradesh Madhyamik Shiksha Parishad (UPMSP)' },
  { boardName: 'Uttarakhand Board of School Education (UBSE)' },
  { boardName: 'West Bengal Board of Secondary Education (WBBSE)' },
  // Union Territories
  { boardName: 'Delhi Board of Secondary Education (DBSE)' },
  { boardName: 'Jammu and Kashmir Board of School Education (JKBOSE)' },
  { boardName: 'Puducherry Board of Secondary Education' },
  { boardName: 'Chandigarh Board of Secondary Education' },
  // Open Schooling
  { boardName: 'Rajasthan State Open School (RSOS)' },
  { boardName: 'Madhya Pradesh State Open School (MPSOS)' },
  { boardName: 'West Bengal Council of Rabindra Open Schooling (WBCROS)' },
];

const calculateAge = (dob: string): string => {
  try {
    const [day, month, year] = dob.split('/');
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age.toString();
  } catch { return 'N/A'; }
};

export default function Profile() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [fadeAnim] = useState(new Animated.Value(0));
  const router = useRouter();
  const { userType, email: urlEmail, name: urlName, phone: urlPhone } = useLocalSearchParams<{ userType: string; email: string; name: string; phone: string }>();
  const [studentName, setStudentName] = useState(urlName || "");
  const [email, setEmail] = useState(urlEmail || "");
  const [phone, setPhone] = useState(urlPhone || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dateOfBirth, setDateofBirth] = useState("");
  const [educationBoard, setEducationBoard] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [preferredMedium, setPreferredMedium] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("");
  const [classYear, setClassYear] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [boards, setBoards] = useState<Array<{ boardName: string; boardId?: string }>>(ALL_INDIA_BOARDS);
  const [showEditForm, setShowEditForm] = useState(!!(urlName || urlEmail || urlPhone));
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(React.useCallback(() => {
    const onBack = () => {
      if (showEditForm) { setShowEditForm(false); return true; }
      if (previewModalVisible) { setPreviewModalVisible(false); return true; }
      if (modalVisible) { setModalVisible(false); return true; }
      router.back(); return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [router, showEditForm, previewModalVisible, modalVisible]));

  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, OpenSans_600SemiBold });

  const validateForm = () => {
    const e: FormErrors = {};
    if (!studentName.trim()) e.studentName = "Name is required.";
    if (!phone.trim()) e.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(phone)) e.phone = "Phone number must be 10 digits.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Please enter a valid email.";
    if (!dateOfBirth.trim()) e.dateOfBirth = "Date of Birth is required.";
    if (!educationBoard.trim()) e.educationBoard = "Board is required.";
    if (!instituteName.trim()) e.instituteName = "Institute Name is required.";
    if (!preferredMedium.trim()) e.preferredMedium = "Medium is required.";
    if (!classYear) e.classYear = "Class is required.";
    if (pincode && !/^\d{6}$/.test(pincode)) e.pincode = "Pincode must be 6 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) setDateofBirth(selectedDate.toLocaleDateString("en-GB"));
    setShowPicker(false);
  };

  const fetchProfileAndBoards = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) { 
        Alert.alert("Error", "Please login again"); 
        setIsLoading(false);
        return; 
      }
      const headers = { Authorization: `Bearer ${auth.token}` };
      
      // Fetch profile only - boards are hardcoded in ALL_INDIA_BOARDS
      const profileResponse = await axios.post(
        `${BASE_URL}/api/sudentProfile`, 
        { email: auth.email }, 
        { headers }
      );

      const data = profileResponse.data;
      // Only override URL params if backend has data
      if (data.name) setStudentName(data.name);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      setProfileImage(data.profileimage || null); setDateofBirth(data.dateOfBirth || "");
      setEducationBoard(data.educationBoard || ""); setInstituteName(data.instituteName || "");
      setPreferredMedium(data.preferredMedium || ""); setFullAddress(data.fullAddress || "");
      setStateName(data.stateName || ""); setPincode(data.pincode || "");
      setCountry(data.country || ""); setClassYear(data.classYear || "");
    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert("Error", "Failed to load profile. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDesktop = screenWidth >= 1024;

  // Platform switching fixes - Optimized
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => { 
      if (isMounted) {
        await fetchProfileAndBoards(); 
      }
    };
    
    init();
    
    // Optimized animation - reduced duration
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400, // Reduced from 700ms
      useNativeDriver: true,
    }).start();
    
    const handleDimensionChange = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const sub = Dimensions.addEventListener?.('change', handleDimensionChange);
    
    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  // Additional effect to handle platform-specific resets - Simplified
  useEffect(() => {
    // Reset critical state when platform changes
    setErrors({});
    setShowEditForm(false);
    setModalVisible(false);
    setPreviewModalVisible(false);
  }, [Platform.OS]);

  const getCompletionPct = () => {
    const fields = [studentName, email, dateOfBirth, phone, educationBoard, instituteName, preferredMedium, classYear];
    return Math.round((fields.filter(f => f?.trim()).length / fields.length) * 100);
  };

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
    try {
      const auth = await getAuthData();
      if (!auth?.token) throw new Error("Not authenticated");
      const formData = new FormData();
      const filename = `profile_${Date.now()}.jpg`;
      if (Platform.OS === "web") {
        const blob = await (await fetch(uri)).blob();
        formData.append("profileimage", new File([blob], filename, { type: blob.type }));
      } else {
        formData.append("profileimage", { uri, name: filename, type: 'image/jpeg' } as any);
      }
      const fields: [string, string][] = [["email", email],["name", studentName],["dateofBirth", dateOfBirth],["educationBoard", educationBoard],["instituteName", instituteName],["classYear", classYear],["preferredMedium", preferredMedium],["phone_number", phone],["fullAddress", fullAddress],["stateName", stateName],["pincode", pincode],["country", country]];
      fields.forEach(([k, v]) => formData.append(k, v));
      const res = await fetch(`${BASE_URL}/api/updateStudentProfileWithImage`, { method: "POST", body: formData, headers: { Authorization: `Bearer ${auth.token}` } });
      const json = await res.json();
      if (res.status !== 200) throw new Error("Upload failed");
      return json.imageUrl;
    } catch (e) { console.error(e); return null; }
  };

  const handleSave = async () => {
    if (!validateForm()) { 
      Alert.alert("Missing Fields", "Please fill in all required fields."); 
      return; 
    }
    
    setIsSaving(true);
    
    try {
      // Case 1: New profile image uploaded
      if (profileImage && (profileImage.startsWith("file://") || profileImage.startsWith("blob:"))) {
        const imageUrl = await uploadImageToS3AndUpdateProfile(profileImage);
        if (!imageUrl) {
          setIsSaving(false);
          Alert.alert("Error", "Failed to upload profile image. Please try again.");
          return;
        }
        await setDoc(doc(db, "users", email), { name: studentName, email, phone, profileImage: imageUrl });
        await AsyncStorage.multiSet([["studentName", studentName], ["email", email], ["phone", phone]]);
        setIsSaving(false);
        Alert.alert("Success", "Profile saved successfully!", [
          { text: "OK", onPress: () => router.push({ pathname: "/(tabs)/StudentDashBoard/Student", params: { userType: userType || "student", userEmail: email, studentName, phone } }) }
        ]);
        return;
      }
      
      // Case 2: No new image - just update profile data
      await setDoc(doc(db, "users", email), { name: studentName, email, phone });
      const auth = await getAuthData();
      if (!auth?.token) {
        setIsSaving(false);
        Alert.alert("Error", "Authentication required. Please login again.");
        return;
      }
      
      const obj = { 
        email, 
        name: studentName, 
        dateofBirth: dateOfBirth, 
        educationBoard, 
        instituteName, 
        classYear, 
        preferredMedium, 
        phone: phone, 
        fullAddress, 
        stateName, 
        pincode, 
        country 
      };
      
      console.log("Saving profile data:", obj);
      
      const response = await axios.post(`${BASE_URL}/api/updateStudentProfile`, obj, { 
        headers: { Authorization: `Bearer ${auth.token}` } 
      });
      
      console.log("Save response:", response.data);
      
      if (response.status === 200) {
        await AsyncStorage.multiSet([["studentName", studentName], ["email", email], ["phone", phone]]);
        setIsSaving(false);
        Alert.alert("Success", "Profile saved successfully!", [
          { text: "OK", onPress: () => router.push({ pathname: "/(tabs)/StudentDashBoard/Student", params: { userType: userType || "student", userEmail: email, studentName, phone } }) }
        ]);
      } else {
        setIsSaving(false);
        Alert.alert("Error", "Failed to save profile. Please try again.");
      }
    } catch (e) { 
      console.error("Save error:", e); 
      setIsSaving(false);
      Alert.alert("Error", "An error occurred while saving. Please check your connection and try again.");
    } 
  };

  const handleImagePicker = () => setModalVisible(true);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Denied", "Camera permission required."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets?.[0]) cropImage(result.assets[0].uri);
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Denied", "Gallery permission required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images" as any, allowsEditing: false, quality: 1 });
    if (!result.canceled && result.assets?.[0]) cropImage(result.assets[0].uri);
  };

  const cropImage = async (uri: string) => {
    try {
      const cropped = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 300, height: 300 } }], { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
      setProfileImage(cropped.uri); setModalVisible(false);
    } catch (e) { console.error("Crop error:", e); }
  };

  // ─── SHARED: Image Picker Modal ───────────────────────────────────────────
  const ImagePickerModal = (
    <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity onPress={handleCamera} style={styles.modalBts}><Text style={styles.modelTxt}>Take Photo</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleGallery} style={styles.modalBts}><Text style={styles.modelTxt}>Choose from Gallery</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBts}><Text style={styles.modelTxt}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  WEB PLATFORM
  // ═══════════════════════════════════════════════════════════════════════════
  if (Platform.OS === 'web') {
    const pct = getCompletionPct();

    // ── Web Preview (Default View) ─────────────────────────────────────────────
    if (!showEditForm) {
      return (
        <View style={webPreview.overlay}>
          {/* Bengali character background */}
          <View style={webPreview.patternLayer} pointerEvents="none">
            {Array.from({ length: 14 }).map((_, row) => (
              <View key={row} style={webPreview.patternRow}>
                {Array.from({ length: 22 }).map((_, col) => (
                  <Text key={col} style={webPreview.patternChar}>
                    {['অ','আ','ক','খ','গ','ঘ','চ','ছ','ট','ঠ','ড','ণ','ত','থ','দ','ন','প','ব','ম','য','র','ল'][col % 22]}
                  </Text>
                ))}
              </View>
            ))}
          </View>

          {/* Main white card */}
          <View style={webPreview.card}>
            <View style={webPreview.cardHeader}>
              <TouchableOpacity style={webPreview.closeBtn} onPress={() => router.back()}>
                <Text style={webPreview.closeBtnTxt}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={webPreview.editBtn} 
                onPress={() => setShowEditForm(true)}
              >
                <FontAwesome name="pencil" size={16} color="#5f5fff" />
              </TouchableOpacity>
            </View>

            <View style={webPreview.cardBody}>
              {/* LEFT */}
              <View style={webPreview.leftCol}>
                <View style={webPreview.avatarWrap}>
                  <View style={webPreview.avatarBg}>
                    <Image style={webPreview.avatar} source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }} />
                  </View>
                  <View style={webPreview.onlineDot} />
                </View>
                <Text style={webPreview.nameText}>{studentName || 'Full Name'}</Text>
                <Text style={webPreview.emailText}>{email || 'email@example.com'}</Text>
                <View style={webPreview.contactCard}>
                  <Text style={webPreview.contactTitle}>Contact Details</Text>
                  <View style={webPreview.contactRow}>
                    <View style={webPreview.contactIconCircle}><PhoneIcon size={16} color="#fff" /></View>
                    <View style={webPreview.contactInfo}>
                      <Text style={webPreview.contactLabel}>Phone Number</Text>
                      <Text style={webPreview.contactVal}>{phone ? `+91 ${phone}` : 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={webPreview.contactRow}>
                    <View style={webPreview.contactIconCircle}><Map size={16} color="#fff" /></View>
                    <View style={webPreview.contactInfo}>
                      <Text style={webPreview.contactLabel}>Full Address</Text>
                      <Text style={webPreview.contactVal}>{[fullAddress, stateName, pincode, country].filter(Boolean).join(', ') || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* RIGHT */}
              <View style={webPreview.rightCol}>
                <Text style={webPreview.aboutTitle}>About Me</Text>
                <View style={webPreview.infoCard}>
                  <CakeIcon size={28} color="#5f5fff" />
                  <View style={webPreview.infoText}>
                    <Text style={webPreview.infoLabel}>Date Of Birth</Text>
                    <Text style={webPreview.infoValue}>{dateOfBirth || 'N/A'}</Text>
                  </View>
                </View>
                <View style={webPreview.infoCard}>
                  <SchoolIcon size={28} color="#5f5fff" />
                  <View style={webPreview.infoText}>
                    <Text style={webPreview.infoLabel}>School/ college/ university</Text>
                    <Text style={webPreview.infoValue}>{instituteName || 'N/A'}</Text>
                  </View>
                </View>
                <View style={webPreview.infoCard}>
                  <BookOpenReaderIcon size={28} color="#5f5fff" />
                  <View style={webPreview.infoText}>
                    <Text style={webPreview.infoLabel}>Educational Board</Text>
                    <Text style={webPreview.infoValue}>{educationBoard || 'N/A'}</Text>
                  </View>
                </View>
                <View style={webPreview.tilesRow}>
                  <View style={webPreview.tile}>
                    <Image style={webPreview.tileImg} source={{ uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=220&fit=crop' }} />
                    <Text style={webPreview.tileLabel}>Class/ Year</Text>
                    <Text style={webPreview.tileVal}>{classYear || 'N/A'}</Text>
                  </View>
                  <View style={webPreview.tile}>
                    <Image style={webPreview.tileImg} source={{ uri: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=220&fit=crop' }} />
                    <Text style={webPreview.tileLabel}>Preferred{'\n'}Medium</Text>
                    <Text style={[webPreview.tileVal, { color: '#5f5fff' }]}>{preferredMedium || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={webPreview.footer}>
              <Text style={webPreview.memberSince}>Member since November 2023</Text>
              <View style={webPreview.activeRow}>
                <View style={webPreview.activeDot} />
                <Text style={webPreview.activeText}>Active Profile</Text>
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <View style={[webPreview.footer, { paddingTop: 20 }]}>
            <TouchableOpacity 
              style={webEdit.saveBtn} 
              onPress={() => setShowEditForm(true)}
            >
              <Text style={webEdit.saveBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ── Web Edit Form ─────────────────────────────────────────────────────────
    return (
      <View style={webEdit.root}>
        {/* Brand bar */}
        <View style={webEdit.topBar}>
          <Text style={webEdit.brand}>Growsmart</Text>
        </View>

        <ScrollView contentContainerStyle={webEdit.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={webEdit.pageTitle}>Edit Profile</Text>
          <Text style={webEdit.pageSubtitle}>Manage your educational information and preferences ...</Text>

          {/* Card */}
          <View style={webEdit.card}>
            {/* ── Left Panel ── */}
            <View style={webEdit.leftPanel}>
              {/* Photo Upload Box */}
              <View style={webEdit.photoBox}>
                {profileImage ? (
                  <Image style={webEdit.photoImg} source={{ uri: profileImage }} />
                ) : (
                  <View style={webEdit.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={38} color="#9ca3af" />
                  </View>
                )}
                <TouchableOpacity style={webEdit.photoEditCircle} onPress={handleImagePicker}>
                  <Ionicons name="arrow-down-circle" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={webEdit.photoLabel}>Profile Picture</Text>
              <Text style={webEdit.photoHint}>We recommend an image of at least 800x800px. High-quality photos help you stand out.</Text>

              <TouchableOpacity style={webEdit.uploadPhotoBtn} onPress={handleImagePicker}>
                <Text style={webEdit.uploadPhotoBtnTxt}>Upload Photo</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, minHeight: 40 }} />

              {/* Completion Status */}
              <View style={webEdit.completionWrap}>
                <Text style={webEdit.completionLabel}>COMPLETION STATUS</Text>
                <View style={webEdit.progressTrack}>
                  <View style={[webEdit.progressFill, { width: `${pct}%` as any }]} />
                </View>
                <Text style={webEdit.completionPct}>{pct}% Profile Completed</Text>
              </View>
            </View>

            {/* ── Right Panel ── */}
            <View style={webEdit.rightPanel}>
              {/* PERSONAL INFORMATION */}
              <Text style={webEdit.sectionLabel}>Personal Information</Text>

              <View style={webEdit.formRow}>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>FULL NAME <Text style={webEdit.req}>*</Text></Text>
                  <TextInput style={[webEdit.input, webEdit.inputDisabled]} value={studentName} editable={false} placeholder="Ayano Nana" placeholderTextColor="#c4c4c4" />
                </View>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>EMAIL <Text style={webEdit.req}>*</Text></Text>
                  <TextInput style={[webEdit.input, webEdit.inputDisabled]} value={email} editable={false} placeholder="ayanonana@gmail.com" keyboardType="email-address" placeholderTextColor="#c4c4c4" />
                </View>
              </View>

              <View style={webEdit.formRow}>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>DATE OF BIRTH <Text style={webEdit.req}>*</Text></Text>
                  <TextInput style={[webEdit.input, errors.dateOfBirth ? webEdit.inputErr : null]} value={dateOfBirth} onChangeText={setDateofBirth} placeholder="DD/ MM/ YEAR" placeholderTextColor="#c4c4c4" />
                  {errors.dateOfBirth ? <Text style={webEdit.errTxt}>{errors.dateOfBirth}</Text> : null}
                </View>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>PHONE NUMBER <Text style={webEdit.req}>*</Text></Text>
                  <TextInput style={[webEdit.input, errors.phone ? webEdit.inputErr : null]} value={phone} onChangeText={setPhone} placeholder="+ 91- XXXX XXXX XX" keyboardType="phone-pad" placeholderTextColor="#c4c4c4" />
                  {errors.phone ? <Text style={webEdit.errTxt}>{errors.phone}</Text> : null}
                </View>
              </View>

              {/* EDUCATION DETAILS */}
              <Text style={[webEdit.sectionLabel, { marginTop: 20 }]}>Education Details</Text>

              <View style={webEdit.formRow}>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>EDUCATION BOARD <Text style={webEdit.req}>*</Text></Text>
                  <View style={[webEdit.input, webEdit.pickerWrap, errors.educationBoard ? webEdit.inputErr : null]}>
                    {Platform.OS === 'web' ? (
                      <select
                        value={educationBoard}
                        onChange={(e) => setEducationBoard(e.target.value)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 13.5,
                          color: educationBoard ? '#111827' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select Board</option>
                        {boards.map((b, i) => (
                          <option key={i} value={b.boardName}>{b.boardName}</option>
                        ))}
                      </select>
                    ) : (
                      <Picker selectedValue={educationBoard} onValueChange={setEducationBoard} style={webEdit.pickerInner} dropdownIconColor="#5f5fff">
                        <Picker.Item label="Select Board" value="" />
                        {boards.map((b, i) => <Picker.Item key={i} label={b.boardName} value={b.boardName} />)}
                      </Picker>
                    )}
                  </View>
                  {errors.educationBoard ? <Text style={webEdit.errTxt}>{errors.educationBoard}</Text> : null}
                </View>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>SCHOOL/ COLLEGE/ UNIVERSITY</Text>
                  <TextInput style={[webEdit.input, errors.instituteName ? webEdit.inputErr : null]} value={instituteName} onChangeText={setInstituteName} placeholder="Delhi University" placeholderTextColor="#c4c4c4" />
                  {errors.instituteName ? <Text style={webEdit.errTxt}>{errors.instituteName}</Text> : null}
                </View>
              </View>

              <View style={webEdit.formRow}>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>CLASS/ YEAR <Text style={webEdit.req}>*</Text></Text>
                  <View style={[webEdit.input, webEdit.pickerWrap, errors.classYear ? webEdit.inputErr : null]}>
                    {Platform.OS === 'web' ? (
                      <select
                        value={classYear}
                        onChange={(e) => setClassYear(e.target.value)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 13.5,
                          color: classYear ? '#111827' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select Class/Year</option>
                        {CLASS_OPTIONS.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <Picker selectedValue={classYear} onValueChange={setClassYear} style={webEdit.pickerInner} dropdownIconColor="#5f5fff">
                        <Picker.Item label="#" value="" />
                        {CLASS_OPTIONS.map((c, i) => <Picker.Item key={i} label={c} value={c} />)}
                      </Picker>
                    )}
                  </View>
                  {errors.classYear ? <Text style={webEdit.errTxt}>{errors.classYear}</Text> : null}
                </View>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>PREFERRED MEDIUM <Text style={webEdit.req}>*</Text></Text>
                  <View style={[webEdit.input, webEdit.pickerWrap, errors.preferredMedium ? webEdit.inputErr : null]}>
                    {Platform.OS === 'web' ? (
                      <select
                        value={preferredMedium}
                        onChange={(e) => setPreferredMedium(e.target.value)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 13.5,
                          color: preferredMedium ? '#111827' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select Medium</option>
                        <option value="English">English</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    ) : (
                      <Picker selectedValue={preferredMedium} onValueChange={setPreferredMedium} style={webEdit.pickerInner} dropdownIconColor="#5f5fff">
                        <Picker.Item label="ENGLISH/ BENGALI/ TAMIL" value="" />
                        <Picker.Item label="English" value="English" />
                        <Picker.Item label="Bengali" value="Bengali" />
                        <Picker.Item label="Hindi" value="Hindi" />
                      </Picker>
                    )}
                  </View>
                  {errors.preferredMedium ? <Text style={webEdit.errTxt}>{errors.preferredMedium}</Text> : null}
                </View>
              </View>

              <View style={webEdit.formRowFull}>
                <Text style={webEdit.fieldLabel}>FULL ADDRESS</Text>
                <TextInput style={webEdit.input} value={fullAddress} onChangeText={setFullAddress} placeholder="street apt no state| pin code" placeholderTextColor="#c4c4c4" />
              </View>

              <View style={webEdit.formRow}>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>STATE</Text>
                  <View style={[webEdit.input, webEdit.pickerWrap]}>
                    {Platform.OS === 'web' ? (
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 13.5,
                          color: stateName ? '#111827' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select State/UT</option>
                        {INDIAN_STATES.map((s, i) => (
                          <option key={i} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <Picker selectedValue={stateName} onValueChange={setStateName} style={webEdit.pickerInner} dropdownIconColor="#5f5fff">
                        <Picker.Item label="Select State/UT" value="" />
                        {INDIAN_STATES.map((s, i) => <Picker.Item key={i} label={s} value={s} />)}
                      </Picker>
                    )}
                  </View>
                </View>
                <View style={webEdit.formField}>
                  <Text style={webEdit.fieldLabel}>PIN CODE</Text>
                  <TextInput style={[webEdit.input, errors.pincode ? webEdit.inputErr : null]} value={pincode} onChangeText={setPincode} placeholder="735221" keyboardType="numeric" maxLength={6} placeholderTextColor="#c4c4c4" />
                  {errors.pincode ? <Text style={webEdit.errTxt}>{errors.pincode}</Text> : null}
                </View>
              </View>

              <View style={webEdit.formRowFull}>
                <Text style={webEdit.fieldLabel}>COUNTRY</Text>
                <View style={[webEdit.input, webEdit.pickerWrap]}>
                  {Platform.OS === 'web' ? (
                    <select
                      value={country || 'India'}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontSize: 13.5,
                        color: '#111827',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="India">India</option>
                    </select>
                  ) : (
                    <Picker selectedValue={country || 'India'} onValueChange={setCountry} style={webEdit.pickerInner} dropdownIconColor="#5f5fff">
                      <Picker.Item label="India" value="India" />
                    </Picker>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={webEdit.actionRow}>
            <TouchableOpacity style={webEdit.previewBtn} onPress={() => setShowEditForm(false)} disabled={isSaving}>
              <Text style={webEdit.previewBtnTxt}>Back to Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[webEdit.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
              <Text style={webEdit.saveBtnTxt}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {ImagePickerModal}
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MOBILE PLATFORM  (Android / iOS — unchanged)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        {!previewModalVisible ? (
          <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.header}>
              <BackButton size={wp("6.4%")} color="#4255ff" onPress={() => router.push("/(tabs)/StudentDashBoard/Student")} />
              <Text style={styles.headerTitle}>Edit profile</Text>
            </View>

            <View style={styles.imageContainer}>
              <Image style={styles.profileImage} source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }} />
              <View style={styles.upload}>
                <DriverUpload size={32} />
                <TouchableOpacity onPress={handleImagePicker} style={styles.uploadBtn}>
                  <Text style={styles.uploadBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Full Name <Text style={styles.asterisk}>*</Text></Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={studentName} editable={false} placeholder="Enter your name" placeholderTextColor="#afb3c1" />

            <Text style={styles.label}>Email <Text style={styles.asterisk}>*</Text></Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={email} editable={false} placeholder="Enter your email" keyboardType="email-address" placeholderTextColor="#afb3c1" />

            <Text style={styles.label}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <TextInput style={styles.input} value={dateOfBirth} editable={false} placeholder="DD/MM/YYYY" placeholderTextColor="#afb3c1" />
            </TouchableOpacity>
            {showPicker && <DateTimePicker mode="date" value={new Date()} display="default" onChange={onChange} maximumDate={new Date()} />}
            {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}

            <Text style={styles.label}>Phone Number <Text style={styles.asterisk}>*</Text></Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter your phone number" keyboardType="phone-pad" placeholderTextColor="#afb3c1" />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>Education Board <Text style={styles.asterisk}>*</Text></Text>
            <View style={[styles.input, !educationBoard && { justifyContent: 'center' }]}>
              <Picker selectedValue={educationBoard} dropdownIconColor="#5f5fff" onValueChange={setEducationBoard} style={educationBoard ? { color: '#000' } : { color: '#afb3c1' }} mode="dropdown">
                <Picker.Item label="Select Education Board" value="" />
                {boards.map((b, i) => <Picker.Item key={i} label={b.boardName} value={b.boardName} />)}
              </Picker>
            </View>
            {errors.educationBoard && <Text style={styles.errorText}>{errors.educationBoard}</Text>}

            <Text style={styles.label}>Class/Year <Text style={styles.asterisk}>*</Text></Text>
            <View style={styles.input}>
              <Picker selectedValue={classYear} onValueChange={setClassYear} style={classYear ? { color: "#000" } : { color: "#afb3c1" }} mode="dropdown" dropdownIconColor="#5f5fff">
                <Picker.Item label="Enter your Class" value="" />
                {CLASS_OPTIONS.map((c, i) => <Picker.Item key={i} label={c} value={c} />)}
              </Picker>
            </View>
            {errors.classYear && <Text style={styles.errorText}>{errors.classYear}</Text>}

            <Text style={styles.label}>School/College/University <Text style={styles.asterisk}>*</Text></Text>
            <TextInput style={styles.input} value={instituteName} onChangeText={setInstituteName} placeholder="Enter your institution" placeholderTextColor="#afb3c1" />
            {errors.instituteName && <Text style={styles.errorText}>{errors.instituteName}</Text>}

            <Text style={styles.label}>Preferred Medium <Text style={styles.asterisk}>*</Text></Text>
            <View style={styles.input}>
              <Picker selectedValue={preferredMedium} onValueChange={setPreferredMedium} style={preferredMedium ? { color: "#000" } : { color: "#afb3c1" }} mode="dropdown" dropdownIconColor="#5f5fff">
                <Picker.Item label="Select Medium" value="" />
                <Picker.Item label="English" value="English" />
                <Picker.Item label="Bengali" value="Bengali" />
                <Picker.Item label="Hindi" value="Hindi" />
              </Picker>
            </View>
            {errors.preferredMedium && <Text style={styles.errorText}>{errors.preferredMedium}</Text>}

            <Text style={styles.label}>State</Text>
            <View style={styles.input}>
              <Picker selectedValue={stateName} onValueChange={setStateName} style={stateName ? { color: "#000" } : { color: "#afb3c1" }} mode="dropdown">
                <Picker.Item label="Select your State/UT" value="" />
                {INDIAN_STATES.map((s, i) => <Picker.Item key={i} label={s} value={s} />)}
              </Picker>
            </View>

            <Text style={styles.label}>Full Address</Text>
            <TextInput style={styles.input} value={fullAddress} onChangeText={setFullAddress} placeholder="Street No | State | Pin Code" placeholderTextColor="#afb3c1" />

            <Text style={styles.label}>Pincode</Text>
            <TextInput style={styles.input} value={pincode} onChangeText={setPincode} placeholder="Enter pin code" keyboardType="numeric" maxLength={6} placeholderTextColor="#afb3c1" />

            <Text style={styles.label}>Country</Text>
            <View style={styles.input}>
              <Picker selectedValue={country} onValueChange={setCountry} style={country ? { color: "#000" } : { color: "#afb3c1" }} mode="dropdown">
                <Picker.Item label="Select your Country" value="" />
                <Picker.Item label="India" value="India" />
              </Picker>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                <Text style={styles.buttonTxt}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => setPreviewModalVisible(true)} disabled={isSaving}>
                <Text style={styles.buttonTxt}>Preview</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableOpacity onPress={handleCamera} style={styles.modalBts}><Text style={styles.modelTxt}>Take Photo</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleGallery} style={styles.modalBts}><Text style={styles.modelTxt}>Choose from Gallery</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBts}><Text style={styles.modelTxt}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      {/* Mobile Preview Modal — unchanged */}
      <Modal animationType="slide" transparent={false} visible={previewModalVisible} onRequestClose={() => setPreviewModalVisible(false)}>
        <SafeAreaView style={styles.previewMainContainer}>
          <View style={styles.previewTopSection}>
            <TouchableOpacity style={styles.crossPreviewButton} onPress={() => setPreviewModalVisible(false)}><Entypo name="cross" size={24} color="#ffffff" /></TouchableOpacity>
            <TouchableOpacity style={styles.editPreviewButton} onPress={() => setPreviewModalVisible(false)}><FontAwesome6 name="pen" size={16} color="#ffffff" /></TouchableOpacity>
            <Text style={styles.previewHeaderText}>PROFILE PREVIEW</Text>
            <Image style={styles.profileImagePreview} source={{ uri: profileImage || DEFAULT_PROFILE_IMAGE }} />
            <Text style={styles.studentName}>{studentName || 'Student Name'}</Text>
          </View>
          <ScrollView style={styles.previewCardsContainer}>
            <View style={styles.previewCardRow}>
              <View style={styles.previewCard}><BookOpenReaderIcon size={32} color="#5f5fff" /><Text style={styles.previewCardLabel}>Class</Text><Text style={styles.previewCardValue}>{classYear || 'N/A'}</Text></View>
              <View style={styles.previewCard}><SchoolIcon size={32} color="#5f5fff" /><Text style={styles.previewCardLabel}>Board</Text><Text style={styles.previewCardValueSmall}>{educationBoard || 'N/A'}</Text></View>
            </View>
            <View style={styles.previewCardRow}>
              <View style={styles.previewCard}><CakeIcon size={32} color="#5f5fff" /><Text style={styles.previewCardLabel}>Age</Text><Text style={styles.previewCardValue}>{dateOfBirth ? calculateAge(dateOfBirth) : 'N/A'}<Text style={styles.previewCardSuperscript}> yrs</Text></Text></View>
              <View style={styles.previewCard}><PhoneIcon size={32} color="#5f5fff" /><Text style={styles.previewCardLabel}>Phone</Text><Text style={styles.previewCardValueSmall}>{phone || 'N/A'}</Text></View>
            </View>
            <View style={styles.previewFullWidthCard}><Map size={40} color="#5f5fff" /><View style={styles.previewFullWidthCardText}><Text style={styles.previewFullWidthCardLabel}>INSTITUTION</Text><Text style={styles.previewFullWidthCardValue}>{instituteName || 'N/A'}</Text></View></View>
            <View style={styles.previewFullWidthCard}><FontAwesome name="envelope" size={24} color="#5f5fff" /><View style={styles.previewFullWidthCardText}><Text style={styles.previewFullWidthCardLabel}>EMAIL</Text><Text style={styles.previewFullWidthCardValue}>{email || 'N/A'}</Text></View></View>
            {(fullAddress || stateName || pincode) && (<View style={styles.previewFullWidthCard}><Map size={24} color="#5f5fff" /><View style={styles.previewFullWidthCardText}><Text style={styles.previewFullWidthCardLabel}>ADDRESS</Text><Text style={styles.previewFullWidthCardValue}>{[fullAddress, stateName, pincode, country].filter(Boolean).join(', ') || 'N/A'}</Text></View></View>)}
            <View style={styles.previewFullWidthCard}><FontAwesome name="language" size={24} color="#5f5fff" /><View style={styles.previewFullWidthCardText}><Text style={styles.previewFullWidthCardLabel}>MEDIUM</Text><Text style={styles.previewFullWidthCardValue}>{preferredMedium || 'N/A'}</Text></View></View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOBILE STYLES  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  inputError: { borderColor: "red", borderWidth: 1 },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#888' },
  errorText: { color: "red", fontSize: wp("3%"), marginBottom: 6, marginTop: -6 },
  contentContainer: { paddingVertical: 10, paddingHorizontal: 16, paddingBottom: 20 },
  upload: { flex: 1, alignItems: "center", justifyContent: "center", gap: wp("1.3%"), flexDirection: "row", width: 98, height: 40 },
  imageContainer: { alignItems: "center", marginBottom: hp("1.345%"), justifyContent: "center" },
  profileImage: { height: wp("37.33%"), width: wp("37.33%"), borderRadius: wp("50%") },
  uploadBtn: { marginTop: 8, backgroundColor: "#5f5fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16, marginBottom: 10, backgroundColor: "#f5f5f5", width: "100%" },
  headerTitle: { fontSize: wp("6%"), fontWeight: "300", lineHeight: hp("8.36%"), color: "#21242d", fontFamily: "Poppins_600SemiBold", includeFontPadding: false, textAlignVertical: "center" },
  uploadBtnText: { color: "#fff", fontWeight: "500" },
  label: { fontSize: wp("3.2%"), fontWeight: "700", marginTop: hp("1.1%"), color: "#353945", lineHeight: hp("1.61%") },
  input: { width: wp("87.2%"), height: hp("6.46%"), backgroundColor: "rgba(255,255,255,0)", borderRadius: wp("24%"), paddingHorizontal: wp("2.13%"), marginTop: hp("0.504%"), marginBottom: hp("2.01%"), borderWidth: wp("0.53%"), borderColor: "#e4e6ea", fontSize: wp("4.27%"), lineHeight: hp("3.23%"), color: "#000000", paddingVertical: Platform.OS === "ios" ? hp("1%") : 0 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: hp("2.69%") },
  button: { backgroundColor: "#5f5fff", padding: 8, borderRadius: 50, flex: 1, alignItems: "center", justifyContent: "center", marginRight: 10, width: wp("37.06%"), height: hp("4.84%") },
  buttonTxt: { color: "#fff", textAlign: "center", fontSize: wp("4.8%"), lineHeight: hp("2%") },
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalView: { backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center", width: "90%" },
  modalBts: { width: "90%", height: 60, backgroundColor: "#5f5fff", marginBottom: 20, alignItems: "center", justifyContent: "center" },
  modelTxt: { fontSize: 16, lineHeight: 21, color: "#ffffff", fontWeight: "600" },
  scrollContentContainer: { paddingVertical: 10, paddingHorizontal: 16, paddingBottom: Platform.OS === "android" ? hp("10%") : hp("5%") },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, color: '#666', fontSize: wp('4%') },
  asterisk: { color: '#ff0000' },
  previewMainContainer: { flex: 1, backgroundColor: "#5f5fff" },
  previewTopSection: { backgroundColor: "#5f5fff", alignItems: "center", paddingTop: hp("3%"), paddingBottom: hp("2.5%"), position: "relative" },
  crossPreviewButton: { position: "absolute", top: hp("1%"), left: wp("5%"), zIndex: 10, height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: wp("4%") },
  editPreviewButton: { position: "absolute", top: hp("1%"), right: wp("5%"), zIndex: 10, height: wp("8%"), width: wp("8%"), alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: wp("4%") },
  previewHeaderText: { color: "#ffffff", fontSize: wp("3%"), fontWeight: "600", letterSpacing: 1.5, marginBottom: hp("1%"), fontFamily: "Poppins_600SemiBold" },
  profileImagePreview: { height: wp("35%"), width: wp("35%"), borderRadius: wp("50%"), borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", marginBottom: hp("1.5%") },
  studentName: { color: "#ffffff", fontSize: wp("5.5%"), fontWeight: "600", fontFamily: "Poppins_600SemiBold", marginTop: hp("0.8%"), textAlign: "center", paddingHorizontal: wp("10%") },
  previewCardsContainer: { paddingHorizontal: wp("6%"), paddingTop: hp("2%"), paddingBottom: hp("2%"), flex: 1 },
  previewCardRow: { flexDirection: "row", justifyContent: "space-between", gap: wp("2.5%") },
  previewCard: { flex: 1, backgroundColor: "#ffffff", borderRadius: wp("3%"), padding: wp("4%"), alignItems: "center", justifyContent: "center", minHeight: hp("14%"), maxHeight: hp("16%") },
  previewCardLabel: { color: "#7a7a7a", fontSize: wp("3%"), fontWeight: "600", marginTop: hp("0.5%"), marginBottom: hp("0.3%"), fontFamily: "Poppins_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  previewCardValue: { color: "#000000", fontSize: wp("8%"), fontWeight: "bold", fontFamily: "Poppins_600SemiBold" },
  previewCardSuperscript: { color: "#000000", fontSize: wp("3.5%"), fontWeight: "600", fontFamily: "Poppins_600SemiBold" },
  previewCardValueSmall: { color: "#000000", fontSize: wp("3.5%"), fontWeight: "600", textAlign: "center", fontFamily: "Poppins_600SemiBold" },
  previewFullWidthCard: { backgroundColor: "#e8e8ff", borderRadius: wp("3%"), padding: wp("4%"), flexDirection: "row", alignItems: "center", gap: wp("3%"), minHeight: hp("10%"), maxHeight: hp("12%"), marginTop: hp("1.5%") },
  previewFullWidthCardText: { flex: 1 },
  previewFullWidthCardLabel: { color: "#7a7a7a", fontSize: wp("3%"), fontWeight: "600", marginBottom: hp("0.3%"), fontFamily: "Poppins_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  previewFullWidthCardValue: { color: "#000000", fontSize: wp("3.5%"), fontWeight: "500", fontFamily: "Poppins_600SemiBold" },
});

// ─────────────────────────────────────────────────────────────────────────────
//  WEB EDIT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const webEdit = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eaecf5' },
  topBar: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  brand: { fontSize: 18, fontWeight: '800', color: '#5f5fff', letterSpacing: 0.3 },
  scrollContent: { paddingHorizontal: 32, paddingBottom: 40, paddingTop: 24 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 22 },
  card: { backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  leftPanel: { width: 220, minWidth: 200, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#f0f0f5', padding: 24, alignItems: 'center', minHeight: 560 },
  photoBox: { width: 140, height: 140, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 14, position: 'relative', overflow: 'visible' },
  photoImg: { width: 140, height: 140, borderRadius: 14 },
  photoPlaceholder: { width: 140, height: 140, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  photoEditCircle: { position: 'absolute', bottom: -6, right: -6, width: 34, height: 34, borderRadius: 17, backgroundColor: '#5f5fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', zIndex: 10 },
  photoLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  photoHint: { fontSize: 11.5, color: '#9ca3af', textAlign: 'center', lineHeight: 17, marginBottom: 18 },
  uploadPhotoBtn: { backgroundColor: '#5f5fff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', width: '100%' },
  uploadPhotoBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  completionWrap: { width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f0f5' },
  completionLabel: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 8 },
  progressTrack: { height: 7, backgroundColor: '#e5e7eb', borderRadius: 4, width: '100%', marginBottom: 6 },
  progressFill: { height: 7, backgroundColor: '#5f5fff', borderRadius: 4 },
  completionPct: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  rightPanel: { flex: 1, padding: 28 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#5f5fff', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eef0fb', paddingBottom: 8 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  formRowFull: { marginBottom: 16 },
  formField: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#374151', marginBottom: 6, letterSpacing: 0.4 },
  req: { color: '#ef4444' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, backgroundColor: '#fff', color: '#111827', height: 42 },
  inputErr: { borderColor: '#ef4444' },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#d1d5db' },
  errTxt: { fontSize: 11, color: '#ef4444', marginTop: 3 },
  pickerWrap: { padding: 0, paddingHorizontal: 0, overflow: 'hidden', justifyContent: 'center' },
  pickerInner: { height: 42, color: '#111827', fontSize: 13.5, borderWidth: 0, backgroundColor: 'transparent' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  previewBtn: { borderWidth: 1.5, borderColor: '#5f5fff', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  previewBtnTxt: { color: '#5f5fff', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: '#5f5fff', borderRadius: 8, paddingVertical: 11, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  WEB PREVIEW STYLES
// ─────────────────────────────────────────────────────────────────────────────
const webPreview = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#5f5fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  patternLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, overflow: 'hidden' },
  patternRow: { flexDirection: 'row', flexWrap: 'nowrap' },
  patternChar: { color: '#fff', fontSize: 22, fontWeight: '700', width: 36, textAlign: 'center', lineHeight: 38 },
  card: { backgroundColor: '#fff', borderRadius: 20, width: '88%', maxWidth: 960, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 20, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center' },
  closeBtnTxt: { fontSize: 22, color: '#555', lineHeight: 28, marginTop: -2 },
  cardBody: { flexDirection: 'row', padding: 32, paddingTop: 40, gap: 32 },
  leftCol: { width: '36%', alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarBg: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#fde8d8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: 156, height: 156, borderRadius: 78 },
  onlineDot: { position: 'absolute', bottom: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  nameText: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 4, textAlign: 'center' },
  emailText: { fontSize: 14, color: '#5f5fff', textDecorationLine: 'underline', marginBottom: 20 },
  contactCard: { backgroundColor: '#eef2ff', borderRadius: 14, padding: 16, width: '100%', gap: 14 },
  contactTitle: { fontSize: 15, fontWeight: '700', color: '#5f5fff', marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  contactIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#5f5fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  contactVal: { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 },
  rightCol: { flex: 1 },
  aboutTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginBottom: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9ff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 2 },
  tilesRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  tile: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  tileImg: { width: '100%', height: 110 },
  tileLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, paddingHorizontal: 10, paddingTop: 8, textAlign: 'center' },
  tileVal: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', paddingBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  memberSince: { fontSize: 12, color: '#aaa' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  activeText: { fontSize: 12, color: '#555', fontWeight: '600' },
});