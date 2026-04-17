import React, { useState, useRef, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Share as RNShare,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthData } from '../../../utils/authStorage';
import { BASE_URL, PORTAL_DOMAIN } from '../../../config';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import WebSidebar from '../../../components/ui/TeacherWebSidebar';
import { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Feather, FontAwesome, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// Enhanced responsive breakpoints
const isSmallMobile = width < 480;
const isMobile = width < 768;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;

// Dynamic helper functions
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

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_DOMAIN      = PORTAL_DOMAIN || 'portal.gogrowsmart.com';
const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.gogrowsmart.app';
const APP_STORE_LINK  = 'https://apps.apple.com/app/gogrowsmart';
const CONTACT_EMAIL   = 'contact@gogrowsmart.com';

// Share message generator - includes referral code when available
const getShareMessage = (referralCode?: string) => {
  const refParam = referralCode ? `?ref=${referralCode}` : '';
  return `🎓 Level up your teaching with GrowSmart!\n\nConnect with students, share your expertise & grow your tutoring business.\n\n📲 Download now: ${PLAY_STORE_LINK}\n🌐 Visit: https://${APP_DOMAIN}${refParam}${referralCode ? `\n\nUse my referral code: ${referralCode}` : ''}`;
};

// ─── Share Items ───────────────────────────────────────────────────────────────
const SHARE_ITEMS = [
  {
    id: '1', title: 'Copy Link',
    icon: 'link', iconType: 'Feather',
    gradient: ['#667EEA', '#764BA2'], solid: '#667EEA',
    description: 'Copy to clipboard',
  },
  {
    id: '2', title: 'WhatsApp',
    icon: 'whatsapp', iconType: 'FontAwesome',
    gradient: ['#25D366', '#128C7E'], solid: '#25D366',
    description: 'Share via WhatsApp',
  },
  {
    id: '3', title: 'Facebook',
    icon: 'facebook', iconType: 'FontAwesome',
    gradient: ['#1877F2', '#0D5FBF'], solid: '#1877F2',
    description: 'Share on Facebook',
  },
  {
    id: '4', title: 'LinkedIn',
    icon: 'linkedin', iconType: 'FontAwesome',
    gradient: ['#0A66C2', '#064D91'], solid: '#0A66C2',
    description: 'Share on LinkedIn',
  },
  {
    id: '5', title: 'Messenger',
    icon: 'facebook-messenger', iconType: 'FontAwesome6',
    gradient: ['#7B61FF', '#9B59B6'], solid: '#7B61FF',
    description: 'Send via Messenger',
  },
  {
    id: '6', title: 'Mail',
    icon: 'mail', iconType: 'Feather',
    gradient: ['#EA4335', '#C0392B'], solid: '#EA4335',
    description: 'Send via Email',
  },
  {
    id: '7', title: 'Twitter / X',
    icon: 'twitter', iconType: 'FontAwesome',
    gradient: ['#1DA1F2', '#0C85D0'], solid: '#1DA1F2',
    description: 'Share on Twitter',
  },
  {
    id: '8', title: 'Telegram',
    icon: 'send', iconType: 'Feather',
    gradient: ['#2CA5E0', '#1A8BBF'], solid: '#2CA5E0',
    description: 'Share via Telegram',
  },
  {
    id: '9', title: 'More',
    icon: 'share-2', iconType: 'Feather',
    gradient: ['#F093FB', '#F5576C'], solid: '#F093FB',
    description: 'More options',
  },
];

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  background: '#F0F4FF',
  cardBg: '#FFFFFF',
  primaryBlue: '#3B5BFE',
  accent: '#6C63FF',
  gold: '#F5A623',
  border: '#E5E7EB',
  textDark: '#0D1B4B',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  white: '#FFFFFF',
  success: '#10B981',
  surface: '#F8FAFF',
};

// ─── Icon Renderer ─────────────────────────────────────────────────────────────
const renderIcon = (item: typeof SHARE_ITEMS[0], size = 22) => {
  const props = { name: item.icon as any, size, color: '#FFFFFF' };
  if (item.iconType === 'Feather') return <Feather {...props} />;
  if (item.iconType === 'FontAwesome6') return <FontAwesome6 {...props} />;
  return <FontAwesome {...props} />;
};

