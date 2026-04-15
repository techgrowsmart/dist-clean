import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Pressable,
  Platform,
  Keyboard,
  Alert,
  SafeAreaView,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { MaterialCommunityIcons, Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { getAuthToken, getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import { BASE_URL } from '../../../config';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';

// ======================== COLORS ========================
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  primaryBlueLight: '#3B82F6',
  primaryBlueDark: '#1E40AF',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',
  inputBg: '#F9FAFB',
  primary: '#2563EB',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textDark: '#1F2937',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// ======================== HELPERS ========================
const getProfileImageSource = (profilePic?: string) => {
  if (profilePic) {
    if (profilePic.startsWith('http')) return { uri: profilePic };
    if (profilePic.startsWith('file://')) return { uri: profilePic };
    if (!profilePic.startsWith('/')) profilePic = `/${profilePic}`;
    const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    return { uri: `${BASE_URL}/${clean}` };
  }
  return null;
};

const initials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const resolvePostAuthor = (post: any) => {
  if (!post) return { name: 'Unknown Teacher', pic: null, role: 'teacher' };
  let name = post.author?.name || '';
  let pic: string | null = post.author?.profile_pic || null;
  const role = post.author?.role || 'teacher';
  if (!name || name === 'null' || name.includes('@')) {
    name = post.author?.email?.split('@')[0] || 'Unknown Teacher';
    name = name.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
  }
  if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
  if (pic === '' || pic === 'null') pic = null;
  return { name, pic, role };
};

// ======================== SUBJECT CARD COMPONENT ========================
const SubjectCard = ({ subject, onRefresh }: { subject: any; onRefresh: () => void }) => {
  // Handle various API property name formats (snake_case from Cassandra, camelCase from frontend)
  const teachingCategory = subject.teaching_category || subject.teachingCategory || subject.category || 'Subject Teacher';
  const subjectTitle = subject.subject_title || subject.subjectTitle || subject.name || subject.skillName || subject.skill || 'Untitled';
  const className = subject.class_name || subject.className || subject.class || subject.year || '-';
  const classCategory = subject.class_category || subject.classCategory || '';
  const board = subject.board || subject.boardName || '-';
  const university = subject.university || subject.universityName || null;
  const status = subject.status || subject.verificationStatus || 'pending';
  const description = subject.description || '';

  const getStatusStyle = () => {
    switch (status) {
      case 'approved': return styles.approvedBadge;
      case 'pending': return styles.pendingBadge;
      case 'rejected': return styles.rejectedBadge;
      default: return styles.pendingBadge;
    }
  };
  const getStatusText = () => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const isUniversity = university || (board && board.toLowerCase().includes('university'));
  const isSkill = teachingCategory === 'Skill Teacher' || teachingCategory === 'Skill teacher' || subject.type === 'skill';

  // Parse skill category and level from classCategory (format: "Category - Level")
  const skillCategoryStr = String(classCategory || '');
  const skillCatLevel = skillCategoryStr.includes('-') ? skillCategoryStr.split('-').map((s: string) => s.trim()) : [skillCategoryStr, ''];

  return (
    <View style={styles.subjectCard}>
      <View style={styles.subjectCardContent}>
        <Image source={require('../../../assets/image/medium.jpeg')} style={styles.subjectCardImage} />
        <View style={styles.subjectCardDetails}>
          {!isSkill ? (
            <>
              <Text style={styles.subjectCardText}>
                <Text style={styles.subjectBold}>Subject:</Text> {subjectTitle}
              </Text>
              <Text style={styles.subjectCardText}>
                <Text style={styles.subjectBold}>{isUniversity ? 'Year:' : 'Class:'}</Text> {className}
              </Text>
              <Text style={styles.subjectCardText}>
                <Text style={styles.subjectBold}>{isUniversity ? 'University:' : 'Board:'}</Text>{' '}
                {university || board}
              </Text>
              {description && (
                <Text style={[styles.subjectCardText, styles.subjectDescription]}>
                  <Text style={styles.subjectBold}>Description:</Text> {description}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.subjectCardText}>
                <Text style={styles.subjectBold}>Category:</Text> Skill
              </Text>
              <Text style={styles.subjectCardText}>
                <Text style={styles.subjectBold}>Skill:</Text> {subjectTitle}
              </Text>
              {classCategory && (
                <>
                  <Text style={styles.subjectCardText}>
                    <Text style={styles.subjectBold}>Type:</Text> {skillCatLevel[0] || '-'}
                  </Text>
                  <Text style={styles.subjectCardText}>
                    <Text style={styles.subjectBold}>Level:</Text> {skillCatLevel[1] || '-'}
                  </Text>
                </>
              )}
              {description && (
                <Text style={[styles.subjectCardText, styles.subjectDescription]}>
                  <Text style={styles.subjectBold}>Description:</Text> {description}
                </Text>
              )}
            </>
          )}
          <View style={[styles.subjectStatusBadge, getStatusStyle()]}>
            <Text style={styles.subjectStatusText}>{getStatusText()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ======================== MAIN COMPONENT ========================
const CreateSubject = () => {
  const router = useRouter();
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // ---------- Tab state ----------
  const [activeTab, setActiveTab] = useState<'subject' | 'skill'>('subject');

  // ---------- Subject form state ----------
  const [subjectTitle, setSubjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [webClassCategory, setWebClassCategory] = useState(''); // optional "Junior/Senior/Professional"
  
  // ---------- Skill form state ----------
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [skillLevel, setSkillLevel] = useState('');

  // ---------- Dynamic dropdown data (from API) ----------
  const [boardsList, setBoardsList] = useState<{ id: string; name: string }[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);
  const [universitiesList, setUniversitiesList] = useState<{ id: string; name: string }[]>([]);
  const [yearsList, setYearsList] = useState<{ id: string; name: string }[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // ---------- Dropdown UI visibility ----------
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showClassCategoryDropdown, setShowClassCategoryDropdown] = useState(false);
  const [showSkillCategoryDropdown, setShowSkillCategoryDropdown] = useState(false);
  const [showSkillLevelDropdown, setShowSkillLevelDropdown] = useState(false);

  // ---------- Subjects list state ----------
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsRefreshing, setSubjectsRefreshing] = useState(false);

  // ---------- Other state ----------
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // ---------- Fetch boards from API ----------
  const fetchBoards = async () => {
    try {
      setLoadingBoards(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        console.error('No authentication token found');
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/allboards`,
        { category: 'Subject teacher' },
        { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('📊 allboards response:', response.data);
      if (response.data?.boards) {
        const boardsData = response.data.boards;
        console.log('📋 Boards received:', boardsData.length, boardsData);

        // Transform backend format {boardId, boardName} to frontend format {id, name}
        let boards = boardsData.map((b: any) => ({
          id: b.boardId || b.id,
          name: b.boardName || b.name
        })).filter((b: any) => b.id && b.name); // Filter out any invalid entries

        // Add University option if universities data exists
        if (response.data.universities && response.data.universities.length > 0) {
          const hasUniversity = boards.some((b: any) => b.name?.toLowerCase().includes('university'));
          if (!hasUniversity) {
            boards.push({ id: 'board_universities', name: 'Universities' });
          }
        }

        console.log('📋 Transformed boards:', boards);
        setBoardsList(boards);
      } else {
        console.warn('⚠️ No boards in response:', response.data);
        setBoardsList([]);
      }
    } catch (error: any) {
      console.error('Error fetching boards:', error.response?.data || error.message);
    } finally {
      setLoadingBoards(false);
    }
  };

  // ---------- Fetch years based on selected university ----------
  const fetchYears = async (universityId: string) => {
    if (!universityId) return;
    try {
      setLoadingClasses(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        console.error('No authentication token found');
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/universities/${universityId}/years`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('📅 Years response:', response.data);
      if (response.data?.years) {
        // Transform backend format {yearId, yearName} to frontend format {id, name}
        const transformedYears = response.data.years.map((y: any) => ({
          id: y.yearId || y.id,
          name: y.yearName || y.name
        })).filter((y: any) => y.id && y.name);
        console.log('📋 Transformed years:', transformedYears);
        setYearsList(transformedYears);
      }
    } catch (error: any) {
      console.error('Error fetching years:', error.response?.data || error.message);
    } finally {
      setLoadingClasses(false);
    }
  };

  // ---------- Fetch classes based on selected board ----------
  const fetchClasses = async (boardId: string) => {
    if (!boardId) return;
    try {
      setLoadingClasses(true);
      const auth = await getAuthData();
      if (!auth?.token) {
        console.error('No authentication token found');
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/board`,
        { boardId },
        { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('📚 Classes response:', response.data);
      
      // Create hardcoded year and class options
      const hardcodedOptions = [
        ...Array.from({ length: 6 }, (_, i) => ({ id: `year_${i + 1}`, name: `Year ${i + 1}` })),
        ...Array.from({ length: 7 }, (_, i) => ({ id: `class_${i + 6}`, name: `Class ${i + 6}` }))
      ];
      
      if (response.data?.classes) {
        // Transform backend format {classId, className} to frontend format {id, name}
        const transformedClasses = response.data.classes.map((c: any) => ({
          id: c.classId || c.id,
          name: c.className || c.name
        })).filter((c: any) => c.id && c.name);
        console.log('📋 Transformed classes:', transformedClasses);
        // Combine hardcoded options with API classes
        setClassesList([...hardcodedOptions, ...transformedClasses]);
      } else {
        // If API fails, still show hardcoded options
        setClassesList(hardcodedOptions);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error.response?.data || error.message);
      // On error, show hardcoded options
      const hardcodedOptions = [
        ...Array.from({ length: 6 }, (_, i) => ({ id: `year_${i + 1}`, name: `Year ${i + 1}` })),
        ...Array.from({ length: 7 }, (_, i) => ({ id: `class_${i + 6}`, name: `Class ${i + 6}` }))
      ];
      setClassesList(hardcodedOptions);
    } finally {
      setLoadingClasses(false);
    }
  };

  // ---------- Fetch universities for University board ----------
  const fetchUniversities = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) {
        console.error('No authentication token found');
        return;
      }
      const response = await axios.post(
        `${BASE_URL}/api/universities`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' } }
      );
      console.log('🏫 Universities response:', response.data);
      if (response.data) {
        // Handle both array format and {universities: [...]} format
        const universitiesData = Array.isArray(response.data) ? response.data : response.data.universities || [];
        // Transform backend format {universityId, universityName} to frontend format {id, name}
        const transformedUniversities = universitiesData.map((u: any) => ({
          id: u.universityId || u.id,
          name: u.universityName || u.name
        })).filter((u: any) => u.id && u.name);
        console.log('📋 Transformed universities:', transformedUniversities);
        setUniversitiesList(transformedUniversities);
      }
    } catch (error: any) {
      console.error('Error fetching universities:', error.response?.data || error.message);
    }
  };

  // ---------- Fetch my subjects (for the list below) ----------
  const fetchMySubjects = async (token: string, email: string) => {
    try {
      setSubjectsLoading(true);
      if (!email) {
        console.error('Missing email for fetchMySubjects');
        return;
      }
      console.log('📤 Fetching subjects for email:', email);
      const response = await axios.get(`${BASE_URL}/api/teacher-subjects?email=${email}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      console.log('📚 Teacher subjects response:', response.data);
      console.log('📚 Response status:', response.status);
      // Handle various response formats
      let subjects = [];
      if (response.data?.subjects && Array.isArray(response.data.subjects)) {
        subjects = response.data.subjects;
      } else if (response.data?.data?.subjects && Array.isArray(response.data.data.subjects)) {
        subjects = response.data.data.subjects;
      } else if (Array.isArray(response.data)) {
        subjects = response.data;
      } else {
        console.log('📚 Response data structure:', JSON.stringify(response.data, null, 2));
      }
      console.log('📋 Parsed subjects:', subjects.length, subjects);
      setMySubjects(subjects);
    } catch (error: any) {
      console.error('Error fetching my subjects:', error.response?.data || error.message);
      console.error('Error details:', error);
      setMySubjects([]);
    } finally {
      setSubjectsLoading(false);
      setSubjectsRefreshing(false);
    }
  };

  // ---------- Load teacher data & fetch boards & subjects ----------
  useEffect(() => {
    const loadData = async () => {
      try {
        const auth = await getAuthData();
        if (!auth?.token) {
          console.error('No authentication token found');
          return;
        }

        setAuthToken(auth.token);
        if (auth?.name) setTeacherName(auth.name);
        if (auth?.profileImage) setProfileImage(auth.profileImage);
        if (auth?.email) setUserEmail(auth.email);

        await fetchBoards();
        if (auth.token && auth?.email) {
          await fetchMySubjects(auth.token, auth.email);
        }
      } catch (error: any) {
        console.error('Error loading initial data:', error.response?.data || error.message);
      }
    };
    loadData();
  }, []);

  // When board changes, fetch classes or universities
  useEffect(() => {
    if (selectedBoard) {
      if (selectedBoard.toLowerCase().includes('university')) {
        // For University selection, fetch universities
        fetchUniversities();
        setClassesList([]);
        setYearsList([]);
      } else {
        // For regular boards, fetch classes
        const boardObj = boardsList.find(b => b.name === selectedBoard);
        if (boardObj) fetchClasses(boardObj.id);
        setYearsList([]);
      }
    } else {
      setClassesList([]);
      setUniversitiesList([]);
      setYearsList([]);
      setSelectedUniversity('');
      setSelectedYear('');
    }
  }, [selectedBoard, boardsList]);

  // When university changes, fetch years
  useEffect(() => {
    if (selectedUniversity && selectedBoard.toLowerCase().includes('university')) {
      const universityObj = universitiesList.find(u => u.name === selectedUniversity);
      if (universityObj) {
        fetchYears(universityObj.id);
      }
    } else {
      setYearsList([]);
      setSelectedYear('');
    }
  }, [selectedUniversity, universitiesList, selectedBoard]);

  // ---------- Dismiss keyboard & close all dropdowns ----------
  const handleBackPress = useCallback(() => router.push('/(tabs)/TeacherDashBoard/Teacher'), [router]);

  // Keyboard escape handler for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [handleBackPress]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setShowBoardDropdown(false);
    setShowClassDropdown(false);
    setShowUniversityDropdown(false);
    setShowYearDropdown(false);
    setShowClassCategoryDropdown(false);
    setShowSkillCategoryDropdown(false);
    setShowSkillLevelDropdown(false);
  };

  // ---------- FormField component with dropdown ----------
  const FormField = ({ label, placeholder, isDropdown, half, multiline, value, onChangeText, maxLength, items, selectedItem, setSelectedItem, showDropdown, setShowDropdown, loading }: any) => {
    const [localShow, setLocalShow] = useState(false);
    const [localSelected, setLocalSelected] = useState('');
    const [fieldLayout, setFieldLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const fieldRef = useRef<View>(null);
    const dropdownShow = showDropdown !== undefined ? showDropdown : localShow;
    const dropdownSetShow = setShowDropdown !== undefined ? setShowDropdown : setLocalShow;
    const dropdownSelected = selectedItem !== undefined ? selectedItem : localSelected;
    const dropdownSetSelected = setSelectedItem !== undefined ? setSelectedItem : setLocalSelected;

    const handleDropdownPress = () => {
      if (isDropdown) {
        // Measure field position for web dropdown positioning
        if (fieldRef.current) {
          fieldRef.current.measure((x, y, width, height, pageX, pageY) => {
            setFieldLayout({ x: pageX, y: pageY, width, height });
          });
        }
        dropdownSetShow(!dropdownShow);
      }
    };

    const handleSelect = (item: string) => {
      dropdownSetSelected(item);
      dropdownSetShow(false);
    };

    return (
      <View ref={fieldRef} style={[styles.fieldContainer, half && styles.halfField]}>
        <Text style={styles.label}>{label}</Text>
        {isDropdown ? (
          <TouchableOpacity
            style={[styles.inputWrapper, styles.modernDropdownInput, loading && styles.loadingInput]}
            onPress={handleDropdownPress}
            activeOpacity={0.7}
            disabled={loading}
          >
            <View style={styles.dropdownContent}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.primaryBlue} />
              ) : (
                <Text style={[styles.inputText, !dropdownSelected && styles.modernPlaceholderText]}>
                  {dropdownSelected || placeholder}
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={loading ? COLORS.textLight : COLORS.textMuted} style={{ transform: [{ rotate: dropdownShow ? '180deg' : '0deg' }] }} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.inputWrapper, multiline && styles.multilineInputWrapper]}>
            <TextInput
              style={[styles.inputText, { flex: 1, height: multiline ? 120 : 52, paddingTop: multiline ? 12 : 0 }]}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              multiline={multiline}
              value={value}
              onChangeText={onChangeText}
              maxLength={maxLength}
              textAlignVertical={multiline ? 'top' : 'center'}
              onFocus={() => {
                // Close any open dropdowns when focusing a text input
                setShowBoardDropdown(false);
                setShowClassDropdown(false);
                setShowUniversityDropdown(false);
                setShowYearDropdown(false);
                setShowClassCategoryDropdown(false);
                setShowSkillCategoryDropdown(false);
                setShowSkillLevelDropdown(false);
              }}
            />
          </View>
        )}
        
        {/* Mobile dropdown - absolute positioned */}
        {dropdownShow && items && Platform.OS !== 'web' && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {items.map((item: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownOption}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Web dropdown - using Modal for proper layering */}
        {dropdownShow && items && Platform.OS === 'web' && (
          <Modal
            transparent={true}
            animationType="none"
            visible={dropdownShow}
            onRequestClose={() => dropdownSetShow(false)}
          >
            <TouchableOpacity
              style={styles.webDropdownOverlay}
              activeOpacity={1}
              onPress={() => dropdownSetShow(false)}
            >
              <View style={[styles.webDropdownMenu, { top: fieldLayout.y + fieldLayout.height + 5, left: fieldLayout.x, width: fieldLayout.width || (half ? '48%' : '100%') }]}>
                <ScrollView style={{ maxHeight: 250 }}>
                  {items.map((item: string, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.webDropdownOption}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    );
  };

  // ---------- InfoCard component ----------
  const InfoCard = ({ icon, title, desc }: any) => (
    <TouchableOpacity style={styles.infoCard} activeOpacity={0.9}>
      <View style={styles.infoIconBox}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.primaryBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );

  // ---------- TabSwitcher ----------
  const TabSwitcher = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'subject' && styles.activeTab]}
        onPress={() => {
          if (activeTab !== 'subject') {
            setActiveTab('subject');
            // Reset form fields when switching tabs
            setSelectedBoard('');
            setSelectedClass('');
            setSelectedUniversity('');
            setSelectedYear('');
            setSubjectTitle('');
            setDescription('');
          }
        }}
      >
        <Text style={[styles.tabText, activeTab === 'subject' && styles.activeTabText]}>Create New Subject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'skill' && styles.activeTab]}
        onPress={() => {
          if (activeTab !== 'skill') {
            setActiveTab('skill');
            setSkillName('');
            setSkillDescription('');
            setSkillCategory('');
            setSkillLevel('');
          }
        }}
      >
        <Text style={[styles.tabText, activeTab === 'skill' && styles.activeTabText]}>Create New Skill Subject</Text>
      </TouchableOpacity>
    </View>
  );

  // ---------- Form Header ----------
  const FormHeader = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.mainTitle}>
        {activeTab === 'subject' ? 'Create New Subject' : 'Create New Skill Subject'}
      </Text>
      <Text style={styles.subtext}>
        {activeTab === 'subject'
          ? 'Configure the curriculum details for your new teaching module.'
          : 'Define the parameters for your new skill-based learning program.'}
      </Text>
    </View>
  );

  // ---------- Handle subject creation ----------
  const handleSubmit = async () => {
    if (loading) return; // Prevent duplicate submissions
    if (!authToken || !userEmail) {
      Alert.alert('Authentication Error', 'Please login again');
      return;
    }

    if (activeTab === 'subject') {
      if (!selectedBoard) {
        Alert.alert('Required Field', 'Please select an Education Board');
        return;
      }
      // For University, check both university and program
      if (selectedBoard.toLowerCase().includes('university')) {
        if (!selectedUniversity) {
          Alert.alert('Required Field', 'Please select a University');
          return;
        }
        if (!selectedYear) {
          Alert.alert('Required Field', 'Please select a Year');
          return;
        }
      } else {
        if (!selectedClass) {
          Alert.alert('Required Field', 'Please select a Class');
          return;
        }
      }
      if (!subjectTitle.trim()) {
        Alert.alert('Required Field', 'Subject title is required');
        return;
      }
      if (!description.trim()) {
        Alert.alert('Required Field', 'Description is required');
        return;
      }
    } else {
      if (!skillCategory) {
        Alert.alert('Required Field', 'Skill category is required');
        return;
      }
      if (!skillLevel) {
        Alert.alert('Required Field', 'Skill level is required');
        return;
      }
      if (!skillName.trim()) {
        Alert.alert('Required Field', 'Skill name is required');
        return;
      }
      if (!skillDescription.trim()) {
        Alert.alert('Required Field', 'Skill description is required');
        return;
      }
    }

    setLoading(true);
    try {
      const isUniversity = selectedBoard.toLowerCase().includes('university');
      // Backend uses same /createSubject endpoint for both subjects and skills
      const requestData =
        activeTab === 'subject'
          ? {
              teachingCategory: 'Subject Teacher',
              subjectTitle: subjectTitle.trim(),
              description: description.trim(),
              className: isUniversity ? selectedYear : selectedClass,
              board: isUniversity ? `${selectedUniversity} - ${selectedBoard}` : selectedBoard,
            }
          : {
              teachingCategory: 'Skill Teacher',
              subjectTitle: skillName.trim(), // Backend expects subjectTitle for skill name
              description: skillDescription.trim(),
              className: 'Skill', // Backend expects 'Skill' for className
              classCategory: `${skillCategory} - ${skillLevel}`, // Store category and level
              board: 'Not Applicable',
            };

      const endpoint = `${BASE_URL}/api/createSubject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh the subjects list immediately after successful creation
        if (userEmail && authToken) fetchMySubjects(authToken, userEmail);
        
        Alert.alert('Success', `${activeTab === 'subject' ? 'Subject' : 'Skill subject'} created successfully! Awaiting verification.`, [
          { text: 'OK', onPress: () => {
            // Reset form after user acknowledges
            if (activeTab === 'subject') {
              setSubjectTitle('');
              setDescription('');
              setSelectedBoard('');
              setSelectedClass('');
              setSelectedUniversity('');
              setSelectedYear('');
            } else {
              setSkillName('');
              setSkillDescription('');
              setSkillCategory('');
              setSkillLevel('');
            }
          } },
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

  // ---------- Refresh subjects list (pull-to-refresh) ----------
  const onRefreshSubjects = () => {
    if (authToken && userEmail) {
      setSubjectsRefreshing(true);
      fetchMySubjects(authToken, userEmail);
    }
  };

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  // ---------- RENDER (Web Layout) ----------
  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === 'web' ? (
        <View style={styles.webLayout}>
          <TeacherWebHeader teacherName={teacherName} profileImage={profileImage} showSearch={true} />
          <View style={styles.webContent}>
            <TeacherWebSidebar activeItem="Create Subject" userEmail={userEmail} teacherName={teacherName} profileImage={profileImage} />
            <View style={styles.webMainContent}>
              <KeyboardAvoidingView behavior="height" style={styles.webKeyboardAvoid}>
                <Pressable onPress={dismissKeyboard} style={styles.webFormContainer}>
                    <ScrollView
                      style={styles.mainScroll}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                      refreshControl={
                        <RefreshControl refreshing={subjectsRefreshing} onRefresh={onRefreshSubjects} />
                      }
                    >
                      <View style={styles.pageHeader}>
                        <TouchableOpacity style={styles.backBtnCircle} onPress={handleBackPress}>
                          <Ionicons name="arrow-back" size={20} color={COLORS.textHeader} />
                        </TouchableOpacity>
                        <Text style={styles.pageTitle}>Create Subject</Text>
                      </View>
                      <View style={styles.dualColumns}>
                        {/* Center Form Section */}
                        <View style={styles.mainFeed}>
                          <FormHeader />
                          <TabSwitcher />

                          <View style={styles.formContainer}>
                            {activeTab === 'subject' ? (
                              // ----- Subject Teacher Form -----
                              <>
                                {/* Removed Teaching Category dropdown – determined by tab */}
                                <View style={[styles.formRow, { marginBottom: 10 }]}>
                                  <FormField
                                    label="Select Education Board *"
                                    placeholder={loadingBoards ? "Loading boards..." : "Select board"}
                                    isDropdown
                                    half
                                    items={boardsList.map((b: any) => b.name || b.boardName || '').filter(Boolean)}
                                    selectedItem={selectedBoard}
                                    setSelectedItem={(val: string) => {
                                      setSelectedBoard(val);
                                      setSelectedClass('');
                                      setSelectedUniversity('');
                                    }}
                                    showDropdown={showBoardDropdown}
                                    setShowDropdown={setShowBoardDropdown}
                                    loading={loadingBoards}
                                  />
                                  {selectedBoard.toLowerCase().includes('university') ? (
                                    <FormField
                                      label="Select University *"
                                      placeholder={loadingClasses ? "Loading..." : "Select university"}
                                      isDropdown
                                      half
                                      items={universitiesList.map((u: any) => u.name || u.universityName || '').filter(Boolean)}
                                      selectedItem={selectedUniversity}
                                      setSelectedItem={setSelectedUniversity}
                                      showDropdown={showUniversityDropdown}
                                      setShowDropdown={setShowUniversityDropdown}
                                      loading={loadingClasses}
                                    />
                                  ) : (
                                    <FormField
                                      label="Which Class? *"
                                      placeholder={loadingClasses ? "Loading..." : "Select class"}
                                      isDropdown
                                      half
                                      items={classesList.map((c: any) => c.name || c.className || '').filter(Boolean)}
                                      selectedItem={selectedClass}
                                      setSelectedItem={setSelectedClass}
                                      showDropdown={showClassDropdown}
                                      setShowDropdown={setShowClassDropdown}
                                      loading={loadingClasses}
                                    />
                                  )}
                                </View>
                                {selectedBoard.toLowerCase().includes('university') && selectedUniversity && (
                                  <View style={[styles.formRow, { marginBottom: 10 }]}>
                                    <FormField
                                      label="Select Year *"
                                      placeholder={loadingClasses ? "Loading..." : "Select year"}
                                      isDropdown
                                      half
                                      items={yearsList.map((y: any) => y.name || y.yearName || '').filter(Boolean)}
                                      selectedItem={selectedYear}
                                      setSelectedItem={setSelectedYear}
                                      showDropdown={showYearDropdown}
                                      setShowDropdown={setShowYearDropdown}
                                      loading={loadingClasses}
                                    />
                                  </View>
                                )}

                                <View style={{ marginTop: 10 }}>
                                  <FormField
                                    label="Subject Title *"
                                    placeholder="e.g. Advanced Astrophysics and Space Mechanics"
                                    value={subjectTitle}
                                    onChangeText={setSubjectTitle}
                                  />
                                  <FormField
                                    label="Subject Description *"
                                    placeholder="Provide a detailed overview of the learning outcomes and syllabus coverage..."
                                    multiline
                                    value={description}
                                    onChangeText={setDescription}
                                    maxLength={500}
                                  />
                                </View>
                              </>
                            ) : (
                              // ----- Skill Teacher Form -----
                              <>
                                <View style={styles.formRow}>
                                  <FormField
                                    label="Skill Category *"
                                    placeholder="Select skill category"
                                    isDropdown
                                    half
                                    items={['Programming', 'Design', 'Marketing', 'Business', 'Music', 'Art', 'Language', 'Sports', 'Other']}
                                    selectedItem={skillCategory}
                                    setSelectedItem={setSkillCategory}
                                    showDropdown={showSkillCategoryDropdown}
                                    setShowDropdown={setShowSkillCategoryDropdown}
                                  />
                                  <FormField
                                    label="Skill Level *"
                                    placeholder="Select level"
                                    isDropdown
                                    half
                                    items={['Beginner', 'Intermediate', 'Advanced', 'Expert']}
                                    selectedItem={skillLevel}
                                    setSelectedItem={setSkillLevel}
                                    showDropdown={showSkillLevelDropdown}
                                    setShowDropdown={setShowSkillLevelDropdown}
                                  />
                                </View>
                                <View style={{ marginTop: 10 }}>
                                  <FormField
                                    label="Skill Name *"
                                    placeholder="e.g. Web Development, Graphic Design"
                                    value={skillName}
                                    onChangeText={setSkillName}
                                  />
                                  <FormField
                                    label="Skill Description *"
                                    placeholder="Provide a detailed overview of what students will learn..."
                                    multiline
                                    value={skillDescription}
                                    onChangeText={setSkillDescription}
                                    maxLength={500}
                                  />
                                </View>
                              </>
                            )}

                            <View style={styles.formFooter}>
                              <Text style={styles.footerNote}>
                                All fields marked with <Text style={{ color: COLORS.primaryBlue }}>*</Text> are required
                              </Text>
                              <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit} disabled={loading}>
                                {loading ? (
                                  <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
                                ) : (
                                  <FontAwesome5 name="rocket" size={14} color="white" style={{ marginRight: 10 }} />
                                )}
                                <Text style={styles.publishBtnText}>Request Publish</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Bottom Info Cards */}
                          <View style={styles.infoCardsRow}>
                            <InfoCard
                              icon="shield-check-outline"
                              title="Quality Assurance"
                              desc="Our editorial board reviews all subject content to ensure it meets our high academic standards."
                            />
                            <InfoCard
                              icon="eye-outline"
                              title="Visibility Note"
                              desc="Once published, this subject will be visible to thousands of students looking for specialized tutoring."
                            />
                          </View>

                          {/* ========== NEW: MY SUBJECTS SECTION ========== */}
                          <View style={styles.mySubjectsSection}>
                            <View style={styles.mySubjectsHeader}>
                              <Text style={styles.mySubjectsTitle}>📚 My Subjects</Text>
                              <TouchableOpacity onPress={onRefreshSubjects} style={styles.refreshButton}>
                                <Ionicons name="refresh-outline" size={20} color={COLORS.primaryBlue} />
                              </TouchableOpacity>
                            </View>
                            {subjectsLoading && !subjectsRefreshing ? (
                              <ActivityIndicator size="large" color={COLORS.primaryBlue} style={{ marginVertical: 20 }} />
                            ) : mySubjects.length === 0 ? (
                              <View style={styles.emptySubjects}>
                                <Text style={styles.emptySubjectsText}>No subjects created yet.</Text>
                                <Text style={styles.emptySubjectsSubtext}>Create your first subject using the form above.</Text>
                              </View>
                            ) : (
                              mySubjects.map(subject => (
                                <SubjectCard key={subject.subject_id || subject.subjectId || subject.id} subject={subject} onRefresh={onRefreshSubjects} />
                              ))
                            )}
                          </View>
                        </View>
                      </View>
                    </ScrollView>
                </Pressable>
              </KeyboardAvoidingView>
            </View>
          </View>
        </View>
      ) : (
        // Mobile layout (simplified, but you can mirror the same changes)
        <View style={styles.container}>
          <Text style={{ padding: 20 }}>Mobile version – please update similarly</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CreateSubject;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background, marginTop: Platform.OS === 'web' ? 0 : 30 },
  container: { flex: 1, backgroundColor: COLORS.background },
  innerContainer: { flex: 1 },
  webLayout: { flex: 1, flexDirection: 'column' },
  webContent: { flex: 1, flexDirection: 'row' },
  webMainContent: { flex: 1, flexDirection: 'column' },
  webKeyboardAvoid: { flex: 1 },
  webFormContainer: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 30 },
  dualColumns: { flexDirection: 'row', justifyContent: 'space-between' },
  mainFeed: { flex: 1, marginRight: 30, position: 'relative', zIndex: 1, overflow: 'visible' },
  rightPanel: { width: Platform.OS === 'web' ? 'clamp(280px, 25%, 360px)' : 320, minWidth: 280, maxWidth: 400, backgroundColor: COLORS.background, borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 20, paddingHorizontal: 12 },
  thoughtsContainer: { flex: 1 },
  thoughtsTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primaryBlue, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: COLORS.primaryBlue },
  tabText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textMuted },
  activeTabText: { color: COLORS.white },
  titleContainer: { marginBottom: 35 },
  mainTitle: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: COLORS.textHeader, marginBottom: 8 },
  subtext: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: COLORS.textBody, letterSpacing: 0.2 },
  formContainer: { backgroundColor: COLORS.white, borderRadius: 16, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 5, marginBottom: 30, overflow: 'visible' },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1, position: 'relative', overflow: 'visible' },
  fieldContainer: { marginBottom: 25, flex: 1, position: 'relative' },
  halfField: { width: '48%', position: 'relative' },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textHeader, marginBottom: 8 },
  inputWrapper: { height: 52, backgroundColor: COLORS.inputBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  multilineInputWrapper: { height: 'auto', alignItems: 'flex-start', paddingTop: 12, paddingBottom: 12 },
  modernDropdownInput: { justifyContent: 'space-between' },
  loadingInput: { opacity: 0.7 },
  dropdownContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  inputText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textHeader },
  modernPlaceholderText: { color: COLORS.textMuted },
  dropdownMenu: { position: 'absolute', top: 58, left: 0, right: 0, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 9999, zIndex: 9999 },
  dropdownOption: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody },
  webDropdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  webDropdownMenu: { position: 'absolute', backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.15, shadowRadius: 25, elevation: 10000, zIndex: 10000, maxHeight: 300 },
  webDropdownOption: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  formFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 30, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerNote: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.textBody, backgroundColor: '#F3F4FB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, flex: 0.8 },
  publishBtn: { backgroundColor: COLORS.primaryBlue, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, shadowColor: COLORS.primaryBlue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  publishBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: COLORS.white },
  infoCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  infoCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 16, padding: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 3 },
  infoIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  infoTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.textHeader, marginBottom: 10 },
  infoDesc: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.textBody, lineHeight: 18 },

  // ===== My Subjects Section Styles (added) =====
  mySubjectsSection: {
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  mySubjectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  mySubjectsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: COLORS.primaryBlue,
  },
  refreshButton: { padding: 8 },
  subjectCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectCardContent: { flexDirection: 'row', alignItems: 'center' },
  subjectCardImage: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
  subjectCardDetails: { flex: 1 },
  subjectCardText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textBody, marginBottom: 4 },
  subjectDescription: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 16 },
  subjectBold: { fontFamily: 'Poppins_600SemiBold', color: COLORS.textHeader },
  subjectStatusBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20, marginTop: 8 },
  approvedBadge: { backgroundColor: '#71d561' },
  pendingBadge: { backgroundColor: '#ffa726' },
  rejectedBadge: { backgroundColor: '#ef5350' },
  subjectStatusText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: '#fff' },
  emptySubjects: { alignItems: 'center', paddingVertical: 30 },
  emptySubjectsText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: COLORS.textMuted },
  emptySubjectsSubtext: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textLight, marginTop: 6 },

  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: COLORS.textHeader, flex: 1, letterSpacing: -0.5 },
  backBtnCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },

  // Legacy / mobile styles (keep if needed)
  header: { flexDirection: 'row', alignItems: 'center', padding: wp('4%'), backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: wp('4.5%'), color: COLORS.text, marginLeft: wp('3%') },
  iconWrapper: { padding: wp('2%') },
  content: { padding: wp('4%'), paddingBottom: wp('8%') },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 0, borderRadius: wp('2%'), borderTopLeftRadius: 0, borderTopRightRadius: 0, zIndex: 1000, maxHeight: hp('30%') },
  dropdownItem: { padding: wp('3%'), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownText: { fontFamily: 'Poppins_400Regular', fontSize: wp('3.5%'), color: COLORS.text },
  field: { marginBottom: hp('2%') },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: wp('2%'), padding: wp('3%'), fontFamily: 'Poppins_400Regular', fontSize: wp('3.5%'), color: COLORS.text, backgroundColor: COLORS.surface },
  textArea: { height: hp('12%'), textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, padding: wp('4%'), borderRadius: wp('2%'), alignItems: 'center', marginTop: hp('2%') },
  submitText: { fontFamily: 'Poppins_600SemiBold', fontSize: wp('4%'), color: '#FFFFFF' },
  postCard: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  postAuthor: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textDark },
  postTime: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textSecondary },
  postContent: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#4B5563', lineHeight: 20, marginBottom: 15 },
  postGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  gridImg: { width: '48%', height: 180, borderRadius: 12 },
  postGridMini: { flexWrap: 'wrap' },
  gridImgSmall: { width: '31%', height: 100, borderRadius: 8, marginBottom: 8 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15, justifyContent: 'space-between' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 },
  actionCount: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, color: COLORS.textSecondary, marginLeft: 6 },
  postInputArea: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, marginRight: 15 },
  thoughtsInput: { flex: 1, height: 45, fontFamily: 'Poppins_400Regular', fontSize: 13, marginLeft: 10 },
  thoughtsPostBtn: { backgroundColor: COLORS.primaryBlue, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  thoughtsPostBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: COLORS.white },
  rightPanelTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: COLORS.primaryBlue, marginBottom: 24, textAlign: 'right' },
  thoughtsList: { paddingBottom: 40 },
  thoughtsLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});