import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import {
  Poppins_400Regular,
  Poppins_300Light,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import BackArrowIcon from "../../../assets/svgIcons/BackArrow";
import { router } from "expo-router";
import { BASE_URL } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
// import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

const Registration2 = () => {
  const [errors, setErrors] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [pan, setPan] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 15,
    longitudeDelta: 15,
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_300Light,
    Poppins_600SemiBold,
    Roboto_400Regular,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      getCurrentLocation();
    } else {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to show your position on the map.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
                );
            }}
          }
        ]
      );
    }
  } catch (error) {
    console.error('Permission error:', error);
    Alert.alert('Error', 'Unable to request location permission');
  }
};

const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000, // 10 second timeout
    });

    const { latitude, longitude } = location.coords;
    const newRegion = {
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    
    setUserLocation(newRegion);
    setMapRegion(newRegion);

    // Try to get pincode from location
    try {
      const geocode = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude 
      });
      if (geocode && geocode.length > 0 && geocode[0].postalCode) {
        setPincode(geocode[0].postalCode);
      }
    } catch (geocodeError) {
      console.log('Reverse geocoding not available, using default location');
      // If reverse geocoding fails, set a default pin code
      if (!pincode) {
        setPincode('110001'); // Default Delhi pincode
      }
    }
    
  } catch (error) {
    console.error('Location error:', error);
    Alert.alert(
      'Location Access',
      'Unable to get your current location. Please enable location services.',
      [
        { text: 'Use Default', onPress: () => {
          // Set to a default location (Delhi)
          const defaultLocation = {
            latitude: 28.6139,
            longitude: 77.2090,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setUserLocation(defaultLocation);
          setMapRegion(defaultLocation);
          setPincode('110001');
        }},
        { text: 'Try Again', onPress: requestLocationPermission }
      ]
    );
  }
};

  const validateForm = () => {
    const newErrors = {};
    if (!accountNumber.trim()) newErrors.accountNumber = "Account Number is required.";
    if (!bankName.trim()) newErrors.bankName = "Bank Name is required.";
    if (!ifscCode.trim()) newErrors.ifscCode = "IFSC Code is required.";
    if (!accountHolderName.trim()) newErrors.accountHolderName = "Account Holder Name is required.";
    if (!pan.trim()) newErrors.pan = "PAN is required.";
    if (!pincode.trim()) newErrors.pincode = "Pin Code is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!isChecked) {
      Alert.alert("Agreement Required", "Please agree to the terms and conditions.");
      return;
    }
    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    
    try {
      setLoading(true);
      let token;
      if (Platform.OS === "web") {
        token = localStorage.getItem("token");
      } else {
        const auth = await getAuthData();
        token = auth?.token;
      }

      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const response = await fetch(`${BASE_URL}/api/add-bank-details`, {
        method: "POST", 
        headers,
        body: JSON.stringify({ 
          account_number: accountNumber, 
          bank_name: bankName, 
          ifsc_code: ifscCode, 
          account_holder_name: accountHolderName, 
          pan, 
          pincode 
        }),
      });

      const resultText = await response.text();
      let result;
      try { 
        result = JSON.parse(resultText); 
      } catch { 
        result = { success: true };
      }

      const userId = await AsyncStorage.getItem("userId");
      
      if (userId) {
        try {
          await fetch(`${BASE_URL}/api/payments/onboardTeacher`, {
            method: "POST", 
            headers,
            body: JSON.stringify({ 
              teacher_id: userId, 
              account_number: accountNumber, 
              ifsc_code: ifscCode 
            }),
          });
        } catch (onboardingError) {
          console.warn("Onboarding failed silently:", onboardingError);
        }
      }

      if (Platform.OS === "web") { 
        localStorage.clear(); 
      } else { 
        await AsyncStorage.clear(); 
      }

      Toast.show({
        type: "success", 
        position: "top", 
        text1: "Profile Under Review",
        text2: "You can't access the dashboard until your profile is approved.",
        autoHide: false,
      });

      setTimeout(() => {
        Toast.hide();
        router.replace("/(tabs)/Login");
      }, 3000);

    } catch (err) { 
      console.error("Registration process error:", err);
      
      if (Platform.OS === "web") { 
        localStorage.clear(); 
      } else { 
        await AsyncStorage.clear(); 
      }

      Toast.show({
        type: "success", 
        position: "top", 
        text1: "Profile Submitted",
        text2: "Your profile has been submitted for review.",
        autoHide: false,
      });

      setTimeout(() => {
        Toast.hide();
        router.replace("/(tabs)/Login");
      }, 3000);
    } 
    finally { 
      setLoading(false); 
    }
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {loading && <View style={styles.spinnerOverlay}><ActivityIndicator size="large" color="#000" /></View>}

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BackArrowIcon height={wp("6%")} width={wp("6%")} />
          </TouchableOpacity>
          <Text style={styles.title}>Registration</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.tutor}>Update Bank Details</Text>
          <View style={styles.mainContent}>
            <Text style={styles.mainContentTitle}>Account Information</Text>
            <View style={styles.inputs}>
              <TextInput placeholder="Enter your account number" placeholderTextColor="#94a3b8" style={[styles.contentInput, errors.accountNumber && styles.inputError]} value={accountNumber} onChangeText={setAccountNumber} />
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
              
              <TextInput placeholder="Enter your bank name" placeholderTextColor="#94a3b8" style={[styles.contentInput, errors.bankName && styles.inputError]} value={bankName} onChangeText={setBankName} />
              {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
              
              <TextInput placeholder="Enter IFSC code" placeholderTextColor="#94a3b8" style={[styles.contentInput, errors.ifscCode && styles.inputError]} value={ifscCode} onChangeText={setIfscCode} />
              {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
              
              <TextInput placeholder="Enter account holder name" placeholderTextColor="#94a3b8" style={[styles.contentInput, errors.accountHolderName && styles.inputError]} value={accountHolderName} onChangeText={setAccountHolderName} />
              {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
              
              <TextInput placeholder="Enter PAN" placeholderTextColor="#94a3b8" style={[styles.contentInput, errors.pan && styles.inputError]} value={pan} onChangeText={setPan} />
              {errors.pan && <Text style={styles.errorText}>{errors.pan}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.mainContentTitle}>Enter your location pincode</Text>
          
          <View style={styles.inputs}>
            <TextInput 
              placeholder="Pincode" 
              placeholderTextColor="#94a3b8" 
              style={[styles.pincodeInput, errors.pincode && styles.inputError]} 
              value={pincode} 
              onChangeText={setPincode} 
            />
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
          </View>

<View style={styles.mapContainer}>
  {userLocation ? (
    <TouchableOpacity 
      style={styles.mapButton}
      onPress={() => {
        const url = `https://www.openstreetmap.org/?mlat=${userLocation.latitude}&mlon=${userLocation.longitude}&zoom=15`;
        WebBrowser.openBrowserAsync(url);
      }}
    >
      <View style={styles.mapPreview}>
        <Ionicons name="map" size={wp("10%")} color="#5f5fff" />
        <Text style={styles.mapText}>View Your Location on Map</Text>
        <Text style={styles.coordinates}>
          Tap to open map at: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Text>
      </View>
    </TouchableOpacity>
  ) : (
    <View style={styles.mapPlaceholder}>
      <Ionicons name="map-outline" size={wp("15%")} color="#ccc" />
      <Text style={styles.placeholderText}>
        Location access required to show map
      </Text>
      <TouchableOpacity 
        style={styles.enableLocationBtn}
        onPress={requestLocationPermission}
      >
        <Ionicons name="locate" size={wp("4%")} color="white" />
        <Text style={styles.enableLocationText}>Enable Location</Text>
      </TouchableOpacity>
    </View>
  )}
</View>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity style={[styles.checkbox, isChecked && styles.checked]} onPress={() => setIsChecked(!isChecked)}>
            {isChecked && <Ionicons name="checkmark" size={wp("3.5%")} color="#000" />}
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>I agree to the terms and conditions and verify that the above details are accurate.</Text>
        </View>
        
        <View style={styles.btn}>
          <TouchableOpacity style={styles.btnContainer} onPress={handleUpdate}>
            <Text style={styles.btnTxt}>Save account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default Registration2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  spinnerOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(255,255,255,0.8)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  scrollContainer: { paddingBottom: hp("8%"), paddingHorizontal: wp("5%") },
  backButton: { position: "absolute", left: 0, backgroundColor: "#f5f6f8", width: wp("10%"), height: wp("10%"), borderRadius: wp("50%"), alignItems: "center", justifyContent: "center", zIndex: 1, top: hp("5%") },
  header: { paddingTop: hp("4%"), paddingBottom: hp("2%"), flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
  title: { fontSize: wp("5%"), fontFamily: "Poppins_600SemiBold", color: "#030303", textAlign: "center", flex: 1, marginHorizontal: wp("10%") },
  tutor: { fontSize: wp("4.5%"), fontFamily: "Poppins_600SemiBold", color: "#030303", marginTop: hp("1%") },
  content: { paddingTop: hp("2%") },
  mainContent: { marginTop: hp("2%") },
  mainContentTitle: { color: "#030303", fontSize: wp("3.8%"), fontFamily: "Roboto_400Regular", marginBottom: hp("1%") },
  inputs: { gap: hp("1.5%") },
  contentInput: { width: "100%", height: hp("6%"), borderRadius: wp("2%"), backgroundColor: "#ffffff", paddingHorizontal: wp("4%"), fontSize: wp("3.5%"), borderWidth: 1, borderColor: "#d1d5db", fontFamily: "Poppins_400Regular" },
  pincodeInput: { width: "50%", height: hp("6%"), borderRadius: wp("2%"), backgroundColor: "#ffffff", paddingHorizontal: wp("4%"), fontSize: wp("3.5%"), borderWidth: 1, borderColor: "#d1d5db", fontFamily: "Poppins_400Regular" },
  inputError: { borderColor: "red", borderWidth: 1 },
  errorText: { color: "red", fontSize: wp("3%"), fontFamily: "Poppins_400Regular", marginTop: hp("0.5%") },
  checkboxContainer: { marginTop: hp("3%"), flexDirection: "row", alignItems: "flex-start" },
  checkbox: { width: wp("5%"), height: wp("5%"), borderWidth: 1, borderColor: "#3164f4", backgroundColor: "#ffffff", borderRadius: wp("1%"), marginRight: wp("3%"), marginTop: wp("0.5%"), alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: "#f0f4ff" },
  checkboxLabel: { flex: 1, fontSize: wp("3.5%"), fontFamily: "Roboto_400Regular", color: "#000", lineHeight: hp("2.5%") },
  btn: { marginTop: hp("4%"), alignSelf: "center", width: wp("35%"), height: hp("5%"), backgroundColor: "#5f5fff", borderRadius: wp("2%") },
  btnContainer: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  btnTxt: { color: "#ffffff", fontSize: wp("4%"), fontFamily: "Poppins_400Regular", includeFontPadding: false, textAlignVertical: 'center' },
customMarker: {
  alignItems: 'center',
  justifyContent: 'center',
},
// markerPin: {
//   width: 12,
//   height: 12,
//   borderRadius: 6,
//   backgroundColor: '#5f5fff',
//   borderWidth: 2,
//   borderColor: 'white',
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 2 },
//   shadowOpacity: 0.3,
//   shadowRadius: 2,
//   elevation: 3,
// },
markerBase: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#5f5fff',
  opacity: 0.5,
  marginTop: 2,
},
mapContainer: { 
  marginTop: hp("2%"),
  borderRadius: wp("2%"),
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#e9ecef",
},
map: { 
  width: "100%", 
  height: hp("25%"),
},
mapLoading: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f8f9fa',
},
loadingText: {
  marginTop: hp('2%'),
  fontSize: wp('3.5%'),
  fontFamily: 'Poppins_400Regular',
  color: '#5f5fff',
},
mapPlaceholder: {
  width: '100%',
  height: hp('25%'),
  backgroundColor: '#f8f9fa',
  justifyContent: 'center',
  alignItems: 'center',
  padding: wp('5%'),
},
placeholderText: {
  fontSize: wp('3.8%'),
  fontFamily: 'Poppins_400Regular',
  color: '#999',
  marginTop: hp('2%'),
  marginBottom: hp('3%'),
  textAlign: 'center',
},
enableLocationBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#5f5fff',
  paddingHorizontal: wp('6%'),
  paddingVertical: hp('1.5%'),
  borderRadius: wp('1%'),
},
enableLocationText: {
  color: 'white',
  fontSize: wp('3.8%'),
  fontFamily: 'Poppins_400Regular',
  marginLeft: wp('2%'),
},
mapButton: {
  width: '100%',
  height: hp('25%'),
  backgroundColor: '#f8f9fa',
  borderRadius: wp('2%'),
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e9ecef',
},
mapPreview: {
  alignItems: 'center',
  justifyContent: 'center',
  padding: wp('5%'),
},
mapText: {
  fontSize: wp('4%'),
  fontFamily: 'Poppins_600SemiBold',
  color: '#030303',
  marginTop: hp('2%'),
  marginBottom: hp('1%'),
},
coordinates: {
  fontSize: wp('3.2%'),
  fontFamily: 'Poppins_400Regular',
  color: '#666',
  textAlign: 'center',
},
});