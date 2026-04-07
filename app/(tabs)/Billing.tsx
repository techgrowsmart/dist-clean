import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthData } from "../../utils/authStorage";

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const determineUserRole = async () => {
      try {
        // Try to get user role from storage first
        const storedRole = await AsyncStorage.getItem("user_role");
        
        if (storedRole) {
          setUserRole(storedRole);
          // Redirect to appropriate billing page
          if (storedRole === "teacher") {
            console.log("👨‍🏫 Redirecting teacher to TeacherBilling");
            router.replace("/(tabs)/TeacherDashBoard/TeacherBilling");
          } else if (storedRole === "student") {
            console.log("👨‍🎓 Redirecting student to StudentBilling");
            router.replace("/(tabs)/StudentDashBoard/StudentBilling");
          } else {
            console.log("❌ Unknown role, defaulting to student");
            router.replace("/(tabs)/StudentDashBoard/StudentBilling");
          }
        } else {
          // If no role stored, try to determine from auth data
          const auth = await getAuthData();
          if (auth?.email) {
            // Check if email suggests teacher role (you can customize this logic)
            if (auth.email.includes("teacher") || auth.email.includes("admin")) {
              setUserRole("teacher");
              router.replace("/(tabs)/TeacherDashBoard/TeacherBilling");
            } else {
              setUserRole("student");
              router.replace("/(tabs)/StudentDashBoard/StudentBilling");
            }
          } else {
            // Default to student if no auth data
            console.log("❌ No auth data, defaulting to student");
            setUserRole("student");
            router.replace("/(tabs)/StudentDashBoard/StudentBilling");
          }
        }
      } catch (error) {
        console.error("❌ Error determining user role:", error);
        // Default to student on error
        setUserRole("student");
        router.replace("/(tabs)/StudentDashBoard/StudentBilling");
      } finally {
        setLoading(false);
      }
    };

    determineUserRole();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B5BFE" />
        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  // This component should never render as it redirects immediately
  return null;
};

export default Billing;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
});
