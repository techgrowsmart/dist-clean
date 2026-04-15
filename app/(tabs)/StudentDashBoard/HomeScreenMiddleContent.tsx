import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- Constants & Colors ---
const COLORS = {
  primary: '#3B5BFE',
  background: '#F5F7FB',
  cardBackground: '#FFFFFF',
  border: '#E5E7EB',
  blueBorder: '#CFD8FF', 
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  redAccent: '#EF4444',
  tagGreenBg: '#DCFCE7',
  tagGreenTxt: '#22C55E',
  tagPurpleBg: '#F3E8FF',
  tagPurpleTxt: '#A855F7',
  tagBlueBg: '#DBEAFE',
  tagBlueTxt: '#3B82F6',
  tagOrangeBg: '#F97316', 
  starGold: '#EAB308',
};

interface Teacher {
  _id: string;
  profilePic: string | any;
  name: string;
  email: string;
  isPopular?: boolean;
  rating?: number;
  experience?: number;
  price?: number;
  about?: string;
  tutions?: any[];
  language?: string;
  qualification?: string;
}

interface HomeScreenMiddleContentProps {
  allSpotlightSubjectTeachers?: Teacher[];
  allSpotlightSkillTeachers?: Teacher[];
  allPopularSubjectTeachers?: Teacher[];
  allPopularSkillTeachers?: Teacher[];
  loading?: boolean;
}

