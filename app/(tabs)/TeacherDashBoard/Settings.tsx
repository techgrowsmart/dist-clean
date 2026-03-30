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
import { router } from 'expo-router';
const { height, width } = Dimensions.get("window");
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';

const Settings = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Settings');
  const [userEmail, setUserEmail] = useState<string | null>(null);
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

  // Load teacher data for web header and sidebar
  useEffect(() => {
    if (Platform.OS === 'web') {
      const loadTeacherData = async () => {
        try {
          const authData = await getAuthData();
          if (authData?.name) {
            setTeacherName(authData.name);
          }
          if (authData?.profileImage) {
            setProfileImage(authData.profileImage);
          }
          if (authData?.email) {
            setUserEmail(authData.email);
          }
        } catch (error) {
          console.error('Error loading teacher data:', error);
        }
      };
      loadTeacherData();
    }
  }, []);

  // Handle sidebar navigation
  const handleSidebarSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'joinedDate':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Settings':
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

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
    // Web Layout - Only show on web
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        {/* Web Header */}
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        {/* Main Content with Sidebar */}
        <View style={styles.webContent}>
          {/* Sidebar */}
          <TeacherWebSidebar 
            teacherName={teacherName}
            profileImage={profileImage}
            activeItem={sidebarActiveItem}
            onItemPress={handleSidebarSelect}
            userEmail={userEmail}
            subjectCount={0}
            studentCount={0}
            revenue="₹2.1K"
            isSpotlight={false}
          />
          
          {/* Main Content Area */}
          <View style={styles.webMainContent}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainer} 
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentInsetAdjustmentBehavior="automatic"
            >
              {/* Mobile Header - Only show on non-web platforms */}
              {Platform.OS !== 'web' && (
                <View style={styles.header}>
                  <Text style={styles.title}>User Settings</Text>
                  <Text style={styles.info}>Update your preferences in User Settings anytime</Text>
                </View>
              )}

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
                      placeholder="Bank Name" 
                      style={styles.input} 
                      value={formData.bankName}
                      onChangeText={(text) => handleInputChange('bankName', text)}
                      editable={isEditing}
                      placeholderTextColor="#3d3d3d" 
                    />
                    <TextInput 
                      placeholder="Account Number" 
                      style={styles.input} 
                      value={formData.accountNumber}
                      onChangeText={(text) => handleInputChange('accountNumber', text)}
                      editable={isEditing}
                      placeholderTextColor="#3d3d3d" 
                      keyboardType="numeric"
                    />
                    <TextInput 
                      placeholder="IFSC Code" 
                      style={styles.input} 
                      value={formData.ifscCode}
                      onChangeText={(text) => handleInputChange('ifscCode', text)}
                      editable={isEditing}
                      placeholderTextColor="#3d3d3d" 
                      autoCapitalize="characters"
                    />
                    <TextInput 
                      placeholder="PAN Number" 
                      style={styles.input} 
                      value={formData.pan}
                      onChangeText={(text) => handleInputChange('pan', text)}
                      editable={isEditing}
                      placeholderTextColor="#3d3d3d" 
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.notificationSection}>
                  <Text style={styles.mainContentTitle}>Notification Settings</Text>
                  <View style={styles.notificationItem}>
                    <Text style={styles.notificationText}>Email Notifications</Text>
                    <TouchableOpacity 
                      style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                      onPress={() => setIsChecked(!isChecked)}
                    >
                      {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                {isEditing && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.cancelBtn]} 
                      onPress={handleCancel}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.saveBtn]} 
                      onPress={handleUpdate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    ) : (
      // Mobile Layout
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
                  placeholder="Bank Name" 
                  style={styles.input} 
                  value={formData.bankName}
                  onChangeText={(text) => handleInputChange('bankName', text)}
                  editable={isEditing}
                  placeholderTextColor="#3d3d3d" 
                />
                <TextInput 
                  placeholder="Account Number" 
                  style={styles.input} 
                  value={formData.accountNumber}
                  onChangeText={(text) => handleInputChange('accountNumber', text)}
                  editable={isEditing}
                  placeholderTextColor="#3d3d3d" 
                  keyboardType="numeric"
                />
                <TextInput 
                  placeholder="IFSC Code" 
                  style={styles.input} 
                  value={formData.ifscCode}
                  onChangeText={(text) => handleInputChange('ifscCode', text)}
                  editable={isEditing}
                  placeholderTextColor="#3d3d3d" 
                  autoCapitalize="characters"
                />
                <TextInput 
                  placeholder="PAN Number" 
                  style={styles.input} 
                  value={formData.pan}
                  onChangeText={(text) => handleInputChange('pan', text)}
                  editable={isEditing}
                  placeholderTextColor="#3d3d3d" 
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.notificationSection}>
              <Text style={styles.mainContentTitle}>Notification Settings</Text>
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>Email Notifications</Text>
                <TouchableOpacity 
                  style={[styles.checkbox, isChecked && styles.checkboxChecked]}
                  onPress={() => setIsChecked(!isChecked)}
                >
                  {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.cancelBtn]} 
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.saveBtn]} 
                  onPress={handleUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === 'ios' ? hp('2%') : 0
  },
  // Web-specific styles
  webLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingBottom: hp('5%'), 
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
  // Notification and action button styles
  notificationSection: {
    marginVertical: hp('2%'),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp('1%'),
  },
  notificationText: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  checkboxChecked: {
    backgroundColor: '#3164f4',
  },
  cancelBtnText: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
  },
  saveBtnText: {
    fontSize: wp('3.8%'),
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
});