import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { RedHatDisplay_400Regular } from '@expo-google-fonts/red-hat-display';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { BASE_URL, RAZORPAY_KEY } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import WebNavbar from '../../../components/WebNavbar';

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

const COLORS = { background: '#F5F7FB', cardBackground: '#FFFFFF', primaryGradientStart: '#4F6EF7', primaryGradientEnd: '#3B5BFE', primaryBlue: '#3B5BFE', accentGreen: '#22C55E', textPrimary: '#111827', textSecondary: '#6B7280', border: '#E5E7EB', white: '#FFFFFF' };

interface SubscriptionPlanProps { title: string; price: string; duration: string; note?: string; features: string[]; buttonText: string; badge?: string; isGradient?: boolean; footerText?: string; onSubscribe: (plan: any) => void; }

const PricingCard: React.FC<SubscriptionPlanProps> = ({ title, price, duration, note, features, badge, isGradient, footerText, onSubscribe }) => {
  const textColor = isGradient ? COLORS.white : COLORS.textPrimary;
  const subTextColor = isGradient ? 'rgba(255,255,255,0.8)' : COLORS.primaryBlue;
  const checkColor = isGradient ? 'rgba(255,255,255,0.6)' : COLORS.primaryBlue;
  const dividerColor = isGradient ? 'rgba(255, 255, 255, 0.2)' : COLORS.border;

  // Clean price value for API (remove ₹ symbol)
  const cleanPrice = price.replace('₹', '');
  // Detect intro offer by note or price being "1"
  const isIntroOffer = !!note || cleanPrice === "1";

  return (
    <View style={[styles.cardWrapper, isGradient ? styles.cardGradient : styles.cardWhite]}>
      {badge ? <View style={styles.badgeWrap}><Text style={styles.badgeText}>{badge}</Text></View> : <View style={{ height: 26, marginBottom: 16 }} />}
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      <View style={styles.priceContainer}>
        <Text style={[styles.priceMain, { color: isGradient ? COLORS.white : COLORS.primaryBlue }]}>{price}<Text style={[styles.priceDuration, { color: subTextColor }]}>{duration}</Text></Text>
        {note ? <Text style={styles.priceNote}>{note}</Text> : null}
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor, marginTop: note ? 12 : 24 }]} />
      <View style={styles.featuresList}>
        {features.map((item, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Ionicons name="checkmark" size={16} color={isGradient ? COLORS.white : COLORS.primaryBlue} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[styles.featureText, { color: textColor }]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.btnWrap}>
        <TouchableOpacity style={[styles.actionBtn, isGradient ? styles.actionBtnWhite : styles.actionBtnOutline]} onPress={() => onSubscribe({ title, price: cleanPrice, duration, isIntroOffer })}>
          <Text style={[styles.actionBtnText, isGradient ? { color: COLORS.textPrimary } : { color: COLORS.primaryBlue }]}>Get started with {title}</Text>
        </TouchableOpacity>
        {footerText ? <Text style={styles.footerText}>{footerText}</Text> : <View style={{ height: 30 }} />}
      </View>
    </View>
  );
};

