import React, { useEffect, useState } from 'react';
import {  
  Platform,
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
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  SafeAreaView,
} from 'react-native';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import {   MaterialCommunityIcons, Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import {   getAuthToken, getAuthData } from '../../../utils/authStorage';
import axios from 'axios';
import {   BASE_URL } from '../../../config';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import TeacherThoughtsCard, { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';

// Enhanced responsive state and helper functions
const getResponsiveValues = (width: number) => {
  const isSmallMobile = width < 480;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const getFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.9;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  const getSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.8;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  const getDimension = (mobile: number, tablet: number, desktop: number) => {
    if (isSmallMobile) return mobile * 0.85;
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  return {
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    getFontSize,
    getSpacing,
    getDimension
  };
};

// FormField Component
const FormField = ({ label, placeholder, isDropdown, half, multiline, value, onChangeText, maxLength, items }: any) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');

  return (
    <View style={[
      styles.fieldContainer, 
      half && { width: '48%' },
      isDropdown && showDropdown && { zIndex: 9999 }
    ]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {maxLength && (
          <Text style={styles.charCounter}>{value?.length || 0}/ {maxLength} CHARACTERS</Text>
        )}
      </View>
      
      <View style={{ position: 'relative' }}>
        <TouchableOpacity 
          activeOpacity={isDropdown ? 0.7 : 1}
          onPress={() => isDropdown && setShowDropdown(!showDropdown)}
          style={[
            styles.inputWrapper, 
            multiline && { height: 160, alignItems: 'flex-start', paddingVertical: 15 },
            showDropdown && styles.inputWrapperActive
          ]}
        >
          {isDropdown ? (
            <>
              <Text style={[styles.inputText, !selectedItem && { color: COLORS.textMuted }]}>
                {selectedItem || placeholder}
              </Text>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textBody} />
            </>
          ) : (
            <TextInput 
              style={[styles.inputText, { flex: 1, height: '100%' }]}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              multiline={multiline}
              value={value}
              onChangeText={onChangeText}
              maxLength={maxLength}
              textAlignVertical={multiline ? 'top' : 'center'}
            />
          )}
        </TouchableOpacity>

        {showDropdown && items && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {items.map((item: string, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.dropdownOption}
                  onPress={() => { setSelectedItem(item); setShowDropdown(false); }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

// InfoCard Component
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

const { width, height } = Dimensions.get("window");

// Modern Color Scheme (from CreateSubjectScreen)
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
  // Add missing properties for compatibility
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

const EDUCATION_BOARDS = [
  'CBSE (Central Board of Secondary Education)',
  'ICSE (Indian Certificate of Secondary Education)',
  'ISC',
  'NIOS (National Institute of Open Schooling)',
  'IB (International Baccalaureate)',
  'Cambridge (IGCSE)',
  'WBCHSE / WBBSE (West Bengal)',
  'Maharashtra State Board (MSBSHSE)',
  'Tamil Nadu State Board',
  'Karnataka State Board',
  'Andhra Pradesh Board',
  'Telangana Board',
  'Kerala State Board',
  'Gujarat State Board (GSEB)',
  'Rajasthan Board (RBSE)',
  'UP Board (UPMSP)',
  'Bihar Board (BSEB)',
  'MP Board (MPBSE)',
  'Haryana Board (HBSE)',
  'Punjab Board (PSEB)',
  'Odisha Board (BSE Odisha)',
  'Assam Board (SEBA/AHSEC)',
  'Jharkhand Board (JAC)',
  'Chhattisgarh Board (CGBSE)',
  'Himachal Pradesh Board (HPBOSE)',
  'Uttarakhand Board (UBSE)',
  'Goa Board (GBSHSE)',
  'Tripura Board (TBSE)',
  'Meghalaya Board (MBOSE)',
  'Manipur Board (BSEM/COHSEM)',
  'Nagaland Board (NBSE)',
  'Mizoram Board (MBSE)',
  'Arunachal Pradesh Board',
];

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

// Helper functions for teacher posts (same as TutorDashboardWeb)
const getProfileImageSource = (profilePic?: string) => {
  if (profilePic) {
    // Handle different image path formats
    if (profilePic.startsWith('http')) {
      return { uri: profilePic };
    }
    if (profilePic.startsWith('file://')) {
      return { uri: profilePic };
    }
    // Handle profile image path
    if (!profilePic.startsWith('/')) {
      profilePic = `/${profilePic}`;
    }
    const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    return { uri: `${BASE_URL}/${clean}` };
  }
  return null;
};

const initials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const resolvePostAuthor = (post: any) => {
  if (!post) {
    return {
      name: 'Unknown Teacher',
      pic: null,
      role: 'teacher'
    };
  }

  let name = post.author?.name || '';
  let pic: string | null = post.author?.profile_pic || null;
  const role = post.author?.role || 'teacher';

  // Handle email fallback for name
  if (!name || name === 'null' || name.includes('@')) {
    name = post.author?.email?.split('@')[0] || 'Unknown Teacher';
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
    pic = null;
  }

  return { name, pic, role };
};


const CreateSubject = () => {
  const router = useRouter();
  
  // Enhanced responsive state management
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // Get responsive values
  const responsive = getResponsiveValues(screenWidth);
  const { isMobile, isTablet, isDesktop, getFontSize, getSpacing, getDimension } = responsive;
  
  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  
  const [isChecked, setIsChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<'subject' | 'skill'>('subject');
  
  // Posts state (same as TutorDashboardWeb)
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userProfileCache, setUserProfileCache] = useState<Map<string, { name: string; profilePic: string }>>(new Map());
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Helper functions for teacher posts (same as TutorDashboardWeb)
  const getProfileImageSource = (profilePic?: string) => {
    if (profilePic) {
      // Handle different image path formats
      if (profilePic.startsWith('http')) {
        return { uri: profilePic };
      }
      if (profilePic.startsWith('file://')) {
        return { uri: profilePic };
      }
      // Handle profile image path
      if (!profilePic.startsWith('/')) {
        profilePic = `/${profilePic}`;
      }
      const clean = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
      return { uri: `${BASE_URL}/${clean}` };
    }
    return null;
  };

  const initials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const resolvePostAuthor = (post: any) => {
    if (!post) {
      return {
        name: 'Unknown Teacher',
        pic: null,
        role: 'teacher'
      };
    }

    let name = post.author?.name || '';
    let pic: string | null = post.author?.profile_pic || null;
    const role = post.author?.role || 'teacher';

    // Handle email fallback for name
    if (!name || name === 'null' || name.includes('@')) {
      name = post.author?.email?.split('@')[0] || 'Unknown Teacher';
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
      pic = null;
    }

    return { name, pic, role };
  };

  // Fetch user profile
  const fetchUserProfile = async (token: string, email: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/users/profile/${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data?.data) {
        setUserProfileCache(prev => new Map(prev.set(email, {
          name: res.data.data.name || email,
          profilePic: res.data.data.profilePic || ''
        })));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${email}:`, error);
    }
  };

  // Fetch posts function (same as TutorDashboardWeb)
  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.data?.data) {
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

  // Load auth token and fetch posts
  useEffect(() => {
    const loadAuthAndPosts = async () => {
      const token = await getAuthToken();
      if (token) {
        setAuthToken(token);
        fetchPosts(token);
      }
    };
    loadAuthAndPosts();
  }, []);

  // Handle post creation
  const handleCreatePost = async (content: string) => {
    if (!authToken || !userEmail) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/api/posts/create`,
        {
          content: content.trim(),
          tags: ''
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

// Real Teacher Thoughts Component - using TutorDashboardWeb UI
const TeacherThoughtsFeed = () => (
  <View style={styles.rightPanel}>
    <Text style={styles.rightPanelTitle}>Thoughts</Text>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
      <TeacherPostComposer
        onCreatePost={handleCreatePost}
        placeholder="Post your thoughts..."
      />
      {postsLoading && posts.length === 0 && (
        <ActivityIndicator color={COLORS.primaryBlue} style={{ marginTop: 30 }} />
      )}
      {!postsLoading && posts.length === 0 && (
        <View style={styles.thoughtsLoadingContainer}>
          <Text style={styles.loadingText}>No thoughts yet. Be the first to share!</Text>
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
    </ScrollView>
  </View>
);

const ThoughtPost = ({ author, time, content, images, miniGrid }: any) => (
  <View style={styles.postCard}>
     <View style={styles.postHeader}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' }} 
          style={styles.postAvatar} 
        />
        <View>
           <Text style={styles.postAuthor}>{author}</Text>
           <Text style={styles.postTime}>{time}</Text>
        </View>
        <TouchableOpacity style={{ marginLeft: 'auto' }}>
           <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
     </View>
     <Text style={styles.postContent}>{content}</Text>
     <View style={[styles.postGrid, miniGrid && styles.postGridMini]}>
        {images.map((img: string, i: number) => (
          <Image key={i} source={{ uri: img }} style={miniGrid ? styles.gridImgSmall : styles.gridImg} />
        ))}
     </View>
     <View style={styles.postActions}>
        <ActionBtn icon="hand-left-outline" label="Like" count="6" />
        <ActionBtn icon="chatbubble-outline" label="Thoughts" count="6" />
        <ActionBtn icon="share-social-outline" label="Share" count="2" />
     </View>
  </View>
);

const ActionBtn = ({ icon, label, count }: any) => (
  <TouchableOpacity style={styles.actionBtn}>
     <Ionicons name={icon} size={16} color={COLORS.primaryBlue} />
     <Text style={styles.actionText}>{label}</Text>
     <Text style={styles.actionCount}>{count}</Text>
  </TouchableOpacity>
);

  const TabSwitcher = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'subject' && styles.activeTab]}
        onPress={() => setActiveTab('subject')}
      >
        <Text style={[styles.tabText, activeTab === 'subject' && styles.activeTabText]}>Create New Subject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'skill' && styles.activeTab]}
        onPress={() => setActiveTab('skill')}
      >
        <Text style={[styles.tabText, activeTab === 'skill' && styles.activeTabText]}>Create New Skill Subject</Text>
      </TouchableOpacity>
    </View>
  );

  // Modern UI Components from CreateSubjectScreen
  const FormHeader = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.mainTitle}>
        {activeTab === 'subject' ? 'Create New Subject' : 'Create New Skill Subject'}
      </Text>
      <Text style={styles.subtext}>
        {activeTab === 'subject' 
          ? 'Configure the curriculum details for your new teaching module.'
          : 'Define the parameters for your new skill-based learning program.'
        }
      </Text>
    </View>
  );

  const FormField = ({ label, placeholder, isDropdown, half, multiline, value, onChangeText, maxLength, items, selectedItem, setSelectedItem, showDropdown, setShowDropdown }: any) => {
    const [localShowDropdown, setLocalShowDropdown] = useState(false);
    const [localSelectedItem, setLocalSelectedItem] = useState('');
    
    const dropdownShow = showDropdown !== undefined ? showDropdown : localShowDropdown;
    const dropdownSetShow = setShowDropdown !== undefined ? setShowDropdown : setLocalShowDropdown;
    const dropdownSelected = selectedItem !== undefined ? selectedItem : localSelectedItem;
    const dropdownSetSelected = setSelectedItem !== undefined ? setSelectedItem : setLocalSelectedItem;

    return (
      <View style={[styles.fieldContainer, half && styles.halfField]}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.inputWrapper, isDropdown && styles.modernDropdownInput]}
          onPress={() => isDropdown && dropdownSetShow(!dropdownShow)}
        >
          {isDropdown ? (
            <View style={styles.dropdownContent}>
              <Text style={[styles.inputText, !dropdownSelected && styles.modernPlaceholderText]}>
                {dropdownSelected || placeholder}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
            </View>
          ) : (
            <TextInput
              style={[styles.inputText, { flex: 1, height: '100%' }]}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              multiline={multiline}
              value={value}
              onChangeText={onChangeText}
              maxLength={maxLength}
              textAlignVertical={multiline ? 'top' : 'center'}
            />
          )}
        </TouchableOpacity>

        {dropdownShow && items && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {items.map((item: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.dropdownOption}
                  onPress={() => { dropdownSetSelected(item); dropdownSetShow(false); }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

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

  // Back Arrow Icon Component
  const BackArrowIcon = () => (
    <Ionicons name="arrow-back" size={24} color={COLORS.textHeader} />
  );
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
  const [skillCategory, setSkillCategory] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [showSkillCategoryDropdown, setShowSkillCategoryDropdown] = useState(false);
  const [showSkillLevelDropdown, setShowSkillLevelDropdown] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [sidebarActiveItem, setSidebarActiveItem] = useState('Create Subject');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load teacher data for web header and sidebar
  React.useEffect(() => {
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
      case 'Home':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'My Students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'My Subjects':
        router.push('/(tabs)/TeacherDashBoard/MySubjectsWeb');
        break;
      case 'joinedDate':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Create Subject':
        // Already on this page
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

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
    if (activeTab === 'subject') {
      // Subject validation
      if (!selectedTeachingCategory) {
        Alert.alert('Required Field', 'Teaching category is required');
        return;
      }

      if (!selectedClass) {
        Alert.alert('Required Field', 'Class selection is required');
        return;
      }

      if (!selectedBoard) {
        Alert.alert('Required Field', 'Education board is required');
        return;
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
      // Skill validation
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
      const authToken = await getAuthToken();
      
      if (!authToken) {
        Alert.alert('Authentication Error', 'Please login again');
        return;
      }

      const requestData = activeTab === 'subject' ? {
        teachingCategory: selectedTeachingCategory,
        subjectTitle: subjectTitle.trim(),
        description: description.trim(),
        className: selectedClass,
        board: selectedBoard,
        type: 'subject'
      } : {
        skillCategory: skillCategory,
        skillLevel: skillLevel,
        skillName: skillName.trim(),
        description: skillDescription.trim(),
        type: 'skill'
      };

      const endpoint = activeTab === 'subject' 
        ? `${BASE_URL}/api/createSubject` 
        : `${BASE_URL}/api/createSkillSubject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage = activeTab === 'subject' 
          ? 'Subject created successfully! Awaiting verification.'
          : 'Skill subject created successfully! Awaiting verification.';
        
        Alert.alert('Success', successMessage, [
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
      {/* Web Layout - Only show on web */}
      {Platform.OS === 'web' ? (
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
              activeItem="Create Subject"
              userEmail={userEmail}
              teacherName={teacherName}
              profileImage={profileImage}
            />
            
            {/* Main Content */}
            <View style={styles.webMainContent}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'web' ? 'height' : 'padding'}
                style={styles.webKeyboardAvoid}
              >
                <TouchableWithoutFeedback onPress={dismissKeyboard}>
                  <View style={styles.webFormContainer}>
                    <ScrollView
                      style={styles.mainScroll}
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <View style={styles.dualColumns}>
                        {/* Center Feed / Form Section */}
                        <View style={styles.mainFeed}>
                          <FormHeader />
                          
                          <TabSwitcher />
                          
                          <View style={[styles.formContainer, { zIndex: 100 }]}>
                            {activeTab === 'subject' ? (
                              // Subject Creation Form
                              <>
                                <View style={[styles.formRow, { zIndex: 3000 }]}>
                                  <FormField 
                                    label="Teaching Category *" 
                                    placeholder="Select category" 
                                    isDropdown 
                                    half 
                                    items={['Academics', 'Music', 'Sports', 'Other']} 
                                  />
                                  <FormField 
                                    label="Class Category *" 
                                    placeholder="Select level" 
                                    isDropdown 
                                    half 
                                    items={['Junior', 'Senior', 'Professional']} 
                                  />
                                </View>

                                <View style={[styles.formRow, { zIndex: 2000, marginTop: 10 }]}>
                                  <FormField 
                                    label="Which Class? *" 
                                    placeholder="Select specific class" 
                                    isDropdown 
                                    half 
                                    items={['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']} 
                                  />
                                  <FormField 
                                    label="Select Education Board *" 
                                    placeholder="Select board" 
                                    isDropdown 
                                    half 
                                    items={[
                                      'CBSE (Central Board of Secondary Education)',
                                      'ICSE (Indian Certificate of Secondary Education)',
                                      'ISC',
                                      'NIOS (National Institute of Open Schooling)',
                                      'IB (International Baccalaureate)',
                                      'Cambridge (IGCSE)',
                                      'WBCHSE / WBBSE (West Bengal)',
                                      'Maharashtra State Board (MSBSHSE)',
                                      'Tamil Nadu State Board',
                                      'Karnataka State Board',
                                      'Andhra Pradesh Board',
                                      'Telangana Board',
                                      'Kerala State Board',
                                      'Gujarat State Board (GSEB)',
                                      'Rajasthan Board (RBSE)',
                                      'UP Board (UPMSP)',
                                      'Bihar Board (BSEB)',
                                      'MP Board (MPBSE)',
                                      'Haryana Board (HBSE)',
                                      'Punjab Board (PSEB)',
                                      'Odisha Board (BSE Odisha)',
                                      'Assam Board (SEBA/AHSEC)',
                                      'Jharkhand Board (JAC)',
                                      'Chhattisgarh Board (CGBSE)',
                                      'Himachal Pradesh Board (HPBOSE)',
                                      'Uttarakhand Board (UBSE)',
                                      'Goa Board (GBSHSE)',
                                      'Tripura Board (TBSE)',
                                      'Meghalaya Board (MBOSE)',
                                      'Manipur Board (BSEM/COHSEM)',
                                      'Nagaland Board (NBSE)',
                                      'Mizoram Board (MBSE)',
                                      'Arunachal Pradesh Board',
                                    ]} 
                                  />
                                </View>

                                <View style={{ zIndex: 1, marginTop: 10 }}>
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
                              // Skill Subject Creation Form
                              <>
                                <View style={[styles.formRow, { zIndex: 3000 }]}>
                                  <FormField 
                                    label="Skill Category *" 
                                    placeholder="Select skill category" 
                                    isDropdown 
                                    half 
                                    items={['Programming', 'Design', 'Marketing', 'Business', 'Music', 'Art', 'Language', 'Sports', 'Other']} 
                                  />
                                  <FormField 
                                    label="Skill Level *" 
                                    placeholder="Select level" 
                                    isDropdown 
                                    half 
                                    items={['Beginner', 'Intermediate', 'Advanced', 'Expert']} 
                                  />
                                </View>

                                <View style={{ zIndex: 1, marginTop: 10 }}>
                                  <FormField 
                                    label="Skill Name *" 
                                    placeholder="e.g. Web Development, Graphic Design" 
                                    value={skillName}
                                    onChangeText={setSkillName}
                                  />

                                  <FormField 
                                    label="Skill Description *" 
                                    placeholder="Provide a detailed overview of what students will learn and the skills they will acquire..." 
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
                                  All fields marked with <Text style={{ color: COLORS.primaryBlue }}>*</Text> are required for submission
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
                                desc="Our editorial board reviews all subject content to ensure it meets our high academic standards and curriculum alignment ." 
                             />
                             <InfoCard 
                                icon="eye-outline" 
                                title="Visibility Note" 
                                desc="Once published, this subject will be visible to thousands of students looking for specialized tutoring in your field ." 
                             />
                          </View>
                        </View>

                        {/* Right Panel - Real Teacher Thoughts */}
                        <View style={styles.rightPanel}>
                          <TeacherThoughtsFeed />
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
            </View>
          </View>
        </View>
      ) : (
        // Mobile Layout
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp('2%') : 0}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.innerContainer}>
              {/* Mobile Header */}
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
                <FormHeader />
                
                <View style={[styles.formContainer, { zIndex: 100 }]}>
                   <View style={[styles.formRow, { zIndex: 3000 }]}>
                      <FormField 
                        label="Teaching Category *" 
                        placeholder="Select category" 
                        isDropdown 
                        half 
                        items={['Academics', 'Music', 'Sports', 'Other']} 
                        selectedItem={selectedTeachingCategory}
                        setSelectedItem={setSelectedTeachingCategory}
                        showDropdown={showTeachingDropdown}
                        setShowDropdown={setShowTeachingDropdown}
                      />
                      <FormField 
                        label="Class Category *" 
                        placeholder="Select level" 
                        isDropdown 
                        half 
                        items={['Junior', 'Senior', 'Professional']} 
                        selectedItem={selectedClass}
                        setSelectedItem={setSelectedClass}
                        showDropdown={showClassDropdown}
                        setShowDropdown={setShowClassDropdown}
                      />
                   </View>

                   <View style={[styles.formRow, { zIndex: 2000, marginTop: 10 }]}>
                      <FormField 
                        label="Which Class? *" 
                        placeholder="Select specific class" 
                        isDropdown 
                        half 
                        items={CLASSES} 
                        selectedItem={selectedClass}
                        setSelectedItem={setSelectedClass}
                        showDropdown={showClassDropdown}
                        setShowDropdown={setShowClassDropdown}
                      />
                      <FormField 
                        label="Select Education Board *" 
                        placeholder="Select board" 
                        isDropdown 
                        half 
                        items={EDUCATION_BOARDS} 
                        selectedItem={selectedBoard}
                        setSelectedItem={setSelectedBoard}
                        showDropdown={showBoardDropdown}
                        setShowDropdown={setShowBoardDropdown}
                      />
                   </View>

                   <View style={{ zIndex: 1, marginTop: 10 }}>
                     <FormField 
                        label="Subject Title *" 
                        placeholder="e.g. Advanced Astrophysics and Space Mechanics" 
                        value={subjectTitle}
                        onChangeText={setSubjectTitle}
                     />

                     <FormField 
                        label="Subject Description *" 
                        placeholder="Provide a detailed overview of the learning outcomes and syllabus coverage ..." 
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        maxLength={500}
                     />
                   </View>

                   <View style={styles.formFooter}>
                      <Text style={styles.footerNote}>
                        All fields marked with <Text style={{ color: COLORS.primaryBlue }}>*</Text> are required for submission
                      </Text>
                      <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit} disabled={loading}>
                         <FontAwesome5 name="rocket" size={14} color="white" style={{ marginRight: 10 }} />
                         <Text style={styles.publishBtnText}>
                           {loading ? 'Creating...' : 'Request Publish'}
                         </Text>
                      </TouchableOpacity>
                   </View>
                </View>

                {/* Bottom Info Cards */}
                <View style={styles.infoCardsRow}>
                   <InfoCard 
                      icon="shield-check-outline" 
                      title="Quality Assurance" 
                      desc="Our editorial board reviews all subject content to ensure it meets our high academic standards and curriculum alignment." 
                   />
                   <InfoCard 
                      icon="eye-outline" 
                      title="Visibility Note" 
                      desc="Once published, this subject will be visible to thousands of students looking for specialized tutoring in your field." 
                   />
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default CreateSubject;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    marginTop: Platform.OS === 'web' ? 0 : 30 
  },
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  innerContainer: { 
    flex: 1 
  },
  webLayout: { 
    flex: 1, 
    flexDirection: 'column' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: wp('4.5%'),
    color: COLORS.text,
    marginLeft: wp('3%'),
  },
  iconWrapper: {
    padding: wp('2%'),
  },
  content: {
    padding: wp('4%'),
    paddingBottom: wp('8%'),
  },
  // Enhanced Web Layout Styles - from CreateSubjectScreen
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  webKeyboardAvoid: {
    flex: 1,
  },
  webFormContainer: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 30,
  },
  dualColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainFeed: {
    flex: 1,
    marginRight: 30,
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  rightPanel: {
    width: Platform.OS === 'web' ? '25%' : '25%',
    minWidth: 300,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  thoughtsContainer: {
    flex: 1,
  },
  thoughtsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: COLORS.primaryBlue,
    marginBottom: 20,
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
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
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
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primaryBlue,
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.white,
  },
  // Enhanced Form Layout Styles - from CreateSubjectScreen
  titleContainer: {
    marginBottom: 35,
  },
  mainTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: COLORS.textHeader,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: COLORS.textBody,
    letterSpacing: 0.2,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
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
    elevation: 5,
    marginBottom: 30,
    position: 'relative',
    zIndex: 10,
    overflow: 'visible',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  fieldContainer: {
    marginBottom: 25,
  },
  halfField: {
    width: '48%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.textHeader,
  },
  charCounter: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modernDropdownInput: {
    justifyContent: 'space-between',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  inputWrapperActive: {
    borderColor: COLORS.primaryBlue,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  inputText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.textHeader,
  },
  modernPlaceholderText: {
    color: COLORS.textMuted,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    elevation: 10,
  },
  dropdownOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: COLORS.textBody,
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerNote: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.textBody,
    backgroundColor: '#F3F4FB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 0.8,
  },
  publishBtn: {
    backgroundColor: COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  publishBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: COLORS.white,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
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
    elevation: 3,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  infoTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.textHeader,
    marginBottom: 10,
  },
  infoDesc: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  // Legacy mobile dropdown styles
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
    borderRadius: wp('2%'),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    zIndex: 1000,
    maxHeight: hp('30%'),
  },
  dropdownItem: {
    padding: wp('3%'),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: wp('3.5%'),
    color: COLORS.text,
  },
  // Legacy mobile styles (keeping for compatibility)
  field: {
    marginBottom: hp('2%'),
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontFamily: 'Poppins_400Regular',
    fontSize: wp('3.5%'),
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: hp('12%'),
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: wp('4%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  submitText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: wp('4%'),
    color: '#FFFFFF',
  },
  // ThoughtsFeed styles from TutorDashboardScreen
  thoughtsTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#2563EB',
    marginBottom: 20,
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  postAuthor: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textDark,
  },
  postTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  postContent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 15,
  },
  postGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridImg: {
    width: '48%',
    height: 180,
    borderRadius: 12,
  },
  postGridMini: {
    flexWrap: 'wrap',
  },
  gridImgSmall: {
    width: '31%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  actionCount: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  postInputArea: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 15,
  },
  thoughtsInput: {
    flex: 1,
    height: 45,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginLeft: 10,
  },
  thoughtsPostBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  thoughtsPostBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: COLORS.white,
  },
  // TutorDashboardWeb Right Panel Styles
  rightPanelTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primaryBlue,
    marginBottom: 24,
    textAlign: 'right',
  },
  thoughtsList: {
    paddingBottom: 40,
  },
  thoughtsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 10,
  },
});
