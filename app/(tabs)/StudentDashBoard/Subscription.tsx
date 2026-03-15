import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { RedHatDisplay_400Regular } from '@expo-google-fonts/red-hat-display';
import { Fontisto } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import BackButton from '../../../components/BackButton';
import { BASE_URL, RAZOR_PAY_KEY } from '../../../config';
import { getAuthData } from '../../../utils/authStorage';
import BottomNavigation from '../BottomNavigation';

const { width, height } = Dimensions.get('window');

const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

interface SubscriptionPlanProps {
  title: string;
  price: string;
  duration: string;
  features: string[];
  buttonText: string;
  priceColor: string;
  checkColor: string;
  backgroundColor?: string;
  bestValueTag?: boolean;
  isIntroOffer?: boolean;
  onSubscribe: (plan: any) => void;
}

const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ 
  title, 
  price, 
  duration, 
  features, 
  buttonText, 
  priceColor, 
  checkColor,
  backgroundColor = '#ffffff',
  bestValueTag = false,
  isIntroOffer = false,
  onSubscribe
}) => {
  const isPurpleCard = backgroundColor !== '#ffffff';
  const titleColor = isPurpleCard ? '#ffffff' : '#000000';
  const dividerColor = isPurpleCard ? 'rgba(255, 255, 255, 0.3)' : '#e0e0e0';
  const buttonBgColor = '#ffffff';
  const buttonTextColor = isPurpleCard ? '#6b6bff' : '#5f5fff';
  const buttonBorderColor = isPurpleCard ? '#ffffff' : '#5f5fff';

  const handlePress = () => {
    onSubscribe({ title, price, duration, buttonText });
  };

  return (
    <View style={[styles.planCard, { backgroundColor, borderColor: isPurpleCard ? backgroundColor : '#d0d0d0' }]}>
      {isIntroOffer && (
        <View style={styles.introOfferTag}>
          <Text style={styles.introOfferText}>✅ Introductory Offer for Early Users</Text>
        </View>
      )}
      
      {bestValueTag && !isIntroOffer && (
        <View style={styles.bestValueTag}>
          <Text style={styles.bestValueText}>Best Value</Text>
        </View>
      )}

      <Text style={[styles.planTitle, { color: titleColor }]}>{title}</Text>
      
      <View style={styles.priceContainer}>
        {isIntroOffer ? (
          <>
            <Text style={styles.originalPrice}>₹730 /</Text>
            <Text style={[styles.duration, { color: '#ffffff' }]}>{duration}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.price, { color: isPurpleCard ? '#ffffff' : priceColor }]}>₹{price}/</Text>
            <Text style={[styles.duration, { color: isPurpleCard ? '#ffffff' : '#5f5fff' }]}>{duration}</Text>
          </>
        )}
      </View>

      {isIntroOffer && (
        <Text style={styles.earlyUserText}>₹0 for early users</Text>
      )}

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Fontisto name="check" size={scale(14)} color={checkColor} style={styles.checkIcon}/>
            <Text style={[styles.featureText, { color: titleColor }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, { borderWidth: isPurpleCard ? 0 : 1.5, borderColor: buttonBorderColor, backgroundColor: buttonBgColor, paddingVertical: scale(14) }]} activeOpacity={0.7} onPress={handlePress}>
        <Text style={[styles.buttonText, { color: buttonTextColor }]}>{buttonText}</Text>
      </TouchableOpacity>
      
      {isIntroOffer && (
        <View style={styles.limitedTimeContainer}>
          <Text style={styles.limitedTimeText}>🎉 Limited-Time Introductory Offer 🎉</Text>
          <Text style={styles.validityText}>Valid till 6th June 2026</Text>
        </View>
      )}
    </View>
  );
};

