import { BASE_URL, RAZOR_PAY_KEY } from "../config";
import { db } from "../firebaseConfig";
import { getAuthData } from "../utils/authStorage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    View
} from "react-native";

// Default profile pictures (must match backend defaults)
const DEFAULT_TEACHER_PROFILE_PIC = "https://cdn-icons-png.flaticon.com/512/4140/4140047.png"; // Female teacher avatar
const DEFAULT_STUDENT_PROFILE_PIC = "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"; // Student/child avatar

// Lazily load RazorpayCheckout - returns null on web or if not available
const getRazorpayCheckout = () => {
    if (Platform.OS !== 'web') {
        try {
            return require("react-native-razorpay").default;
        } catch (e) {
            console.log("RazorpayCheckout not available on this platform");
        }
    }
    return null;
};

export default function ProceedToPayment() {
    const [name, setName] = React.useState("");
    const [studentProfilePic, setStudentProfilePic] = React.useState("");
  const router = useRouter();
  const { amount, teacherEmail, subject,teacherName,teacherProfilePic ,className,selectedTuitions, studentName: paramStudentName, studentProfilePic: paramStudentProfilePic, bookingId} = useLocalSearchParams();
    console.log("ProceedToPayment params:", {
    amount,
    teacherEmail,
    subject,
    teacherName,
    teacherProfilePic,
    className,
        selectedTuitions,
        paramStudentName,
        paramStudentProfilePic
    });

// Parse selectedTuitions if it exists
let parsedTuitions = [];
try {
  if (selectedTuitions) {
    parsedTuitions = JSON.parse(selectedTuitions as string);
    console.log("Parsed tuitions:", parsedTuitions);
  }
} catch (error) {
  console.error("Error parsing selectedTuitions:", error);
}

useEffect(() => {
  const fetchDataAndStartPayment = async () => {
    try {
      // Use params if available, otherwise try to get from auth
      const studentNameFromParams = paramStudentName as string;
      const studentPicFromParams = paramStudentProfilePic as string;
      
      let finalName = studentNameFromParams;
      let finalPic = studentPicFromParams;

      if (!finalName || !finalPic) {
        const auth = await getAuthData();
        if (auth) {
          finalName = finalName || auth.name || "Student";
          finalPic = finalPic || auth.profileImage || "";
        }
      }

      if (!finalName) {
        Alert.alert("Missing Data", "Student name is missing.");
        return;
      }

      console.log("Student Name:", finalName);
      console.log("Student Profile Pic:", finalPic);
      setName(finalName);
      setStudentProfilePic(finalPic);

      await initiatePayment(finalName, finalPic);
    } catch (err) {
      console.error("Error fetching student data:", err);
      Alert.alert("Error", "Failed to load student data.");
    }
  };

  fetchDataAndStartPayment();
}, [paramStudentName, paramStudentProfilePic]);


  
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

      // Web platform handling
      if (Platform.OS === 'web') {
        console.log("Web platform - using web Razorpay");
        
        // Load Razorpay script dynamically
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const options = {
            key: RAZOR_PAY_KEY,
            amount: parseInt(amount as string),
            currency: "INR",
            name: "Tuition Booking",
            description: `Class booking with ${teacherEmail}`,
            order_id: orderRes.data.id,
            prefill: {
              name: auth.name || "Student",
              email: auth.email,
            },
            theme: { color: "#4255FF" },
            handler: async (response: any) => {
              console.log("Payment successful:", response);
              try {
                const verifyRes = await axios.post(
                  `${BASE_URL}/api/payments/verify-payment`,
                  {
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    email: auth.email,
                    amount: parseInt(amount as string),
                    teacher_email: teacherEmail,
                  },
                  { headers }
                );

                console.log("Payment verification response:", verifyRes.data);
                if (verifyRes.data.success) {
                  console.log("Adding teacher to contacts for student:", auth.email);

                  // Use default profile pictures if not provided
                  const finalTeacherProfilePic = teacherProfilePic || DEFAULT_TEACHER_PROFILE_PIC;
                  const finalStudentProfilePic = profilePic || DEFAULT_STUDENT_PROFILE_PIC;
                  console.log("Teacher profilePic:", finalTeacherProfilePic);
                  console.log("Student profilePic:", finalStudentProfilePic);

                  // Update booking status to subscribed if bookingId exists
                  if (bookingId) {
                    try {
                      await axios.put(
                        `${BASE_URL}/api/bookings/respond`,
                        {
                          bookingId: bookingId,
                          status: 'subscribed',
                          message: 'Payment completed successfully'
                        },
                        { headers }
                      );
                      console.log("✅ Booking status updated to subscribed");
                    } catch (bookingError) {
                      console.error("Failed to update booking status:", bookingError);
                    }
                  }

                  await axios.post(
                      `${BASE_URL}/api/add-tutor`,
                      {
                        teacherEmail,
                        studentEmail: auth.email,
                        subject,
                        teacherName,
                        profilePic: finalTeacherProfilePic,
                        className,
                        studentName: name,
                        studentProfilePic: finalStudentProfilePic,
                        selectedTuitions: parsedTuitions,
                      },
                      { headers }
                    );

                  // Route to ConnectWeb screen to show paid teacher in chat
                  router.replace({
                    pathname: "/(tabs)/StudentDashBoard/ConnectWeb",
                    params: {
                      teacherEmail: teacherEmail as string,
                      subject: subject as string,
                      bookingId: bookingId as string,
                      selectedTab: 'chats',
                    },
                  });
                } else {
                  Alert.alert("Verification Failed", "Please contact support.");
                }
              } catch (error) {
                console.error("Verification error:", error);
                Alert.alert("Error", "Payment verification failed.");
              }
            },
            modal: {
              ondismiss: () => {
                console.log("Payment modal closed");
                Alert.alert("Cancelled", "Payment process was cancelled.");
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
        return;
      }

      // Native platform handling
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
      const RazorpayCheckout = getRazorpayCheckout();
      console.log("RazorpayCheckout:", RazorpayCheckout);

      if (!RazorpayCheckout) {
        Alert.alert("Error", "Payment gateway not available on this platform.");
        return;
      }

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

            // Use default profile pictures if not provided
            const finalTeacherProfilePic = teacherProfilePic || DEFAULT_TEACHER_PROFILE_PIC;
            const finalStudentProfilePic = profilePic || DEFAULT_STUDENT_PROFILE_PIC;
            console.log("Teacher profilePic:", finalTeacherProfilePic);
            console.log("Student profilePic:", finalStudentProfilePic);

            // Update booking status to subscribed if bookingId exists
            if (bookingId) {
              try {
                await axios.put(
                  `${BASE_URL}/api/bookings/respond`,
                  {
                    bookingId: bookingId,
                    status: 'subscribed',
                    message: 'Payment completed successfully'
                  },
                  { headers }
                );
                console.log("✅ Booking status updated to subscribed");
              } catch (bookingError) {
                console.error("Failed to update booking status:", bookingError);
              }
            }

            console.log("Adding tutor for student:", auth.email);
            await axios.post(
                `${BASE_URL}/api/add-tutor`,
                {
                  teacherEmail,
                  studentEmail: auth.email,
                  subject,
                  teacherName,
                  profilePic: finalTeacherProfilePic,
                  className,
                  studentName: name,
                  studentProfilePic: finalStudentProfilePic,
                  selectedTuitions: parsedTuitions,
                },
                { headers }
              );

            // Route to ConnectWeb screen to show paid teacher in chat
            router.replace({
              pathname: "/(tabs)/StudentDashBoard/ConnectWeb",
              params: {
                teacherEmail: teacherEmail as string,
                subject: subject as string,
                bookingId: bookingId as string,
                selectedTab: 'chats',
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
