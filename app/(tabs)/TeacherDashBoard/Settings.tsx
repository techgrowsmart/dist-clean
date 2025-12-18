import React, { useState, useEffect } from "react";
import { 
  KeyboardAvoidingView, 
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
const { height, width } = Dimensions.get("window");
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';

const Settings = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    pan: "",
    accountHolderName: ""
  });
  const [formData, setFormData] = useState({
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    pan: "",
    accountHolderName: ""
  });

  let [fontsLoaded] = useFonts({ 
    Poppins_400Regular,
    Poppins_600SemiBold 
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      setIsLoading(true);
      const authData = await getAuthData();
      
      if (!authData?.token) {
        console.error('No authentication data found');
        Alert.alert('Error', 'Please login again');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/bank-details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clone the response before reading it
      const responseClone = response.clone();
      let data;
      
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }
      
      const emptyDetails = {
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        pan: "",
        accountHolderName: ""
      };

      if (data?.success) {
        setBankDetails(data.data || emptyDetails);
        setFormData(data.data || emptyDetails);
      } else {
        setBankDetails(emptyDetails);
        setFormData(emptyDetails);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to fetch bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const authData = await getAuthData();
      
      if (!authData || !authData.token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/update-bank-details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: formData.accountNumber,
          ifsc_code: formData.ifscCode,
          bank_name: formData.bankName,
          account_holder_name: formData.accountHolderName,
          pan: formData.pan,
          pincode: "000000" // You might want to get this from user
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBankDetails(formData);
        setIsEditing(false);
        Alert.alert('Success', 'Bank details updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update bank details');
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      Alert.alert('Error', 'Failed to update bank details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(bankDetails);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#5f5fff" />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>User Settings</Text>
          <Text style={styles.info}>Update your preferences in User Settings anytime</Text>
        </View>

        <View style={styles.divider} />

        {/* Form */}
        <View style={styles.content}>
          <View style={styles.personalInfo}>
            <Text style={styles.label}>Personal Info</Text>
            <View style={styles.inputFields}>
              <TextInput 
                placeholder="First Name" 
                style={styles.input} 
                value={formData.accountHolderName.split(' ')[0] || ''}
                onChangeText={(text) => {
                  const names = formData.accountHolderName.split(' ');
                  names[0] = text;
                  handleInputChange('accountHolderName', names.join(' '));
                }}
                editable={isEditing}
                placeholderTextColor="#3d3d3d" 
              />
              <TextInput 
                placeholder="Last Name" 
                style={styles.input} 
                value={formData.accountHolderName.split(' ').slice(1).join(' ') || ''}
                onChangeText={(text) => {
                  const names = formData.accountHolderName.split(' ');
                  names[1] = text;
                  handleInputChange('accountHolderName', names.join(' ').trim());
                }}
                editable={isEditing}
                placeholderTextColor="#3d3d3d" 
              />
            </View>
            <TouchableOpacity style={styles.countryBtn}>
              <Text style={styles.btnTxt}>India</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.mainContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.mainContentTitle}>Account details</Text>
              <TouchableOpacity 
                style={styles.editIcon}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Ionicons 
                  name={isEditing ? "close" : "create-outline"} 
                  size={wp('4.5%')} 
                  color={isEditing ? "#c30707" : "#5f5fff"} 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputs}>
              <TextInput 
                placeholder="Account Number" 
                placeholderTextColor="#94a3b8" 
                style={styles.contentInput} 
                value={isEditing ? formData.accountNumber : bankDetails.accountNumber}
                onChangeText={(value) => handleInputChange('accountNumber', value)}
                editable={isEditing}
              />
              <TextInput 
                placeholder="Bank Name" 
                placeholderTextColor="#94a3b8" 
                style={styles.contentInput} 
                value={isEditing ? formData.bankName : bankDetails.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
                editable={isEditing}
              />
              <TextInput 
                placeholder="IFSC Code" 
                placeholderTextColor="#94a3b8" 
                style={styles.contentInput} 
                value={isEditing ? formData.ifscCode : bankDetails.ifscCode}
                onChangeText={(value) => handleInputChange('ifscCode', value)}
                editable={isEditing}
              />
              <TextInput 
                placeholder="PAN Card Number" 
                placeholderTextColor="#94a3b8" 
                style={styles.contentInput} 
                value={isEditing ? formData.pan : bankDetails.pan}
                onChangeText={(value) => handleInputChange('pan', value)}
                editable={isEditing}
              />
            </View>
          </View>

          {isEditing && (
            <>
              <View style={styles.divider} />

              {/* Save & Cancel Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.saveBtn}
                  onPress={handleUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnTxt}>Update</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Security Section */}
          <View style={styles.security}>
            <Text style={styles.securityTitle}>Security</Text>
            <View style={styles.checkboxContainer}>
              <Text style={styles.checkboxLabel}>Delete my profile</Text>
              <TouchableOpacity 
                style={styles.checkbox} 
                onPress={() => setIsChecked(!isChecked)}
              >
                {isChecked && <Ionicons name="checkmark" size={wp('3.2%')} color="#000" />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delete Button */}
          <View style={styles.deleteContainer}>
            <TouchableOpacity style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === 'ios' ? hp('2%') : 0
  },
  scrollContainer: { 
    flexGrow: 1,
    paddingBottom: hp('15%'),
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%')
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontFamily: 'Poppins_400Regular',
    fontSize: wp('3.8%'),
    color: '#374151'
  },
  header: { 
    paddingTop: hp('4%') 
  },
  title: { 
    color: '#030303',
    fontSize: wp('6%'),
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: hp('4%'),
    marginBottom: hp('1%')
  },
  info: { 
    fontFamily: "Poppins_400Regular", 
    fontSize: wp('3.8%'), 
    lineHeight: hp('2.5%'), 
    color: "#374151" 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#E5E7EB", 
    marginVertical: hp('2.5%') 
  },
  content: { 
    paddingTop: hp('1%') 
  },
  personalInfo: { 
    marginBottom: hp('1%') 
  },
  label: { 
    color: '#030303',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: hp('2.2%'),
    marginBottom: hp('2%')
  },
  inputFields: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: hp('2.5%'), 
    gap: wp('4%') 
  },
  input: { 
    flex: 1, 
    minWidth: wp('42%'), 
    backgroundColor: "#f8f8f8", 
    height: hp('6%'), 
    paddingHorizontal: wp('4%'), 
    borderRadius: wp('2.5%'), 
    fontSize: wp('3.8%'),
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    color: '#000',
    paddingVertical: Platform.OS === 'ios' ? hp('1.5%') : 0
  },
  countryBtn: { 
    width: "100%", 
    height: hp('5.5%'), 
    borderRadius: wp('3%'), 
    backgroundColor: "#5f5fff", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  mainContent: { 
    marginVertical: hp('1%') 
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp('2%')
  },
  mainContentTitle: { 
    color: '#030303',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: hp('2.2%'),
  },
  editIcon: {
    padding: wp('1%'),
  },
  inputs: { 
    gap: hp('2%') 
  },
  contentInput: { 
    width: "100%", 
    height: hp('6.5%'), 
    borderRadius: wp('2.5%'), 
    backgroundColor: "#fff", 
    paddingHorizontal: wp('4%'), 
    fontSize: wp('3.8%'),
    fontFamily: "Poppins_400Regular",
    borderWidth: 1, 
    borderColor: "#d1d5db",
    color: '#000',
    paddingVertical: Platform.OS === 'ios' ? hp('1.5%') : 0
  },
  actionButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginVertical: hp('3%'), 
    gap: wp('4%') 
  },
  saveBtn: { 
    flex: 1, 
    height: hp('6%'), 
    borderRadius: wp('2.5%'), 
    backgroundColor: "#5f5fff", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  cancelBtn: { 
    flex: 1, 
    height: hp('6%'), 
    borderRadius: wp('2.5%'), 
    borderWidth: 1, 
    borderColor: "#3164f4", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  btnTxt: { 
    color: "#fff", 
    fontSize: wp('3.8%'), 
    fontFamily: "Poppins_600SemiBold" 
  },
  cancelBtnTxt: { 
    fontSize: wp('3.8%'), 
    color: "#3164f4", 
    fontFamily: "Poppins_600SemiBold" 
  },
  security: { 
    marginVertical: hp('2%') 
  },
  securityTitle: { 
    color: '#030303',
    fontSize: wp('3.5%'),
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: hp('2.2%'),
    marginBottom: hp('2%')
  },
  checkboxContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  checkboxLabel: { 
    fontFamily: "Poppins_400Regular", 
    fontSize: wp('3.8%'), 
    color: "#000", 
    flex: 1 
  },
  checkbox: { 
    height: wp('5.5%'), 
    width: wp('5.5%'), 
    borderWidth: 1, 
    borderColor: '#3164f4', 
    backgroundColor: '#fff', 
    borderRadius: wp('1%'), 
    alignItems: "center", 
    justifyContent: "center" 
  },
  deleteContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    marginVertical: hp('2%') 
  },
  deleteBtn: { 
    width: wp('50%'), 
    height: hp('6%'), 
    borderWidth: 1, 
    borderColor: "#c30707", 
    borderRadius: wp('2.5%'), 
    justifyContent: "center", 
    alignItems: "center" 
  },
  deleteText: { 
    fontSize: wp('3.8%'), 
    color: "#c30707", 
    fontFamily: "Poppins_600SemiBold" 
  },
});