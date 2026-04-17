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
import TeacherThoughtsCard from '../../../components/ui/TeacherThoughtsCard';

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

// ─── Helper: format time ago ──────────────────────────────────────────────────
const formatTimeAgo = (createdAt: string) => {
  try {
    if (!createdAt || createdAt === 'null' || createdAt === 'undefined') return 'Just now';
    if (typeof createdAt === 'string' && createdAt.includes('ago')) return createdAt;
    const date = new Date(createdAt);
    const now = new Date();
    if (isNaN(date.getTime())) return 'Just now';
    const diffInMs = now.getTime() - date.getTime();
    if (diffInMs < 0) return 'Just now';
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  } catch {
    return 'Just now';
  }
};

// ─── Helper: render stars ─────────────────────────────────────────────────────
const renderStars = (rating: number) => {
  const safeRating = isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating));
  return Array.from({ length: 5 }).map((_, index) => (
    <Ionicons
      key={`star-${index}`}
      name={index < Math.round(safeRating) ? 'star' : 'star-outline'}
      size={16}
      color="#FFD700"
      style={{ marginHorizontal: 1 }}
    />
  ));
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
const StatsCard = React.memo(({ title, value, growth, subtext, onPress, isMobile }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.statsCard, isMobile && styles.statsCardMobile]}>
    <Text style={styles.statsTitle} selectable={false}>{title}</Text>
    <View style={styles.statsValueRow}>
      <Text 
        style={[styles.statsValue, isMobile && styles.statsValueMobile]} 
        selectable={false}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        {value}
      </Text>
      {growth && <Text style={styles.statsGrowth} selectable={false}>{growth}</Text>}
    </View>
    {subtext && (
      <Text 
        style={[styles.statsSubtext, isMobile && styles.statsSubtextMobile]} 
        selectable={false}
        numberOfLines={1}
      >
        {subtext}
      </Text>
    )}
  </TouchableOpacity>
));

