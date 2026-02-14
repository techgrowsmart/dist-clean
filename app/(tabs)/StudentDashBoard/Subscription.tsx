import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert } from 'react-native';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { RedHatDisplay_400Regular } from '@expo-google-fonts/red-hat-display';
import { Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Inter_600SemiBold } from '@expo-google-fonts/inter';
import BottomNavigation from '../BottomNavigation';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { getAuthData} from '../../../utils/authStorage';
import { BASE_URL, RAZOR_PAY_KEY } from '../../../config';
import axios from 'axios';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={scale(28)} color="#0d368c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Subscribed</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {plans.map((plan, index) => (
          <SubscriptionPlan key={index} {...plan} onSubscribe={handleSubscribe} />
        ))}
      </ScrollView>
      
      <BottomNavigation userType={'student'}/>
    </View>
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