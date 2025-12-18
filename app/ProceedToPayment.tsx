import { BASE_URL, RAZOR_PAY_KEY } from "../config";
import { db } from "../firebaseConfig";
import { getAuthData } from "../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";

export default function ProceedToPayment() {
    const [name, setName] = React.useState("");
    const [studentProfilePic, setStudentProfilePic] = React.useState("");   
  const router = useRouter();
  const { amount, teacherEmail, subject,teacherName,teacherProfilePic ,className,selectedTuitions} = useLocalSearchParams();
    console.log("ProceedToPayment params:", {
    amount,
    teacherEmail,
    subject,
    teacherName,
    teacherProfilePic,
    className,
        selectedTuitions
    });
console.log("student",studentProfilePic)
useEffect(() => {
  const fetchDataAndStartPayment = async () => {
    try {
      const nameFromStorage = await AsyncStorage.getItem("studentName");
      const picFromStorage = await AsyncStorage.getItem("profileImage");

      if (!nameFromStorage || !picFromStorage) {
        Alert.alert("Missing Data", "Student name or profile picture is missing.");
        return;
      }

      console.log("Student Name:", nameFromStorage);
      console.log("Student Profile Pic:", picFromStorage);
      setName(nameFromStorage);
      setStudentProfilePic(picFromStorage);

     
      await initiatePayment(nameFromStorage, picFromStorage);
    } catch (err) {
      console.error("Error fetching AsyncStorage data:", err);
      Alert.alert("Error", "Failed to load student data.");
    }
  };

  fetchDataAndStartPayment();
}, []);


  
  const addTeacherToContacts = async (studentEmail:any, teacher:any) => {
    const studentDoc = doc(db, "contacts", studentEmail, "teachers", teacher.email);
    await setDoc(studentDoc, {
      teacherEmail: teacher.email,
      teacherName: teacher.name,
      subject: teacher.subject,
      profilePic: teacher.profilepic,
      addedAt: serverTimestamp(),
    });
  };

  console.log("student",studentProfilePic)
  const initiatePayment = async (name: string, profilePic: string) => {
    console.log("Inside initiatePayment - Student Name:", name);
    console.log("Inside initiatePayment - Student Profile Pic:", profilePic);
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

      const orderRes = await axios.post(
        `${BASE_URL}/api/payments/create-order`,
        {
          amount: parseInt(amount as string),
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        },
        { headers }
      );
      console.log('res order:', orderRes)
      const options = {
        description: `Class booking with ${teacherEmail}`,
        image: "https://your-logo-url.png",
        currency: "INR",
        key: RAZOR_PAY_KEY,
        amount: parseInt(amount as string),
        order_id: orderRes.data.id,
        name: "Tuition Booking",
        prefill: {
          email: auth.email,
          name: auth.name || "Student",
        },
        theme: { color: "#4255FF" },
      };
    
      console.log('inti')
      console.log('optionssss',options)
        console.log("RazorpayCheckout:", RazorpayCheckout); // should NOT be null
      RazorpayCheckout.open(options)
        .then(async (paymentData: any) => {
          console.log('options',options)
          const verifyRes = await axios.post(
            `${BASE_URL}/api/payments/verify-payment`,
            {
              orderId: paymentData.razorpay_order_id,
              paymentId: paymentData.razorpay_payment_id,
              signature: paymentData.razorpay_signature,
              email: auth.email,
              amount: parseInt(amount as string),
              teacher_email: teacherEmail,
            },
            { headers }
          );

          console.log("Payment verification response:", verifyRes.data);
          if (verifyRes.data.success) {
           
            console.log("Adding teacher to contacts for student:", auth.email);
            
           
            console.log("Teacher profilePic:", teacherProfilePic);
            console.log("Student profilePic:", studentProfilePic);

            console.log("Adding tutor for student:", auth.email);
            await axios.post(
                `${BASE_URL}/api/add-tutor`,
                {
                  teacherEmail,
                  studentEmail: auth.email,
                  subject,
                  teacherName,
                  profilePic: teacherProfilePic, 
                  className,
                  studentName: name,
                  studentProfilePic: profilePic,
                },
                { headers }
              );
              
          
            router.replace({
              pathname: "/(tabs)/StudentDashBoard/PaymentSuccess",
              params: {
                teacherEmail: teacherEmail as string,
                subject: subject as string,
              },
            });
          } else {
            Alert.alert("Verification Failed", "Please contact support.");
          }
        })
        .catch((error: any) => {
          if (error?.description) {
              console.log("Error Description:", error)
              Alert.alert("Payment Cancelled", error);
          } else {
              console.log("Error Description:",error)
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
      <ActivityIndicator size="large" color="#4255FF" />
      <Text style={{ marginTop: 10 }}>Initializing Payment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
});