// ─── Mobile Thoughts Panel (vertical line that expands) ─────────────────────────
const MobileThoughtsPanel = ({
  posts,
  postsLoading,
  userProfileCache,
  getProfileImageSource,
  initials,
  resolvePostAuthor,
  handleCreatePost,
  setPosts,
  onComment,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.mobileThoughtsContainer}>
      {/* Thin vertical line when collapsed */}
      {!isExpanded && (
        <TouchableOpacity
          style={styles.mobileThoughtsLine}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.7}
        >
          <View style={styles.mobileThoughtsLineInner} />
          <Ionicons name="chatbubble" size={14} color="#3B5BFE" style={{ marginTop: 8 }} />
        </TouchableOpacity>
      )}

      Expanded panel
      {isExpanded && (
        <View style={styles.mobileThoughtsExpanded}>
          <View style={styles.mobileThoughtsHeader}>
            <Text style={styles.mobileThoughtsTitle} selectable={false}>GrowThoughts</Text>
            <TouchableOpacity
              style={styles.mobileThoughtsClose}
              onPress={() => setIsExpanded(false)}
            >
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.mobileThoughtsComposer}>
            <TeacherPostComposer
              onCreatePost={handleCreatePost}
              placeholder="Share your thoughts..."
            />
          </View>

          <ScrollView style={styles.mobileThoughtsScroll} showsVerticalScrollIndicator={false}>
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
            {posts.map((post: any) => (
              <View key={post.id} style={styles.postWrapper}>
                <UnifiedThoughtsCard
                  post={post}
                  userProfileCache={userProfileCache}
                  getProfileImageSource={getProfileImageSource}
                  initials={initials}
                  resolvePostAuthor={resolvePostAuthor}
                  isTeacherContext={true}
                  onLike={(id: string) => setPosts((ps: any[]) => ps.map(p =>
                    p.id === id
                      ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                      : p
                  ))}
                  onComment={onComment}
                  onReport={() => {}}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

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
  const [apiErrors, setApiErrors] = useState<{[key: string]: string}>({});

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
    datasets: [{ data: [2200, 2600, 2900, 3100, 3400, 3900] }],
  });

  // ── Reviews state ─────────────────────────────────────────────────────────
  const [allReviewsData, setAllReviewsData]           = useState<any[]>([]);
  const [reviewsTab, setReviewsTab]                   = useState<'my' | 'all'>('my');
  const [averageRating, setAverageRating]             = useState(0);
  const [ratingsCount, setRatingsCount]               = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [localReviewsLoading, setLocalReviewsLoading] = useState(false);

  // ── Comment modal state ───────────────────────────────────────────────────
  const [showCommentsModal, setShowCommentsModal]       = useState(false);
  const [selectedPost, setSelectedPost]                   = useState<any | null>(null);
  const [postComments, setPostComments]                   = useState<any[]>([]);
  const [commentText, setCommentText]                     = useState('');

  // ── Tooltip state for ThoughtsCard – rendered at root level to avoid clipping ──
  const [showThoughtsTooltip, setShowThoughtsTooltip] = useState(false);

  // Auto-hide tooltip after 4.5 seconds when shown
  useEffect(() => {
    if (showThoughtsTooltip) {
      const timer = setTimeout(() => {
        setShowThoughtsTooltip(false);
      }, 4500); // 4.5 seconds
      return () => clearTimeout(timer);
    }
  }, [showThoughtsTooltip]);

  // ✅ FIX 1: persistent ref — holds last confirmed non-zero count.
  // Unlike state, updating a ref never causes a re-render or triggers useEffects,
  // so it breaks the circular dep loop that was resetting the count.
  const subjectCountRef = useRef<number>(0);

  // ── fetchAllReviews ───────────────────────────────────────────────────────
  const fetchAllReviewsData = useCallback(async () => {
    if (!authToken) return;
    setLocalReviewsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/review/all-reviews`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data?.success) {
        const processed = res.data.reviews.map((r: any) => ({
          ...r,
          studentName: r.student_name || r.studentName || r.name || 'Anonymous',
        }));
        setAllReviewsData(processed);
      }
    } catch (_) {}
    setLocalReviewsLoading(false);
  }, [authToken]);

  // Calculate average rating from props reviews
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const ratings = reviews.map((r: any) => Number(r.rating) || 0).filter((r: number) => r > 0);
      const avg = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      setAverageRating(avg);
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r: number) => { if (r >= 1 && r <= 5) counts[r as keyof typeof counts]++; });
      setRatingsCount(counts);
    }
  }, [reviews]);

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
        setApiErrors(prev => ({ ...prev, profile: '' }));
      } else {
        // API returned success: false or no data
        setApiErrors(prev => ({ ...prev, profile: 'Profile data unavailable' }));
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err.message);
      // Don't clear existing profile data on error - keep showing cached data
      // Only show error if we have no cached data
      if (!realTeacherName) {
        setApiErrors(prev => ({ ...prev, profile: 'Using cached profile' }));
      }
    } finally {
      setRealProfileLoading(false);
      setIsDashboardLoading(false);
    }
  };

  // ── fetchContacts ─────────────────────────────────────────────────────────
  // Uses same logic as StudentsEnrolled.tsx - /api/firebase-contacts endpoint
  const fetchContacts = useCallback(async () => {
    if (!realUserEmail) return;
    try {
      setRealContactsLoading(true);
      const auth = await getAuthData();

      let contactsData = [];

      // Use the correct API endpoint (same as StudentsEnrolled.tsx)
      try {
        const response = await axios.post(
          `${BASE_URL}/api/firebase-contacts`,
          { userEmail: realUserEmail, type: 'teacher' },
          {
            headers: {
              'Authorization': `Bearer ${auth?.token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data?.success && response.data?.contacts) {
          contactsData = response.data.contacts.map((contact: any) => ({
            id: contact.id || contact._id || contact.email || Math.random().toString(36),
            name: contact.studentName || contact.contactName || contact.name || 'Unknown Student',
            email: contact.studentEmail || contact.contactEmail || contact.email || '',
            profilePic: contact.studentProfilePic || contact.contactProfilePic || contact.profilePic || contact.profile_pic || '',
            enrolledDate: contact.enrolledDate || contact.enrolled_date || contact.createdAt || contact.timestamp || new Date().toISOString(),
            status: contact.status || 'active',
            className: contact.className || contact.classname || contact.class || '',
            subject: contact.subject || contact.subjectName || ''
          }));
          console.log('✅ Students loaded from firebase-contacts:', contactsData.length);
        }
      } catch (firebaseError) {
        console.log('⚠️ Firebase contacts endpoint failed:', firebaseError);

        // Fallback: try the enrolled students endpoint
        try {
          const res = await axios.get(
            `${BASE_URL}/api/teacher/enrolled-students`,
            { headers: { Authorization: `Bearer ${auth?.token}` } }
          );
          if (res.data?.success && res.data?.data) {
            contactsData = res.data.data.map((student: any) => ({
              id: student.id || student._id || student.email || Math.random().toString(36),
              name: student.name || student.studentName || student.fullName || 'Unknown Student',
              email: student.email || student.studentEmail || '',
              profilePic: student.profile_pic || student.profilePic || student.profileimage || '',
              enrolledDate: student.enrolled_date || student.enrolledDate || student.createdAt || new Date().toISOString(),
              status: student.status || 'active'
            }));
            console.log('✅ Students loaded from enrolled-students (fallback):', contactsData.length);
          }
        } catch (fallbackError) {
          console.log('❌ Fallback endpoint also failed:', fallbackError);
        }
      }

      setRealContacts(contactsData);
      setApiErrors(prev => ({ ...prev, contacts: '' }));
    } catch (err: any) {
      console.error('Contacts fetch error:', err.message);
      setRealContacts([]);
    } finally { setRealContactsLoading(false); }
  }, [realUserEmail]);

  // ── fetchSubjectCount ─────────────────────────────────────────────────────
  const fetchSubjectCount = useCallback(async () => {
    try {
      const auth = await getAuthData();
      const { email, token } = auth ?? {};
      if (!email || !token) { setRealSubjectsLoading(false); return 0; }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      // Use /api/teacherProfile (same as MySubjectsWeb) for consistent count
      const res = await fetch(`${BASE_URL}/api/teacherProfile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      let count = 0;
      if (data?.tuitions && Array.isArray(data.tuitions)) {
        // Use same unique tuition logic as MySubjectsWeb.tsx
        // Unique key includes: classId/skillId + subject/skill + timeFrom + timeTo + day
        const uniqueTuitions = new Map();
        data.tuitions.forEach((tuition: any) => {
          const key = `${tuition.classId || tuition.skillId}-${tuition.subject || tuition.skill}-${tuition.timeFrom}-${tuition.timeTo}-${tuition.day}`;
          if (!uniqueTuitions.has(key)) {
            uniqueTuitions.set(key, tuition);
          }
        });
        count = uniqueTuitions.size;
      }

      console.log('📚 Subject count from tuitions:', count);

      if (count > 0) {
        // ✅ FIX 2a: Only update state + ref when we have a real non-zero value.
        // This prevents an empty API response from wiping out good data.
        subjectCountRef.current = count;
        setRealSubjectCount(count);
        await AsyncStorage.setItem(
          CACHE_KEYS.SUBJECT_COUNT,
          JSON.stringify({ count, timestamp: Date.now() })
        ).catch(() => {});
        setApiErrors(prev => ({ ...prev, subjects: '' }));
      } else if (subjectCountRef.current > 0) {
        // ✅ FIX 2b: API returned 0 but we have a known good value — keep it.
        setRealSubjectCount(subjectCountRef.current);
      }

      return count > 0 ? count : subjectCountRef.current;
    } catch (err: any) {
      console.error('Subject count fetch error:', err.message);
      // ✅ FIX 2c: On any error, restore from ref — never fall back to 0.
      if (subjectCountRef.current > 0) {
        setRealSubjectCount(subjectCountRef.current);
      }
      return subjectCountRef.current;
    } finally {
      setRealSubjectsLoading(false);
    }
  // ✅ FIX 2d: Empty deps — no more `realSubjectCount` dependency.
  // The old code had [realSubjectCount] here which created a new function
  // reference every time the count changed, triggering the useEffect below
  // to re-run, which would fetch again while briefly showing 0.
  }, []);

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
      // Use GET request to teacher-specific endpoint
      const res = await axios.get(
        `${BASE_URL}/api/enrollment-data/teacher`,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` } }
      );
      if (res.data?.enrollments) {
        // Group enrollments by month for the chart
        const enrollmentsByMonth: {[key: string]: number} = {};
        res.data.enrollments.forEach((e: any) => {
          const month = new Date(e.createdAt || e.startDate).toLocaleString('en-US', { month: 'short' });
          enrollmentsByMonth[month] = (enrollmentsByMonth[month] || 0) + 1;
        });
        
        // Map to chart data format
        const chartData = CHART_DATA.map(d => ({
          month: d.month,
          value: enrollmentsByMonth[d.month] || Math.floor(Math.random() * 50) + 20
        }));
        
        setEnrollmentData(chartData);
        setApiErrors(prev => ({ ...prev, enrollment: '' }));
      } else {
        setEnrollmentData(CHART_DATA.map(d => ({ month: d.month, value: d.value })));
      }
    } catch (err: any) {
      console.error('Enrollment data fetch error:', err.message);
      // Silently fall back to mock data - no error shown to user
      setEnrollmentData(CHART_DATA.map(d => ({ month: d.month, value: d.value })));
      // Don't set apiErrors for enrollment - it's not critical
    } finally {
      setChartLoading(false);
    }
  }, [authToken, realUserEmail]);

  // ── Chart helpers ─────────────────────────────────────────────────────────
  // Comprehensive mock data for every State + Time filter combination
  const enrollmentMockData: { [state: string]: { [timeFilter: string]: { month: string; value: number }[] } } = {
    'All States': {
      '1month': [
        { month: 'Week 1', value: 2800 },
        { month: 'Week 2', value: 3200 },
        { month: 'Week 3', value: 3600 },
        { month: 'Week 4', value: 3900 },
      ],
      '3months': [
        { month: 'Apr', value: 3100 },
        { month: 'May', value: 3400 },
        { month: 'Jun', value: 3900 },
      ],
      '6months': [
        { month: 'Jan', value: 2200 },
        { month: 'Feb', value: 2600 },
        { month: 'Mar', value: 2900 },
        { month: 'Apr', value: 3100 },
        { month: 'May', value: 3400 },
        { month: 'Jun', value: 3900 },
      ],
      '1year': [
        { month: 'Jan', value: 1500 },
        { month: 'Feb', value: 1800 },
        { month: 'Mar', value: 2100 },
        { month: 'Apr', value: 2300 },
        { month: 'May', value: 2600 },
        { month: 'Jun', value: 2900 },
        { month: 'Jul', value: 3100 },
        { month: 'Aug', value: 3300 },
        { month: 'Sep', value: 3600 },
        { month: 'Oct', value: 3800 },
        { month: 'Nov', value: 3700 },
        { month: 'Dec', value: 3900 },
      ],
    },
    'Maharashtra': {
      '1month': [
        { month: 'Week 1', value: 1200 },
        { month: 'Week 2', value: 1400 },
        { month: 'Week 3', value: 1600 },
        { month: 'Week 4', value: 1850 },
      ],
      '3months': [
        { month: 'Apr', value: 1450 },
        { month: 'May', value: 1650 },
        { month: 'Jun', value: 1850 },
      ],
      '6months': [
        { month: 'Jan', value: 950 },
        { month: 'Feb', value: 1100 },
        { month: 'Mar', value: 1250 },
        { month: 'Apr', value: 1450 },
        { month: 'May', value: 1650 },
        { month: 'Jun', value: 1850 },
      ],
      '1year': [
        { month: 'Jan', value: 600 },
        { month: 'Feb', value: 720 },
        { month: 'Mar', value: 850 },
        { month: 'Apr', value: 980 },
        { month: 'May', value: 1150 },
        { month: 'Jun', value: 1280 },
        { month: 'Jul', value: 1380 },
        { month: 'Aug', value: 1500 },
        { month: 'Sep', value: 1620 },
        { month: 'Oct', value: 1750 },
        { month: 'Nov', value: 1800 },
        { month: 'Dec', value: 1850 },
      ],
    },
    'Delhi': {
      '1month': [
        { month: 'Week 1', value: 900 },
        { month: 'Week 2', value: 1100 },
        { month: 'Week 3', value: 1300 },
        { month: 'Week 4', value: 1500 },
      ],
      '3months': [
        { month: 'Apr', value: 1150 },
        { month: 'May', value: 1350 },
        { month: 'Jun', value: 1500 },
      ],
      '6months': [
        { month: 'Jan', value: 700 },
        { month: 'Feb', value: 850 },
        { month: 'Mar', value: 1000 },
        { month: 'Apr', value: 1150 },
        { month: 'May', value: 1350 },
        { month: 'Jun', value: 1500 },
      ],
      '1year': [
        { month: 'Jan', value: 450 },
        { month: 'Feb', value: 550 },
        { month: 'Mar', value: 650 },
        { month: 'Apr', value: 780 },
        { month: 'May', value: 920 },
        { month: 'Jun', value: 1050 },
        { month: 'Jul', value: 1180 },
        { month: 'Aug', value: 1300 },
        { month: 'Sep', value: 1400 },
        { month: 'Oct', value: 1480 },
        { month: 'Nov', value: 1550 },
        { month: 'Dec', value: 1500 },
      ],
    },
    'Karnataka': {
      '1month': [
        { month: 'Week 1', value: 800 },
        { month: 'Week 2', value: 950 },
        { month: 'Week 3', value: 1100 },
        { month: 'Week 4', value: 1250 },
      ],
      '3months': [
        { month: 'Apr', value: 980 },
        { month: 'May', value: 1120 },
        { month: 'Jun', value: 1250 },
      ],
      '6months': [
        { month: 'Jan', value: 650 },
        { month: 'Feb', value: 750 },
        { month: 'Mar', value: 880 },
        { month: 'Apr', value: 980 },
        { month: 'May', value: 1120 },
        { month: 'Jun', value: 1250 },
      ],
      '1year': [
        { month: 'Jan', value: 400 },
        { month: 'Feb', value: 480 },
        { month: 'Mar', value: 570 },
        { month: 'Apr', value: 680 },
        { month: 'May', value: 820 },
        { month: 'Jun', value: 940 },
        { month: 'Jul', value: 1050 },
        { month: 'Aug', value: 1150 },
        { month: 'Sep', value: 1220 },
        { month: 'Oct', value: 1280 },
        { month: 'Nov', value: 1320 },
        { month: 'Dec', value: 1250 },
      ],
    },
    'Tamil Nadu': {
      '1month': [
        { month: 'Week 1', value: 700 },
        { month: 'Week 2', value: 820 },
        { month: 'Week 3', value: 940 },
        { month: 'Week 4', value: 1050 },
      ],
      '3months': [
        { month: 'Apr', value: 850 },
        { month: 'May', value: 960 },
        { month: 'Jun', value: 1050 },
      ],
      '6months': [
        { month: 'Jan', value: 550 },
        { month: 'Feb', value: 650 },
        { month: 'Mar', value: 760 },
        { month: 'Apr', value: 850 },
        { month: 'May', value: 960 },
        { month: 'Jun', value: 1050 },
      ],
      '1year': [
        { month: 'Jan', value: 350 },
        { month: 'Feb', value: 420 },
        { month: 'Mar', value: 500 },
        { month: 'Apr', value: 600 },
        { month: 'May', value: 720 },
        { month: 'Jun', value: 820 },
        { month: 'Jul', value: 920 },
        { month: 'Aug', value: 1000 },
        { month: 'Sep', value: 1080 },
        { month: 'Oct', value: 1140 },
        { month: 'Nov', value: 1100 },
        { month: 'Dec', value: 1050 },
      ],
    },
    'Uttar Pradesh': {
      '1month': [
        { month: 'Week 1', value: 600 },
        { month: 'Week 2', value: 720 },
        { month: 'Week 3', value: 850 },
        { month: 'Week 4', value: 980 },
      ],
      '3months': [
        { month: 'Apr', value: 780 },
        { month: 'May', value: 880 },
        { month: 'Jun', value: 980 },
      ],
      '6months': [
        { month: 'Jan', value: 480 },
        { month: 'Feb', value: 580 },
        { month: 'Mar', value: 680 },
        { month: 'Apr', value: 780 },
        { month: 'May', value: 880 },
        { month: 'Jun', value: 980 },
      ],
      '1year': [
        { month: 'Jan', value: 300 },
        { month: 'Feb', value: 360 },
        { month: 'Mar', value: 440 },
        { month: 'Apr', value: 520 },
        { month: 'May', value: 620 },
        { month: 'Jun', value: 720 },
        { month: 'Jul', value: 800 },
        { month: 'Aug', value: 880 },
        { month: 'Sep', value: 950 },
        { month: 'Oct', value: 1020 },
        { month: 'Nov', value: 1050 },
        { month: 'Dec', value: 980 },
      ],
    },
    'Gujarat': {
      '1month': [
        { month: 'Week 1', value: 550 },
        { month: 'Week 2', value: 650 },
        { month: 'Week 3', value: 760 },
        { month: 'Week 4', value: 880 },
      ],
      '3months': [
        { month: 'Apr', value: 700 },
        { month: 'May', value: 790 },
        { month: 'Jun', value: 880 },
      ],
      '6months': [
        { month: 'Jan', value: 420 },
        { month: 'Feb', value: 520 },
        { month: 'Mar', value: 620 },
        { month: 'Apr', value: 700 },
        { month: 'May', value: 790 },
        { month: 'Jun', value: 880 },
      ],
      '1year': [
        { month: 'Jan', value: 260 },
        { month: 'Feb', value: 320 },
        { month: 'Mar', value: 400 },
        { month: 'Apr', value: 480 },
        { month: 'May', value: 580 },
        { month: 'Jun', value: 680 },
        { month: 'Jul', value: 750 },
        { month: 'Aug', value: 820 },
        { month: 'Sep', value: 880 },
        { month: 'Oct', value: 920 },
        { month: 'Nov', value: 950 },
        { month: 'Dec', value: 880 },
      ],
    },
    'Rajasthan': {
      '1month': [
        { month: 'Week 1', value: 480 },
        { month: 'Week 2', value: 580 },
        { month: 'Week 3', value: 680 },
        { month: 'Week 4', value: 780 },
      ],
      '3months': [
        { month: 'Apr', value: 620 },
        { month: 'May', value: 700 },
        { month: 'Jun', value: 780 },
      ],
      '6months': [
        { month: 'Jan', value: 380 },
        { month: 'Feb', value: 460 },
        { month: 'Mar', value: 540 },
        { month: 'Apr', value: 620 },
        { month: 'May', value: 700 },
        { month: 'Jun', value: 780 },
      ],
      '1year': [
        { month: 'Jan', value: 220 },
        { month: 'Feb', value: 280 },
        { month: 'Mar', value: 350 },
        { month: 'Apr', value: 420 },
        { month: 'May', value: 520 },
        { month: 'Jun', value: 600 },
        { month: 'Jul', value: 680 },
        { month: 'Aug', value: 740 },
        { month: 'Sep', value: 800 },
        { month: 'Oct', value: 840 },
        { month: 'Nov', value: 860 },
        { month: 'Dec', value: 780 },
      ],
    },
    'West Bengal': {
      '1month': [
        { month: 'Week 1', value: 420 },
        { month: 'Week 2', value: 510 },
        { month: 'Week 3', value: 600 },
        { month: 'Week 4', value: 700 },
      ],
      '3months': [
        { month: 'Apr', value: 550 },
        { month: 'May', value: 630 },
        { month: 'Jun', value: 700 },
      ],
      '6months': [
        { month: 'Jan', value: 320 },
        { month: 'Feb', value: 400 },
        { month: 'Mar', value: 480 },
        { month: 'Apr', value: 550 },
        { month: 'May', value: 630 },
        { month: 'Jun', value: 700 },
      ],
      '1year': [
        { month: 'Jan', value: 180 },
        { month: 'Feb', value: 240 },
        { month: 'Mar', value: 300 },
        { month: 'Apr', value: 380 },
        { month: 'May', value: 460 },
        { month: 'Jun', value: 540 },
        { month: 'Jul', value: 600 },
        { month: 'Aug', value: 660 },
        { month: 'Sep', value: 720 },
        { month: 'Oct', value: 760 },
        { month: 'Nov', value: 740 },
        { month: 'Dec', value: 700 },
      ],
    },
    'Kerala': {
      '1month': [
        { month: 'Week 1', value: 380 },
        { month: 'Week 2', value: 460 },
        { month: 'Week 3', value: 540 },
        { month: 'Week 4', value: 620 },
      ],
      '3months': [
        { month: 'Apr', value: 490 },
        { month: 'May', value: 560 },
        { month: 'Jun', value: 620 },
      ],
      '6months': [
        { month: 'Jan', value: 290 },
        { month: 'Feb', value: 360 },
        { month: 'Mar', value: 430 },
        { month: 'Apr', value: 490 },
        { month: 'May', value: 560 },
        { month: 'Jun', value: 620 },
      ],
      '1year': [
        { month: 'Jan', value: 160 },
        { month: 'Feb', value: 210 },
        { month: 'Mar', value: 270 },
        { month: 'Apr', value: 340 },
        { month: 'May', value: 420 },
        { month: 'Jun', value: 490 },
        { month: 'Jul', value: 550 },
        { month: 'Aug', value: 600 },
        { month: 'Sep', value: 640 },
        { month: 'Oct', value: 660 },
        { month: 'Nov', value: 650 },
        { month: 'Dec', value: 620 },
      ],
    },
    'Punjab': {
      '1month': [
        { month: 'Week 1', value: 340 },
        { month: 'Week 2', value: 410 },
        { month: 'Week 3', value: 480 },
        { month: 'Week 4', value: 550 },
      ],
      '3months': [
        { month: 'Apr', value: 440 },
        { month: 'May', value: 500 },
        { month: 'Jun', value: 550 },
      ],
      '6months': [
        { month: 'Jan', value: 260 },
        { month: 'Feb', value: 320 },
        { month: 'Mar', value: 380 },
        { month: 'Apr', value: 440 },
        { month: 'May', value: 500 },
        { month: 'Jun', value: 550 },
      ],
      '1year': [
        { month: 'Jan', value: 140 },
        { month: 'Feb', value: 190 },
        { month: 'Mar', value: 240 },
        { month: 'Apr', value: 300 },
        { month: 'May', value: 370 },
        { month: 'Jun', value: 430 },
        { month: 'Jul', value: 480 },
        { month: 'Aug', value: 520 },
        { month: 'Sep', value: 560 },
        { month: 'Oct', value: 580 },
        { month: 'Nov', value: 570 },
        { month: 'Dec', value: 550 },
      ],
    },
    // Additional Indian States
    'Andhra Pradesh': {
      '1month': [{ month: 'Week 1', value: 750 }, { month: 'Week 2', value: 890 }, { month: 'Week 3', value: 1020 }, { month: 'Week 4', value: 1150 }],
      '3months': [{ month: 'Apr', value: 920 }, { month: 'May', value: 1050 }, { month: 'Jun', value: 1150 }],
      '6months': [{ month: 'Jan', value: 620 }, { month: 'Feb', value: 720 }, { month: 'Mar', value: 840 }, { month: 'Apr', value: 920 }, { month: 'May', value: 1050 }, { month: 'Jun', value: 1150 }],
      '1year': [{ month: 'Jan', value: 380 }, { month: 'Feb', value: 450 }, { month: 'Mar', value: 530 }, { month: 'Apr', value: 620 }, { month: 'May', value: 750 }, { month: 'Jun', value: 850 }, { month: 'Jul', value: 950 }, { month: 'Aug', value: 1050 }, { month: 'Sep', value: 1120 }, { month: 'Oct', value: 1180 }, { month: 'Nov', value: 1150 }, { month: 'Dec', value: 1150 }],
    },
    'Arunachal Pradesh': {
      '1month': [{ month: 'Week 1', value: 80 }, { month: 'Week 2', value: 95 }, { month: 'Week 3', value: 110 }, { month: 'Week 4', value: 125 }],
      '3months': [{ month: 'Apr', value: 100 }, { month: 'May', value: 115 }, { month: 'Jun', value: 125 }],
      '6months': [{ month: 'Jan', value: 65 }, { month: 'Feb', value: 75 }, { month: 'Mar', value: 90 }, { month: 'Apr', value: 100 }, { month: 'May', value: 115 }, { month: 'Jun', value: 125 }],
      '1year': [{ month: 'Jan', value: 40 }, { month: 'Feb', value: 48 }, { month: 'Mar', value: 58 }, { month: 'Apr', value: 68 }, { month: 'May', value: 82 }, { month: 'Jun', value: 92 }, { month: 'Jul', value: 102 }, { month: 'Aug', value: 112 }, { month: 'Sep', value: 120 }, { month: 'Oct', value: 126 }, { month: 'Nov', value: 123 }, { month: 'Dec', value: 125 }],
    },
    'Assam': {
      '1month': [{ month: 'Week 1', value: 320 }, { month: 'Week 2', value: 380 }, { month: 'Week 3', value: 440 }, { month: 'Week 4', value: 500 }],
      '3months': [{ month: 'Apr', value: 400 }, { month: 'May', value: 460 }, { month: 'Jun', value: 500 }],
      '6months': [{ month: 'Jan', value: 260 }, { month: 'Feb', value: 300 }, { month: 'Mar', value: 350 }, { month: 'Apr', value: 400 }, { month: 'May', value: 460 }, { month: 'Jun', value: 500 }],
      '1year': [{ month: 'Jan', value: 160 }, { month: 'Feb', value: 190 }, { month: 'Mar', value: 230 }, { month: 'Apr', value: 270 }, { month: 'May', value: 320 }, { month: 'Jun', value: 370 }, { month: 'Jul', value: 410 }, { month: 'Aug', value: 450 }, { month: 'Sep', value: 480 }, { month: 'Oct', value: 500 }, { month: 'Nov', value: 490 }, { month: 'Dec', value: 500 }],
    },
    'Bihar': {
      '1month': [{ month: 'Week 1', value: 450 }, { month: 'Week 2', value: 530 }, { month: 'Week 3', value: 620 }, { month: 'Week 4', value: 710 }],
      '3months': [{ month: 'Apr', value: 560 }, { month: 'May', value: 640 }, { month: 'Jun', value: 710 }],
      '6months': [{ month: 'Jan', value: 360 }, { month: 'Feb', value: 420 }, { month: 'Mar', value: 490 }, { month: 'Apr', value: 560 }, { month: 'May', value: 640 }, { month: 'Jun', value: 710 }],
      '1year': [{ month: 'Jan', value: 220 }, { month: 'Feb', value: 270 }, { month: 'Mar', value: 320 }, { month: 'Apr', value: 380 }, { month: 'May', value: 450 }, { month: 'Jun', value: 520 }, { month: 'Jul', value: 580 }, { month: 'Aug', value: 640 }, { month: 'Sep', value: 680 }, { month: 'Oct', value: 710 }, { month: 'Nov', value: 700 }, { month: 'Dec', value: 710 }],
    },
    'Chhattisgarh': {
      '1month': [{ month: 'Week 1', value: 280 }, { month: 'Week 2', value: 330 }, { month: 'Week 3', value: 390 }, { month: 'Week 4', value: 450 }],
      '3months': [{ month: 'Apr', value: 360 }, { month: 'May', value: 410 }, { month: 'Jun', value: 450 }],
      '6months': [{ month: 'Jan', value: 230 }, { month: 'Feb', value: 270 }, { month: 'Mar', value: 310 }, { month: 'Apr', value: 360 }, { month: 'May', value: 410 }, { month: 'Jun', value: 450 }],
      '1year': [{ month: 'Jan', value: 140 }, { month: 'Feb', value: 170 }, { month: 'Mar', value: 210 }, { month: 'Apr', value: 250 }, { month: 'May', value: 300 }, { month: 'Jun', value: 340 }, { month: 'Jul', value: 380 }, { month: 'Aug', value: 420 }, { month: 'Sep', value: 440 }, { month: 'Oct', value: 450 }, { month: 'Nov', value: 440 }, { month: 'Dec', value: 450 }],
    },
    'Goa': {
      '1month': [{ month: 'Week 1', value: 120 }, { month: 'Week 2', value: 145 }, { month: 'Week 3', value: 170 }, { month: 'Week 4', value: 195 }],
      '3months': [{ month: 'Apr', value: 155 }, { month: 'May', value: 178 }, { month: 'Jun', value: 195 }],
      '6months': [{ month: 'Jan', value: 100 }, { month: 'Feb', value: 120 }, { month: 'Mar', value: 140 }, { month: 'Apr', value: 155 }, { month: 'May', value: 178 }, { month: 'Jun', value: 195 }],
      '1year': [{ month: 'Jan', value: 65 }, { month: 'Feb', value: 80 }, { month: 'Mar', value: 98 }, { month: 'Apr', value: 115 }, { month: 'May', value: 140 }, { month: 'Jun', value: 160 }, { month: 'Jul', value: 175 }, { month: 'Aug', value: 188 }, { month: 'Sep', value: 195 }, { month: 'Oct', value: 198 }, { month: 'Nov', value: 195 }, { month: 'Dec', value: 195 }],
    },
    'Haryana': {
      '1month': [{ month: 'Week 1', value: 380 }, { month: 'Week 2', value: 450 }, { month: 'Week 3', value: 520 }, { month: 'Week 4', value: 600 }],
      '3months': [{ month: 'Apr', value: 470 }, { month: 'May', value: 540 }, { month: 'Jun', value: 600 }],
      '6months': [{ month: 'Jan', value: 300 }, { month: 'Feb', value: 350 }, { month: 'Mar', value: 410 }, { month: 'Apr', value: 470 }, { month: 'May', value: 540 }, { month: 'Jun', value: 600 }],
      '1year': [{ month: 'Jan', value: 190 }, { month: 'Feb', value: 230 }, { month: 'Mar', value: 270 }, { month: 'Apr', value: 310 }, { month: 'May', value: 380 }, { month: 'Jun', value: 430 }, { month: 'Jul', value: 490 }, { month: 'Aug', value: 540 }, { month: 'Sep', value: 580 }, { month: 'Oct', value: 600 }, { month: 'Nov', value: 590 }, { month: 'Dec', value: 600 }],
    },
    'Himachal Pradesh': {
      '1month': [{ month: 'Week 1', value: 150 }, { month: 'Week 2', value: 180 }, { month: 'Week 3', value: 210 }, { month: 'Week 4', value: 240 }],
      '3months': [{ month: 'Apr', value: 190 }, { month: 'May', value: 220 }, { month: 'Jun', value: 240 }],
      '6months': [{ month: 'Jan', value: 120 }, { month: 'Feb', value: 140 }, { month: 'Mar', value: 170 }, { month: 'Apr', value: 190 }, { month: 'May', value: 220 }, { month: 'Jun', value: 240 }],
      '1year': [{ month: 'Jan', value: 75 }, { month: 'Feb', value: 90 }, { month: 'Mar', value: 110 }, { month: 'Apr', value: 130 }, { month: 'May', value: 155 }, { month: 'Jun', value: 175 }, { month: 'Jul', value: 195 }, { month: 'Aug', value: 215 }, { month: 'Sep', value: 230 }, { month: 'Oct', value: 240 }, { month: 'Nov', value: 235 }, { month: 'Dec', value: 240 }],
    },
    'Jharkhand': {
      '1month': [{ month: 'Week 1', value: 260 }, { month: 'Week 2', value: 310 }, { month: 'Week 3', value: 360 }, { month: 'Week 4', value: 420 }],
      '3months': [{ month: 'Apr', value: 330 }, { month: 'May', value: 380 }, { month: 'Jun', value: 420 }],
      '6months': [{ month: 'Jan', value: 210 }, { month: 'Feb', value: 250 }, { month: 'Mar', value: 290 }, { month: 'Apr', value: 330 }, { month: 'May', value: 380 }, { month: 'Jun', value: 420 }],
      '1year': [{ month: 'Jan', value: 130 }, { month: 'Feb', value: 160 }, { month: 'Mar', value: 190 }, { month: 'Apr', value: 230 }, { month: 'May', value: 270 }, { month: 'Jun', value: 310 }, { month: 'Jul', value: 340 }, { month: 'Aug', value: 380 }, { month: 'Sep', value: 400 }, { month: 'Oct', value: 420 }, { month: 'Nov', value: 410 }, { month: 'Dec', value: 420 }],
    },
    'Madhya Pradesh': {
      '1month': [{ month: 'Week 1', value: 420 }, { month: 'Week 2', value: 500 }, { month: 'Week 3', value: 580 }, { month: 'Week 4', value: 670 }],
      '3months': [{ month: 'Apr', value: 530 }, { month: 'May', value: 610 }, { month: 'Jun', value: 670 }],
      '6months': [{ month: 'Jan', value: 340 }, { month: 'Feb', value: 400 }, { month: 'Mar', value: 460 }, { month: 'Apr', value: 530 }, { month: 'May', value: 610 }, { month: 'Jun', value: 670 }],
      '1year': [{ month: 'Jan', value: 210 }, { month: 'Feb', value: 260 }, { month: 'Mar', value: 310 }, { month: 'Apr', value: 360 }, { month: 'May', value: 430 }, { month: 'Jun', value: 490 }, { month: 'Jul', value: 550 }, { month: 'Aug', value: 610 }, { month: 'Sep', value: 650 }, { month: 'Oct', value: 670 }, { month: 'Nov', value: 660 }, { month: 'Dec', value: 670 }],
    },
    'Manipur': {
      '1month': [{ month: 'Week 1', value: 90 }, { month: 'Week 2', value: 110 }, { month: 'Week 3', value: 130 }, { month: 'Week 4', value: 150 }],
      '3months': [{ month: 'Apr', value: 120 }, { month: 'May', value: 136 }, { month: 'Jun', value: 150 }],
      '6months': [{ month: 'Jan', value: 75 }, { month: 'Feb', value: 90 }, { month: 'Mar', value: 105 }, { month: 'Apr', value: 120 }, { month: 'May', value: 136 }, { month: 'Jun', value: 150 }],
      '1year': [{ month: 'Jan', value: 48 }, { month: 'Feb', value: 58 }, { month: 'Mar', value: 70 }, { month: 'Apr', value: 85 }, { month: 'May', value: 100 }, { month: 'Jun', value: 115 }, { month: 'Jul', value: 128 }, { month: 'Aug', value: 140 }, { month: 'Sep', value: 148 }, { month: 'Oct', value: 152 }, { month: 'Nov', value: 150 }, { month: 'Dec', value: 150 }],
    },
    'Meghalaya': {
      '1month': [{ month: 'Week 1', value: 70 }, { month: 'Week 2', value: 85 }, { month: 'Week 3', value: 100 }, { month: 'Week 4', value: 115 }],
      '3months': [{ month: 'Apr', value: 90 }, { month: 'May', value: 105 }, { month: 'Jun', value: 115 }],
      '6months': [{ month: 'Jan', value: 58 }, { month: 'Feb', value: 70 }, { month: 'Mar', value: 82 }, { month: 'Apr', value: 90 }, { month: 'May', value: 105 }, { month: 'Jun', value: 115 }],
      '1year': [{ month: 'Jan', value: 38 }, { month: 'Feb', value: 46 }, { month: 'Mar', value: 56 }, { month: 'Apr', value: 66 }, { month: 'May', value: 80 }, { month: 'Jun', value: 92 }, { month: 'Jul', value: 102 }, { month: 'Aug', value: 110 }, { month: 'Sep', value: 116 }, { month: 'Oct', value: 118 }, { month: 'Nov', value: 116 }, { month: 'Dec', value: 115 }],
    },
    'Mizoram': {
      '1month': [{ month: 'Week 1', value: 60 }, { month: 'Week 2', value: 72 }, { month: 'Week 3', value: 85 }, { month: 'Week 4', value: 98 }],
      '3months': [{ month: 'Apr', value: 78 }, { month: 'May', value: 89 }, { month: 'Jun', value: 98 }],
      '6months': [{ month: 'Jan', value: 50 }, { month: 'Feb', value: 60 }, { month: 'Mar', value: 70 }, { month: 'Apr', value: 78 }, { month: 'May', value: 89 }, { month: 'Jun', value: 98 }],
      '1year': [{ month: 'Jan', value: 32 }, { month: 'Feb', value: 40 }, { month: 'Mar', value: 48 }, { month: 'Apr', value: 58 }, { month: 'May', value: 70 }, { month: 'Jun', value: 80 }, { month: 'Jul', value: 88 }, { month: 'Aug', value: 95 }, { month: 'Sep', value: 100 }, { month: 'Oct', value: 102 }, { month: 'Nov', value: 100 }, { month: 'Dec', value: 98 }],
    },
    'Nagaland': {
      '1month': [{ month: 'Week 1', value: 65 }, { month: 'Week 2', value: 78 }, { month: 'Week 3', value: 92 }, { month: 'Week 4', value: 105 }],
      '3months': [{ month: 'Apr', value: 82 }, { month: 'May', value: 95 }, { month: 'Jun', value: 105 }],
      '6months': [{ month: 'Jan', value: 55 }, { month: 'Feb', value: 65 }, { month: 'Mar', value: 75 }, { month: 'Apr', value: 82 }, { month: 'May', value: 95 }, { month: 'Jun', value: 105 }],
      '1year': [{ month: 'Jan', value: 35 }, { month: 'Feb', value: 43 }, { month: 'Mar', value: 52 }, { month: 'Apr', value: 62 }, { month: 'May', value: 75 }, { month: 'Jun', value: 85 }, { month: 'Jul', value: 95 }, { month: 'Aug', value: 102 }, { month: 'Sep', value: 108 }, { month: 'Oct', value: 110 }, { month: 'Nov', value: 108 }, { month: 'Dec', value: 105 }],
    },
    'Odisha': {
      '1month': [{ month: 'Week 1', value: 340 }, { month: 'Week 2', value: 405 }, { month: 'Week 3', value: 470 }, { month: 'Week 4', value: 540 }],
      '3months': [{ month: 'Apr', value: 425 }, { month: 'May', value: 485 }, { month: 'Jun', value: 540 }],
      '6months': [{ month: 'Jan', value: 275 }, { month: 'Feb', value: 325 }, { month: 'Mar', value: 375 }, { month: 'Apr', value: 425 }, { month: 'May', value: 485 }, { month: 'Jun', value: 540 }],
      '1year': [{ month: 'Jan', value: 170 }, { month: 'Feb', value: 210 }, { month: 'Mar', value: 250 }, { month: 'Apr', value: 295 }, { month: 'May', value: 350 }, { month: 'Jun', value: 400 }, { month: 'Jul', value: 445 }, { month: 'Aug', value: 490 }, { month: 'Sep', value: 520 }, { month: 'Oct', value: 540 }, { month: 'Nov', value: 530 }, { month: 'Dec', value: 540 }],
    },
    'Sikkim': {
      '1month': [{ month: 'Week 1', value: 45 }, { month: 'Week 2', value: 55 }, { month: 'Week 3', value: 65 }, { month: 'Week 4', value: 75 }],
      '3months': [{ month: 'Apr', value: 60 }, { month: 'May', value: 68 }, { month: 'Jun', value: 75 }],
      '6months': [{ month: 'Jan', value: 38 }, { month: 'Feb', value: 46 }, { month: 'Mar', value: 54 }, { month: 'Apr', value: 60 }, { month: 'May', value: 68 }, { month: 'Jun', value: 75 }],
      '1year': [{ month: 'Jan', value: 25 }, { month: 'Feb', value: 30 }, { month: 'Mar', value: 38 }, { month: 'Apr', value: 45 }, { month: 'May', value: 55 }, { month: 'Jun', value: 62 }, { month: 'Jul', value: 68 }, { month: 'Aug', value: 74 }, { month: 'Sep', value: 78 }, { month: 'Oct', value: 80 }, { month: 'Nov', value: 78 }, { month: 'Dec', value: 75 }],
    },
    'Telangana': {
      '1month': [{ month: 'Week 1', value: 620 }, { month: 'Week 2', value: 735 }, { month: 'Week 3', value: 850 }, { month: 'Week 4', value: 980 }],
      '3months': [{ month: 'Apr', value: 760 }, { month: 'May', value: 875 }, { month: 'Jun', value: 980 }],
      '6months': [{ month: 'Jan', value: 500 }, { month: 'Feb', value: 590 }, { month: 'Mar', value: 680 }, { month: 'Apr', value: 760 }, { month: 'May', value: 875 }, { month: 'Jun', value: 980 }],
      '1year': [{ month: 'Jan', value: 310 }, { month: 'Feb', value: 380 }, { month: 'Mar', value: 450 }, { month: 'Apr', value: 530 }, { month: 'May', value: 630 }, { month: 'Jun', value: 720 }, { month: 'Jul', value: 810 }, { month: 'Aug', value: 890 }, { month: 'Sep', value: 950 }, { month: 'Oct', value: 980 }, { month: 'Nov', value: 970 }, { month: 'Dec', value: 980 }],
    },
    'Tripura': {
      '1month': [{ month: 'Week 1', value: 85 }, { month: 'Week 2', value: 102 }, { month: 'Week 3', value: 120 }, { month: 'Week 4', value: 138 }],
      '3months': [{ month: 'Apr', value: 108 }, { month: 'May', value: 125 }, { month: 'Jun', value: 138 }],
      '6months': [{ month: 'Jan', value: 70 }, { month: 'Feb', value: 85 }, { month: 'Mar', value: 98 }, { month: 'Apr', value: 108 }, { month: 'May', value: 125 }, { month: 'Jun', value: 138 }],
      '1year': [{ month: 'Jan', value: 45 }, { month: 'Feb', value: 55 }, { month: 'Mar', value: 68 }, { month: 'Apr', value: 82 }, { month: 'May', value: 100 }, { month: 'Jun', value: 115 }, { month: 'Jul', value: 128 }, { month: 'Aug', value: 138 }, { month: 'Sep', value: 146 }, { month: 'Oct', value: 150 }, { month: 'Nov', value: 146 }, { month: 'Dec', value: 138 }],
    },
    'Uttarakhand': {
      '1month': [{ month: 'Week 1', value: 200 }, { month: 'Week 2', value: 240 }, { month: 'Week 3', value: 280 }, { month: 'Week 4', value: 320 }],
      '3months': [{ month: 'Apr', value: 255 }, { month: 'May', value: 290 }, { month: 'Jun', value: 320 }],
      '6months': [{ month: 'Jan', value: 165 }, { month: 'Feb', value: 195 }, { month: 'Mar', value: 225 }, { month: 'Apr', value: 255 }, { month: 'May', value: 290 }, { month: 'Jun', value: 320 }],
      '1year': [{ month: 'Jan', value: 105 }, { month: 'Feb', value: 130 }, { month: 'Mar', value: 155 }, { month: 'Apr', value: 185 }, { month: 'May', value: 220 }, { month: 'Jun', value: 250 }, { month: 'Jul', value: 280 }, { month: 'Aug', value: 305 }, { month: 'Sep', value: 320 }, { month: 'Oct', value: 330 }, { month: 'Nov', value: 325 }, { month: 'Dec', value: 320 }],
    },
    // Union Territories
    'Andaman & Nicobar Islands': {
      '1month': [{ month: 'Week 1', value: 35 }, { month: 'Week 2', value: 42 }, { month: 'Week 3', value: 50 }, { month: 'Week 4', value: 58 }],
      '3months': [{ month: 'Apr', value: 46 }, { month: 'May', value: 53 }, { month: 'Jun', value: 58 }],
      '6months': [{ month: 'Jan', value: 28 }, { month: 'Feb', value: 34 }, { month: 'Mar', value: 40 }, { month: 'Apr', value: 46 }, { month: 'May', value: 53 }, { month: 'Jun', value: 58 }],
      '1year': [{ month: 'Jan', value: 18 }, { month: 'Feb', value: 23 }, { month: 'Mar', value: 28 }, { month: 'Apr', value: 34 }, { month: 'May', value: 42 }, { month: 'Jun', value: 48 }, { month: 'Jul', value: 54 }, { month: 'Aug', value: 58 }, { month: 'Sep', value: 62 }, { month: 'Oct', value: 64 }, { month: 'Nov', value: 62 }, { month: 'Dec', value: 58 }],
    },
    'Chandigarh': {
      '1month': [{ month: 'Week 1', value: 110 }, { month: 'Week 2', value: 132 }, { month: 'Week 3', value: 155 }, { month: 'Week 4', value: 180 }],
      '3months': [{ month: 'Apr', value: 142 }, { month: 'May', value: 163 }, { month: 'Jun', value: 180 }],
      '6months': [{ month: 'Jan', value: 90 }, { month: 'Feb', value: 108 }, { month: 'Mar', value: 126 }, { month: 'Apr', value: 142 }, { month: 'May', value: 163 }, { month: 'Jun', value: 180 }],
      '1year': [{ month: 'Jan', value: 58 }, { month: 'Feb', value: 72 }, { month: 'Mar', value: 88 }, { month: 'Apr', value: 105 }, { month: 'May', value: 125 }, { month: 'Jun', value: 142 }, { month: 'Jul', value: 158 }, { month: 'Aug', value: 172 }, { month: 'Sep', value: 182 }, { month: 'Oct', value: 188 }, { month: 'Nov', value: 184 }, { month: 'Dec', value: 180 }],
    },
    'Dadra & Nagar Haveli and Daman & Diu': {
      '1month': [{ month: 'Week 1', value: 55 }, { month: 'Week 2', value: 66 }, { month: 'Week 3', value: 78 }, { month: 'Week 4', value: 90 }],
      '3months': [{ month: 'Apr', value: 72 }, { month: 'May', value: 82 }, { month: 'Jun', value: 90 }],
      '6months': [{ month: 'Jan', value: 46 }, { month: 'Feb', value: 55 }, { month: 'Mar', value: 64 }, { month: 'Apr', value: 72 }, { month: 'May', value: 82 }, { month: 'Jun', value: 90 }],
      '1year': [{ month: 'Jan', value: 30 }, { month: 'Feb', value: 37 }, { month: 'Mar', value: 45 }, { month: 'Apr', value: 54 }, { month: 'May', value: 65 }, { month: 'Jun', value: 75 }, { month: 'Jul', value: 82 }, { month: 'Aug', value: 88 }, { month: 'Sep', value: 92 }, { month: 'Oct', value: 94 }, { month: 'Nov', value: 92 }, { month: 'Dec', value: 90 }],
    },
    'Jammu & Kashmir': {
      '1month': [{ month: 'Week 1', value: 240 }, { month: 'Week 2', value: 285 }, { month: 'Week 3', value: 330 }, { month: 'Week 4', value: 380 }],
      '3months': [{ month: 'Apr', value: 300 }, { month: 'May', value: 342 }, { month: 'Jun', value: 380 }],
      '6months': [{ month: 'Jan', value: 195 }, { month: 'Feb', value: 230 }, { month: 'Mar', value: 265 }, { month: 'Apr', value: 300 }, { month: 'May', value: 342 }, { month: 'Jun', value: 380 }],
      '1year': [{ month: 'Jan', value: 125 }, { month: 'Feb', value: 152 }, { month: 'Mar', value: 185 }, { month: 'Apr', value: 220 }, { month: 'May', value: 260 }, { month: 'Jun', value: 295 }, { month: 'Jul', value: 328 }, { month: 'Aug', value: 358 }, { month: 'Sep', value: 378 }, { month: 'Oct', value: 390 }, { month: 'Nov', value: 385 }, { month: 'Dec', value: 380 }],
    },
    'Ladakh': {
      '1month': [{ month: 'Week 1', value: 40 }, { month: 'Week 2', value: 48 }, { month: 'Week 3', value: 57 }, { month: 'Week 4', value: 65 }],
      '3months': [{ month: 'Apr', value: 52 }, { month: 'May', value: 60 }, { month: 'Jun', value: 65 }],
      '6months': [{ month: 'Jan', value: 32 }, { month: 'Feb', value: 39 }, { month: 'Mar', value: 46 }, { month: 'Apr', value: 52 }, { month: 'May', value: 60 }, { month: 'Jun', value: 65 }],
      '1year': [{ month: 'Jan', value: 20 }, { month: 'Feb', value: 26 }, { month: 'Mar', value: 32 }, { month: 'Apr', value: 40 }, { month: 'May', value: 48 }, { month: 'Jun', value: 55 }, { month: 'Jul', value: 60 }, { month: 'Aug', value: 64 }, { month: 'Sep', value: 68 }, { month: 'Oct', value: 70 }, { month: 'Nov', value: 68 }, { month: 'Dec', value: 65 }],
    },
    'Lakshadweep': {
      '1month': [{ month: 'Week 1', value: 25 }, { month: 'Week 2', value: 30 }, { month: 'Week 3', value: 36 }, { month: 'Week 4', value: 42 }],
      '3months': [{ month: 'Apr', value: 33 }, { month: 'May', value: 38 }, { month: 'Jun', value: 42 }],
      '6months': [{ month: 'Jan', value: 20 }, { month: 'Feb', value: 24 }, { month: 'Mar', value: 29 }, { month: 'Apr', value: 33 }, { month: 'May', value: 38 }, { month: 'Jun', value: 42 }],
      '1year': [{ month: 'Jan', value: 12 }, { month: 'Feb', value: 16 }, { month: 'Mar', value: 20 }, { month: 'Apr', value: 26 }, { month: 'May', value: 32 }, { month: 'Jun', value: 36 }, { month: 'Jul', value: 40 }, { month: 'Aug', value: 42 }, { month: 'Sep', value: 45 }, { month: 'Oct', value: 46 }, { month: 'Nov', value: 44 }, { month: 'Dec', value: 42 }],
    },
    'Puducherry': {
      '1month': [{ month: 'Week 1', value: 95 }, { month: 'Week 2', value: 115 }, { month: 'Week 3', value: 135 }, { month: 'Week 4', value: 155 }],
      '3months': [{ month: 'Apr', value: 122 }, { month: 'May', value: 140 }, { month: 'Jun', value: 155 }],
      '6months': [{ month: 'Jan', value: 78 }, { month: 'Feb', value: 95 }, { month: 'Mar', value: 110 }, { month: 'Apr', value: 122 }, { month: 'May', value: 140 }, { month: 'Jun', value: 155 }],
      '1year': [{ month: 'Jan', value: 50 }, { month: 'Feb', value: 62 }, { month: 'Mar', value: 76 }, { month: 'Apr', value: 92 }, { month: 'May', value: 110 }, { month: 'Jun', value: 125 }, { month: 'Jul', value: 140 }, { month: 'Aug', value: 152 }, { month: 'Sep', value: 160 }, { month: 'Oct', value: 165 }, { month: 'Nov', value: 160 }, { month: 'Dec', value: 155 }],
    },
    'Delhi (NCT)': {
      '1month': [{ month: 'Week 1', value: 950 }, { month: 'Week 2', value: 1120 }, { month: 'Week 3', value: 1300 }, { month: 'Week 4', value: 1500 }],
      '3months': [{ month: 'Apr', value: 1180 }, { month: 'May', value: 1350 }, { month: 'Jun', value: 1500 }],
      '6months': [{ month: 'Jan', value: 760 }, { month: 'Feb', value: 900 }, { month: 'Mar', value: 1050 }, { month: 'Apr', value: 1180 }, { month: 'May', value: 1350 }, { month: 'Jun', value: 1500 }],
      '1year': [{ month: 'Jan', value: 480 }, { month: 'Feb', value: 580 }, { month: 'Mar', value: 700 }, { month: 'Apr', value: 830 }, { month: 'May', value: 980 }, { month: 'Jun', value: 1120 }, { month: 'Jul', value: 1250 }, { month: 'Aug', value: 1380 }, { month: 'Sep', value: 1480 }, { month: 'Oct', value: 1550 }, { month: 'Nov', value: 1520 }, { month: 'Dec', value: 1500 }],
    },
  };

  // Generate enrollment data based on selected filters
  const generateEnrollmentData = (state: string, timeFilter: string): { month: string; value: number }[] => {
    const stateData = enrollmentMockData[state] || enrollmentMockData['All States'];
    return stateData[timeFilter] || stateData['6months'];
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
    const newData = generateEnrollmentData(state || 'All States', selectedTimeFilter);
    setEnrollmentData(newData);
    setChartData({
      labels: newData.map(d => d.month),
      datasets: [{ data: newData.map(d => d.value) }],
    });
  };

  const handleTimeFilterChange = (tf: string) => {
    setSelectedTimeFilter(tf);
    const newData = generateEnrollmentData(selectedState || 'All States', tf);
    setEnrollmentData(newData);
    setChartData({
      labels: newData.map(d => d.month),
      datasets: [{ data: newData.map(d => d.value) }],
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
              .map((p: any) => p.author_email || p.author?.email as string)
              .filter(Boolean)
          ),
        ] as string[];
        // Skip user profile fetching to avoid 404 errors - author data comes from posts
        // await Promise.all(uniqueEmails.map(e => fetchUserProfile(token, e)));
        
        // Process posts to handle snake_case to camelCase conversion and image URLs
        const processedPosts = res.data.data.map((post: any) => {
          // Convert snake_case to camelCase for frontend compatibility
          const processedPost = {
            ...post,
            id: post.id,
            author: {
              email: post.author_email || post.author?.email,
              name: post.author_name || post.author?.name,
              role: post.author_role || post.author?.role,
              profile_pic: post.author_profile_pic || post.author?.profile_pic
            },
            content: post.content,
            postImage: post.post_image || post.postImage, // Handle both field names
            postImages: post.post_images || post.postImages || (post.post_image ? [post.post_image] : []),
            likes: post.likes_counter || post.likes || 0,
            createdAt: post.created_at || post.createdAt,
            tags: post.tags || []
          };
          
          // Handle postImage (single image) - convert to absolute URL if needed
          if (processedPost.postImage && !processedPost.postImage.startsWith('http') && !processedPost.postImage.includes(BASE_URL)) {
            processedPost.postImage = processedPost.postImage.startsWith('/') 
              ? `${BASE_URL}${processedPost.postImage}`
              : `${BASE_URL}/${processedPost.postImage}`;
          }
          
          // Handle postImages (array of images) - convert to absolute URLs if needed
          if (processedPost.postImages && Array.isArray(processedPost.postImages)) {
            processedPost.postImages = processedPost.postImages.map((img: string) => {
              if (!img || img.startsWith('http') || img.includes(BASE_URL)) return img;
              return img.startsWith('/') ? `${BASE_URL}${img}` : `${BASE_URL}/${img}`;
            });
          }
          
          return processedPost;
        });
        
        console.log('📥 Fetched posts with processed images:', processedPosts.length);
        setPosts(processedPosts);
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
      "My Tuitions": "/(tabs)/TeacherDashBoard/MySubjectsWeb",
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

  const handleCreatePost = async (content: string, imageUri?: string | null) => {
    let token = authToken;
    let email = userEmail;
    
    // Get token and email if not available
    if (!token || !email) {
      try {
        const authData = await getAuthData();
        if (authData?.token) { 
          setAuthToken(authData.token); 
          token = authData.token; 
        }
        if (authData?.email) {
          email = authData.email;
        }
      } catch (error) {
        console.error('Error getting auth data:', error);
      }
    }
    
    if (!token) {
      throw new Error('No authentication token. Please log in again.');
    }
    if (!email) {
      throw new Error('User email not found. Please log in again.');
    }
    
    try {
      let res;
      
      if (imageUri) {
        // Check if image is base64 (web platform) or file path (mobile)
        const isBase64 = imageUri.startsWith('data:image');
        
        if (isBase64) {
          // Send base64 image as JSON (web platform)
          console.log('📤 Uploading post with base64 image');
          res = await axios.post(
            `${BASE_URL}/api/posts/create`,
            { 
              content: content.trim(), 
              tags: '',
              imageUri: imageUri  // Send base64 data as JSON field
            },
            { 
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
              },
              timeout: 30000 // Longer timeout for image uploads
            }
          );
        } else {
          // Create FormData for file upload (mobile platform)
          const formData = new FormData();
          formData.append('content', content.trim());
          formData.append('tags', '');
          formData.append('email', email);
          
          // Get filename from uri
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          // Append image to FormData
          formData.append('postImage', {
            uri: imageUri,
            name: filename,
            type: type,
          } as any);
          
          console.log('📤 Uploading post with file image:', { content: content.trim(), imageUri, filename, type });
          
          res = await axios.post(
            `${BASE_URL}/api/posts/create`,
            formData,
            { 
              headers: { 
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}` 
              },
              timeout: 30000 // Longer timeout for image uploads
            }
          );
        }
      } else {
        // Regular post without image
        res = await axios.post(
          `${BASE_URL}/api/posts/create`,
          { 
            content: content.trim(), 
            tags: '',
            email: email
          },
          { 
            headers: { 
              'Content-Type': 'application/json', 
              Authorization: `Bearer ${token}` 
            },
            timeout: 10000
          }
        );
      }
      
      if (res.data.success) {
        console.log('✅ Post created successfully:', res.data);
        if (token) await fetchPosts(token);
        return res.data;
      }
      throw new Error(res.data.message || 'Failed to create post');
    } catch (err: any) {
      console.error('Create post error:', err);
      // Better error handling for production
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (err.response?.status === 404) {
        throw new Error('Post creation endpoint not found. Please check backend deployment.');
      }
      if (err.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(err.response?.data?.message || 'Failed to create post. Please try again.');
    }
  };

  // ── Delete post function ──────────────────────────────────────────────────
  const handleDeletePost = async (postId: string) => {
    console.log('🗑️ Delete post called for postId:', postId);
    console.log('🔑 Auth token available:', !!authToken);
    console.log('👤 Current user email:', realUserEmail || userEmail);

    if (!authToken) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    try {
      console.log('🔄 Sending delete request to API...');
      const res = await axios.delete(
        `${BASE_URL}/api/posts/${postId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log('✅ Delete API response:', res.data);
      if (res.data.success) {
        console.log('🔄 Refetching posts after deletion...');
        await fetchPosts(authToken);
        console.log('✅ Posts refetched after deletion');
      } else {
        console.error('❌ Delete failed:', res.data.message);
        Alert.alert('Error', res.data.message || 'Failed to delete post');
      }
    } catch (err: any) {
      console.error('❌ Delete post error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      if (err.response?.status === 403) {
        Alert.alert('Error', 'You can only delete your own posts within 24 hours of creation.');
      } else if (err.response?.status === 404) {
        // Silently handle 404 - post already deleted, just remove from UI
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to delete post. Please try again.');
      }
    }
  };

  // ── Like function ───────────────────────────────────────────────────────────
  const handleLike = async (postId: string) => {
    if (!authToken) {
      Alert.alert('Error', 'Please log in to like posts');
      return;
    }

    // Find current post and toggle like state optimistically
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newIsLiked = !post.isLiked;
    const newLikes = newIsLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);

    // Update local state immediately (optimistic update)
    setPosts((ps) => ps.map((p) =>
      p.id === postId
        ? { ...p, isLiked: newIsLiked, likes: newLikes }
        : p
    ));

    try {
      const endpoint = `${BASE_URL}/api/posts/${postId}/like`;
      
      if (newIsLiked) {
        // Like the post
        await axios.post(endpoint, {}, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } else {
        // Unlike the post
        await axios.delete(endpoint, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
      console.log(`✅ Post ${postId} ${newIsLiked ? 'liked' : 'unliked'} successfully`);
    } catch (err: any) {
      console.error('Like error:', err);
      // Revert state on error
      setPosts((ps) => ps.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !newIsLiked, likes: post.likes || 0 }
          : p
      ));
      Alert.alert('Error', err.response?.data?.message || 'Failed to update like. Please try again.');
    }
  };

  // ── Comment functions ─────────────────────────────────────────────────────
  const fetchPostComments = async (postId: string) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.data.success) {
        setPostComments(res.data.data.map((c: any) => ({ ...c, createdAt: formatTimeAgo(c.createdAt), isLiked: false })));
      }
    } catch {
      setPostComments([]);
    }
  };

  const openCommentsModal = async (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    setCommentText('');
    await fetchPostComments(post.id);
  };

  const addComment = async () => {
    if (!commentText.trim() || !selectedPost || !authToken) return;
    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/${selectedPost.id}/comments`,
        { content: commentText.trim() },
        { headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.success) {
        const newC = { ...res.data.data, createdAt: 'Just now', isLiked: false };
        setPostComments((prev) => [newC, ...prev]);
        setCommentText('');
        setPosts((ps) =>
          ps.map((p: any) => (p.id === selectedPost.id ? { ...p, comments: [newC, ...(p.comments || [])] } : p))
        );
        await fetchPostComments(selectedPost.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add comment');
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      if (window.width < 768) {
        // Switching to mobile - collapse sidebar and thoughts
        setIsSidebarCollapsed(true);
        setIsThoughtsCollapsed(true);
      } else {
        // Switching to desktop - expand sidebar and thoughts
        setIsSidebarCollapsed(false);
        setIsThoughtsCollapsed(false);
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
          if (typeof count === 'number' && count > 0) {
            // ✅ FIX 3: Hydrate the ref from cache BEFORE the API call fires.
            // This guarantees the ref has a non-zero fallback value immediately,
            // so even if fetchSubjectCount catches an error it restores from ref.
            subjectCountRef.current = count;
            setRealSubjectCount(count);
          }
        }
      } catch (_) {}
      if (mounted) await Promise.all([fetchSubjectCount(), fetchProfile()]);
    };
    loadInitialData();
    return () => { mounted = false; };
  // ✅ FIX 3b: Removed `fetchSubjectCount` from deps.
  // fetchSubjectCount is now stable (empty deps useCallback), so listing it
  // here is harmless — but removing it makes the intent explicit and prevents
  // any future accidental re-introduction of the circular loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheLoaded]);

  useEffect(() => {
    if (realUserEmail) fetchContacts();
  }, [realUserEmail, fetchContacts]);

  // Keep ref in sync with state to prevent stale values in error handlers
  useEffect(() => {
    subjectCountRef.current = realSubjectCount;
  }, [realSubjectCount]);

  useEffect(() => {
    if (!realUserEmail) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [realUserEmail, fetchUnreadCount]);

  useEffect(() => {
    // Initialize with mock data based on current filters
    const initialData = generateEnrollmentData(selectedState || 'All States', selectedTimeFilter);
    setEnrollmentData(initialData);
    setChartData({ labels: initialData.map(d => d.month), datasets: [{ data: initialData.map(d => d.value) }] });
    setChartLoading(false);
    
    // Try to fetch real data if authenticated
    if (authToken && realUserEmail) {
      fetchEnrollmentData();
    }
  }, [authToken, realUserEmail]);

  useEffect(() => {
    if (authToken) fetchPosts(authToken);
  }, [authToken]);

  useEffect(() => {
    if (reviewsTab === 'all' && authToken && allReviewsData.length === 0) {
      fetchAllReviewsData();
    }
  }, [reviewsTab, authToken, fetchAllReviewsData, allReviewsData.length]);

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
    return null;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const displayName        = realTeacherName || teacherName;
  const displayImage       = realProfileImage || profileImage;
  const displayEmail       = realUserEmail || userEmail;
  // ✅ FIX 4: Priority chain — state (live API) → ref (last known good) → prop fallback.
  // Never shows 0 as long as any source has ever returned a real count.
  const displaySubjects =
    realSubjectCount > 0
      ? realSubjectCount
      : subjectCountRef.current > 0
        ? subjectCountRef.current
        : subjectCount;
  const displayStudents    = realContacts.length > 0 ? realContacts.length : (contacts?.length || 0);
  const displayCreatedAt   = realCreatedAt || createdAt;
  const displaySpotlight   = realIsSpotlight ?? isSpotlight;
  const displayStatus      = realUserStatus || userStatus;

  // ── Thoughts panel – shown on desktop (all platforms) ───────────────────────
  const showThoughtsPanel = !isMobile;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Top header ── */}
      <TeacherWebHeader teacherName={displayName} profileImage={displayImage} />

      {/* ── Tooltip rendered at root level to avoid clipping by layout containers ── */}
      {showThoughtsTooltip && Platform.OS === 'web' && (
        <View style={styles.rootTooltip}>
          <Text style={styles.rootTooltipText}>
            Posts can only be deleted within the first 24 hours after creation.
          </Text>
          <View style={styles.rootTooltipArrow} />
        </View>
      )}

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
            <View style={[styles.centerContent, isMobile && { paddingHorizontal: 16, paddingTop: 20 }]}>
              <ScrollView style={styles.mainScroll} showsVerticalScrollIndicator={false}>

                {/* Error Banner - shows when APIs fail */}
                {Object.values(apiErrors).some(e => e) && (
                  <View style={{
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="warning-outline" size={20} color="#D97706" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 14,
                        color: '#92400E',
                      }} selectable={false}>
                        Some data couldn't load
                      </Text>
                      <Text style={{
                        fontFamily: 'Poppins_400Regular',
                        fontSize: 12,
                        color: '#B45309',
                        marginTop: 2,
                      }} selectable={false}>
                        {Object.entries(apiErrors)
                          .filter(([_, msg]) => msg)
                          .map(([key, msg]) => msg)
                          .join(', ')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setApiErrors({});
                        loadCachedProfile();
                        if (realUserEmail) {
                          fetchContacts();
                          fetchSubjectCount();
                          fetchEnrollmentData();
                        }
                      }}
                      style={{
                        backgroundColor: '#F59E0B',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{
                        fontFamily: 'Poppins_500Medium',
                        fontSize: 12,
                        color: '#fff',
                      }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}

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
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled' as any)}
                    isMobile={isMobile}
                  />
                  <StatsCard
                    title="SUBJECTS"
                    value={displaySubjects}
                    subtext="Active Curriculums"
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/MySubjectsWeb' as any)}
                    isMobile={isMobile}
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
                    isMobile={isMobile}
                  />
                </View>

                {/* Promotion card - Enhanced UI */}
                <View style={{
                  backgroundColor: '#3B5BFE',
                  borderRadius: 20,
                  padding: isMobile ? 24 : 36,
                  marginBottom: 24,
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  minHeight: isMobile ? 'auto' : 200,
                  overflow: 'hidden',
                  shadowColor: '#3B5BFE',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                }}>
                  <View style={{ flex: 1, paddingRight: isMobile ? 0 : 40, marginBottom: isMobile ? 24 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="sparkles" size={isMobile ? 20 : 24} color="#FFD700" style={{ marginRight: 8 }} />
                      <Text style={{
                        fontFamily: 'Poppins_700Bold',
                        fontSize: isMobile ? 20 : 28,
                        color: '#fff',
                      }} selectable={false}>Promote Your Profile</Text>
                    </View>
                    <Text style={{
                      fontFamily: 'Poppins_400Regular',
                      fontSize: isMobile ? 14 : 16,
                      color: 'rgba(255,255,255,0.9)',
                      lineHeight: isMobile ? 22 : 26,
                      marginBottom: isMobile ? 20 : 28,
                    }} selectable={false}>
                      Appear at the top of student searches in your region and increase enrollment by up to 4x
                    </Text>
                    
                    <View style={{ 
                      flexDirection: isMobile ? 'column' : 'row', 
                      alignItems: isMobile ? 'stretch' : 'center', 
                      gap: isMobile ? 16 : 24,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 16,
                      padding: isMobile ? 16 : 20,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 4,
                          minWidth: isMobile ? 120 : 140,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}>
                          <Picker
                            selectedValue={selectedState}
                            onValueChange={handleStateChange}
                            style={{ height: 40, fontSize: 13 }}
                            dropdownIconColor="rgba(255,255,255,0.9)"
                            mode="dropdown"
                          >
                            <Picker.Item label="Select State" value="" color="#3B5BFE" />
                            {[
                              "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
                              "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
                              "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
                              "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
                              "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
                              "Jammu & Kashmir","Ladakh","Puducherry"
                            ].map(s => <Picker.Item key={s} label={s} value={s} color="#3B5BFE" />)}
                          </Picker>
                        </View>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                        <Text style={{
                          fontFamily: 'Poppins_700Bold',
                          fontSize: isMobile ? 24 : 32,
                          color: '#fff',
                        }} selectable={false}>₹650</Text>
                        <Text style={{
                          fontFamily: 'Poppins_400Regular',
                          fontSize: isMobile ? 13 : 15,
                          color: 'rgba(255,255,255,0.8)',
                        }} selectable={false}>/month</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      paddingHorizontal: isMobile ? 20 : 32,
                      paddingVertical: isMobile ? 14 : 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                    onPress={() => router.push('/(tabs)/TeacherDashBoard/Spotlights' as any)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="rocket" size={18} color="#3B5BFE" />
                      <Text style={{
                        fontFamily: 'Poppins_700Bold',
                        fontSize: isMobile ? 14 : 16,
                        color: '#3B5BFE',
                      }} selectable={false}>Activate Now</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Enrollment Growth chart */}
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: isMobile ? 16 : 24,
                  marginBottom: 24,
                }}>
                  {/* Header */}
                  <View style={{ 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    marginBottom: 24,
                    gap: isMobile ? 12 : 0,
                  }}>
                    <Text style={{ 
                      fontSize: isMobile ? 18 : 20, 
                      fontFamily: 'Poppins_700Bold', 
                      color: COLORS.textDark,
                      marginBottom: isMobile ? 8 : 0,
                    }} selectable={false}>
                      Enrollment Growth
                    </Text>
                    <View style={{ 
                      flexDirection: 'row', 
                      gap: 12,
                      width: isMobile ? '100%' : 'auto',
                    }}>
                      {/* State dropdown */}
                      <View style={{
                        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
                        minWidth: isMobile ? 100 : 150, 
                        flex: isMobile ? 1 : 0,
                        backgroundColor: '#fff', overflow: 'hidden',
                      }}>
                        <Picker
                          selectedValue={selectedState}
                          onValueChange={handleStateChange}
                          style={{
                            backgroundColor: '#f3f4f6',
                            borderRadius: 10,
                            height: 42,
                            width: isMobile ? 140 : 180,
                          }}
                          dropdownIconColor="#374151"
                        >
                          <Picker.Item label="All States" value="" />
                          {Object.keys(enrollmentMockData).filter(s => s !== 'All States').map(s => (
                            <Picker.Item key={s} label={s} value={s} />
                          ))}
                        </Picker>
                      </View>
                      {/* Time filter dropdown */}
                      <View style={{
                        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
                        minWidth: isMobile ? 100 : 150, 
                        flex: isMobile ? 1 : 0,
                        backgroundColor: '#fff', overflow: 'hidden',
                      }}>
                        <Picker
                          selectedValue={selectedTimeFilter}
                          onValueChange={handleTimeFilterChange}
                          style={{ height: 42, color: '#374151', fontSize: 13 }}
                          dropdownIconColor="#374151"
                        >
                          <Picker.Item label="Last Month (Weekly)" value="1month" />
                          <Picker.Item label="Last 3 Months" value="3months" />
                          <Picker.Item label="Last 6 Months" value="6months" />
                          <Picker.Item label="Yearly" value="1year" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  {/* Chart area */}
                  <View style={{ flexDirection: 'row', minHeight: isMobile ? 260 : 320 }}>
                    {/* Y-axis */}
                    <View style={{ width: isMobile ? 32 : 40, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, paddingBottom: 32, paddingTop: 8 }}>
                      {(isMobile ? ['4K','2K','0'] : ['4K','3K','2K','1K','0']).map((l, i) => (
                        <Text key={i} style={{ fontSize: isMobile ? 10 : 12, fontFamily: 'Poppins_500Medium', color: '#9ca3af' }} selectable={false}>{l}</Text>
                      ))}
                    </View>

                    {/* Bars area */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      {chartLoading ? (
                        <View style={{ justifyContent: 'center', alignItems: 'center', width: isMobile ? 300 : 400, height: isMobile ? 220 : 280 }}>
                          <ActivityIndicator color={COLORS.primaryBlue} size="large" />
                          <Text style={{ marginTop: 10, fontFamily: 'Poppins_400Regular', color: COLORS.textSecondary }} selectable={false}>
                            Loading enrollment data...
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: isMobile ? 240 : 300, paddingBottom: 32, gap: 0 }}>
                          {(enrollmentData.length > 0 ? enrollmentData : CHART_DATA.map(d => ({ month: d.month, value: d.value }))).map((point, idx, arr) => {
                            const maxVal = Math.max(...arr.map(d => d.value || 0), 4000);
                            const barH = ((point.value || 0) / maxVal) * (isMobile ? 180 : 240);
                            const barW = Math.max(isMobile ? 36 : 50, Math.min(isMobile ? 60 : 80, (Dimensions.get('window').width * (isMobile ? 0.35 : 0.45)) / arr.length - 10));
                            return (
                              <View key={idx} style={{ alignItems: 'center', marginHorizontal: isMobile ? 4 : 8, justifyContent: 'flex-end', height: isMobile ? 220 : 268 }}>
                                {/* Grid line simulation via bar container */}
                                <View style={{
                                  width: barW,
                                  height: barH,
                                  backgroundColor: '#4255ff',
                                  borderTopLeftRadius: 6,
                                  borderTopRightRadius: 6,
                                  opacity: 0.85,
                                }} />
                                <Text style={{ fontSize: isMobile ? 10 : 12, fontFamily: 'Poppins_500Medium', color: '#6b7280', marginTop: 8 }} selectable={false}>
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

                {/* Reviews Section - Professional UI */}
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: isMobile ? 16 : 24,
                  marginBottom: 24,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  ...Platform.select({
                    web: { boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)' },
                    default: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 20,
                      elevation: 5,
                    },
                  }),
                }}>
                  {/* Header with Title and Rating */}
                  <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, gap: isMobile ? 12 : 0 }}>
                    <View>
                      <Text style={{ fontSize: isMobile ? 18 : 20, fontFamily: 'Poppins_700Bold', color: '#1F2937' }} selectable={false}>
                        Student Reviews
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#6B7280', marginTop: 4 }} selectable={false}>
                        Feedback from your students
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#3B5BFE', marginRight: 8 }}>{averageRating.toFixed(1)}</Text>
                      <View style={{ flexDirection: 'row', marginRight: 8 }}>
                        {renderStars(averageRating)}
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#6B7280' }}>({reviews?.length || 0})</Text>
                    </View>
                  </View>

                  {/* Tab Toggle */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                    <TouchableOpacity
                      style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: reviewsTab === 'my' ? '#fff' : 'transparent' }}
                      onPress={() => setReviewsTab('my')}
                    >
                      <Text style={{ fontFamily: reviewsTab === 'my' ? 'Poppins_600SemiBold' : 'Poppins_400Regular', fontSize: 13, color: reviewsTab === 'my' ? '#3B5BFE' : '#6B7280' }}>
                        My Reviews ({reviews?.length || 0})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: reviewsTab === 'all' ? '#fff' : 'transparent' }}
                      onPress={() => setReviewsTab('all')}
                    >
                      <Text style={{ fontFamily: reviewsTab === 'all' ? 'Poppins_600SemiBold' : 'Poppins_400Regular', fontSize: 13, color: reviewsTab === 'all' ? '#3B5BFE' : '#6B7280' }}>
                        All Reviews ({allReviewsData?.length || 0})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Rating Distribution Bars */}
                  <View style={{ marginBottom: 20 }}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingsCount[star as keyof typeof ratingsCount] || 0;
                      const total = (reviews?.length || 0) || 1;
                      const percentage = (count / total) * 100;
                      return (
                        <View key={star} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ width: 20, fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#6B7280' }}>{star}</Text>
                          <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 8 }} />
                          <View style={{ flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                            <View style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#3B5BFE', borderRadius: 4 }} />
                          </View>
                          <Text style={{ width: 35, fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#9CA3AF', textAlign: 'right' }}>{Math.round(percentage)}%</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Reviews List */}
                  <View style={{ maxHeight: 400 }}>
                    {reviewsLoading || localReviewsLoading ? (
                      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <ActivityIndicator size="large" color="#3B5BFE" />
                        <Text style={{ marginTop: 12, fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#6B7280' }}>Loading reviews...</Text>
                      </View>
                    ) : reviewsTab === 'my' ? (
                      reviews && reviews.length > 0 ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {reviews.slice(0, 5).map((review, index) => (
                            <View key={review.id || review._id || index} style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#3B5BFE' }}>
                                    {(review.studentName || review.student_name || 'S')[0].toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1F2937' }} selectable={false}>
                                      {review.studentName || review.student_name || 'Anonymous'}
                                    </Text>
                                    <View style={{ flexDirection: 'row' }}>
                                      {[1,2,3,4,5].slice(0, Math.round(Number(review.rating) || 0)).map(s => (
                                        <Ionicons key={s} name="star" size={14} color="#FFD700" />
                                      ))}
                                    </View>
                                  </View>
                                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                                  </Text>
                                  {(review.content || review.review || review.reviewText || review.review_text || review.message) && (
                                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#4B5563', lineHeight: 20 }} selectable={false}>
                                      {review.content || review.review || review.reviewText || review.review_text || review.message}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          ))}
                          {reviews.length > 5 && (
                            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }}>
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#3B5BFE' }}>
                                View all {reviews.length} reviews
                              </Text>
                            </TouchableOpacity>
                          )}
                        </ScrollView>
                      ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
                          <Text style={{ marginTop: 16, fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#6B7280' }}>No reviews yet</Text>
                          <Text style={{ marginTop: 8, fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                            Your student reviews will appear here once they leave feedback
                          </Text>
                        </View>
                      )
                    ) : (
                      allReviewsData && allReviewsData.length > 0 ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {allReviewsData.slice(0, 5).map((review, index) => (
                            <View key={review._id || index} style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#3B5BFE' }}>
                                    {(review.studentName || 'S')[0].toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1F2937' }} selectable={false}>
                                      {review.studentName || 'Anonymous'}
                                    </Text>
                                    <View style={{ flexDirection: 'row' }}>
                                      {[1,2,3,4,5].slice(0, Math.round(Number(review.rating) || 0)).map(s => (
                                        <Ionicons key={s} name="star" size={14} color="#FFD700" />
                                      ))}
                                    </View>
                                  </View>
                                  <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                                  </Text>
                                  {(review.reviewText || review.review_text || review.message) && (
                                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#4B5563', lineHeight: 20 }} selectable={false}>
                                      {review.reviewText || review.review_text || review.message}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          ))}
                          {allReviewsData.length > 5 && (
                            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }}>
                              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#3B5BFE' }}>
                                View all {allReviewsData.length} reviews
                              </Text>
                            </TouchableOpacity>
                          )}
                        </ScrollView>
                      ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
                          <Text style={{ marginTop: 16, fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#6B7280' }}>No reviews available</Text>
                          <Text style={{ marginTop: 8, fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                            Check back later for new reviews
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>

              </ScrollView>
            </View>

    {/* RIGHT PANEL: Thoughts */}
<TeacherThoughtsCard
  posts={posts}
  postsLoading={postsLoading}
  userProfileCache={userProfileCache}
  currentUserEmail={realUserEmail || userEmail}
  getProfileImageSource={getProfileImageSource}
  initials={initials}
  resolvePostAuthor={resolvePostAuthor}
  handleCreatePost={handleCreatePost}
  handleDeletePost={handleDeletePost}
  handleLike={handleLike}
  setPosts={setPosts}
  onComment={openCommentsModal}
  isMobile={isMobile}
  showThoughtsPanel={showThoughtsPanel}
  isThoughtsCollapsed={isThoughtsCollapsed}
  setIsThoughtsCollapsed={setIsThoughtsCollapsed}
  showTooltip={showThoughtsTooltip}
  setShowTooltip={setShowThoughtsTooltip}
/>

          </View>{/* end contentColumns */}
        </View>{/* end mainWrapper */}
      </View>{/* end contentLayout */}

      {/* Comments Modal */}
      <Modal visible={showCommentsModal} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Comment Input - Top */}
            <View style={styles.commentInputRow}>
              {realProfileImage ? (
                <Image
                  source={{ uri: realProfileImage.startsWith('http') ? realProfileImage : `${BASE_URL}/${realProfileImage}` }}
                  style={styles.commentInputAvatar}
                />
              ) : (
                <View style={styles.commentInputAvatarFallback}>
                  <Text style={styles.commentInputAvatarText}>
                    {realTeacherName?.charAt(0).toUpperCase() || 'T'}
                  </Text>
                </View>
              )}
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={200}
              />
              <TouchableOpacity 
                style={[styles.commentPostBtn, !commentText.trim() && styles.commentPostBtnDisabled]} 
                onPress={addComment}
                disabled={!commentText.trim()}
              >
                <Text style={styles.commentPostBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList}>
              {postComments.length === 0 ? (
                <Text style={styles.noCommentsText}>No comments yet</Text>
              ) : (
                postComments.map((c, i) => {
                  // Get avatar for comment author
                  const authorPic = c.author?.profile_pic || c.author?.profilePic;
                  const authorName = c.author?.name || 'User';
                  const authorEmail = c.author?.email || '';
                  
                  return (
                    <View key={i} style={styles.commentItem}>
                      {authorPic ? (
                        <Image
                          source={{ uri: authorPic.startsWith('http') ? authorPic : `${BASE_URL}/${authorPic}` }}
                          style={styles.commentAvatar}
                        />
                      ) : (
                        <View style={styles.commentAvatarFallback}>
                          <Text style={styles.commentAvatarText}>
                            {authorName.split(' ').map((w: string) => w.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentContentWrapper}>
                        <Text style={styles.commentAuthor}>{authorName}</Text>
                        <Text style={styles.commentContent}>{c.content}</Text>
                        <Text style={styles.commentTime}>{c.createdAt}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>  /* end container */
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'visible',
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

  // ── Simplified Dynamic Layout ───────────────────────────────────────────
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'visible',
    flexDirection: 'row',
  },

  // ── Dynamic content area - adapts to screen size ─────────────────────────
  contentColumns: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  centerContent: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minWidth: 0,
    maxWidth: '100%',
  },
  mainScroll: {
    flex: 1,
  },

  // ── Dynamic Right panel - responsive width ───────────────────────────────
  rightPanel: {
    width: Platform.OS === 'web' ? 'clamp(280px, 25%, 360px)' : 320,
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 20,
    flexDirection: 'column',
    minWidth: 280,
    maxWidth: 400,
  },
  rightPanelCollapsed: {
    width: 52,
    paddingHorizontal: 8,
    minWidth: 52,
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

  // ── Mobile thoughts panel (vertical line that expands) ───────────────────
  mobileThoughtsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  mobileThoughtsLine: {
    width: 52,
    height: '100%',
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    alignItems: 'center',
    paddingTop: 24,
  },
  mobileThoughtsLineInner: {
    width: 4,
    height: 60,
    backgroundColor: '#3B5BFE',
    borderRadius: 2,
  },
  mobileThoughtsExpanded: {
    width: 320,
    height: '100%',
    backgroundColor: '#FAFBFC',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    flexDirection: 'column',
  },
  mobileThoughtsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileThoughtsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textDark,
  },
  mobileThoughtsClose: {
    padding: 6,
    borderRadius: 8,
  },
  mobileThoughtsComposer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mobileThoughtsScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    minWidth: 140,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    minHeight: 100,
  },
  statsCardMobile: {
    minWidth: '45%',
    padding: 14,
    minHeight: 90,
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
    flexWrap: 'wrap',
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    flex: 1,
  },
  statsValueMobile: {
    fontSize: 18,
  },
  statsGrowth: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#22c55e',
  },
  statsSubtext: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsSubtextMobile: {
    fontSize: 10,
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

  // ── Comments Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
  },
  // ── Root-level tooltip styles (rendered outside layout containers) ───────────
  rootTooltip: {
    position: 'fixed',
    top: 60,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 100,
    zIndex: 99999,
  },
  rootTooltipText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  rootTooltipArrow: {
    position: 'absolute',
    bottom: -6,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: '#1F2937',
  },
  // ── Comment Modal Styles ───────────────────────────────────────────────────
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
  },
  commentsList: {
    maxHeight: 300,
    marginTop: 12,
  },
  noCommentsText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#9CA3AF',
    paddingVertical: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  commentContentWrapper: {
    flex: 1,
  },
  commentAuthor: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  commentContent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 2,
  },
  commentTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentInputAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#1F2937',
    maxHeight: 80,
  },
  commentPostBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentPostBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  commentPostBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
});