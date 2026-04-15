import ArrowBack from "../../../assets/svgIcons/ArrowBack";
import CreditCardIcon from "../../../assets/svgIcons/Credicard";
import InternetBanking from "../../../assets/svgIcons/InternetBanking";
import Paypal from "../../../assets/svgIcons/Paypal";
import { BASE_URL, RAZORPAY_KEY } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, Modal, Animated, Dimensions, Platform, ScrollView, ActivityIndicator, useWindowDimensions } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";
import {Prompt_400Regular, useFonts} from '@expo-google-fonts/prompt'
import { safeBack } from "../../../utils/navigation";
import { Ionicons } from '@expo/vector-icons';
import TeacherWebHeader from '../../../components/ui/TeacherWebHeader';
import TeacherWebSidebar from '../../../components/ui/TeacherWebSidebar';

// Modern color scheme matching SpotlightScreenWeb
const COLORS = {
  background: '#F7F9FC',
  cardBg: '#FFFFFF',
  primaryBlue: '#2563EB',
  textHeader: '#1F2937',
  textBody: '#4B5563',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  white: '#FFFFFF',
  successGreen: '#10B981',
  warningOrange: '#F59E0B',
  spotlightBg: '#5f5fff',
};

export default function Payment() {
  let [fontsLoaded]=useFonts({
    Prompt_400Regular
  });
  const router = useRouter();
  const {
    selectedState,
    selectedHotspot,
    selectedPlan,
    paymentAmount: rawPaymentAmount,
  } = useLocalSearchParams();

  // ----- REAL GST CALCULATION (decimal safe) -----
  const subtotal = parseFloat(rawPaymentAmount as string) || 0;
  const gstRate = 0.18; // 18%
  const gstAmount = subtotal * gstRate;
  const totalAmount = subtotal + gstAmount;

  // Formatted for display (2 decimals)
  const formattedSubtotal = subtotal.toFixed(2);
  const formattedGst = gstAmount.toFixed(2);
  const formattedTotal = totalAmount.toFixed(2);

  // Amount in paise (integer) for Razorpay
  const totalInPaise = Math.round(totalAmount * 100);
  // ------------------------------------------------

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  // User data
  const [teacherName, setTeacherName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [activeItem, setActiveItem] = useState('Payment');
  
  // Responsive layout
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const isTabletDevice = screenWidth >= 768 && screenWidth < 1024;
  const sidebarWidth = isMobile ? 0 : 240;
  
  // Animation values
  const [modalAnimValue] = useState(new Animated.Value(0));
  const [overlayAnimValue] = useState(new Animated.Value(0));
  const [contentAnimValue] = useState(new Animated.Value(0));
  const [spinValue] = useState(new Animated.Value(0));

  // Load user data
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const authData = await getAuthData();
        if (authData?.token) {
          setUserEmail(authData.email || '');
          setTeacherName(authData.name || 'Teacher');
          setProfileImage(authData.profileImage || null);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      }
    };

    loadAuthData();
  }, []);

  // Load Razorpay Web Checkout script for web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  // Start spinning animation when modal opens
  useEffect(() => {
    if (showPaymentModal && paymentStatus === 'processing') {
      const useNative = Platform.OS !== 'web';
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: useNative,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [showPaymentModal, paymentStatus]);

  console.log(
    "Payment Details:",
    selectedState,
    selectedHotspot,
    selectedPlan,
    "Subtotal:", subtotal,
    "GST:", gstAmount,
    "Total:", totalAmount
  );

  // Animation functions
  const openPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentStatus('idle');
    
    overlayAnimValue.setValue(0);
    modalAnimValue.setValue(0);
    contentAnimValue.setValue(0);
    
    const useNative = Platform.OS !== 'web';
    
    Animated.timing(overlayAnimValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: useNative,
    }).start();
    
    Animated.timing(modalAnimValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: useNative,
    }).start();
    
    Animated.spring(contentAnimValue, {
      toValue: 1,
      tension: 65,
      friction: 7,
      useNativeDriver: useNative,
    }).start();
  };

  const closePaymentModal = () => {
    const useNative = Platform.OS !== 'web';
    
    Animated.timing(overlayAnimValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: useNative,
    }).start();
    
    Animated.timing(modalAnimValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: useNative,
    }).start();
    
    Animated.timing(contentAnimValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: useNative,
    }).start(() => {
      setShowPaymentModal(false);
      setPaymentStatus('idle');
    });
  };

  // Web Razorpay payment handler (uses computed totalInPaise)
  const initiateWebPayment = useCallback(async (auth: any, orderData: any) => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      Alert.alert("Error", "Payment library not loaded. Please refresh and try again.");
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: totalInPaise,
      currency: "INR",
      name: "Grow Smart Spotlight",
      description: `Spotlight payment for ${auth.email}`,
      order_id: orderData.id,
      prefill: {
        name: teacherName,
        email: auth.email,
      },
      theme: {
        color: "#4255FF",
      },
      handler: async (response: any) => {
        try {
          const verifyRes = await axios.post(
            `${BASE_URL}/api/payments/verify-payment-spotlight`,
            {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              name: teacherName,
              email: auth.email,
              amount: totalInPaise,
            },
            { headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" } }
          );

          if (verifyRes.data.success) {
            setPaymentStatus('success');
            setTimeout(() => {
              closePaymentModal();
              router.push({
                pathname: "/(tabs)/TeacherDashBoard/Teacher",
                params: { userEmail: auth.email },
              });
            }, 2000);
          } else {
            setPaymentStatus('error');
          }
        } catch (err) {
          console.error("Payment verification error:", err);
          setPaymentStatus('error');
        }
      },
      modal: {
        ondismiss: () => {
          setPaymentStatus('idle');
          setIsProcessing(false);
          closePaymentModal();
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }, [totalInPaise, teacherName, RAZORPAY_KEY, BASE_URL]);

  const initiatePayment = async () => {
    openPaymentModal();
    setPaymentStatus('processing');
    setIsProcessing(true);
    
    try {
      const auth = await getAuthData();
      if (!auth?.token || !auth?.email) {
        setPaymentStatus('error');
        setTimeout(() => {
          closePaymentModal();
          Alert.alert("Session Expired", "Please log in again.");
        }, 2000);
        return;
      }

      console.log("auth details:", auth);
      console.log("Details", auth.email);
      const headers = {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      };

      // Create order with computed totalInPaise
      const orderRes = await axios.post(
        `${BASE_URL}/api/payments/create-order`,
        {
          amount: totalInPaise,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        },
        { headers }
      );

      // Check if running on web platform
      if (Platform.OS === 'web') {
        await initiateWebPayment(auth, orderRes.data);
        return;
      }

      const options = {
        description: `Spotlight payment for ${auth.email}`,
        image: "https://your-logo-url.png",
        currency: "INR",
        key: RAZORPAY_KEY,
        amount: totalInPaise,
        order_id: orderRes.data.id,
        name: "Spotlight Tariff",
        prefill: {
          email: auth.email,
          name: teacherName,
        },
        theme: { color: "#4255FF" },
      };
  
      RazorpayCheckout.open(options)
        .then(async (paymentData: any) => {
          const verifyRes = await axios.post(
            `${BASE_URL}/api/payments/verify-payment-spotlight`,
            {
              orderId: paymentData.razorpay_order_id,
              paymentId: paymentData.razorpay_payment_id,
              signature: paymentData.razorpay_signature,
              name: teacherName,
              email: auth.email,
              amount: totalInPaise,
            },
            { headers }
          );

          console.log("Payment verification response:", verifyRes.data);
          if (verifyRes.data.success) {
            setPaymentStatus('success');
            setTimeout(() => {
              closePaymentModal();
              router.push({
                pathname: "/(tabs)/TeacherDashBoard/Teacher",
                params: { userEmail: auth.email },
              });
            }, 2000);
          } else {
            setPaymentStatus('error');
            setTimeout(() => {
              closePaymentModal();
              Alert.alert("Verification Failed", "Please contact support.");
            }, 2000);
          }
        })
        .catch((error: any) => {
          setPaymentStatus('error');
          setIsProcessing(false);
          setTimeout(() => {
            closePaymentModal();
            if (error?.description) {
              Alert.alert("Payment Cancelled", error.description);
            } else {
              Alert.alert("Cancelled", "Payment process was cancelled.");
            }
          }, 2000);
        });
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentStatus('error');
      setIsProcessing(false);
      setTimeout(() => {
        closePaymentModal();
        Alert.alert("Error", "Something went wrong during payment.");
      }, 2000);
    }
  };

  return (
    <View style={styles.webLayout}>
      {/* Header */}
      <TeacherWebHeader 
        teacherName={teacherName}
        profileImage={profileImage}
        showSearch={true}
      />
      
      <View style={styles.webContent}>
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && (
          <TeacherWebSidebar 
            activeItem={activeItem}
            onItemPress={setActiveItem}
            userEmail={userEmail}
            teacherName={teacherName}
            profileImage={profileImage}
          />
        )}

        {/* Main Content */}
        <View style={styles.webMainContent}>
          <ScrollView 
            style={styles.mainScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[
              styles.pageContent,
              isMobile && styles.pageContentMobile
            ]}>
              {/* Page Header */}
              <View style={[
                styles.pageHeader,
                isMobile && styles.pageHeaderMobile
              ]}>
                <TouchableOpacity onPress={() => safeBack(router)} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={isMobile ? 20 : 24} color={COLORS.textHeader} />
                </TouchableOpacity>
                <Text style={[
                  styles.pageTitle,
                  isMobile && styles.pageTitleMobile,
                  isTabletDevice && styles.pageTitleTablet
                ]}>Complete Your Payment</Text>
              </View>

              {/* Payment Summary Card - using computed values */}
              <View style={[
                styles.summaryCard,
                isMobile && styles.summaryCardMobile,
                isTabletDevice && styles.summaryCardTablet
              ]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="card-outline" size={isMobile ? 20 : 24} color={COLORS.primaryBlue} />
                  <Text style={[
                    styles.cardTitle,
                    isMobile && styles.cardTitleMobile
                  ]}>Payment Summary</Text>
                </View>
                
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel,
                      isMobile && styles.textMobile
                    ]}>Plan</Text>
                    <Text style={[
                      styles.summaryValue,
                      isMobile && styles.textMobile
                    ]}>{selectedPlan}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel,
                      isMobile && styles.textMobile
                    ]}>Location</Text>
                    <Text style={[
                      styles.summaryValue,
                      isMobile && styles.textMobile
                    ]}>{selectedState}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel,
                      isMobile && styles.textMobile
                    ]}>Type</Text>
                    <Text style={[
                      styles.summaryValue,
                      isMobile && styles.textMobile
                    ]}>{selectedHotspot}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel,
                      isMobile && styles.textMobile
                    ]}>Subtotal</Text>
                    <Text style={[
                      styles.summaryValue,
                      isMobile && styles.textMobile
                    ]}>₹{formattedSubtotal}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[
                      styles.summaryLabel,
                      isMobile && styles.textMobile
                    ]}>GST (18%)</Text>
                    <Text style={[
                      styles.summaryValue,
                      isMobile && styles.textMobile
                    ]}>₹{formattedGst}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={[
                      styles.totalLabel,
                      isMobile && styles.totalLabelMobile
                    ]}>Total Amount</Text>
                    <Text style={[
                      styles.totalValue,
                      isMobile && styles.totalValueMobile
                    ]}>₹{formattedTotal}</Text>
                  </View>
                </View>
              </View>

              {/* Pay Button */}
              <TouchableOpacity style={[
                styles.payButton,
                isMobile && styles.payButtonMobile,
                isTabletDevice && styles.payButtonTablet
              ]} onPress={initiatePayment}>
                <Text style={[
                  styles.payButtonText,
                  isMobile && styles.payButtonTextMobile
                ]}>Pay ₹{formattedTotal}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    
      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: overlayAnimValue,
            }
          ]}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
                opacity: modalAnimValue,
              }
            ]}
          >
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      translateY: contentAnimValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              {/* Modal Header */}
              <View style={[styles.modalHeader, isMobile && styles.modalHeaderMobile]}>
                <TouchableOpacity 
                  onPress={closePaymentModal}
                  style={[styles.closeButton, isProcessing && styles.closeButtonDisabled]}
                  disabled={isProcessing}
                >
                  <Ionicons name="close" size={isMobile ? 20 : 24} color="#666" />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isMobile && styles.modalTitleMobile]}>
                  {paymentStatus === 'processing' ? 'Processing Payment' : 
                   paymentStatus === 'success' ? 'Success' : 'Payment Failed'}
                </Text>
                <View style={styles.placeholder} />
              </View>

              {/* Modal Body */}
              <View style={[styles.modalBody, isMobile && styles.modalBodyMobile]}>
                {paymentStatus === 'processing' && (
                  <View style={styles.processingContainer}>
                    <View style={[styles.spinnerWrapper, isMobile && styles.spinnerWrapperMobile]}>
                      <Animated.View 
                        style={[
                          styles.spinner,
                          isMobile && styles.spinnerMobile,
                          {
                            transform: [
                              {
                                rotate: spinValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                }),
                              },
                            ],
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.processingText, isMobile && styles.processingTextMobile]}>
                      Processing your payment...
                    </Text>
                    <Text style={[styles.processingSubtext, isMobile && styles.processingSubtextMobile]}>
                      Please wait while we secure your transaction
                    </Text>
                  </View>
                )}

                {paymentStatus === 'success' && (
                  <View style={styles.successContainer}>
                    <View style={[styles.successIconWrapper, isMobile && styles.successIconWrapperMobile]}>
                      <Ionicons name="checkmark-circle" size={isMobile ? 48 : 60} color="#10B981" />
                    </View>
                    <Text style={[styles.successText, isMobile && styles.successTextMobile]}>
                      Payment Successful!
                    </Text>
                    <Text style={[styles.successSubtext, isMobile && styles.successSubtextMobile]}>
                      Your spotlight has been activated
                    </Text>
                  </View>
                )}

                {paymentStatus === 'error' && (
                  <View style={styles.errorContainer}>
                    <View style={[styles.errorIconWrapper, isMobile && styles.errorIconWrapperMobile]}>
                      <Ionicons name="close-circle" size={isMobile ? 48 : 60} color="#EF4444" />
                    </View>
                    <Text style={[styles.errorText, isMobile && styles.errorTextMobile]}>
                      Payment Failed
                    </Text>
                    <Text style={[styles.errorSubtext, isMobile && styles.errorSubtextMobile]}>
                      Something went wrong. Please try again.
                    </Text>
                  </View>
                )}
              </View>

              {/* Modal Footer */}
              {paymentStatus === 'error' && (
                <View style={[styles.modalFooter, isMobile && styles.modalFooterMobile]}>
                  <TouchableOpacity 
                    style={[styles.retryButton, isMobile && styles.retryButtonMobile]}
                    onPress={closePaymentModal}
                  >
                    <Text style={[styles.retryButtonText, isMobile && styles.retryButtonTextMobile]}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webLayout: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: COLORS.background,
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webMainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: wp('3%'),
    paddingBottom: 50,
  },
  pageContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  pageContentMobile: {
    maxWidth: '100%',
    padding: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    gap: wp('2%'),
  },
  pageHeaderMobile: {
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
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
    fontSize: wp('2.5%'),
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Prompt_400Regular',
  },
  pageTitleMobile: {
    fontSize: 20,
  },
  pageTitleTablet: {
    fontSize: 22,
  },
  
  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp('3%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryCardMobile: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  summaryCardTablet: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
    gap: wp('2%'),
  },
  cardTitle: {
    fontSize: wp('2%'),
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Prompt_400Regular',
  },
  cardTitleMobile: {
    fontSize: 16,
  },
  summaryContent: {
    gap: hp('1%'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('0.5%'),
  },
  summaryLabel: {
    fontSize: wp('1.8%'),
    color: COLORS.textBody,
    fontFamily: 'Prompt_400Regular',
  },
  summaryValue: {
    fontSize: wp('1.8%'),
    color: COLORS.textHeader,
    fontWeight: '500',
    fontFamily: 'Prompt_400Regular',
  },
  textMobile: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: hp('1%'),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    marginTop: hp('0.5%'),
  },
  totalLabel: {
    fontSize: wp('2%'),
    fontWeight: '600',
    color: COLORS.textHeader,
    fontFamily: 'Prompt_400Regular',
  },
  totalLabelMobile: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: wp('2.2%'),
    fontWeight: '700',
    color: COLORS.primaryBlue,
    fontFamily: 'Prompt_400Regular',
  },
  totalValueMobile: {
    fontSize: 18,
  },
  
  // Payment Methods Card
  paymentMethodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp('3%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  paymentMethodsCardMobile: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  paymentMethodsCardTablet: {
    padding: 20,
    marginBottom: 16,
  },
  paymentOptions: {
    gap: hp('1%'),
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp('2%'),
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentOptionMobile: {
    padding: 12,
    borderRadius: 10,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: wp('1.8%'),
    color: COLORS.textHeader,
    marginLeft: wp('2%'),
    fontFamily: 'Prompt_400Regular',
  },
  paymentOptionTextMobile: {
    fontSize: 14,
    marginLeft: 12,
  },
  
  // Pay Button
  payButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 12,
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginTop: hp('1%'),
  },
  payButtonMobile: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 8,
  },
  payButtonTablet: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  payButtonText: {
    fontSize: wp('2%'),
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: 'Prompt_400Regular',
  },
  payButtonTextMobile: {
    fontSize: 16,
  },
      
  // Modal Styles - Modern & Responsive
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
    }),
  },
  modalContainerMobile: {
    maxWidth: '100%',
    borderRadius: 20,
  },
  modalContent: {
    minHeight: 280,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderMobile: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeader,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalTitleMobile: {
    fontSize: 16,
  },
  placeholder: {
    width: 40,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
  },
  modalBodyMobile: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  
  // Processing State
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  spinnerWrapperMobile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.primaryBlue,
    borderTopColor: 'transparent',
  },
  spinnerMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textHeader,
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  processingTextMobile: {
    fontSize: 18,
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    maxWidth: 280,
  },
  processingSubtextMobile: {
    fontSize: 13,
    maxWidth: 260,
  },
  
  // Success State
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconWrapperMobile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  successText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  successTextMobile: {
    fontSize: 20,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    maxWidth: 280,
  },
  successSubtextMobile: {
    fontSize: 13,
    maxWidth: 260,
  },
  
  // Error State
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconWrapperMobile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  errorTextMobile: {
    fontSize: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    maxWidth: 280,
  },
  errorSubtextMobile: {
    fontSize: 13,
    maxWidth: 260,
  },
  
  // Modal Footer
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalFooterMobile: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  retryButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
      },
      default: {
        shadowColor: COLORS.primaryBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  retryButtonMobile: {
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  retryButtonTextMobile: {
    fontSize: 15,
  },
});