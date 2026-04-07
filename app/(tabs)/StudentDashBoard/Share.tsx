import React, { useState, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import WebNavbar from '../../../components/ui/WebNavbar';
import WebSidebar from '../../../components/ui/WebSidebar';
import { TeacherThoughtsBackground } from '../../../components/ui/TeacherThoughtsCard';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Feather, FontAwesome, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_DOMAIN      = 'gogrowsmart.com';
const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.gogrowsmart.app';
const APP_STORE_LINK  = 'https://apps.apple.com/app/gogrowsmart';
const CONTACT_EMAIL   = 'contact@gogrowsmart.com';
const SHARE_MESSAGE   = `🎓 Level up your learning with GrowSmart!\n\nConnect with expert tutors, track your progress & ace every exam.\n\n📲 Download now: ${PLAY_STORE_LINK}\n🌐 Visit: https://${APP_DOMAIN}`;

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
          <Text style={styles.previewTagline}>Learn · Grow · Succeed</Text>
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
  const { userEmail, studentName, profileImage } =
    useLocalSearchParams<{ userEmail: string; studentName: string; profileImage: string }>();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [sidebarActiveItem, setSidebarActiveItem] = useState('Share');
  const [copied, setCopied] = useState(false);

  // ── Sidebar navigation ──────────────────────────────────────────────────────
  const handleSelect = (item: string) => {
    setSidebarActiveItem(item);
    const routes: Record<string, string> = {
      Home:         '/(tabs)/StudentDashBoard/Student',
      'My Tuitions':'/(tabs)/StudentDashBoard/MyTuitions',
      Connect:      '/(tabs)/StudentDashBoard/ConnectWeb',
      Profile:      '/(tabs)/StudentDashBoard/Profile',
      Billing:      '/(tabs)/Billing',
      Faq:          '/(tabs)/StudentDashBoard/Faq',
      'Contact Us': '/(tabs)/Contact',
    };
    if (item === 'Subscription') {
      router.push({ pathname: '/(tabs)/StudentDashBoard/Subscription', params: { userEmail } } as any);
    } else if (routes[item]) {
      router.push(routes[item] as any);
    }
  };

  // ── Share handler ───────────────────────────────────────────────────────────
  const handleShare = async (item: typeof SHARE_ITEMS[0]) => {
    const encodedMsg  = encodeURIComponent(SHARE_MESSAGE);
    const encodedLink = encodeURIComponent(PLAY_STORE_LINK);

    try {
      switch (item.title) {
        case 'Copy Link': {
          await Clipboard.setStringAsync(`https://${APP_DOMAIN}\n${PLAY_STORE_LINK}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          break;
        }
        case 'WhatsApp': {
          const url = `whatsapp://send?text=${encodedMsg}`;
          const webUrl = `https://wa.me/?text=${encodedMsg}`;
          const canOpen = await Linking.canOpenURL(url);
          Linking.openURL(canOpen ? url : webUrl);
          break;
        }
        case 'Facebook': {
          const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMsg}`;
          Linking.openURL(url);
          break;
        }
        case 'LinkedIn': {
          const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}&summary=${encodedMsg}`;
          Linking.openURL(url);
          break;
        }
        case 'Messenger': {
          const deepLink = `fb-messenger://share?link=${encodedLink}`;
          const webLink  = `https://www.facebook.com/dialog/send?link=${encodedLink}&app_id=145634995501895&redirect_uri=${encodedLink}`;
          Linking.openURL(deepLink).catch(() => Linking.openURL(webLink));
          break;
        }
        case 'Mail': {
          const subject = encodeURIComponent('🎓 Join me on GrowSmart – Best Learning Platform!');
          const body    = encodeURIComponent(SHARE_MESSAGE);
          Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
          break;
        }
        case 'Twitter / X': {
          const tweet = encodeURIComponent(`🎓 Level up your learning with @GrowSmart!\nDownload: ${PLAY_STORE_LINK} #Education #OnlineLearning`);
          const url = `https://twitter.com/intent/tweet?text=${tweet}`;
          Linking.openURL(url);
          break;
        }
        case 'Telegram': {
          const url = `https://t.me/share/url?url=${encodedLink}&text=${encodedMsg}`;
          Linking.openURL(url);
          break;
        }
        default: {
          // Native share sheet
          await RNShare.share({
            title:   '🎓 GrowSmart – Learn & Grow',
            message: SHARE_MESSAGE,
            url:     PLAY_STORE_LINK,  // iOS only
          });
        }
      }
    } catch (err) {
      console.error('Share error:', err);
      Alert.alert('Oops!', 'Could not open the share option. Please try again.');
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
      <WebNavbar
        studentName={studentName || 'Student'}
        profileImage={profileImage || null}
      />

      <View style={styles.contentLayout}>
        <WebSidebar
          activeItem={sidebarActiveItem}
          onItemPress={handleSelect}
          userEmail={userEmail || ''}
          studentName={studentName || 'Student'}
          profileImage={profileImage || null}
        />

        {/* ── Main area ── */}
        <ScrollView
          style={styles.mainWrapper}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page header */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageTitle}>Share GrowSmart</Text>
              <Text style={styles.pageSubtitle}>
                Invite friends, parents & peers to join the platform
              </Text>
            </View>
            <View style={styles.headerBadge}>
              <Feather name="gift" size={14} color={COLORS.gold} />
              <Text style={styles.headerBadgeText}>Refer & Earn</Text>
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
                  await Clipboard.setStringAsync(`https://${APP_DOMAIN}`);
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

            {/* Info footer */}
            <View style={styles.footer}>
              <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.footerText}>
                Earn rewards every time a friend joins using your link.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Share;

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentLayout: {
    flex: 1,
    flexDirection: 'row',
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