// ─── Share Card (preview banner) ───────────────────────────────────────────────
const SharePreviewCard = () => (
  <View style={styles.previewCard}>
    {/* Decorative gradient blobs */}
    <View style={styles.blobTopRight} />
    <View style={styles.blobBottomLeft} />

    <View style={styles.previewInner}>
      <View style={styles.previewLogoWrap}>
        <View style={styles.previewLogo}>
          <MaterialIcons name="school" size={28} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.previewAppName}>GrowSmart</Text>
          <Text style={styles.previewTagline}>Teach · Inspire · Earn</Text>
        </View>
      </View>

      <View style={styles.previewDivider} />

      <Text style={styles.previewDomain}>🌐 {APP_DOMAIN}</Text>

      <View style={styles.previewStats}>
        {[
          { label: 'Students', value: '50K+' },
          { label: 'Tutors',   value: '2K+'  },
          { label: 'Courses',  value: '500+' },
        ].map((s) => (
          <View key={s.label} style={styles.previewStat}>
            <Text style={styles.previewStatValue}>{s.value}</Text>
            <Text style={styles.previewStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

// ─── Share Button ──────────────────────────────────────────────────────────────
const ShareButton = ({
  item,
  onPress,
  copied,
}: {
  item: typeof SHARE_ITEMS[0];
  onPress: () => void;
  copied: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
    onPress();
  };

  const isCopy = item.id === '1';
  const showCheck = isCopy && copied;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Icon circle */}
        <View style={[styles.shareBtnIcon, { backgroundColor: item.solid }]}>
          {showCheck
            ? <Feather name="check" size={20} color="#FFFFFF" />
            : renderIcon(item, 20)
          }
        </View>
        <Text style={styles.shareBtnLabel} numberOfLines={1}>
          {showCheck ? 'Copied!' : item.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Share = () => {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Enhanced responsive state
  const [screenWidth, setScreenWidth] = useState(width);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  
  // Update responsive breakpoints based on current width
  const currentIsSmallMobile = screenWidth < 480;
  const currentIsMobile = screenWidth < 768;
  const currentIsTablet = screenWidth >= 768 && screenWidth < 1024;
  const currentIsDesktop = screenWidth >= 1024;

  // Dynamic sizing functions that use current state
  const getCurrentFontSize = (mobile: number, tablet: number, desktop: number) => {
    if (currentIsSmallMobile) return mobile * 0.9;
    if (currentIsMobile) return mobile;
    if (currentIsTablet) return tablet;
    return desktop;
  };

  const getCurrentSpacing = (mobile: number, tablet: number, desktop: number) => {
    if (currentIsSmallMobile) return mobile * 0.8;
    if (currentIsMobile) return mobile;
    if (currentIsTablet) return tablet;
    return desktop;
  };

  const getCurrentDimension = (mobile: number, tablet: number, desktop: number) => {
    if (currentIsSmallMobile) return mobile * 0.85;
    if (currentIsMobile) return mobile;
    if (currentIsTablet) return tablet;
    return desktop;
  };

  // Update dimensions on change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [auth, setAuth] = useState<Record<string, any> | null>(null);
  const [teacherId, setTeacherId] = useState<string>('');
  const [sidebarActiveItem, setSidebarActiveItem] = useState("Share");
  const [copied, setCopied] = useState(false);

  // Generate referral code from teacher data
  const getReferralCode = () => {
    if (teacherId) return `TEACHER_${teacherId}`;
    if (auth?.teacherId) return `TEACHER_${auth.teacherId}`;
    if (auth?.userId) return `TEACHER_${auth.userId}`;
    if (auth?.id) return `TEACHER_${auth.id}`;
    if (auth?.email) return `TEACHER_${auth.email.split('@')[0]}`;
    return '';
  };

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setAuth(authData as any);
          setTeacherName(authData.name || '');
          setProfileImage(authData.profileImage || null);
          // Try to extract teacher ID from auth data or token
          const anyAuth = authData as any;
          setTeacherId(anyAuth.teacherId || anyAuth.userId || anyAuth.id || anyAuth._id || '');
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    };

    fetchTeacherData();
  }, []);

  // Back handler
  const handleBackPress = () => {
    router.back();
  };

  // ESC key handler for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleBackPress();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    // Handle navigation for sidebar items
    switch (item) {
      case 'Dashboard':
        router.push('/(tabs)/TeacherDashBoard/TutorDashboardWeb');
        break;
      case 'My Students':
        router.push('/(tabs)/TeacherDashBoard/StudentsEnrolled');
        break;
      case 'My Subjects':
        router.push('/(tabs)/TeacherDashBoard/SubjectsListWeb');
        break;
      case 'Create Subject':
        router.push('/(tabs)/TeacherDashBoard/CreateSubject');
        break;
      case 'Spotlights':
        router.push('/(tabs)/TeacherDashBoard/JoinedDateWeb');
        break;
      case 'Share':
        // Already on this page
        break;
      case 'Billing':
        router.push('/(tabs)/TeacherDashBoard/Billing');
        break;
      case 'Settings':
        router.push('/(tabs)/TeacherDashBoard/Settings');
        break;
      case 'Contact Us':
        router.push('/(tabs)/Contact');
        break;
      default:
        console.log('Navigate to:', item);
    }
  };

  // ── Share handler ───────────────────────────────────────────────────────────
  const handleShare = async (item: typeof SHARE_ITEMS[0]) => {
    const referralCode = getReferralCode();
    const shareMessage = getShareMessage(referralCode);
    const refParam = referralCode ? `?ref=${referralCode}` : '';
    const shareUrl = `https://${APP_DOMAIN}${refParam}`;
    
    const encodedMsg  = encodeURIComponent(shareMessage);
    const encodedLink = encodeURIComponent(`${PLAY_STORE_LINK}${refParam ? `&utm_source=${referralCode}` : ''}`);
    const encodedPortalLink = encodeURIComponent(shareUrl);

    try {
      switch (item.title) {
        case 'Copy Link': {
          const refCode = getReferralCode();
          const refParam = refCode ? `?ref=${refCode}` : '';
          const copyText = `https://${APP_DOMAIN}${refParam}\n${PLAY_STORE_LINK}${refParam ? `&utm_source=${refCode}` : ''}${refCode ? `\nReferral Code: ${refCode}` : ''}`;
          await Clipboard.setStringAsync(copyText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          break;
        }
        case 'WhatsApp': {
          try {
            // Try native share first (allows contact selection on mobile)
            if (Platform.OS !== 'web') {
              const result = await RNShare.share({
                title: '🎓 Join me on GrowSmart!',
                message: shareMessage,
              });
              if (result.action === RNShare.sharedAction) {
                console.log('Shared via native share');
              }
            } else {
              // Web: Open WhatsApp Web with message
              const webUrl = `https://web.whatsapp.com/send?text=${encodedMsg}`;
              const canOpen = await Linking.canOpenURL(`whatsapp://send?text=${encodedMsg}`);
              if (canOpen) {
                // Try to open WhatsApp app with contact selection
                await Linking.openURL(`whatsapp://send?text=${encodedMsg}`);
              } else {
                // Fallback to WhatsApp Web
                await Linking.openURL(webUrl);
              }
            }
          } catch (err) {
            console.error('WhatsApp share error:', err);
            // Fallback to direct URL
            const fallbackUrl = `https://wa.me/?text=${encodedMsg}`;
            await Linking.openURL(fallbackUrl);
          }
          break;
        }
        case 'Facebook': {
          try {
            const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedPortalLink}&quote=${encodedMsg}`;
            await Linking.openURL(url);
          } catch (err) {
            // Fallback to native share
            await RNShare.share({
              title: '🎓 Join me on GrowSmart!',
              message: shareMessage,
            });
          }
          break;
        }
        case 'LinkedIn': {
          try {
            const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPortalLink}&summary=${encodedMsg}`;
            await Linking.openURL(url);
          } catch (err) {
            // Fallback to native share
            await RNShare.share({
              title: '🎓 Join me on GrowSmart!',
              message: shareMessage,
            });
          }
          break;
        }
        case 'Messenger': {
          try {
            const deepLink = `fb-messenger://share?link=${encodedPortalLink}`;
            const webLink  = `https://www.facebook.com/dialog/send?link=${encodedPortalLink}&app_id=145634995501895&redirect_uri=${encodedPortalLink}`;
            const canOpen = await Linking.canOpenURL(deepLink);
            if (canOpen) {
              await Linking.openURL(deepLink);
            } else {
              await Linking.openURL(webLink);
            }
          } catch (err) {
            // Fallback to native share
            await RNShare.share({
              title: '🎓 Join me on GrowSmart!',
              message: shareMessage,
            });
          }
          break;
        }
        case 'Mail': {
          const subject = encodeURIComponent('🎓 Join me on GrowSmart – Best Teaching Platform!');
          const body    = encodeURIComponent(shareMessage);
          Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
          break;
        }
        case 'Twitter / X': {
          const refCode = getReferralCode();
          const tweetText = refCode 
            ? `🎓 Grow your teaching business with @GrowSmart!\nJoin using my referral: https://${APP_DOMAIN}?ref=${refCode}\nDownload: ${PLAY_STORE_LINK} #Education #OnlineTeaching #GrowSmart`
            : `🎓 Grow your teaching business with @GrowSmart!\nDownload: ${PLAY_STORE_LINK} #Education #OnlineTeaching`;
          const tweet = encodeURIComponent(tweetText);
          const url = `https://twitter.com/intent/tweet?text=${tweet}`;
          Linking.openURL(url);
          break;
        }
        case 'Telegram': {
          try {
            const url = `https://t.me/share/url?url=${encodedPortalLink}&text=${encodedMsg}`;
            const deepLink = `tg://msg_url?url=${encodedPortalLink}&text=${encodedMsg}`;
            const canOpen = await Linking.canOpenURL(deepLink);
            if (canOpen && Platform.OS !== 'web') {
              await Linking.openURL(deepLink);
            } else {
              await Linking.openURL(url);
            }
          } catch (err) {
            // Fallback to web URL
            const webUrl = `https://t.me/share/url?url=${encodedPortalLink}&text=${encodedMsg}`;
            await Linking.openURL(webUrl);
          }
          break;
        }
        default: {
          // Native share sheet
          const refCode = getReferralCode();
          await RNShare.share({
            title:   '🎓 GrowSmart – Teach & Inspire',
            message: getShareMessage(refCode),
            url:     PLAY_STORE_LINK,  // iOS only
          });
        }
      }
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert(
        'Share Failed',
        'Could not open the share option. Please try again or use Copy Link.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TeacherWebHeader showSearch={true} />
      
      {/* ── Main area ── */}
      <ScrollView
        style={styles.mainWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
            <View>
              <Text style={styles.pageTitle}>Share GrowSmart</Text>
              <Text style={styles.pageSubtitle}>
                Invite students & fellow teachers to join the platform
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* App preview card */}
          <SharePreviewCard />

          {/* Section label */}
          <View style={styles.sectionRow}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>Share via</Text>
            <View style={styles.sectionLine} />
          </View>

          {/* Share buttons grid */}
          <View style={styles.shareGrid}>
            {SHARE_ITEMS.map((item) => (
              <ShareButton
                key={item.id}
                item={item}
                onPress={() => handleShare(item)}
                copied={copied}
              />
            ))}
          </View>

          {/* Direct link row */}
          <View style={styles.linkRow}>
            <View style={styles.linkPill}>
              <Feather name="globe" size={14} color={COLORS.primaryBlue} />
              <Text style={styles.linkPillText} numberOfLines={1}>
                {APP_DOMAIN}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.linkCopyBtn}
              onPress={async () => {
                const refCode = getReferralCode();
                const refParam = refCode ? `?ref=${refCode}` : '';
                await Clipboard.setStringAsync(`https://${APP_DOMAIN}${refParam}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              <Feather
                name={copied ? 'check' : 'copy'}
                size={14}
                color={COLORS.white}
              />
              <Text style={styles.linkCopyText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // ── Page Header ──────────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.textDark,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4A0',
  },
  headerBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.gold,
  },

  // ── Body ────────────────────────────────────────────────────────────────────
  body: {
    padding: 24,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // ── Preview Card ────────────────────────────────────────────────────────────
  previewCard: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 24,
    overflow: 'hidden',
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
    elevation: 14,
    position: 'relative',
  },
  blobTopRight: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -40,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -20,
  },
  previewInner: {
    padding: 24,
    gap: 16,
  },
  previewLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewLogo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAppName: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.white,
    letterSpacing: -0.4,
  },
  previewTagline: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  previewDomain: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: COLORS.white,
  },
  previewStatLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },

  // ── Section divider ─────────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Share Grid ──────────────────────────────────────────────────────────────
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  shareBtn: {
    width: 80,
    alignItems: 'center',
    gap: 8,
  },
  shareBtnIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
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
    elevation: 6,
  },
  shareBtnLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.textDark,
    textAlign: 'center',
  },

  // ── Link Row ────────────────────────────────────────────────────────────────
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    gap: 8,
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
  linkPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  linkPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: COLORS.primaryBlue,
    flex: 1,
  },
  linkCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkCopyText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.white,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: COLORS.textMuted,
  },
});

export default Share;