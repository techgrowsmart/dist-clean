import React from 'react';
import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Dimensions, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import BackArrowIcon from '../../../assets/svgIcons/BackArrow';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Poppins_400Regular, Poppins_500Medium, useFonts } from '@expo-google-fonts/poppins';
import { getAuthToken } from '../../../utils/authStorage';
import { BASE_URL } from '../../../config';

const { width, height } = Dimensions.get("window");

const CreateSubject = () => {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium
  });
  
  const [isChecked, setIsChecked] = useState(false);
  const [selectedTeachingCategory, setSelectedTeachingCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [showTeachingDropdown, setShowTeachingDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [subjectTitle, setSubjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [skillName, setSkillName] = useState('');

  const teachingCategories = ['Subject Teacher', 'Skill Teacher'];
  const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const boards = ['ICSE', 'CBSE', 'State Board'];

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setShowTeachingDropdown(false);
    setShowClassDropdown(false);
    setShowBoardDropdown(false);
  };

  const renderDropdown = (items: string[], selectedValue: string, onSelect: (item: string) => void, isVisible: boolean) => {
    if (!isVisible) return null;
    
    return (
      <View style={styles.dropdown}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dropdownItem}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.dropdownText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const selectTeachingCategory = (category: string) => {
    setSelectedTeachingCategory(category);
    setShowTeachingDropdown(false);
  };

  const selectClass = (className: string) => {
    setSelectedClass(className);
    setShowClassDropdown(false);
  };

  const selectBoard = (board: string) => {
    setSelectedBoard(board);
    setShowBoardDropdown(false);
  };

  const handleSubmit = async () => {
    if (!isChecked) {
        Alert.alert('Verification Required', 'Please verify and confirm before publishing');
        return;
    }

    if (!subjectTitle) {
        Alert.alert('Required Field', 'Title is required');
        return;
    }

    // For Subject Teacher, require class selection
    if (selectedTeachingCategory === 'Subject Teacher' && !selectedClass) {
        Alert.alert('Required Field', 'Class selection is required for Subject Teacher');
        return;
    }

    setLoading(true);


    try {
      const authToken = await getAuthToken();
      
      if (!authToken) {
          Alert.alert('Authentication Error', 'Please login again');
          return;
      }

      const requestData = {
          teachingCategory: selectedTeachingCategory || 'Subject Teacher',
          subjectTitle: subjectTitle,
          description: description,
          className: selectedTeachingCategory === 'Subject Teacher' ? selectedClass : 'Skill',
          board: selectedTeachingCategory === 'Subject Teacher' ? selectedBoard : 'Not Applicable'
      };

        const response = await fetch(`${BASE_URL}/api/createSubject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Subject created successfully! Awaiting verification.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      Alert.alert('Network Error', 'Failed to create subject. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? hp('2%') : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.innerContainer}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconWrapper} onPress={() => router.back()}>
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={styles.title}>Create Subject</Text>
            </View>

            <ScrollView 
              contentContainerStyle={styles.content} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info Text */}
              <Text style={styles.info}>
                Subject image will be uploaded soon after verification.
              </Text>

              {/* Teaching Category */}
              <View style={styles.field}>
                <Text style={styles.label}>Teaching Category</Text>
                <TouchableOpacity 
                  style={styles.dropdownInput} 
                  onPress={() => {
                    dismissKeyboard();
                    setShowTeachingDropdown(!showTeachingDropdown);
                  }}
                >
                  <Text style={[styles.inputText, !selectedTeachingCategory && styles.placeholder]}>
                    {selectedTeachingCategory || 'Subject Teacher'}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={wp('4.5%')} 
                    color="#9a9a9a" 
                    style={[styles.chevron, showTeachingDropdown && styles.chevronRotated]} 
                  />
                </TouchableOpacity>
                {renderDropdown(teachingCategories, selectedTeachingCategory, selectTeachingCategory, showTeachingDropdown)}
              </View>

              {/* Conditional Rendering Based on Teaching Category */}
           {selectedTeachingCategory === 'Subject Teacher' && (
  <>
    {/* Class Selection */}
    <View style={styles.field}>
      <Text style={styles.label}>Which Class</Text>
      <TouchableOpacity 
        style={styles.fullWidthDropdownInput} 
        onPress={() => {
          dismissKeyboard();
          setShowClassDropdown(!showClassDropdown);
        }}
      >
        <Text style={[styles.inputText, !selectedClass && styles.placeholder]}>
          {selectedClass || 'Enter Class name'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={wp('4.5%')} 
          color="#9a9a9a" 
          style={[styles.chevron, showClassDropdown && styles.chevronRotated]} 
        />
      </TouchableOpacity>
      {showClassDropdown && (
        <ScrollView style={styles.fullWidthDropdown} nestedScrollEnabled={true}>
          {classes.map((className, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dropdownItem}
              onPress={() => selectClass(className)}
            >
              <Text style={styles.dropdownText}>{className}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  </>
)}
              {/* Description */}
              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Provide a brief description of your class"
                  placeholderTextColor="#9a9a9a"
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => {
                    setShowClassDropdown(false);
                    setShowTeachingDropdown(false);
                    setShowBoardDropdown(false);
                  }}
                />
                <Text style={styles.hint}>Max 500 words</Text>
              </View>

              {/* Board - Only for Subject Teacher */}
              {selectedTeachingCategory === 'Subject Teacher' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Select Education Board</Text>
                  <TouchableOpacity 
                    style={styles.dropdownInput} 
                    onPress={() => {
                      dismissKeyboard();
                      setShowBoardDropdown(!showBoardDropdown);
                    }}
                  >
                    <Text style={[styles.inputText, !selectedBoard && styles.placeholder]}>
                      {selectedBoard || 'Board Name'}
                    </Text>
                    <Ionicons 
                      name="chevron-down" 
                      size={wp('4.5%')} 
                      color="#9a9a9a" 
                      style={[styles.chevron, showBoardDropdown && styles.chevronRotated]} 
                    />
                  </TouchableOpacity>
                  {renderDropdown(boards, selectedBoard, selectBoard, showBoardDropdown)}
                </View>
              )}

              {/* Subject Title */}
              <View style={styles.field}>
                  <Text style={styles.label}>
                      {selectedTeachingCategory === 'Skill Teacher' ? 'Skill Title' : 'Subject Title'}
                  </Text>
                  <TextInput 
                      style={styles.input} 
                      placeholder={selectedTeachingCategory === 'Skill Teacher' ? 'Enter skill title (e.g., Guitar Lessons)' : 'Enter subject title'} 
                      placeholderTextColor="#9a9a9a" 
                      value={subjectTitle}
                      onChangeText={setSubjectTitle}
                      onFocus={() => {
                          setShowClassDropdown(false);
                          setShowTeachingDropdown(false);
                          setShowBoardDropdown(false);
                      }}
                  />
              </View>

              {/* Checkbox */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsChecked(!isChecked)}
                >
                  {isChecked && <Ionicons name="checkmark" size={16} color="#000" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Please verify and confirm before publish</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.disabledBtn]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Creating...' : 'Request Publish'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateSubject;

const styles = StyleSheet.create({
  // Your existing styles here - they remain the same
  safeArea: { flex: 1, backgroundColor: '#FFF', marginTop: 30 },
  container: { flex: 1, backgroundColor: '#FFF' },
  innerContainer: { flex: 1 },
  header: { paddingTop: hp('1%'), paddingHorizontal: wp('5.33%'), flexDirection: 'row', alignItems: 'center', position: 'relative', marginBottom: hp('1%') },
  iconWrapper: { width: wp('11.2%'), height: wp('11.2%'), backgroundColor: '#f9f9f9', borderRadius: wp('5.6%'), alignItems: 'center', justifyContent: 'center', elevation: 3, marginRight: wp('4%') },
  title: { fontSize: wp('6%'), fontFamily: 'Poppins_500Medium', color: '#03070e' },
  content: { padding: wp('5.33%'), paddingBottom: hp('5%') },
  info: { textAlign: 'center', fontFamily: 'Poppins_500Medium', fontSize: wp('6%'), lineHeight: hp('2.8%'), color: '#374151', marginBottom: hp('2.5%') },
  field: { marginBottom: hp('2%'), position: 'relative' },
  label: { fontSize: wp('3.7%'), fontFamily: 'Poppins_400Regular', marginBottom: hp('1%'), color: '#000' },
  input: { backgroundColor: '#f1f1f1', paddingVertical: hp('1.5%'), paddingHorizontal: wp('3.5%'), borderRadius: wp('2.5%'), fontFamily: 'Poppins_400Regular', color: '#000', fontSize: wp('3.8%') },
  dropdownInput: { backgroundColor: '#f1f1f1', paddingVertical: hp('1.5%'), paddingHorizontal: wp('3.5%'), borderRadius: wp('2.5%'), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputText: { fontFamily: 'Poppins_400Regular', color: '#000', fontSize: wp('3.8%'), flex: 1 },
  placeholder: { color: '#9a9a9a' },
  chevron: { marginLeft: wp('2%') },
  chevronRotated: { transform: [{ rotate: '180deg' }] },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', borderRadius: wp('2.5%'), elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 1000, maxHeight: hp('25%') },
  dropdownItem: { paddingVertical: hp('1.2%'), paddingHorizontal: wp('3.5%'), borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  dropdownText: { fontFamily: 'Poppins_400Regular', fontSize: wp('3.8%'), color: '#000' },
  textArea: { height: hp('12.5%'), textAlignVertical: 'top' },
  hint: { fontSize: wp('3.2%'), fontFamily: 'Poppins_400Regular', color: '#888', marginTop: hp('0.5%') },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: hp('2.5%'), marginBottom: hp('4%') },
  checkbox: { width: wp('5%'), height: wp('5%'), borderWidth: 1, borderColor: '#888', marginRight: wp('3%'), borderRadius: wp('1%'), alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { fontFamily: 'Poppins_400Regular', fontSize: wp('3.6%'), color: '#000', flex: 1, flexWrap: 'wrap' },
  submitBtn: { height: hp('7%'), width: wp('84%'), backgroundColor: '#4255ff', paddingVertical: hp('1.6%'), borderRadius: wp('10%'), alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: hp('2%') },
  submitText: { color: '#fff', fontSize: wp('4.3%'), fontFamily: 'Poppins_400Regular', lineHeight: hp('3.3%') },
  fullWidthDropdownInput: { 
  backgroundColor: '#f1f1f1', 
  paddingVertical: hp('1.5%'), 
  paddingHorizontal: wp('3.5%'), 
  borderRadius: wp('2.5%'), 
  flexDirection: 'row', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  width: '100%'
},
fullWidthDropdown: { 
  position: 'absolute', 
  top: '100%', 
  left: 0, 
  right: 0, 
  backgroundColor: '#fff', 
  borderRadius: wp('2.5%'), 
  elevation: 5, 
  shadowColor: '#000', 
  shadowOffset: { width: 0, height: 2 }, 
  shadowOpacity: 0.25, 
  shadowRadius: 3.84, 
  zIndex: 1000, 
  maxHeight: hp('25%') 
},
  disabledBtn: { backgroundColor: '#a0a0a0', opacity: 0.6 },
});