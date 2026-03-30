import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  ImageBackground,
  TextInput,
} from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#D4DEFF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  tagGreenBg: '#D9F99D',
  tagTxt: '#1F2937',
  paginationActiveBg: '#374151',
  paginationInactiveBg: '#E5E7EB',
  paginationInactiveTxt: '#6B7280',
  headerTxt: '#000000',
  white: '#FFFFFF',
};

// --- Mock Data ---
type MenuItem = { id: string; label: string; icon: any; active?: boolean };
const MENU_ITEMS: MenuItem[] = [
  { id: '1', label: 'Home', icon: 'home-outline' },
  { id: '2', label: 'Profile', icon: 'person-outline' },
  { id: '3', label: 'Favorites', icon: 'heart-outline' },
  { id: '4', label: 'My Tuitions', icon: 'school-outline' },
  { id: '5', label: 'Connect', icon: 'chatbubbles-outline' },
  { id: '6', label: 'Share', icon: 'share-social-outline' },
  { id: '7', label: 'Subscription', icon: 'pricetag-outline' },
  { id: '8', label: 'Billing', icon: 'document-text-outline' },
  { id: '9', label: 'Faq', icon: 'help-circle-outline' },
  { id: '10', label: 'Terms & Conditions', icon: 'document-outline' },
  { id: '11', label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
  { id: '12', label: 'Contact Us', icon: 'mail-outline' },
  { id: '13', label: 'Raise a Complaint', icon: 'alert-circle-outline' },
];

const CLASSES_DATA = [
  { id: '1', name: 'Class 8', teachers: '900 Teachers', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&q=80' },
  { id: '2', name: 'Class 9', teachers: '500 Teachers', image: 'https://images.unsplash.com/photo-1546410531-bea422015320?w=300&q=80' },
  { id: '3', name: 'Class 10', teachers: '700 Teachers', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80' },
  { id: '4', name: 'Class 11', teachers: '800 Teachers', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300&q=80' },
  { id: '5', name: 'Class 12', teachers: '950 Teachers', image: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=300&q=80' },
];

const THOUGHTS = [
  {
    id: '1',
    name: 'Robert Hammond',
    subject: 'Mathematics',
    time: '20 min. ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&fit=crop',
    text: "My wife prepared a surprise trip for me. I'm so thankful and I love her very much. Here are some of the best shots from our trip to Sri...",
    images: [
      "https://images.unsplash.com/photo-1588099719365-1d6837877292?w=400&q=80",
      "https://images.unsplash.com/photo-1588099719008-8e6840d04c0d?w=400&q=80"
    ],
    likes: 6, comments: 6, shares: 2
  },
  {
    id: '2',
    name: 'Robert Hammond',
    subject: 'Physics',
    time: '20 min. ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&fit=crop',
    text: "I'm selling these clothes. Anyone interested? Or shall we do a swap evening at mine? 😜",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
    ],
    likes: 6, comments: 6, shares: 2
  }
];

// --- Subcomponents ---

const Header = () => (
  <View style={styles.globalHeader}>
    <View style={styles.logoWrapper}>
      <Text style={styles.logoText}>Growsmart</Text>
    </View>

    <View style={styles.headerSearchWrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
        <TextInput 
          placeholder="Type in search" 
          placeholderTextColor={COLORS.textSecondary}
          style={styles.searchInput as any} 
        />
      </View>
    </View>

    <View style={styles.profileHeaderSection}>
      <TouchableOpacity style={styles.bellIcon}>
        <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerUserName}>Ben Goro</Text>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&fit=crop' }} style={styles.headerAvatar} />
    </View>
  </View>
);

const Sidebar = () => (
  <View style={styles.sidebarContainer}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
      <View style={styles.menuList}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.menuItem, item.active && styles.menuItemActive]}
          >
            <Ionicons 
              name={item.icon} 
              size={20} 
              color={item.active ? COLORS.primary : COLORS.textPrimary} 
            />
            <Text style={[styles.menuItemText, item.active && styles.menuItemTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sidebarBottom}>
        <View style={styles.adCard}>
          <Text style={styles.adTitleSmall}>Advertising</Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=600&q=80' }} 
            style={styles.adImage} 
          />
          <Text style={styles.adHeadline}>Summer sale is on!</Text>
          <Text style={styles.adSubtext}>Buy your loved pieces with reduced prices up to 70% off!</Text>
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.textPrimary} />
          <Text style={styles.menuItemText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textPrimary} />
          <Text style={styles.menuItemText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

const ThoughtsPanel = () => (
  <View style={styles.rightPanel}>
    <Text style={styles.rightPanelTitle}>Thoughts</Text>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.thoughtsList}>
      {THOUGHTS.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
            <View style={styles.postHeaderInfo}>
              <Text style={styles.postName}>
                {post.name} <Text style={styles.postSubject}>| {post.subject}</Text>
              </Text>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.postText}>{post.text}</Text>

          <View style={styles.postMediaGrid}>
            {post.images.slice(0, 4).map((img, idx) => (
                <Image 
                  key={idx} 
                  source={{ uri: img }} 
                  style={[styles.postMediaImage, { width: post.images.length > 2 ? '24%' : '48%' }]} 
                />
            ))}
          </View>

          <View style={styles.postActionsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="thumbs-up-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionTextBlue}>Like</Text>
              <View style={[styles.countBadge, {backgroundColor: '#EEF2FF'} ]}>
                <Text style={styles.countTextBlue}>{post.likes}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Thoughts</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{post.comments}</Text></View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.actionText}>Share</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{post.shares}</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const Banner = () => (
  <View style={styles.bannerContainer}>
    <Image source={{ uri: 'https://images.unsplash.com/photo-1522661067900-ab829854a57f?q=80&w=1200&fit=crop' }} style={styles.bannerImage} />
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerSmallText}>Knowledge is power</Text>
      <Text style={styles.bannerLargeText}>Learn relentlessly</Text>
    </View>
  </View>
);

const ClassCard = ({ item }: { item: typeof CLASSES_DATA[0] }) => (
  <View style={styles.classCardWrapper}>
    <View style={styles.classCardContainer}>
      <Image source={{ uri: item.image }} style={styles.classCardImage} resizeMode="cover" />
      <View style={styles.classCardContent}>
        <Text style={styles.classCardTitle}>{item.name}</Text>
        <View style={styles.classCardTag}>
          <Text style={styles.classCardTagText}>{item.teachers}</Text>
        </View>
      </View>
    </View>
  </View>
);

export default function CBSEClassesScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.rootLayout}>
        <Header />

        <View style={styles.mainColumnsLayout}>
          <Sidebar />

          {/* 2. CENTER CONTENT */}
          <View style={styles.centerContentContainer}>
            <ImageBackground 
              source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
              style={{ flex: 1 }}
              imageStyle={{ opacity: 0.15 }}
            >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
                
                {/* Navigation Title Header */}
                <View style={styles.pageNavHeader}>
                  <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.pageTitle}>CBSE | All Classes</Text>
                </View>

                {/* Main Bounded Container */}
                <View style={styles.boxContainer}>
                  
                  <Banner />

                  <View style={styles.gridContainer}>
                    {CLASSES_DATA.map(classItem => (
                      <ClassCard key={classItem.id} item={classItem} />
                    ))}
                  </View>

                </View>

                {/* Pagination */}
                <View style={styles.paginationRow}>
                  <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                    <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.pageBtnActive}>
                    <Text style={styles.pageBtnUserTextActive}>1</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.pageBtnInactive}>
                    <Text style={styles.pageBtnUserTextInactive}>2</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.pageBtnInactive}>
                    <Text style={styles.pageBtnUserTextInactive}>3</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.pageBtnInactiveArrow}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </ImageBackground>
          </View>

          <ThoughtsPanel />

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rootLayout: { flex: 1, flexDirection: 'column', backgroundColor: COLORS.cardBackground },

  // --- HEADER ---
  globalHeader: {
    flexDirection: 'row', alignItems: 'center', height: '8%', minHeight: 70,
    backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: 24,
  },
  logoWrapper: { width: Platform.OS === 'web' ? '18%' : wp(18), minWidth: 200 },
  logoText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primary },
  headerSearchWrapper: { flex: 1, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: 30, paddingHorizontal: 16, height: 44, width: '100%', maxWidth: 500,
  },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, outlineStyle: 'none' } as any,
  profileHeaderSection: {
    flexDirection: 'row', alignItems: 'center', width: Platform.OS === 'web' ? '25%' : wp(25),
    minWidth: 200, justifyContent: 'flex-end',
  },
  bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },
  headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },

  mainColumnsLayout: { flex: 1, flexDirection: 'row' },

  // --- SIDEBAR ---
  sidebarContainer: {
    width: Platform.OS === 'web' ? '18%' : wp(18), minWidth: 200, backgroundColor: COLORS.cardBackground,
    borderRightWidth: 1, borderRightColor: COLORS.border, paddingVertical: 24,
  },
  sidebarScroll: { paddingHorizontal: 20, paddingBottom: 20 },
  menuList: { marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  menuItemActive: { backgroundColor: '#EEF2FF' },
  menuItemText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginLeft: 14 },
  menuItemTextActive: { color: COLORS.primary, fontFamily: 'Poppins_600SemiBold' },
  sidebarBottom: { marginTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 },
  adCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginBottom: 20 },
  adTitleSmall: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.textPrimary, marginBottom: 10 },
  adImage: { width: '100%', height: 100, borderRadius: 8, marginBottom: 12 },
  adHeadline: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  adSubtext: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },

  // --- CENTER CONTENT ---
  centerContentContainer: { flex: 1 },
  centerContentScroll: { padding: 32, paddingBottom: 60 },
  
  pageNavHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBackground, marginRight: 16 
  },
  pageTitle: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.headerTxt },

  boxContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4DEFF', // light blue boundary
    padding: 24,
    marginBottom: 32,
  },

  // --- BANNER ---
  bannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'flex-end',
  },
  bannerSmallText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerLargeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
  },

  // --- CLASSES GRID & CARD ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16, // Use flex gap, but maintain percent widths
  },
  classCardWrapper: {
    // 2 cards per row. gap is 16px, so roughly ~48% to fit perfectly.
    width: '48.5%',
    marginBottom: 8,
  },
  classCardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary, // #3B5BFE outer edge mapped to requirement
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 140, // consistent fixed height
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  classCardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 20,
    backgroundColor: COLORS.background, // default loading bg color if unsplash is slow
  },
  classCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  classCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 12,
  },
  classCardTag: {
    backgroundColor: COLORS.tagGreenBg, // #D9F99D
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  classCardTagText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.tagTxt,
  },

  // --- PAGINATION ---
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pageBtnInactiveArrow: {
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnActive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationActiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnInactive: {
    width: 34, height: 34, backgroundColor: COLORS.paginationInactiveBg,
    borderRadius: 6, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnUserTextActive: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  pageBtnUserTextInactive: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.paginationInactiveTxt },

  // --- THOUGHTS PANEL ---
  rightPanel: {
    width: Platform.OS === 'web' ? '25%' : wp(25), minWidth: 300, backgroundColor: COLORS.cardBackground,
    borderLeftWidth: 1, borderLeftColor: COLORS.border, paddingTop: 32, paddingHorizontal: 24,
  },
  rightPanelTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: COLORS.primary, marginBottom: 24, textAlign: 'center' },
  thoughtsList: { paddingBottom: 40 },
  postCard: {
    marginBottom: 24, backgroundColor: COLORS.cardBackground, borderRadius: 16, padding: 16,
    shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10,
    elevation: 2, borderWidth: 1, borderColor: '#eff1f5'
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  postHeaderInfo: { flex: 1 },
  postName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary },
  postSubject: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary },
  postTime: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  postText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 12 },
  postMediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  postMediaImage: { height: 140, borderRadius: 8 },
  postActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 },
  actionTextBlue: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: COLORS.primary, marginLeft: 6 },
  countBadge: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  countText: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.textSecondary },
  countTextBlue: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: COLORS.primary },
});
