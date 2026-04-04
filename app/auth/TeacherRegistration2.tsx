import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, ImageBackground, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { safeBack } from '../../utils/navigation';

const { width, height } = Dimensions.get('window');

export default function TeacherRegistration2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isWeb = Platform.OS === 'web';
  const email = params.email as string || '';
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    residentialAddress: '',
    state: '',
    country: '',
    experience: '',
    specialization: '',
    highestDegree: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      // Here you would save the teacher registration data to the backend
      // For now, just navigate to the teacher dashboard
      router.replace('/(tabs)/TeacherDashBoard' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    safeBack(router, '/login');
  };

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        <StatusBar barStyle="light-content" />
        {/* Left Column - Background Image Only */}
        <View style={webStyles.leftColumn}>
          <ImageBackground
            source={require('../../assets/images/login-background.jpeg')}
            style={webStyles.backgroundImage}
            resizeMode="cover"
          >
            <View style={webStyles.imageOverlay} />
            <View style={webStyles.overlayContent}>
              <View style={webStyles.leftLogo}>
                <Text style={webStyles.leftLogoText}>GS</Text>
              </View>
              <Text style={webStyles.brandTitle}>Teacher Registration</Text>
              <Text style={webStyles.brandSubtitle}>Complete your professional profile</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Right Column - Content */}
        <View style={webStyles.rightColumn}>
          <View style={webStyles.content}>
            {/* Back Button */}
            <View style={webStyles.backButtonContainer}>
              <TouchableOpacity style={webStyles.backButton} onPress={handleBack}>
                <Text style={webStyles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <ScrollView style={webStyles.formSection} showsVerticalScrollIndicator={false}>
              <Text style={webStyles.formTitle}>Professional Information</Text>
              <Text style={webStyles.formSubtitle}>
                Please provide your professional details to complete registration
              </Text>

              {/* Full Name */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  editable={!loading}
                />
              </View>

              {/* Phone Number */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Residential Address */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Residential Address</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your residential address"
                  value={formData.residentialAddress}
                  onChangeText={(value) => handleInputChange('residentialAddress', value)}
                  multiline
                  numberOfLines={2}
                  editable={!loading}
                />
              </View>

              {/* State */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>State</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your state"
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  editable={!loading}
                />
              </View>

              {/* Country */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Country</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your country"
                  value={formData.country}
                  onChangeText={(value) => handleInputChange('country', value)}
                  editable={!loading}
                />
              </View>

              {/* Experience */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Years of Experience</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your years of experience"
                  value={formData.experience}
                  onChangeText={(value) => handleInputChange('experience', value)}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>

              {/* Specialization */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Specialization</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your specialization (e.g., Mathematics, Science)"
                  value={formData.specialization}
                  onChangeText={(value) => handleInputChange('specialization', value)}
                  editable={!loading}
                />
              </View>

              {/* Highest Degree */}
              <View style={webStyles.inputContainer}>
                <Text style={webStyles.inputLabel}>Highest Degree</Text>
                <TextInput
                  style={webStyles.input}
                  placeholder="Enter your highest degree"
                  value={formData.highestDegree}
                  onChangeText={(value) => handleInputChange('highestDegree', value)}
                  editable={!loading}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[webStyles.saveButton, loading && webStyles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={webStyles.saveButtonText}>
                  {loading ? 'Saving...' : 'Complete Registration'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  // Mobile fallback
  return (
    <View style={styles.mobileContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mobileContent}>
        {/* Mobile Header */}
        <View style={styles.mobileHeader}>
          <TouchableOpacity style={styles.mobileBackButton} onPress={handleBack}>
            <Text style={styles.mobileBackButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Mobile Form */}
        <ScrollView style={styles.mobileForm} showsVerticalScrollIndicator={false}>
          <Text style={styles.mobileFormTitle}>Teacher Registration</Text>
          <Text style={styles.mobileFormSubtitle}>
            Please provide your professional details to complete registration
          </Text>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              editable={!loading}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          {/* Residential Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Residential Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your residential address"
              value={formData.residentialAddress}
              onChangeText={(value) => handleInputChange('residentialAddress', value)}
              multiline
              numberOfLines={2}
              editable={!loading}
            />
          </View>

          {/* State */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your state"
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
              editable={!loading}
            />
          </View>

          {/* Country */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your country"
              value={formData.country}
              onChangeText={(value) => handleInputChange('country', value)}
              editable={!loading}
            />
          </View>

          {/* Experience */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your years of experience"
              value={formData.experience}
              onChangeText={(value) => handleInputChange('experience', value)}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          {/* Specialization */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Specialization</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your specialization"
              value={formData.specialization}
              onChangeText={(value) => handleInputChange('specialization', value)}
              editable={!loading}
            />
          </View>

          {/* Highest Degree */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Highest Degree</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your highest degree"
              value={formData.highestDegree}
              onChangeText={(value) => handleInputChange('highestDegree', value)}
              editable={!loading}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Complete Registration'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

// Web-specific styles
const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftColumn: {
    width: '50%',
    minWidth: 400,
    backgroundColor: '#3131b0',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 49, 176, 0.4)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  leftLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#7C4DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.4)',
    elevation: 16,
  },
  leftLogoText: {
    fontSize: 40,
    fontWeight: '900',
    // ... (rest of the code remains the same)
  },
  // ... (rest of the code remains the same)
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    boxShadow: '0 6px 12px rgba(124, 77, 219, 0.4)',
    elevation: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    boxShadow: 'none',
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

// Mobile styles
const styles = StyleSheet.create({
  // ... (rest of the code remains the same)
  mobileSaveButton: {
    backgroundColor: '#7C4DDB',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    boxShadow: '0 4px 8px rgba(124, 77, 219, 0.3)',
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    boxShadow: 'none',
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
