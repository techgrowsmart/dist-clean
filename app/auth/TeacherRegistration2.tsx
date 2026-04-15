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
  ImageBackground,
} from "react-native";
import {
  Poppins_400Regular,
  Poppins_300Light,
  Poppins_600SemiBold,
  Poppins_500Medium,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Roboto_300Light, Roboto_400Regular } from "@expo-google-fonts/roboto";
import BackArrowIcon from "../../assets/svgIcons/BackArrow";
import { router, useLocalSearchParams } from "expo-router";
import Camera from "../../assets/svgIcons/Camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { BASE_URL } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthData } from "../../utils/authStorage";
import { Platform } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import CropConfirmationModal from "../../components/ImageConfirmation";

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
]);

// Design Tokens
const COLORS = {
  primary: '#4F6EF7',
  accent: '#7C3AED',
  background: '#F5F7FB',
  cardBg: '#EDE9FE',
  inputBg: '#F9FAFB',
  border: '#E5E7EB',
  textDark: '#111827',
  textLight: '#6B7280',
  white: '#FFFFFF',
  green: '#10B981',
};

const STEPS = [
  { id: 1, title: 'Personal Info', subtitle: 'Basic Details' },
  { id: 2, title: 'Identity', subtitle: 'Legal Documents' },
  { id: 3, title: 'Education', subtitle: 'Academic Background' },
  { id: 4, title: 'Bank & Service', subtitle: 'Financial & Location' },
  { id: 5, title: 'Certifications', subtitle: 'Professional Proof' },
];

