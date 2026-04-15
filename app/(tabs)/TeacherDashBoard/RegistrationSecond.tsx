import { LogBox } from 'react-native';
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Poppins_400Regular,
  Poppins_300Light,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Roboto_300Light, Roboto_400Regular } from "@expo-google-fonts/roboto";
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { router } from "expo-router";
import Camera from "../../../assets/svgIcons/Camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { BASE_URL } from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthData } from "../../../utils/authStorage";
import { Platform } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Feather } from "@expo/vector-icons";
import CropConfirmationModal from "../../../components/ImageConfirmation";

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

const { height, width } = Dimensions.get("window");
const RegistrationSecond = () => {
  const [errors, setErrors] = useState<Record<string, string>>({}); // FIXED: Added type
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [state, setState] = useState("West Bengal");
  const [country, setCountry] = useState("India");
  const [highestDegree, setHighestDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  // REMOVED: const [teachingExperience, setTeachingExperience] = useState("");
  const [panUpload, setPanUpload] = useState("");
  const [aadharFront, setAadharFront] = useState("");
  const [aadharBack, setAadharBack] = useState("");
  const [selfieAadharFront, setSelfieAadharFront] = useState("");
  const [selfieAadharBack, setSelfieAadharBack] = useState("");
  const [certifications, setCertifications] = useState<string[]>(Array(3).fill(""));
  const [highestQualificationCertificate, setHighestQualificationCertificate] = useState<string[]>(Array(3).fill(""));
  const [experience, setExperience] = useState("");
  // REMOVED: const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingImageAction, setPendingImageAction] = useState<(() => void) | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_300Light,
    Poppins_600SemiBold,
    Roboto_300Light,
    Roboto_400Regular, 
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!residentialAddress.trim())
      newErrors.residentialAddress = "Address is required.";
    if (!state.trim()) newErrors.state = "State is required.";
    if (!country.trim()) newErrors.country = "Country is required.";
    if (!highestDegree.trim()) newErrors.highestDegree = "Degree is required.";
    if (!specialization.trim())
      newErrors.specialization = "Specialization is required.";
    if (!experience.trim()) newErrors.experience = "Experience is required.";
    if (!panUpload) newErrors.panUpload = "PAN image is required.";
    if (!aadharFront) newErrors.aadharFront = "Aadhar front image is required.";
    if (!aadharBack) newErrors.aadharBack = "Aadhar back image is required.";
    if (!selfieAadharFront)
      newErrors.selfieAadharFront = "Selfie (front) is required.";
    if (!selfieAadharBack)
      newErrors.selfieAadharBack = "Selfie (back) is required.";
    
    const hasCertifications = certifications.some(cert => cert && cert.trim() !== "");
    if (!hasCertifications) {
      newErrors.certifications = "At least one certification is required.";
    }

    const hasQualificationCerts = highestQualificationCertificate.some(cert => cert && cert.trim() !== "");
    if (!hasQualificationCerts) {
      newErrors.highestQualificationCertificate =
        "At least one qualification certificate is required.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("name");
        const storedPhone = await AsyncStorage.getItem("phoneNumber");
        const storedEmail = await AsyncStorage.getItem("email");

        if (storedName) setFullName(storedName);
        if (storedPhone) setPhoneNumber(storedPhone);
        if (storedEmail) setEmail(storedEmail);
        const auth = await getAuthData();
        const token = auth?.token;
        console.log("Token", token);
      } catch (error) {
        console.error("Failed to load user data from storage:", error);
      }
    };

    loadUserData();
  }, []);

  const uploadSingleImage = async (uri: string, fieldName: string) => {
    if (!uri || !uri.startsWith("file://")) {
      console.warn(`🚫 Skipping ${fieldName}: invalid URI`, uri);
      return null;
    }

    const filename = uri.split("/").pop() || `${fieldName}_${Date.now()}.jpg`;
    const ext = filename.split(".").pop();
    const mimeType = ext ? `image/${ext}` : "image/jpeg";

    const formData = new FormData();
    formData.append(fieldName, {
      uri,
      name: filename,
      type: mimeType,
    } as any);

    try {
      const auth = await getAuthData();
      const token = auth?.token;
      
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error(`Upload failed for ${fieldName}:`, error);
      return null;
    }
  };

  const uploadMultipleImages = async (uris: string[], fieldName: string) => {
    const urls: string[] = [];

    for (let uri of uris) {
      const url = await uploadSingleImage(uri, fieldName);
      if (url) urls.push(url);
    }

    return urls;
  };

  const pickImageAndReplaceIndex = async (
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    currentList: string[]
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const newList = [...currentList];
        newList[index] = manipulatedImage.uri;
        setList(newList);
      }
    } catch (error) {
      console.log("Image Picker Error:", error);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    try {
      const formData = new FormData();
      const userId = await AsyncStorage.getItem("userId");

      formData.append("userId", userId);
      formData.append("fullname", fullName);
      formData.append("phoneNumber", phoneNumber);
      formData.append("email", email);
      formData.append("residentialAddress", residentialAddress);
      formData.append("state", state);
      formData.append("country", country);
      formData.append("experience", experience);
      formData.append("specialization", specialization);
      formData.append("heighest_degree", highestDegree);

      // FIXED: Added proper types to appendFile
      const appendFile = async (
        fieldName: string, 
        fileUri: string, 
        fileName: string = "image.jpg"
      ) => {
        if (!fileUri) return;

        if (Platform.OS === "web") {
          try {
            const response = await fetch(fileUri);
            const blob = await response.blob();
            const file = new File([blob], fileName, {
              type: blob.type || "image/jpeg",
            });
            formData.append(fieldName, file);
          } catch (error) {
            console.warn(`Failed to append ${fieldName} for web`, error);
          }
        } else {
          formData.append(fieldName, {
            uri: fileUri,
            name: fileName,
            type: "image/jpeg",
          } as any);
        }
      };

      await appendFile("panUpload", panUpload, "pan.jpg");
      await appendFile("aadhar_front", aadharFront, "aadhar_front.jpg");
      await appendFile("aadhar_back", aadharBack, "aadhar_back.jpg");
      await appendFile(
        "selfieWith_addhar_front",
        selfieAadharFront,
        "selfie_front.jpg"
      );
      await appendFile(
        "selfieWith_aadhar_back",
        selfieAadharBack,
        "selfie_back.jpg"
      );

      for (let i = 0; i < certifications.length; i++) {
        await appendFile("certification", certifications[i], `cert_${i}.jpg`);
      }

      for (let i = 0; i < highestQualificationCertificate.length; i++) {
        await appendFile(
          "heighest_qualification",
          highestQualificationCertificate[i],
          `qual_${i}.jpg`
        );
      }

      let token;
      if (Platform.OS === "web") {
        token = localStorage.getItem("token");
      } else {
        const auth = await getAuthData();
        if (!auth?.token) {
          router.replace("/");
          return;
        }
        token = auth.token;
      }

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        router.push("/(tabs)/TeacherDashBoard/Registration2");
      } else {
        Alert.alert(result.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      Alert.alert("An error occurred while submitting the form");
    }
  };

  const handleCamera = async (onCapture: (uri: string) => void) => {
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
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setPendingImageAction(() => onCapture);
      setShowCropModal(true);
    }
  };

  const handleImageSelection = async (onPick: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setPendingImageAction(() => onPick);
        setShowCropModal(true);
      }
    } catch (error) {
      console.log("Image Picker Error:", error);
    }
  };

  const handleCropConfirm = async () => {
    if (pendingImageAction && selectedImageUri) {
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        pendingImageAction(manipulatedImage.uri);
      } catch (error) {
        console.log("Image processing error:", error);
      } finally {
        setShowCropModal(false);
        setPendingImageAction(null);
        setSelectedImageUri(null);
      }
    }
  };

  const handleCertificationImage = async (index: number) => {
    handleImageSelection((uri) => {
      const newList = [...certifications];
      newList[index] = uri;
      setCertifications(newList);
    });
  };

  const handleQualificationImage = async (index: number) => {
    handleImageSelection((uri) => {
      const newList = [...highestQualificationCertificate];
      newList[index] = uri;
      setHighestQualificationCertificate(newList);
    });
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setPendingImageAction(null);
    setSelectedImageUri(null);
  };

    if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5f5fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <BackArrowIcon height={24} width={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Registration</Text>
          </View>

          {/* Form */}
          <View style={styles.content}>
            <Text style={styles.tutor}>Befcome a Tutor</Text>

            <View style={styles.mainContent}>
              <Text style={styles.mainContentTtile}>Personal Information</Text>
              <View style={styles.inputs}>
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.contentInput,
                    errors.fullName && styles.inputError,
                  ]}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setErrors({ ...errors, fullName: "" });
                  }}
                />
                {errors.fullName ? (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                ) : null}

                <TextInput
                  placeholder="Enter your phone number"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.contentInput,
                    errors.phoneNumber && styles.inputError,
                  ]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrors({ ...errors, phoneNumber: "" });
                  }}
                />
                {errors.phoneNumber ? (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                ) : null}
                <TextInput
                  placeholder="Enter your email address"
                  placeholderTextColor={"#94a3b8"}
                  style={[styles.contentInput, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: "" });
                  }}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
                <TextInput
                  placeholder="Enter your residential address"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.AddressInput,
                    errors.residentialAddress && styles.inputError,
                  ]}
                  value={residentialAddress}
                  onChangeText={(text) => {
                    setResidentialAddress(text);
                    setErrors({ ...errors, residentialAddress: "" });
                  }}
                />
                {errors.residentialAddress ? (
                  <Text style={styles.errorText}>
                    {errors.residentialAddress}
                  </Text>
                ) : null}
                <TextInput
                  placeholder="Enter your state"
                  placeholderTextColor={"#94a3b8"}
                  style={[styles.contentInput, errors.state && styles.inputError]}
                  value={state}
                  editable={false}
                  onChangeText={(text) => {
                    setState(text);
                    setErrors({ ...errors, state: "" });
                  }}
                />
                {errors.state ? (
                  <Text style={styles.errorText}>{errors.state}</Text>
                ) : null}
                <TextInput
                  placeholder=" Country"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.contentInput,
                    errors.country && styles.inputError,
                  ]}
                  value={country}
                  editable={false}
                  onChangeText={(text) => {
                    setCountry(text);
                    setErrors({ ...errors, country: "" });
                  }}
                />
                {errors.country ? (
                  <Text style={styles.errorText}>{errors.country}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.identityVerification}>
              <Text style={styles.tutor}>Identity Verification</Text>
              <View style={styles.uploads}>
                <View style={styles.individualUpload}>
                  <Text style={[styles.uploadLabel, { fontFamily: 'Roboto_400Regular' }]}>Upload PAN</Text>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setPanUpload)}
                    style={styles.imageContainer}
                  >
                    {panUpload ? (
                      <Image source={{ uri: panUpload }} style={styles.iconImage} />
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Feather name="upload-cloud" size={wp("12%")} color="rgba(0,0,0,0.25)" />
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.panUpload ? (
                    <Text style={styles.errorText}>{errors.panUpload}</Text>
                  ) : null}
                </View>
                
                <View style={styles.individualUpload}>
                  <Text style={[styles.uploadLabel, { fontFamily: 'Roboto_400Regular' }]}>Upload Aadhar Front</Text>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setAadharFront)}
                    style={styles.imageContainer}
                  >
                    {aadharFront ? (
                      <Image source={{ uri: aadharFront }} style={styles.iconImage} />
                    ) : (
                      <View style={styles.uploadIconContainer}>
                      <Feather name="upload-cloud" size={wp("12%")} color="rgba(0,0,0,0.25)" />
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.aadharFront ? (
                    <Text style={styles.errorText}>{errors.aadharFront}</Text>
                  ) : null}
                </View>

                <View style={styles.individualUpload}>
                  <Text style={[styles.uploadLabel, { fontFamily: 'Roboto_400Regular' }]}>Upload Aadhar Back</Text>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setAadharBack)}
                    style={styles.imageContainer}
                  >
                    {aadharBack ? (
                      <Image source={{ uri: aadharBack }} style={styles.iconImage} />
                    ) : (
                      <View style={styles.uploadIconContainer}> 
                      <Feather name="upload-cloud" size={wp("12%")} color="rgba(0,0,0,0.25)" />
                     </View>
                    )}
                  </TouchableOpacity>
                  {errors.aadharBack ? (
                    <Text style={styles.errorText}>{errors.aadharBack}</Text>
                  ) : null}
                </View>
              </View>

              {/* Selfie with Aadhar Front */}
              <View style={styles.cameraContainer}>
                <Text style={styles.cameraTitle}>
                  Capture Selfie with Aadhar Card Front
                </Text>
                <TouchableOpacity
                  style={styles.camera}
                  onPress={() => handleCamera(setSelfieAadharFront)}
                >
                  {selfieAadharFront ? (
                    <Image
                      source={{ uri: selfieAadharFront }}
                      style={styles.iconImage}
                    />
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Camera
                        height={wp("7%")}
                        width={wp("7%")}
                        color="#4255ff"
                      />
                    </View>
                  )}
                </TouchableOpacity>
                {errors.selfieAadharFront ? (
                  <Text style={styles.errorText}>{errors.selfieAadharFront}</Text>
                ) : null}
              </View>

              {/* Selfie with Aadhar Back */}
              <View style={styles.cameraContainer}>
                <Text style={styles.cameraTitle}>
                  Capture Selfie with Aadhar Card Backside
                </Text>
                <TouchableOpacity
                  style={styles.camera}
                  onPress={() => handleCamera(setSelfieAadharBack)}
                >
                  {selfieAadharBack ? (
                    <Image
                      source={{ uri: selfieAadharBack }}
                      style={styles.iconImage}
                    />
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Camera
                        height={wp("7%")}
                        width={wp("7%")}
                        color="#4255ff"
                      />
                    </View>
                  )}
                </TouchableOpacity>
                {errors.selfieAadharBack ? (
                  <Text style={styles.errorText}>{errors.selfieAadharBack}</Text>
                ) : null}
              </View>
            </View> {/* Close identityVerification View */}

            <View style={styles.identityVerification}>
              <Text style={styles.tutor}>Educational Qualifications</Text>
              <View style={styles.inputs}>
                <TextInput
                  placeholder="Enter your highest degree (e.g., M.Sc., Ph.D.)"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.contentInput,
                    errors.highestDegree && styles.inputError,
                  ]}
                  value={highestDegree}
                  onChangeText={(text) => {
                    setHighestDegree(text);
                    setErrors({ ...errors, highestDegree: "" });
                  }}
                />
                {errors.highestDegree ? (
                  <Text style={styles.errorText}>{errors.highestDegree}</Text>
                ) : null}
                <TextInput
                  placeholder="Enter your specialization (e.g., English, Physics)"
                  placeholderTextColor={"#94a3b8"}
                  style={[
                    styles.contentInput,
                    errors.specialization && styles.inputError,
                  ]}
                  value={specialization}
                  onChangeText={(text) => {
                    setSpecialization(text);
                    setErrors({ ...errors, specialization: "" });
                  }}
                />
                {errors.specialization ? (
                  <Text style={styles.errorText}>{errors.specialization}</Text>
                ) : null}
                <TextInput
                  placeholder="Enter teaching experience in years"
                  placeholderTextColor={"#94a3b8"}
                  style={styles.contentInput}
                  value={experience}
                  onChangeText={(text) => {
                    setExperience(text);
                    setErrors({ ...errors, experience: "" });
                  }}
                />
                {errors.experience ? (
                  <Text style={styles.errorText}>{errors.experience}</Text>
                ) : null}
              </View>
            </View>
            
            <View style={{marginBottom:hp('1.8%')}}>
              <Text style={styles.tutor}>Certification</Text>
              <View style={styles.imageRow}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCertificationImage(index)}
                    style={styles.imageBox}
                  >
                    {certifications[index] ? (
                      <Image
                        source={{ uri: certifications[index] }}
                        style={styles.iconImage}
                      />
                    ) : (
                      <View style={styles.uploadIconContainer}>
                      <Feather name="upload-cloud" size={wp("12%")} color="rgba(0,0,0,0.25)" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.certifications ? (
                <Text style={styles.errorText}>{errors.certifications}</Text>
              ) : null}
            </View>

            <View style={{marginBottom:hp('1.8%')}}>
              <Text style={styles.tutor}>And Highest Qualification Certificate</Text>
              <View style={styles.imageRow}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQualificationImage(index)}
                    style={styles.imageBox}
                  >
                    {highestQualificationCertificate[index] ? (
                      <Image
                        source={{ uri: highestQualificationCertificate[index] }}
                        style={styles.iconImage}
                      />
                    ) : (
                      <View style={styles.uploadIconContainer}>
                      <Feather name="upload-cloud" size={wp("12%")} color="rgba(0,0,0,0.25)" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.highestQualificationCertificate ? (
                <Text style={styles.errorText}>{errors.highestQualificationCertificate}</Text>
              ) : null}
            </View>

            <View style={styles.btn}>
              <TouchableOpacity style={styles.btnContainer} onPress={handleUpdate}>
                <Text style={styles.btnTxt}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CropConfirmationModal
        visible={showCropModal}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </SafeAreaView>
  );
};