const WebPricingCard: React.FC<SubscriptionPlanProps> = ({ title, price, duration, note, features, badge, isGradient, footerText, onSubscribe }) => {
  const textColor = isGradient ? COLORS.white : COLORS.textPrimary;
  const subTextColor = isGradient ? 'rgba(255,255,255,0.8)' : COLORS.primaryBlue;
  const dividerColor = isGradient ? 'rgba(255, 255, 255, 0.2)' : COLORS.border;

  // Clean price value for API (remove ₹ symbol)
  const cleanPrice = price.replace('₹', '');
  // Detect intro offer by note or price being "1"
  const isIntroOffer = !!note || cleanPrice === "1";

  return (
    <View style={[webStyles.cardWrapper, isGradient ? webStyles.cardGradient : webStyles.cardWhite]}>
      {badge ? <View style={webStyles.badgeWrap}><Text style={webStyles.badgeText}>{badge}</Text></View> : <View style={{ height: 26, marginBottom: 16 }} />}
      <Text style={[webStyles.cardTitle, { color: textColor }]}>{title}</Text>
      <View style={webStyles.priceContainer}>
        <Text style={[webStyles.priceMain, { color: isGradient ? COLORS.white : COLORS.primaryBlue }]}>{price}<Text style={[webStyles.priceDuration, { color: subTextColor }]}>{duration}</Text></Text>
        {note ? <Text style={webStyles.priceNote}>{note}</Text> : null}
      </View>
      <View style={[webStyles.divider, { backgroundColor: dividerColor, marginTop: note ? 12 : 24 }]} />
      <View style={webStyles.featuresList}>
        {features.map((item, idx) => (
          <View key={idx} style={webStyles.featureRow}>
            <Ionicons name="checkmark" size={14} color={isGradient ? COLORS.white : COLORS.primaryBlue} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={[webStyles.featureText, { color: textColor }]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={webStyles.btnWrap}>
        <TouchableOpacity style={[webStyles.actionBtn, isGradient ? webStyles.actionBtnWhite : webStyles.actionBtnOutline]} onPress={() => onSubscribe({ title, price: cleanPrice, duration, isIntroOffer })}>
          <Text style={[webStyles.actionBtnText, isGradient ? { color: COLORS.textPrimary } : { color: COLORS.primaryBlue }]}>Get started with {title}</Text>
        </TouchableOpacity>
        {footerText ? <Text style={webStyles.footerText}>{footerText}</Text> : <View style={{ height: 30 }} />}
      </View>
    </View>
  );
};

const GlobalHeader = () => (
  <View style={styles.globalHeader}>
    <View style={styles.logoWrapper}><Text style={styles.logoText}>Growsmart</Text></View>
    <View style={styles.headerSearchWrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
        <TextInput placeholder="Type in search" placeholderTextColor={COLORS.textSecondary} style={styles.searchInput as any} />
      </View>
    </View>
    <View style={styles.profileHeaderSection}>
      <TouchableOpacity style={styles.bellIcon}><Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} /></TouchableOpacity>
      <Text style={styles.headerUserName}>Ben Goro</Text>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&fit=crop' }} style={styles.headerAvatar} />
    </View>
  </View>
);

const AndroidLayout = ({ router, plans, handleSubscribe, fontsLoaded, handleBackPress }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.rootLayout}>
      <GlobalHeader />
      <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} style={styles.bgMainContent} imageStyle={{ opacity: 0.15 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
          <View style={styles.backButtonWrap}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.contentConstraints}>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Choose Your Learning Path</Text>
              <Text style={styles.headerSubtitle}>Unlock premium features and expert-led courses designed to accelerate your career growth.</Text>
            </View>
            <View style={styles.pricingGrid}>
              {plans.map((plan, index) => <PricingCard key={index} {...plan} onSubscribe={handleSubscribe} />)}
            </View>
            <View style={styles.brandSectionCard}>
              <View style={styles.brandLeft}>
                <View style={styles.shapesRow}>
                  <View style={styles.shapeCircleOrange} /><View style={styles.shapeTriangleRight} /><View style={styles.shapeSquareGreen} /><View style={styles.shapeCircleGray} />
                </View>
                <Text style={styles.brandGiantLogo}>GrowSmart</Text>
                <Text style={styles.brandTagline}>Empowering Students. Connecting Futures</Text>
              </View>
              <View style={styles.brandCenterAvatar}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80' }} style={styles.avatarImage} resizeMode="cover" />
              </View>
              <View style={styles.brandRight}>
                <View style={styles.carouselIndicators}><View style={styles.carouselActive} /><View style={styles.carouselInactive} /></View>
                <Text style={styles.brandRightText}>Unlock Quality Learning From India's Best Teachers. Anytime. Anywhere.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  </SafeAreaView>
);

const WebLayout = ({ router, plans, handleSubscribe, fontsLoaded, handleBackPress }) => {
  const params = useLocalSearchParams();
  const paramStudentName = typeof params.studentName === 'string' ? params.studentName : null;
  const paramProfileImage = typeof params.profileImage === 'string' ? params.profileImage : null;
  const [studentName, setStudentName] = useState(paramStudentName || "Student");
  const [profileImage, setProfileImage] = useState<string | null>(paramProfileImage || null);
  const [unreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const auth = await getAuthData();
        if (auth?.name && !paramStudentName) setStudentName(auth.name);
        if (auth?.profileImage && !paramProfileImage) setProfileImage(auth.profileImage);
      } catch {}
    };
    loadUserData();
  }, [paramStudentName, paramProfileImage]);

  return (
    <View style={webStyles.page}>
      <WebNavbar studentName={studentName} profileImage={profileImage} unreadCount={unreadCount} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <ImageBackground source={{ uri: 'https://www.transparenttextures.com/patterns/clean-texturing.png' }} style={webStyles.bgMainContent} imageStyle={{ opacity: 0.15 }}>
        <ScrollView style={webStyles.centerOnlyContent} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          <View style={webStyles.backButtonWrap}>
            <TouchableOpacity style={webStyles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={webStyles.contentConstraints}>
            <View style={webStyles.headerCard}>
              <Text style={webStyles.headerTitle}>Choose Your Learning Path</Text>
              <Text style={webStyles.headerSubtitle}>Unlock premium features and expert-led courses designed to accelerate your career growth.</Text>
            </View>
            <View style={webStyles.pricingGrid}>
              {plans.map((plan, index) => <WebPricingCard key={index} {...plan} onSubscribe={handleSubscribe} />)}
            </View>
            <View style={webStyles.brandSectionCard}>
              <View style={webStyles.brandLeft}>
                <View style={webStyles.shapesRow}>
                  <View style={webStyles.shapeCircleOrange} /><View style={webStyles.shapeTriangleRight} /><View style={webStyles.shapeSquareGreen} /><View style={webStyles.shapeCircleGray} />
                </View>
                <Text style={webStyles.brandGiantLogo}>GrowSmart</Text>
                <Text style={webStyles.brandTagline}>Empowering Students. Connecting Futures</Text>
              </View>
              <View style={webStyles.brandCenterAvatar}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80' }} style={webStyles.avatarImage} resizeMode="cover" />
              </View>
              <View style={webStyles.brandRight}>
                <View style={webStyles.carouselIndicators}><View style={webStyles.carouselActive} /><View style={webStyles.carouselInactive} /></View>
                <Text style={webStyles.brandRightText}>Unlock Quality Learning From India's Best Teachers. Anytime. Anywhere.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default function Subscription() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, RedHatDisplay_400Regular, Inter_600SemiBold, Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold });

  // Extract spotlight payment parameters
  const isSpotlightPayment = params.isSpotlightPayment === 'true';
  const teacherEmail = typeof params.teacherEmail === 'string' ? params.teacherEmail : null;
  const teacherName = typeof params.teacherName === 'string' ? params.teacherName : null;
  const redirectTo = typeof params.redirectTo === 'string' ? params.redirectTo : null;

  const handleBackPress = useCallback(() => { 
    if (redirectTo === 'TeacherDetails' && teacherEmail) {
      router.push({ pathname: '/(tabs)/StudentDashBoard/TeacherDetails', params: { email: teacherEmail } });
    } else {
      router.push('/(tabs)/StudentDashBoard/Student');
    }
  }, [router, redirectTo, teacherEmail]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleBackPress(); };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [handleBackPress]);

  const handleSubscribe = async (plan: any) => {
    try {
      const auth = await getAuthData();
      if (!auth?.token || !auth?.email) {
        return Alert.alert("Session Expired", "Please log in again.");
      }

      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };

      // Ensure price is a clean numeric string
      const planPrice = String(plan.price || "0").replace(/[^0-9.]/g, '');
      const isIntroOffer = plan.isIntroOffer || planPrice === "0" || planPrice === "1";

      // Create order (backend handles free orders internally)
      const orderResponse = await axios.post(
        `${BASE_URL}/api/subscriptions/create-order`,
        { amount: isIntroOffer ? "0" : planPrice, plan_title: plan.title, duration: plan.duration },
        { headers }
      );

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      // For web platform, only allow intro offers (paid subscriptions require mobile app)
      if (Platform.OS === 'web' && !isIntroOffer) {
        return Alert.alert(
          "Mobile App Required",
          "Paid subscriptions require the Grow Smart mobile app. The Intro Offer (₹1) is available on web."
        );
      }

      // Handle intro offer (free/₹1 subscription) - skip Razorpay
      if (isIntroOffer) {
        const subscriptionRes = await axios.post(
          `${BASE_URL}/api/subscriptions/create-subscription`,
          { plan_title: plan.title, amount: "0", is_intro_offer: true, duration: plan.duration },
          { headers }
        );

        if (subscriptionRes.data.success) {
          // If this is a spotlight payment, update teacher's isSpotlight to true
          if (isSpotlightPayment && teacherEmail && teacherName) {
            try {
              await axios.post(
                `${BASE_URL}/api/payments/verify-payment-spotlight`,
                {
                  orderId: orderResponse.data.order.id,
                  paymentId: orderResponse.data.order.id,
                  signature: 'intro_offer_signature',
                  email: teacherEmail,
                  name: teacherName,
                  amount: "0"
                },
                { headers }
              );
              console.log('✅ Teacher spotlight activated successfully');
            } catch (spotlightError) {
              console.error('Error activating spotlight:', spotlightError);
              // Continue even if spotlight activation fails
            }

            // Redirect back to TeacherDetails after spotlight activation
            router.push({
              pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
              params: { email: teacherEmail }
            });
          } else {
            router.push({
              pathname: '/(tabs)/StudentDashBoard/CongratsStudent',
              params: { planTitle: plan.title, validityDate: subscriptionRes.data.validity_date }
            });
          }
        } else {
          throw new Error(subscriptionRes.data.message || 'Failed to activate subscription');
        }
        return;
      }

      // Handle paid subscription with Razorpay
      const options = {
        description: `${plan.title} Subscription`,
        image: "https://your-logo-url.png",
        currency: "INR",
        key: RAZORPAY_KEY,
        amount: orderResponse.data.order.amount, // Amount in paise from backend
        order_id: orderResponse.data.order.id,
        name: "Grow Smart Subscription",
        prefill: { email: auth.email, name: auth.name || "Student" },
        theme: { color: "#3164f4" },
        modal: { ondismiss: () => Alert.alert("Payment Cancelled", "Payment window was closed") }
      };

      const paymentData = await RazorpayCheckout.open(options);

      const subscriptionRes = await axios.post(
        `${BASE_URL}/api/subscriptions/create-subscription`,
        {
          plan_title: plan.title,
          amount: planPrice,
          payment_id: paymentData.razorpay_payment_id,
          order_id: paymentData.razorpay_order_id,
          signature: paymentData.razorpay_signature,
          duration: plan.duration
        },
        { headers }
      );

      if (subscriptionRes.data.success) {
        // If this is a spotlight payment, update teacher's isSpotlight to true
        if (isSpotlightPayment && teacherEmail && teacherName) {
          try {
            await axios.post(
              `${BASE_URL}/api/payments/verify-payment-spotlight`,
              {
                orderId: paymentData.razorpay_order_id,
                paymentId: paymentData.razorpay_payment_id,
                signature: paymentData.razorpay_signature,
                email: teacherEmail,
                name: teacherName,
                amount: planPrice
              },
              { headers }
            );
            console.log('✅ Teacher spotlight activated successfully');
          } catch (spotlightError) {
            console.error('Error activating spotlight:', spotlightError);
            // Continue even if spotlight activation fails
          }

          // Redirect back to TeacherDetails after spotlight activation
          router.push({
            pathname: '/(tabs)/StudentDashBoard/TeacherDetails',
            params: { email: teacherEmail }
          });
        } else {
          router.push({
            pathname: '/(tabs)/StudentDashBoard/CongratsStudent',
            params: { planTitle: plan.title, validityDate: subscriptionRes.data.validity_date }
          });
        }
      } else {
        throw new Error(subscriptionRes.data.message || 'Failed to activate subscription');
      }
    } catch (error: any) {
      console.error('Payment error:', error);

      if (error?.description) {
        Alert.alert("Payment Cancelled", error.description);
      } else if (error?.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else if (error.message) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    }
  };

  if (!fontsLoaded) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primaryBlue} /></View>;

  const plans = [
    {
      title: "Intro Offer",
      price: "₹1",
      duration: "/ 365 days",
      note: "₹1 for early users",
      features: [
        "Unlimited Access to all Gurus",
        "All Premium Tools",
        "Early Feature Access",
        "Advanced tools & analytics",
        "Faster performance",
        "Early access to new updates"
      ],
      buttonText: "Get started with Intro Offer",
      badge: "🚀 Introductory Offer for Early Users",
      isGradient: true,
      footerText: "🚀 Limited-Time Introductory Offer 🚀\nValid till 6th June 2026"
    },
    {
      title: "TeachLite",
      price: "₹300",
      duration: "/ 90 days",
      features: [
        "Learn at your pace",
        "Never miss a class update",
        "Begin your skill-building journey"
      ],
      buttonText: "Get started with TeachLite",
      isGradient: false
    },
    {
      title: "TeachStart",
      price: "₹415",
      duration: "/ 180 days",
      features: [
        "Expand your learning",
        "Stay updated instantly",
        "Boost your learning with more classes"
      ],
      buttonText: "Get started with TeachStart",
      badge: "Best Value",
      isGradient: true
    },
    {
      title: "GuruGrade",
      price: "₹730",
      duration: "/ 365 days",
      features: [
        "Go all-in on learning",
        "Premium alerts & early access",
        "Unlock full learning access"
      ],
      buttonText: "Get started with GuruGrade",
      isGradient: false
    }
  ];

  return Platform.OS === "web" ? <WebLayout router={router} plans={plans} handleSubscribe={handleSubscribe} fontsLoaded={fontsLoaded} handleBackPress={handleBackPress} /> : <AndroidLayout router={router} plans={plans} handleSubscribe={handleSubscribe} fontsLoaded={fontsLoaded} handleBackPress={handleBackPress} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cardBackground },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rootLayout: { flex: 1, flexDirection: 'column' },
  globalHeader: { flexDirection: 'row', alignItems: 'center', height: '8%', minHeight: 70, backgroundColor: COLORS.cardBackground, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 24, zIndex: 10 },
  logoWrapper: { width: Platform.OS === 'web' ? '18%' : wp(18), minWidth: 200 },
  logoText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: COLORS.primaryBlue },
  headerSearchWrapper: { flex: 1, alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 30, paddingHorizontal: 16, height: 44, width: '100%', maxWidth: 500 },
  searchInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textPrimary, outlineStyle: 'none' } as any,
  profileHeaderSection: { flexDirection: 'row', alignItems: 'center', width: Platform.OS === 'web' ? '25%' : wp(25), minWidth: 200, justifyContent: 'flex-end' },
  bellIcon: { marginRight: 20, padding: 8, backgroundColor: COLORS.background, borderRadius: 20 },
  headerUserName: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: COLORS.textPrimary, marginRight: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  bgMainContent: { flex: 1, width: '100%' },
  mainScroll: { paddingVertical: 40, alignItems: 'center' },
  backButtonWrap: { width: '85%', maxWidth: 1200, alignSelf: 'center', marginBottom: 20, paddingHorizontal: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' }, default: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 } }) },
  contentConstraints: { width: '85%', maxWidth: 1200, alignItems: 'center' },
  headerCard: { width: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 16, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2 } }) },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 40, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  headerSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#3B5BFE', textAlign: 'center' },
  pricingGrid: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', gap: 20, marginBottom: 40, flexWrap: 'wrap' },
  cardWrapper: { flex: 1, minWidth: 240, borderRadius: 16, padding: 24, minHeight: 450, flexDirection: 'column' },
  cardGradient: { backgroundColor: COLORS.primaryBlue, ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(59, 91, 254, 0.4)' }, default: { shadowColor: 'rgba(59, 91, 254, 0.4)', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10 } }) },
  cardWhite: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1 } }) },
  badgeWrap: { backgroundColor: COLORS.accentGreen, alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 20, marginBottom: 16, height: 26, justifyContent: 'center' },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: COLORS.white },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, textAlign: 'center', marginBottom: 16 },
  priceContainer: { alignItems: 'center', minHeight: 60 },
  priceMain: { fontFamily: 'Poppins_700Bold', fontSize: 32 },
  priceDuration: { fontFamily: 'Poppins_400Regular', fontSize: 14 },
  priceNote: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  divider: { height: 1, width: '100%', marginVertical: 24 },
  featuresList: { flex: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featureText: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, flex: 1 },
  btnWrap: { width: '100%', marginTop: 'auto', paddingTop: 24, alignItems: 'center' },
  actionBtn: { width: '100%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  actionBtnWhite: { backgroundColor: COLORS.white },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primaryBlue },
  actionBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  footerText: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', height: 30 },
  brandSectionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 16, padding: 32, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2 } }), position: 'relative', overflow: 'hidden' },
  brandLeft: { flex: 1, zIndex: 2 },
  shapesRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'center' },
  shapeCircleOrange: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316' },
  shapeTriangleRight: { width: 0, height: 0, borderTopWidth: 20, borderTopColor: 'transparent', borderBottomWidth: 20, borderBottomColor: 'transparent', borderLeftWidth: 35, borderLeftColor: COLORS.primaryBlue },
  shapeSquareGreen: { width: 40, height: 40, backgroundColor: '#86EFAC', borderRadius: 4 },
  shapeCircleGray: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D1D5DB' },
  brandGiantLogo: { fontFamily: 'Poppins_700Bold', fontSize: 44, color: COLORS.textPrimary, lineHeight: 52 },
  brandTagline: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: COLORS.textPrimary },
  brandCenterAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 220, height: 220, borderRadius: 110, marginTop: 40 },
  brandRight: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: 40, alignSelf: 'stretch', paddingBottom: 20 },
  carouselIndicators: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  carouselActive: { width: 24, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryBlue },
  carouselInactive: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  brandRightText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});