const { height, width } = Dimensions.get("window");
const RegistrationSecond = () => {
  const params = useLocalSearchParams();
  const urlName = params.name as string || '';
  const urlPhone = params.phone as string || '';
  const urlEmail = params.email as string || '';
  
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
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(Dimensions.get("window").width < 768);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_300Light,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_300Light,
    Roboto_400Regular, 
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsMobile(window.width < 768);
    });
    return () => subscription.remove();
  }, []);

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
        // Use URL parameters if available, otherwise fall back to AsyncStorage
        let storedName = urlName;
        let storedPhone = urlPhone;
        let storedEmail = urlEmail;

        // If no URL parameters, try to get from AsyncStorage
        if (!storedName) {
          storedName = await AsyncStorage.getItem("name");
        }
        if (!storedPhone) {
          storedPhone = await AsyncStorage.getItem("phoneNumber");
        }
        if (!storedEmail) {
          storedEmail = await AsyncStorage.getItem("email");
        }

        // Decode URL-encoded values and replace + with spaces
        if (storedName) {
          const decodedName = decodeURIComponent(storedName).replace(/\+/g, ' ');
          setFullName(decodedName);
        }
        if (storedPhone) {
          const decodedPhone = decodeURIComponent(storedPhone).replace(/\+/g, ' ');
          setPhoneNumber(decodedPhone);
        }
        if (storedEmail) {
          const decodedEmail = decodeURIComponent(storedEmail).replace(/\+/g, ' ');
          setEmail(decodedEmail);
        }
        
        const auth = await getAuthData();
        const token = auth?.token;
        console.log("Token", token);
      } catch (error) {
        console.error("Failed to load user data from storage:", error);
      }
    };

    loadUserData();
  }, [urlName, urlPhone, urlEmail]);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleNext = () => {
    if (currentStep < 5) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderSidebar = () => {
    if (isMobile) {
      return (
        <View style={styles.mobileProgressContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileProgressScroll}>
            <View style={{ marginRight: 20, borderRightWidth: 1, borderRightColor: COLORS.border, paddingRight: 20 }}>
              <Text style={styles.logoText}>Growsmart</Text>
            </View>
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.includes(step.id);
              return (
                <TouchableOpacity
                  key={step.id}
                  onPress={() => (isCompleted || isActive || step.id <= Math.max(...completedSteps, 0) + 1) && setCurrentStep(step.id)}
                  style={[styles.mobileStepItem, isActive && styles.mobileStepActive]}
                >
                  <View style={[styles.mobileStepIcon, isActive && styles.iconActive, isCompleted && styles.iconCompleted]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <Text style={[styles.stepNumberText, isActive && { color: 'white' }]}>{step.id}</Text>
                    )}
                  </View>
                  <Text style={[styles.mobileStepText, isActive && styles.textActive, isCompleted && styles.textCompleted]}>{step.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={[styles.logoText, { marginBottom: 15 }]}>Growsmart</Text>
          <Text style={styles.sidebarTitle}>Registration</Text>
          <Text style={styles.sidebarSubtitle}>Tutor Onboarding</Text>
        </View>

        <View style={styles.stepsContainer}>
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isUnlocked = step.id <= Math.max(...completedSteps, 0) + 1;

            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => isUnlocked && setCurrentStep(step.id)}
                disabled={!isUnlocked}
                style={[styles.stepItem, isActive && styles.stepActive]}
              >
                <View style={[styles.stepIcon, isActive && styles.iconActive, isCompleted && styles.iconCompleted]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={18} color="white" />
                  ) : (
                    <MaterialCommunityIcons 
                      name={isActive ? "circle-slice-8" : "circle-outline"} 
                      size={20} 
                      color={isActive ? "white" : COLORS.textLight} 
                    />
                  )}
                </View>
                <View>
                  <Text style={[styles.stepTitle, isActive && styles.textActive, isCompleted && styles.textCompleted]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveDraftBtn}>
          <Ionicons name="save-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoSection onNext={handleNext} />;
      case 2:
        return <IdentitySection onNext={handleNext} />;
      case 3:
        return <EducationSection onNext={handleNext} />;
      case 4:
        return <BankLocationSection onNext={handleNext} />;
      case 5:
        return <CertificationsReviewSection onBack={handleBack} />;
      default:
        return null;
    }
  };

  // --- Step Components ---

  const PersonalInfoSection = ({ onNext }: { onNext: () => void }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>01</Text>
        </View>
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>

      <View style={styles.grid}>
        <InputField 
          label="FULL NAME" 
          placeholder="Ex: Adam Payne" 
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setErrors({ ...errors, fullName: "" });
          }}
          error={errors.fullName}
        />
        <InputField 
          label="PHONE NUMBER" 
          placeholder="+1 555-000-0000" 
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            setErrors({ ...errors, phoneNumber: "" });
          }}
          error={errors.phoneNumber}
        />
        <InputField 
          label="EMAIL ADDRESS" 
          placeholder="adam.payne@educator.com" 
          fullWidth 
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors({ ...errors, email: "" });
          }}
          error={errors.email}
        />
        <InputField 
          label="RESIDENTIAL ADDRESS" 
          placeholder="1234 Academic Way, Education District" 
          fullWidth 
          multiline 
          value={residentialAddress}
          onChangeText={(text) => {
            setResidentialAddress(text);
            setErrors({ ...errors, residentialAddress: "" });
          }}
          error={errors.residentialAddress}
        />
        <InputField 
          label="STATE / PROVINCE" 
          placeholder="Massachusetts" 
          value={state}
          editable={false}
          onChangeText={(text) => {
            setState(text);
            setErrors({ ...errors, state: "" });
          }}
          error={errors.state}
        />
        <InputField 
          label="COUNTRY" 
          placeholder="United States" 
          value={country}
          editable={false}
          onChangeText={(text) => {
            setCountry(text);
            setErrors({ ...errors, country: "" });
          }}
          error={errors.country}
        />
      </View>
    </View>
  );

  const IdentitySection = ({ onNext }: { onNext: () => void }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>02</Text>
        </View>
        <Text style={styles.sectionTitle}>Identity Verification</Text>
      </View>

      <View style={styles.uploadGrid}>
        <UploadCard 
          icon="credit-card-outline" 
          label="Upload PAN Card" 
          helper="Max file size 5MB" 
          imageUri={panUpload}
          onPress={() => handleImageSelection(setPanUpload)}
          error={errors.panUpload}
        />
        <UploadCard 
          icon="card-account-details-outline" 
          label="Aadhaar Card Front" 
          helper="Max file size 5MB" 
          imageUri={aadharFront}
          onPress={() => handleImageSelection(setAadharFront)}
          error={errors.aadharFront}
        />
        <UploadCard 
          icon="card-account-details-outline" 
          label="Aadhaar Card Back" 
          helper="Max file size 5MB" 
          imageUri={aadharBack}
          onPress={() => handleImageSelection(setAadharBack)}
          error={errors.aadharBack}
        />
        <UploadCard 
          icon="camera-outline" 
          label="Selfie with Aadhaar Front" 
          helper="Face and ID must be visible" 
          imageUri={selfieAadharFront}
          onPress={() => handleCamera(setSelfieAadharFront)}
          error={errors.selfieAadharFront}
        />
        <UploadCard 
          icon="camera-outline" 
          label="Selfie with Aadhaar Back" 
          helper="Please hold your Aadhaar Your Face Mask must not visible and ID card should be clearly visible to all time." 
          fullWidth 
          imageUri={selfieAadharBack}
          onPress={() => handleCamera(setSelfieAadharBack)}
          error={errors.selfieAadharBack}
        />
      </View>
    </View>
  );

  const EducationSection = ({ onNext }: { onNext: () => void }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>03</Text>
        </View>
        <Text style={styles.sectionTitle}>Academic Excellence & Language Preference</Text>
      </View>

      <View style={styles.grid}>
        <InputField 
          label="HIGHEST DEGREE" 
          placeholder="Ph.D." 
          value={highestDegree}
          onChangeText={(text) => {
            setHighestDegree(text);
            setErrors({ ...errors, highestDegree: "" });
          }}
          error={errors.highestDegree}
        />
        <InputField 
          label="SPECIALIZATION" 
          placeholder="Quantum Mechanics" 
          value={specialization}
          onChangeText={(text) => {
            setSpecialization(text);
            setErrors({ ...errors, specialization: "" });
          }}
          error={errors.specialization}
        />
        <InputField 
          label="LANGUAGE PREFERENCE" 
          placeholder="English & Spanish" 
          fullWidth 
          value="English & Hindi"
          editable={false}
        />
      </View>

      <View style={styles.experienceContainer}>
        <Text style={styles.inputLabel}>TEACHING EXPERIENCE</Text>
        <ExperienceSelector 
          value={experience}
          onSelect={(value) => {
            setExperience(value);
            setErrors({ ...errors, experience: "" });
          }}
          error={errors.experience}
        />
      </View>
    </View>
  );

  const BankLocationSection = ({ onNext }: { onNext: () => void }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>04</Text>
        </View>
        <Text style={styles.sectionTitle}>Bank & Service Location</Text>
      </View>
      <Text style={styles.sectionSubtext}>Where you would love see your payments and want you work.</Text>

      <View style={styles.dualGrid}>
        <View style={styles.bankCard}>
          <Text style={styles.bankTitle}>Bank Account info</Text>
          <InputField label="ACCOUNT HOLDER NAME" placeholder="As per bank records" small />
          <InputField label="BANK NAME" placeholder="Ex: Central National Bank" small />
          <View style={styles.row}>
            <InputField label="ACCOUNT NUMBER" placeholder="0000 0000 0000" flex />
            <View style={{ width: 10 }} />
            <InputField label="IFSC CODE" placeholder="CNB0001234" flex />
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.bankTitle}>MY LOCATION PINCODE</Text>
          <View style={styles.pincodeInputContainer}>
            <TextInput style={styles.pincodeInput} placeholder="e.g. 110001" placeholderTextColor={COLORS.textLight} />
            <TouchableOpacity style={styles.locateBtn}>
              <Ionicons name="send" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.mapPlaceholder}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop' }} 
              style={styles.mapImg} 
            />
            <View style={styles.mapMarker}>
               <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const CertificationsReviewSection = ({ onBack }: { onBack: () => void }) => (
    <View>
      <View style={styles.sectionCard}>
        <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>05</Text>
            </View>
            <Text style={styles.sectionTitle}>Professional Certifications</Text>
          </View>
          <TouchableOpacity style={styles.addCertBtn}>
            <Text style={styles.addCertBtnText}>+ Add Certificate</Text>
          </TouchableOpacity>
        </View>
        
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
                  <Feather name="upload-cloud" size={wp("8%")} color="rgba(0,0,0,0.25)" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.certifications ? (
          <Text style={styles.errorText}>{errors.certifications}</Text>
        ) : null}
      </View>
      
      <View style={[styles.sectionCard, { marginTop: 20 }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>06</Text>
          </View>
          <Text style={styles.sectionTitle}>Highest Qualification Certificate</Text>
        </View>
        
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
                  <Feather name="upload-cloud" size={wp("8%")} color="rgba(0,0,0,0.25)" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {errors.highestQualificationCertificate ? (
          <Text style={styles.errorText}>{errors.highestQualificationCertificate}</Text>
        ) : null}
      </View>
      
      <View style={[styles.sectionCard, { marginTop: 20 }]}>
        <Text style={styles.sectionTitle}>Final Review</Text>
        <Text style={styles.sectionSubtext}>Please review all Information before completing your registration.</Text>
        <View style={styles.reviewPlaceholder}>
          <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} style={{ opacity: 0.2 }} />
          <Text style={styles.reviewPlaceholderText}>All sections look good! Ready to submit.</Text>
        </View>
      </View>
    </View>
  );

  // --- Sub-components ---

  const InputField = ({ label, placeholder, fullWidth, multiline, small, flex, value, onChangeText, error, editable = true }: any) => (
    <View style={[styles.inputGroup, fullWidth && { width: '100%' }, flex && { flex: 1 }]}>
      <Text style={[styles.inputLabel, small && { fontSize: 10 }]}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, error && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        multiline={multiline}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const UploadCard = ({ icon, label, helper, fullWidth, imageUri, onPress, error }: any) => (
    <TouchableOpacity style={[styles.uploadCard, fullWidth && { width: '100%' }]} onPress={onPress}>
      <View style={styles.uploadIconCircle}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
        ) : (
          <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
        )}
      </View>
      <Text style={styles.uploadLabel}>{label}</Text>
      <Text style={styles.uploadHelper}>{helper}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </TouchableOpacity>
  );

  const ExperienceSelector = ({ value, onSelect, error }: any) => {
    const options = ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'];

    return (
      <View>
        <View style={styles.expGrid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.expBtn, value === opt && styles.expBtnActive]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.expBtnText, value === opt && styles.expBtnTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  };

    if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop' }}
        style={styles.bgPattern}
        imageStyle={{ opacity: 0.03 }}
      >
        <View style={styles.mainLayout}>
          {!isMobile && renderSidebar()}
          
          <ScrollView 
            style={styles.contentArea} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isMobile && renderSidebar()}
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Refine Your <Text style={{ color: COLORS.primary }}>Legacy</Text>.
              </Text>
              <Text style={styles.headerSubtitle}>
                Join an elite circle of educators. Our curation process ensures that only the most dedicated minds guide the next generation of scholars.
              </Text>
            </View>

            {renderStepContent()}

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row' }}>
                {currentStep > 1 && (
                  <TouchableOpacity style={[styles.nextBtn, styles.backBtn]} onPress={handleBack}>
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.nextBtn} onPress={currentStep === 5 ? handleUpdate : handleNext}>
                  <Text style={styles.nextBtnText}>
                    {currentStep === 5 ? 'Complete Registration' : 'Next Step'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
      <CropConfirmationModal
        visible={showCropModal}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </View>
  );
};