export default RegistrationSecond;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", marginTop: hp("2%") },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  inputError: { borderColor: "red", borderWidth: 1 },
  errorText: { color: "red", fontSize: wp("3%"), marginBottom: 6, marginTop: -6, fontFamily: "Poppins_400Regular" },
  backButton: { backgroundColor: "#f5f6f8", width: wp("8%"), height: wp("8%"), borderRadius: wp("50%"), padding: wp("2.5%"), alignItems: "center", justifyContent: "center", position: "absolute", left: 0 },
  scrollContainer: { paddingBottom: hp("5%"), paddingHorizontal: wp("5.3%") },
  header: { paddingTop: hp("1%"), flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
  title: { 
    fontSize: wp("5%"),
    fontWeight: "600", 
    fontFamily: "Poppins_600SemiBold", 
    color: "#030303", 
    lineHeight: hp("6%"),
    textAlign: "center", 
    paddingHorizontal: wp("3%"),
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTxt: { 
    color: "#fff", 
    fontSize: wp("3.5%"),
    fontFamily: "Poppins_600SemiBold", 
    textAlign: "center", 
    lineHeight: hp("5%"),
    // includeFontPadding: false,
    textAlignVertical: 'center',
  },
  individualUpload: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: hp("2%") },
  uploads: { flexDirection: "row", justifyContent: "space-between", marginTop: hp("2%"), paddingHorizontal: wp("0%"), gap: wp("2%"), flexWrap: 'nowrap' },
  uploadLabel: { textAlign: 'center', fontSize: wp("3.2%"), fontFamily: "Roboto_400Regular" },
  imageContainer: { width: wp("24%"), height: hp("10%"), borderStyle: "dashed", borderWidth: 1, borderRadius: wp("2.5%"), borderColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#ffffff" },
  imageBox: { width: wp("24%"), height: hp("10%"), borderStyle: "dashed", borderWidth: 1, borderColor: "rgba(0,0,0,0.25)", borderRadius: wp("2.5%"), alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: hp("1%"), backgroundColor: "#ffffff" },
  camera: { width: wp("50%"), height: hp("9%"), paddingHorizontal: wp("2%"), borderWidth: 1, borderStyle: "dashed", borderRadius: wp("2.5%"), borderColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", marginTop: hp("2%"), backgroundColor: "#ffffff", position: "relative" },
  tutor: { fontSize: wp("4%"), fontWeight: "600", fontFamily: "Poppins_600SemiBold", color: "#030303", lineHeight: hp("4%"), marginTop: hp("1.2%") },
  identityVerification: { flexDirection: "column", gap: hp("2%"), marginTop: hp("4%"), paddingHorizontal: wp("2%") },
  btn: { marginTop: hp("2.5%"), alignSelf: "center", justifyContent: "center", alignItems: "center", width: wp("90%"), height: hp("6.5%"), backgroundColor: "#5f5fff", borderRadius: wp("2.5%"), bottom: hp("2%") },
  cameraContainer: { flexDirection: "column", justifyContent: "flex-start", marginTop: hp("2%") },
  cameraTitle: { fontSize: wp("3.7%"), lineHeight: hp("2.15%"), color: "#000", fontFamily: "Roboto_400Regular" },
  mainContent: { flexDirection: "column", marginTop: hp("2.5%") },
  mainContentTtile: { color: "#374151", fontSize: wp("4%"), fontWeight: "600", lineHeight: hp("2.4%"), fontFamily: "Roboto_400Regular" },
  contentInput: { alignContent: "center", width: "100%", height: hp("6.7%"), borderRadius: wp("1%"), backgroundColor: "#ffffff", paddingHorizontal: wp("2%"), fontSize: wp("3.2%"), borderWidth: 1, borderColor: "#d1d5db", textAlignVertical: "center", fontFamily: "Poppins_400Regular" },
  AddressInput: { width: "100%", height: hp("13%"), borderRadius: wp("1%"), backgroundColor: "#ffffff", paddingHorizontal: wp("2%"), fontSize: wp("3.2%"), lineHeight: hp("6.7%"), borderWidth: 1, borderColor: "#d1d5db", textAlignVertical: "top", fontFamily: "Poppins_400Regular" },
  inputs: { flexDirection: "column", gap: hp("2.2%"), marginTop: hp("1.8%") },
  content: { paddingTop: hp("2.5%") },
  imageRow: { flexDirection: "row", justifyContent: "space-between", marginTop: hp("1.5%") },
  iconImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadIconContainer: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  cameraIconContainer: { 
    width: "100%", 
    height: "100%", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#ffffff" 
  },
});