const webStyles = StyleSheet.create({
  page: { flex: 1, flexDirection: "column", backgroundColor: COLORS.cardBackground },
  bgMainContent: { flex: 1, width: '100%' },
  centerOnlyContent: { flex: 1 },
  backButtonWrap: { width: '85%', maxWidth: 1200, alignSelf: 'center', marginBottom: 20, marginTop: 20, paddingHorizontal: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.05)' }, default: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 } }) },
  contentConstraints: { width: '85%', maxWidth: 1200, alignSelf: 'center', alignItems: 'center' },
  headerCard: { width: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 16, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2 } }) },
  headerTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 40, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  headerSubtitle: { fontFamily: 'Montserrat_400Regular', fontSize: 16, color: '#3B5BFE', textAlign: 'center' },
  pricingGrid: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', gap: 20, marginBottom: 40, flexWrap: 'wrap' },
  cardWrapper: { flex: 1, minWidth: 240, borderRadius: 16, padding: 20, minHeight: 420, flexDirection: 'column' },
  cardGradient: { backgroundColor: COLORS.primaryBlue, ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(59, 91, 254, 0.4)' }, default: { shadowColor: 'rgba(59, 91, 254, 0.4)', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10 } }) },
  cardWhite: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 1 } }) },
  badgeWrap: { backgroundColor: COLORS.accentGreen, alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 20, marginBottom: 16, height: 26, justifyContent: 'center' },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: COLORS.white },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, textAlign: 'center', marginBottom: 12 },
  priceContainer: { alignItems: 'center', minHeight: 50 },
  priceMain: { fontFamily: 'Poppins_700Bold', fontSize: 28 },
  priceDuration: { fontFamily: 'Poppins_400Regular', fontSize: 12 },
  priceNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  featuresList: { flex: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  featureText: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18, flex: 1 },
  btnWrap: { width: '100%', marginTop: 'auto', paddingTop: 20, alignItems: 'center' },
  actionBtn: { width: '100%', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  actionBtnWhite: { backgroundColor: COLORS.white },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primaryBlue },
  actionBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  footerText: { fontFamily: 'Poppins_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.7)', textAlign: 'center', height: 26 },
  brandSectionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.02)' }, default: { shadowColor: 'rgba(0,0,0,0.02)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 2 } }), position: 'relative', overflow: 'hidden', marginBottom: 32 },
  brandLeft: { flex: 1, zIndex: 2 },
  shapesRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'center' },
  shapeCircleOrange: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F97316' },
  shapeTriangleRight: { width: 0, height: 0, borderTopWidth: 18, borderTopColor: 'transparent', borderBottomWidth: 18, borderBottomColor: 'transparent', borderLeftWidth: 32, borderLeftColor: COLORS.primaryBlue },
  shapeSquareGreen: { width: 36, height: 36, backgroundColor: '#86EFAC', borderRadius: 4 },
  shapeCircleGray: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1D5DB' },
  brandGiantLogo: { fontFamily: 'Poppins_700Bold', fontSize: 38, color: COLORS.textPrimary, lineHeight: 46 },
  brandTagline: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.textPrimary },
  brandCenterAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 180, height: 180, borderRadius: 90, marginTop: 30 },
  brandRight: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-end', paddingLeft: 30, alignSelf: 'stretch', paddingBottom: 16 },
  carouselIndicators: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  carouselActive: { width: 20, height: 5, borderRadius: 3, backgroundColor: COLORS.primaryBlue },
  carouselInactive: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  brandRightText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});