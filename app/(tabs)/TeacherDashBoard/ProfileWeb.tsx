import { Platform } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import SubjectCard from '../../../components/SubjectCard';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import { UXButton, UXCard, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';
import { useSharedValue, withDelay, withTiming, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { api } from '../../../services/apiService';

// Data Interfaces
interface FormErrors {
  introduction?: string;
  selectedCategory?: string;
  selectedBoard?: string;
  selectedClass?: string;
  selectedSubject?: string;
  selectedSkill?: string;
  teachingMode?: string;
  [key: string]: string | undefined;
}

interface Qualification {
  subject: string;
  college: string;
  year: string;
}

interface Tuition {
  class: string;
  subject: string;
  timeFrom: string;
  timeTo: string;
  charge: string;
  day: string;
  board: string;
  skill: string;
  university: string;
  year: string;
}

interface EducationData {
  id: string;
  name: string;
  boards: any[];
  skills: any[];
  classes?: any[];
}

interface ReviewsData {
  reviews: any[];
  averageRating: number;
  ratingsCount: { [key: number]: number };
}

// Global Design Tokens
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  activeNavBg: '#EEF2FF',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  white: '#FFFFFF',
  green: '#10B981',
  softGreen: '#D1FAE5',
  softPink: '#FCE7F3',
  softYellow: '#FEF3C7',
  softPurple: '#F3E8FF',
  softBlue: '#DBEAFE',
  softRed: '#FEE2E2',
  warningRed: '#EF4444',
  priceBg: '#FEF3C7',
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CHARGE_OPTIONS = Array.from({ length: 10 }, (_, i) => `₹ ${200 + i * 200}/pm`);

export default function ProfileWeb() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Sidebar and Navigation
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Profile');
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Form Data
  const [university, setUniversity] = useState('');
  const [pastUniversity, setPastUniversity] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [workExperiences, setWorkExperiences] = useState<string[]>(['', '', '', '', '']);
  const [selectedCategory, setSelectedCategory] = useState('Subject teacher');
  const [selectedBoard, setSelectedBoard] = useState('CBSE');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [teachingMode, setTeachingMode] = useState<string[]>(['Online']);
  const [isEditable, setIsEditable] = useState(false);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [userStatus, setUserStatus] = useState('dormant');

  // Education and Tuitions
  const [qualifications, setQualifications] = useState<Qualification[]>([
    { subject: '', college: '', year: '' },
    { subject: '', college: '', year: '' },
    { subject: '', college: '', year: '' },
    { subject: '', college: '', year: '' },
  ]);
  const [tuitions, setTuitions] = useState<Tuition[]>([
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: '' },
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: '' },
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: '' },
  ]);
  const [tuitionCount, setTuitionCount] = useState(1);

  // Dropdown Data
  const [educationData, setEducationData] = useState<EducationData[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subject, setSubject] = useState<any[]>([]);
  const [skillItems, setSkillItems] = useState([]);

  // Modal States
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Reviews Data
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  // Teacher Posts Data for Thoughts
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Form Validation
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
      // Auto-collapse sidebar on mobile, expand on desktop
      if (window.width < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    });
    return () => subscription.remove();
  }, []);

  // Load auth data and fetch posts
  useEffect(() => {
    const loadAuthAndPosts = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuthToken(authData.token);
          setUserEmail(authData.email || '');
          setTeacherName(authData.name || '');
          setProfileImage(authData.profileImage || null);
          await fetchPosts(authData.token);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    };

    loadAuthAndPosts();
  }, []);

  // Helper functions for teacher posts (same as TutorDashboardWeb)
  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: teacherName || 'Unknown Teacher',
        pic: profileImage || null,
        role: 'teacher'
      };
    }
    
    // Use cached profile data like student's version
    const cached = userProfileCache.get(post.author?.email) || { name: '', profilePic: '' };
    let name = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
    
    // Handle email fallback for name
    if (!name || name === 'null' || name.includes('@')) {
      name = post.author?.email?.split('@')[0] || teacherName || 'Unknown Teacher';
      // Clean up the name (remove dots, capitalize)
      name = name.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Handle profile image path
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) {
      pic = `/${pic}`;
    }
    if (pic === '' || pic === 'null') {
      pic = profileImage || null;
    }
    
    return { name, pic, role: post.author?.role || 'teacher' };
  };

  const getProfileImageSource = (profilePic?: string) => {
    if (profilePic) {
      // Handle different image path formats
      if (profilePic.startsWith('http')) {
        return { uri: profilePic };
      }
      // For local paths, construct proper URL
      const imageUrl = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
      return { uri: `${BASE_URL}${imageUrl}` };
    }
    return null;
  };

  const initials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Helper function to format 24-hour time to 12-hour AM/PM format
  const formatTimeDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await api.post(
        "/api/userProfile",
        { email }
      );
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.displayName;
        const profileData = { name: userName || 'Unknown User', profilePic: profilePic || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profileData)));
        return profileData;
      }
    } catch (error: any) {
      console.warn('Error fetching user profile:', error?.message || error);
    }
    return { name: 'Unknown User', profilePic: '' };
  };

  // Fetch posts function (same as TutorDashboardWeb)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await api.get(
        "/api/posts/all"
      );
      if (res.success && Array.isArray(res.data)) {
        // Get unique emails from all posts and fetch their profiles
        const uniqueEmails = [...new Set(res.data.map((p: any) => p.author?.email as string).filter((email: string) => Boolean(email)))];
        await Promise.all(uniqueEmails.map((email: string) => fetchUserProfile(token, email)));
        setPosts(res.data);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.warn('Error fetching posts:', error?.message || error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Handle post creation
  const handleCreatePost = async (content: string) => {
    // Ensure auth data is available
    if (!authToken) {
      // Try to reload auth token
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuthToken(authData.token);
        } else {
          throw new Error('No authentication token found. Please log in again.');
        }
      } catch (error) {
        throw new Error('Authentication required. Please log in again.');
      }
    }

    if (!userEmail) {
      throw new Error('User email not found. Please log in again.');
    }

    try {
      const response = await api.post(
        "/api/posts/create",
        {
          content: content.trim(),
          tags: '' // Backend expects comma-separated string, not array
        }
      );

      if (response.success) {
        // Refresh posts to include the new one
        if (authToken) {
          await fetchPosts(authToken);
        }
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new Error(error.message || 'Failed to create post. Please try again.');
    }
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Handle sidebar navigation
  const handleSidebarSelect = useCallback((item: string) => {
    setSidebarActiveItem(item);
    const navigationMap: { [key: string]: string } = {
      "Home": "/(tabs)/TeacherDashBoard/TutorDashboardWeb",
      "My Students": "/(tabs)/TeacherDashBoard/StudentsEnrolled",
      "My Subjects": "/(tabs)/TeacherDashBoard/MySubjectsWeb",
      "Create Subject": "/(tabs)/TeacherDashBoard/CreateSubject",
      "Spotlights": "/(tabs)/TeacherDashBoard/JoinedDateWeb",
      "Share": "/(tabs)/TeacherDashBoard/StudentsListWeb",
      "Profile": "/(tabs)/TeacherDashBoard/ProfileWeb",
      "Billing": "/(tabs)/TeacherDashBoard/Settings",
      "Settings": "/(tabs)/TeacherDashBoard/Settings",
      "Contact Us": "/(tabs)/Contact",
    };
    if (navigationMap[item]) {
      router.push(navigationMap[item] as any);
    } else {
      console.log('Navigate to:', item);
    }
  }, [router]);

  // Fetch User Status
  const fetchUserStatus = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const response = await api.post(
        "/api/userProfile",
        { email: auth.email }
      );
      if (response.data?.status) setUserStatus(response.data.status);
    } catch (error: any) {
      console.warn("Error fetching user status:", error?.message || error);
    }
  }, []);

  // Load Profile Data
  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const { email, token } = auth;
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      try {
        const response = await api.post(
          "/api/teacherProfile",
          { email }
        );
        if (response.status === 200 && response.data) {
          const profileData = response.data;
          setIsExistingProfile(true);
          setTeacherName(profileData.name || '');
          setUserEmail(profileData.email || '');
          setProfileImage(profileData.profileimage || profileData.profilePic || null);
          setIntroduction(profileData.introduction || '');
          setWorkExperience(profileData.workExperience || '');
          setUniversity(profileData.university || '');
          setPastUniversity(profileData.pastUniversity || '');
          setLocation(profileData.location || '');
          setSelectedCategory(profileData.category || 'Subject teacher');
          if (profileData.workExperiences && Array.isArray(profileData.workExperiences)) {
            setWorkExperiences(profileData.workExperiences);
          }
          setTeachingMode(Array.isArray(profileData.teachingMode) ? profileData.teachingMode : ['Online']);
          
          const qualificationsData = Array.isArray(profileData.qualifications) ? profileData.qualifications : [];
          const qualificationsWithDefaults = Array(4).fill(null).map((_, i) => ({
            subject: '', college: '', year: '', ...qualificationsData[i]
          }));
          setQualifications(qualificationsWithDefaults);
          
          const tuitionsData = Array.isArray(profileData.tuitions) ? profileData.tuitions : [];
          setTuitionCount(tuitionsData.length > 0 ? tuitionsData.length : 1);
          const defaultTuitions = Array(3).fill(null).map(() => ({
            class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: ''
          }));
          tuitionsData.forEach((savedTuition: any, index: number) => {
            if (index < 3) defaultTuitions[index] = { ...defaultTuitions[index], ...savedTuition, charge: savedTuition.charge || '' };
          });
          setTuitions(defaultTuitions);
          
          await AsyncStorage.multiSet([
            ["teacherName", profileData.name || ""],
            ["email", profileData.email || ""],
            ["profileImage", profileData.profileimage || profileData.profilePic || ""],
            ["introduction", profileData.introduction || ""],
            ["workexperience", profileData.workExperience || ""],
            ["category", profileData.category || "Subject teacher"],
            ["teachingmode", JSON.stringify(Array.isArray(profileData.teachingMode) ? profileData.teachingMode : ['Online'])],
            ["tutions", JSON.stringify(tuitionsData)],
            ["qualifications", JSON.stringify(qualificationsData)],
            ["university", profileData.university || ""],
          ]);
          return;
        }
      } catch (apiError: any) {
        console.log("Backend API failed, using AsyncStorage fallback:", apiError?.response?.status || apiError?.message);
      }

      const storedData = await AsyncStorage.multiGet([
        "teacherName", "email", "profileImage", "introduction", "workexperience",
        "category", "teachingmode", "tutions", "qualifications", "university",
        "pastUniversity", "location", "workExperiences"
      ]);
      const data = Object.fromEntries(storedData);
      setIsExistingProfile(true);
      setTeacherName(data.teacherName || '');
      setUserEmail(data.email || '');
      setProfileImage(data.profileImage || null);
      setIntroduction(data.introduction || '');
      setWorkExperience(data.workexperience || '');
      setUniversity(data.university || '');
      setPastUniversity(data.pastUniversity || '');
      setLocation(data.location || '');
      setSelectedCategory(data.category || 'Subject teacher');
      try {
        const parsedWorkExps = JSON.parse(data.workExperiences || '[]');
        if (Array.isArray(parsedWorkExps) && parsedWorkExps.length > 0) {
          setWorkExperiences(parsedWorkExps);
        }
      } catch {}
      
      try {
        setTeachingMode(JSON.parse(data.teachingmode || '["Online"]'));
        const parsedQualifications = JSON.parse(data.qualifications || "[]");
        const qualificationsWithDefaults = Array(4).fill(null).map((_, i) => ({
          subject: '', college: '', year: '', ...parsedQualifications[i]
        }));
        setQualifications(qualificationsWithDefaults);
        
        const parsedTuitions = JSON.parse(data.tutions || "[]");
        const validTuitions = parsedTuitions.filter((t: any) => t.class || t.subject || t.skill || t.timeFrom || t.timeTo || t.board || t.day);
        setTuitionCount(validTuitions.length > 0 ? validTuitions.length : 1);
        const defaultTuitions = Array(3).fill(null).map(() => ({
          class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '', university: '', year: ''
        }));
        parsedTuitions.forEach((savedTuition: any, index: number) => {
          if (index < 3) defaultTuitions[index] = { ...defaultTuitions[index], ...savedTuition, charge: savedTuition.charge || '' };
        });
        setTuitions(defaultTuitions);
      } catch (parseError) {
        console.error("Error parsing stored data:", parseError);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Reviews
  const fetchReviews = useCallback(async () => {
    if (!userEmail || Array.isArray(userEmail)) return;
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const encodedEmail = encodeURIComponent(userEmail);
      const response = await api.get(
        "/review?email=" + encodedEmail
      );
      setReviews(response.data.reviews || []);
      const ratings = response.data.reviews.map((r: any) => Number(r.rating));
      const countByStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => { if (rating >= 1 && rating <= 5) countByStars[rating as keyof typeof countByStars]++; });
      setRatingsCount(countByStars);
    } catch (error: any) {
      console.warn("Failed to fetch reviews:", error?.message || error);
      setReviews([]);
      setRatingsCount({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    } finally {
      setReviewsLoading(false);
    }
  }, [userEmail]);

  // Fetch Education Data
  const fetchEducationData = useCallback(async () => {
    try {
      const res = await api.get("/api/valuesToselect");
      const boards = res.data.find((item: any) => item.id === "Subject teacher")?.boards || [];
      const skills = res.data.find((item: any) => item.id === "Skill teacher")?.skills || [];
      setEducationData(res.data);
      if (boards.length > 0) {
        const defaultBoard = boards[0];
        const defaultClass = defaultBoard.classes?.[0]?.name;
        const defaultSubject = defaultBoard.classes?.[0]?.subjects?.[0]?.name;
      }
      const skillList = skills.map((s: any) => ({ label: s.name, value: s.name }));
      setSkillItems(skillList);
    } catch (error: any) {
      console.warn("Failed to fetch education structure:", error?.message || error);
      setEducationData([]);
      setSkillItems([]);
    }
  }, []);

  // Upload Image to S3
  const uploadImageToS3AndUpdateProfile = useCallback(async (uri: string, email: string, name: string) => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) throw new Error("User not authenticated");
      const filename = `profile_${Date.now()}.jpg`;
      const formData = new FormData();
      
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type });
        formData.append("profileimage", file);
      } else {
        const ext = uri.split(".").pop();
        const mimeType = ext ? `image/${ext}` : "image/jpeg";
        formData.append("profileimage", { uri, name: filename, type: mimeType } as any);
      }
      formData.append("email", email);
      formData.append("name", name);

      const response = await fetch(`${BASE_URL}/api/uploadTeacherimg`, {
        method: "POST",
        body: formData,
        headers: { 'Authorization': `Bearer ${auth.token}`, 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
      const responseData = await response.json();
      if (!responseData.imageUrl) throw new Error("No image URL returned from server");
      setProfileImage(responseData.imageUrl);
      await AsyncStorage.setItem("profileImage", responseData.imageUrl);
      return responseData.imageUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Failed", "Failed to upload profile image. Please try again.");
      return null;
    }
  }, []);

  // Form Validation
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    if (!selectedCategory || selectedCategory === "") newErrors.selectedCategory = "Please select category.";
    if (!introduction.trim()) newErrors.introduction = "Please enter your introduction.";
    if (!qualifications[0]?.subject?.trim()) newErrors.qualification_subject_0 = "Enter subject for qualification";
    if (!qualifications[0]?.college?.trim()) newErrors.qualification_college_0 = "Enter college name for qualification";
    if (!qualifications[0]?.year?.trim()) newErrors.qualification_year_0 = "Enter year for qualification";
    
    // Validate each tuition entry - SubjectCard data
    for (let i = 0; i < tuitionCount; i++) {
      const t = tuitions[i];
      const prefix = "tuition_" + i;
      if (selectedCategory === "Subject teacher") {
        if (!t.board?.trim()) newErrors[prefix + "_board"] = "Select board for tuition " + (i + 1);
        if (!t.subject?.trim()) newErrors[prefix + "_subject"] = "Select subject for tuition " + (i + 1);
        // For Universities, require university/year instead of class
        if (t.board === 'Universities') {
          if (!t.university?.trim()) newErrors[prefix + "_university"] = "Select university for tuition " + (i + 1);
          if (!t.year?.trim()) newErrors[prefix + "_year"] = "Select year for tuition " + (i + 1);
        } else {
          if (!t.class?.trim()) newErrors[prefix + "_class"] = "Select class for tuition " + (i + 1);
        }
      } else if (selectedCategory === "Skill teacher") {
        if (!t.skill?.trim()) newErrors[prefix + "_skill"] = "Select skill for tuition " + (i + 1);
      }
      if (!t.day?.trim()) newErrors[prefix + "_day"] = "Select day for tuition " + (i + 1);
      if (!t.timeFrom?.trim()) newErrors[prefix + "_timeFrom"] = "Select starting time for tuition " + (i + 1);
      if (!t.timeTo?.trim()) newErrors[prefix + "_timeTo"] = "Select ending time for tuition " + (i + 1);
    }
    if (!teachingMode || teachingMode.length === 0) newErrors.teachingMode = "Please select at least one mode of teaching.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedCategory, introduction, qualifications, tuitionCount, tuitions, teachingMode]);

  // Save Profile
  const handleSave = useCallback(async () => {
    console.log('🔘 Save button clicked!');
    console.log('📋 Current tuitions data:', JSON.stringify(tuitions, null, 2));
    console.log('📊 Tuition count:', tuitionCount);
    
    if (!validateForm()) {
      console.log('❌ Validation failed:', errors);
      Alert.alert("Missing Fields", "Please fill in all required fields. Check tuitions and other required fields.");
      return;
    }
    console.log('✅ Validation passed');
    
    setIsSaving(true);
    try {
      const auth = await getAuthData();
      if (!auth) {
        Alert.alert("Error", "User not authenticated. Please log in again.");
        return;
      }
      
      const { email, token } = auth;
      let imageUrl = profileImage;
      
      if (profileImage && (profileImage.startsWith("file://") || profileImage.startsWith("blob:"))) {
        imageUrl = await uploadImageToS3AndUpdateProfile(profileImage, email, teacherName);
      }

      const filteredQualifications = qualifications.filter(q => q.subject || q.college || q.year);
      const cleanedTuitions = tuitions.slice(0, tuitionCount).map((t, idx) => {
        console.log(`📝 Processing tuition ${idx}:`, t);
        if (selectedCategory === "Skill teacher") {
          return { skill: t.skill, timeFrom: t.timeFrom, timeTo: t.timeTo, charge: t.charge || "", day: t.day };
        } else if (t.board === 'Universities') {
          return { university: t.university, year: t.year, subject: t.subject, board: t.board, timeFrom: t.timeFrom, timeTo: t.timeTo, charge: t.charge || "", day: t.day };
        } else {
          return { class: t.class, subject: t.subject, board: t.board, timeFrom: t.timeFrom, timeTo: t.timeTo, charge: t.charge || "", day: t.day };
        }
      });
      console.log('✨ Cleaned tuitions:', JSON.stringify(cleanedTuitions, null, 2));

      const profileData = {
        fullName: teacherName,
        email,
        profilePic: imageUrl,
        introduction,
        qualifications: filteredQualifications,
        category: selectedCategory,
        tuitions: cleanedTuitions,
        teachingMode,
        workExperience,
        university,
      };

      console.log('📤 Sending profile data:', JSON.stringify(profileData, null, 2));

      const response = await api.post("/api/teacherss", profileData);
      console.log('✅ Profile saved response:', response);

      if (!response.success || response.data?.error) {
        throw new Error(response.data?.error || response.data?.message || 'Failed to save profile');
      }

      await AsyncStorage.multiSet([
        ["teacherName", teacherName],
        ["email", email],
        ["profileImage", imageUrl || ""],
        ["introduction", introduction],
        ["workexperience", workExperience],
        ["category", selectedCategory],
        ["teachingmode", JSON.stringify(teachingMode)],
        ["tutions", JSON.stringify(cleanedTuitions)],
        ["qualifications", JSON.stringify(filteredQualifications)],
        ["university", university],
      ]);

      Alert.alert("Success", "Profile saved successfully!");
      setIsEditable(false);
    } catch (error: any) {
      console.error("❌ Error saving profile:", error);
      const errorMessage = error?.message || "Failed to save profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, profileImage, teacherName, qualifications, tuitionCount, tuitions, selectedCategory, introduction, teachingMode, workExperience, university, uploadImageToS3AndUpdateProfile]);

  // --- Specific Components ---

  const EduListItem = ({ label, education, year, striped, iconColor, iconName, iconGlyphColor }: any) => (
    <View style={[styles.eduItem, striped && { backgroundColor: '#F9FAFB' }]}>
      <View style={[styles.eduItemIconCircle, { backgroundColor: iconColor }]}>
        <Ionicons name={iconName} size={14} color={iconGlyphColor} />
      </View>
      <View style={styles.eduItemContent}>
        <Text style={styles.eduItemLabel}>{label}</Text>
        <Text style={styles.eduItemDetail}>{education}</Text>
      </View>
      <Text style={styles.eduItemYear}>{year}</Text>
    </View>
  );

  const WorkExpTile = ({ color, text }: { color: string; text?: string }) => (
    <View style={[styles.expTile, { backgroundColor: color }]}>
      <Text style={styles.expTileText}>{text || 'Add your Work Experience'}</Text>
    </View>
  );

  // Update Qualification
  const updateQualification = useCallback((index: number, field: keyof Qualification, value: string) => {
    setQualifications(prev => {
      const updated = [...prev];
      while (updated.length <= index) updated.push({ subject: '', college: '', year: '' });
      updated[index][field] = value;
      return updated;
    });
  }, []);

  // Update Tuition Field
  const updateTuitionField = useCallback((index: number, key: keyof Tuition, value: string) => {
    setTuitions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }, []);
  
  // Update Work Experience
  const updateWorkExperience = useCallback((index: number, value: string) => {
    setWorkExperiences(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  // Handle Image Picker
  const handleImagePicker = useCallback(() => setImageModalVisible(true), []);
  
  // Crop/Process Image
  const cropImage = useCallback(async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setProfileImage(manipulatedImage.uri);
      setImageModalVisible(false);
    } catch (error) {
      console.error("Image processing error:", error);
      setProfileImage(uri);
      setImageModalVisible(false);
    }
  }, []);
  
  // Handle Camera
  const handleCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera access is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        cropImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  }, [cropImage]);

  // Handle Gallery
  const handleGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Gallery access is required to select photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        cropImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Error", "Failed to open gallery. Please try again.");
    }
  }, [cropImage]);
  
  // Handle Web File Upload (for browser)
  const handleFileUpload = useCallback((event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setImageModalVisible(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle Board Change
  const handleBoardChange = useCallback((index: number, boardName: string) => {
    const updated = [...tuitions];
    updated[index].board = boardName;
    updated[index].subject = "";
    updated[index].class = "";
    setTuitions(updated);
    setSelectedBoard(boardName);
  }, [tuitions]);

  // Animation Hooks
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    translateY.value = withDelay(300, withSpring(0));
  }, []);

  const animatedPageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Effects for Data Loading
  useEffect(() => {
    loadProfileData();
    fetchUserStatus();
    fetchEducationData();
  }, [loadProfileData, fetchUserStatus, fetchEducationData]);

  useEffect(() => {
    if (userEmail) fetchReviews();
  }, [userEmail, fetchReviews]);

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/TeacherDashBoard/Teacher");
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [router]);

  // ESC key handler for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          router.push("/(tabs)/TeacherDashBoard/Teacher");
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [router]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    Platform.OS === 'web' ? (
      <View style={styles.webLayout}>
        <TeacherWebHeader 
          teacherName={teacherName}
          profileImage={profileImage}
          showSearch={true}
        />
        
        <View style={styles.webContent}>
          {!isMobile && (
            <TeacherWebSidebar 
              activeItem={sidebarActiveItem}
              onItemPress={handleSidebarSelect}
              userEmail={userEmail}
              teacherName={teacherName}
              profileImage={profileImage}
              subjectCount={qualifications.length}
              studentCount={0}
              revenue="₹8.5K"
              isSpotlight={false}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          )}
          
          <View style={styles.webMainContent}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.mainScroll} contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}>
              <Animated.View style={[styles.pageContent, animatedPageStyle]}>
                  
                  <View style={[styles.pageHeader, isMobile && styles.pageHeaderMobile]}>
                    <TouchableOpacity style={styles.backBtnCircle} onPress={() => router.push("/(tabs)/TeacherDashBoard/Teacher")}>
                      <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                    </TouchableOpacity>
                    <Text style={[styles.pageTitle, isMobile && styles.pageTitleMobile]}>My Profile</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditable(!isEditable)}>
                      <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primaryBlue} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contentGrid, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.centerColumn, isMobile && { marginRight: 0, minWidth: '100%' }]}>
                      
                      {/* Master Profile Card */}
                      <View style={[styles.profileMasterCard, isMobile && styles.profileMasterCardMobile]}>
                        <View style={[styles.avatarWrap, isMobile && styles.avatarWrapMobile]}>
                           <TouchableOpacity style={styles.avatarDashed} onPress={handleImagePicker}>
                             {profileImage ? (
                               <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                             ) : (
                               <View style={styles.avatarIconCircle}>
                                 <Ionicons name="cloud-upload-outline" size={24} color={COLORS.textMuted} />
                               </View>
                             )}
                           </TouchableOpacity>
                        </View>
                        <View style={[styles.profileMainInfo, isMobile && styles.profileMainInfoMobile]}>
                           <View style={[styles.profileTitleRow, isMobile && styles.profileTitleRowMobile]}>
                              <Text style={[styles.profileNameLarge, isMobile && styles.profileNameLargeMobile]}>{teacherName}</Text>
                           </View>
                           <View style={styles.profileDetailRow}>
                              <MaterialCommunityIcons name="home-city-outline" size={16} color={COLORS.textBody} />
                              {isEditable ? (
                                <TextInput 
                                  style={[styles.profileDetailText, styles.editableInput]} 
                                  value={university}
                                  onChangeText={setUniversity}
                                  placeholder="Recent University"
                                />
                              ) : (
                                <Text style={styles.profileDetailText}>{university || 'Recent University'}</Text>
                              )}
                           </View>
                           <View style={styles.profileDetailRow}>
                              <MaterialCommunityIcons name="office-building" size={16} color={COLORS.textBody} />
                              {isEditable ? (
                                <TextInput 
                                  style={[styles.profileDetailText, styles.editableInput]} 
                                  value={pastUniversity}
                                  onChangeText={setPastUniversity}
                                  placeholder="Past University"
                                />
                              ) : (
                                <Text style={styles.profileDetailText}>{pastUniversity || 'Past University'}</Text>
                              )}
                           </View>
                           <View style={styles.profileDetailRow}>
                              <Ionicons name="location-outline" size={16} color={COLORS.textBody} />
                              {isEditable ? (
                                <TextInput 
                                  style={[styles.profileDetailText, styles.editableInput]} 
                                  value={location}
                                  onChangeText={setLocation}
                                  placeholder="Location"
                                />
                              ) : (
                                <Text style={styles.profileDetailText}>{location || 'Location'}</Text>
                              )}
                           </View>
                        </View>
                      </View>

                      {/* Educational Qualifications - Split Cards */}
                      <View style={[styles.eduCardRow, (isMobile || isTablet) && styles.eduCardRowMobile]}>
                        <View style={[styles.eduBox, (isMobile || isTablet) && styles.eduBoxMobile]}>
                          <View style={styles.eduBoxHeader}>
                            <View style={styles.eduPillTab}>
                              <Text style={styles.eduPillTabText}>Educational Qualification</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
                              <MaterialCommunityIcons name="pencil" size={20} color={COLORS.textHeader} />
                            </TouchableOpacity>
                          </View>
                          <TextInput 
                            style={styles.eduIntroInput} 
                            placeholder="Edit your introduction...." 
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            value={introduction}
                            onChangeText={setIntroduction}
                            editable={isEditable}
                          />
                          <Text style={styles.limitText}>150 words</Text>
                        </View>

                        <View style={styles.eduListBox}>
                          <View style={styles.eduListHeader}>
                            <Text style={styles.eduListTitle}>Educational Qualifications</Text>
                            <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
                              <MaterialCommunityIcons name="pencil" size={14} color={COLORS.primaryBlue} />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.eduListItems}>
                            {qualifications.map((qual, index) => (
                              isEditable ? (
                                <View key={index} style={[styles.eduListItem, index % 2 === 1 && styles.eduListItemStriped]}>
                                  <View style={[styles.eduListItemIcon, { backgroundColor: ['#EEF2FF', '#ECFDF5', '#FFFBEB', '#F5F3FF'][index % 4] }]}>
                                    <MaterialCommunityIcons name={['school', 'book-open-page-variant', 'book', 'pencil'][index % 4]} size={20} color={[COLORS.primaryBlue, COLORS.green, '#F59E0B', '#8B5CF6'][index % 4]} />
                                  </View>
                                  <View style={styles.eduListItemContent}>
                                    <TextInput
                                      style={styles.eduInput}
                                      placeholder="Subject name"
                                      value={qual.subject}
                                      onChangeText={(text) => {
                                        const updated = [...qualifications];
                                        updated[index].subject = text;
                                        setQualifications(updated);
                                      }}
                                    />
                                    <TextInput
                                      style={styles.eduInput}
                                      placeholder="Education"
                                      value={qual.college}
                                      onChangeText={(text) => {
                                        const updated = [...qualifications];
                                        updated[index].college = text;
                                        setQualifications(updated);
                                      }}
                                    />
                                    <TextInput
                                      style={styles.eduInput}
                                      placeholder="Year - Year"
                                      value={qual.year}
                                      onChangeText={(text) => {
                                        const updated = [...qualifications];
                                        updated[index].year = text;
                                        setQualifications(updated);
                                      }}
                                    />
                                  </View>
                                </View>
                              ) : (
                                <EduListItem 
                                  key={index}
                                  label={qual.subject || 'Edit Subject name'} 
                                  education={qual.college || 'Edit Education'} 
                                  year={qual.year || 'year – year'} 
                                  striped={index % 2 === 1} 
                                  iconColor={['#EEF2FF', '#ECFDF5', '#EEF2FF', '#ECFDF5'][index % 4]} 
                                  iconName={['school', 'library', 'school', 'library'][index % 4]} 
                                  iconGlyphColor={[COLORS.primaryBlue, COLORS.green,COLORS.primaryBlue, COLORS.green][index % 4]} 
                                />
                              )
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Teaching Mode Selection */}
                      <View style={styles.modeContainer}>
                        <Text style={styles.modeTitle}>I will teach</Text>
                        <View style={styles.modeOptions}>
                          {["Online", "Face to Face"].map((mode) => {
                            const isSelected = teachingMode.includes(mode);
                            return (
                              <TouchableOpacity
                                key={mode}
                                onPress={() => {
                                  setTeachingMode((prev) =>
                                    isSelected
                                      ? prev.filter((m) => m !== mode)
                                      : [...prev, mode]
                                  );
                                }}
                                style={[
                                  styles.modeButton,
                                  isSelected && styles.selectedModeButton,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.modeText,
                                    isSelected && styles.selectedModeText,
                                  ]}
                                >
                                  {mode}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
{/* Subject Cards Container - Production Ready */}
<View style={[
  styles.subjectCardsWrapper,
  isMobile && styles.subjectCardsWrapperMobile
]}>
  <SubjectCard
    isEditable={isEditable}
    selectedCategory={selectedCategory}
    tuitions={tuitions}
    tuitionCount={tuitionCount}
    CHARGE_OPTIONS={CHARGE_OPTIONS}
    DAYS_OF_WEEK={DAYS_OF_WEEK}
    onTuitionChange={setTuitions}
    onTuitionCountChange={setTuitionCount}
    onTimingChange={(index, day, timeFrom, timeTo) => {
      const updatedTuitions = [...tuitions];
      updatedTuitions[index] = { ...updatedTuitions[index], day, timeFrom, timeTo };
      setTuitions(updatedTuitions);
    }}
    styles={{
      ...styles,
      subjectCard: [
        styles.subjectCard,
        isMobile && styles.subjectCardMobile,
        isTablet && styles.subjectCardTablet
      ],
      subjGrid: [
        styles.subjGrid,
        isMobile && styles.subjGridMobile
      ]
    }}
    COLORS={COLORS}
    isMobile={isMobile}
  />
</View>


                      {/* Save Button */}
                      {isEditable && (
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.saveBtnText}>Save Profile</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Final Warning Notice */}
                      <Text style={styles.footerWarning}>
                         Once you registered you will not be allowed to change the timming for next 1 month
                      </Text>

                    </View>

                    {/* Experience Sidebar (Right Column) */}
                    <View style={[styles.rightSideCol, (isMobile || isTablet) && { width: '100%', marginTop: isMobile ? 30 : 0 }]}>
                      <View style={styles.expRightPanel}>
                         <View style={styles.expHeaderBar}>
                            <Text style={styles.expHeaderTitle}>Experience</Text>
                            <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
                              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primaryBlue} />
                            </TouchableOpacity>
                         </View>
                         <View style={styles.expListContainer}>
                            {isEditable ? (
                              workExperiences.map((exp, index) => (
                                <TextInput
                                  key={index}
                                  style={[styles.expInput, { backgroundColor: ['#FEFCE8', '#F0FDF4', '#F5F3FF', '#FEF2F2', '#FEFCE8'][index % 5] }]}
                                  placeholder="Add your Work Experience"
                                  value={exp}
                                  onChangeText={(text) => {
                                    const updated = [...workExperiences];
                                    updated[index] = text;
                                    setWorkExperiences(updated);
                                  }}
                                />
                              ))
                            ) : (
                              <>
                                {workExperiences.map((exp, index) => (
                                  exp ? (
                                    <WorkExpTile key={index} color={['#FEFCE8', '#F0FDF4', '#F5F3FF', '#FEF2F2', '#FEFCE8'][index % 5]} text={exp} />
                                  ) : (
                                    <WorkExpTile key={index} color={['#FEFCE8', '#F0FDF4', '#F5F3FF', '#FEF2F2', '#FEFCE8'][index % 5]} />
                                  )
                                ))}
                              </>
                            )}
                         </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </ScrollView>
          </View>
        </View>
        
        {/* Image Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={imageModalVisible}
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalContent}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>Choose Profile Picture</Text>
                <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textHeader} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.imageModalOptions}>
                <TouchableOpacity style={styles.imageModalBtn} onPress={handleCamera}>
                  <View style={[styles.imageModalIconCircle, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="camera" size={24} color={COLORS.primaryBlue} />
                  </View>
                  <Text style={styles.imageModalBtnText}>Take Photo</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.imageModalBtn} onPress={handleGallery}>
                  <View style={[styles.imageModalIconCircle, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="images" size={24} color={COLORS.green} />
                  </View>
                  <Text style={styles.imageModalBtnText}>Choose from Gallery</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                
                {Platform.OS === 'web' && (
                  <TouchableOpacity style={styles.imageModalBtn} onPress={() => document.getElementById('web-file-input')?.click()}>
                    <View style={[styles.imageModalIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="cloud-upload" size={24} color="#D97706" />
                    </View>
                    <Text style={styles.imageModalBtnText}>Upload from Computer</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.imageModalBtn, styles.imageModalCancelBtn]} 
                  onPress={() => setImageModalVisible(false)}
                >
                  <Text style={styles.imageModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              
              {/* Hidden file input for web */}
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  id="web-file-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    ) : (
      <View style={styles.container}>
        <Text style={styles.mobileMessage}>Profile management is only available on web platform</Text>
      </View>
    )
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  // Web-specific styles
  webLayout: { flex: 1, flexDirection: 'column' },
  webContent: { flex: 1, flexDirection: 'row' },
  webMainContent: { flex: 1, backgroundColor: '#f8f9fa' },
  
  // Common styles
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mobileMessage: { textAlign: 'center', marginTop: 50, fontSize: 16, color: COLORS.textBody },
  contentLayout: { flex: 1, flexDirection: 'row' },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: wp('2.5%') },
  scrollContentMobile: { padding: wp('4%') },
  
  // Mobile menu
  mobileMenuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginRight: 12, ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } }) },
  pageHeaderMobile: { marginBottom: 20, paddingHorizontal: 0 },
  pageTitleMobile: { fontSize: 24, marginLeft: 12 },
  
  // Mobile profile card
  profileMasterCardMobile: { flexDirection: 'column', padding: 24, alignItems: 'center' },
  avatarWrapMobile: { marginBottom: 16 },
  profileMainInfoMobile: { marginLeft: 0, alignItems: 'center', width: '100%' },
  profileTitleRowMobile: { marginBottom: 12 },
  profileNameLargeMobile: { fontSize: 24, textAlign: 'center' },
  
  // Mobile education cards
  eduCardRowMobile: { flexDirection: 'column' },
  eduBoxMobile: { marginRight: 0, marginBottom: 20 },
  
  // Page Content
  pageContent: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  backBtnCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...Platform.select({ web: { boxShadow: '0px 3px 8px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 } }) },
  editBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginLeft: 'auto', ...Platform.select({ web: { boxShadow: '0px 3px 8px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 } }) },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 38, color: COLORS.textHeader, marginLeft: 20, flex: 1 },
  contentGrid: { flexDirection: 'row', paddingBottom: 60 },
  rightSideCol: { width: 360 },

  // Profile Card
  profileMasterCard: { backgroundColor: COLORS.white, borderRadius: 26, padding: 40, flexDirection: 'row', alignItems: 'center', marginBottom: 35, ...Platform.select({ web: { boxShadow: '0px 5px 15px rgba(0,0,0,0.05)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 6 } }) },
  avatarWrap: { width: 120, height: 120 },
  avatarDashed: { width: 120, height: 120, borderRadius: 60, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.1)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 } }) },
  profileMainInfo: { marginLeft: 40, flex: 1 },
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  profileNameLarge: { fontFamily: 'Poppins_700Bold', fontSize: 34, color: COLORS.textHeader },
  profileEditCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginLeft: 18 },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profileDetailText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textBody, marginLeft: 14, flex: 1 },
  editableInput: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },

  // Edu Section
  eduCardRow: { flexDirection: 'row', marginBottom: 40 },
  eduBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 24, padding: 30, ...Platform.select({ web: { boxShadow: '0px 3px 12px rgba(0,0,0,0.04)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 } }) },
  eduBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  eduPillTab: { backgroundColor: COLORS.primaryBlue, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  eduPillTabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.white },
  eduIntroInput: { backgroundColor: '#F3F4FB', borderRadius: 16, padding: 22, height: 200, fontFamily: 'Poppins_400Regular', fontSize: 15, textAlignVertical: 'top' },
  limitText: { alignSelf: 'flex-end', marginTop: 15, fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textMuted },
  
  eduListBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px 3px 12px rgba(0,0,0,0.04)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 } }) },
  eduListHeader: { backgroundColor: COLORS.primaryBlue, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eduListTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.white },
  eduListEditCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  eduListItems: { flex: 1 },
  eduItem: { flexDirection: 'row', alignItems: 'center', padding: 25 },
  eduItemIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  eduItemContent: { flex: 1 },
  eduItemLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.textHeader },
  eduItemDetail: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody },
  eduItemYear: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.primaryBlue },

  // Right SidePanel
  expRightPanel: { backgroundColor: COLORS.white, borderRadius: 26, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px 6px 18px rgba(0,0,0,0.05)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 8 } }) },
  expHeaderBar: { backgroundColor: COLORS.primaryBlue, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expHeaderTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.white },
  expHeaderEditCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  expListContainer: { padding: 30 },
  expTile: { paddingHorizontal: 22, paddingVertical: 25, borderRadius: 20, marginBottom: 20, justifyContent: 'center' },
  expTileText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.textBody },

  // Tabs
  tabContainer: { marginBottom: 35 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#E0E7FF', borderRadius: 14, padding: 6, width: 340 },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  segItemActive: { backgroundColor: COLORS.green },
  segText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textMuted },
  segTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.white },
  categoryDisplay: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody, marginTop: 10, textAlign: 'center' },

  floatingActionBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.white, alignSelf: 'flex-start', marginLeft: 15, marginBottom: 45, ...Platform.select({ web: { boxShadow: '0px 8px 18px rgba(0,0,0,0.12)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 12 } }) },
  addBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 35, borderStyle: 'solid', borderWidth: 1.5, borderColor: COLORS.textHeader + '30' },
  footerWarning: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.warningRed, textAlign: 'center', width: '100%', paddingHorizontal: 60 },

subjGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  width: '100%',
  marginHorizontal: -8,
},
subjectCard: {
  width: 'calc(33.333% - 16px)',
  margin: 8,
  backgroundColor: COLORS.white,
  borderRadius: 20,
  padding: 16,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  boxSizing: 'border-box',
  minWidth: 280,
  ...Platform.select({
    web: { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    }
  }),
},
subjectCardTablet: {
  width: 'calc(50% - 16px)',
  minWidth: 260,
},
subjectCardMobile: {
  width: '100%',
  marginHorizontal: 0,
  marginVertical: 8,
},
subjectCardsWrapper: {
  width: '100%',
  marginBottom: 35,
},
subjectCardsWrapperMobile: {
  marginBottom: 25,
},
subjGridMobile: {
  flexDirection: 'column',
  marginHorizontal: 0,
},
centerColumn: {
  flex: 1,
  marginRight: 30,
  minWidth: 0,
  width: '100%',
  maxWidth: '100%',
  overflow: 'visible',
},


