import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import { Prompt_400Regular } from '@expo-google-fonts/prompt';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import BackArrowIcon from '../../../assets/svgIcons/BackArrow';
import { getAuthToken, getAuthData } from '../../../utils/authStorage';
import { BASE_URL } from '../../../config';

const screenWidth = Dimensions.get("window").width;
const edges: Edge[] = ['top', 'left', 'right'];

interface Subject {
  subject_id: string;
  teacher_email: string;
  teaching_category: string;
  class_name: string;
  class_category: string;
  description: string;
  board: string;
  subject_title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const Subjects = () => {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Prompt_400Regular,
    WorkSans_400Regular
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      setError('');
      const authToken = await getAuthToken();
      const authData = await getAuthData();
      
      if (!authToken || !authData?.email) {
        setError('Please login again');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/teacher-subjects?email=${authData.email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      } else if (response.status === 500) {
        console.error('Server error (500) fetching subjects');
        // Don't show error UI for server errors, just empty state
        setSubjects([]);
      } else {
        setError('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubjects();
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.approved;
      case 'pending':
        return styles.pending;
      case 'rejected':
        return styles.rejected;
      default:
        return styles.pending;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.approvedText;
      case 'pending':
        return styles.pendingText;
      case 'rejected':
        return styles.rejectedText;
      default:
        return styles.pendingText;
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  // Handle back navigation
  const handleBackPress = () => {
    // Try going back first, if no history then push to teacher dashboard
    if (router.canGoBack()) {
      router.back();
    } else {
      // Adjust this path based on your actual route structure
      router.push("/(tabs)/TeacherDashBoard/Teacher");
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4255ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.iconWrapper} 
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increases touch area
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>Subjects</Text>
          </View>
        </View>

        {/* Create Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push("/(tabs)/TeacherDashBoard/CreateSubject")}
          >
            <Text style={styles.buttonText}>+ Create Subject</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSubjects}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4255ff" />
            <Text style={styles.loadingText}>Loading your subjects...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subjects created yet</Text>
            <Text style={styles.emptySubText}>Create your first subject to get started</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.subject_id} style={styles.card}>
              <View style={styles.cardContent}>
                <Image
                  source={require('../../../assets/image/medium.jpeg')}
                  style={styles.cardImage}
                />
                <View style={styles.cardDetails}>
                  {subject.teaching_category === 'Subject Teacher' ? (
                    <>
                      <Text style={styles.cardText}>
                        <Text style={styles.bold}>Subject:</Text>
                        {'   '}
                        <Text style={styles.value}>{subject.subject_title}</Text>
                      </Text>
                      <Text style={styles.cardText}>
                        <Text style={styles.bold}>Class:</Text>
                        {'     '}
                        <Text style={styles.value}>{subject.class_name}</Text>
                      </Text>
                      <Text style={styles.cardText}>
                        <Text style={styles.bold}>Board:</Text>
                        {'    '}
                        <Text style={styles.value}>{subject.board}</Text>
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.cardText}>
                        <Text style={styles.bold}>Category:</Text>
                        {'   '}
                        <Text style={styles.value}>Skill</Text>
                      </Text>
                      <Text style={styles.cardText}>
                        <Text style={styles.bold}>Skill:</Text>
                        {'     '}
                        <Text style={styles.value}>{subject.subject_title}</Text>
                      </Text>
                    </>
                  )}
                  
                  <View style={[styles.statusBadge, getStatusBadgeStyle(subject.status)]}>
                    <Text style={getStatusTextStyle(subject.status)}>
                      {getStatusDisplayText(subject.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: wp('5%'), 
    marginTop: hp('2%'), 
    marginBottom: hp('3%') 
  },
  iconWrapper: { 
    width: wp('11.2%'), 
    height: wp('11.2%'), 
    backgroundColor: '#f9f9f9', 
    borderRadius: wp('5.6%'), 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 2 
  },
  titleWrapper: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', // Center the title
    marginLeft: -wp('11.2%') // Adjust this value if needed
  },
  title: { 
    fontSize: wp('5.06%'), 
    color: '#000', 
    fontFamily: 'Poppins_600SemiBold', 
    textAlign: 'center' 
  },
  buttonWrapper: { 
    width: wp('53.33%'), 
    height: hp('6.32%'), 
    alignSelf: 'center', 
    justifyContent: "center", 
    marginBottom: hp('3%') 
  },
  button: { 
    alignItems: 'center', 
    justifyContent: "center", 
    backgroundColor: '#4255ff', 
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('10%'),
    minWidth: wp('40%')
  },
  buttonText: { 
    color: '#fff', 
    fontSize: wp('3.8%'), 
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlign: 'center'
  },
  scrollContent: { paddingBottom: hp('5%') },
  card: { 
    padding: wp('4%'), 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0',
    marginBottom: hp('1%'),
    backgroundColor: '#fafafa',
    borderRadius: wp('2%'),
    marginHorizontal: wp('3%')
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardImage: { width: wp('30%'), height: wp('30%'), borderRadius: wp('2.5%'), marginRight: wp('4%') },
  cardDetails: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingVertical: hp('1.2%'), 
    paddingLeft: wp('2%'), 
    gap: hp('0.8%')
  },
  cardText: { fontSize: wp('3.5%'), fontFamily: 'Poppins_400Regular', color: '#333', lineHeight: hp('2.2%') },
  bold: { fontFamily: 'Poppins_600SemiBold', color: '#030303', fontSize: wp('3.6%') },
  value: { marginLeft: wp('2%'), color: '#555' },
  statusBadge: { 
    alignSelf: 'flex-start', 
    paddingVertical: hp('0.5%'), 
    paddingHorizontal: wp('4%'), 
    borderRadius: wp('2%'),
    marginTop: hp('1%')
  },
  approved: { backgroundColor: '#71d561' },
  pending: { backgroundColor: '#ffa726' },
  rejected: { backgroundColor: '#ef5350' },
  approvedText: { color: '#000', fontSize: wp('3%'), fontFamily: 'Poppins_600SemiBold' },
  pendingText: { color: '#000', fontSize: wp('3%'), fontFamily: 'Poppins_600SemiBold' },
  rejectedText: { color: '#fff', fontSize: wp('3%'), fontFamily: 'Poppins_600SemiBold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp('10%') },
  loadingText: { marginTop: hp('2%'), fontSize: wp('4%'), color: '#666', fontFamily: 'Poppins_400Regular' },
  errorContainer: { alignItems: 'center', paddingVertical: hp('5%'), paddingHorizontal: wp('5%') },
  errorText: { fontSize: wp('4%'), color: '#ef5350', textAlign: 'center', marginBottom: hp('2%'), fontFamily: 'Poppins_400Regular' },
  retryButton: { backgroundColor: '#4255ff', paddingVertical: hp('1%'), paddingHorizontal: wp('6%'), borderRadius: wp('2%') },
  retryButtonText: { color: '#fff', fontSize: wp('3.5%'), fontFamily: 'Poppins_600SemiBold' },
  emptyContainer: { alignItems: 'center', paddingVertical: hp('10%'), paddingHorizontal: wp('5%') },
  emptyText: { fontSize: wp('4.5%'), color: '#666', marginBottom: hp('1%'), fontFamily: 'Poppins_600SemiBold' },
  emptySubText: { fontSize: wp('3.8%'), color: '#888', textAlign: 'center', fontFamily: 'Poppins_400Regular' }
});

export default Subjects;