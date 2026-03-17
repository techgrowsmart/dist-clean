import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

// ── REAL PLAN CARD (copied from Subscription.tsx) ────────────
const WebSubscriptionPlan = ({
  title, price, duration, features, buttonText,
  priceColor, checkColor, backgroundColor = '#ffffff',
  bestValueTag = false, isIntroOffer = false,
}: any) => {
  const isPurpleCard = backgroundColor !== '#ffffff';
  const titleColor = isPurpleCard ? '#ffffff' : '#000000';
  const dividerColor = isPurpleCard ? 'rgba(255,255,255,0.3)' : '#e0e0e0';
  const buttonTextColor = isPurpleCard ? '#6b6bff' : '#5f5fff';
  const buttonBorderColor = isPurpleCard ? '#ffffff' : '#5f5fff';

  return (
    <View style={[bgStyles.planCard, { backgroundColor, borderColor: isPurpleCard ? backgroundColor : '#d0d0d0' }]}>
      {isIntroOffer && (
        <View style={bgStyles.introOfferTag}>
          <Text style={bgStyles.introOfferText}>🚀 Introductory Offer for Early Users</Text>
        </View>
      )}
      {bestValueTag && !isIntroOffer && (
        <View style={bgStyles.bestValueTag}>
          <Text style={bgStyles.bestValueText}>Best Value</Text>
        </View>
      )}
      <Text style={[bgStyles.planTitle, { color: titleColor }]}>{title}</Text>
      <View style={bgStyles.priceContainer}>
        {isIntroOffer ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'nowrap' }}>
            <Text style={[bgStyles.originalPrice, { textDecorationLine: 'line-through', fontSize: 20 }]}>₹730 / </Text>
            <Text style={[bgStyles.originalPrice, { textDecorationLine: 'line-through', fontSize: 14 }]}>365 days</Text>
          </View>
        ) : (
          <>
            <Text style={[bgStyles.price, { color: isPurpleCard ? '#ffffff' : priceColor }]}>₹{price} /</Text>
            <Text style={[bgStyles.duration, { color: isPurpleCard ? '#ffffff' : '#666666' }]}>{duration}</Text>
          </>
        )}
      </View>
      {isIntroOffer && <Text style={bgStyles.earlyUserText}>₹0 for early users</Text>}
      <View style={[bgStyles.planDivider, { backgroundColor: dividerColor }]} />
      <View style={bgStyles.planFeaturesContainer}>
        {features.map((feature: string, index: number) => (
          <View key={index} style={bgStyles.planFeatureRow}>
            <Text style={[bgStyles.planCheckIcon, { color: checkColor }]}>✔</Text>
            <Text style={[bgStyles.planFeatureText, { color: isPurpleCard ? '#ffffff' : '#333333' }]}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[bgStyles.planButton, { borderColor: buttonBorderColor }]}>
        <Text style={[bgStyles.planButtonText, { color: buttonTextColor }]}>{buttonText}</Text>
      </TouchableOpacity>
      {isIntroOffer && (
        <View style={bgStyles.planLimitedTimeContainer}>
          <Text style={bgStyles.planLimitedTimeText}>🎉 Limited-Time Introductory Offer</Text>
          <Text style={bgStyles.planValidityText}>Valid till 6th June 2026</Text>
        </View>
      )}
    </View>
  );
};

const plans = [
  {
    title: "Intro Offer", price: "0", duration: "365 days",
    features: ['Unlimited Access to all Gurus', 'All Premium Tools', 'Early Feature Access', 'Advanced tools & analytics', 'Faster performance', 'Early access to new updates'],
    buttonText: "Get started with Intro Offer", priceColor: "#ffffff", checkColor: "#7dd3fc",
    backgroundColor: "#6b6bff", bestValueTag: false, isIntroOffer: true
  },
  {
    title: "TeachLite", price: "300", duration: "90 days",
    features: ['Learn at your pace', 'Never miss a class update', 'Begin your skill-building journey'],
    buttonText: "Get started with TeachLite", priceColor: "#4255ff", checkColor: "#3164f4"
  },
  {
    title: "TeachStart", price: "415", duration: "180 days",
    features: ['Expand your learning', 'Stay updated instantly', 'Boost your learning with more classes'],
    buttonText: "Get started with TeachStart", priceColor: "#ffffff", checkColor: "#ffffff",
    backgroundColor: "#6b6bff", bestValueTag: true
  },
  {
    title: "GuruGrade", price: "730", duration: "365 days",
    features: ['Go all-in on learning', 'Premium alerts & early access', 'Unlock full learning access'],
    buttonText: "Get started with GuruGrade", priceColor: "#4255ff", checkColor: "#3164f4"
  }
];

