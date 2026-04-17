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
  Platform,
} from "react-native";
import {
  Poppins_400Regular,
  Poppins_300Light,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Roboto_300Light, Roboto_400Regular } from "@expo-google-fonts/roboto";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { BASE_URL } from "../../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthData } from "../../../utils/authStorage";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { ImageManipulator } from 'expo-image-manipulator';

const { height, width } = Dimensions.get("window");
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const RegistrationSecond = () => {
  const params = useLocalSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({}); 
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
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // REMOVED: const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    const hasCertifications = certifications.some(cert => cert && typeof cert === 'string' && cert.trim() !== "");
    if (!hasCertifications) {
      newErrors.certifications = "At least one certification is required.";
    }

    const hasQualificationCerts = highestQualificationCertificate.some(cert => cert && typeof cert === 'string' && cert.trim() !== "");
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
        console.log("Loading user data with params:", params);

        // Prioritize URL params over AsyncStorage
        const paramEmail = params.email as string;
        const paramName = params.name as string;
        const paramPhone = params.phone as string;

        console.log("URL params:", { paramEmail, paramName, paramPhone });

        if (paramName) {
          setFullName(paramName);
          console.log("Set fullName from URL params:", paramName);
        }
        if (paramPhone) {
          setPhoneNumber(paramPhone);
          console.log("Set phoneNumber from URL params:", paramPhone);
        }
        if (paramEmail) {
          setEmail(paramEmail);
          console.log("Set email from URL params:", paramEmail);
        }

        // Only fall back to AsyncStorage if URL params are not provided
        if (!paramName || !paramPhone || !paramEmail) {
          const storedName = await AsyncStorage.getItem("name");
          const storedPhone = await AsyncStorage.getItem("phoneNumber");
          const storedEmail = await AsyncStorage.getItem("email");

          console.log("AsyncStorage data:", { storedName, storedPhone, storedEmail });

          if (storedName && !paramName) {
            setFullName(storedName);
            console.log("Set fullName from AsyncStorage:", storedName);
          }
          if (storedPhone && !paramPhone) {
            setPhoneNumber(storedPhone);
            console.log("Set phoneNumber from AsyncStorage:", storedPhone);
          }
          if (storedEmail && !paramEmail) {
            setEmail(storedEmail);
            console.log("Set email from AsyncStorage:", storedEmail);
          }
        }

        const auth = await getAuthData();
        const token = auth?.token;
        console.log("Token from getAuthData:", token);
      } catch (error) {
        console.error("Failed to load user data from storage:", error);
      }
    };

    loadUserData();
  }, [params]);

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
    setSubmitting(true);

    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("Form submission started");
      console.log("Current state:", {
        fullName,
        phoneNumber,
        email,
        residentialAddress,
        state,
        country,
        highestDegree,
        specialization,
        experience,
      });

      const formData = new FormData();
      const userId = await AsyncStorage.getItem("userId");

      console.log("UserId:", userId);

      formData.append("userId", userId || "");
      formData.append("fullname", fullName);
      formData.append("phoneNumber", phoneNumber);
      formData.append("email", email);
      formData.append("residentialAddress", residentialAddress);
      formData.append("state", state);
      formData.append("country", country);
      formData.append("experience", experience);
      formData.append("specialization", specialization);
      formData.append("highest_degree", highestDegree);

      console.log("Basic fields appended to FormData");

      // Helper function to convert base64 to blob
      const base64ToBlob = (base64Data: string, contentType: string = 'image/jpeg'): Blob => {
        const sliceSize = 512;
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        return new Blob(byteArrays, { type: contentType });
      };

      // FIXED: Added proper types to appendFile
      const appendFile = async (
        fieldName: string, 
        fileUri: string, 
        fileName: string = "image.jpg"
      ) => {
        if (!fileUri) {
          console.warn(`Skipping ${fieldName}: no file URI provided`);
          return;
        }

        console.log(`Appending ${fieldName} with URI:`, fileUri.substring(0, 50) + "...");

        if (Platform.OS === "web") {
          try {
            let blob: Blob;
            
            // Check if it's a base64 data URL
            if (fileUri.startsWith('data:')) {
              // Extract content type from data URL
              const matches = fileUri.match(/^data:(.+);base64,/);
              const contentType = matches ? matches[1] : 'image/jpeg';
              // Convert base64 to blob directly without fetching
              blob = base64ToBlob(fileUri, contentType);
            } else {
              // It's a regular URL, fetch it
              const response = await fetch(fileUri);
              blob = await response.blob();
            }
            
            const file = new File([blob], fileName, {
              type: blob.type || "image/jpeg",
            });
            formData.append(fieldName, file);
            console.log(`Successfully appended ${fieldName} to FormData`);
          } catch (error) {
            console.warn(`Failed to append ${fieldName} for web`, error);
          }
        } else {
          formData.append(fieldName, {
            uri: fileUri,
            name: fileName,
            type: "image/jpeg",
          } as any);
          console.log(`Successfully appended ${fieldName} to FormData (native)`);
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
          "highest_qualification",
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

      console.log("Token:", token);
      console.log("FormData fields:", Object.keys(formData));

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        router.push("/(tabs)/TeacherDashBoard/Registration2");
      } else {
        const errorText = await response.text();
        console.error("Registration error:", errorText);
        Alert.alert(errorText || "Registration failed");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      Alert.alert("An error occurred while submitting the form");
    } finally {
      setIsSubmitting(false);
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
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      onCapture(result.assets[0].uri);
    }
  };

  const handleImageSelection = async (onPick: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        onPick(uri);
      }
    } catch (error) {
      console.warn('Image selection failed', error);
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
              <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#x2190;</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Registration</Text>
          </View>

          {/* Form */}
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <Text style={styles.tutor}>Become a Tutor</Text>
              <Text style={styles.heroSubtitle}>Complete your profile to start teaching</Text>
            </View>

            <View style={styles.mainContent}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#128100;</Text>
                </View>
                <Text style={styles.mainContentTtile}>Personal Information</Text>
              </View>
              <View style={styles.inputs}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Residential Address</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>State</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    placeholder="Country"
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
            </View>

            <View style={styles.identityVerification}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#128737;</Text>
                </View>
                <Text style={styles.mainContentTtile}>Identity Verification</Text>
              </View>
              <View style={styles.uploads}>
                <View style={styles.individualUpload}>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setPanUpload)}
                    style={[styles.imageContainer, panUpload && styles.imageContainerFilled]}
                  >
                    {panUpload ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image source={{ uri: panUpload }} style={styles.iconImage} resizeMode="cover" />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setPanUpload("")}
                        >
                          <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("12%") }}>&#128247;</Text>
                        <Text style={styles.uploadPlaceholderText}>PAN Card</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.panUpload ? (
                    <Text style={styles.errorText}>{errors.panUpload}</Text>
                  ) : null}
                </View>
                
                <View style={styles.individualUpload}>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setAadharFront)}
                    style={[styles.imageContainer, aadharFront && styles.imageContainerFilled]}
                  >
                    {aadharFront ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image source={{ uri: aadharFront }} style={styles.iconImage} resizeMode="cover" />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setAadharFront("")}
                        >
                          <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("12%") }}>&#128247;</Text>
                        <Text style={styles.uploadPlaceholderText}>Aadhar Front</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.aadharFront ? (
                    <Text style={styles.errorText}>{errors.aadharFront}</Text>
                  ) : null}
                </View>

                <View style={styles.individualUpload}>
                  <TouchableOpacity
                    onPress={() => handleImageSelection(setAadharBack)}
                    style={[styles.imageContainer, aadharBack && styles.imageContainerFilled]}
                  >
                    {aadharBack ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image source={{ uri: aadharBack }} style={styles.iconImage} resizeMode="cover" />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setAadharBack("")}
                        >
                          <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("12%") }}>&#128247;</Text>
                        <Text style={styles.uploadPlaceholderText}>Aadhar Back</Text>
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
                  Selfie with Aadhar Card (Front)
                </Text>
                <TouchableOpacity
                  style={[styles.camera, selfieAadharFront && styles.cameraFilled]}
                  onPress={() => handleCamera(setSelfieAadharFront)}
                >
                  {selfieAadharFront ? (
                    <View style={{ width: '100%', height: '100%' }}>
                      <Image
                        source={{ uri: selfieAadharFront }}
                        style={styles.iconImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setSelfieAadharFront("")}
                      >
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("7%") }}>&#128247;</Text>
                      <Text style={styles.uploadPlaceholderText}>Tap to Capture</Text>
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
                  Selfie with Aadhar Card (Back)
                </Text>
                <TouchableOpacity
                  style={[styles.camera, selfieAadharBack && styles.cameraFilled]}
                  onPress={() => handleCamera(setSelfieAadharBack)}
                >
                  {selfieAadharBack ? (
                    <View style={{ width: '100%', height: '100%' }}>
                      <Image
                        source={{ uri: selfieAadharBack }}
                        style={styles.iconImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setSelfieAadharBack("")}
                      >
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("7%") }}>&#128247;</Text>
                      <Text style={styles.uploadPlaceholderText}>Tap to Capture</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.selfieAadharBack ? (
                  <Text style={styles.errorText}>{errors.selfieAadharBack}</Text>
                ) : null}
              </View>
            </View> {/* Close identityVerification View */}

            <View style={styles.identityVerification}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#128218;</Text>
                </View>
                <Text style={styles.mainContentTtile}>Educational Qualifications</Text>
              </View>
              <View style={styles.inputs}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Highest Degree</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Specialization</Text>
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
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Teaching Experience (Years)</Text>
                  <TextInput
                    placeholder="Enter teaching experience in years"
                    placeholderTextColor={"#94a3b8"}
                    style={[styles.contentInput, errors.experience && styles.inputError]}
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
            </View>
            
            <View style={styles.documentSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#127942;</Text>
                </View>
                <Text style={styles.mainContentTtile}>Certifications</Text>
              </View>
              <View style={styles.imageRow}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCertificationImage(index)}
                    style={[styles.imageBox, certifications[index] && styles.imageBoxFilled]}
                  >
                    {certifications[index] ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: certifications[index] }}
                          style={styles.iconImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => {
                            const newList = [...certifications];
                            newList[index] = "";
                            setCertifications(newList);
                          }}
                        >
                          <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("12%") }}>&#128247;</Text>
                        <Text style={styles.uploadPlaceholderText}>Cert {index + 1}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.certifications ? (
                <Text style={styles.errorText}>{errors.certifications}</Text>
              ) : null}
            </View>

            <View style={styles.documentSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#128203;</Text>
                </View>
                <Text style={styles.mainContentTtile}>Qualification Certificates</Text>
              </View>
              <View style={styles.imageRow}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQualificationImage(index)}
                    style={[styles.imageBox, highestQualificationCertificate[index] && styles.imageBoxFilled]}
                  >
                    {highestQualificationCertificate[index] ? (
                      <View style={{ width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: highestQualificationCertificate[index] }}
                          style={styles.iconImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => {
                            const newList = [...highestQualificationCertificate];
                            newList[index] = "";
                            setHighestQualificationCertificate(newList);
                          }}
                        >
                          <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("5%") }}>&#10060;</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadIconContainer}>
                        <Text style={{ fontFamily: "Poppins-Regular", fontSize: wp("12%") }}>&#128247;</Text>
                        <Text style={styles.uploadPlaceholderText}>Cert {index + 1}</Text>
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
              <TouchableOpacity 
                style={[styles.btnContainer, isSubmitting && styles.btnDisabled]} 
                onPress={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnTxt}>Continue to Bank Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegistrationSecond;

