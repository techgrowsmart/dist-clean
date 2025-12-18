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
import { getAuthData} from '../../../utils/authStorage'; // Adjust path as needed
import { BASE_URL, RAZOR_PAY_KEY } from '../../../config'; // Adjust path as needed
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// Responsive scaling
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
  onSubscribe
}) => {
  const isTeachStart = title === 'TeachStart';
  const titleColor = isTeachStart ? '#ffffff' : '#000000';
  const dividerColor = isTeachStart ? '#ffffff' : '#e0e0e0';
  const buttonBgColor = isTeachStart ? '#ffffff' : '#ffffff';
  const buttonBorderColor = isTeachStart ? '#ffffff' : '#3164f4';

  const handlePress = () => {
    onSubscribe({
      title,
      price,
      duration,
      buttonText
    });
  };

  return (
    <View style={[styles.planCard, { backgroundColor, borderColor: isTeachStart ? '#3164f4' : '#3d3d3d' }]}>
      {bestValueTag && (
        <View style={styles.bestValueTag}>
          <Text style={styles.bestValueText}>Best Value</Text>
        </View>
      )}

      <Text style={[styles.planTitle, { color: titleColor }]}>{title}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: isTeachStart ? '#ffffff' : priceColor }]}>₹{price}/</Text>
        <Text style={[styles.duration, { color: isTeachStart ? '#ffffff' : '#4255ff' }]}>{duration}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Fontisto name="check" size={scale(16)} color={checkColor} style={styles.checkIcon}/>
            <Text style={[styles.featureText, { color: titleColor }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[
          styles.button, 
          { 
            backgroundColor: buttonBgColor, 
            borderWidth: isTeachStart ? 0 : 1,
            paddingVertical: isTeachStart ? scale(16) : scale(14),
            borderColor: buttonBorderColor,
            marginTop: isTeachStart ? scale(8) : 0,
          }
        ]} 
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <Text style={[styles.buttonText, { color: isTeachStart ? '#3164f4' : '#3164f4' }]}>{buttonText}</Text>
      </TouchableOpacity>
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

    const headers = {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    };

    // 1. Create an order on the server
    const orderResponse = await axios.post(
      `${BASE_URL}/api/subscriptions/create-order`,
      { amount: plan.price },
      { headers }
    );

    if (!orderResponse.data.success) {
      throw new Error('Failed to create order');
    }

    const options = {
      description: `${plan.title} Subscription`,
      image: "https://your-logo-url.png",
      currency: "INR",
      key: RAZOR_PAY_KEY,
      amount: orderResponse.data.order.amount,
      order_id: orderResponse.data.order.id,
      name: "Grow Smart Subscription",
      prefill: {
        email: auth.email,
        name: auth.name || "Student",
      },
      theme: { color: "#3164f4" },
      modal: {
        ondismiss: () => {
          Alert.alert("Payment Cancelled", "Payment window was closed");
        }
      }
    };

    const paymentData = await RazorpayCheckout.open(options);
    
    // 2. Verify payment and create subscription
    const subscriptionRes = await axios.post(
      `${BASE_URL}/api/subscriptions/create-subscription`,
      {
        plan_title: plan.title,
        amount: plan.price,
        payment_id: paymentData.razorpay_payment_id,
        order_id: paymentData.razorpay_order_id,
        signature: paymentData.razorpay_signature
      },
      { headers }
    );

    if (subscriptionRes.data.success) {
      Alert.alert(
        'Success!', 
        `Your ${plan.title} subscription has been activated successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      throw new Error(subscriptionRes.data.message || 'Failed to activate subscription');
    }
  } catch (error: any) {
    console.error('Payment error:', error);
    if (error?.description) {
      Alert.alert("Payment Cancelled", error.description);
    } else if (error.message) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  }
};

  if (!fontsLoaded) {
    return <View style={styles.container}><Text>Loading Fonts...</Text></View>;
  }

  const plans = [
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
      checkColor: "#6ac8d8",
      backgroundColor: "#5f5fff",
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
          <SubscriptionPlan 
            key={index} 
            {...plan} 
            onSubscribe={handleSubscribe}
          />
        ))}
      </ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation userType={'student'}/>
      <BottomNavigation userType={'student'}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(20), paddingTop: verticalScale(60), paddingBottom: verticalScale(20), backgroundColor: '#ffffff' },
  closeButton: {  },
  headerTitle: { fontSize: scale(32), fontWeight: '700', color: '#0d368c', fontFamily: 'Inter', textAlign: 'center', flex: 1 },
  placeholderView: { width: scale(28) },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(35), paddingBottom: verticalScale(120) },
  planCard: { backgroundColor: '#ffffff', borderRadius: scale(20), borderWidth: 1, paddingHorizontal: scale(24), paddingVertical: scale(20), marginBottom: scale(20), alignItems: 'center', position: 'relative' },
  planTitle: { fontSize: scale(24), fontWeight: '700', textAlign: 'center', marginBottom: scale(12), fontFamily: 'RedHatDisplay' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: scale(16) },
  price: { fontSize: scale(40), fontWeight: '400', fontFamily: 'RedHatDisplay' },
  duration: { fontSize: scale(18), fontWeight: '400', marginLeft: scale(4), fontFamily: 'RedHatDisplay' },
  divider: { width: '100%', height: 1, marginBottom: scale(20) },
  featuresContainer: { marginBottom: scale(20), width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: scale(12) },
  checkIcon: { marginRight: scale(10), marginTop: scale(2) },
  featureText: { flex: 1, fontSize: scale(16), fontWeight: '400', lineHeight: scale(22), fontFamily: 'RedHatDisplay' },
  button: { borderWidth: 2, paddingHorizontal: scale(20), alignItems: 'center', width: '100%', borderRadius: scale(8) },
  buttonText: { fontSize: scale(16), fontWeight: '600', fontFamily: 'RedHatDisplay' },
  bestValueTag: { backgroundColor: '#26cb63', paddingVertical: scale(4), paddingHorizontal: scale(12), borderRadius: scale(10), position: 'absolute', top: scale(-12) },
  bestValueText: { color: '#ffffff', fontSize: scale(15), fontWeight: '600', fontFamily: 'Inter' }
});