export default function PaymentSuccess() {
  const router = useRouter();
  const { teacherEmail, subject } = useLocalSearchParams();
  const [showCongrats, setShowCongrats] = useState(false);
  const [teacherName] = useState('Teacher');

  useEffect(() => {
    const timer = setTimeout(() => setShowCongrats(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ── WEB LAYOUT ──────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.page}>

        {/* HEADER */}
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
            <Text style={webStyles.notificationBell}>🔔</Text>
            <View style={webStyles.avatarPlaceholder} />
            <Text style={webStyles.userName}>Ben Goro</Text>
          </View>
        </View>

        {/* BACKGROUND — real subscription page */}
        <ScrollView
          style={webStyles.centerContent}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={webStyles.topRow}>
            <TouchableOpacity
              style={webStyles.backArrowCircle}
              onPress={() => router.replace("/(tabs)/StudentDashBoard/Student")}
            >
              <Text style={webStyles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={webStyles.headerCardTop}>
              <Text style={webStyles.headerCardTitle}>Choose Your Learning Path</Text>
              <Text style={webStyles.headerCardSubtitle}>
                Unlock premium features and expert-led courses designed to accelerate your career growth.
              </Text>
            </View>
          </View>

          {/* REAL plan cards — dimmed */}
          <View style={webStyles.plansGrid}>
            {plans.map((plan, index) => (
              <WebSubscriptionPlan key={index} {...plan} />
            ))}
          </View>

          <View style={webStyles.promotionalBanner}>
            <View style={webStyles.promoLeft}>
              <Text style={webStyles.promoLogo}>GrowSmart</Text>
              <Text style={webStyles.promoText}>Empowering Students.{'\n'}Connecting Futures</Text>
            </View>
            <View style={webStyles.promoRight}>
              <View style={webStyles.promoImagePlaceholder} />
              <Text style={webStyles.promoSubtitle}>
                Unlock Quality Learning From India's Best Teachers. Anytime. Anywhere.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* MODAL OVERLAY */}
        <View style={webStyles.overlay}>
          <View style={webStyles.modal}>
            <View style={webStyles.modalTop}>
              <Text style={webStyles.congratsTitle}>Congratulations !</Text>
              <Image
                source={require('../../../assets/image/cap.png')}
                style={webStyles.modalImage}
              />
              <Text style={webStyles.confirmedTitle}>Your tution{'\n'}is confirmed!</Text>
              <Text style={webStyles.confirmedSubtitle}>
                Congratulations ! You have been join in{'\n'}teacher's broadcast list
              </Text>
            </View>
            <View style={webStyles.modalBottom}>
              <TouchableOpacity
                style={webStyles.homeBtn}
                onPress={() => router.replace("/(tabs)/StudentDashBoard/Student")}
              >
                <Text style={webStyles.homeBtnText}>Go to homepage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={webStyles.connectBtn}
                onPress={() => router.push({
                  pathname: "/(tabs)/Messages/Messages",
                  params: { teacherEmail },
                })}
              >
                <Text style={webStyles.connectBtnText}>Connect {teacherName}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    );
  }

  // ── ANDROID — untouched ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} autoStart fadeOut />
      {!showCongrats ? (
        <>
          <Image source={require('../../../assets/image/payment_success.png')} style={styles.image} />
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>Your class is booked 🎉</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Congratulations!</Text>
          <Image source={require('../../../assets/image/cap.png')} style={styles.image} />
          <Text style={styles.title}>Your tution is confirmed!</Text>
          <Text style={styles.subtitle}>
            Congratulations ! You have been join in teacher's broadast list{subject}!
          </Text>
          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)/StudentDashBoard/Student")}>
              <Text style={styles.buttonText}>Go to homepage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.connectButton} onPress={() => router.push({ pathname: "/(tabs)/Messages/Messages", params: { teacherEmail } })}>
              <Text style={styles.buttonText}>Connect with Teacher</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ── ANDROID STYLES — untouched ───────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp('5%'), backgroundColor: '#5f5fff' },
  image: { width: wp(isTablet ? '30%' : '40%'), height: hp(isTablet ? '18%' : '18%'), marginBottom: hp('2%'), resizeMode: 'contain' },
  title: { fontSize: wp(isTablet ? '5.5%' : '8%'), fontWeight: '700', color: '#FFF', marginBottom: hp('1%'), fontFamily: 'Sora', lineHeight: hp('5%'), textAlign: 'center' },
  subtitle: { fontSize: wp(isTablet ? '3%' : '4.5%'), color: '#fff', marginBottom: hp('2%'), textAlign: 'center', fontFamily: 'open-sans' },
  btnContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: wp('5%'), marginTop: hp('2.5%'), gap: wp('3%'), flexWrap: 'wrap' },
  button: { backgroundColor: '#f5b726', borderRadius: wp('1.2%'), borderWidth: 1, borderColor: '#FFF', marginVertical: hp('1.5%'), width: wp(isTablet ? '28%' : '30%'), height: hp('6%'), justifyContent: 'center', alignItems: 'center' },
  connectButton: { backgroundColor: '#FFF', borderRadius: wp('1.2%'), borderWidth: 1, marginVertical: hp('1.5%'), width: wp(isTablet ? '35%' : '40%'), height: hp('6%'), justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: wp(isTablet ? '2.5%' : '3.8%'), fontWeight: '600' },
});

