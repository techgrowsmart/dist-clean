import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../utils/authStorage';

const Contact = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineUserType = async () => {
      try {
        const authData = await getAuthData();
        
        // Check if user is authenticated
        if (!authData?.token) {
          // If not authenticated, redirect to login or show a message
          router.replace('/(tabs)/StudentDashBoard/Contact');
          return;
        }

        // Determine user type based on available data or role
        // You might have a role field in authData, or you can check the current route context
        if (authData.role === 'teacher' || authData.userType === 'teacher') {
          setUserType('teacher');
          router.replace('/(tabs)/TeacherDashBoard/Contact');
        } else {
          setUserType('student');
          router.replace('/(tabs)/StudentDashBoard/Contact');
        }
      } catch (error) {
        console.error('Error determining user type:', error);
        // Default to student contact page on error
        router.replace('/(tabs)/StudentDashBoard/Contact');
      } finally {
        setLoading(false);
      }
    };

    determineUserType();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // This component will redirect immediately, so we don't need to render anything
  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
});

export default Contact;
