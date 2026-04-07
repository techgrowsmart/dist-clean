import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Animated,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
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
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Svg, {
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
  Line,
  Polyline,
  Circle,
  Path,
} from 'react-native-svg';
import UnifiedThoughtsCard, { UnifiedThoughtsBackground, UnifiedPost } from '../../../components/ui/UnifiedThoughtsCard';
import TeacherPostComposer from '../../../components/ui/TeacherPostComposer';
import TeacherWebLayout from '../../../components/ui/TeacherWebLayout';
import { BASE_URL } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import StudentsListWeb from './StudentsListWeb';
import SubjectsListWeb from './SubjectsListWeb';
import JoinedDateWeb from './JoinedDateWeb';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import StudentsList from './StudentList';
import SubjectsList from './SubjectsList';
import { Picker } from '@react-native-picker/picker';
import { LineChart, BarChart } from 'react-native-chart-kit';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';
import { UXButton, UXCard, UXLoading, UXBadge, UX_COLORS, UX_CONSTANTS } from '../../../components/ux/UXComponents';

// ─── Design tokens ──────────────────────────────────────────────────────────
const COLORS = {
  background: '#F5F7FB',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  gradientBlueStart: '#4F6EF7',
  gradientBlueEnd: '#3B5BFE',
  border: '#E5E7EB',
  textDark: '#111827',
  textSecondary: '#6B7280',
  textPrimary: '#1a1a1a',
  white: '#FFFFFF',
  bannerTint: '#EEF2FF',
};

const CHART_DATA = [
  { month: 'Jan', value: 3000 },
  { month: 'Feb', value: 2400 },
  { month: 'Mar', value: 2000 },
  { month: 'Apr', value: 3500 },
  { month: 'May', value: 2600 },
  { month: 'Jun', value: 3200 },
  { month: 'Jul', value: 3000 },
  { month: 'Aug', value: 2800 },
  { month: 'Sep', value: 3100 },
  { month: 'Oct', value: 3300 },
  { month: 'Nov', value: 2900 },
  { month: 'Dec', value: 3600 },
];

// Mock posts data removed – using real API data
const MOCK_POSTS: any[] = [];

// ─── Helper: format date ─────────────────────────────────────────────────────
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface TutorDashboardWebProps {
  teacherName?: string;
  profileImage?: string | null;
  userEmail?: string | null;
  subjectCount?: number;
  contacts?: any[];
  reviews?: any[];
  unreadCount?: number;
  userStatus?: string;
  createdAt?: string | null;
  isSpotlight?: boolean;
  profileLoading?: boolean;
  contactsLoading?: boolean;
  reviewsLoading?: boolean;
  subjectsLoading?: boolean;
}

