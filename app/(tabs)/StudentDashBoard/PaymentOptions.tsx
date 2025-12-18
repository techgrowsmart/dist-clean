import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PaymentOptions() {
  const router = useRouter();
  const { total } = useLocalSearchParams();

  const handleSelect = (gateway: string) => {
    Alert.alert("Selected Payment Gateway", `${gateway} selected for ₹${total}`);
  
  };
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Choose a Payment Method</Text>

      <TouchableOpacity style={styles.option} onPress={() => handleSelect("Razorpay")}>
        <Text style={styles.optionText}>💳 Razorpay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => handleSelect("Stripe")}>
        <Text style={styles.optionText}>💸 Stripe</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option} onPress={() => handleSelect("UPI")}>
        <Text style={styles.optionText}>📲 UPI</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  option: {
    backgroundColor: "#e0e7ff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d0c12",
  },
});
