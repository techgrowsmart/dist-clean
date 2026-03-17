import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import React from "react";

export default function Congratulations() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Congratulations!</Text>

      <Image 
        source={require("../../../assets/image/cap.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>You have successfully added a class.</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          // Navigate to appropriate dashboard based on user role
          // You might want to get the role from context or storage
          router.replace("/(tabs)/TeacherDashBoard/Teacher");
        }}
      >
        <Text style={styles.buttonText}>Go to homepage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5f5fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: 700,
    marginBottom: 20,
    fontFamily: "Prompt",
    textAlign: "center",
    lineHeight:40,
    
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 32,
    fontFamily: "Sora",
    textAlign: "center",
    fontWeight:700,
    lineHeight:34
  },
  button: {
    backgroundColor: "#f5b726",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Prompt",
  },
});