// ─── Misc sub-components ──────────────────────────────────────────────────────
const FilterBtn = ({ label }: any) => (
  <TouchableOpacity style={styles.filterBtn}>
    <Text style={styles.filterBtnText}>{label}</Text>
    <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

// ─── StatsCard ────────────────────────────────────────────────────────────────
const StatsCard = React.memo(({ title, value, growth, subtext, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.statsCard}>
    <Text style={styles.statsTitle} selectable={false}>{title}</Text>
    <View style={styles.statsValueRow}>
      <Text style={styles.statsValue} selectable={false}>{value}</Text>
      {growth && <Text style={styles.statsGrowth} selectable={false}>{growth}</Text>}
    </View>
    {subtext && <Text style={styles.statsSubtext} selectable={false}>{subtext}</Text>}
  </TouchableOpacity>
));

// ─── Main component ───────────────────────────────────────────────────────────
export default function TutorDashboardWeb({
  teacherName = '',
  profileImage,
  userEmail,
  subjectCount = 0,
  contacts = [],
  reviews = [],
  unreadCount = 0,
  userStatus = 'dormant',
  createdAt,
  isSpotlight = false,
  profileLoading = false,
  contactsLoading = false,
  reviewsLoading = false,
  subjectsLoading = false,
}: TutorDashboardWebProps) {
  const router = useRouter();

  // ── State: real data ──────────────────────────────────────────────────────
  const [realTeacherName, setRealTeacherName]         = useState('');
  const [realProfileImage, setRealProfileImage]       = useState<string | null>(null);
  const [realUserEmail, setRealUserEmail]             = useState<string | null>(null);
  const [realUserType, setRealUserType]               = useState<string | null>(null);
  const [realIsSpotlight, setRealIsSpotlight]         = useState<boolean>(false);
  const [realSubjectCount, setRealSubjectCount]       = useState<number>(0);
  const [cacheLoaded, setCacheLoaded]                 = useState(false);
  const [realContacts, setRealContacts]               = useState<any[]>([]);
  const [realUnreadCount, setRealUnreadCount]         = useState(0);
  const [realUserStatus, setRealUserStatus]           = useState('dormant');
  const [realCreatedAt, setRealCreatedAt]             = useState<string | null>(null);
  const [isDashboardLoading, setIsDashboardLoading]   = useState(true);
  const [realSubjectsLoading, setRealSubjectsLoading] = useState(true);
  const [realProfileLoading, setRealProfileLoading]   = useState(true);
  const [realContactsLoading, setRealContactsLoading] = useState(true);

  // ── State: UI ─────────────────────────────────────────────────────────────
  const [showSubjectsList, setShowSubjectsList] = useState(false);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [showJoinedDate, setShowJoinedDate]     = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [sidebarActiveItem, setSidebarActiveItem]     = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed]   = useState(false);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile  = screenWidth < 768;
  const isTablet  = screenWidth >= 768 && screenWidth < 1024;

  // Thoughts panel – collapsed by default on mobile / native
  const [isThoughtsCollapsed, setIsThoughtsCollapsed] = useState(
    Platform.OS !== 'web' || screenWidth < 768
  );

  const [authToken, setAuthToken]                     = useState<string | null>(null);
  const [posts, setPosts]                             = useState<UnifiedPost[]>([]);
  const [postsLoading, setPostsLoading]               = useState(true);
  const [userProfileCache, setUserProfileCache]       = useState<
    Map<string, { name: string; profilePic: string }>
  >(new Map());

  const [revenue, setRevenue]                         = useState<string>('₹0');
  const [enrollmentData, setEnrollmentData]           = useState<any[]>([]);
  const [chartLoading, setChartLoading]               = useState(true);

  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedState, setSelectedState]               = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter]     = useState('6months');
  const [chartData, setChartData]                       = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{ data: [20, 45, 28, 80, 99, 43] }],
  });

  // ── Cache keys ────────────────────────────────────────────────────────────
  const CACHE_KEYS = {
    PROFILE:       'teacher_dashboard_profile_cache',
    CONTACTS:      'teacher_dashboard_contacts_cache',
    SUBJECT_COUNT: 'teacher_dashboard_subject_count_cache',
  };

  // ── loadCachedProfile ─────────────────────────────────────────────────────
  const loadCachedProfile = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEYS.PROFILE);
      if (raw) {
        const c = JSON.parse(raw);
        if (c?.name)           setRealTeacherName(c.name);
        if (c?.email)          setRealUserEmail(c.email);
        if (c?.profileimage)   setRealProfileImage(c.profileimage);
        if (c?.status)         setRealUserStatus(c.status);
        if (c?.created_at)     setRealCreatedAt(c.created_at);
        if (typeof c.isSpotlight === 'boolean') setRealIsSpotlight(c.isSpotlight);
      }
    } catch (_) {}
    setCacheLoaded(true);
  }, []);

  // ── fetchProfile ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.email) { router.replace('/'); return; }
      const { email, token } = auth;
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await axios.post(`${BASE_URL}/api/userProfile`, { email }, { headers, timeout: 10000 });
      const d = res.data;
      if (d?.name) {
        if (d.isSpotlight !== undefined) setRealIsSpotlight(Boolean(d.isSpotlight));
        setRealTeacherName(d.name);
        setRealUserStatus(d.status || 'dormant');
        setRealUserEmail(d.email);
        setRealCreatedAt(d.created_at);
        await AsyncStorage.setItem('teacherName', d.name);
        if (d.profileimage) {
          setRealProfileImage(d.profileimage);
          await AsyncStorage.setItem('profileImage', d.profileimage);
        }
        await AsyncStorage.setItem(
          CACHE_KEYS.PROFILE,
          JSON.stringify({
            name:         d.name,
            email:        d.email,
            profileimage: d.profileimage,
            status:       d.status || 'dormant',
            created_at:   d.created_at,
            isSpotlight:  Boolean(d.isSpotlight),
          })
        ).catch(() => {});
      }
    } catch (_) {}
    finally {
      setRealProfileLoading(false);
      setIsDashboardLoading(false);
    }
  };

  // ── fetchContacts ─────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!realUserEmail) return;
    try {
      setRealContactsLoading(true);
      const auth = await getAuthData();
      const headers = {
        Authorization: `Bearer ${auth?.token}`,
        'Content-Type': 'application/json',
      };
      const res = await axios.post(
        `${BASE_URL}/api/contacts`,
        { userEmail: realUserEmail, type: auth?.role },
        { headers }
      );
      if (res.data.success) {
        setRealContacts(
          res.data.contacts.map((c: any) => ({
            name:            c.teacherName || c.studentName,
            profilePic:      c.teacherProfilePic || c.studentProfilePic || c.profilePic || '',
            email:           c.teacherEmail || c.studentEmail,
            lastMessage:     c.lastMessage,
            lastMessageTime: c.lastMessageTime,
          }))
        );
      }
    } catch (_) {}
    finally { setRealContactsLoading(false); }
  }, [realUserEmail]);

  // ── fetchSubjectCount ─────────────────────────────────────────────────────
  const fetchSubjectCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      const { email, token } = auth ?? {};
      if (!email || !token) { setRealSubjectsLoading(false); return 0; }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch(`${BASE_URL}/api/teacherInfo`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ teacherEmail: email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let count = 0;
      const seen = new Set();
      if (data?.subjects?.length) {
        data.subjects.forEach((s: any) => {
          if (s?.id && !seen.has(s.id)) { seen.add(s.id); count++; }
        });
      }
      setRealSubjectCount(count);
      await AsyncStorage.setItem(
        CACHE_KEYS.SUBJECT_COUNT,
        JSON.stringify({ count, timestamp: Date.now() })
      );
      return count;
    } catch (_) {
      return realSubjectCount;
    } finally {
      setRealSubjectsLoading(false);
    }
  }, [realSubjectCount]);

  // ── fetchUnreadCount ──────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      if (!auth?.token) return;
      const res = await axios.get(`${BASE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      if (res.data && typeof res.data.count === 'number') {
        setRealUnreadCount(prev => (res.data.count !== prev ? res.data.count : prev));
      }
    } catch (_) {}
  }, []);

  // ── fetchEnrollmentData ───────────────────────────────────────────────────
  const fetchEnrollmentData = useCallback(async () => {
    if (!authToken || !realUserEmail) return;
    try {
      setChartLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/enrollment-data`,
        { teacherEmail: realUserEmail },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } }
      );
      if (res.data?.enrollments) {
        setEnrollmentData(
          res.data.enrollments.map((item: any, i: number) => ({
            month: item.month || `M${i + 1}`,
            value: item.value || item.y || item.enrollments || 0,
          }))
        );
      } else {
        setEnrollmentData(CHART_DATA.map(d => ({ month: d.month, value: d.value })));
      }
    } catch (_) {
      setEnrollmentData(CHART_DATA.map(d => ({ month: d.month, value: d.value })));
    } finally {
      setChartLoading(false);
    }
  }, [authToken, realUserEmail]);

  // ── Chart helpers ─────────────────────────────────────────────────────────
  const stateEnrollmentData: { [k: string]: number[] } = {
    Maharashtra: [45, 52, 48, 61, 58, 67],
    Delhi: [38, 42, 45, 51, 49, 55],
    Karnataka: [32, 38, 41, 44, 47, 52],
    'Tamil Nadu': [28, 33, 36, 39, 42, 45],
    'Uttar Pradesh': [25, 29, 32, 35, 38, 41],
    Gujarat: [22, 26, 29, 31, 34, 37],
    Rajasthan: [20, 23, 26, 28, 30, 33],
    'West Bengal': [18, 21, 24, 26, 28, 31],
  };

  const applyTimeFilter = (data: number[], tf: string): number[] => {
    switch (tf) {
      case '1month': {
        const last = data[data.length - 1] || 30;
        return [
          Math.floor(last * 0.65),
          Math.floor(last * 0.80),
          Math.floor(last * 0.92),
          last,
        ];
      }
      case '3months':
        return data.slice(-3);
      case '6months':
        return data;
      case '1year': {
        const avg = data.reduce((a, v, i) => i === 0 ? 0 : a + (v - data[i - 1]), 0) / (data.length - 1);
        const ext = [...data];
        for (let i = 0; i < 6; i++) {
          const last = ext[ext.length - 1];
          ext.push(Math.max(8, Math.floor(last + avg * (1 + Math.sin((i + 3) * Math.PI / 6) * 0.15))));
        }
        return ext;
      }
      default:
        return data;
    }
  };

  const getTimeFilterLabels = (tf: string): string[] => {
    switch (tf) {
      case '1month': return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '3months': return ['Apr', 'May', 'Jun'];
      case '6months': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      case '1year':   return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      default:        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const base = stateEnrollmentData[state] ?? [20, 45, 28, 80, 99, 43];
    setChartData({
      labels: getTimeFilterLabels(selectedTimeFilter),
      datasets: [{ data: applyTimeFilter(base, selectedTimeFilter) }],
    });
  };

  const handleTimeFilterChange = (tf: string) => {
    setSelectedTimeFilter(tf);
    const base = (selectedState && stateEnrollmentData[selectedState])
      ? stateEnrollmentData[selectedState]
      : [20, 45, 28, 80, 99, 43];
    setChartData({
      labels: getTimeFilterLabels(tf),
      datasets: [{ data: applyTimeFilter(base, tf) }],
    });
  };

  const handleClientFilterChange = (cf: string) => setSelectedClientFilter(cf);

  // ── Post helpers ──────────────────────────────────────────────────────────
  const getProfileImageSource = (profilePic?: string) => {
    if (!profilePic) return null;
    if (profilePic.startsWith('http')) return { uri: profilePic };
    const url = profilePic.startsWith('/') ? profilePic : `/${profilePic}`;
    return { uri: `${BASE_URL}${url}` };
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const resolvePostAuthor = (post: any) => {
    if (!post) return { name: teacherName || 'Unknown Teacher', pic: profileImage || null, role: 'teacher' };
    const cached = userProfileCache.get(post.author?.email) ?? { name: '', profilePic: '' };
    let name: string = cached.name || post.author?.name || '';
    let pic: string | null = cached.profilePic || post.author?.profile_pic || null;
    if (!name || name === 'null' || name.includes('@')) {
      name = (post.author?.email?.split('@')[0] || teacherName || 'Unknown Teacher')
        .split('.')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    }
    if (pic && !pic.startsWith('http') && !pic.startsWith('/')) pic = `/${pic}`;
    if (pic === '' || pic === 'null') pic = profileImage || null;
    return { name, pic, role: post.author?.role || 'teacher' };
  };

  const fetchUserProfile = async (token: string, email: string) => {
    try {
      if (userProfileCache.has(email)) return userProfileCache.get(email)!;
      const res = await axios.post(
        `${BASE_URL}/api/userProfile`,
        { email },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      if (res.data) {
        const profileData = {
          name:       res.data.name || 'Unknown User',
          profilePic: res.data.profileimage || res.data.profilePic || '',
        };
        setUserProfileCache(prev => new Map(prev.set(email, profileData)));
        return profileData;
      }
    } catch (_) {}
    return { name: 'Unknown User', profilePic: '' };
  };

  const fetchPosts = async (token: string) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/posts/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.data) {
        const uniqueEmails = [
          ...new Set(
            res.data.data
              .map((p: any) => p.author?.email as string)
              .filter(Boolean)
          ),
        ] as string[];
        await Promise.all(uniqueEmails.map(e => fetchUserProfile(token, e)));
        setPosts(res.data.data);
      }
    } catch (_) {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // ── Sidebar navigation ────────────────────────────────────────────────────
  const handleSidebarToggle = () => setIsSidebarCollapsed(p => !p);

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    const navMap: Record<string, string> = {
      'My Subjects':       '/(tabs)/TeacherDashBoard/MySubjectsWeb',
      'Spotlights':        '/(tabs)/TeacherDashBoard/Spotlights',
      'Connect':           '/(tabs)/TeacherDashBoard/ConnectWeb',
      'Share':             '/(tabs)/TeacherDashBoard/Share',
      'Create Subject':    '/(tabs)/TeacherDashBoard/CreateSubject',
      'Settings':          '/(tabs)/TeacherDashBoard/Settings',
      'Terms & Conditions':'/(tabs)/Terms',
      'Privacy Policy':    '/(tabs)/Privacy',
      'Contact Us':        '/(tabs)/Contact',
      'Raise a Complaint': '/(tabs)/Complaint',
    };
    if (item === 'Billing') {
      router.push({
        pathname: '/(tabs)/Billing',
        params: { userType: 'teacher', userEmail, teacherName, profileImage },
      } as any);
    } else if (navMap[item]) {
      router.push(navMap[item] as any);
    }
  };

  const handleCreatePost = async (content: string) => {
    let token = authToken;
    if (!token) {
      const authData = await getAuthData();
      if (authData?.token) { setAuthToken(authData.token); token = authData.token; }
      else throw new Error('No authentication token. Please log in again.');
    }
    if (!userEmail) throw new Error('User email not found. Please log in again.');
    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/create`,
        { content: content.trim(), tags: '' },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        if (token) await fetchPosts(token);
        return res.data;
      }
      throw new Error(res.data.message || 'Failed to create post');
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create post. Please try again.');
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      if (window.width < 768) {
        setIsSidebarCollapsed(true);
        setIsThoughtsCollapsed(true);
      }
    });
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    const loadAuthToken = async () => {
      try {
        const d = await getAuthData();
        if (d?.token) setAuthToken(d.token);
      } catch (_) {}
    };
    loadAuthToken();
    loadCachedProfile();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      if (!cacheLoaded) return;
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEYS.SUBJECT_COUNT);
        if (raw) {
          const { count } = JSON.parse(raw);
          if (typeof count === 'number') setRealSubjectCount(count);
        }
      } catch (_) {}
      if (mounted) await Promise.all([fetchSubjectCount(), fetchProfile()]);
    };
    loadInitialData();
    return () => { mounted = false; };
  }, [cacheLoaded, fetchSubjectCount]);

  useEffect(() => {
    if (realUserEmail) fetchContacts();
  }, [realUserEmail, fetchContacts]);

  useEffect(() => {
    if (!realUserEmail) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [realUserEmail, fetchUnreadCount]);

  useEffect(() => {
    const defaultData = applyTimeFilter([20, 45, 28, 80, 99, 43], selectedTimeFilter);
    setChartData({ labels: getTimeFilterLabels(selectedTimeFilter), datasets: [{ data: defaultData }] });
    if (authToken && realUserEmail) fetchEnrollmentData();
    else setChartLoading(false);
  }, [authToken, realUserEmail]);

  useEffect(() => {
    if (enrollmentData.length > 0) {
      const values  = enrollmentData.map(d => d.value || 0);
      const filtered = applyTimeFilter(values, selectedTimeFilter);
      setChartData({ labels: getTimeFilterLabels(selectedTimeFilter), datasets: [{ data: filtered }] });
    }
  }, [enrollmentData, selectedTimeFilter]);

  useEffect(() => {
    if (authToken) fetchPosts(authToken);
  }, [authToken]);

  // ── Early returns – sub-screens ───────────────────────────────────────────
  if (showSubjectsList) {
    return (
      <SubjectsListWeb
        subjectCount={realSubjectCount || subjectCount}
        onBack={() => setShowSubjectsList(false)}
        teacherName={realTeacherName || teacherName}
        profileImage={realProfileImage || profileImage}
        userEmail={realUserEmail || userEmail}
      />
    );
  }
  if (showStudentsList) {
    return (
      <StudentsListWeb
        students={realContacts.length ? realContacts : contacts}
        onBack={() => setShowStudentsList(false)}
        teacherName={realTeacherName || teacherName}
        profileImage={realProfileImage || profileImage}
        userEmail={realUserEmail || userEmail}
      />
    );
  }
  if (showJoinedDate) {
    return (
      <JoinedDateWeb
        createdAt={realCreatedAt || createdAt}
        userStatus={realUserStatus || userStatus}
        teacherName={realTeacherName || teacherName}
        profileImage={realProfileImage || profileImage}
        userEmail={realUserEmail || userEmail}
        onBack={() => setShowJoinedDate(false)}
      />
    );
  }

  if (!fontsLoaded || isDashboardLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const displayName        = realTeacherName || teacherName;
  const displayImage       = realProfileImage || profileImage;
  const displayEmail       = realUserEmail || userEmail;
  const displaySubjects    = realSubjectCount || subjectCount;
  const displayStudents    = realContacts.length || contacts.length;
  const displayCreatedAt   = realCreatedAt || createdAt;
  const displaySpotlight   = realIsSpotlight ?? isSpotlight;
  const displayStatus      = realUserStatus || userStatus;

  // ── Thoughts panel – shown on web desktop only ─────────────────────────────
  const showThoughtsPanel = Platform.OS === 'web' && !isMobile;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Top header ── */}
      <TeacherWebHeader teacherName={displayName} profileImage={displayImage} />

      {/* ── Body: sidebar + content area ── */}
      <View style={styles.contentLayout}>
        <TeacherWebSidebar
          teacherName={displayName}
          profileImage={displayImage}
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={displayEmail || ''}
          subjectCount={displaySubjects}
          studentCount={displayStudents}
          revenue={revenue}
          isSpotlight={displaySpotlight}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        />

        {/* ── Main wrapper: center + right panel in a ROW ── */}
        <View style={styles.mainWrapper}>

          {/*
           * FIXED: contentColumns is the flex-row container.
           * Both centerContent and rightPanel live here as siblings,
           * so they lay out side-by-side correctly.
           */}
          <View style={styles.contentColumns}>

            {/* ── CENTER: scrollable dashboard content ── */}
            <View style={styles.centerContent}>
              <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>

                {/* Welcome banner */}
                <View style={{
                  borderWidth: 1.5,
                  borderColor: '#c7d2fe',
                  borderRadius: 14,
                  paddingVertical: 20,
                  paddingHorizontal: 28,
                  marginBottom: 20,
                  backgroundColor: 'rgba(238,242,255,0.35)',
                }}>
                  <Text style={{
                    fontFamily: 'Poppins_600SemiBold',
                    fontSize: 16,
                    color: COLORS.textDark,
                    letterSpacing: 1.4,
                  }} selectable={false}>
                    WELCOME, {displayName?.toUpperCase()}
                  </Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <StatsCard
                    title="STUDENTS ENROLLED"
                    value={displayStudents}
                    growth="+ 12 %"
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled' as any)}
                  />
                  <StatsCard
                    title="SUBJECTS"
                    value={displaySubjects}
                    subtext="Active Curriculums"
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/MySubjectsWeb' as any)}
                  />
                  <StatsCard
                    title="JOINED DATE"
                    value={displayCreatedAt ? formatDate(displayCreatedAt) : 'N/A'}
                    subtext={displayStatus === 'active' ? 'Verified Senior Partner' : 'Partner'}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/TeacherDashBoard/CongratsTeacher',
                        params: {
                          teacherName: displayName,
                          createdAt:   displayCreatedAt,
                          userEmail:   displayEmail,
                        },
                      })
                    }
                  />
                </View>

                {/* Promotion card */}
                <View style={{
                  backgroundColor: '#3B5BFE',
                  borderRadius: 18,
                  padding: 32,
                  marginBottom: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 180,
                  overflow: 'hidden',
                }}>
                  <View style={{ flex: 1, paddingRight: 32 }}>
                    <Text style={{
                      fontFamily: 'Poppins_700Bold',
                      fontSize: 26,
                      color: '#fff',
                      marginBottom: 10,
                    }} selectable={false}>Promote Your Profile</Text>
                    <Text style={{
                      fontFamily: 'Poppins_400Regular',
                      fontSize: 15,
                      color: 'rgba(255,255,255,0.88)',
                      lineHeight: 24,
                      marginBottom: 22,
                    }} selectable={false}>
                      Appear at the top of student searches in your region and increase enrollment by up to 4x .
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                      <View style={{
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderRadius: 30,
                        paddingHorizontal: 20,
                        paddingVertical: 2,
                        minWidth: 160,
                        justifyContent: 'center',
                      }}>
                        <Picker
                          selectedValue={selectedState}
                          onValueChange={handleStateChange}
                          style={{ color: '#fff', height: 44, fontSize: 14 }}
                          dropdownIconColor="rgba(255,255,255,0.8)"
                        >
                          <Picker.Item label="Select State" value="" color="#fff" />
                          {[
                            "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
                            "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
                            "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
                            "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
                            "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
                            "Jammu & Kashmir","Ladakh","Puducherry"
                          ].map(s => <Picker.Item key={s} label={s} value={s} color="#333" />)}
                        </Picker>
                      </View>
                      <Text style={{
                        fontFamily: 'Poppins_700Bold',
                        fontSize: 20,
                        color: '#fff',
                      }} selectable={false}>650 inr <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14 }}>/ mo</Text></Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 14,
                      paddingHorizontal: 28,
                      paddingVertical: 20,
                      minWidth: 180,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/Spotlights' as any)}
                  >
                    <Text style={{
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 16,
                      color: '#3B5BFE',
                    }} selectable={false}>Activate Spotlight</Text>
                  </TouchableOpacity>
                </View>

                {/* Enrollment Growth chart */}
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 24,
                  marginBottom: 24,
                }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: COLORS.textDark }} selectable={false}>
                      Enrollment Growth
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {/* State dropdown */}
                      <View style={{
                        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
                        minWidth: 150, backgroundColor: '#fff', overflow: 'hidden',
                      }}>
                        <Picker
                          selectedValue={selectedState}
                          onValueChange={handleStateChange}
                          style={{ height: 42, color: '#374151', fontSize: 13 }}
                          dropdownIconColor="#374151"
                        >
                          <Picker.Item label="State" value="" />
                          {Object.keys(stateEnrollmentData).map(s => (
                            <Picker.Item key={s} label={s} value={s} />
                          ))}
                        </Picker>
                      </View>
                      {/* Time filter dropdown */}
                      <View style={{
                        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
                        minWidth: 150, backgroundColor: '#fff', overflow: 'hidden',
                      }}>
                        <Picker
                          selectedValue={selectedTimeFilter}
                          onValueChange={handleTimeFilterChange}
                          style={{ height: 42, color: '#374151', fontSize: 13 }}
                          dropdownIconColor="#374151"
                        >
                          <Picker.Item label="Weekly" value="6months" />
                          <Picker.Item label="Monthly" value="3months" />
                          <Picker.Item label="Yearly" value="1year" />
                          <Picker.Item label="Last Month" value="1month" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  {/* Chart area */}
                  <View style={{ flexDirection: 'row', minHeight: 320 }}>
                    {/* Y-axis */}
                    <View style={{ width: 40, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, paddingBottom: 32, paddingTop: 8 }}>
                      {['4K','3K','2K','1K','0'].map((l, i) => (
                        <Text key={i} style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#9ca3af' }} selectable={false}>{l}</Text>
                      ))}
                    </View>

                    {/* Bars area */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      {chartLoading ? (
                        <View style={{ justifyContent: 'center', alignItems: 'center', width: 400, height: 280 }}>
                          <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                          <Text style={{ marginTop: 10, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary }} selectable={false}>
                            Loading enrollment data...
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 300, paddingBottom: 32, gap: 0 }}>
                          {(enrollmentData.length > 0 ? enrollmentData : CHART_DATA.map(d => ({ month: d.month, value: d.value }))).map((point, idx, arr) => {
                            const maxVal = Math.max(...arr.map(d => d.value || 0), 4000);
                            const barH = ((point.value || 0) / maxVal) * 240;
                            const barW = Math.max(50, Math.min(80, (Dimensions.get('window').width * 0.45) / arr.length - 10));
                            return (
                              <View key={idx} style={{ alignItems: 'center', marginHorizontal: 8, justifyContent: 'flex-end', height: 268 }}>
                                {/* Grid line simulation via bar container */}
                                <View style={{
                                  width: barW,
                                  height: barH,
                                  backgroundColor: '#4255ff',
                                  borderTopLeftRadius: 6,
                                  borderTopRightRadius: 6,
                                  opacity: 0.85,
                                }} />
                                <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#6b7280', marginTop: 8 }} selectable={false}>
                                  {point.month}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>

                {/* On mobile, show thoughts panel inline below main content */}
                {isMobile && Platform.OS === 'web' && (
                  <View style={styles.mobileThoughtsPanel}>
                    <View style={styles.rightPanelHeader}>
                      <Text style={styles.rightPanelTitle} selectable={false}>Thoughts</Text>
                      <TouchableOpacity
                        style={styles.collapseBtn}
                        onPress={() => setIsThoughtsCollapsed(p => !p)}
                      >
                        <Ionicons
                          name={isThoughtsCollapsed ? 'chevron-down' : 'chevron-up'}
                          size={16}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {!isThoughtsCollapsed && (
                      <>
                        <View style={styles.composerWrapper}>
                          <TeacherPostComposer
                            onCreatePost={handleCreatePost}
                            placeholder="Share your thoughts..."
                          />
                        </View>
                        <UnifiedThoughtsBackground>
                          {postsLoading && posts.length === 0 && (
                            <View style={styles.thoughtsLoadingContainer}>
                              <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                              <Text style={styles.thoughtsLoadingText} selectable={false}>
                                Loading thoughts...
                              </Text>
                            </View>
                          )}
                          {!postsLoading && posts.length === 0 && (
                            <View style={styles.emptyState}>
                              <Ionicons name="chatbubble-outline" size={40} color={COLORS.textSecondary} />
                              <Text style={styles.emptyStateTitle} selectable={false}>No thoughts yet</Text>
                              <Text style={styles.emptyStateText} selectable={false}>
                                Be the first to share your thoughts!
                              </Text>
                            </View>
                          )}
                          {posts.map(post => (
                            <View key={post.id} style={styles.postWrapper}>
                              <UnifiedThoughtsCard
                                post={post}
                                userProfileCache={userProfileCache}
                                getProfileImageSource={getProfileImageSource}
                                initials={initials}
                                resolvePostAuthor={resolvePostAuthor}
                                isTeacherContext={true}
                                onLike={id => setPosts(ps => ps.map(p =>
                                  p.id === id
                                    ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                                    : p
                                ))}
                                onComment={() => {}}
                                onReport={() => {}}
                              />
                            </View>
                          ))}
                        </UnifiedThoughtsBackground>
                      </>
                    )}
                  </View>
                )}

              </ScrollView>
            </View>

            {/*
             * ── RIGHT PANEL: Thoughts ──────────────────────────────────────
             * Placed INSIDE contentColumns so it sits beside centerContent
             * in a flex-row. Hidden on mobile (handled inline above instead).
             */}
            {showThoughtsPanel && (
              <View style={[
                styles.rightPanel,
                isThoughtsCollapsed && styles.rightPanelCollapsed,
              ]}>
                <View style={styles.rightPanelHeader}>
                  <View style={styles.rightPanelTitleContainer}>
                    {!isThoughtsCollapsed && (
                      <Text style={styles.rightPanelTitle} selectable={false}>Thoughts</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.collapseBtn}
                    onPress={() => setIsThoughtsCollapsed(p => !p)}
                  >
                    <Ionicons
                      name={isThoughtsCollapsed ? 'chevron-forward' : 'chevron-back'}
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {!isThoughtsCollapsed && (
                  <>
                    <View style={styles.composerWrapper}>
                      <TeacherPostComposer
                        onCreatePost={handleCreatePost}
                        placeholder="Share your thoughts..."
                      />
                    </View>

                    <UnifiedThoughtsBackground>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.thoughtsList}
                        style={styles.thoughtsScrollView}
                      >
                        {postsLoading && posts.length === 0 && (
                          <View style={styles.thoughtsLoadingContainer}>
                            <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                            <Text style={styles.thoughtsLoadingText} selectable={false}>
                              Loading thoughts...
                            </Text>
                          </View>
                        )}

                        {!postsLoading && posts.length === 0 && (
                          <View style={styles.emptyState}>
                            <Ionicons name="chatbubble-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={styles.emptyStateTitle} selectable={false}>No thoughts yet</Text>
                            <Text style={styles.emptyStateText} selectable={false}>
                              Be the first to share your thoughts!
                            </Text>
                          </View>
                        )}

                        {posts.map(post => (
                          <View key={post.id} style={styles.postWrapper}>
                            <UnifiedThoughtsCard
                              post={post}
                              userProfileCache={userProfileCache}
                              getProfileImageSource={getProfileImageSource}
                              initials={initials}
                              resolvePostAuthor={resolvePostAuthor}
                              isTeacherContext={true}
                              onLike={id =>
                                setPosts(ps =>
                                  ps.map(p =>
                                    p.id === id
                                      ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                                      : p
                                  )
                                )
                              }
                              onComment={() => {}}
                              onReport={() => {}}
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </UnifiedThoughtsBackground>
                  </>
                )}
              </View>
            )}

          </View>{/* end contentColumns */}
        </View>{/* end mainWrapper */}
      </View>{/* end contentLayout */}
    </View>  /* end container */
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // Platform-safe minHeight (avoids '100vh' string on native)
    ...Platform.select({
      web:     { minHeight: '100vh' as any },
      default: { flex: 1 },
    }),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },

  // ── Outer layout ──────────────────────────────────────────────────────────
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Content columns: flex row containing center + right panel ────────────
  contentColumns: {
    flex: 1,
    flexDirection: 'row',   // <── critical: side-by-side layout
  },
  centerContent: {
    flex: 1,
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 24,
    minWidth: 0,            // allows flex shrink properly
  },
  mainScroll: {
    flex: 1,
  },

  // ── Right panel (desktop) ─────────────────────────────────────────────────
  rightPanel: {
    width: 360,
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 24,
    flexDirection: 'column',
  },
  rightPanelCollapsed: {
    width: 52,
    paddingHorizontal: 8,
  },
  rightPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rightPanelTitleContainer: {
    flex: 1,
  },
  rightPanelTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },
  collapseBtn: {
    padding: 6,
    borderRadius: 8,
  },

  // ── Mobile thoughts panel (inline, below main content) ───────────────────
  mobileThoughtsPanel: {
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 16,
    marginBottom: 20,
  },

  // ── Thoughts feed ─────────────────────────────────────────────────────────
  composerWrapper: {
    marginBottom: 16,
  },
  thoughtsScrollView: {
    flex: 1,
  },
  thoughtsList: {
    paddingBottom: 24,
    gap: 8,
  },
  postWrapper: {
    marginBottom: 4,
  },
  thoughtsLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  thoughtsLoadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textDark,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statsCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  statsTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsValue: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
  },
  statsGrowth: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#22c55e',
  },
  statsSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ── Welcome banner ────────────────────────────────────────────────────────
  welcomeBannerScreen: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  welcomeTextScreen: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.textDark,
    letterSpacing: 0.5,
  },

  // ── Promo card ────────────────────────────────────────────────────────────
  promoCardScreen: {
    height: 200,
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  promoContentScreen: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 22,
  },
  promoLeftScreen: {
    flex: 1,
    paddingRight: 24,
  },
  promoTitleScreen: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 8,
  },
  promoTextScreen: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 14,
  },
  promoActionsScreen: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingTextScreen: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  spotlightBtnScreen: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
  },
  spotlightBtnTextScreen: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.primaryBlue,
  },

  // ── Enrollment chart ──────────────────────────────────────────────────────
  chartContainerScreen: {
    backgroundColor: COLORS.white,
    padding: 22,
    borderRadius: 15,
    marginBottom: 24,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(0,0,0,0.07)' } as any,
    }),
  },
  chartHeaderScreen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitleScreen: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
  },
  chartFiltersScreen: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dropDownWrapperScreen: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    minWidth: 140,
    backgroundColor: COLORS.white,
  },
  pickerScreen: {
    height: 40,
    color: '#374151',
    fontSize: 13,
  },
  chartAreaWrapperScreen: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 300,
  },
  yAxisScreen: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabelScreen: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textSecondary,
  },
  chartLoadingWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
    paddingHorizontal: 40,
  },
  chartLoadingText: {
    marginTop: 10,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
  },

  // ── Filter button ─────────────────────────────────────────────────────────
  filterBtn: {
    flexDirection: 'row',       // FIXED: was missing, causing icon/text overlap
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  filterBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});