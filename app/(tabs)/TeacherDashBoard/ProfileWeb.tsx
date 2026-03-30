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
  Platform,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons, Ionicons, FontAwesome5, Octicons, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import { UXButton, UXCard, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';

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
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Sidebar and Navigation
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Profile');
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Form Data
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [workExperience, setWorkExperience] = useState('');
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
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '' },
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '' },
    { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '' },
  ]);
  const [tuitionCount, setTuitionCount] = useState(1);

  // Dropdown Data
  const [educationData, setEducationData] = useState<EducationData[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subject, setSubject] = useState<any[]>([]);
  const [skillItems, setSkillItems] = useState([]);
  const [boardItems, setBoardItems] = useState([]);
  const [classItems, setClassItems] = useState([]);
  const [subjectItems, setSubjectItems] = useState([]);
  const [subjectClassItems, setSubjectClassItems] = useState([]);

  // Modal States
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const [selectedTimingIndex, setSelectedTimingIndex] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [tempDay, setTempDay] = useState('');
  const [tempTimeFrom, setTempTimeFrom] = useState('');
  const [tempTimeTo, setTempTimeTo] = useState('');

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

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (response.data) {
        const profilePic = response.data.profileimage || response.data.profilePic || response.data.profilepic || response.data.profile_image;
        const userName = response.data.name || response.data.userName || response.data.fullname || response.data.displayName;
        const profileData = { name: userName || 'Unknown User', profilePic: profilePic || '' };
        setUserProfileCache(prev => new Map(prev.set(email, profileData)));
        return profileData;
      }
    } catch {}
    return { name: 'Unknown User', profilePic: '' };
  };

  // Fetch posts function (same as TutorDashboardWeb)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.data.success) {
        // Get unique emails from all posts and fetch their profiles
        const uniqueEmails = [...new Set(res.data.data.map((p: any) => p.author?.email as string).filter((email: string) => Boolean(email)))];
        await Promise.all(uniqueEmails.map((email: string) => fetchUserProfile(token, email)));
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
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
      const response = await axios.post(
        `${BASE_URL}/api/posts/create`,
        {
          content: content.trim(),
          tags: '' // Backend expects comma-separated string, not array
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        // Refresh posts to include the new one
        if (authToken) {
          await fetchPosts(authToken);
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create post. Please try again.');
    }
  };

  const isMobile = windowWidth < 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1200;

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
      const response = await axios.post(`${BASE_URL}/api/userProfile`, { email: auth.email }, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
      });
      if (response.data?.status) setUserStatus(response.data.status);
    } catch (error: any) {
      console.error("Error fetching user status:", error?.response?.status || error?.message);
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
        const response = await axios.post(`${BASE_URL}/api/teacherProfile`, { email }, { headers });
        if (response.status === 200 && response.data) {
          const profileData = response.data;
          setIsExistingProfile(true);
          setTeacherName(profileData.name || '');
          setUserEmail(profileData.email || '');
          setProfileImage(profileData.profileimage || profileData.profilePic || null);
          setIntroduction(profileData.introduction || '');
          setWorkExperience(profileData.workExperience || '');
          setUniversity(profileData.university || '');
          setSelectedCategory(profileData.category || 'Subject teacher');
          setTeachingMode(Array.isArray(profileData.teachingMode) ? profileData.teachingMode : ['Online']);
          
          const qualificationsData = Array.isArray(profileData.qualifications) ? profileData.qualifications : [];
          const qualificationsWithDefaults = Array(4).fill(null).map((_, i) => ({
            subject: '', college: '', year: '', ...qualificationsData[i]
          }));
          setQualifications(qualificationsWithDefaults);
          
          const tuitionsData = Array.isArray(profileData.tuitions) ? profileData.tuitions : [];
          setTuitionCount(tuitionsData.length > 0 ? tuitionsData.length : 1);
          const defaultTuitions = Array(3).fill(null).map(() => ({
            class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: ''
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
        "category", "teachingmode", "tutions", "qualifications", "university"
      ]);
      const data = Object.fromEntries(storedData);
      setIsExistingProfile(true);
      setTeacherName(data.teacherName || '');
      setUserEmail(data.email || '');
      setProfileImage(data.profileImage || null);
      setIntroduction(data.introduction || '');
      setWorkExperience(data.workexperience || '');
      setUniversity(data.university || '');
      setSelectedCategory(data.category || 'Subject teacher');
      
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
          class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: ''
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
      const response = await axios.get(`${BASE_URL}/review?email=${encodedEmail}`, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
      });
      setReviews(response.data.reviews || []);
      const ratings = response.data.reviews.map((r: any) => Number(r.rating));
      const countByStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => { if (rating >= 1 && rating <= 5) countByStars[rating as keyof typeof countByStars]++; });
      setRatingsCount(countByStars);
    } catch (error: any) {
      console.error("Failed to fetch reviews:", error?.response?.status || error?.message);
    } finally {
      setReviewsLoading(false);
    }
  }, [userEmail]);

  // Fetch Education Data
  const fetchEducationData = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/valuesToselect`);
      const boards = response.data.find((item: any) => item.id === "Subject teacher")?.boards || [];
      const skills = response.data.find((item: any) => item.id === "Skill teacher")?.skills || [];
      setEducationData(response.data);
      if (boards.length > 0) {
        const defaultBoard = boards[0];
        const defaultClass = defaultBoard.classes?.[0]?.name;
        const defaultSubject = defaultBoard.classes?.[0]?.subjects?.[0]?.name;
      }
      const skillList = skills.map((s: any) => ({ label: s.name, value: s.name }));
      setSkillItems(skillList);
    } catch (error) {
      console.error("Failed to fetch education structure:", error);
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
    if (selectedCategory === "Subject teacher") {
      if (!selectedBoard) newErrors.selectedBoard = "Please select the board.";
      if (!selectedClass) newErrors.selectedClass = "Please select the class.";
      if (!selectedSubject) newErrors.selectedSubject = "Please select the subject.";
    }
    if (selectedCategory === "Skill teacher") {
      if (!selectedSkill) newErrors.selectedSkill = "Please select the skill.";
    }
    if (!introduction.trim()) newErrors.introduction = "Please enter your introduction.";
    if (!qualifications[0]?.subject?.trim()) newErrors.qualification_subject_0 = "Enter subject for qualification";
    if (!qualifications[0]?.college?.trim()) newErrors.qualification_college_0 = "Enter college name for qualification";
    if (!qualifications[0]?.year?.trim()) newErrors.qualification_year_0 = "Enter year for qualification";
    
    for (let i = 0; i < tuitionCount; i++) {
      const t = tuitions[i];
      const prefix = "tuition_" + i;
      if (selectedCategory === "Subject teacher") {
        if (!t.board?.trim()) newErrors[prefix + "_board"] = "Select board for tuition " + (i + 1);
        if (!t.subject?.trim()) newErrors[prefix + "_subject"] = "Select subject for tuition " + (i + 1);
        if (!t.class?.trim()) newErrors[prefix + "_class"] = "Select class for tuition " + (i + 1);
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
  }, [selectedCategory, selectedBoard, selectedClass, selectedSubject, selectedSkill, introduction, qualifications, tuitionCount, tuitions, teachingMode]);

  // Save Profile
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    
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

      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const filteredQualifications = qualifications.filter(q => q.subject || q.college || q.year);
      const cleanedTuitions = tuitions.slice(0, tuitionCount).map(t => {
        if (selectedCategory === "Skill teacher") {
          return { skill: t.skill, timeFrom: t.timeFrom, timeTo: t.timeTo, charge: t.charge || "", day: t.day };
        } else {
          return { class: t.class, subject: t.subject, board: t.board, timeFrom: t.timeFrom, timeTo: t.timeTo, charge: t.charge || "", day: t.day };
        }
      });

      await axios.post(`${BASE_URL}/api/teacherss`, {
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
      }, { headers });

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
      console.error("Error saving profile:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, profileImage, teacherName, qualifications, tuitionCount, tuitions, selectedCategory, introduction, teachingMode, workExperience, university, uploadImageToS3AndUpdateProfile]);

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

  // Add Tuition
  const addTuition = useCallback(() => {
    setTuitionCount(prev => prev + 1);
    setTuitions(prev => [...prev, { class: '', subject: '', timeFrom: '', timeTo: '', charge: '', day: '', board: '', skill: '' }]);
  }, []);

  // Delete Tuition
  const deleteTuition = useCallback((index: number) => {
    if (tuitionCount > 1) {
      setTuitions(prev => prev.filter((_, i) => i !== index));
      setTuitionCount(prev => prev - 1);
    }
  }, [tuitionCount]);

  // Handle Image Picker
  const handleImagePicker = useCallback(() => setImageModalVisible(true), []);
  
  // Handle Camera/Gallery
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

  // Validate Time Range
  const validateTimeRange = useCallback(() => {
    if (!tempTimeFrom || !tempTimeTo) return true;
    const fromTime = moment(tempTimeFrom, "HH:mm");
    const toTime = moment(tempTimeTo, "HH:mm");
    return toTime.isAfter(fromTime);
  }, [tempTimeFrom, tempTimeTo]);

  // Handle Board Change
  const handleBoardChange = useCallback((index: number, boardName: string) => {
    const updated = [...tuitions];
    updated[index].board = boardName;
    updated[index].subject = "";
    updated[index].class = "";
    setTuitions(updated);
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
    if (!selectedBoard || educationData.length === 0) return;
    const selectedBoardData = educationData.find((b) => b.name === selectedBoard);
    if (selectedBoardData) {
      const classes = selectedBoardData.classes?.map((c: any) => ({ label: c.name, value: c.name })) || [];
      setClassItems(classes);
    }
  }, [selectedBoard, educationData]);

  useEffect(() => {
    if (!selectedBoard || !selectedClass) return;
    const boardData = educationData.find((b) => b.name === selectedBoard);
    const classData = boardData?.classes?.find((c: any) => c.name === selectedClass);
    if (classData) {
      const subjects = classData.subjects?.map((s: any) => ({ label: s.name, value: s.name })) || [];
      setSubjectItems(subjects);
    }
  }, [selectedBoard, selectedClass, educationData]);

  useEffect(() => {
    if (timingModalVisible && selectedTimingIndex !== null) {
      const currentTuition = tuitions[selectedTimingIndex];
      if (currentTuition?.day) {
        const daysArray = currentTuition.day.split(',').map(day => day.trim());
        setSelectedDays(daysArray);
      } else {
        setSelectedDays([]);
      }
      setTempTimeFrom(currentTuition?.timeFrom || "");
      setTempTimeTo(currentTuition?.timeTo || "");
    }
  }, [timingModalVisible, selectedTimingIndex, tuitions]);

  useEffect(() => {
    const backAction = () => {
      router.push("/(tabs)/TeacherDashBoard/Teacher");
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [router]);

  const renderSubjectCard = (title: string, t1: string, t2: string, p: string, d: string[], icon: any) => (
    <View style={styles.subjectCard}>
       <View style={styles.subjCardHeader}>
          <View style={styles.subjIconBox}>
             <FontAwesome5 name={icon} size={14} color="#D97706" />
          </View>
          <Text style={styles.subjTitle}>{title}</Text>
          <View style={styles.subjActions}>
             <TouchableOpacity><MaterialCommunityIcons name="trash-can" size={20} color={COLORS.warningRed} /></TouchableOpacity>
             <TouchableOpacity style={{ marginLeft: 8 }}><MaterialCommunityIcons name="pencil" size={18} color={COLORS.textHeader} /></TouchableOpacity>
          </View>
       </View>

       <View style={styles.subjMetaRow}>
          <View style={styles.metaBox}><Text style={styles.metaText}>{t1}</Text></View>
          <View style={styles.metaBox}><Text style={styles.metaText}>{t2}</Text></View>
          <View style={[styles.metaBox, { backgroundColor: COLORS.priceBg }]}><Text style={styles.metaText}>{p}</Text></View>
       </View>

       <View style={styles.daysRow}>
          {d.map((day: string) => (
             <View key={day} style={styles.dayPill}>
                <Text style={styles.dayText}>{day}</Text>
             </View>
          ))}
       </View>

       <View style={styles.teachModeRow}>
          <Text style={styles.teachModeLabel}>I will Teach</Text>
          <View style={styles.modeBtns}>
             <TouchableOpacity style={styles.modeBtnGreen}><Text style={styles.modeBtnText}>Online</Text></TouchableOpacity>
             <TouchableOpacity style={styles.modeBtnPink}><Text style={styles.modeBtnText}>Face to Face</Text></TouchableOpacity>
          </View>
       </View>
    </View>
  );

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
          />
          
          <View style={styles.webMainContent}>
            <TeacherThoughtsBackground>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.mainScroll} contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.pageContent, animatedPageStyle]}>
                  
                  <View style={styles.pageHeader}>
                    <TouchableOpacity style={styles.backBtnCircle} onPress={() => router.push("/(tabs)/TeacherDashBoard/Teacher")}>
                      <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>My Profile</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditable(!isEditable)}>
                      <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primaryBlue} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contentGrid, isMobile && { flexDirection: 'column' }]}>
                    <View style={[styles.centerColumn, isMobile && { marginRight: 0, minWidth: '100%' }]}>
                      
                      {/* Master Profile Card */}
                      <View style={styles.profileMasterCard}>
                        <View style={styles.avatarWrap}>
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
                        <View style={styles.profileMainInfo}>
                           <View style={styles.profileTitleRow}>
                              <Text style={styles.profileNameLarge}>{teacherName}</Text>
                              {isEditable && (
                                <TouchableOpacity style={styles.profileEditCircle}>
                                   <MaterialCommunityIcons name="pencil" size={14} color={COLORS.textHeader} />
                                </TouchableOpacity>
                              )}
                           </View>
                           <View style={styles.profileDetailRow}>
                              <MaterialCommunityIcons name="home-city-outline" size={16} color={COLORS.textBody} />
                              <TextInput 
                                style={[styles.profileDetailText, isEditable && styles.editableInput]} 
                                value={university}
                                onChangeText={setUniversity}
                                editable={isEditable}
                                placeholder="Recent University"
                              />
                           </View>
                           <View style={styles.profileDetailRow}>
                              <MaterialCommunityIcons name="office-building" size={16} color={COLORS.textBody} />
                              <Text style={styles.profileDetailText}>Past University</Text>
                           </View>
                           <View style={styles.profileDetailRow}>
                              <Ionicons name="location-outline" size={16} color={COLORS.textBody} />
                              <Text style={styles.profileDetailText}>Location</Text>
                           </View>
                        </View>
                      </View>

                      {/* Educational Qualifications - Split Cards */}
                      <View style={[styles.eduCardRow, isTablet && { flexDirection: 'column' }]}>
                         <View style={[styles.eduBox, { marginRight: isTablet ? 0 : 20, marginBottom: isTablet ? 20 : 0 }]}>
                            <View style={styles.eduBoxHeader}>
                               <View style={styles.eduPillTab}><Text style={styles.eduPillTabText}>Educational Qualification</Text></View>
                               {isEditable && (
                                 <TouchableOpacity onPress={() => {}}>
                                   <MaterialCommunityIcons name="pencil" size={20} color={COLORS.textHeader} />
                                 </TouchableOpacity>
                               )}
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
                               <Text style={styles.eduListTitle}>Educational Qualification</Text>
                               {isEditable && (
                                 <TouchableOpacity style={styles.eduListEditCircle}>
                                   <MaterialCommunityIcons name="pencil" size={14} color={COLORS.primaryBlue} />
                                 </TouchableOpacity>
                               )}
                            </View>
                            <View style={styles.eduListItems}>
                               {qualifications.slice(0, 4).map((qual, index) => (
                                 <EduListItem 
                                   key={index}
                                   label={qual.subject || `Edit Subject name`} 
                                   education={qual.college || `Edit Education`} 
                                   year={qual.year || `year – year`} 
                                   striped={index % 2 === 1} 
                                   iconColor="#EEF2FF" 
                                   iconName="school" 
                                   iconGlyphColor={COLORS.primaryBlue} 
                                 />
                               ))}
                            </View>
                         </View>
                      </View>

                      {/* Category Selection Tab */}
                      <View style={styles.tabContainer}>
                         <View style={styles.segmentedControl}>
                            <TouchableOpacity 
                              style={[styles.segItem, selectedCategory === 'Category' && styles.segItemActive]} 
                              onPress={() => isEditable && setSelectedCategory('Category')}
                            >
                              <Text style={[styles.segText, selectedCategory === 'Category' && styles.segTextActive]}>Category</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.segItem, selectedCategory === 'Subject teacher' && styles.segItemActive]} 
                              onPress={() => isEditable && setSelectedCategory('Subject teacher')}
                            >
                              <Text style={[styles.segText, selectedCategory === 'Subject teacher' && styles.segTextActive]}>Subject Teacher</Text>
                            </TouchableOpacity>
                         </View>
                      </View>

                      {/* Subject Grid */}
                      <View style={[styles.subjGrid, isMobile && { flexDirection: 'column' }]}>
                         {tuitions.slice(0, tuitionCount).map((tuition, index) => (
                           <View key={index} style={styles.subjectCard}>
                             <View style={styles.subjCardHeader}>
                               <View style={styles.subjIconBox}>
                                 <FontAwesome5 name="book" size={14} color="#D97706" />
                               </View>
                               <Text style={styles.subjTitle}>
                                 {tuition.subject && tuition.class ? `${tuition.subject} – ${tuition.class}` : `Subject ${index + 1}`}
                               </Text>
                               <View style={styles.subjActions}>
                                 {isEditable && (
                                   <TouchableOpacity onPress={() => deleteTuition(index)}>
                                     <MaterialCommunityIcons name="trash-can" size={20} color={COLORS.warningRed} />
                                   </TouchableOpacity>
                                 )}
                                 {isEditable && (
                                   <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => {}}>
                                     <MaterialCommunityIcons name="pencil" size={18} color={COLORS.textHeader} />
                                   </TouchableOpacity>
                                 )}
                               </View>
                             </View>
                             
                             {/* Dropdown Inputs */}
                             {isEditable && (
                               <View style={styles.dropdownInputs}>
                                 {selectedCategory === "Subject teacher" && (
                                   <>
                                     <View style={styles.dropdownRow}>
                                       <Text style={styles.dropdownLabel}>Board:</Text>
                                       <View style={styles.dropdownWrapper}>
                                         <Text style={styles.dropdownText}>{tuition.board || 'Select Board'}</Text>
                                       </View>
                                     </View>
                                     <View style={styles.dropdownRow}>
                                       <Text style={styles.dropdownLabel}>Class:</Text>
                                       <View style={styles.dropdownWrapper}>
                                         <Text style={styles.dropdownText}>{tuition.class || 'Select Class'}</Text>
                                       </View>
                                     </View>
                                     <View style={styles.dropdownRow}>
                                       <Text style={styles.dropdownLabel}>Subject:</Text>
                                       <View style={styles.dropdownWrapper}>
                                         <Text style={styles.dropdownText}>{tuition.subject || 'Select Subject'}</Text>
                                       </View>
                                     </View>
                                   </>
                                 )}
                                 {selectedCategory === "Skill teacher" && (
                                   <View style={styles.dropdownRow}>
                                     <Text style={styles.dropdownLabel}>Skill:</Text>
                                     <View style={styles.dropdownWrapper}>
                                       <Text style={styles.dropdownText}>{tuition.skill || 'Select Skill'}</Text>
                                     </View>
                                   </View>
                                 )}
                               </View>
                             )}
                             <View style={styles.subjMetaRow}>
                               <View style={styles.metaBox}>
                                 <Text style={styles.metaText}>{tuition.timeFrom || 'Start Time'}</Text>
                               </View>
                               <View style={styles.metaBox}>
                                 <Text style={styles.metaText}>{tuition.timeTo || 'End Time'}</Text>
                               </View>
                               <View style={[styles.metaBox, { backgroundColor: COLORS.priceBg }]}>
                                 <Text style={styles.metaText}>{tuition.charge || 'Price'}</Text>
                               </View>
                             </View>
                             <View style={styles.daysRow}>
                               {(tuition.day ? tuition.day.split(',').map(d => d.trim()) : []).map((day: string, i: number) => (
                                 <View key={i} style={styles.dayPill}>
                                   <Text style={styles.dayText}>{day}</Text>
                                 </View>
                               ))}
                             </View>
                             <View style={styles.teachModeRow}>
                               <Text style={styles.teachModeLabel}>I will Teach</Text>
                               <View style={styles.modeBtns}>
                                 <TouchableOpacity style={[styles.modeBtnGreen, teachingMode.includes('Online') && styles.modeBtnSelected]}>
                                   <Text style={styles.modeBtnText}>Online</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity style={[styles.modeBtnPink, teachingMode.includes('Face to Face') && styles.modeBtnSelected]}>
                                   <Text style={styles.modeBtnText}>Face to Face</Text>
                                 </TouchableOpacity>
                               </View>
                             </View>
                           </View>
                         ))}
                      </View>

                      {/* Add Action Button */}
                      {isEditable && (
                        <TouchableOpacity style={styles.floatingActionBtn} onPress={addTuition}>
                           <View style={styles.addBtnInner}>
                              <Ionicons name="add" size={32} color={COLORS.textHeader} />
                           </View>
                        </TouchableOpacity>
                      )}

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
                         Once you registered you will not be allowed to change the timing for next 1 month
                      </Text>

                    </View>

                    {/* Experience Sidebar (Right Column) */}
                    <View style={[styles.rightSideCol, (isMobile || isTablet) && { width: '100%', marginTop: isMobile ? 30 : 0 }]}>
                      <View style={styles.expRightPanel}>
                         <View style={styles.expHeaderBar}>
                            <Text style={styles.expHeaderTitle}>Experience</Text>
                            {isEditable && (
                              <TouchableOpacity style={styles.expHeaderEditCircle}>
                                 <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primaryBlue} />
                              </TouchableOpacity>
                            )}
                         </View>
                         <View style={styles.expListContainer}>
                            <WorkExpTile color="#FEFCE8" />
                            <WorkExpTile color="#F0FDF4" />
                            <WorkExpTile color="#F5F3FF" />
                            <WorkExpTile color="#FEF2F2" />
                            <WorkExpTile color="#FEFCE8" />
                         </View>
                      </View>
                    </View>
                  </View>

                  {/* Teacher Thoughts Section */}
                  <View style={styles.thoughtsSection}>
                    <Text style={styles.sectionTitle}>Teacher Thoughts</Text>
                    
                    {/* Teacher Post Composer */}
                    <TeacherPostComposer
                      onCreatePost={handleCreatePost}
                      placeholder="Share your teaching thoughts..."
                    />
                    
                    {/* Posts Feed */}
                    {postsLoading && posts.length === 0 && (
                      <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
                    )}
                    {!postsLoading && posts.length === 0 && (
                      <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                        <Text style={{ fontSize: 16, color: COLORS.textMuted, fontFamily: 'Poppins_400Regular' }}>
                          No thoughts yet. Be the first to share!
                        </Text>
                      </View>
                    )}
                    {posts.map((post: any) => (
                      <TeacherThoughtsCard
                        key={post.id}
                        post={post}
                        userProfileCache={userProfileCache}
                        onLike={(postId: string) => {
                          setPosts(posts.map(p => 
                            p.id === postId 
                              ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked }
                              : p
                          ));
                        }}
                        onComment={(post) => {
                          // Handle comment logic
                        }}
                        onReport={(post) => {
                          // Handle report logic
                        }}
                        getProfileImageSource={getProfileImageSource}
                        initials={initials}
                        resolvePostAuthor={resolvePostAuthor}
                      />
                    ))}
                  </View>

                </Animated.View>
              </ScrollView>
            </TeacherThoughtsBackground>
          </View>
        </View>
      </View>
    ) : (
      <View style={styles.container}>
        <Text style={styles.mobileMessage}>Profile management is only available on web platform</Text>
      </View>
    )
  );
}

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

const WorkExpTile = ({ color }: { color: string }) => (
  <View style={[styles.expTile, { backgroundColor: color }]}>
     <Text style={styles.expTileText}>Add your Work Experience</Text>
  </View>
);

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
  
  // Page Content
  pageContent: { flex: 1 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  backBtnCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  editBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginLeft: 'auto' },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 38, color: COLORS.textHeader, marginLeft: 20, flex: 1 },
  contentGrid: { flexDirection: 'row', paddingBottom: 60 },
  centerColumn: { flex: 2, marginRight: 30 },
  rightSideCol: { width: 360 },

  // Profile Card
  profileMasterCard: { backgroundColor: COLORS.white, borderRadius: 26, padding: 40, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 6, marginBottom: 35 },
  avatarWrap: { width: 120, height: 120 },
  avatarDashed: { width: 120, height: 120, borderRadius: 60, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarIconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  profileMainInfo: { marginLeft: 40, flex: 1 },
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  profileNameLarge: { fontFamily: 'Poppins_700Bold', fontSize: 34, color: COLORS.textHeader },
  profileEditCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginLeft: 18 },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profileDetailText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textBody, marginLeft: 14, flex: 1 },
  editableInput: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  // Dropdown styles
  dropdownInputs: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownLabel: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '500',
    width: 60,
    fontFamily: 'Poppins_500Medium',
  },
  dropdownWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 32,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 13,
    color: COLORS.textBody,
    fontFamily: 'Poppins_400Regular',
  },

  // Edu Section
  eduCardRow: { flexDirection: 'row', marginBottom: 40 },
  eduBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 24, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  eduBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  eduPillTab: { backgroundColor: COLORS.primaryBlue, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  eduPillTabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.white },
  eduIntroInput: { backgroundColor: '#F3F4FB', borderRadius: 16, padding: 22, height: 200, fontFamily: 'Poppins_400Regular', fontSize: 15, textAlignVertical: 'top' },
  limitText: { alignSelf: 'flex-end', marginTop: 15, fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textMuted },
  
  eduListBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
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

  // Tabs
  tabContainer: { marginBottom: 35 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#E0E7FF', borderRadius: 14, padding: 6, width: 340 },
  segItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  segItemActive: { backgroundColor: COLORS.green },
  segText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textMuted },
  segTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.white },

  // Subjects
  subjGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -15, marginBottom: 30 },
  subjectCard: { width: Platform.OS === 'web' ? '47%' : '95%', backgroundColor: COLORS.white, borderRadius: 28, padding: 30, margin: 15, borderWidth: 1, borderColor: '#C6E3FF', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 6 },
  subjCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  subjIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  subjTitle: { flex: 1, fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.textHeader, marginLeft: 18 },
  subjActions: { flexDirection: 'row', alignItems: 'center' },
  subjMetaRow: { flexDirection: 'row', marginBottom: 25 },
  metaBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginRight: 15 },
  metaText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textHeader },
  daysRow: { flexDirection: 'row', marginBottom: 30, flexWrap: 'wrap' },
  dayPill: { backgroundColor: COLORS.softGreen, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginRight: 12, marginBottom: 8 },
  dayText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: COLORS.green },
  teachModeRow: { borderTopWidth: 1.5, borderTopColor: '#F3F4F6', paddingTop: 25 },
  teachModeLabel: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: COLORS.textHeader, marginBottom: 18 },
  modeBtns: { flexDirection: 'row' },
  modeBtnGreen: { flex: 1, backgroundColor: COLORS.softGreen, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginRight: 15 },
  modeBtnPink: { flex: 1, backgroundColor: COLORS.softPink, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modeBtnSelected: { borderWidth: 2, borderColor: COLORS.primaryBlue },
  modeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.textHeader },

  floatingActionBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.white, alignSelf: 'flex-start', marginLeft: 15, marginBottom: 45, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 12 },
  addBtnInner: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 35, borderStyle: 'solid', borderWidth: 1.5, borderColor: COLORS.textHeader + '30' },
  saveBtn: { backgroundColor: COLORS.primaryBlue, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start', marginLeft: 15 },
  saveBtnText: { color: COLORS.white, fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  footerWarning: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.warningRed, textAlign: 'center', width: '100%', paddingHorizontal: 60 },

  // Right SidePanel
  expRightPanel: { backgroundColor: COLORS.white, borderRadius: 26, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 8 },
  expHeaderBar: { backgroundColor: COLORS.primaryBlue, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expHeaderTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: COLORS.white },
  expHeaderEditCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  expListContainer: { padding: 30 },
  expTile: { paddingHorizontal: 22, paddingVertical: 25, borderRadius: 20, marginBottom: 20, justifyContent: 'center' },
  expTileText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: COLORS.textBody },

  // Teacher Thoughts Section
  thoughtsSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: COLORS.textHeader, marginBottom: 16, paddingHorizontal: 8 },
});
