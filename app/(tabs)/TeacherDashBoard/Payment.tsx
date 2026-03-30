import ArrowBack from "../../../assets/svgIcons/ArrowBack";
import CreditCardIcon from "../../../assets/svgIcons/Credicard";
import InternetBanking from "../../../assets/svgIcons/InternetBanking";
import Paypal from "../../../assets/svgIcons/Paypal";
import { BASE_URL, RAZOR_PAY_KEY } from "../../../config";
import { getAuthData } from "../../../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { isTablet } from "../../../utils/devices";
import {Prompt_400Regular, useFonts} from '@expo-google-fonts/prompt'
import { safeBack } from "../../../utils/navigation";
export default function Payment() {
  let [fontsLoaded]=useFonts({
    Prompt_400Regular
  })
  const router = useRouter();
  const {
    selectedState,
    selectedHotspot,
    selectedPlan,
    paymentAmount,
    gst,
    total,
  } = useLocalSearchParams();

  console.log(
    "Payment Details:",
    selectedState,
    selectedHotspot,
    selectedPlan,
    paymentAmount,
    gst,
    total
  );

  const [teacherName,setTeacherName]= React.useState("");

  useEffect(()=>{
    const teachername = async () => {
        const name = await AsyncStorage.getItem("teacherName");

        console.log("Teacher Name....:", name);
        if (name) {
          console.log("Name:", name);
            setTeacherName(name);
          return name;
        } else {
          console.log("No student name found in storage");
          return "Student";
        }
    }
    teachername()
 
},[])
const initiatePayment = async () => {
  try {
    const auth = await getAuthData();
    if (!auth?.token || !auth?.email) {
      Alert.alert("Session Expired", "Please log in again.");
      return;
    }

    console.log("auth details:", auth);

    console.log("Details",auth.email)
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    };

    // Create order
    const orderRes = await axios.post(
      `${BASE_URL}/api/payments/create-order`,
      {
        amount: parseInt(total as string)*100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      },
      { headers }
    );

    const options = {
      description: `Spotlight payment for ${auth.email}`,
      image: "https://your-logo-url.png",
      currency: "INR",
      key: RAZOR_PAY_KEY,
      amount: parseInt(total as string)*100,
      order_id: orderRes.data.id,
      name: "Spotlight Tarrif",
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
            amount: parseInt(total as string)*100,

          },
          { headers }
        );

        console.log("Payment verification response:", verifyRes.data);
        if (verifyRes.data.success) {
  
       
            
          Alert.alert("Payment Successful", "Your payment was successful!");
        
          router.push({
            pathname: "/(tabs)/TeacherDashBoard/Teacher",
            params: { userEmail: auth.email },
          });
        } else {
          Alert.alert("Verification Failed", "Please contact support.");
        }
      })
      .catch((error: any) => {
        if (error?.description) {
          Alert.alert("Payment Cancelled", error.description);
        } else {
          Alert.alert("Cancelled", "Payment process was cancelled.");
        }
      });
  } catch (err) {
    console.error("Payment error:", err);
    Alert.alert("Error", "Something went wrong during payment.");
  }
};



  return (
    <View style={styles.container}>
    {/* Top Bar */}
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => safeBack(router)}>
        <ArrowBack size={wp(isTablet?'5%':'8%')} />
      </TouchableOpacity>
      <Text style={styles.title}>Spotlight Review</Text>
    </View>
  
    {/* Content container with flex layout */}
    <View style={styles.content}>
      {/* Checkout Summary */}
      <View style={styles.checkoutSummary}>
        <Text style={styles.checkoutTitle}>Checkout Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Spotlight Tariff</Text>
          <Text style={styles.amount}>₹{paymentAmount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>IGST </Text>
          <Text style={styles.amount}>18%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}> </Text>
          <Text style={styles.amount}>₹{gst}</Text>
        </View>
        <View style={styles.divider}></View>
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{total}</Text>
        </View>
      </View>
  
      {/* Fills remaining screen */}
      <View style={styles.paymentMode}>
        <Text style={styles.checkoutTitle}>Choose payment method</Text>
        <View style={styles.options}>
          <TouchableOpacity style={styles.item}>
            <CreditCardIcon size={wp(isTablet?'5.1%':'6.4%')} />
            <Text style={styles.itemText}>Credit Card</Text>
          </TouchableOpacity>
  
          <TouchableOpacity style={styles.item}>
            <Paypal size={wp(isTablet?'5.1%':'6.4%')}  />
            <Text style={styles.itemText}>Paypal</Text>
          </TouchableOpacity>
  
          <TouchableOpacity style={styles.item}>
            <InternetBanking size={wp(isTablet?'5.1%':'6.4%')} />
            <Text style={styles.itemText}>Internet Banking</Text>
          </TouchableOpacity>
        </View>
  
        <View style={styles.btnContainer}>
          <TouchableOpacity>
            <Text style={styles.payText}
              onPress={initiatePayment}
            >Pay for Spotlight</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
  
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#5f5fff",
      },
      topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap:wp('5.33%') ,
        marginBottom: hp(isTablet?'1.9%':'2.69%'),
        marginTop: hp('6.729%'),
        paddingHorizontal: wp('5.33%'),
      },
      title: {
        fontSize: wp(isTablet?'3.2%':'5.33%'),
        fontWeight: "600",
        color: "#FFF",
        fontFamily: "Prompt_400Regular",
      },
      content: {
        flex: 1,
        backgroundColor: "#c0c0eb",
        borderTopLeftRadius: wp('5.86%'),
        borderTopRightRadius:  wp('5.86%'),
        overflow: "hidden",
      },
      checkoutSummary: {
        padding: wp(isTablet?'4.2%':'5.33%'),
      },
      checkoutTitle: {
        fontSize: wp(isTablet?'3.2%':'5.33%'),
        lineHeight: hp('3.499%'),
        fontWeight: "bold",
        marginBottom: hp('2.15%'),
        color: "#000",
        fontFamily: "Prompt_400Regular",
      
      },
      divider: {
        height: hp('0.26%'),
        width: "100%",
        backgroundColor: "#FFF",
        marginBottom: hp('2.69%'),
      },
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: hp('1.61%'),
      },
      label: {
        fontSize: wp(isTablet?'2.9%':'4.27%'),
        color: "#333",
        fontFamily: "Prompt_400Regular",
      },
      amount: {
        fontSize:  wp(isTablet?'2.9%':'4.27%'),
        color: "#333",
        fontFamily: "Prompt_400Regular",
      },
      totalLabel: {
        fontSize: wp(isTablet?'4.1%':'5.33%'),
        fontWeight: "500",
        color: "#000",
        fontFamily: "Prompt_400Regular",
      },
      totalAmount: {
        fontSize: wp(isTablet?'4.1%':'5.33%'),
        fontWeight: "500",
        color: "#000",
        fontFamily: "Prompt_400Regular",
      },
      paymentMode: {
        flex: 1,
        backgroundColor: "#FFF",
        borderTopLeftRadius: wp('5.86%'),
        borderTopRightRadius: wp('5.86%'),
        padding: wp(isTablet?'3.5%':'5.33%'),
        justifyContent: "space-between",
        marginTop:hp(isTablet?'1.1%':'2.69%')
      },
      options: {
        marginBottom:40,
        gap: wp(isTablet?'4.5%':'6.66%'),
      },
      item: {
        flexDirection: "row",
        alignItems: "center",
        gap: wp('3.2%'),
        padding: wp(isTablet?'2.1%':'4.27%'),
        borderRadius: wp('2.667%'),
        borderWidth: wp('0.22%'),
        borderColor: "#ccc",
        backgroundColor: "#f4f4f4",
      },
      itemText: {
        fontSize: wp(isTablet?'3.2%':'4.27%'),
        color: "#000",
        fontFamily: "Prompt_400Regular",
      },
      btnContainer: {
        width: "100%",
        paddingVertical: hp('1.884%'),
        backgroundColor: "#5f5fff",
        borderRadius: wp('2.667%'),
        alignItems: "center",
        justifyContent: "center",
        marginBottom:40
      },
      payText: {
        color: "#fff",
        fontSize: wp(isTablet?'3.2%':'4.27%'),
        fontWeight: "600",
        fontFamily: "Prompt_400Regular",
      },
      
  
});
