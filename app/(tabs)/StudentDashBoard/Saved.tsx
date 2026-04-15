import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Alert, Dimensions, Platform } from 'react-native';
import { db } from '../../../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import { RectButton } from 'react-native-gesture-handler';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import { MaterialIcons } from '@expo/vector-icons'; // For the delete icon
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import BottomNavigation from "../../../app/(tabs)/StudentDashBoard/BottomNavigation";

const { width, height } = Dimensions.get('window');

interface SavedTeacher {
    id: string;
    teacherName: string;
    teacherEmail: string;
    profilePic: string;
    teachingClass: string;
    subject: string;
    board: string;
    language: string;
}

export default function Saved() {
    const [savedTeachers, setSavedTeachers] = useState<SavedTeacher[]>([]);
    const [studentEmail, setStudentEmail] = useState<string>("");


    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

  
    useEffect(() => {
        const loadStudentEmail = async () => {
            const storedEmail = await AsyncStorage.getItem('email');
            if (storedEmail) setStudentEmail(storedEmail);
        };

        loadStudentEmail();
    }, []);

    
    // Polling-based fetch to avoid Firestore onSnapshot issues on web
    useEffect(() => {
        if (!studentEmail) return;

        const fetchSavedTeachers = async () => {
            try {
                const auth = await getAuthData();
                if (!auth?.token) return;

                // Try API endpoint first
                try {
                    const response = await axios.get(
                        `${BASE_URL}/api/favorites`,
                        { headers: { Authorization: `Bearer ${auth.token}` } }
                    );
                    if (response.data?.success && response.data?.favorites) {
                        const teachers = response.data.favorites.map((fav: any) => ({
                            id: fav.id || fav._id || fav.teacherEmail,
                            teacherName: fav.teacherName || fav.name || 'Unknown Teacher',
                            teacherEmail: fav.teacherEmail || fav.email || '',
                            teacherProfilePic: fav.teacherProfilePic || fav.profilePic || fav.profilepic || '',
                            ...fav
                        }));
                        setSavedTeachers(teachers);
                        return;
                    }
                } catch (apiError) {
                    console.log('API favorites failed, falling back to Firestore:', apiError);
                }

                // Fallback to Firestore getDocs (one-time fetch)
                const q = query(collection(db, 'savedTeachers'), where('savedBy', '==', studentEmail));
                const querySnapshot = await getDocs(q);
                const teachers: SavedTeacher[] = [];
                querySnapshot.forEach((doc) => {
                    teachers.push({ id: doc.id, ...doc.data() } as SavedTeacher);
                });
                setSavedTeachers(teachers);
            } catch (error) {
                console.error('Error fetching saved teachers:', error);
            }
        };

        // Fetch immediately
        fetchSavedTeachers();

        // Poll every 10 seconds
        const interval = setInterval(fetchSavedTeachers, 10000);

        return () => clearInterval(interval);
    }, [studentEmail]);


    const handleDeleteTeacher = async (teacherId: string) => {
        try {
            await deleteDoc(doc(db, 'savedTeachers', teacherId));
            Alert.alert("Success", "Teacher deleted successfully!");
        } catch (error) {
            console.error("Error deleting teacher:", error);
            Alert.alert("Error", "Failed to delete teacher. Please try again later.");
        }
    };


    const renderRightActions = (teacherId: string) => {
        return (
            <RectButton
                style={styles.deleteButton}
                onPress={() => handleDeleteTeacher(teacherId)}
            >
                <MaterialIcons name="delete" size={24} color="white" />
            </RectButton>
        );
    };

    if (!fontsLoaded) {
        return <Text>Loading...</Text>; 
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Saved Teachers</Text>
                {savedTeachers.length > 0 ? (
                    savedTeachers.map((teacher) => (
                        <Swipeable
                            key={teacher.id}
                            renderRightActions={() => renderRightActions(teacher.id)}
                        >
                            <View style={styles.teacherCard}>
                                <Image
                                    source={teacher.profilePic ? { uri: teacher.profilePic } : require('../../../assets/images/Profile.png')}
                                    style={styles.teacherImage}
                                />
                                <View style={styles.teacherInfo}>
                                    <Text style={styles.teacherName}>{teacher.teacherName}</Text>
                                    <Text style={styles.teacherEmail}>{teacher.teacherEmail}</Text>
                                    <Text style={styles.teacherDetail}>Class: {teacher.teachingClass}</Text>
                                    <Text style={styles.teacherDetail}>Subject: {teacher.subject}</Text>
                                    <Text style={styles.teacherDetail}>Board: {teacher.board}</Text>
                                    <Text style={styles.teacherDetail}>Language: {teacher.language}</Text>
                                </View>
                            </View>
                        </Swipeable>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No saved teachers found.</Text>
                )}
            </ScrollView>
            <BottomNavigation />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: width * 0.05,
        backgroundColor: '#f5f5f5', 
    },
    title: {
        fontSize: width * 0.06,
        fontFamily: 'Poppins_700Bold',
        marginBottom: height * 0.02, 
        color: '#333',
    },
    teacherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: height * 0.02,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: width * 0.04, 
        elevation: 3, 
        ...Platform.select({
 
          web: {
 
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
 
          },
 
          default: {
 
            shadowColor: '#000',
 
            shadowOffset: { width: 0, height: 4 },
 
            shadowOpacity: 0.3,
 
            shadowRadius: 8,
 
          },
 
        }),
    },
    teacherImage: {
        width: width * 0.2,
        height: width * 0.2,
        borderRadius: width * 0.1, 
        marginRight: width * 0.04, 
    },
    teacherInfo: {
        flex: 1,
    },
    teacherName: {
        fontSize: width * 0.045, 
        fontFamily: 'Poppins_600SemiBold',
        color: '#333',
        marginBottom: height * 0.005, 
    },
    teacherEmail: {
        fontSize: width * 0.035, 
        fontFamily: 'Poppins_400Regular',
        color: '#666',
        marginBottom: height * 0.01,
    },
    teacherDetail: {
        fontSize: width * 0.035, 
        fontFamily: 'Poppins_400Regular',
        color: '#555',
        marginBottom: height * 0.005,
    },
    emptyText: {
        fontSize: width * 0.04, 
        fontFamily: 'Poppins_400Regular',
        color: '#666',
        textAlign: 'center',
        marginTop: height * 0.3,
    },
    deleteButton: {
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: width * 0.2, 
        height: '100%',
        borderRadius: 15,
        marginBottom: height * 0.02, 
    },
});