// ── BACKGROUND PLAN CARD STYLES ──────────────────────────────
const bgStyles = StyleSheet.create({
  planCard: { width: 240, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#d0d0d0', padding: 16, marginBottom: 16, alignItems: 'center', position: 'relative' },
  introOfferTag: { backgroundColor: '#4caf50', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14, position: 'absolute', top: -14, zIndex: 10 },
  introOfferText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  bestValueTag: { backgroundColor: '#26cb63', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, position: 'absolute', top: -14, zIndex: 10 },
  bestValueText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  planTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '600' },
  duration: { fontSize: 14, marginLeft: 4 },
  originalPrice: { fontSize: 16, color: '#ffffff', textDecorationLine: 'line-through', marginRight: 4, opacity: 0.85 },
  earlyUserText: { fontSize: 12, color: '#ffffff', marginBottom: 6 },
  planDivider: { width: '100%', height: 1, marginVertical: 12 },
  planFeaturesContainer: { marginBottom: 16, width: '100%' },
  planFeatureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  planCheckIcon: { marginRight: 8, marginTop: 2 },
  planFeatureText: { flex: 1, fontSize: 12, lineHeight: 16 },
  planButton: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', width: '100%', borderRadius: 8, borderWidth: 1 },
  planButtonText: { fontSize: 12, fontWeight: '600' },
  planLimitedTimeContainer: { marginTop: 12, alignItems: 'center' },
  planLimitedTimeText: { fontSize: 12, color: '#ffd54f', fontWeight: '600', marginBottom: 2 },
  planValidityText: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
});

// ── WEB STYLES ───────────────────────────────────────────────
const webStyles = StyleSheet.create({
  page: { flex: 1, flexDirection: 'column', backgroundColor: '#f5f5f5' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#eeeeee', zIndex: 1000 },
  headerLeft: { flex: 1 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  headerCenter: { flex: 2, alignItems: 'center' },
  searchBar: { width: '100%', height: 40, backgroundColor: '#f8f9fa', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  searchPlaceholder: { fontSize: 14, color: '#6c757d' },
  headerRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  notificationBell: { fontSize: 20 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb' },
  userName: { fontSize: 14, fontWeight: '600', color: '#000000' },
  centerContent: { flex: 1, marginTop: 72, paddingHorizontal: 40, backgroundColor: '#f5f5f5' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16, marginTop: 24 },
  backArrowCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d0d0d0', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, fontWeight: '600', color: '#333333' },
  headerCardTop: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 32, alignItems: 'center' },
  headerCardTitle: { fontSize: 32, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 16 },
  headerCardSubtitle: { fontSize: 18, color: '#4255ff', textAlign: 'center' },
  plansGrid: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap', opacity: 0.5 },
  promotionalBanner: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 24, marginBottom: 32, opacity: 0.5 },
  promoLeft: { flex: 1, justifyContent: 'center' },
  promoLogo: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginBottom: 8 },
  promoText: { fontSize: 16, color: '#495057', lineHeight: 22 },
  promoRight: { flex: 1, alignItems: 'center' },
  promoImagePlaceholder: { width: 100, height: 60, backgroundColor: '#e5e7eb', borderRadius: 8, marginBottom: 12 },
  promoSubtitle: { fontSize: 12, color: '#495057', textAlign: 'center', lineHeight: 16 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modal: { width: 520, maxWidth: '90%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 8, borderColor: '#ffffff' }, 
  modalTop: { backgroundColor: '#7bc043', padding: 32, alignItems: 'center', position: 'relative' },
  closeBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10 },
  closeBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  congratsTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  modalImage: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 16 },
  confirmedTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  confirmedSubtitle: { color: '#fff', fontSize: 14, textAlign: 'center', opacity: 0.9 },
  modalBottom: { backgroundColor: '#fff', padding: 24, flexDirection: 'row', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  homeBtn: { backgroundColor: '#f5b726', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  homeBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  connectBtn: { backgroundColor: '#4255ff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});