// Dropdown inputs container - ensure no overflow
dropdownInputs: {
  marginTop: 5,
  marginBottom: 20,
  gap: 10,
  width: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
},

// Dropdown row - prevent overflow
dropdownRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8FAFC',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  width: '100%',
  boxSizing: 'border-box',
  flexWrap: 'wrap',
  gap: 8,
},

// Dropdown wrapper - responsive
dropdownWrapper: {
  flex: 1,
  minWidth: 0, // Critical for preventing overflow
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderWidth: 1,
  borderColor: '#CBD5E1',
  minHeight: 36,
  justifyContent: 'center',
  overflow: 'hidden',
  boxSizing: 'border-box',
},

// Meta row - prevent overflow
subjMetaRow: { 
  flexDirection: 'row', 
  marginBottom: 18,
  gap: 10,
  width: '100%',
  flexWrap: 'wrap',
  boxSizing: 'border-box',
},

metaBox: {
  flex: 1,
  minWidth: 0, // Critical for preventing overflow
  backgroundColor: '#F1F5F9',
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 10,
  boxSizing: 'border-box',
  overflow: 'hidden',
},


  dropdownLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    width: 70,
    fontFamily: 'Poppins_600SemiBold'
  },
  
  dropdownClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  dropdownText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'Poppins_500Medium'
  },
  
  // Saved values display mode
  savedValuesContainer: {
    marginTop: 5,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4
  },
  
  savedLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    width: 60,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  savedValue: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Poppins_600SemiBold',
    flex: 1
  },


  metaBoxActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6'
  },

  metaTextActive: {
    color: '#2563EB'
  },

  saveBtn: { backgroundColor: COLORS.primaryBlue, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start', marginLeft: 15 },
  saveBtnText: { color: COLORS.white, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },

  // Editable qualification styles
  eduListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  eduListItemStriped: {
    backgroundColor: '#F8FAFC',
  },
  eduListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eduListItemContent: {
    flex: 1,
    gap: 6,
  },
  eduInput: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'Poppins_500Medium',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // Teaching mode styles
  modeContainer: {
    margin: 20,
    marginTop: 16,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 12,
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedModeButton: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
  },
  selectedModeText: {
    color: COLORS.white,
  },

  // Experience input styles
  expInput: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'Poppins_500Medium',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 48,
  },

  qualIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  qualInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  qualInputsContainer: { flex: 1, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  qualInput: { flex: 1, minWidth: 120, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', backgroundColor: COLORS.white },
  qualYearInput: { flex: 0.5 },
  yearInputWrapper: { flex: 0.8, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 100 },
  yearInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', backgroundColor: COLORS.white },
  removeQualBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  addQualBtn: { padding: 4 },
  addFirstQualBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primaryBlue, borderRadius: 10, margin: 15 },
  addFirstQualText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.primaryBlue, marginLeft: 8 },
  qualDisplay: { flex: 1 },
  qualSubject: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textHeader },
  qualCollege: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody, marginTop: 2 },
  qualYear: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.primaryBlue, marginTop: 2 },

  // Teacher Thoughts Section
  thoughtsSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: COLORS.textHeader, marginBottom: 16, paddingHorizontal: 8 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 20, width: '100%', maxWidth: 400, maxHeight: '80%', ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.25)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.textHeader },
  modalScroll: { maxHeight: 400 },
  modalItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: COLORS.textBody },
  modalSectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.textHeader, marginTop: 20, marginBottom: 12, paddingHorizontal: 20 },
  daysSelectionContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 8 },
  daySelectionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: COLORS.border },
  daySelectionBtnActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  daySelectionText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.textBody },
  daySelectionTextActive: { color: COLORS.white },
  timeInput: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.border, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textHeader },
  saveTimingBtn: { backgroundColor: COLORS.primaryBlue, marginHorizontal: 20, marginVertical: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveTimingBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.white },
  
  // Empty Qualification State
  emptyQualState: { paddingVertical: 30, alignItems: 'center' },
  emptyQualText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
  
  // Image Modal Styles
  imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  imageModalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 },
  imageModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  imageModalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.textHeader },
  imageModalOptions: { paddingHorizontal: 20, paddingTop: 10 },
  imageModalBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  imageModalIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  imageModalBtnText: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 16, color: COLORS.textHeader },
  imageModalCancelBtn: { justifyContent: 'center', borderBottomWidth: 0, marginTop: 10, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14 },
  imageModalCancelText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.textBody },
});