// Web Subscription Plan Component (Uizard Design)
const WebSubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ 
  title, 
  price, 
  duration, 
  features, 
  buttonText, 
  priceColor, 
  checkColor,
  backgroundColor = '#ffffff',
  bestValueTag = false,
  isIntroOffer = false,
  onSubscribe
}) => {
  const isPurpleCard = backgroundColor !== '#ffffff';
  const titleColor = isPurpleCard ? '#ffffff' : '#000000';
  const dividerColor = isPurpleCard ? 'rgba(255, 255, 255, 0.3)' : '#e0e0e0';
  const buttonBgColor = '#ffffff';
  const buttonTextColor = isPurpleCard ? '#6b6bff' : '#5f5fff';
  const buttonBorderColor = isPurpleCard ? '#ffffff' : '#5f5fff';

  const handlePress = () => {
    onSubscribe({ title, price, duration, buttonText });
  };

  return (
    <View style={[webStyles.planCard, { backgroundColor, borderColor: isPurpleCard ? backgroundColor : '#d0d0d0' }]}>
      {isIntroOffer && (
        <View style={webStyles.introOfferTag}>
          <Text style={webStyles.introOfferText}>🚀 Introductory Offer for Early Users</Text>
        </View>
      )}
      
      {bestValueTag && !isIntroOffer && (
        <View style={webStyles.bestValueTag}>
          <Text style={webStyles.bestValueText}>Best Value</Text>
        </View>
      )}

      <Text style={[webStyles.planTitle, { color: titleColor }]}>{title}</Text>
      
      <View style={webStyles.priceContainer}>
        {isIntroOffer ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'nowrap' }}>
            <Text style={[webStyles.originalPrice, { textDecorationLine: "line-through", fontSize: 20 }]}>₹730 / </Text>
            <Text style={[webStyles.originalPrice, { textDecorationLine: "line-through", fontSize: 14, color: '#ffffff' }]}>365 days</Text>
          </View>
        ) : (
          <>
            <Text style={[webStyles.price, { color: isPurpleCard ? '#ffffff' : priceColor }]}>₹{price} /</Text>
            <Text style={[webStyles.duration, { color: isPurpleCard ? '#ffffff' : '#666666' }]}>{duration}</Text>
          </>
        )}
      </View>

      {isIntroOffer && (
        <Text style={webStyles.earlyUserText}>₹0 for early users</Text>
      )}

      <View style={[webStyles.planDivider, { backgroundColor: dividerColor }]} />

      <View style={webStyles.planFeaturesContainer}>
        {features.map((feature, index) => (
          <View key={index} style={webStyles.planFeatureRow}>
            <Text style={[webStyles.planCheckIcon, { color: checkColor }]}>✔</Text>
            <Text style={[webStyles.planFeatureText, { color: isPurpleCard ? '#ffffff' : '#333333' }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[webStyles.planButton, { backgroundColor: buttonBgColor, borderColor: buttonBorderColor }]}
        onPress={handlePress}
      >
        <Text style={[webStyles.planButtonText, { color: buttonTextColor }]}>{buttonText}</Text>
      </TouchableOpacity>

      {isIntroOffer && (
        <View style={webStyles.planLimitedTimeContainer}>
          <Text style={webStyles.planLimitedTimeText}>🎉 Limited-Time Introductory Offer</Text>
          <Text style={webStyles.planValidityText}>Valid till 6th June 2026</Text>
        </View>
      )}
    </View>
  );
};

// Android Layout Component (Original)
const AndroidLayout = ({ navigation, plans, handleSubscribe, fontsLoaded }) => {
  return (
    <View style={androidStyles.container}>
      <View style={androidStyles.header}>
        <BackButton size={scale(28)} color="#0d368c" onPress={() => navigation.goBack()} style={androidStyles.closeButton} />
        <Text style={androidStyles.headerTitle}>Get Subscribed</Text>
        <View style={androidStyles.placeholderView} />
      </View>

      <ScrollView style={androidStyles.scrollView} contentContainerStyle={androidStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {plans.map((plan, index) => (
          <SubscriptionPlan key={index} {...plan} onSubscribe={handleSubscribe} />
        ))}
      </ScrollView>
      
      <BottomNavigation userType={'student'}/>
    </View>
  );
};

// Web Layout Component (New Uizard Design)
const WebLayout = ({ navigation, plans, handleSubscribe, fontsLoaded }) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenWidth(result.window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  return (
    <View style={webStyles.page}>
      {/* TOP HEADER - Keep existing */}
      <View style={webStyles.header}>
        <View style={webStyles.headerLeft}>
          <Text style={webStyles.logoText}>Growsmart</Text>
        </View>
        
        <View style={webStyles.headerCenter}>
          <View style={webStyles.searchBar}>
            <Text style={webStyles.searchPlaceholder}>Type in search</Text>
          </View>
        </View>
        
        <View style={webStyles.headerRight}>
          <TouchableOpacity style={webStyles.notificationIcon}>
            <Text style={webStyles.notificationBell}>🔔</Text>
          </TouchableOpacity>
          <View style={webStyles.avatarPlaceholder} />
          <Text style={webStyles.userName}>Ben Goro</Text>
        </View>
      </View>

      {/* CENTER CONTENT ONLY - No Sidebars */}
      <ScrollView
        style={webStyles.centerOnlyContent}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP ROW - Back Arrow and Header Card */}
        <View style={webStyles.topRow}>
          {/* BACK ARROW */}
          <TouchableOpacity style={webStyles.backArrowCircle} onPress={() => navigation.goBack()}>
            <Text style={webStyles.backArrow}>←</Text>
          </TouchableOpacity>
          
          {/* HEADER CARD */}
          <View style={webStyles.headerCardTop}>
            <Text style={webStyles.headerCardTitle}>Choose Your Learning Path</Text>
            <Text style={webStyles.headerCardSubtitle}>
              Unlock premium features and expert-led courses designed to accelerate your career growth.
            </Text>
          </View>
        </View>

        {/* SECTION 2 — SUBSCRIPTION PLANS GRID */}
        <View style={webStyles.plansGrid}>
          {plans.map((plan, index) => (
            <WebSubscriptionPlan key={index} {...plan} onSubscribe={handleSubscribe} />
          ))}
        </View>

        {/* SECTION 3 — BOTTOM PROMOTIONAL BANNER */}
        <View style={webStyles.promotionalBanner}>
          <View style={webStyles.promoLeft}>
            <Text style={webStyles.promoLogo}>GrowSmart</Text>
            <Text style={webStyles.promoText}>
              Empowering Students.{'\n'}Connecting Futures
            </Text>
          </View>
          <View style={webStyles.promoRight}>
            <View style={webStyles.promoImagePlaceholder} />
            <Text style={webStyles.promoSubtitle}>
              Unlock Quality Learning From India's Best Teachers. Anytime. Anywhere.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default function Subscription() {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({
    'RedHatDisplay': RedHatDisplay_400Regular,
    'Poppins': Poppins_400Regular,
    'PoppinsSemiBold': Poppins_600SemiBold,
    'Inter': Inter_600SemiBold,
  });

  const handleSubscribe = async (plan: any) => {
    try {
      const auth = await getAuthData();
      if (!auth?.token || !auth?.email) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
      const orderResponse = await axios.post(`${BASE_URL}/api/subscriptions/create-order`, { amount: plan.price }, { headers });

      if (!orderResponse.data.success) throw new Error('Failed to create order');

      const options = {
        description: `${plan.title} Subscription`,
        image: "https://your-logo-url.png",
        currency: "INR",
        key: RAZOR_PAY_KEY,
        amount: orderResponse.data.order.amount,
        order_id: orderResponse.data.order.id,
        name: "Grow Smart Subscription",
        prefill: { email: auth.email, name: auth.name || "Student" },
        theme: { color: "#3164f4" },
        modal: { ondismiss: () => Alert.alert("Payment Cancelled", "Payment window was closed") }
      };

      const paymentData = await RazorpayCheckout.open(options);
      const subscriptionRes = await axios.post(`${BASE_URL}/api/subscriptions/create-subscription`, { plan_title: plan.title, amount: plan.price, payment_id: paymentData.razorpay_payment_id, order_id: paymentData.razorpay_order_id, signature: paymentData.razorpay_signature }, { headers });

      if (subscriptionRes.data.success) {
        Alert.alert('Success!', `Your ${plan.title} subscription has been activated successfully!`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        throw new Error(subscriptionRes.data.message || 'Failed to activate subscription');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.description) Alert.alert("Payment Cancelled", error.description);
      else if (error.message) Alert.alert("Error", error.message);
      else Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  if (!fontsLoaded) return <View style={styles.container}><Text>Loading Fonts...</Text></View>;

  const plans = [
    {
      title: "Intro Offer",
      price: "0",
      duration: "365 days",
      features: [
        'Unlimited Access to all Gurus',
        'All Premium Tools',
        'Early Feature Access',
        'Advanced tools & analytics',
        'Faster performance',
        'Early access to new updates'
      ],
      buttonText: "Get started with Intro Offer",
      priceColor: "#ffffff",
      checkColor: "#7dd3fc",
      backgroundColor: "#6b6bff",
      bestValueTag: false,
      isIntroOffer: true
    },
    {
      title: "TeachLite",
      price: "300",
      duration: "90 days",
      features: [
        'Learn at your pace',
        'Never miss a class update',
        'Begin your skill-building journey'
      ],
      buttonText: "Get started with TeachLite",
      priceColor: "#4255ff",
      checkColor: "#3164f4"
    },
    {
      title: "TeachStart",
      price: "415", 
      duration: "180 days",
      features: [
        'Expand your learning',
        'Stay updated instantly',
        'Boost your learning with more classes'
      ],
      buttonText: "Get started with TeachStart",
      priceColor: "#ffffff",
      checkColor: "#ffffff",
      backgroundColor: "#6b6bff",
      bestValueTag: true
    },
    {
      title: "GuruGrade",
      price: "730",
      duration: "365 days", 
      features: [
        'Go all-in on learning',
        'Premium alerts & early access',
        'Unlock full learning access'
      ],
      buttonText: "Get started with GuruGrade", 
      priceColor: "#4255ff",
      checkColor: "#3164f4"
    }
  ];

  if (!fontsLoaded) return <View style={styles.container}><Text>Loading Fonts...</Text></View>;

  // Conditional rendering based on platform
  if (Platform.OS === "web") {
    return (
      <WebLayout 
        navigation={navigation}
        plans={plans}
        handleSubscribe={handleSubscribe}
        fontsLoaded={fontsLoaded}
      />
    );
  }

  return (
    <AndroidLayout 
      navigation={navigation}
      plans={plans}
      handleSubscribe={handleSubscribe}
      fontsLoaded={fontsLoaded}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(20), paddingTop: verticalScale(60), paddingBottom: verticalScale(20), backgroundColor: '#ffffff' },
  closeButton: {},
  headerTitle: { fontSize: scale(30), fontWeight: '700', color: '#0d368c', fontFamily: 'Inter', textAlign: 'center', flex: 1 },
  placeholderView: { width: scale(28) },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(20), paddingBottom: verticalScale(100), paddingTop: verticalScale(10) },
  planCard: { backgroundColor: '#ffffff', borderRadius: scale(24), borderWidth: 1, paddingHorizontal: scale(20), paddingVertical: scale(24), marginBottom: scale(16), alignItems: 'center', position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  planTitle: { fontSize: scale(26), fontWeight: '700', textAlign: 'center', marginBottom: scale(8), fontFamily: 'RedHatDisplay' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: scale(6) },
  price: { fontSize: scale(40), fontWeight: '600', fontFamily: 'RedHatDisplay' },
  duration: { fontSize: scale(18), fontWeight: '400', marginLeft: scale(2), fontFamily: 'RedHatDisplay' },
  originalPrice: { fontSize: scale(32), fontWeight: '400', fontFamily: 'RedHatDisplay', color: '#ffffff', textDecorationLine: 'line-through', marginRight: scale(4), opacity: 0.85 },
  earlyUserText: { fontSize: scale(16), color: '#ffffff', fontFamily: 'RedHatDisplay', marginBottom: scale(8) },
  divider: { width: '100%', height: 1, marginVertical: scale(16) },
  featuresContainer: { marginBottom: scale(20), width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: scale(10) },
  checkIcon: { marginRight: scale(10), marginTop: scale(3) },
  featureText: { flex: 1, fontSize: scale(15), fontWeight: '400', lineHeight: scale(21), fontFamily: 'RedHatDisplay' },
  button: { backgroundColor: '#ffffff', paddingHorizontal: scale(20), alignItems: 'center', width: '100%', borderRadius: scale(10) },
  buttonText: { fontSize: scale(15), fontWeight: '600', fontFamily: 'RedHatDisplay' },
  bestValueTag: { backgroundColor: '#26cb63', paddingVertical: scale(6), paddingHorizontal: scale(14), borderRadius: scale(12), position: 'absolute', top: scale(-14), zIndex: 10 },
  bestValueText: { color: '#ffffff', fontSize: scale(13), fontWeight: '700', fontFamily: 'Inter' },
  introOfferTag: { backgroundColor: '#4caf50', paddingVertical: scale(6), paddingHorizontal: scale(14), borderRadius: scale(14), position: 'absolute', top: scale(-14), zIndex: 10 },
  introOfferText: { color: '#ffffff', fontSize: scale(12), fontWeight: '600', fontFamily: 'Inter' },
  limitedTimeContainer: { marginTop: scale(12), alignItems: 'center' },
  limitedTimeText: { fontSize: scale(13), color: '#ffd54f', fontWeight: '600', fontFamily: 'Inter', marginBottom: scale(2) },
  validityText: { fontSize: scale(11), color: 'rgba(255, 255, 255, 0.8)', fontFamily: 'Inter' }
});

// Android Styles (Original)
const androidStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(20), paddingTop: verticalScale(60), paddingBottom: verticalScale(20), backgroundColor: '#ffffff' },
  closeButton: {},
  headerTitle: { fontSize: scale(30), fontWeight: '700', color: '#0d368c', fontFamily: 'Inter', textAlign: 'center', flex: 1 },
  placeholderView: { width: scale(28) },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(20), paddingBottom: verticalScale(100), paddingTop: verticalScale(10) }
});