export default RegistrationSecond;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  bgPattern: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: wp('20%'),
    minWidth: 260,
    backgroundColor: COLORS.white,
    paddingVertical: 40,
    paddingHorizontal: 25,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    marginBottom: 40,
  },
  sidebarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.accent,
  },
  sidebarSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textLight,
  },
  stepsContainer: {
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  stepActive: {
    backgroundColor: '#F0F3FF',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconActive: {
    backgroundColor: COLORS.primary,
  },
  iconCompleted: {
    backgroundColor: COLORS.green,
  },
  stepTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textLight,
  },
  stepSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textLight,
    opacity: 0.7,
  },
  textActive: {
    color: COLORS.primary,
  },
  textCompleted: {
    color: COLORS.textDark,
    fontFamily: 'Poppins_700Bold',
  },
  stepNumberText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.textLight,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  saveDraftText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    padding: wp('4%'),
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    maxWidth: 800,
    alignSelf: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.05)',
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sectionNumberText: {
    color: COLORS.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: COLORS.textDark,
  },
  sectionSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 20,
    marginTop: -10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputGroup: {
    width: '48%',
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 15,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  uploadCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadedImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  uploadLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  uploadHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  experienceContainer: {
    marginTop: 10,
  },
  expGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  expBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  expBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.textLight,
  },
  expBtnTextActive: {
    color: COLORS.white,
  },
  dualGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  bankCard: {
    flex: 1.2,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
  },
  locationCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
  },
  bankTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.textDark,
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pincodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: 10,
    marginBottom: 15,
  },
  pincodeInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  locateBtn: {
    padding: 5,
  },
  mapPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImg: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  mapMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  addCertBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addCertBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  imageBox: {
    width: wp('24%'),
    height: hp('10%'),
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  iconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  reviewPlaceholder: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  reviewPlaceholderText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 30,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  cancelBtn: {
    marginRight: 20,
  },
  cancelText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.textLight,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 180,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  backBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 12,
  },
  backBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.primary,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.primary,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
  mobileProgressContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileProgressScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  mobileStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  mobileStepActive: {
    backgroundColor: '#F0F3FF',
  },
  mobileStepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mobileStepText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: COLORS.textLight,
  },
});