export default function HomeScreenMiddleContent({
  allSpotlightSubjectTeachers = [],
  allSpotlightSkillTeachers = [],
  allPopularSubjectTeachers = [],
  allPopularSkillTeachers = [],
  loading = false,
}: HomeScreenMiddleContentProps) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Animation for horizontal scrolling
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle scroll to update animation value
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Memoize data transformations to prevent re-renders
  const transformedData = useMemo(() => {
    // Get unique teachers and transform to required format
    const allSubjectTeachers = [...allPopularSubjectTeachers, ...allSpotlightSubjectTeachers];
    const uniqueSubjectTeachers = allSubjectTeachers.filter(
      (t, i, s) => i === s.findIndex(x => x.email === t.email)
    );

    const allSkillTeachers = [...allPopularSkillTeachers, ...allSpotlightSkillTeachers];
    const uniqueSkillTeachers = allSkillTeachers.filter(
      (t, i, s) => i === s.findIndex(x => x.email === t.email)
    );

    const myTutors = uniqueSubjectTeachers.slice(0, 5).map((teacher, index) => {
      const subjects = ['Chemistry', 'History', 'Mathematics', 'English Literature', 'Physical Education'];
      const colors = [
        { bg: COLORS.tagGreenBg, txt: COLORS.tagGreenTxt, shadow: COLORS.tagGreenTxt },
        { bg: COLORS.tagPurpleBg, txt: COLORS.tagPurpleTxt, shadow: COLORS.tagPurpleTxt },
        { bg: COLORS.tagBlueBg, txt: COLORS.tagBlueTxt, shadow: COLORS.tagBlueTxt },
      ];
      const color = colors[index % colors.length];
      const subject = teacher.tutions?.[0]?.subject || subjects[index % subjects.length];
      
      return {
        id: teacher._id,
        subject: subject,
        name: teacher.name,
        avatar: teacher.profilePic || `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 9)}?w=150&q=80`,
        tagBg: color.bg,
        tagTxt: color.txt,
        shadowColor: color.shadow,
      };
    });

    const trendingSubjectTeachers = allSpotlightSubjectTeachers.slice(0, 3).map((teacher) => {
      const subject = teacher.tutions?.[0]?.subject || 'Mathematics';
      return {
        id: teacher._id,
        spec: `${subject.toUpperCase()} SPECIALIST`,
        subject: subject,
        rating: '120',
        name: teacher.name,
        desc: teacher.about || 'Experienced educator specializing in middle school curriculum with a focus on excellence...',
        price: teacher.price ? `${teacher.price}/hr` : '800/hr',
        image: teacher.profilePic || `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 9)}?w=400&q=80`,
      };
    });

    const trendingSkillTeachers = allSpotlightSkillTeachers.slice(0, 3).map((teacher) => {
      const subject = teacher.tutions?.[0]?.subject || 'Music';
      return {
        id: teacher._id,
        spec: `${subject.toUpperCase()} SPECIALIST`,
        subject: subject,
        rating: '120',
        name: teacher.name,
        desc: teacher.about || 'Experienced educator specializing in middle school curriculum with a focus on excellence...',
        price: teacher.price ? `${teacher.price}/hr` : '800/hr',
        image: teacher.profilePic || `https://images.unsplash.com/photo-${Math.random().toString(36).substr(2, 9)}?w=400&q=80`,
      };
    });

    return {
      myTutors,
      trendingSubjectTeachers,
      trendingSkillTeachers,
    };
  }, [allSpotlightSubjectTeachers, allSpotlightSkillTeachers, allPopularSubjectTeachers, allPopularSkillTeachers]);

  // Auto-scroll animation
  useEffect(() => {
    if (transformedData.myTutors.length > 0) {
      const totalWidth = transformedData.myTutors.length * 156; // Card width + gap
      const scrollAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollX, {
            toValue: totalWidth - 300, // Stop before the end
            duration: 8000,
            useNativeDriver: false,
          }),
          Animated.timing(scrollX, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      
      scrollAnimation.start();
      
      return () => scrollAnimation.stop();
    }
  }, [scrollX, transformedData.myTutors.length]);

  // Memoize navigation handlers
  const handleTeacherPress = useCallback((teacher: any) => {
    router.push({
      pathname: '/(tabs)/StudentDashBoard/TeacherDetails' as any,
      params: {
        name: teacher.name,
        email: teacher.id,
        language: 'English',
        profilePic: teacher.avatar || teacher.image,
      },
    });
  }, [router]);

  const handleSeeAllTutors = useCallback(() => {
    router.push('/(tabs)/StudentDashBoard/AllBoardsPage' as any);
  }, [router]);

  const handleSeeAllSkills = useCallback(() => {
    router.push('/(tabs)/StudentDashBoard/AllSkills' as any);
  }, [router]);

  // Common Header component for the 2 big box panels
  const renderPanelBox = (titleIcon: any, titleStr: string, bodyContent: any, onSeeAll?: () => void) => (
    <View style={styles.contentBoxPanel}>
      <View style={styles.boxPanelHeader}>
        <View style={styles.boxPanelHeaderLeft}>
          <Ionicons name={titleIcon} size={20} color={COLORS.primary} />
          <Text style={styles.boxPanelTitle}>{titleStr}</Text>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.boxPanelHeaderRight}>See all &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.boxPanelBody}>
        {bodyContent}
      </View>
    </View>
  );

  const renderSpotlightGrid = useCallback((data: any[]) => (
    <>
      <View style={styles.inlineHeaderRow}>
        <View style={styles.inlineHeaderLeft}>
          <Text style={styles.inlineHeaderTitleNormal}>Tutors <Text style={styles.inlineHeaderTitleBold}>Spotlight</Text></Text>
          <Text style={styles.inlineHeaderTrending}>Trending</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.inlineHeaderRight}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spotlightGrid}>
        {data.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.spotlightCard}
            onPress={() => handleTeacherPress(item)}
          >
            <View style={styles.spotlightImageContainer}>
              <Image source={{ uri: item.image }} style={styles.spotlightImage} />
              <View style={styles.spotlightOverlayTag}>
                <Text style={styles.spotlightOverlayTxt}>{item.spec}</Text>
              </View>
            </View>
            <View style={styles.spotlightBody}>
              <View style={styles.spotlightRowTop}>
                <Text style={styles.spotlightSubject}>{item.subject}</Text>
                <View style={styles.spotlightRating}>
                  <Ionicons name="star" size={12} color={COLORS.starGold} />
                  <Text style={styles.spotlightRatingTxt}>({item.rating})</Text>
                </View>
              </View>
              <Text style={styles.spotlightName}>{item.name}</Text>
              <Text style={styles.spotlightDesc} numberOfLines={2}>{item.desc}</Text>
              
              <View style={styles.spotlightFooter}>
                <Text style={styles.spotlightPrice}>{item.price}</Text>
                <TouchableOpacity>
                  <Text style={styles.spotlightViewProfile}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.carouselDots}>
        <View style={styles.dotActive} />
        <View style={styles.dotInactive} />
        <View style={styles.dotInactive} />
      </View>
    </>
  ), [handleTeacherPress]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} 
      style={{ flex: 1 }}
      imageStyle={{ opacity: 0.15 }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.centerContentScroll}>
        
        {/* SECTION 1: My Tutors Panel */}
        {renderPanelBox('library', 'My Tutors', (
          <>
            <Animated.ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizCardScroll}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {transformedData.myTutors.map((tutor, index) => (
                <Animated.View
                  key={tutor.id}
                  style={[
                    styles.tutorVerticalCard,
                    {
                      transform: [
                        {
                          scale: scrollX.interpolate({
                            inputRange: [
                              (index - 1) * 156, // Card width + gap
                              index * 156,
                              (index + 1) * 156,
                            ],
                            outputRange: [0.9, 1, 0.9],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: scrollX.interpolate({
                            inputRange: [
                              (index - 1) * 156,
                              index * 156,
                              (index + 1) * 156,
                            ],
                            outputRange: [10, 0, 10],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.tutorCardInner}
                    onPress={() => handleTeacherPress(tutor)}
                  >
                    <View style={[styles.tutorTagPill, { backgroundColor: tutor.tagBg }]}>
                      <Text style={[styles.tutorTagTxt, { color: tutor.tagTxt }]}>{tutor.subject}</Text>
                    </View>
                    
                    <View style={[styles.tutorAvatarGlowWrapper, { shadowColor: tutor.shadowColor }]}>
                      <Image source={{ uri: tutor.avatar }} style={styles.tutorAvatarBig} />
                    </View>
                    
                    <Text style={styles.tutorNameMini}>{tutor.name}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.ScrollView>
            
            <View style={styles.carouselDots}>
              <View style={styles.dotActive} />
              <View style={styles.dotInactive} />
              <View style={styles.dotInactive} />
            </View>

            {/* Trending Grid 1 inside first box */}
            {renderSpotlightGrid(transformedData.trendingSubjectTeachers)}
          </>
        ), handleSeeAllTutors)}

        {/* SECTION 2: Skill Classes Panel */}
        {renderPanelBox('book', 'Skill Classes', (
          <>
            {/* Trending Grid 2 inside second box */}
            {renderSpotlightGrid(transformedData.trendingSkillTeachers)}
          </>
        ), handleSeeAllSkills)}
        
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContentScroll: {
    padding: 32,
    paddingBottom: 60,
  },
  contentBoxPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
    overflow: 'hidden',
  },
  boxPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  boxPanelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxPanelTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#3B5BFE',
    marginLeft: 10,
  },
  boxPanelHeaderRight: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#3B5BFE',
  },
  boxPanelBody: {
    padding: 24,
  },

  // My Tutors Vertical Cards
  horizCardScroll: {
    paddingBottom: 20,
    gap: 16,
  },
  tutorCardInner: {
    width: 140,
    height: 190,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorVerticalCard: {
    width: 140,
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 6px 10px rgba(0,0,0,0.06)' },
      default: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3 },
    }),
  },
  tutorTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  tutorTagTxt: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tutorAvatarGlowWrapper: {
    ...Platform.select({
      web: { boxShadow: '0 6px 14px rgba(0,0,0,0.4)' },
      default: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 4 },
    }),
  },
  tutorAvatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: 8,
  },
  tutorNameMini: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#000000',
    textAlign: 'center',
    marginTop: 10,
  },

  // Carousel Dots
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 6,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  // Spotlight Header
  inlineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inlineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineHeaderTitleNormal: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#1F2937',
  },
  inlineHeaderTitleBold: {
    fontFamily: 'Poppins_700Bold',
  },
  inlineHeaderTrending: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#EF4444',
  },
  inlineHeaderRight: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#3B5BFE',
  },

  // Spotlight Grid
  spotlightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  spotlightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  spotlightImageContainer: {
    position: 'relative',
    height: 180,
    width: '100%',
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightOverlayTag: {
    position: 'absolute',
    bottom: -10,
    left: 16,
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10,
  },
  spotlightOverlayTxt: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  spotlightBody: {
    padding: 16,
    paddingTop: 24,
  },
  spotlightRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spotlightSubject: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#1F2937',
  },
  spotlightRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotlightRatingTxt: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#6B7280',
  },
  spotlightName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  spotlightDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 20,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#1F2937',
  },
  spotlightViewProfile: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#3B5BFE',
  },
});