// Web Styles (New Uizard Design)
const webStyles = StyleSheet.create({
  // PAGE LAYOUT
  page: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#f5f5f5"
  },
  
  // TOP HEADER
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eeeeee",
    zIndex: 1000
  },
  headerLeft: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  searchBar: {
    width: "100%",
    height: 40,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchPlaceholder: {
    fontSize: 14,
    color: "#6c757d",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  notificationIcon: {
    padding: 8,
  },
  notificationBell: {
    fontSize: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb"
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  
  // CONTENT AREA
  contentArea: {
    flex: 1,
    flexDirection: "row",
    marginTop: 72
  },
  
  // LEFT SIDEBAR
  sidebar: {
    width: 240,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarMenu: {
    padding: 20,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuText: {
    fontSize: 14,
    color: "#495057",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 16,
  },
  adCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  adDescription: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 80,
    backgroundColor: "#e5e7eb",
    borderRadius: 8
  },
  sidebarBottom: {
    marginTop: "auto",
    padding: 20,
  },
  
  // CENTER CONTENT
  centerOnlyContent: {
    flex: 1,
    marginTop: 72,
    paddingHorizontal: 40,
    backgroundColor: "#f5f5f5"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  backArrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  headerCardTop: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24
  },
  
  // HEADER CARD
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 48,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerCardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
  },
  headerCardSubtitle: {
    fontSize: 18,
    color: "#4255ff",
    textAlign: "center",
    lineHeight: 26,
  },
  
  // PLANS GRID
  plansGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  
  // PLAN CARD STYLES
  planCard: {
    width: 240,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  introOfferTag: {
    backgroundColor: "#4caf50",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    position: "absolute",
    top: -14,
    zIndex: 10,
  },
  introOfferText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  bestValueTag: {
    backgroundColor: "#26cb63",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    position: "absolute",
    top: -14,
    zIndex: 10,
  },
  bestValueText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "RedHatDisplay",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 8,
    flexWrap: "nowrap",
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "RedHatDisplay",
  },
  duration: {
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 4,
    fontFamily: "RedHatDisplay",
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "RedHatDisplay",
    color: "#ffffff",
    textDecorationLine: "line-through",
    marginRight: 4,
    opacity: 0.85,
  },
  earlyUserText: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "RedHatDisplay",
    marginBottom: 6,
  },
  planDivider: {
    width: "100%",
    height: 1,
    marginVertical: 12,
  },
  planFeaturesContainer: {
    marginBottom: 16,
    width: "100%",
  },
  planFeatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  planCheckIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    fontFamily: "RedHatDisplay",
  },
  planButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
  },
  planButtonText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "RedHatDisplay",
  },
  planLimitedTimeContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  planLimitedTimeText: {
    fontSize: 12,
    color: "#ffd54f",
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  planValidityText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Inter",
  },
  featuresContainer: {
    marginBottom: 20,
    width: "100%",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  checkIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    fontFamily: "RedHatDisplay",
  },
  button: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "RedHatDisplay",
  },
  limitedTimeContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  limitedTimeText: {
    fontSize: 12,
    color: "#ffd54f",
    fontWeight: "600",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  validityText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Inter",
  },
  
  // PROMOTIONAL BANNER
  promotionalBanner: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  promoLeft: {
    flex: 1,
    justifyContent: "center",
  },
  promoLogo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  promoText: {
    fontSize: 16,
    color: "#495057",
    lineHeight: 22,
  },
  promoRight: {
    flex: 1,
    alignItems: "center",
  },
  promoImagePlaceholder: {
    width: 100,
    height: 60,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 12,
  },
  promoSubtitle: {
    fontSize: 12,
    color: "#495057",
    textAlign: "center",
    lineHeight: 16,
  },
  
  // RIGHT PANEL
  rightPanel: {
    width: 340,
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderLeftColor: "#e9ecef",
    padding: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  thoughtsContainer: {
    flex: 1,
  },
  thoughtCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  thoughtHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  thoughtAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  thoughtTime: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  thoughtText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    marginBottom: 12,
  },
  thoughtImages: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  thoughtImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb"
  },
  thoughtActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
  },
  actionText: {
    fontSize: 12,
    color: "#495057",
  },
});