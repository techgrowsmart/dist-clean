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
import React, { useEffect, useState, useCallback, useMemo } from "react";
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

// Memoized constants to prevent recreation
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
  const { userType } = useLocalSearchParams<{ userType: string; userEmail: string }>();
  
  // Consolidated state management
  const [profileData, setProfileData] = useState({
    studentName: "", email: "", phone: "", profileImage: null as string | null,
    dateOfBirth: "", educationBoard: "", instituteName: "", preferredMedium: "",
    fullAddress: "", stateName: "", pincode: "", country: "", classYear: ""
  });
  
  const [uiState, setUiState] = useState({
    showPicker: false, showEditForm: false, modalVisible: false, 
    previewModalVisible: false, isLoading: true
  });
  
  const [boards, setBoards] = useState<Array<{ boardName: string; boardId?: string }>>([]);
  const navigation = useNavigation();

  // Memoized setters to prevent unnecessary re-renders
  const updateProfileData = useCallback((updates: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  useFocusEffect(React.useCallback(() => {
    const onBack = () => {
      if (uiState.showEditForm) { updateUiState({ showEditForm: false }); return true; }
      if (uiState.previewModalVisible) { updateUiState({ previewModalVisible: false }); return true; }
      if (uiState.modalVisible) { updateUiState({ modalVisible: false }); return true; }
      router.back(); return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [router, uiState.showEditForm, uiState.previewModalVisible, uiState.modalVisible, updateUiState]));

  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, OpenSans_600SemiBold });

  // Optimized validation with memoization
  const validateForm = useCallback(() => {
    const e: FormErrors = {};
    if (!profileData.studentName.trim()) e.studentName = "Name is required.";
    if (!profileData.phone.trim()) e.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(profileData.phone)) e.phone = "Phone number must be 10 digits.";
    if (!profileData.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(profileData.email)) e.email = "Please enter a valid email.";
    if (!profileData.dateOfBirth.trim()) e.dateOfBirth = "Date of Birth is required.";
    if (!profileData.educationBoard.trim()) e.educationBoard = "Board is required.";
    if (!profileData.instituteName.trim()) e.instituteName = "Institute Name is required.";
    if (!profileData.preferredMedium.trim()) e.preferredMedium = "Medium is required.";
    if (!profileData.classYear) e.classYear = "Class is required.";
    if (profileData.pincode && !/^\d{6}$/.test(profileData.pincode)) e.pincode = "Pincode must be 6 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [profileData]);

  const onChange = useCallback((event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) updateProfileData({ dateOfBirth: selectedDate.toLocaleDateString("en-GB") });
    updateUiState({ showPicker: false });
  }, [updateProfileData, updateUiState]);

  // Optimized API call with error handling
  const fetchProfileAndBoards = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) { 
        Alert.alert("Error", "Please login again"); 
        updateUiState({ isLoading: false });
        return; 
      }
      
      const headers = { Authorization: `Bearer ${auth.token}` };
      
      // Parallel API calls for better performance
      const [profileResponse, boardsResponse] = await Promise.allSettled([
        axios.post(`${BASE_URL}/api/sudentProfile`, { email: auth.email }, { headers }),
        axios.post(`${BASE_URL}/api/allboards`, { category: "student" }, { headers }).catch(() => null)
      ]);

      if (profileResponse.status === 'fulfilled') {
        const data = profileResponse.value.data;
        updateProfileData({
          studentName: data.name || "", email: data.email || "", phone: data.phone || "",
          profileImage: data.profileimage || null, dateOfBirth: data.dateOfBirth || "",
          educationBoard: data.educationBoard || "", instituteName: data.instituteName || "",
          preferredMedium: data.preferredMedium || "", fullAddress: data.fullAddress || "",
          stateName: data.stateName || "", pincode: data.pincode || "",
          country: data.country || "", classYear: data.classYear || ""
        });
      }

      if (boardsResponse.status === 'fulfilled' && boardsResponse.value) {
        const arr = Array.isArray(boardsResponse.value.data) ? boardsResponse.value.data : [];
        setBoards(arr.map((b: any) => ({ boardName: b.boardName, boardId: b.boardId })).filter((b: any) => b.boardName));
      } else {
        setBoards([{ boardName: 'CBSE' }, { boardName: 'ICSE' }, { boardName: 'State Board' }]);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert("Error", "Failed to load profile. Please try again later.");
    } finally {
      updateUiState({ isLoading: false });
    }
  }, [updateProfileData, updateUiState]);

  const isDesktop = screenWidth >= 1024;

  // Optimized initialization with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => { 
      if (isMounted) {
        await fetchProfileAndBoards(); 
      }
    };
    
    init();
    
    // Optimized animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Reduced from 700ms
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
  }, [fetchProfileAndBoards, fadeAnim]);

  // Memoized completion percentage
  const getCompletionPct = useMemo(() => {
    const fields = [profileData.studentName, profileData.email, profileData.dateOfBirth, profileData.phone, profileData.educationBoard, profileData.instituteName, profileData.preferredMedium, profileData.classYear];
    return Math.round((fields.filter(f => f?.trim()).length / fields.length) * 100);
  }, [profileData]);

  if (uiState.isLoading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5f5fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Rest of the component remains the same but with optimized state access
  const { studentName, email, phone, profileImage, dateOfBirth, educationBoard, instituteName, preferredMedium, fullAddress, stateName, pincode, country, classYear } = profileData;
  const { showPicker, showEditForm, modalVisible, previewModalVisible } = uiState;

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const profilePayload = {
        name: studentName,
        email,
        phone,
        profileimage: profileImage,
        dateOfBirth,
        educationBoard,
        instituteName,
        preferredMedium,
        fullAddress,
        stateName,
        pincode,
        country,
        classYear
      };

      await axios.post(`${BASE_URL}/api/updateStudentProfile`, profilePayload, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      await setDoc(doc(db, "users", auth.email), {
        ...profilePayload,
        userType: "student",
        updatedAt: new Date()
      });

      Alert.alert("Success", "Profile updated successfully!");
      updateUiState({ showEditForm: false });
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        updateProfileData({ profileImage: manipulatedImage.uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  if (uiState.isLoading || !fontsLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5f5fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Student Profile</Text>
          <Text style={styles.pageSubtitle}>Manage your personal information and academic details</Text>

          <View style={styles.card}>
            <View style={styles.leftPanel}>
              <View style={styles.photoBox}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.photoImg} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <FontAwesome name="user" size={48} color="#9ca3af" />
                  </View>
                )}
                <TouchableOpacity style={styles.photoEditCircle} onPress={pickImage}>
                  <FontAwesome name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoLabel}>Profile Photo</Text>
              <Text style={styles.photoHint}>Tap the camera icon to update your photo</Text>
              <TouchableOpacity style={styles.uploadPhotoBtn} onPress={pickImage}>
                <Text style={styles.uploadPhotoBtnTxt}>Upload Photo</Text>
              </TouchableOpacity>
              <View style={styles.completionWrap}>
                <Text style={styles.completionLabel}>Profile Completion</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${getCompletionPct}%` }]} />
                </View>
                <Text style={styles.completionPct}>{getCompletionPct}% Complete</Text>
              </View>
            </View>

            <View style={styles.rightPanel}>
              <Text style={styles.sectionLabel}>Personal Information</Text>
              
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.studentName && styles.inputErr]}
                    value={studentName}
                    onChangeText={(text) => updateProfileData({ studentName: text })}
                    placeholder="Enter your full name"
                  />
                  {errors.studentName && <Text style={styles.errTxt}>{errors.studentName}</Text>}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Email <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputErr]}
                    value={email}
                    onChangeText={(text) => updateProfileData({ email: text })}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && <Text style={styles.errTxt}>{errors.email}</Text>}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Phone <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputErr]}
                    value={phone}
                    onChangeText={(text) => updateProfileData({ phone: text })}
                    placeholder="Enter 10-digit phone number"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {errors.phone && <Text style={styles.errTxt}>{errors.phone}</Text>}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.req}>*</Text></Text>
                  <TouchableOpacity 
                    style={[styles.input, { justifyContent: 'center' }]} 
                    onPress={() => updateUiState({ showPicker: true })}
                  >
                    <Text style={{ color: dateOfBirth ? '#111827' : '#9ca3af' }}>
                      {dateOfBirth || 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {errors.dateOfBirth && <Text style={styles.errTxt}>{errors.dateOfBirth}</Text>}
                </View>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Academic Information</Text>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Education Board <Text style={styles.req}>*</Text></Text>
                  <View style={[styles.pickerWrap, errors.educationBoard && styles.inputErr]}>
                    <Picker
                      selectedValue={educationBoard}
                      onValueChange={(value) => updateProfileData({ educationBoard: value })}
                      style={styles.pickerInner}
                    >
                      <Picker.Item label="Select Board" value="" />
                      {boards.map((board, index) => (
                        <Picker.Item key={index} label={board.boardName} value={board.boardName} />
                      ))}
                    </Picker>
                  </View>
                  {errors.educationBoard && <Text style={styles.errTxt}>{errors.educationBoard}</Text>}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Class/Year <Text style={styles.req}>*</Text></Text>
                  <View style={[styles.pickerWrap, errors.classYear && styles.inputErr]}>
                    <Picker
                      selectedValue={classYear}
                      onValueChange={(value) => updateProfileData({ classYear: value })}
                      style={styles.pickerInner}
                    >
                      <Picker.Item label="Select Class" value="" />
                      {CLASS_OPTIONS.map((cls, index) => (
                        <Picker.Item key={index} label={cls} value={cls} />
                      ))}
                    </Picker>
                  </View>
                  {errors.classYear && <Text style={styles.errTxt}>{errors.classYear}</Text>}
                </View>
              </View>

              <View style={styles.formRowFull}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Institute Name <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.instituteName && styles.inputErr]}
                    value={instituteName}
                    onChangeText={(text) => updateProfileData({ instituteName: text })}
                    placeholder="Enter your school/college name"
                  />
                  {errors.instituteName && <Text style={styles.errTxt}>{errors.instituteName}</Text>}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Preferred Medium <Text style={styles.req}>*</Text></Text>
                  <View style={[styles.pickerWrap, errors.preferredMedium && styles.inputErr]}>
                    <Picker
                      selectedValue={preferredMedium}
                      onValueChange={(value) => updateProfileData({ preferredMedium: value })}
                      style={styles.pickerInner}
                    >
                      <Picker.Item label="Select Medium" value="" />
                      <Picker.Item label="English" value="English" />
                      <Picker.Item label="Hindi" value="Hindi" />
                      <Picker.Item label="Regional Language" value="Regional Language" />
                    </Picker>
                  </View>
                  {errors.preferredMedium && <Text style={styles.errTxt}>{errors.preferredMedium}</Text>}
                </View>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={[styles.input, errors.pincode && styles.inputErr]}
                    value={pincode}
                    onChangeText={(text) => updateProfileData({ pincode: text })}
                    placeholder="Enter 6-digit pincode"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  {errors.pincode && <Text style={styles.errTxt}>{errors.pincode}</Text>}
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.previewBtn} onPress={() => updateUiState({ previewModalVisible: true })}>
                  <Text style={styles.previewBtnTxt}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnTxt}>Save Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <DateTimePicker
          value={dateOfBirth ? new Date(dateOfBirth.split('/').reverse().join('-')) : new Date()}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}

      {previewModalVisible && (
        <Modal transparent={true} animationType="fade">
          <View style={webPreview.overlay}>
            <View style={webPreview.patternLayer}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={webPreview.patternRow}>
                  {Array.from({ length: 30 }).map((_, j) => (
                    <Text key={j} style={webPreview.patternChar}>◆</Text>
                  ))}
                </View>
              ))}
            </View>
            <View style={webPreview.card}>
              <View style={webPreview.cardHeader}>
                <TouchableOpacity style={webPreview.closeBtn} onPress={() => updateUiState({ previewModalVisible: false })}>
                  <Text style={webPreview.closeBtnTxt}>×</Text>
                </TouchableOpacity>
                <TouchableOpacity style={webPreview.editBtn} onPress={() => updateUiState({ previewModalVisible: false, showEditForm: true })}>
                  <FontAwesome name="edit" size={16} color="#5f5fff" />
                </TouchableOpacity>
              </View>
              <View style={webPreview.cardBody}>
                <View style={webPreview.leftCol}>
                  <View style={webPreview.avatarWrap}>
                    <View style={webPreview.avatarBg}>
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={webPreview.avatar} />
                      ) : (
                        <FontAwesome name="user" size={60} color="#f97316" />
                      )}
                    </View>
                    <View style={webPreview.onlineDot} />
                  </View>
                  <Text style={webPreview.nameText}>{studentName || 'Your Name'}</Text>
                  <Text style={webPreview.emailText}>{email}</Text>
                  <View style={webPreview.contactCard}>
                    <Text style={webPreview.contactTitle}>Contact Information</Text>
                    <View style={webPreview.contactRow}>
                      <View style={webPreview.contactIconCircle}>
                        <PhoneIcon width={20} height={20} color="#fff" />
                      </View>
                      <View style={webPreview.contactInfo}>
                        <Text style={webPreview.contactLabel}>Phone</Text>
                        <Text style={webPreview.contactVal}>{phone || 'Not provided'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={webPreview.rightCol}>
                  <Text style={webPreview.aboutTitle}>Academic Information</Text>
                  <View style={webPreview.infoCard}>
                    <SchoolIcon width={24} height={24} color="#5f5fff" />
                    <View style={webPreview.infoText}>
                      <Text style={webPreview.infoLabel}>Education Board</Text>
                      <Text style={webPreview.infoValue}>{educationBoard || 'Not specified'}</Text>
                    </View>
                  </View>
                  <View style={webPreview.infoCard}>
                    <BookOpenReaderIcon width={24} height={24} color="#5f5fff" />
                    <View style={webPreview.infoText}>
                      <Text style={webPreview.infoLabel}>Class/Year</Text>
                      <Text style={webPreview.infoValue}>{classYear || 'Not specified'}</Text>
                    </View>
                  </View>
                  <View style={webPreview.infoCard}>
                    <Map width={24} height={24} color="#5f5fff" />
                    <View style={webPreview.infoText}>
                      <Text style={webPreview.infoLabel}>Institute</Text>
                      <Text style={webPreview.infoValue}>{instituteName || 'Not specified'}</Text>
                    </View>
                  </View>
                  <View style={webPreview.tilesRow}>
                    <View style={webPreview.tile}>
                      <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/1827/1827422.png" }} style={webPreview.tileImg} />
                      <Text style={webPreview.tileLabel}>Age</Text>
                      <Text style={webPreview.tileVal}>{calculateAge(dateOfBirth)}</Text>
                    </View>
                    <View style={webPreview.tile}>
                      <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png" }} style={webPreview.tileImg} />
                      <Text style={webPreview.tileLabel}>Medium</Text>
                      <Text style={webPreview.tileVal}>{preferredMedium || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={webPreview.footer}>
                <Text style={webPreview.memberSince}>Member since 2024</Text>
                <View style={webPreview.activeRow}>
                  <View style={webPreview.activeDot} />
                  <Text style={webPreview.activeText}>Active Now</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
