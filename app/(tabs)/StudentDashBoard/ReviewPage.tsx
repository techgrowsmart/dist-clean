import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../../../config";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";

import {Poppins_400Regular, useFonts} from '@expo-google-fonts/poppins'
import {RedHatDisplay_400Regular,RedHatDisplay_500Medium} from '@expo-google-fonts/red-hat-display'
const TAGS = ['Best teacher', 'Price', 'Great notes', 'Quality of Class', 'Tution','Value for Money','Unique and Easy Class'];

export default function ReviewPage() {
  let [fontsLoaded]=useFonts({
    Poppins_400Regular,
    RedHatDisplay_500Medium,
    RedHatDisplay_400Regular
  })
  const { teacherName, teacherEmail, teacherProfilePic } = useLocalSearchParams<{
    teacherName: string;
    teacherEmail: string;
    teacherProfilePic: string;
  }>();
  
  console.log('ReviewPage received params:', { teacherName, teacherEmail, teacherProfilePic });
  const router = useRouter();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const logAllAsyncStorageItems = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      
      console.log(' All AsyncStorage Items:');
      stores.forEach(([key, value]) => {
        console.log(` ${key}:`, value);
      });
    } catch (e) {
      console.error('Error logging AsyncStorage items:', e);
    }
  };
  const handleSubmit = async () => {
    try {
      await logAllAsyncStorageItems();
      const studentEmail = await AsyncStorage.getItem('user_email');
      const studentName = await AsyncStorage.getItem('studentName');
      const studentProfilePic = await AsyncStorage.getItem('studentProfilePic');
  
      if (!studentEmail || !studentName) {
        alert('Student details missing in AsyncStorage');
        return;
      }
  
      const reviewData = {
        teacherEmail,
        teacherName,
        studentEmail,
        studentName,
        studentProfilePic: studentProfilePic || '',
        rating,
        selectedTags,
        reviewText,
      };
      console.log("Reviw",reviewData)
  
      const response = await fetch(`${BASE_URL}/api/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      console.log(`POSTing review to: ${BASE_URL}/api/review`);

  
      if (response.ok) {
        router.push('/(tabs)/StudentDashBoard/ReviewVerification')
      } else {
        const error = await response.json();
        console.error('❌ Error submitting review:', error);
        alert('Failed to submit review');
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('Something went wrong');
    }
  };
  
  
  

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Me</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeIcon}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {imageLoading && (
              <ActivityIndicator 
                size="small" 
                color="#5f5fff" 
                style={styles.loader}
              />
            )}
            {teacherProfilePic ? (
              <Image
                source={{ uri: teacherProfilePic }}
                style={styles.profilePic}
                onError={(e) => {
                  console.log('Error loading profile image:', e.nativeEvent.error);
                }}
              />
            ) : (
              <View style={styles.initialContainer}>
                <Text style={styles.initialText}>
                  {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.teacherName}>{teacherName}</Text>
            <Text style={styles.teacherEmail}>{teacherEmail}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Overall Rating:</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star'}
                  size={28}
                  color={star <= rating ? '#ffc979' : '#808080'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ marginTop: 4, fontSize: 14, color: 'gray' }}>
            {rating} out of 5
          </Text>
        </View>

        {/* Tags */}
        <Text style={styles.sectionTitle}>What did you like?</Text>
        <View style={styles.tagsContainer}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={
                  selectedTags.includes(tag)
                    ? styles.tagTextSelected
                    : styles.tagText
                }
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Review Input */}
        <Text style={styles.sectionTitle}>How was your experience?</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="How was your experience?"
          placeholderTextColor="#000000"
          value={reviewText}
          onChangeText={setReviewText}
        />

        {/* Buttons */}
        <View style={styles.buttonRow}>
        <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: '#000' }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Publish review</Text>
          </TouchableOpacity>
        
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    height: hp('11%'),
    backgroundColor: '#5f5fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    marginTop: hp('2.5%'),
    fontSize: isTablet ? wp('4.5%') : wp('5.3%'),
    lineHeight: hp('3.2%'),
    color: '#fff',
    fontFamily: 'Poppins_400Regular',
  },
  closeIcon: {
    position: 'absolute',
    right: wp('5.3%'),
    top: hp('3.8%'),
  },
  contentWrapper: {
    padding: wp('5.3%'),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
  },
  imageContainer: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    marginRight: wp('4%'),
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  initialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: wp('9%'),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#5f5fff',
  },
  teacherName: {
    fontSize: isTablet ? wp('4%') : wp('4.5%'),
    fontWeight: 'bold',
    color: '#000',
  },
  teacherEmail: {
    color: 'gray',
    fontSize: isTablet ? wp('3.2%') : wp('3.7%'),
  },
  ratingSection: {
    marginBottom: hp('2.5%'),
  },
  ratingLabel: {
    fontSize: isTablet ? wp('3.7%') : wp('4.2%'),
    marginBottom: hp('1%'),
    fontWeight: '500',
  },
  stars: {
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: isTablet ? wp('3.8%') : wp('4.4%'),
    fontWeight: '600',
    marginBottom: hp('1.2%'),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp('2.5%'),
  },
  tag: {
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.8%'),
    borderWidth: 1,
    borderColor: '#5f5fff',
    borderRadius: wp('5.3%'),
    marginRight: wp('2.5%'),
    marginBottom: hp('1%'),
  },
  tagSelected: {
    backgroundColor: '#f5b726',
  },
  tagText: {
    color: '#000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
  },
  tagTextSelected: {
    color: '#000000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
  },
  textArea: {
    width: '100%',
    height: hp('21.5%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1.5%'),
    borderWidth: 1,
    borderColor: '#0f8a3d',
    borderRadius: wp('2%'),
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: isTablet ? wp('3%') : wp('3.5%'),
    lineHeight: hp('2.5%'),
    fontFamily: 'RedHatDisplay_400Regular',
    textAlignVertical: 'top',
    marginBottom: hp('2.5%'),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: wp('43%'),
    height: hp('5.4%'),
    paddingHorizontal: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('7%'),
    backgroundColor: '#5f5fff',
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: isTablet ? wp('3.2%') : wp('3.8%'),
    fontFamily: 'RedHatDisplay_400Regular',
    fontWeight: '500',
    lineHeight: hp('2.2%'),
  },
});