const webStyles = StyleSheet.create({
  backButton: { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' },
  imageContainer: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
  imageBox: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
  camera: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
  btn: { boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)' },
  contentInput: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)' },
  AddressInput: { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)' },
});

const nativeStyles = StyleSheet.create({
  backButton: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  imageContainer: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  imageBox: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  camera: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  btn: { shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  btnDisabled: { shadowOpacity: 0 },
  contentInput: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  AddressInput: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
});

const platformStyles = Platform.OS === 'web' ? webStyles : nativeStyles;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  inputError: { borderColor: "#ef4444", borderWidth: 2 },
  errorText: { color: "#ef4444", fontSize: isDesktop ? 14 : wp("3.2%"), marginBottom: isDesktop ? 8 : hp("0.5%"), marginTop: isDesktop ? 4 : hp("0.3%"), fontFamily: "Poppins_400Regular" },
  backButton: { backgroundColor: "#ffffff", width: isDesktop ? 40 : wp("10%"), height: isDesktop ? 40 : wp("10%"), borderRadius: isDesktop ? 20 : wp("50%"), padding: isDesktop ? 10 : wp("2.5%"), alignItems: "center", justifyContent: "center", position: "absolute", left: 0, ...platformStyles.backButton },
  scrollContainer: { paddingBottom: isDesktop ? 40 : hp("8%"), paddingHorizontal: isDesktop ? 40 : wp("5%") },
  header: { paddingTop: isDesktop ? 20 : hp("2%"), paddingBottom: isDesktop ? 20 : hp("2%"), flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative", backgroundColor: "#fff" },
  title: { 
    fontSize: isDesktop ? 28 : wp("5.5%"),
    fontWeight: "600", 
    fontFamily: "Poppins_600SemiBold", 
    color: "#0f172a", 
    lineHeight: isDesktop ? 36 : hp("6.5%"),
    textAlign: "center", 
    paddingHorizontal: isDesktop ? 20 : wp("3%"),
    flex: 1,
  },
  btnContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnTxt: {
    color: "#fff",
    fontSize: wp("4.2%"),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    lineHeight: hp("5%"),
    textAlignVertical: 'center',
  },
  individualUpload: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: hp("1.5%"), flex: 1 },
  uploads: { flexDirection: "row", justifyContent: "space-between", marginTop: hp("2.5%"), paddingHorizontal: wp("0%"), gap: wp("2.5%"), flexWrap: 'nowrap' },
  uploadLabel: { textAlign: 'center', fontSize: wp("3.2%"), fontFamily: "Roboto_400Regular", color: "#64748b" },
  imageContainer: { width: wp("28%"), height: hp("12%"), borderStyle: "dashed", borderWidth: 2, borderRadius: wp("4%"), borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#f8fafc", ...platformStyles.imageContainer },
  imageContainerFilled: { borderColor: "#6366f1", backgroundColor: "#fff", borderStyle: "solid" },
  imageBox: { width: wp("28%"), height: hp("12%"), borderStyle: "dashed", borderWidth: 2, borderColor: "#cbd5e1", borderRadius: wp("4%"), alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: hp("1%"), backgroundColor: "#f8fafc", ...platformStyles.imageBox },
  imageBoxFilled: { borderColor: "#6366f1", backgroundColor: "#fff", borderStyle: "solid" },
  camera: { width: wp("55%"), height: hp("10%"), paddingHorizontal: wp("2%"), borderWidth: 2, borderStyle: "dashed", borderRadius: wp("4%"), borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center", marginTop: hp("2%"), backgroundColor: "#f8fafc", position: "relative", ...platformStyles.camera },
  cameraFilled: { borderColor: "#6366f1", backgroundColor: "#fff", borderStyle: "solid" },
  tutor: { fontSize: wp("5%"), fontWeight: "600", fontFamily: "Poppins_600SemiBold", color: "#0f172a", lineHeight: hp("6%"), marginTop: hp("0.5%") },
  heroSubtitle: { fontSize: wp("3.5%"), fontFamily: "Poppins_400Regular", color: "#64748b", marginTop: hp("0.5%"), marginBottom: hp("2%") },
  heroSection: { marginBottom: hp("3%") },
  identityVerification: { flexDirection: "column", gap: hp("2.5%"), marginTop: hp("4%"), paddingHorizontal: wp("1%") },
  documentSection: { marginBottom: hp("3%") },
  btn: { marginTop: hp("4%"), alignSelf: "center", justifyContent: "center", alignItems: "center", width: wp("90%"), height: hp("7%"), backgroundColor: "#6366f1", borderRadius: wp("4%"), ...platformStyles.btn },
  btnDisabled: { backgroundColor: "#cbd5e1", ...(Platform.OS !== 'web' && { shadowOpacity: 0 }) },
  cameraContainer: { flexDirection: "column", justifyContent: "flex-start", marginTop: hp("2.5%") },
  cameraTitle: { fontSize: wp("3.8%"), lineHeight: hp("2.3%"), color: "#475569", fontFamily: "Poppins_400Regular", marginBottom: hp("1%") },
  mainContent: { flexDirection: "column", marginTop: hp("2%") },
  mainContentTtile: { color: "#0f172a", fontSize: wp("4.2%"), fontWeight: "600", lineHeight: hp("2.6%"), fontFamily: "Poppins_600SemiBold" },
  contentInput: { alignContent: "center", width: "100%", height: isDesktop ? 50 : hp("6.5%"), borderRadius: isDesktop ? 8 : wp("3%"), backgroundColor: "#ffffff", paddingHorizontal: isDesktop ? 16 : wp("4%"), fontSize: isDesktop ? 16 : wp("3.6%"), borderWidth: 1.5, borderColor: "#e2e8f0", textAlignVertical: "center", fontFamily: "Poppins_400Regular", ...platformStyles.contentInput },
  AddressInput: { width: "100%", height: isDesktop ? 120 : hp("12%"), borderRadius: isDesktop ? 8 : wp("3%"), backgroundColor: "#ffffff", paddingHorizontal: isDesktop ? 16 : wp("4%"), paddingVertical: isDesktop ? 12 : wp("2%"), fontSize: isDesktop ? 16 : wp("3.6%"), lineHeight: isDesktop ? 24 : hp("5%"), borderWidth: 1.5, borderColor: "#e2e8f0", textAlignVertical: "top", fontFamily: "Poppins_400Regular", ...platformStyles.AddressInput },
  inputs: { flexDirection: "column", gap: isDesktop ? 16 : hp("1.8%"), marginTop: isDesktop ? 16 : hp("2%") },
  content: { paddingTop: isDesktop ? 24 : hp("2.5%") },
  imageRow: { flexDirection: "row", justifyContent: "space-between", marginTop: isDesktop ? 16 : hp("2%"), flexWrap: isDesktop ? "nowrap" : "wrap" },
  iconImage: { width: "100%", height: "100%" },
  uploadIconContainer: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  cameraIconContainer: { 
    width: "100%", 
    height: "100%", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#f8fafc" 
  },
  // New modern styles
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: isDesktop ? 16 : wp("2.5%"), marginBottom: isDesktop ? 16 : hp("2%") },
  sectionIcon: { width: isDesktop ? 48 : wp("10%"), height: isDesktop ? 48 : wp("10%"), borderRadius: isDesktop ? 12 : wp("3%"), backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  inputWrapper: { marginBottom: isDesktop ? 8 : hp("0.5%") },
  inputLabel: { fontSize: isDesktop ? 14 : wp("3.4%"), fontFamily: "Poppins_600SemiBold", color: "#475569", marginBottom: isDesktop ? 8 : hp("0.8%"), marginLeft: isDesktop ? 4 : wp("1%") },
  uploadPlaceholderText: { fontSize: isDesktop ? 12 : wp("2.8%"), fontFamily: "Poppins_400Regular", color: "#64748b", marginTop: isDesktop ? 4 : hp("0.5%") },
  removeImageButton: { position: "absolute", top: isDesktop ? 8 : wp("2%"), right: isDesktop ? 8 : wp("2%"), backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: isDesktop ? 12 : wp("50%"), padding: isDesktop ? 4 : wp("1%") },
});